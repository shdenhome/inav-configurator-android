# Android layout and local demo — mobile.7

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
- Version `10.0.0-rc1-mobile.7`, Android versionCode 11.

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

The preview still shows inconsistent fitting on PID tuning, the JavaScript
editor, and the mission-control sidebar. These pages need follow-up layout work.
Some hardware-dependent controls are unavailable in SITL (for example Blackbox).
The simulator binary supports ARM64 only. The latest APK was not tested on an
attached Android phone or emulator; browser/native-bridge tests do not establish
physical-device USB or process-launch behavior.
