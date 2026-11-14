# Android app icon

The launcher uses the white INAV mark on a blue (`#31A9D8`) background, matching
the supplied reference. The vector mark comes from the unchanged configurator
submodule: `images/icons/cf_icon_welcome_white.svg` (project GPL-3.0 license).

- `app-icon.svg`: canonical rounded-square artwork.
- `app-icon.png`: raster preview.
- `app-icon-mark.svg`: normalized transparent vector mark used by the generator.

Checked-in Android resources include legacy square/round PNGs for mdpi through
xxxhdpi, transparent foreground PNGs, a vector foreground and a solid adaptive
background. The foreground mark fits within Android's 66 dp safe circle in a
108 dp layer, allowing launcher masks without clipping the logo.

To regenerate, install Playwright with Chromium in your development environment
and run `node scripts/generate-app-icons.cjs`. `CHROMIUM_EXECUTABLE` can select
an existing Chromium binary. This generates icon resources only, not an APK.

Resource compilation (`aapt2 compile`) and density/safe-zone checks passed.
The new icon will appear on devices after installing a new APK built from these
sources; the already published mobile.8 APK retains its previous icon.
