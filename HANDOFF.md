# Local handoff: MiniDayZ Android customization

Last updated: 2026-08-27 (Asia/Manila)

## Current outcome

This repository contains a customized MiniDayZ 1.5.0 Android build. The browser
game in `docs/` is packaged in a lightweight native WebView shell, supports
modern Android landscape screens, and has a replacement touch-control overlay.

The current debug build succeeds and package `com.jester.minidayz` is installed
and running on the connected Infinix device. The newest native-menu-scenery
change is active as a reversible live patch and is present in the rebuilt APK,
but that APK has not been installed. The renamed package started with fresh
WebView storage. The older `io.github.nextdev65.minidayz` package was not
present after installation.

## Protect the working tree

The customized project was imported at commit `3e3aff2` on `main` and pushed to
the private `BenigJester/Mini-Dayz` origin. The original public repository is
preserved as the `upstream` remote. Do not reset, clean, checkout, or overwrite
new user-led work in the working tree.

Known cleanup item: `README.md` still links to the deleted `survivor.png`, so
that badge is broken. Decide whether to remove the badge or restore an image
before committing.

## Implemented work

### Android packaging and security

- Package/application ID: `com.jester.minidayz`.
- App label: `MiniDayZ`.
- Version: `1.5.0`; version code: `150`.
- Minimum SDK 23; compile/target SDK 36; Java 17.
- Immersive, hardware-accelerated, sensor-landscape WebView shell.
- Game progress remains in persistent WebView storage.
- Release builds use R8 full-mode minification/obfuscation, optimization, and
  resource shrinking. Preserve the private release mapping file if a release
  is distributed.

### Screen compatibility

- Uses Android-reported gesture, waterfall, and rounded-corner geometry to keep
  interactive UI inside safe bounds.
- Camera/display-cutout bounds are deliberately ignored per the user's request.
- The game canvas fills the physical screen; selected HUD/button content is
  repositioned rather than shrinking the whole game into a letterboxed area.
- Achievement text/close control and edge controls receive safe-area handling.
- The clock, settings, and guide buttons move as one group to preserve spacing.
- Construct text is converted from character wrapping to whole-word wrapping.

### Branding/version cleanup

- Visible name is `MiniDayZ`, without the Plus sign or the incorrect title Z.
- Visible version is `1.5.0`, without an MDZ prefix.
- Facebook and Mini DayZ 2 menu displays were removed from the exposed UI.
- The main-menu logo is cleaned at canvas/WebGL upload time to remove the red
  Plus artwork.

Some internal compatibility identifiers still contain `plus`, such as the old
Cordova widget ID, and source localization data still includes strings for
features that are no longer exposed. They are not current display labels; do
not blindly rename internal IDs without checking save/package compatibility.

### Modern controls and HUD

- Approved circular assets are used for fist attack, gun attack, pickup, open
  trunk, switch item, reload, and scope/target lock.
- Default placement is the user-approved right-side control layout.
- The settings option formerly called `Stick position` now reads `Controls`.
- The in-game Movement row is removed. Resume takes its place, and the
  Construct `GUI_control_type` variable is continuously held at stick mode so
  legacy tap-mode saves cannot restore tap movement. This build is installed
  and verified on the connected device.
- The control customization view supports dragging attack, interact, switch,
  reload, and scope/target lock, then saving positions in WebView `localStorage` under
  `minidayz.custom-control-positions.v2`.
- The modern customization preview renders after the editor's darkening
  overlay, while gameplay controls remain at the back of `GUI_controls`.
  Drag, Reset, Save/exit, reopen, and persisted positions were verified, and
  the render-order fix is installed on the device.
- Modern button feedback now snaps to its pressed state on the first rendered
  frame without press easing or a slow hold pulse. Its release rebound is 32
  ms. This newest feedback build is installed and running on the device.
- Attack is kept available during active gameplay, including bare-hand/melee
  mode. Reload is shown for gun mode.
- Attack mutates between fist and firearm visuals. Interact mutates between
  pickup and open-trunk visuals.
- A larger equipped-weapon HUD and visible loaded/reserve ammo readout are
  drawn in the supplied two-panel holder immediately after the portrait on
  the same Construct `GUI` layer. It stays persistent whenever the avatar card
  is visible.
- When no firearm is selected, the weapon pane now shows the same translucent
  empty-rifle silhouette used by the inventory, and the ammo pane shows a
  subdued infinity symbol. Equipped firearms still replace both placeholders
  with their weapon art and live loaded/reserve ammunition counts.
- Modern controls and all three movement-stick pieces render at the back of
  Construct's `GUI_controls` layer. They can appear as soon as the stick does,
  while higher loading/fade layers still cover them naturally.
- Original Construct control sprite images are fully transparent to prevent
  them flashing during startup or pause. Their original dimensions and runtime
  instances remain intact for hit testing and Construct event logic.
- The main-menu terrain now uses the game's untouched native level-one ground
  atlas instead of recoloring level-five snow. The menu's winter rock and stump
  cells are replaced with shape-compatible non-winter cells copied from the
  same native environment atlas, so the composition keeps MiniDayZ's original
  pixel art and palette. Both original atlases are restored as soon as Menu
  closes, so gameplay terrain is not changed.

The game exposes three quick-switch categories: melee/bare hands, pistol, and
two-handed firearm. Each category holds one equipped weapon at a time.

## Important files

- Project-local workflow skill: `$minidayz-live-runtime`, stored at
  `.agents/skills/minidayz-live-runtime`. It captures the
  screen-first ADB/CDP hot-patching workflow, Construct runtime landmarks,
  conditional-state verification, package-migration/install checks, safe
  PowerShell screen capture, tilemap cache invalidation, source persistence,
  and the no-install default. Its `scripts/webview-cdp-eval.mjs` helper
  evaluates piped JavaScript directly in the running WebView without rewriting
  the CDP connection setup.
- `app/src/main/java/com/jester/minidayz/MainActivity.java` — WebView,
  immersive mode, hardware inset collection, and Android lifecycle handling.
- `app/build.gradle` — SDK/version/build types and `docs/` asset packaging.
- `app/proguard-rules.pro` — release obfuscation rules.
- `docs/game-ui-compatibility.js` — edge HUD layout, custom controls, control
  visibility/state mutation, native Construct-layer drawing, weapon HUD, and
  ammo display.
- `docs/screen-compatibility.js` — viewport/canvas resize bridge.
- `docs/text-compatibility.js` — whole-word wrapping compatibility transform.
- `docs/branding-cleanup.js` — runtime removal of the Plus logo artwork.
- `docs/images/modern-controls/` — runtime modern control and HUD images.
- `tools/approved-control-sources/` — the six user-approved source renders.
- `tools/build-control-assets.ps1` — rebuilds runtime assets, removes pixels
  outside circular controls, and clears legacy control artwork.
- `docs/offline.js` — offline cache list/version; currently `1644057385`.

When changing any cached web asset, bump the numeric version in
`docs/offline.js` so browser/service-worker clients do not retain stale files.

## Reproducible build

This shell does not currently define the Android SDK environment variable. Use:

```powershell
$env:ANDROID_HOME = 'C:\Users\benig\AppData\Local\Android\Sdk'
$env:ANDROID_SDK_ROOT = $env:ANDROID_HOME
.\gradlew.bat assembleDebug
```

Last validation on 2026-08-27:

- Result: `BUILD SUCCESSFUL` (3 tasks executed, 29 up to date).
- APK: `app\build\outputs\apk\debug\app-debug.apk`.
- Size: 25,022,737 bytes (23.86 MiB).
- SHA-256:
  `94F131FE7FBE357308610ECC95529AB6616A4927F7AB0C1886A82A82098CF318`.
- Only Gradle deprecation warnings were reported.

Release build command:

```powershell
$env:ANDROID_HOME = 'C:\Users\benig\AppData\Local\Android\Sdk'
$env:ANDROID_SDK_ROOT = $env:ANDROID_HOME
.\gradlew.bat assembleRelease
```

The unsigned release APK and obfuscation mapping are written below
`app\build\outputs\`.

## Connected device and installation

- Device: Infinix X6873.
- ADB serial:
  `adb-143382554V110204-i5F3gb._adb-tls-connect._tcp`.
- ADB executable:
  `C:\Users\benig\AppData\Local\Android\Sdk\platform-tools\adb.exe`.
- Last observed `com.jester.minidayz` PID: `20637` (ephemeral; query it again
  before debugging).
- The older `io.github.nextdev65.minidayz` package was not present after the
  renamed build was installed.

Install the current debug APK without clearing game data:

```powershell
$adb = 'C:\Users\benig\AppData\Local\Android\Sdk\platform-tools\adb.exe'
$serial = 'adb-143382554V110204-i5F3gb._adb-tls-connect._tcp'
& $adb -s $serial install -r 'app\build\outputs\apk\debug\app-debug.apk'
```

To start a clean log capture, clear immediately before reproducing an issue:

```powershell
& $adb -s $serial logcat -c
```

Logcat was cleared before the previous user test, but the running app may have
emitted new logs since then; do not assume it is still empty.

## Live Construct runtime notes

The running WebView can be inspected through Chrome DevTools Protocol:

1. Query the current PID with `adb shell pidof com.jester.minidayz`.
2. Forward a local port to `webview_devtools_remote_<PID>`.
3. Open `http://127.0.0.1:9222/json` and use the returned WebSocket URL.
4. Evaluate against `cr_getC2Runtime()`.

Useful obfuscated runtime details found during the last session:

- Runtime type instances are held in each type's `.q` array.
- Construct instance variables are held in `.cc`.
- Construct event/global variables are exposed in `runtime.tD`; each entry has
  a readable `.name` and its current value in `.data`. The movement setting is
  `GUI_control_type`, where `0` is tap, `1` is stick, and `2` is WASD.
- Runtime patches can be prototyped safely through Chrome DevTools Protocol,
  then implemented in the requestAnimationFrame compatibility loop. Reapplying
  the intended state there is useful when original Construct events can reset
  visibility, position, or global-variable values on later ticks.
- The in-game settings planks are exposed through family `t1052` and their text
  through `t1053`. The Movement row is hidden and moved offscreen to remove its
  touch target, while Resume is moved into its former Y position. The source
  implementation is `forceStickMovement()` plus `removeMovementSetting()` in
  `docs/game-ui-compatibility.js`.
- `runtime.types.t1.ve[0]` is the 167-by-55 translucent empty-rifle frame from
  `gui_firearm-sheet0.png`, used by the inventory's two-handed firearm slot.
  The HUD source uses that exact frame when `findEquippedWeapon()` returns no
  firearm; `drawEmptyAmmoIndicator()` draws the companion infinity mark.
- Player type is `t181`.
- `c2_callFunction("Spawn_drop", [itemId, x, y, -1, -1, -1])` spawns a
  ground item near the player.
- Item display name was observed at `cc[10]`; item ID at `cc[16]`.

As the last live action, the empty-rifle and infinity placeholders were
hot-prototyped in the running WebView by temporarily wrapping the HUD canvas's
`drawImage`. The wrapper must check the active quick-switch category and
equipped `player_weapons` instance before drawing: an earlier unconditional
version leaked the placeholder rifle and infinity mark beneath an equipped
Mosin. The corrected live wrapper now mirrors `findEquippedWeapon()`; both the
empty state and equipped Mosin state were visually verified. This runtime-only
prototype disappears on WebView/app reload; the durable implementation was
already conditional in `docs/game-ui-compatibility.js`. No APK containing this
change was installed.

The first main-menu scenery revision generated a green-palette copy of
`runtime.types.t980.N` (`ground_lvl5_tilemap.png`). Device review showed that
this still looked like recolored snow because the Menu layout also selects
winter prop cells from the shared environment tilemap.

The replacement uses only native game artwork. `runtime.types.t482.N` is the
level-one `ground_lvl1_tilemap.png` atlas and is index-compatible with Menu's
`runtime.types.t980` ground layout. `runtime.types.t230` is the 5-column,
30-pixel-cell `ground_enviroment_tilemap.png` atlas. Menu uses winter rock/stump
indices 56-58, 67-68, 72, and 75-78; the compatibility code copies matching
non-winter cells 5, 0, 1, 0, 10, 14, 5, 6, 0, and 10 into those slots in an
in-memory atlas. No pixels are recolored. Both tilemap types call `Nr()` only
when their selected image changes, and their original images are restored
outside Menu. Fresh-WebView initialization still requires nonzero image
dimensions and remains retryable.

This native composition is active on the connected device as a runtime-only
prototype and was visually verified across multiple moving-menu camera views.
The prototype disappears on WebView/app reload. The durable implementation is
`updateMenuScenery()`, `createNativeMenuEnvironment()`, and
`applyTilemapImage()` in `docs/game-ui-compatibility.js`. A corrected APK was
built successfully but was not installed, following the user's no-install
preference. The earlier installed build was also verified to keep forcing
`GUI_control_type` from `0` back to stick mode `1`.

## Suggested next action

Continue with user-led device testing. If a visual/control defect is reported,
clear logcat immediately before reproducing it, capture the current gameplay
screen and logs, and modify `docs/game-ui-compatibility.js` or the approved
assets without changing the accepted movement-stick behavior. Rebuild only
when useful. The user's current preference is no device installation unless
they explicitly ask for installation/device testing.
