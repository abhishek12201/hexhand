# IWSDK and WebXR API Notes

Research for IWSDK `1.1.0-rc.2`, installed `@types/webxr`, and the IWER documentation available on 2026-11-09. Runtime behavior that cannot be observed in this Codespace is marked unverified.

## 1. Per-frame hand joint poses

`World.xrFrame` is the current frame and `World.xrReferenceSpace` is the resolved reference space. In a system `update()` (or `World.onXRFrame()`), iterate `world.xrSession?.inputSources`, skip sources without `source.hand`, then call `frame.getJointPose(jointSpace, referenceSpace)` for each `XRHand` map entry. This returns position and orientation relative to that reference space; the frame must not be retained past the callback. `getJointPose` is optional in the installed WebXR types, so guard it. The P1 spike in `app/src/hand-joint-spike.ts` follows this path.

Sources: [IWSDK World declarations](../app/node_modules/@iwsdk/core/dist/ecs/world.d.ts), [WebXR types](../app/node_modules/@types/webxr/index.d.ts), [WebXR Hand Input](https://immersive-web.github.io/webxr-hand-input/).

## 2. Hand tracking versus controller input

`iwsdk.config.json` requests optional hand tracking with `world.xr.features.handTracking: true`; this advertises the feature for the session but does not force the active source to be a hand. Inspect `XRInputSource.hand` or use `world.input.xr.isPrimary('hand', handedness)` / `getPrimaryInputSource(handedness)`. IWER switches active source mode using `xrDevice.primaryInputMode = 'hand'` or `'controller'`; changing modes removes and re-adds session input sources. In its remote-control API the equivalent is `set_input_mode`.

Sources: [IWSDK XR options](../app/node_modules/@iwsdk/core/dist/init/xr.d.ts), [IWSDK XR input manager](../app/node_modules/@iwsdk/xr-input/dist/xr-input-manager.d.ts), [IWER hand scripting](https://meta-quest.github.io/immersive-web-emulation-runtime/scripting-hands), [IWER configuration and emulated input](https://meta-quest.github.io/immersive-web-emulation-runtime/api/config-interfaces).

## 3. IWER hand poses and custom poses

The documented built-in pose IDs are `default`, `pinch`, `point`, `open`, `flat`, `fist`, `thumbs-up`, `finger-gun`, `peace`, `three`, `four`, `ok`, `rock`, `call`, `pinch-middle`, `pinch-ring`, `pinch-pinky`, `tripod`, `key-pinch`, `microgesture`, `grip`, `claw`, `hook`, and `cup`. Read `hand.poseIds` to inspect the available IDs for a specific config. To supply custom poses, define them in `XRHandInputConfig.poses` alongside the required `default` and `pinch` poses; switch at runtime with `hand.poseId` or `beginPoseTransition(poseId)`. This is configuration, not a separate global pose-registration API.

Sources: [IWER built-in pose IDs](https://github.com/meta-quest/immersive-web-emulation-runtime/blob/main/packages/iwer/src/device/configs/hand/ids.ts), [IWER XRHandInput API](https://meta-quest.github.io/immersive-web-emulation-runtime/api/xr-hand-input), [IWER configuration interfaces](https://meta-quest.github.io/immersive-web-emulation-runtime/api/config-interfaces).

## 4. Hand pointer and pinch-select events

IWSDK `InputSystem` processes hand/controller pointers. Add `RayInteractable` to a target; observe transient `Hovered` and `Pressed` tags for hover/press state. WebXR hand pinch is exposed as `selectstart`, `select`, and `selectend` events on the active `XRSession`; `XRInputManager.getSelectState(handedness)` also reports the per-frame edge/active state for sources without a Gamepad. UIKitML elements expose `addEventListener('click', ...)` after resolving the scene's `UIKitMLAsset` and its element by ID. The starter `app/src/panel.ts` demonstrates this.

Sources: [IWSDK input state tags](../app/node_modules/@iwsdk/core/dist/input/state-tags.d.ts), [IWSDK XR input manager](../app/node_modules/@iwsdk/xr-input/dist/xr-input-manager.d.ts), [WebXR session event types](../app/node_modules/@types/webxr/index.d.ts), [IWSDK UIKitML asset](../app/node_modules/@iwsdk/core/dist/ui/uikitml-asset.d.ts), [starter panel system](../app/src/panel.ts).

## 5. Havok physics setup, impulses, and collision events

Enable physics in `iwsdk.config.json` with `world.features.physics` (currently `false`). Add `PhysicsBody` with a `PhysicsState` such as `Dynamic`, plus `PhysicsShape` with a shape and dimensions. `PhysicsManipulation.force` is documented as a one-frame impulse applied at the center of mass and is removed after application. I did not find a public collision/contact event API in the installed IWSDK physics declarations or implementation; the supported collision-event mechanism therefore remains unverified and should not be assumed.

Sources: [IWSDK physics feature options](../app/node_modules/@iwsdk/core/dist/init/world-initializer.d.ts), [PhysicsBody](../app/node_modules/@iwsdk/core/dist/physics/physicsBody.d.ts), [PhysicsShape](../app/node_modules/@iwsdk/core/dist/physics/physicsShape.d.ts), [PhysicsManipulation](../app/node_modules/@iwsdk/core/dist/physics/physicsManipulation.d.ts), [PhysicsSystem](../app/node_modules/@iwsdk/core/dist/physics/physics-system.d.ts).

## 6. Fixed seated position and reference space

The app's `iwsdk.config.json` does not specify `xr.referenceSpace`; IWSDK's documented preferred default is `local-floor`, falling back to `local` and then `viewer`. The available reference-space values include `local-floor` and `local`; there is no separate seated reference-space type. A fixed seat is an app policy: keep the player origin fixed and disable locomotion. `render.camera.position` is the initial local camera pose, not a seated-mode switch. The current scaffold scene has no player transform override. Also, the current config enables locomotion (see `DECISIONS.md`).

Sources: [IWSDK reference-space options](../app/node_modules/@iwsdk/core/dist/init/xr.d.ts), [project XR config types](../app/node_modules/@iwsdk/core/dist/project/types.d.ts), [IWSDK World/player declarations](../app/node_modules/@iwsdk/core/dist/ecs/world.d.ts), [IWER reference-space behavior](https://meta-quest.github.io/immersive-web-emulation-runtime/getting-started).

## 7. Session start, end, and pause/visibility

IWSDK exposes the active `world.xrSession`; standard `XRSession` events include `end` and `visibilitychange`, and `session.visibilityState` distinguishes visible, blurred, and hidden. IWSDK also exposes `world.visibilityState` as a reactive signal (`NonImmersive`, `Visible`, `VisibleBlurred`, and related values). The renderer emits `sessionstart` / `sessionend`, as used by IWSDK's `AudioSystem`. There is no separate built-in pause event; pause/resume is app state driven by visibility and/or explicit input.

Sources: [WebXR XRSession declarations](../app/node_modules/@types/webxr/index.d.ts), [IWSDK World visibility/session fields](../app/node_modules/@iwsdk/core/dist/ecs/world.d.ts), [IWSDK AudioSystem session handlers](../app/node_modules/@iwsdk/core/dist/audio/audio-system.js).

## 8. FPS and frame-time readout

IWSDK systems receive `delta` and `time` in seconds in `update(delta, time)`. A project debug readout can accumulate delta samples, display `delta * 1000` milliseconds per frame, and compute a rolling FPS from elapsed time. The public IWSDK render-stat structure reports draw calls and geometry/render counts, not FPS or frame time; no built-in FPS HUD was found.

Sources: [IWSDK System declarations](../app/node_modules/@iwsdk/core/dist/ecs/system.d.ts), [IWSDK runtime render stats](../app/node_modules/@iwsdk/core/dist/mcp/scene-tools.d.ts).

## 9. Spatial UI panels

For a world-space panel, register a UIKitML file as an `AssetType.UIKitML` manifest asset, place it in the scene, resolve its `UIKitMLAsset` by scene node ID, and bind element IDs with `getElementById` / `addEventListener`. `RayInteractable` enables ray interaction. UIKitML supports the built-in `horizon` kit and custom component sets. IWSDK also exports `PanelUI`, `ScreenSpace`, and `Follow` for panel and screen-space/following UI options. The starter uses a world-space UIKitML asset.

Sources: [IWSDK UI exports](../app/node_modules/@iwsdk/core/dist/ui/index.d.ts), [UIKitML loading API](../app/node_modules/@iwsdk/core/dist/ui/uikitml.d.ts), [ScreenSpace](../app/node_modules/@iwsdk/core/dist/ui/screenspace-component.d.ts), [starter panel system](../app/src/panel.ts).

## 10. WebAudio and autoplay unlock

IWSDK's `AudioSystem` uses Three.js `AudioListener` / `PositionalAudio` backed by Web Audio. It resumes a suspended audio context on XR `sessionstart`; `AudioUtils.play(entity)` plays a configured `AudioSource`. Browser autoplay policy can keep Web Audio suspended until a user gesture, so trigger or resume audio from an explicit interaction and verify the exact Quest browser behavior on-device. This Codespace has no headset for that verification.

Sources: [IWSDK AudioSystem](../app/node_modules/@iwsdk/core/dist/audio/audio-system.js), [AudioUtils](../app/node_modules/@iwsdk/core/dist/audio/audio-utils.d.ts), [MDN autoplay guide](https://developer.mozilla.org/en-US/docs/Web/Media/Guides/Autoplay).