# MiniDayZ

###### The Browser (and PC) port of Bohemia Interactive's mobile game

[![Survivor](./survivor.png)](https://nextdev56.github.io/MiniDayZ/)

## Notes
* Current customized build is **1.5.0**
* You can change controls from stick to tap/draw (better for PC)
* Try to F11/Fullscreen before the game loads

## Android app

This fork includes a lightweight Android WebView shell for the touch-enabled
game build in `docs/`. It targets Android 16 (API 36), runs in immersive
landscape mode, and stores game progress in the app's persistent WebView data.

Build a debug APK with Android SDK 36 and JDK 17 or newer:

```powershell
.\gradlew.bat assembleDebug
```

Production builds enable R8 full-mode code obfuscation, optimization, and
resource shrinking. Build an unsigned release APK with:

```powershell
.\gradlew.bat assembleRelease
```

The obfuscation mapping is written to
`app\build\outputs\mapping\release\mapping.txt`; retain that private file for
decoding production crash reports.

Install it on a connected ADB device:

```powershell
adb install -r app\build\outputs\apk\debug\app-debug.apk
```

The Android application ID is `com.jester.minidayz`, so it can coexist
with older MiniDayZ packages.

___
## [Original 1.4.1](https://raw.githack.com/NextDev65/MiniDayZ/main/original_docs/index.html) by [Bohemia Interactive](https://minidayz.com/home)
  * https://minidayz.com/blog/mini-dayz-browser-version-will-no-longer-be-supported (bohemia stopped hosting)
## Mods
  * ### [Reloaded 1.1](https://raw.githack.com/NextDev65/MiniDayZ/main/reloaded_docs/index.html) by [Kev3232](https://discord.gg/CSktjeQWtC)
  * ### [Plus 1.2](https://nextdev65.github.io/MiniDayZ/) by [Altero](https://discord.gg/CSktjeQWtC)
    * Exported to apk by [meterpreter](https://github.com/MeterPreter57/)
