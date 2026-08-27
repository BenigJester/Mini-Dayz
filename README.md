# MiniDayZ for Android

<p align="center">
  <img src="media/minidayz-android-icon.png" alt="MiniDayZ survivor icon" width="144">
</p>

<p align="center">
  A touch-first, offline Android edition of the classic browser survival game.
</p>

<p align="center">
  <a href="https://github.com/BenigJester/Mini-Dayz/releases/latest"><strong>Download the latest APK</strong></a>
  &nbsp;&middot;&nbsp;
  <a href="#building-from-source">Build from source</a>
</p>

## About this edition

This fork packages the browser game in a lightweight native Android WebView shell and refines it for modern landscape devices. The game runs locally from the bundled assets, keeps progress in persistent WebView storage, and does not require a continuous network connection.

Version 1.5.0 includes:

- Immersive, edge-to-edge landscape gameplay.
- Safe-area handling for gesture navigation, rounded corners, and waterfall displays.
- Modern touch controls with movable combat and interaction buttons.
- A persistent weapon panel with equipped-weapon and ammunition information.
- Cleaner MiniDayZ branding and native non-winter menu scenery.
- Forced stick movement for consistent mobile controls.
- Whole-word text wrapping and other small-screen readability improvements.
- Android game classification for compatible system game modes.

## Install

1. Open the [latest release](https://github.com/BenigJester/Mini-Dayz/releases/latest).
2. Download `MiniDayZ-1.5.0-release.apk`.
3. Allow installation from your browser or file manager when Android prompts you.
4. Install the APK and launch **MiniDayZ**.

The application uses package name `com.jester.minidayz`, requires Android 6.0 or newer, and is designed for landscape play.

> [!CAUTION]
> Android cannot update an APK signed by a different certificate. If you previously installed a debug or third-party build with the same package name, uninstalling it may be required and can remove its local save data.

## Release integrity

| Property | MiniDayZ 1.5.0 |
| --- | --- |
| Package | `com.jester.minidayz` |
| Version code | `150` |
| Minimum Android | 6.0 / API 23 |
| Target Android | 16 / API 36 |
| APK size | 24,534,552 bytes |
| APK SHA-256 | `A0C67D4248A2ECA82CC383BEDAD0E37065BD5FA3A965DAE59351EB722D9EBEE4` |
| Signing certificate SHA-256 | `AA65ABF5EB089BFD92E3138A9BFA0D6BA8E0F875FF0B26E295AF656D67CCDA29` |

The release APK is zip-aligned and verifies with Android APK Signature Schemes v1 and v2.

## Building from source

Requirements:

- JDK 17 or newer.
- Android SDK 36.

Build a debug APK:

```powershell
.\gradlew.bat assembleDebug
```

Build an optimized release APK:

```powershell
.\gradlew.bat assembleRelease
```

Release builds enable R8 full-mode optimization, obfuscation, and resource shrinking. Without a local `keystore.properties`, Gradle produces an unsigned release. Signing credentials, generated APKs, and R8 mapping files are intentionally excluded from Git.

## Project layout

- `app/` - native Android WebView shell and Android resources.
- `docs/` - customized touch-enabled game build bundled into the APK.
- `original_docs/` - preserved original browser build.
- `reloaded_docs/` - preserved Reloaded variant.
- `tools/` - asset preparation utilities and approved control sources.

## Credits and attribution

MiniDayZ was created by [Bohemia Interactive](https://www.bohemia.net/). This fan-made preservation and Android-packaging project is not affiliated with or endorsed by Bohemia Interactive.

This repository builds on the browser preservation work in [NextDev65/MiniDayZ](https://github.com/NextDev65/MiniDayZ), including community contributions associated with MiniDayZ Reloaded and MiniDayZ Plus. All game names, artwork, and other original game assets remain the property of their respective owners.

Bohemia Interactive's notice about the retired browser version is preserved here: [Mini DayZ browser version will no longer be supported](https://minidayz.com/blog/mini-dayz-browser-version-will-no-longer-be-supported).
