(function () {
    "use strict";

    // These are the root sprites for controls anchored to the four edges of the
    // Construct viewport. Pinned labels and decorations follow their root.
    var GAME_CONTROL_TYPES = [
        497, // inventory
        505, // attack
        509, // switch item
        512, // interact
        522, // reload
        568, // builder controls
        602, // perks
        642, // flare button
        736, // talk
        739, // portrait
        740, // character select
        798, // zoom
        803, 804, 805, 806, 807, // vehicle controls
        922, // vehicle fire
        945  // alternate attack
    ];

    // The clock, settings button, and guide button form one vertical stack in
    // the original layout. Moving any of them separately collapses its top
    // anchor to the same safe-area coordinate and makes the controls overlap.
    var TIME_SETTINGS_GUIDE_GROUP_TYPES = [196, 288, 629];
    var GAMEPLAY_STICK_TYPES = [676, 677, 678];

    // Achievement content that genuinely touches the screen edges. The large
    // frame and scenery stay full bleed; only readable text and the close
    // control are moved into the hardware-safe content area.
    var ACHIEVEMENT_TEXT_TYPES = [363, 364, 371];
    var WINTER_MENU_GROUND_PATH = "images/ground_lvl5_tilemap.png";
    var NATIVE_MENU_GROUND_PATH = "images/ground_lvl1_tilemap.png";
    var MENU_ENVIRONMENT_PATH = "images/ground_enviroment_tilemap.png";
    var ENVIRONMENT_TILE_SIZE = 30;
    var ENVIRONMENT_TILE_COLUMNS = 5;
    // Replace only winter scenery cells with shape-compatible, non-winter
    // cells from the same native atlas. Nothing here is recolored or redrawn.
    var NATIVE_MENU_ENVIRONMENT_TILES = {
        56: 5,
        57: 0,
        58: 1,
        67: 0,
        68: 10,
        72: 14,
        75: 5,
        76: 6,
        77: 0,
        78: 10
    };
    var menuSceneryState = null;
    // v2 discards the stale layout written by the first customization build.
    // That build could save an invisible control at an unintended coordinate.
    var CONTROL_POSITION_STORAGE_KEY = "minidayz.custom-control-positions.v2";
    // GUI-layer units. Keeping the holder independent of portrait animation
    // dimensions prevents it changing size while the player is moving.
    var LOADOUT_HUD_WIDTH = 288;
    var LOADOUT_HUD_HEIGHT = 72;
    var CUSTOM_CONTROL_SLOTS = {
        attack: {
            types: [505, 945],
            defaultPosition: { x: 0.86, y: 0.80 },
            width: 126,
            height: 126,
            hotspotX: 1,
            hotspotY: 0.5
        },
        interact: {
            types: [512],
            defaultPosition: { x: 0.78, y: 0.63 },
            width: 92,
            height: 92,
            hotspotX: 1,
            hotspotY: 0.6
        },
        switchItem: {
            types: [509],
            defaultPosition: { x: 0.88, y: 0.54 },
            width: 92,
            height: 92,
            hotspotX: 1,
            hotspotY: 1
        },
        reload: {
            types: [522],
            defaultPosition: { x: 0.74, y: 0.82 },
            width: 96,
            height: 96,
            hotspotX: 1,
            hotspotY: 0.4
        },
        scope: {
            types: [798],
            defaultPosition: { x: 0.67, y: 0.67 },
            width: 92,
            height: 92,
            hotspotX: 1,
            hotspotY: 0.5
        }
    };
    var CONTROL_ASSET_PATHS = {
        attackFist: "images/modern-controls/attack-fist.png",
        attackGun: "images/modern-controls/attack-gun.png",
        interactPickup: "images/modern-controls/interact-pickup.png",
        interactTrunk: "images/modern-controls/interact-trunk.png",
        switchItem: "images/modern-controls/switch-item.png",
        reloadGun: "images/modern-controls/reload-gun.png",
        scopeLock: "images/modern-controls/scope-lock.png",
        handHud: "images/modern-controls/hand-hud.png",
        loadoutPlate: "images/modern-controls/loadout-plate.png"
    };
    var MAGAZINE_CAPACITY_BY_WEAPON_ID = {
        1: 15,
        2: 5,
        3: 30,
        4: 2,
        5: 30,
        6: 30,
        7: 30,
        8: 10,
        9: 6,
        10: 30,
        11: 5,
        12: 7,
        13: 1,
        14: 1,
        15: 10,
        16: 10,
        17: 7,
        18: 10,
        19: 30,
        20: 17,
        21: 25,
        22: 75,
        23: 30,
        24: 8,
        25: 30,
        26: 64,
        27: 30,
        28: 10,
        29: 5,
        30: 30,
        31: 30,
        32: 2,
        33: 30,
        34: 25
    };
    // The game routes reloads by these item IDs in Game_events. Reserve ammo
    // is stored as ammo objects whose cc[1] is the stack count and cc[2] is
    // the item ID; it is not the weapon's magazine capacity.
    var AMMO_ITEM_ID_BY_WEAPON_ID = {
        1: 12,
        2: 13,
        3: 11,
        4: 17,
        5: 15,
        6: 14,
        7: 15,
        8: 14,
        9: 16,
        10: 11,
        11: 17,
        12: 12,
        13: 51,
        14: 52,
        15: 58,
        16: 58,
        17: 16,
        18: 13,
        19: 69,
        20: 69,
        21: 12,
        22: 14,
        23: 11,
        24: 17,
        25: 11,
        26: 100,
        27: 101,
        28: 101,
        29: 13,
        30: 13,
        31: 15,
        32: 17,
        33: 11,
        34: 12
    };
    var AMMO_TYPE_BY_ITEM_ID = {
        11: 30,
        12: 29,
        13: 31,
        14: 58,
        15: 57,
        16: 59,
        17: 28,
        51: 393,
        52: 396,
        58: 444,
        69: 566,
        100: 137,
        101: 138
    };
    var ACTIVE_WEAPON_TYPE_BY_ID = {
        1: 39,
        2: 44,
        3: 45,
        4: 47,
        5: 52,
        6: 53,
        7: 54,
        8: 55,
        9: 56,
        10: 69,
        11: 70,
        12: 71,
        13: 109,
        14: 110,
        15: 455,
        16: 454,
        17: 456,
        18: 111,
        19: 112,
        20: 113,
        21: 117,
        22: 116,
        23: 115,
        24: 124,
        25: 125,
        26: 133,
        27: 129,
        28: 130,
        29: 131,
        30: 132,
        31: 143,
        32: 146,
        33: 148,
        34: 149
    };
    // Firearms use two separate inventory-card sprites. These IDs are the
    // one-handed weapons shown by gui_pistol; every other firearm ID uses
    // gui_firearm. Reading the game's current card frame gives us the exact
    // clean backpack artwork instead of the white-outlined ground pickup art.
    var PISTOL_WEAPON_IDS = {
        1: true,
        9: true,
        12: true,
        15: true,
        20: true
    };
    var scheduledFrame = 0;
    var savedControlPositions = loadControlPositions();
    var draftControlPositions = cloneControlPositions(savedControlPositions);
    var wasCustomizingControls = false;
    var dragState = null;
    var inputCanvas = null;
    var pressedControlPointers = {};
    var releasedControlAt = {};
    var controlAssets = loadControlAssets();
    var forcedAttackInstances = [];
    var forcedReloadInstances = [];
    var controlRenderAnchor = null;
    var portraitRenderAnchor = null;
    var renderModernControls = false;
    var renderLoadoutHud = false;
    var renderPlayer = null;
    var renderWeaponState = null;
    var hudCanvas = document.createElement("canvas");
    var hudContext = hudCanvas.getContext("2d");
    var hudRectangle = null;
    var textureRenderer = null;
    var controlTextures = {};
    var hudTexture = null;
    var movementControlVariable = null;
    var movementSettingInstances = null;

    hudCanvas.width = 512;
    hudCanvas.height = 128;

    function loadControlAssets() {
        var assets = {};

        Object.keys(CONTROL_ASSET_PATHS).forEach(function (assetName) {
            var asset = new Image();
            asset.decoding = "async";
            asset.src = CONTROL_ASSET_PATHS[assetName];
            assets[assetName] = asset;
        });

        return assets;
    }

    function defaultControlPositions() {
        var positions = {};

        Object.keys(CUSTOM_CONTROL_SLOTS).forEach(function (slotName) {
            var position = CUSTOM_CONTROL_SLOTS[slotName].defaultPosition;
            positions[slotName] = { x: position.x, y: position.y };
        });

        return positions;
    }

    function cloneControlPositions(positions) {
        var clone = {};

        Object.keys(CUSTOM_CONTROL_SLOTS).forEach(function (slotName) {
            clone[slotName] = {
                x: positions[slotName].x,
                y: positions[slotName].y
            };
        });

        return clone;
    }

    function loadControlPositions() {
        var positions = defaultControlPositions();

        try {
            var stored = JSON.parse(window.localStorage.getItem(
                    CONTROL_POSITION_STORAGE_KEY) || "null");
            Object.keys(CUSTOM_CONTROL_SLOTS).forEach(function (slotName) {
                if (stored && stored[slotName]
                        && Number.isFinite(Number(stored[slotName].x))
                        && Number.isFinite(Number(stored[slotName].y))) {
                    positions[slotName].x = Math.max(0, Math.min(
                            1, Number(stored[slotName].x)));
                    positions[slotName].y = Math.max(0, Math.min(
                            1, Number(stored[slotName].y)));
                }
            });
        } catch (error) {
            // A corrupt old preference must never prevent the game from loading.
        }

        return positions;
    }

    function saveControlPositions() {
        try {
            window.localStorage.setItem(
                    CONTROL_POSITION_STORAGE_KEY,
                    JSON.stringify(savedControlPositions));
        } catch (error) {
            // Web storage can be unavailable in privacy-restricted WebViews.
        }
    }

    function approximatelyBetween(value, minimum, maximum) {
        return value >= minimum && value <= maximum;
    }

    function moveInsideHardwareArea(instance, runtime, insets, allowVertical) {
        var layer = instance.C;
        if (!layer || !instance.visible || layer.visible === false) {
            return;
        }

        var viewLeft = Number(layer.Ca);
        var viewTop = Number(layer.Da);
        var viewRight = Number(layer.Ha);
        var viewBottom = Number(layer.Ga);
        var layerScale = Math.abs(Number(layer.scale)) || 1;
        var pixelScale = Math.max(0.01, (runtime.devicePixelRatio || 1) * layerScale);

        if (![viewLeft, viewTop, viewRight, viewBottom].every(Number.isFinite)) {
            return;
        }

        var viewWidth = Math.max(1, viewRight - viewLeft);
        var viewHeight = Math.max(1, viewBottom - viewTop);
        var horizontalZone = Math.min(180, viewWidth * 0.18);
        var verticalZone = Math.min(140, viewHeight * 0.22);
        var offscreenAllowance = Math.max(instance.width || 0, instance.height || 0, 24);
        var safeLeft = insets.left / pixelScale;
        var safeTop = insets.top / pixelScale;
        var safeRight = insets.right / pixelScale;
        var safeBottom = insets.bottom / pixelScale;
        var changed = false;

        if (safeLeft > 0 && approximatelyBetween(
                instance.x, viewLeft - offscreenAllowance, viewLeft + horizontalZone)) {
            var minimumX = viewLeft + safeLeft;
            if (instance.x < minimumX) {
                instance.x = minimumX;
                changed = true;
            }
        } else if (safeRight > 0 && approximatelyBetween(
                instance.x, viewRight - horizontalZone, viewRight + offscreenAllowance)) {
            var maximumX = viewRight - safeRight;
            if (instance.x > maximumX) {
                instance.x = maximumX;
                changed = true;
            }
        }

        if (allowVertical && safeTop > 0 && approximatelyBetween(
                instance.y, viewTop - offscreenAllowance, viewTop + verticalZone)) {
            var minimumY = viewTop + safeTop;
            if (instance.y < minimumY) {
                instance.y = minimumY;
                changed = true;
            }
        } else if (allowVertical && safeBottom > 0 && approximatelyBetween(
                instance.y, viewBottom - verticalZone, viewBottom + offscreenAllowance)) {
            var maximumY = viewBottom - safeBottom;
            if (instance.y > maximumY) {
                instance.y = maximumY;
                changed = true;
            }
        }

        if (changed && typeof instance.P === "function") {
            instance.P();
        }
    }

    function updateType(runtime, typeIndex, insets, allowVertical) {
        var type = runtime.types && runtime.types["t" + typeIndex];
        if (!type || !type.q) {
            return;
        }

        for (var index = 0; index < type.q.length; index += 1) {
            moveInsideHardwareArea(type.q[index], runtime, insets, allowVertical);
        }
    }

    function firstVisibleTypeInstance(runtime, typeIndex) {
        var type = runtime.types && runtime.types["t" + typeIndex];
        if (!type || !type.q) {
            return null;
        }

        for (var index = 0; index < type.q.length; index += 1) {
            var instance = type.q[index];
            if (instance.visible && instance.C && instance.C.visible !== false) {
                return instance;
            }
        }
        return null;
    }

    function alignAchievementOverallStats(runtime) {
        var description = firstVisibleTypeInstance(runtime, 363);
        var labels = firstVisibleTypeInstance(runtime, 364);
        var valuesType = runtime.types && runtime.types.t371;
        if (!description || !labels || !valuesType || !valuesType.q
                || description.C !== labels.C) {
            return;
        }

        // Construct authored the value column exactly one label-box width after
        // the labels. Anchor the whole block to the hardware-safe description
        // edge instead of moving its three text types independently.
        var labelsX = description.x;
        var valuesX = labelsX + Math.abs(Number(labels.width) || 0);
        if (labels.x !== labelsX) {
            labels.x = labelsX;
            if (typeof labels.P === "function") {
                labels.P();
            }
        }

        for (var index = 0; index < valuesType.q.length; index += 1) {
            var value = valuesType.q[index];
            if (!value.visible || value.C !== description.C
                    || value.C.visible === false || value.x === valuesX) {
                continue;
            }
            value.x = valuesX;
            if (typeof value.P === "function") {
                value.P();
            }
        }
    }

    function moveGroupInsideHardwareArea(instances, runtime, insets) {
        if (!instances.length) {
            return;
        }

        var layer = instances[0].C;
        if (!layer) {
            return;
        }

        var viewLeft = Number(layer.Ca);
        var viewTop = Number(layer.Da);
        var viewRight = Number(layer.Ha);
        var viewBottom = Number(layer.Ga);
        var layerScale = Math.abs(Number(layer.scale)) || 1;
        var pixelScale = Math.max(0.01, (runtime.devicePixelRatio || 1) * layerScale);

        if (![viewLeft, viewTop, viewRight, viewBottom].every(Number.isFinite)) {
            return;
        }

        var minimumX = Infinity;
        var minimumY = Infinity;
        var maximumX = -Infinity;
        var maximumY = -Infinity;

        for (var index = 0; index < instances.length; index += 1) {
            minimumX = Math.min(minimumX, instances[index].x);
            minimumY = Math.min(minimumY, instances[index].y);
            maximumX = Math.max(maximumX, instances[index].x);
            maximumY = Math.max(maximumY, instances[index].y);
        }

        var viewWidth = Math.max(1, viewRight - viewLeft);
        var viewHeight = Math.max(1, viewBottom - viewTop);
        var horizontalZone = Math.min(180, viewWidth * 0.18);
        var verticalZone = Math.min(140, viewHeight * 0.22);
        var deltaX = 0;
        var deltaY = 0;

        if (insets.left > 0 && minimumX <= viewLeft + horizontalZone) {
            deltaX = Math.max(0, viewLeft + insets.left / pixelScale - minimumX);
        } else if (insets.right > 0 && maximumX >= viewRight - horizontalZone) {
            deltaX = Math.min(0, viewRight - insets.right / pixelScale - maximumX);
        }

        if (insets.top > 0 && minimumY <= viewTop + verticalZone) {
            deltaY = Math.max(0, viewTop + insets.top / pixelScale - minimumY);
        } else if (insets.bottom > 0 && maximumY >= viewBottom - verticalZone) {
            deltaY = Math.min(0, viewBottom - insets.bottom / pixelScale - maximumY);
        }

        if (!deltaX && !deltaY) {
            return;
        }

        for (var moveIndex = 0; moveIndex < instances.length; moveIndex += 1) {
            instances[moveIndex].x += deltaX;
            instances[moveIndex].y += deltaY;
            if (typeof instances[moveIndex].P === "function") {
                instances[moveIndex].P();
            }
        }
    }

    function updateTimeSettingsGuideGroup(runtime, insets) {
        var instances = [];

        for (var typeIndex = 0;
                typeIndex < TIME_SETTINGS_GUIDE_GROUP_TYPES.length;
                typeIndex += 1) {
            var type = runtime.types
                    && runtime.types["t" + TIME_SETTINGS_GUIDE_GROUP_TYPES[typeIndex]];
            if (!type || !type.q) {
                continue;
            }

            for (var instanceIndex = 0; instanceIndex < type.q.length; instanceIndex += 1) {
                if (type.q[instanceIndex].visible && type.q[instanceIndex].C
                        && type.q[instanceIndex].C.visible !== false) {
                    instances.push(type.q[instanceIndex]);
                }
            }
        }

        moveGroupInsideHardwareArea(instances, runtime, insets);
    }

    function firstVisibleControlInstance(runtime, slot) {
        for (var typeIndex = 0; typeIndex < slot.types.length; typeIndex += 1) {
            var type = runtime.types && runtime.types["t" + slot.types[typeIndex]];
            if (!type || !type.q) {
                continue;
            }

            for (var instanceIndex = 0; instanceIndex < type.q.length; instanceIndex += 1) {
                var instance = type.q[instanceIndex];
                if (instance.visible && instance.C && instance.C.visible !== false) {
                    return instance;
                }
            }
        }

        return null;
    }

    function firstControlInstance(runtime, slot) {
        var fallback = null;
        for (var typeIndex = 0; typeIndex < slot.types.length; typeIndex += 1) {
            var type = runtime.types && runtime.types["t" + slot.types[typeIndex]];
            if (!type || !type.q) {
                continue;
            }

            for (var instanceIndex = 0; instanceIndex < type.q.length; instanceIndex += 1) {
                var instance = type.q[instanceIndex];
                if (!instance.C || instance.C.visible === false) {
                    continue;
                }
                if (instance.visible) {
                    return instance;
                }
                if (!fallback) {
                    fallback = instance;
                }
            }
        }

        return fallback;
    }

    function isControlCustomizationOpen(runtime) {
        var dpadType = runtime.types && runtime.types.t676;
        if (!dpadType || !dpadType.q) {
            return false;
        }

        for (var index = 0; index < dpadType.q.length; index += 1) {
            var instance = dpadType.q[index];
            if (instance.visible && instance.C && instance.C.visible !== false
                    && instance.C.name === "stick_controls") {
                return true;
            }
        }

        return false;
    }

    function isGameplayStickVisible(runtime) {
        var stickType = runtime.types && runtime.types.t676;
        if (!stickType || !stickType.q) {
            return false;
        }

        for (var index = 0; index < stickType.q.length; index += 1) {
            var instance = stickType.q[index];
            if (instance.visible && instance.opacity > 0 && instance.C
                    && instance.C.visible !== false
                    && (instance.C.name === "GUI"
                            || instance.C.name === "GUI_controls")) {
                return true;
            }
        }
        return false;
    }

    function forceStickMovement(runtime) {
        if (!movementControlVariable
                || movementControlVariable.name !== "GUI_control_type") {
            movementControlVariable = null;
            var variables = runtime.tD || [];
            for (var index = 0; index < variables.length; index += 1) {
                if (variables[index]
                        && variables[index].name === "GUI_control_type") {
                    movementControlVariable = variables[index];
                    break;
                }
            }
        }

        if (movementControlVariable) {
            // Construct uses 0 for tap, 1 for stick, and 2 for keyboard/WASD.
            // Keep legacy saves and any stale settings state on stick mode.
            movementControlVariable.data = 1;
        }
    }

    function settingsInstancesAreCurrent(textInstances, plankInstances) {
        return movementSettingInstances
                && textInstances.indexOf(movementSettingInstances.movementText) !== -1
                && textInstances.indexOf(movementSettingInstances.resumeText) !== -1
                && plankInstances.indexOf(movementSettingInstances.movementPlank) !== -1
                && plankInstances.indexOf(movementSettingInstances.resumePlank) !== -1;
    }

    function removeMovementSetting(runtime) {
        var textType = runtime.types && runtime.types.t1053;
        var plankType = runtime.types && runtime.types.t1052;
        var textInstances = textType && textType.q ? textType.q : [];
        var plankInstances = plankType && plankType.q ? plankType.q : [];

        if (!settingsInstancesAreCurrent(textInstances, plankInstances)) {
            movementSettingInstances = null;
            var settingsTexts = textInstances.filter(function (instance) {
                return instance.C && instance.C.name === "GUI_elements";
            }).slice().sort(function (first, second) {
                return first.y - second.y;
            });
            var settingsPlanks = plankInstances.filter(function (instance) {
                return instance.C && instance.C.name === "GUI_elements";
            }).slice().sort(function (first, second) {
                return first.y - second.y;
            });

            // The pause panel has three adjacent rows, followed by Resume after
            // a larger gap. This shape avoids mistaking another four-row menu
            // for the in-game settings panel if the family contents change.
            if (settingsTexts.length === 4 && settingsPlanks.length === 4
                    && settingsTexts[1].y - settingsTexts[0].y >= 50
                    && settingsTexts[1].y - settingsTexts[0].y <= 90
                    && settingsTexts[2].y - settingsTexts[1].y >= 50
                    && settingsTexts[2].y - settingsTexts[1].y <= 90
                    && settingsTexts[3].y - settingsTexts[2].y >= 100) {
                movementSettingInstances = {
                    movementText: settingsTexts[2],
                    resumeText: settingsTexts[3],
                    movementPlank: settingsPlanks[2],
                    resumePlank: settingsPlanks[3],
                    resumeTextY: settingsTexts[2].y,
                    resumePlankY: settingsPlanks[2].y
                };
            }
        }

        if (!movementSettingInstances) {
            return;
        }

        var movementText = movementSettingInstances.movementText;
        var movementPlank = movementSettingInstances.movementPlank;
        var resumeText = movementSettingInstances.resumeText;
        var resumePlank = movementSettingInstances.resumePlank;

        movementText.visible = false;
        movementText.x = -10000;
        movementPlank.visible = false;
        movementPlank.x = -10000;
        resumeText.y = movementSettingInstances.resumeTextY;
        resumePlank.y = movementSettingInstances.resumePlankY;

        [movementText, movementPlank, resumeText, resumePlank]
                .forEach(function (instance) {
                    if (typeof instance.P === "function") {
                        instance.P();
                    }
                });
    }

    function isActiveGameplay(runtime) {
        if (!runtime.wa || (runtime.wa.name !== "Map"
                && runtime.wa.name !== "Tutorial")
                || !isGameplayStickVisible(runtime)) {
            return false;
        }
        return true;
    }

    function rememberInstanceState(states, instance) {
        for (var index = 0; index < states.length; index += 1) {
            if (states[index].instance === instance) {
                return;
            }
        }
        states.push({ instance: instance, visible: instance.visible });
    }

    function restoreInstanceStates(states) {
        for (var index = 0; index < states.length; index += 1) {
            states[index].instance.visible = states[index].visible;
        }
        states.length = 0;
    }

    function keepAttackAvailable(runtime, activeGameplay, customizingControls) {
        if (!activeGameplay && !customizingControls) {
            restoreInstanceStates(forcedAttackInstances);
            return;
        }

        var attackType = runtime.types && runtime.types.t505;
        if (!attackType || !attackType.q) {
            return;
        }

        for (var index = 0; index < attackType.q.length; index += 1) {
            var instance = attackType.q[index];
            if (!instance.C || instance.C.visible === false) {
                continue;
            }
            rememberInstanceState(forcedAttackInstances, instance);
            instance.visible = true;
        }
    }

    function keepReloadAvailable(
            runtime, activeGameplay, gunMode, customizingControls) {
        if (!customizingControls && (!activeGameplay || !gunMode)) {
            restoreInstanceStates(forcedReloadInstances);
            return;
        }

        var reloadType = runtime.types && runtime.types.t522;
        if (!reloadType || !reloadType.q) {
            return;
        }

        for (var index = 0; index < reloadType.q.length; index += 1) {
            var instance = reloadType.q[index];
            if (!instance.C || instance.C.visible === false) {
                continue;
            }
            rememberInstanceState(forcedReloadInstances, instance);
            instance.visible = true;
        }
    }

    function clampPositionForInstance(position, instance, runtime, insets) {
        var layer = instance.C;
        var viewWidth = Math.max(1, Number(layer.Ha) - Number(layer.Ca));
        var viewHeight = Math.max(1, Number(layer.Ga) - Number(layer.Da));
        var canvasWidth = Math.max(1, runtime.canvas.width || 1);
        var canvasHeight = Math.max(1, runtime.canvas.height || 1);
        var halfWidth = Math.abs(instance.width || 0) / (viewWidth * 2);
        var halfHeight = Math.abs(instance.height || 0) / (viewHeight * 2);
        var minimumX = insets.left / canvasWidth + halfWidth;
        var maximumX = 1 - insets.right / canvasWidth - halfWidth;
        var minimumY = insets.top / canvasHeight + halfHeight;
        var maximumY = 1 - insets.bottom / canvasHeight - halfHeight;

        return {
            x: Math.max(minimumX, Math.min(maximumX, position.x)),
            y: Math.max(minimumY, Math.min(maximumY, position.y))
        };
    }

    function applyControlSlot(runtime, insets, slotName, positions) {
        var slot = CUSTOM_CONTROL_SLOTS[slotName];
        var position = positions[slotName];

        for (var typeIndex = 0; typeIndex < slot.types.length; typeIndex += 1) {
            var type = runtime.types && runtime.types["t" + slot.types[typeIndex]];
            if (!type || !type.q) {
                continue;
            }

            for (var instanceIndex = 0; instanceIndex < type.q.length; instanceIndex += 1) {
                var instance = type.q[instanceIndex];
                if (!instance.C) {
                    continue;
                }

                instance.width = slot.width;
                instance.height = slot.height;
                var clamped = clampPositionForInstance(
                        position, instance, runtime, insets);
                var viewLeft = Number(instance.C.Ca);
                var viewTop = Number(instance.C.Da);
                var viewWidth = Number(instance.C.Ha) - viewLeft;
                var viewHeight = Number(instance.C.Ga) - viewTop;

                if (![viewLeft, viewTop, viewWidth, viewHeight].every(Number.isFinite)) {
                    continue;
                }

                instance.x = viewLeft + clamped.x * viewWidth
                        + (slot.hotspotX - 0.5) * instance.width;
                instance.y = viewTop + clamped.y * viewHeight
                        + (slot.hotspotY - 0.5) * instance.height;
                if (typeof instance.P === "function") {
                    instance.P();
                }
            }
        }
    }

    function applyCustomControlPositions(runtime, insets, customizing) {
        var positions = customizing
                ? draftControlPositions
                : savedControlPositions;

        Object.keys(CUSTOM_CONTROL_SLOTS).forEach(function (slotName) {
            applyControlSlot(runtime, insets, slotName, positions);
        });
    }

    function normalizedPointerPosition(event, canvas) {
        var rectangle = canvas.getBoundingClientRect();
        return {
            x: (event.clientX - rectangle.left) / Math.max(1, rectangle.width),
            y: (event.clientY - rectangle.top) / Math.max(1, rectangle.height)
        };
    }

    function isModernControlRendered(runtime, slotName) {
        if (!renderModernControls) {
            return false;
        }
        if (wasCustomizingControls) {
            return true;
        }
        if (slotName === "attack") {
            return !!firstControlInstance(runtime, CUSTOM_CONTROL_SLOTS.attack);
        }
        if (slotName === "reload") {
            return (wasCustomizingControls
                    || !!(renderWeaponState && renderWeaponState.isFirearm))
                    && !!firstControlInstance(runtime, CUSTOM_CONTROL_SLOTS.reload);
        }
        return !!firstVisibleControlInstance(runtime, CUSTOM_CONTROL_SLOTS[slotName]);
    }

    function hitModernControl(runtime, point) {
        var layer = findLayer(runtime, wasCustomizingControls
                ? "stick_controls"
                : "GUI_controls");
        if (!layer) {
            return null;
        }

        var viewWidth = Math.max(1, Number(layer.Ha) - Number(layer.Ca));
        var viewHeight = Math.max(1, Number(layer.Ga) - Number(layer.Da));
        var positions = wasCustomizingControls
                ? draftControlPositions
                : savedControlPositions;
        var closest = null;
        var closestDistance = Infinity;

        Object.keys(CUSTOM_CONTROL_SLOTS).forEach(function (slotName) {
            if (!isModernControlRendered(runtime, slotName)) {
                return;
            }
            var slot = CUSTOM_CONTROL_SLOTS[slotName];
            var position = positions[slotName];
            var halfWidth = slot.width / (viewWidth * 2) + 0.012;
            var halfHeight = slot.height / (viewHeight * 2) + 0.018;
            var deltaX = point.x - position.x;
            var deltaY = point.y - position.y;
            var distance = Math.pow(deltaX / halfWidth, 2)
                    + Math.pow(deltaY / halfHeight, 2);
            if (distance <= 1 && distance < closestDistance) {
                closest = slotName;
                closestDistance = distance;
            }
        });

        return closest;
    }

    function controlPointerKey(event) {
        return event.pointerId === undefined
                ? "mouse"
                : String(event.pointerId);
    }

    function beginControlFeedback(event) {
        var runtime = window.cr_getC2Runtime && window.cr_getC2Runtime();
        if (!runtime || !inputCanvas) {
            return;
        }
        var slotName = hitModernControl(
                runtime, normalizedPointerPosition(event, inputCanvas));
        if (!slotName) {
            return;
        }
        pressedControlPointers[controlPointerKey(event)] = {
            slotName: slotName,
            startedAt: performance.now()
        };
        delete releasedControlAt[slotName];
    }

    function finishControlFeedback(event) {
        var pointerKey = controlPointerKey(event);
        var pressed = pressedControlPointers[pointerKey];
        if (!pressed) {
            return;
        }
        releasedControlAt[pressed.slotName] = performance.now();
        delete pressedControlPointers[pointerKey];
    }

    function clearControlFeedback() {
        var now = performance.now();
        Object.keys(pressedControlPointers).forEach(function (pointerKey) {
            releasedControlAt[pressedControlPointers[pointerKey].slotName] = now;
        });
        pressedControlPointers = {};
    }

    function normalizedInstancePosition(instance) {
        var layer = instance.C;
        return {
            x: (instance.x - Number(layer.Ca))
                    / Math.max(1, Number(layer.Ha) - Number(layer.Ca)),
            y: (instance.y - Number(layer.Da))
                    / Math.max(1, Number(layer.Ga) - Number(layer.Da)),
            halfWidth: Math.abs(instance.width || 0)
                    / (Math.max(1, Number(layer.Ha) - Number(layer.Ca)) * 2),
            halfHeight: Math.abs(instance.height || 0)
                    / (Math.max(1, Number(layer.Ga) - Number(layer.Da)) * 2)
        };
    }

    function normalizedControlCenter(instance, slot) {
        var position = normalizedInstancePosition(instance);
        position.x -= (slot.hotspotX - 0.5) * Math.abs(instance.width || 0)
                / Math.max(1, Number(instance.C.Ha) - Number(instance.C.Ca));
        position.y -= (slot.hotspotY - 0.5) * Math.abs(instance.height || 0)
                / Math.max(1, Number(instance.C.Ga) - Number(instance.C.Da));
        return position;
    }

    function hitCustomControl(runtime, point) {
        var closest = null;
        var closestDistance = Infinity;
        var layer = findLayer(runtime, "stick_controls");

        if (!layer) {
            return null;
        }

        var viewWidth = Math.max(1, Number(layer.Ha) - Number(layer.Ca));
        var viewHeight = Math.max(1, Number(layer.Ga) - Number(layer.Da));

        Object.keys(CUSTOM_CONTROL_SLOTS).forEach(function (slotName) {
            var slot = CUSTOM_CONTROL_SLOTS[slotName];
            var instance = firstVisibleControlInstance(
                    runtime, slot);
            var position = instance
                    ? normalizedControlCenter(instance, slot)
                    : {
                        x: draftControlPositions[slotName].x,
                        y: draftControlPositions[slotName].y,
                        halfWidth: slot.width / (viewWidth * 2),
                        halfHeight: slot.height / (viewHeight * 2)
                    };
            var deltaX = point.x - position.x;
            var deltaY = point.y - position.y;
            var hitWidth = position.halfWidth + 0.015;
            var hitHeight = position.halfHeight + 0.025;
            var distance = Math.pow(deltaX / hitWidth, 2)
                    + Math.pow(deltaY / hitHeight, 2);
            if (distance <= 1 && distance < closestDistance) {
                closestDistance = distance;
                closest = {
                    slotName: slotName,
                    offsetX: deltaX,
                    offsetY: deltaY
                };
            }
        });

        return closest;
    }

    function isPointerOverCustomizationText(runtime, point, expectedText) {
        var textType = runtime.types && runtime.types.t415;
        if (!textType || !textType.q) {
            return false;
        }

        for (var index = 0; index < textType.q.length; index += 1) {
            var instance = textType.q[index];
            if (!instance.visible || !instance.C || instance.C.visible === false
                    || String(instance.text).trim() !== expectedText) {
                continue;
            }

            var position = normalizedInstancePosition(instance);
            if (Math.abs(point.x - position.x) <= position.halfWidth
                    && Math.abs(point.y - position.y) <= position.halfHeight * 1.7) {
                return true;
            }
        }

        return false;
    }

    function beginControlDrag(event) {
        var runtime = window.cr_getC2Runtime && window.cr_getC2Runtime();
        if (!runtime || !isControlCustomizationOpen(runtime)) {
            return;
        }

        var point = normalizedPointerPosition(event, inputCanvas);
        dragState = hitCustomControl(runtime, point);
        if (!dragState) {
            return;
        }

        dragState.pointerId = event.pointerId;
        if (inputCanvas.setPointerCapture && event.pointerId !== undefined) {
            inputCanvas.setPointerCapture(event.pointerId);
        }
        event.preventDefault();
        event.stopImmediatePropagation();
    }

    function moveControlDrag(event) {
        if (!dragState || (event.pointerId !== undefined
                && dragState.pointerId !== event.pointerId)) {
            return;
        }

        var runtime = window.cr_getC2Runtime && window.cr_getC2Runtime();
        var screen = window.MiniDayZScreen;
        if (!runtime || !isControlCustomizationOpen(runtime)) {
            dragState = null;
            return;
        }

        var point = normalizedPointerPosition(event, inputCanvas);
        var slot = CUSTOM_CONTROL_SLOTS[dragState.slotName];
        var instance = firstVisibleControlInstance(runtime, slot);
        var layer = instance && instance.C
                ? instance.C
                : findLayer(runtime, "stick_controls");
        if (layer) {
            draftControlPositions[dragState.slotName] = clampPositionForInstance({
                x: point.x - dragState.offsetX,
                y: point.y - dragState.offsetY
            }, instance || {
                C: layer,
                width: slot.width,
                height: slot.height
            }, runtime, screen && screen.getInsets
                    ? screen.getInsets()
                    : { left: 0, top: 0, right: 0, bottom: 0 });
        }

        event.preventDefault();
        event.stopImmediatePropagation();
    }

    function finishControlDrag(event) {
        if (!dragState || (event.pointerId !== undefined
                && dragState.pointerId !== event.pointerId)) {
            return;
        }

        dragState = null;
        event.preventDefault();
        event.stopImmediatePropagation();
    }

    function handleCustomizationButton(event) {
        var runtime = window.cr_getC2Runtime && window.cr_getC2Runtime();
        if (!runtime || !isControlCustomizationOpen(runtime) || dragState) {
            return;
        }

        var point = normalizedPointerPosition(event, inputCanvas);
        if (isPointerOverCustomizationText(runtime, point, "Save")) {
            savedControlPositions = cloneControlPositions(draftControlPositions);
            saveControlPositions();
        } else if (isPointerOverCustomizationText(runtime, point, "Reset")) {
            draftControlPositions = defaultControlPositions();
        }
    }

    function installControlInput(runtime) {
        if (!runtime.canvas || inputCanvas === runtime.canvas) {
            return;
        }

        inputCanvas = runtime.canvas;
        inputCanvas.addEventListener("pointerdown", beginControlFeedback, true);
        inputCanvas.addEventListener("pointerdown", beginControlDrag, true);
        inputCanvas.addEventListener("pointermove", moveControlDrag, true);
        inputCanvas.addEventListener("pointerup", finishControlFeedback, true);
        inputCanvas.addEventListener("pointerup", handleCustomizationButton, true);
        inputCanvas.addEventListener("pointerup", finishControlDrag, true);
        inputCanvas.addEventListener("pointercancel", finishControlFeedback, true);
        inputCanvas.addEventListener("pointercancel", finishControlDrag, true);
        inputCanvas.addEventListener("lostpointercapture", finishControlFeedback, true);
        window.addEventListener("blur", clearControlFeedback, false);
    }

    function findLayer(runtime, layerName) {
        if (!runtime.wa || !runtime.wa.ua) {
            return null;
        }

        for (var index = 0; index < runtime.wa.ua.length; index += 1) {
            if (runtime.wa.ua[index].name === layerName) {
                return runtime.wa.ua[index];
            }
        }
        return null;
    }

    function findTypeByImagePath(runtime, imagePath) {
        if (!runtime.types) {
            return null;
        }

        for (var typeName in runtime.types) {
            if (!Object.prototype.hasOwnProperty.call(runtime.types, typeName)) {
                continue;
            }
            var type = runtime.types[typeName];
            if (type && !type.R && type.Ni === imagePath) {
                return type;
            }
        }
        return null;
    }

    function createNativeMenuEnvironment(source, onReady, onError) {
        if (!source.width || !source.height) {
            onError();
            return;
        }

        var canvas = document.createElement("canvas");
        canvas.width = source.naturalWidth || source.width;
        canvas.height = source.naturalHeight || source.height;
        var context;
        try {
            context = canvas.getContext("2d");
            context.drawImage(source, 0, 0);
            for (var winterTile in NATIVE_MENU_ENVIRONMENT_TILES) {
                if (!Object.prototype.hasOwnProperty.call(
                        NATIVE_MENU_ENVIRONMENT_TILES, winterTile)) {
                    continue;
                }

                var nativeTile = NATIVE_MENU_ENVIRONMENT_TILES[winterTile];
                var destinationIndex = Number(winterTile);
                var destinationX = destinationIndex
                        % ENVIRONMENT_TILE_COLUMNS * ENVIRONMENT_TILE_SIZE;
                var destinationY = Math.floor(
                        destinationIndex / ENVIRONMENT_TILE_COLUMNS)
                        * ENVIRONMENT_TILE_SIZE;
                var sourceX = nativeTile
                        % ENVIRONMENT_TILE_COLUMNS * ENVIRONMENT_TILE_SIZE;
                var sourceY = Math.floor(
                        nativeTile / ENVIRONMENT_TILE_COLUMNS)
                        * ENVIRONMENT_TILE_SIZE;

                context.clearRect(
                        destinationX, destinationY,
                        ENVIRONMENT_TILE_SIZE, ENVIRONMENT_TILE_SIZE);
                context.drawImage(
                        source,
                        sourceX, sourceY,
                        ENVIRONMENT_TILE_SIZE, ENVIRONMENT_TILE_SIZE,
                        destinationX, destinationY,
                        ENVIRONMENT_TILE_SIZE, ENVIRONMENT_TILE_SIZE);
            }
        } catch (error) {
            onError();
            return;
        }
        var image = new Image();
        image.onload = function () {
            onReady(image);
        };
        image.onerror = onError;
        image.src = canvas.toDataURL("image/png");
    }

    function applyTilemapImage(state, desiredImage) {
        if (!state || !desiredImage || state.appliedImage === desiredImage) {
            return;
        }

        state.target.N = desiredImage;
        state.appliedImage = desiredImage;
        // Tilemaps cache individual WebGL textures independently of N.
        // Invalidate those slices only when the active atlas changes.
        if (typeof state.target.Nr === "function") {
            state.target.Nr();
        }
    }

    function updateMenuScenery(runtime) {
        if (!menuSceneryState) {
            var winterGround = findTypeByImagePath(
                    runtime, WINTER_MENU_GROUND_PATH);
            var nativeGround = findTypeByImagePath(
                    runtime, NATIVE_MENU_GROUND_PATH);
            var environment = findTypeByImagePath(
                    runtime, MENU_ENVIRONMENT_PATH);
            if (!winterGround || !winterGround.N
                    || !nativeGround || !nativeGround.N
                    || !environment || !environment.N) {
                return;
            }
            menuSceneryState = {
                ground: {
                    target: winterGround,
                    originalImage: winterGround.N,
                    nativeImage: nativeGround.N,
                    appliedImage: winterGround.N
                },
                environment: {
                    target: environment,
                    originalImage: environment.N,
                    nativeImage: null,
                    loading: false,
                    appliedImage: environment.N
                }
            };
        }

        var environmentState = menuSceneryState.environment;
        if (!environmentState.nativeImage && !environmentState.loading
                && environmentState.originalImage.complete
                && environmentState.originalImage.width > 0
                && environmentState.originalImage.height > 0) {
            environmentState.loading = true;
            createNativeMenuEnvironment(
                    environmentState.originalImage,
                    function (image) {
                        environmentState.nativeImage = image;
                        environmentState.loading = false;
                    },
                    function () {
                        // Leave the initializer retryable on a later frame.
                        environmentState.loading = false;
                    });
        }

        // The Menu layout was authored with winter tile indices. Keep that
        // layout, but render it with the game's native level-one ground and
        // shape-compatible non-winter environment cells. Restore both source
        // atlases before gameplay so island terrain remains untouched.
        var inMenu = runtime.wa.name === "Menu";
        var groundState = menuSceneryState.ground;
        var nativeGroundReady = groundState.nativeImage.complete
                && groundState.nativeImage.width > 0
                && groundState.nativeImage.height > 0;
        applyTilemapImage(
                groundState,
                inMenu && nativeGroundReady
                        ? groundState.nativeImage
                        : groundState.originalImage);
        applyTilemapImage(
                environmentState,
                inMenu && environmentState.nativeImage
                        ? environmentState.nativeImage
                        : environmentState.originalImage);
    }

    function instancesForTypes(runtime, typeIndexes) {
        var instances = [];
        for (var typeIndex = 0; typeIndex < typeIndexes.length; typeIndex += 1) {
            var type = runtime.types && runtime.types["t" + typeIndexes[typeIndex]];
            if (type && type.q) {
                Array.prototype.push.apply(instances, type.q);
            }
        }
        return instances;
    }

    function moveGameplayStickToBackLayer(
            runtime, controlLayer, customizingControls) {
        if (!controlLayer) {
            controlRenderAnchor = null;
            return;
        }

        var stickInstances = instancesForTypes(runtime, GAMEPLAY_STICK_TYPES)
                .filter(function (instance) {
                    return instance.C && (instance.C === controlLayer
                            || instance.C.name === "GUI_elements"
                            || instance.C.name === "GUI");
                });
        for (var index = 0; index < stickInstances.length; index += 1) {
            var instance = stickInstances[index];
            if (instance.C !== controlLayer) {
                instance.C.ek(instance, true);
                instance.C = controlLayer;
                controlLayer.Ok(instance, true);
                if (typeof instance.P === "function") {
                    instance.P();
                }
            }
        }

        var alreadyAtBack = stickInstances.length > 0;
        for (var orderIndex = 0;
                orderIndex < stickInstances.length;
                orderIndex += 1) {
            if (controlLayer.q[orderIndex] !== stickInstances[orderIndex]) {
                alreadyAtBack = false;
                break;
            }
        }

        // Keep the complete stick assembly together at the first draw slots.
        // Construct renders layer instances from index zero towards the front.
        if (!alreadyAtBack) {
            for (var backIndex = stickInstances.length - 1;
                    backIndex >= 0;
                    backIndex -= 1) {
                var backInstance = stickInstances[backIndex];
                controlLayer.ek(backInstance, false);
                controlLayer.IG(backInstance);
            }
        }

        controlRenderAnchor = null;
        if (customizingControls && controlLayer.q && controlLayer.q.length) {
            // The customization layer ends with its full-screen darkening
            // sprite. Rendering after that final instance keeps the modern
            // controls legible while the menu scenery remains dimmed.
            controlRenderAnchor = controlLayer.q[controlLayer.q.length - 1];
        } else {
            var stickType = runtime.types && runtime.types.t676;
            if (!stickType || !stickType.q) {
                return;
            }
            for (var anchorIndex = 0;
                    anchorIndex < stickType.q.length;
                    anchorIndex += 1) {
                if (stickType.q[anchorIndex].C === controlLayer) {
                    controlRenderAnchor = stickType.q[anchorIndex];
                    break;
                }
            }
        }
    }

    function resetNativeTextures(renderer) {
        if (textureRenderer === renderer) {
            return;
        }
        textureRenderer = renderer;
        controlTextures = {};
        hudTexture = null;
    }

    function textureForAsset(renderer, assetName) {
        resetNativeTextures(renderer);
        var image = controlAssets[assetName];
        if (!image || !image.complete || !image.naturalWidth
                || !image.naturalHeight) {
            return null;
        }
        if (!controlTextures[assetName]) {
            controlTextures[assetName] = renderer.fd(image, false, false, 0);
        }
        return controlTextures[assetName];
    }

    function drawWebGlRectangle(renderer, texture, rectangle, opacity) {
        if (!texture || !rectangle || rectangle.width <= 0
                || rectangle.height <= 0) {
            return;
        }

        var right = rectangle.left + rectangle.width;
        var bottom = rectangle.top + rectangle.height;
        renderer.ld(0);
        renderer.Oe(opacity === undefined ? 1 : opacity);
        renderer.wc(texture);
        // Construct textures are uploaded with premultiplied alpha. ZERO/ZERO
        // blending discards both the sprite and destination and produces the
        // opaque black rectangles seen on Android WebGL. Restore Construct's
        // standard ONE/ONE_MINUS_SRC_ALPHA blend before drawing our textures.
        if (typeof renderer.ay === "function") {
            renderer.ay();
        } else if (renderer.T) {
            renderer.wh(renderer.T.ONE, renderer.T.ONE_MINUS_SRC_ALPHA);
        }
        renderer.dk(
                rectangle.left, rectangle.top,
                right, rectangle.top,
                right, bottom,
                rectangle.left, bottom);
        renderer.Oe(1);
    }

    function drawCanvasRectangle(context, image, rectangle, opacity) {
        var imageWidth = image && (image.naturalWidth || image.width);
        var imageHeight = image && (image.naturalHeight || image.height);
        if (!image || image.complete === false || !imageWidth
                || !imageHeight || !rectangle) {
            return;
        }
        context.save();
        context.globalAlpha = opacity === undefined ? 1 : opacity;
        context.globalCompositeOperation = "source-over";
        context.imageSmoothingEnabled = false;
        context.drawImage(
                image,
                rectangle.left,
                rectangle.top,
                rectangle.width,
                rectangle.height);
        context.restore();
    }

    function drawImageContained(context, image, left, top, width, height, padding) {
        if (!image || !image.complete || !image.naturalWidth || !image.naturalHeight) {
            return false;
        }

        var availableWidth = Math.max(1, width - padding * 2);
        var availableHeight = Math.max(1, height - padding * 2);
        var scale = Math.min(
                availableWidth / image.naturalWidth,
                availableHeight / image.naturalHeight);
        var drawWidth = image.naturalWidth * scale;
        var drawHeight = image.naturalHeight * scale;
        context.drawImage(
                image,
                left + (width - drawWidth) / 2,
                top + (height - drawHeight) / 2,
                drawWidth,
                drawHeight);
        return true;
    }

    function controlDrawRectangle(instance, slotName, slot, targetLayer) {
        // Several original controls are mutated by gameplay immediately before
        // drawing. In particular the scope control is resized and repositioned
        // while target lock is active, which made the replacement graphic
        // shake. Modern controls always render from their saved/customized
        // center; the original instance remains only as the input/state anchor.
        var positions = wasCustomizingControls
                ? draftControlPositions
                : savedControlPositions;
        var configuredPosition = positions && positions[slotName];
        var position = configuredPosition
                ? { x: configuredPosition.x, y: configuredPosition.y }
                : normalizedControlCenter(instance, slot);
        var targetViewWidth = Math.max(
                1, Number(targetLayer.Ha) - Number(targetLayer.Ca));
        var targetViewHeight = Math.max(
                1, Number(targetLayer.Ga) - Number(targetLayer.Da));

        // The original controls live across layers with different view scales.
        // Converting each instance's dimensions through its source layer makes
        // identical modern assets change size depending on which game control
        // anchors them. Slot dimensions are defined in GUI_controls units, so
        // draw them directly on that layer for stable, approved proportions.
        var width = slot.width;
        var height = slot.height;

        return {
            left: Number(targetLayer.Ca) + position.x * targetViewWidth
                    - width / 2,
            top: Number(targetLayer.Da) + position.y * targetViewHeight
                    - height / 2,
            width: width,
            height: height
        };
    }

    function containedRectangle(rectangle, image) {
        if (!rectangle || !image || !image.naturalWidth
                || !image.naturalHeight) {
            return null;
        }
        var scale = Math.min(
                rectangle.width / image.naturalWidth,
                rectangle.height / image.naturalHeight);
        var width = image.naturalWidth * scale;
        var height = image.naturalHeight * scale;
        return {
            left: rectangle.left + (rectangle.width - width) / 2,
            top: rectangle.top + (rectangle.height - height) / 2,
            width: width,
            height: height
        };
    }

    function controlFeedbackState(slotName) {
        var RELEASE_FEEDBACK_MS = 32;
        var now = performance.now();
        var pressedAt = null;
        Object.keys(pressedControlPointers).some(function (pointerKey) {
            var pressed = pressedControlPointers[pointerKey];
            if (pressed.slotName === slotName) {
                pressedAt = pressed.startedAt;
                return true;
            }
            return false;
        });

        if (pressedAt !== null) {
            // Snap to the pressed state on the very first rendered frame.
            // The previous eased press and slow hold pulse made the control
            // feel delayed even though the game received the touch promptly.
            return {
                scale: 0.86,
                opacity: 0.74
            };
        }

        if (releasedControlAt[slotName] !== undefined) {
            var releasedFor = now - releasedControlAt[slotName];
            if (releasedFor < RELEASE_FEEDBACK_MS) {
                var releaseProgress = Math.max(
                        0, releasedFor / RELEASE_FEEDBACK_MS);
                return {
                    scale: 0.86 + releaseProgress * 0.14
                            + Math.sin(releaseProgress * Math.PI) * 0.02,
                    opacity: 0.74 + releaseProgress * 0.26
                };
            }
            delete releasedControlAt[slotName];
        }

        return { scale: 1, opacity: 1 };
    }

    function applyControlFeedback(rectangle, slotName) {
        if (!rectangle) {
            return { rectangle: null, opacity: 1 };
        }
        var feedback = controlFeedbackState(slotName);
        if (feedback.scale === 1) {
            return { rectangle: rectangle, opacity: feedback.opacity };
        }
        var width = rectangle.width * feedback.scale;
        var height = rectangle.height * feedback.scale;
        return {
            rectangle: {
                left: rectangle.left + (rectangle.width - width) / 2,
                top: rectangle.top + (rectangle.height - height) / 2,
                width: width,
                height: height
            },
            opacity: feedback.opacity
        };
    }

    function drawControlAssetNative(
            runtime, targetLayer, slotName, assetName, renderer, context,
            allowHiddenAnchor) {
        var slot = CUSTOM_CONTROL_SLOTS[slotName];
        var instance = allowHiddenAnchor
                ? firstControlInstance(runtime, slot)
                : firstVisibleControlInstance(runtime, slot);
        if (!instance && !wasCustomizingControls) {
            return;
        }

        var image = controlAssets[assetName];
        var rectangle = containedRectangle(
                controlDrawRectangle(instance, slotName, slot, targetLayer), image);
        var feedback = applyControlFeedback(rectangle, slotName);
        if (renderer) {
            drawWebGlRectangle(
                    renderer,
                    textureForAsset(renderer, assetName),
                    feedback.rectangle,
                    feedback.opacity);
        } else if (context) {
            drawCanvasRectangle(
                    context, image, feedback.rectangle, feedback.opacity);
        }
    }

    function firstVisibleInstance(runtime, typeIndex) {
        var type = runtime.types && runtime.types["t" + typeIndex];
        if (!type || !type.q) {
            return null;
        }

        for (var index = 0; index < type.q.length; index += 1) {
            var instance = type.q[index];
            if (instance.visible && instance.C && instance.C.visible !== false) {
                return instance;
            }
        }
        return null;
    }

    function findPlayer(runtime) {
        var type = runtime.types && runtime.types.t181;
        if (!type || !type.q) {
            return null;
        }

        // t181 is the invisible player collision/base object. The visible
        // character sprites are pinned to it, so instance.visible is normally
        // false even during active gameplay.
        for (var index = 0; index < type.q.length; index += 1) {
            var instance = type.q[index];
            if (instance.C && instance.C.name === "player"
                    && instance.C.visible !== false) {
                return instance;
            }
        }
        return type.q.length ? type.q[0] : null;
    }

    function firearmIdForWeapon(runtime, weapon) {
        var weaponIds = Object.keys(ACTIVE_WEAPON_TYPE_BY_ID);
        for (var index = 0; index < weaponIds.length; index += 1) {
            var weaponId = Number(weaponIds[index]);
            var type = runtime.types[
                    "t" + ACTIVE_WEAPON_TYPE_BY_ID[weaponId]];
            if (type && type.q && type.q.indexOf(weapon) !== -1) {
                return weaponId;
            }
        }
        return 0;
    }

    function findEquippedWeapon(runtime, player) {
        if (!runtime.types || !player || !player.cc) {
            return null;
        }

        // player.cc[3] is the game's authoritative quick-switch category:
        // 0 = melee/bare hands, 1 = two-handed firearm, 2 = pistol. Each
        // category can retain an item with cc[0] set while another category is
        // active, so returning the first equipped item incorrectly lets melee
        // weapons mask pistols. Melee intentionally leaves this HUD empty.
        var activeCategory = Number(player.cc[3]);
        if (activeCategory !== 1 && activeCategory !== 2) {
            return null;
        }
        var wantsPistol = activeCategory === 2;

        for (var typeName in runtime.types) {
            if (!Object.prototype.hasOwnProperty.call(runtime.types, typeName)) {
                continue;
            }
            var type = runtime.types[typeName];
            // Family types repeat their concrete instances, so skip them.
            if (!type || type.R || !type.q) {
                continue;
            }
            for (var instanceIndex = 0;
                    instanceIndex < type.q.length;
                    instanceIndex += 1) {
                var instance = type.q[instanceIndex];
                if (!instance || !instance.cc || Number(instance.cc[0]) !== 1
                        || !instance.C
                        || instance.C.name !== "player_weapons") {
                    continue;
                }
                var firearmId = firearmIdForWeapon(runtime, instance);
                if (!firearmId
                        || !!PISTOL_WEAPON_IDS[firearmId] !== wantsPistol) {
                    continue;
                }
                return {
                    id: firearmId,
                    instance: instance,
                    isFirearm: true,
                    isPistol: !!PISTOL_WEAPON_IDS[firearmId]
                };
            }
        }
        return null;
    }

    function loadedAmmoForWeapon(weapon, capacity) {
        if (!weapon || !weapon.cc || !capacity) {
            return 0;
        }

        // Game_events reads and decrements firearm instance variable 3 when a
        // shot is fired. cc[0] is an equipment flag, not ammunition.
        return Math.max(0, Math.min(
                capacity, Math.round(Number(weapon.cc[3]) || 0)));
    }

    function reserveAmmoForWeapon(runtime, weaponId) {
        var ammoItemId = AMMO_ITEM_ID_BY_WEAPON_ID[weaponId];
        var ammoTypeIndex = AMMO_TYPE_BY_ITEM_ID[ammoItemId];
        var ammoType = ammoTypeIndex !== undefined && runtime.types
                ? runtime.types["t" + ammoTypeIndex]
                : null;
        if (!ammoItemId || !ammoType || !ammoType.q) {
            return 0;
        }

        var reserve = 0;
        for (var index = 0; index < ammoType.q.length; index += 1) {
            var ammo = ammoType.q[index];
            if (!ammo || !ammo.cc || !ammo.C
                    || ammo.C.name === "items_on_ground"
                    || Number(ammo.cc[2]) !== ammoItemId) {
                continue;
            }
            reserve += Math.max(0, Math.round(Number(ammo.cc[1]) || 0));
        }
        return reserve;
    }

    function stableWeaponHudFrame(runtime, weaponId) {
        // gui_firearm is the game's purpose-built inventory/HUD artwork. Its
        // frame table follows the firearm ID. Unlike the player_weapons sprite,
        // it never rotates or changes as the player walks through directional
        // animations.
        var guiFirearm = runtime.types && runtime.types.t1;
        var frame = guiFirearm && guiFirearm.ve
                ? guiFirearm.ve[weaponId]
                : null;
        if (!frame || Number(frame.width) <= 1 || Number(frame.height) <= 1) {
            return null;
        }
        return frame;
    }

    function groundWeaponHudFrame(weapon) {
        var animations = weapon && weapon.type && weapon.type.qd;
        if (!animations) {
            return null;
        }
        for (var index = 0; index < animations.length; index += 1) {
            var animation = animations[index];
            if (animation && animation.name === "on_ground"
                    && animation.frames && animation.frames.length) {
                return animation.frames[0];
            }
        }
        return null;
    }

    function inventoryWeaponHudFrame(runtime, weaponState) {
        if (!weaponState || !runtime.types) {
            return null;
        }

        var guiTypeIndex = weaponState.isPistol ? 24 : 1;
        var guiType = runtime.types["t" + guiTypeIndex];
        var guiInstance = guiType && guiType.q && guiType.q.length
                ? guiType.q[0]
                : null;
        return guiInstance && guiInstance.mc ? guiInstance.mc : null;
    }

    function drawSpriteFrame(context, frameOrInstance, left, top, width, height) {
        var frame = frameOrInstance && frameOrInstance.mc
                ? frameOrInstance.mc
                : frameOrInstance;
        var image = frame && frame.N;
        if (!frame || !image || !image.complete || !image.width || !image.height) {
            return false;
        }

        var sourceWidth = frame.jk ? frame.width : image.width;
        var sourceHeight = frame.jk ? frame.height : image.height;
        var availableWidth = width * 0.95;
        var availableHeight = height * 0.86;
        var scale = Math.min(
                availableWidth / Math.max(1, sourceWidth),
                availableHeight / Math.max(1, sourceHeight));
        var drawWidth = sourceWidth * scale;
        var drawHeight = sourceHeight * scale;
        var drawLeft = left + (width - drawWidth) / 2;
        var drawTop = top + (height - drawHeight) / 2;

        if (frame.jk) {
            context.drawImage(
                    image,
                    frame.Wj,
                    frame.Xj,
                    frame.width,
                    frame.height,
                    drawLeft,
                    drawTop,
                    drawWidth,
                    drawHeight);
        } else {
            context.drawImage(image, drawLeft, drawTop, drawWidth, drawHeight);
        }
        return true;
    }

    function drawAmmoReadout(context, loaded, reserve, left, top, width, height) {
        var fontSize = Math.max(13, Math.round(height * 0.32));
        var bulletWidth = Math.max(4, fontSize * 0.24);
        var bulletHeight = fontSize * 0.76;
        var text = loaded + " / " + reserve;

        context.save();
        context.fillStyle = "#c4bd96";
        context.strokeStyle = "#292923";
        context.lineWidth = Math.max(1, fontSize * 0.08);
        context.beginPath();
        context.moveTo(left + width * 0.13, top + height * 0.5 - bulletHeight / 2);
        context.lineTo(left + width * 0.13 + bulletWidth, top + height * 0.5 - bulletHeight / 2);
        context.lineTo(left + width * 0.13 + bulletWidth * 1.12,
                top + height * 0.5 - bulletHeight * 0.28);
        context.lineTo(left + width * 0.13 + bulletWidth * 1.12,
                top + height * 0.5 + bulletHeight / 2);
        context.lineTo(left + width * 0.13 - bulletWidth * 0.12,
                top + height * 0.5 + bulletHeight / 2);
        context.closePath();
        context.fill();
        context.stroke();

        context.font = "bold " + fontSize + "px monospace";
        context.textAlign = "center";
        context.textBaseline = "middle";
        context.fillStyle = "#e4ddba";
        context.shadowColor = "#1d1e1a";
        context.shadowBlur = 0;
        context.shadowOffsetX = Math.max(1, fontSize * 0.08);
        context.shadowOffsetY = Math.max(1, fontSize * 0.08);
        context.fillText(text, left + width * 0.59, top + height * 0.52);
        context.restore();
    }

    function drawEmptyAmmoIndicator(context, left, top, width, height) {
        var fontSize = Math.max(20, Math.round(height * 0.7));

        context.save();
        context.globalAlpha = 0.42;
        context.font = "bold " + fontSize + "px sans-serif";
        context.textAlign = "center";
        context.textBaseline = "middle";
        context.fillStyle = "#c4bd96";
        context.fillText("\u221e", left + width * 0.5, top + height * 0.49);
        context.restore();
    }

    function instanceDrawRectangle(instance, hotspotX, hotspotY) {
        if (!instance || !instance.C) {
            return null;
        }

        var instanceWidth = Math.abs(Number(instance.width) || 0);
        var instanceHeight = Math.abs(Number(instance.height) || 0);
        if (instanceWidth <= 0 || instanceHeight <= 0) {
            return null;
        }

        return {
            left: Number(instance.x) - instanceWidth * hotspotX,
            top: Number(instance.y) - instanceHeight * hotspotY,
            width: instanceWidth,
            height: instanceHeight
        };
    }

    function drawPortraitLoadoutPlate(
            context, left, top, width, height, weaponRatio) {
        var image = controlAssets.loadoutPlate;
        if (!image || !image.complete || !image.naturalWidth
                || !image.naturalHeight) {
            return null;
        }

        var dividerX = Math.round(left + width * weaponRatio);
        var edge = width * 0.038;
        var innerTop = Math.round(top + height * 0.22);
        var innerBottom = Math.round(top + height * 0.80);
        context.drawImage(image, left, top, width, height);

        return {
            edge: edge,
            dividerX: dividerX,
            innerTop: innerTop,
            innerBottom: innerBottom
        };
    }

    function prepareLoadoutHud(runtime, weaponState) {
        hudRectangle = null;
        var portrait = firstVisibleInstance(runtime, 739);
        // gui_portrait_bg uses a near-left, top-edge hotspot in every frame.
        var portraitRectangle = instanceDrawRectangle(
                portrait, 0.02564102597534657, 0);
        if (!portraitRectangle) {
            return;
        }

        var portraitLayer = portrait.C;
        var seamOverlap = Math.max(2, Math.round(portraitRectangle.width * 0.025));
        var left = portraitRectangle.left + portraitRectangle.width - seamOverlap;
        var top = portraitRectangle.top + Math.max(
                1, Math.round(portraitRectangle.height * 0.015));
        var plateWidth = Math.min(
                LOADOUT_HUD_WIDTH, Number(portraitLayer.Ha) - left - 4);
        var plateHeight = Math.min(LOADOUT_HUD_HEIGHT, plateWidth / 4);
        if (plateWidth <= 0 || plateHeight <= 0) {
            return;
        }

        hudContext.clearRect(0, 0, hudCanvas.width, hudCanvas.height);
        var weaponRatio = 0.625;
        var plate = drawPortraitLoadoutPlate(
                hudContext,
                0,
                0,
                hudCanvas.width,
                hudCanvas.height,
                weaponRatio);
        if (!plate) {
            return;
        }
        var weaponLeft = plate.edge;
        var weaponWidth = plate.dividerX - weaponLeft - plate.edge * 0.75;
        var ammoLeft = plate.dividerX + plate.edge * 0.95;
        var ammoWidth = hudCanvas.width - plate.edge - ammoLeft;
        var contentHeight = plate.innerBottom - plate.innerTop;
        var weaponId = weaponState ? weaponState.id : 0;
        var weapon = weaponState ? weaponState.instance : null;
        // Use the same clean frame the backpack/equipment card displays. The
        // on_ground frame is only a last fallback because melee ground art can
        // include the game's bright pickup-selection outline.
        var weaponFrame = weaponState
                ? (inventoryWeaponHudFrame(runtime, weaponState)
                    || stableWeaponHudFrame(runtime, weaponId)
                    || groundWeaponHudFrame(weapon))
                // Frame zero is the same empty-rifle silhouette shown in the
                // inventory's two-handed firearm slot.
                : stableWeaponHudFrame(runtime, 0);
        drawSpriteFrame(
                hudContext,
                weaponFrame,
                weaponLeft,
                plate.innerTop,
                weaponWidth,
                contentHeight);

        // A missing firearm gets the inventory-style rifle placeholder plus an
        // infinity mark. A selected firearm keeps the live loaded/reserve
        // ammunition readout.
        if (weaponState && weaponState.isFirearm) {
            var capacity = MAGAZINE_CAPACITY_BY_WEAPON_ID[weaponId];
            var loaded = loadedAmmoForWeapon(weapon, capacity);
            var reserve = reserveAmmoForWeapon(runtime, weaponId);
            drawAmmoReadout(
                    hudContext,
                    loaded,
                    reserve,
                    ammoLeft,
                    plate.innerTop,
                    ammoWidth,
                    contentHeight);
        } else {
            drawEmptyAmmoIndicator(
                    hudContext,
                    ammoLeft,
                    plate.innerTop,
                    ammoWidth,
                    contentHeight);
        }
        hudRectangle = {
            left: left,
            top: top,
            width: plateWidth,
            height: plateHeight
        };
        portraitRenderAnchor = portrait;
    }

    function drawModernControlsNative(runtime, layer, renderer, context) {
        var gunMode = !!(renderWeaponState && renderWeaponState.isFirearm);
        var interact = firstVisibleControlInstance(runtime, CUSTOM_CONTROL_SLOTS.interact);
        // The original Game_events sheet assigns interaction frame 3 when a
        // car_loot_point (an unopened vehicle trunk) is available.
        var trunkMode = !!(interact && Number(interact.Y) === 3);

        if (renderer && controlRenderAnchor) {
            renderer.Rp(controlRenderAnchor.Th);
        }

        drawControlAssetNative(
                runtime,
                layer,
                "attack",
                gunMode ? "attackGun" : "attackFist",
                renderer,
                context,
                true);
        drawControlAssetNative(
                runtime,
                layer,
                "interact",
                trunkMode ? "interactTrunk" : "interactPickup",
                renderer,
                context);
        drawControlAssetNative(
                runtime, layer, "switchItem", "switchItem", renderer, context);
        drawControlAssetNative(
                runtime, layer, "scope", "scopeLock", renderer, context);
        if (wasCustomizingControls || gunMode) {
            drawControlAssetNative(
                    runtime, layer, "reload", "reloadGun", renderer, context);
        }
    }

    function drawLoadoutHudNative(renderer, context) {
        if (!hudRectangle) {
            return;
        }

        if (renderer) {
            resetNativeTextures(renderer);
            if (portraitRenderAnchor) {
                renderer.Rp(portraitRenderAnchor.Th);
            }
            if (!hudTexture) {
                hudTexture = renderer.td(
                        hudCanvas.width, hudCanvas.height, false);
            }
            renderer.Zy(hudCanvas, hudTexture, false);
            drawWebGlRectangle(renderer, hudTexture, hudRectangle);
        } else if (context) {
            drawCanvasRectangle(context, hudCanvas, hudRectangle);
        }
    }

    function installNativeLayerRendering(runtime, customizingControls) {
        var controlLayer = findLayer(runtime, customizingControls
                ? "stick_controls"
                : "GUI_controls");
        var portraitLayer = findLayer(runtime, "GUI");
        var achievementLayer = findLayer(runtime, "achieves");
        moveGameplayStickToBackLayer(
                runtime, controlLayer, customizingControls);

        if (achievementLayer && !achievementLayer.miniDayzStatsAlignment) {
            achievementLayer.miniDayzStatsAlignment = true;
            if (typeof achievementLayer.iE === "function") {
                var originalAchievementWebGlDraw = achievementLayer.iE;
                achievementLayer.iE = function (instance, renderer) {
                    if (instance.type === runtime.types.t364
                            || instance.type === runtime.types.t371) {
                        alignAchievementOverallStats(runtime);
                    }
                    originalAchievementWebGlDraw.call(this, instance, renderer);
                };
            }
            if (typeof achievementLayer.hE === "function") {
                var originalAchievementCanvasDraw = achievementLayer.hE;
                achievementLayer.hE = function (instance, context) {
                    if (instance.type === runtime.types.t364
                            || instance.type === runtime.types.t371) {
                        alignAchievementOverallStats(runtime);
                    }
                    originalAchievementCanvasDraw.call(this, instance, context);
                };
            }
        }

        if (controlLayer && !controlLayer.miniDayzControlRendering) {
            controlLayer.miniDayzControlRendering = true;
            if (typeof controlLayer.iE === "function") {
                var originalControlWebGlDraw = controlLayer.iE;
                controlLayer.iE = function (instance, renderer) {
                    if (instance === controlRenderAnchor
                            && renderModernControls
                            && !wasCustomizingControls) {
                        drawModernControlsNative(
                                runtime, this, renderer, null);
                    }
                    originalControlWebGlDraw.call(this, instance, renderer);
                    if (instance === controlRenderAnchor
                            && renderModernControls
                            && wasCustomizingControls) {
                        drawModernControlsNative(
                                runtime, this, renderer, null);
                    }
                };
            }
            if (typeof controlLayer.hE === "function") {
                var originalControlCanvasDraw = controlLayer.hE;
                controlLayer.hE = function (instance, context) {
                    if (instance === controlRenderAnchor
                            && renderModernControls
                            && !wasCustomizingControls) {
                        drawModernControlsNative(
                                runtime, this, null, context);
                    }
                    originalControlCanvasDraw.call(this, instance, context);
                    if (instance === controlRenderAnchor
                            && renderModernControls
                            && wasCustomizingControls) {
                        drawModernControlsNative(
                                runtime, this, null, context);
                    }
                };
            }
        }

        if (portraitLayer && !portraitLayer.miniDayzHudRendering) {
            portraitLayer.miniDayzHudRendering = true;
            if (typeof portraitLayer.iE === "function") {
                var originalHudWebGlDraw = portraitLayer.iE;
                portraitLayer.iE = function (instance, renderer) {
                    originalHudWebGlDraw.call(this, instance, renderer);
                    if (instance === portraitRenderAnchor && renderLoadoutHud) {
                        drawLoadoutHudNative(renderer, null);
                    }
                };
            }
            if (typeof portraitLayer.hE === "function") {
                var originalHudCanvasDraw = portraitLayer.hE;
                portraitLayer.hE = function (instance, context) {
                    originalHudCanvasDraw.call(this, instance, context);
                    if (instance === portraitRenderAnchor && renderLoadoutHud) {
                        drawLoadoutHudNative(null, context);
                    }
                };
            }
        }
    }

    function updateNativeRenderState(
            runtime, customizingControls, activeGameplay, player, weaponState) {
        renderModernControls = customizingControls || activeGameplay;
        renderPlayer = customizingControls ? null : player;
        renderWeaponState = customizingControls ? null : weaponState;
        renderLoadoutHud = !customizingControls
                && runtime.wa
                && (runtime.wa.name === "Map" || runtime.wa.name === "Tutorial")
                && !!firstVisibleInstance(runtime, 739);
        portraitRenderAnchor = null;
        hudRectangle = null;
        if (renderLoadoutHud) {
            prepareLoadoutHud(runtime, renderWeaponState);
            renderLoadoutHud = !!hudRectangle;
        }
    }

    function updateGameUi() {
        scheduledFrame = 0;

        var runtime = window.cr_getC2Runtime && window.cr_getC2Runtime();
        var screen = window.MiniDayZScreen;
        if (!runtime || !runtime.wa || !screen || typeof screen.getInsets !== "function") {
            scheduleUpdate();
            return;
        }

        var insets = screen.getInsets();
        updateMenuScenery(runtime);
        forceStickMovement(runtime);
        removeMovementSetting(runtime);
        var customizingControls = isControlCustomizationOpen(runtime);
        var player = customizingControls ? null : findPlayer(runtime);
        installNativeLayerRendering(runtime, customizingControls);
        var activeGameplay = isActiveGameplay(runtime);
        var weaponState = customizingControls
                ? null
                : findEquippedWeapon(runtime, player);
        var gunMode = !!(weaponState && weaponState.isFirearm);
        installControlInput(runtime);

        if (customizingControls && !wasCustomizingControls) {
            draftControlPositions = cloneControlPositions(savedControlPositions);
        } else if (!customizingControls && wasCustomizingControls) {
            dragState = null;
            draftControlPositions = cloneControlPositions(savedControlPositions);
        }
        wasCustomizingControls = customizingControls;
        keepAttackAvailable(runtime, activeGameplay, customizingControls);
        keepReloadAvailable(
                runtime, activeGameplay, gunMode, customizingControls);

        if (runtime.wa.name === "Menu") {
            for (var achievementIndex = 0;
                    achievementIndex < ACHIEVEMENT_TEXT_TYPES.length;
                    achievementIndex += 1) {
                updateType(runtime, ACHIEVEMENT_TEXT_TYPES[achievementIndex], insets, false);
            }
            alignAchievementOverallStats(runtime);
            updateType(runtime, 662, insets, true);
        } else {
            updateTimeSettingsGuideGroup(runtime, insets);
            for (var controlIndex = 0;
                    controlIndex < GAME_CONTROL_TYPES.length;
                    controlIndex += 1) {
                updateType(runtime, GAME_CONTROL_TYPES[controlIndex], insets, true);
            }
        }

        if (activeGameplay || customizingControls) {
            applyCustomControlPositions(runtime, insets, customizingControls);
        }

        updateNativeRenderState(
                runtime, customizingControls, activeGameplay, player, weaponState);

        scheduleUpdate();
    }

    function scheduleUpdate() {
        if (!scheduledFrame) {
            scheduledFrame = window.requestAnimationFrame(updateGameUi);
        }
    }

    scheduleUpdate();
}());
