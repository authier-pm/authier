cmake_minimum_required(VERSION 3.22)
project(authier_sms_tokenizer LANGUAGES CXX)

include(FetchContent)
set(SPM_ENABLE_SHARED OFF CACHE BOOL "" FORCE)
set(SPM_ENABLE_TCMALLOC OFF CACHE BOOL "" FORCE)
set(SPM_BUILD_TEST OFF CACHE BOOL "" FORCE)
set(CMAKE_POSITION_INDEPENDENT_CODE ON)
FetchContent_Declare(sentencepiece
    URL https://github.com/google/sentencepiece/archive/refs/tags/v0.2.0.tar.gz
    URL_HASH SHA256=9970f0a0afee1648890293321665e5b2efa04eaec9f1671fcf8048f456f5bb86)
FetchContent_MakeAvailable(sentencepiece)

add_library(authier_sms_tokenizer SHARED smsTokenizer.cpp)
target_compile_features(authier_sms_tokenizer PRIVATE cxx_std_17)
target_compile_definitions(authier_sms_tokenizer PRIVATE _USE_INTERNAL_STRING_VIEW)
target_include_directories(authier_sms_tokenizer PRIVATE
    ${sentencepiece_SOURCE_DIR}/src
    ${sentencepiece_SOURCE_DIR}/src/builtin_pb
    ${sentencepiece_SOURCE_DIR}/third_party
    ${sentencepiece_SOURCE_DIR}/third_party/protobuf-lite)
target_link_libraries(authier_sms_tokenizer PRIVATE sentencepiece-static log)
# NDK 27 and Android devices with either 4 KB or 16 KB pages.
target_link_options(authier_sms_tokenizer PRIVATE "-Wl,-z,max-page-size=16384")
