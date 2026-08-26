#!/usr/bin/env node

import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";

const options = parseArguments(process.argv.slice(2));

if (options.help) {
  printHelp();
  process.exit(0);
}

const packageName = options.package || "com.jester.minidayz";
const port = Number(options.port || 9222);

if (!Number.isInteger(port) || port < 1 || port > 65535) {
  fail("--port must be an integer from 1 through 65535.");
}

const expression = await readExpression(options);
const adbPath = findAdb(options.adb);
const serial = options.serial || discoverSingleDevice(adbPath);

runAdb(adbPath, serial, ["get-state"]);
const pidOutput = runAdb(
  adbPath,
  serial,
  ["shell", "pidof", packageName],
  true,
).trim();
const pid = pidOutput.split(/\s+/)[0];

if (!pid) {
  fail(`No running process found for ${packageName}.`);
}

runAdb(adbPath, serial, ["forward", "--remove", `tcp:${port}`], true);
runAdb(adbPath, serial, [
  "forward",
  `tcp:${port}`,
  `localabstract:webview_devtools_remote_${pid}`,
]);

const targets = await fetchJsonWithRetry(`http://127.0.0.1:${port}/json`);
const target = targets.find((entry) =>
  entry.type === "page" && entry.webSocketDebuggerUrl
) || targets.find((entry) => entry.webSocketDebuggerUrl);

if (!target) {
  fail("The WebView DevTools endpoint did not expose a debuggable page.");
}

const result = await evaluate(target.webSocketDebuggerUrl, expression);
printResult(result);

function parseArguments(argumentsList) {
  const parsed = {};
  for (let index = 0; index < argumentsList.length; index += 1) {
    const argument = argumentsList[index];
    if (argument === "--help" || argument === "-h") {
      parsed.help = true;
      continue;
    }
    if (!argument.startsWith("--")) {
      fail(`Unexpected argument: ${argument}`);
    }
    const key = argument.slice(2);
    const value = argumentsList[index + 1];
    if (!value || value.startsWith("--")) {
      fail(`Missing value for ${argument}.`);
    }
    parsed[key] = value;
    index += 1;
  }
  return parsed;
}

async function readExpression(parsed) {
  if (parsed.expression) {
    return parsed.expression;
  }
  if (parsed.file) {
    return readFile(path.resolve(parsed.file), "utf8");
  }
  if (process.stdin.isTTY) {
    fail("Provide JavaScript through stdin, --expression, or --file.");
  }

  const chunks = [];
  for await (const chunk of process.stdin) {
    chunks.push(chunk);
  }
  const input = Buffer.concat(chunks).toString("utf8").trim();
  if (!input) {
    fail("The JavaScript expression was empty.");
  }
  return input;
}

function findAdb(explicitPath) {
  if (explicitPath) {
    return explicitPath;
  }

  const executable = process.platform === "win32" ? "adb.exe" : "adb";
  const sdkRoots = [process.env.ANDROID_SDK_ROOT, process.env.ANDROID_HOME]
    .filter(Boolean);
  if (process.platform === "win32" && process.env.LOCALAPPDATA) {
    sdkRoots.push(path.join(process.env.LOCALAPPDATA, "Android", "Sdk"));
  }

  for (const root of sdkRoots) {
    const candidate = path.join(root, "platform-tools", executable);
    if (existsSync(candidate)) {
      return candidate;
    }
  }
  return "adb";
}

function discoverSingleDevice(adbPath) {
  const output = runAdb(adbPath, null, ["devices"]);
  const devices = output.split(/\r?\n/)
    .slice(1)
    .map((line) => line.trim().split(/\s+/))
    .filter((parts) => parts.length >= 2 && parts[1] === "device")
    .map((parts) => parts[0]);

  if (devices.length !== 1) {
    fail(`Expected one connected device, found ${devices.length}; pass --serial.`);
  }
  return devices[0];
}

function runAdb(adbPath, serial, adbArguments, allowFailure = false) {
  const fullArguments = serial ? ["-s", serial, ...adbArguments] : adbArguments;
  const result = spawnSync(adbPath, fullArguments, {
    encoding: "utf8",
    windowsHide: true,
  });

  if (result.error && !allowFailure) {
    fail(`Unable to run ADB: ${result.error.message}`);
  }
  if (result.status !== 0 && !allowFailure) {
    const detail = (result.stderr || result.stdout || "").trim();
    const command = [adbPath, ...fullArguments].join(" ");
    fail(detail || `ADB exited with status ${result.status}: ${command}`);
  }
  return result.stdout || "";
}

async function fetchJsonWithRetry(url) {
  let lastError;
  for (let attempt = 0; attempt < 10; attempt += 1) {
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      lastError = error;
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
  }
  fail(`Unable to read ${url}: ${lastError && lastError.message}`);
}

async function evaluate(webSocketUrl, expressionText) {
  const socket = new WebSocket(webSocketUrl);
  await new Promise((resolve, reject) => {
    const timeout = setTimeout(
      () => reject(new Error("Timed out opening the DevTools WebSocket.")),
      10000,
    );
    socket.addEventListener("open", () => {
      clearTimeout(timeout);
      resolve();
    }, { once: true });
    socket.addEventListener("error", () => {
      clearTimeout(timeout);
      reject(new Error("Failed to open the DevTools WebSocket."));
    }, { once: true });
  });

  const response = await new Promise((resolve, reject) => {
    const id = 1;
    const timeout = setTimeout(
      () => reject(new Error("Timed out waiting for Runtime.evaluate.")),
      15000,
    );
    socket.addEventListener("message", (event) => {
      const message = JSON.parse(String(event.data));
      if (message.id !== id) {
        return;
      }
      clearTimeout(timeout);
      resolve(message);
    });
    socket.send(JSON.stringify({
      id,
      method: "Runtime.evaluate",
      params: {
        expression: expressionText,
        awaitPromise: true,
        returnByValue: true,
        userGesture: true,
      },
    }));
  });
  socket.close();

  if (response.error) {
    fail(response.error.message || "Runtime.evaluate failed.");
  }
  if (response.result && response.result.exceptionDetails) {
    const details = response.result.exceptionDetails;
    fail(details.exception && details.exception.description
      || details.text
      || "The expression threw an exception.");
  }
  return response.result && response.result.result;
}

function printResult(remoteObject) {
  if (!remoteObject) {
    process.stdout.write("undefined\n");
    return;
  }
  if (Object.prototype.hasOwnProperty.call(remoteObject, "value")) {
    const value = remoteObject.value;
    process.stdout.write(typeof value === "string"
      ? `${value}\n`
      : `${JSON.stringify(value, null, 2)}\n`);
    return;
  }
  process.stdout.write(`${remoteObject.unserializableValue
    || remoteObject.description
    || remoteObject.type}\n`);
}

function printHelp() {
  process.stdout.write("Usage: webview-cdp-eval.mjs [options]\n\n");
  process.stdout.write("Read a JavaScript expression from stdin and evaluate it in the running MiniDayZ WebView.\n\n");
  process.stdout.write("Options:\n");
  process.stdout.write("  --adb <path>          ADB executable (auto-detected by default)\n");
  process.stdout.write("  --serial <serial>     Device serial (auto-detected when exactly one is connected)\n");
  process.stdout.write("  --package <name>      Android package (default: com.jester.minidayz)\n");
  process.stdout.write("  --port <number>       Local DevTools forwarding port (default: 9222)\n");
  process.stdout.write("  --expression <code>   Evaluate inline code instead of stdin\n");
  process.stdout.write("  --file <path>         Evaluate code read from a file\n");
  process.stdout.write("  --help                Show this help\n");
}

function fail(message) {
  process.stderr.write(`${message}\n`);
  process.exit(1);
}
