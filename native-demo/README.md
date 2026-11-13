# Android INAV demo

The bundled `android/app/src/main/jniLibs/arm64-v8a/libinav_demo.so` is an
INAV 10.0.0 SITL executable, built from iNavFlight/inav commit
`fca135ce57c28393b20b1e5c9af6b27bff0479da` with the changes in
[`firmware.patch`](firmware.patch). Firmware license: [GPL-3.0](LICENSE).
It uses Android Bionic and `/system/bin/linker64`, PIE and 16 KiB page alignment.
It is an executable packaged as a native library so Android can extract it to
an executable application directory; it is not loaded with `System.loadLibrary`.

The native plugin starts it with a private EEPROM file, waits for its local
MSP listener at `127.0.0.1:5760`, and forwards data and diagnostic output to the
WebView. No simulator download or external server is required. This executable
supports ARM64 Android devices only; physical USB connections are independent.

## Rebuild the executable

Use a Linux x86-64 host, Android NDK r28c, Python 3, Ruby 3, CMake 3.31,
make and the build dependencies required by the upstream INAV firmware.
From this repository's root:

```sh
git clone https://github.com/iNavFlight/inav.git native-demo/firmware
git -C native-demo/firmware checkout fca135ce57c28393b20b1e5c9af6b27bff0479da
git -C native-demo/firmware apply ../firmware.patch
export ANDROID_NDK_HOME=/path/to/android-ndk-r28c
sh native-demo/build.sh
```

For an existing firmware checkout, set `INAV_DEMO_SOURCE` to the patched source
directory. `INAV_DEMO_BUILD` overrides the build output directory.
Both default directories are ignored by Git. Apply the patch only once.

The patch restricts TCP listeners to loopback, uses Bionic-compatible address
lookup flags, adapts the pthread priority API and `ffs()` header, and aligns the
SITL registry linker section. The address lookup change fixes the Android
`getaddrinfo: Invalid value for ai_flags` / connection-refused startup failure.

## Build the app

Use Node 24, JDK 21 and Android SDK 36, then run `npm ci`, `npm run sync`,
and `cd android && ./gradlew assembleDebug`. The checked-in executable can be
used without rebuilding the firmware. See the root README for Android setup.

The simulator was exercised through a browser-to-native test bridge using
QEMU ARM64: MSP handshake, configuration tabs, CLI, disconnect and reconnect.
A user also confirmed demo connection on a TECNO POVA 7 Ultra 5G. Android process
launch was not tested on a locally attached phone or Android emulator.
