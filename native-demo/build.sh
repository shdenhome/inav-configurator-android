#!/bin/sh
set -eu
demo_wrapper_root=$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)
demo_source_root=${INAV_DEMO_SOURCE:-"$demo_wrapper_root/native-demo/firmware"}
demo_build_root=${INAV_DEMO_BUILD:-"$demo_wrapper_root/native-demo/build"}
demo_tools_root="$demo_build_root/compiler"
mkdir -p "$demo_tools_root"
cp "$demo_wrapper_root/native-demo/cc.py" "$demo_tools_root/gcc"
chmod +x "$demo_tools_root/gcc"
ln -sf gcc "$demo_tools_root/g++"
export PATH="$demo_tools_root:$PATH"
cmake -S "$demo_source_root" -B "$demo_build_root/cmake" -DSITL=ON -DCMAKE_BUILD_TYPE=Release -DWARNINGS_AS_ERRORS=OFF
cmake --build "$demo_build_root/cmake" --target SITL -j 3
mkdir -p "$demo_wrapper_root/android/app/src/main/jniLibs/arm64-v8a"
cp "$demo_build_root/cmake/bin/SITL.elf" "$demo_wrapper_root/android/app/src/main/jniLibs/arm64-v8a/libinav_demo.so"
