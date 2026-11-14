# Android layout and local demo — mobile.7

## Updates in mobile.8

[Updated screen PDF](android-ui-updates.pdf): 16 browser screenshots across
portrait/landscape, covering navigation, all five PID subtabs and OSD editing.

- Hide JavaScript Programming from Android navigation; retain Programming.
- Fit the actual tab root instead of the decorative watermark preceding PID.
- Keep PID subtabs on one row, move Documentation below that row, and equalize
  reset/default button heights in both PID coefficient subtabs.
- Translate touch/pen gestures on movable OSD cells into the existing desktop
  drag/drop handlers. Preserve the grabbed character's offset, resolve targets
  using actual cell hit testing under page scaling, and retain upstream MSP
  encoding and redraw behavior. A second finger, pointer cancellation or drop
  outside the preview cancels the edit. Native mouse dragging remains available.
- In OSD, zoom in for precision, then drag the desired element with one finger.
  Use the existing Save button to persist configuration to controller storage.

Validation used the real OSD page and INAV 10 SITL over the test native bridge:
MSP layout-write X/Y payloads, reading the position back after reopening the
page, portrait/landscape, 2× viewport zoom, grabbed-character offset, cancellation,
multi-touch, out-of-preview drops and native mouse dragging. No JavaScript page
errors were observed. This does not replace testing on a physical Android phone.


[Screen preview PDF](android-mobile-preview.pdf) — 31 sections, 62 screenshots:
portrait 393×850 and landscape 850×393 CSS viewports. The PDF includes a linked
contents page. These are browser previews of the current changes, with INAV 10
SITL data for connected pages, not captures from a physical Android phone.
Long forms show the initial visible area; scroll to reach further controls.

## Changes

- Compact header controls stay together at the right edge. Fit their natural
  width to the space beside the Menu button instead of stretching or wrapping.
- Scrollable navigation drawer on narrow screens, with a separate icon column
  so translated labels do not overlap icons; persistent sidebar on wide screens.
- Fit desktop form layouts to the content width while leaving the header and
  navigation independently readable. Keep native pinch zoom available.
- Allow one-finger panning after zoom by removing nested overscroll containment.
- Use native system-bar insets and a contained viewport to respect status bars,
  the camera cutout and navigation area in either orientation.
- Keep the upper Console action outside the scrolling message area. It expands
  INAV's original inline log, preserves its saved state, and can collapse it.
- Provide a separate Application log entry in the navigation menu. It captures
  renderer errors, GUI events and native simulator output, and supports copy,
  save and clear, retaining the latest 500 entries locally.
- Implement demo lifecycle and MSP transport through a Capacitor native plugin
  and a packaged ARM64 INAV 10 simulator. Restrict the bridge to loopback; retain
  startup errors and process output for diagnosis. Physical USB remains separate.
- Version `10.0.0-rc1-mobile.8`, Android versionCode 12.

Changes live in the Android wrapper and build-time shims; the configurator
submodule revision is unchanged. See [native demo source/build instructions](../native-demo/README.md).

## Validation

- `npm run sync` and Android `assembleDebug` completed successfully.
- APK signature verified, archive integrity checked, and packaged simulator
  bytes compared to the native executable. Existing debug signing identity retained.
- Browser touch checks reproduced the previous stuck viewport, then verified
  horizontal panning and vertical viewport/content scrolling in both directions
  at 2× zoom on 360×780, 393×850 and 850×393 viewports.
- Header geometry checked in connected/disconnected states at 320, 360, 393,
  600, 850 and 1280 pixel widths; native zoom does not reset header fitting.
- Original inline log and separate application journal checked at three sizes,
  including button visibility after log autoscroll and saved toggle state.
- Built web bundle exercised with INAV 10 ARM64 SITL through QEMU/test bridge:
  setup, calibration, magnetometer, configuration, CLI, disconnect/reconnect;
  no JavaScript page errors and no USB-open calls during demo operation.
- All 25 connected menu pages captured for the PDF. No JavaScript page errors
  were observed during that capture pass.

## Known limitations

The original mobile.7 preview shows inconsistent fitting on PID tuning, the
JavaScript editor and the mission-control sidebar. Subsequent source changes
fix PID fitting and hide the JavaScript menu; mission control still needs work.
Some hardware-dependent controls are unavailable in SITL (for example Blackbox).
The simulator binary supports ARM64 only. The latest APK was not tested on an
attached Android phone or emulator; browser/native-bridge tests do not establish
physical-device USB or process-launch behavior.

The mobile.8 APK was built with these changes. Its built web bundle passed the
OSD gesture/MSP readback and PID geometry checks described above.
