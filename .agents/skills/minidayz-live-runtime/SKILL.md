---
name: minidayz-live-runtime
description: Inspect, diagnose, and hot-patch the MiniDayZ Android Construct 2 WebView while preserving the current save and dirty working tree. Use for requests about the current device screen, controls editor, HUD, settings, weapon card, or other live MiniDayZ UI/runtime behavior; persist approved fixes in the repository and document discoveries in HANDOFF.md.
---

# MiniDayZ Live Runtime

Use the running game as evidence, prototype reversible changes through Chrome DevTools Protocol (CDP), then make the durable source match the verified behavior.

## Start from the project state

- Work from the MiniDayZ repository root and read `HANDOFF.md` before acting. Re-read it whenever context is compacted or the request refers to earlier work.
- Preserve the dirty working tree. Do not reset, clean, checkout, or overwrite unrelated changes.
- Treat device installation as separate authorization. The standing preference is no install unless the user explicitly asks for installation or device testing.
- A CDP hot patch changes only the running WebView and disappears on app/WebView reload. Say this clearly and persist accepted behavior in source.

## Inspect before changing

1. Get the current ADB path, serial, package, and relevant runtime notes from `HANDOFF.md`. Re-query the PID because it is ephemeral.
2. Capture the current screen before diagnosing. Store temporary captures below `build/temporary-screen-captures/` so they do not pollute the working tree.
3. Inspect the image at original detail. Diagnose from the visible state and runtime values rather than assuming the previous screen is still active.
4. For runtime inspection, pipe a JavaScript expression to `scripts/webview-cdp-eval.mjs`, resolving the script path relative to this skill directory. The helper discovers the current PID, creates the ADB forward, connects to the page, evaluates the expression, and returns its value.

PowerShell pattern:

```powershell
$runtimeProbe = @'
JSON.stringify((() => {
  const runtime = cr_getC2Runtime();
  return { layout: runtime.wa && runtime.wa.name };
})())
'@
$runtimeProbe | node <skill-dir>\scripts\webview-cdp-eval.mjs --adb $adb --serial $serial
```

Use `--file <path>` when the probe is substantial. Run the helper with `--help` for all options.

## Construct runtime landmarks

- `cr_getC2Runtime()` returns the Construct runtime.
- Concrete and family type instances are in `runtime.types.tN.q`; family types repeat concrete instances, so skip `type.R` when scanning all types.
- Instance variables are in `.cc`. The instance layer is `.C`; `.C.name` is the layer name, not the object type name.
- Global/event variables are in `runtime.tD`, with readable `.name` and current `.data`.
- Type frames are commonly in `.ve`; an instance's current frame is `.mc`. Frame image/crop fields are `.N`, `.Wj`, `.Xj`, `.width`, and `.height`.
- Call `.P()` after changing a Construct instance's position, size, or visibility when the renderer needs its bounds refreshed.
- Known project anchors include player `t181`, settings plank/text families `t1052`/`t1053`, and the inventory empty-rifle frame `runtime.types.t1.ve[0]`. Prefer discovery and validation over assuming an obfuscated index is permanent.

Record newly verified mappings in `HANDOFF.md`, including the screen/state where they were observed.

## Prototype safely

- Namespace runtime-only state under a distinctive `window.__minidayz...` property.
- Make patches idempotent and reversible. When wrapping a prototype or renderer method, preserve the original function and avoid stacking wrappers.
- Scope hooks by exact canvas dimensions, asset source, layer, anchor instance, or runtime state. Broad draw/input hooks are likely to affect unrelated UI.
- Mirror the durable condition, not merely the current screenshot. Check both sides of the state transition: empty/equipped, gameplay/editor, pressed/released, open/closed, as applicable.
- Do not leave placeholder artwork unconditional. The weapon HUD, for example, must draw the empty rifle and infinity only when no firearm is equipped; otherwise it ghosts beneath the real weapon and ammo count.
- Reapply state in the compatibility requestAnimationFrame loop only when original Construct events can reset it on later ticks.

## Persist and verify

- Put durable UI/runtime behavior in `docs/game-ui-compatibility.js` unless the existing architecture points elsewhere.
- Use existing game frames/assets when the request says "like the inventory" or references another in-game visual.
- Bump the numeric version in `docs/offline.js` whenever a cached web asset changes.
- Update `HANDOFF.md` with the outcome, runtime discoveries, validation, whether a hot patch remains active, and whether an APK was installed.
- Run `node --check docs/game-ui-compatibility.js` and `git diff --check` after JavaScript changes.
- Build with the repository's documented Gradle command when useful, record the APK size/hash, and do not install it without an explicit request.
- Finish with a fresh device screenshot and, when behavior is conditional, verify every materially different state. Report the visible result first.
