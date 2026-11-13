#!/usr/bin/env python3
import os,sys
from pathlib import Path
ndk=Path(os.environ['ANDROID_NDK_HOME'])/'toolchains/llvm/prebuilt/linux-x86_64'
cpp=os.path.basename(sys.argv[0])=='g++'
args=[a for a in sys.argv[1:] if a not in ['-fsingle-precision-constant','-Wno-error=maybe-uninitialized','-Wl,--no-warn-rwx-segments','-lpthread','-lrt'] and not a.startswith('-Werror')]
args=[a[4:] if a.startswith('-Wl,-L') else a for a in args]
args+=['-fPIE'] if '-c' in args else ['-pie','-Wl,-z,max-page-size=16384']
if cpp: args.append('-nostdlib++')
compiler=str(ndk/'bin'/('clang++' if cpp else 'clang'))
os.execv(compiler,[compiler,'--target=aarch64-linux-android24','--sysroot='+str(ndk/'sysroot'),*args])
