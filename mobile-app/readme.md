## Common problems

If you get error like this:

```
> Task :app:stripDebugDebugSymbols
Unable to strip the following libraries, packaging them as they are: libc++_shared.so, libconceal.so, libevent-2.1.so, libevent_core-2.1.so, libevent_extra-2.1.so, libfb.so, libfbjni.so, libflipper.so, libfolly_futures.so, libfolly_json.so, libglog.so, libglog_init.so, libhermes-executor-common-debug.so, libhermes-executor-common-release.so, libhermes-executor-debug.so, libhermes-executor-release.so, libhermes-inspector.so, libhermes.so, libimagepipeline.so, libjscexecutor.so, libjsijniprofiler.so, libjsinspector.so, libnative-filters.so, libnative-imagetranscoder.so, libreact_codegen_reactandroidspec.so, libreact_nativemodule_core.so, libreactnativeblob.so, libreactnativejni.so, libreactnativeutilsjni.so, libreactperfloggerjni.so, libreanimated.so, libturbomodulejsijni.so, libyoga.so
```

use this: https://stackoverflow.com/a/58823679/671457

With native base use color like this: `red.500` instead of `red`
