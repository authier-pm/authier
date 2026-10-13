#include <jni.h>
#include <memory>
#include <string>
#include <vector>
#include "sentencepiece_processor.h"
#include "sentencepiece.pb.h"

namespace {
void fail(JNIEnv* env, const char* message) {
    env->ThrowNew(env->FindClass("java/lang/IllegalStateException"), message);
}
}

extern "C" JNIEXPORT jlong JNICALL
Java_dev_authier_android_SmsSentencePiece_create(JNIEnv* env, jobject, jstring path) {
    const char* filename = env->GetStringUTFChars(path, nullptr);
    if (!filename) return 0;
    auto processor = std::make_unique<sentencepiece::SentencePieceProcessor>();
    auto status = processor->Load(filename);
    env->ReleaseStringUTFChars(path, filename);
    if (!status.ok()) {
        fail(env, "Cannot load the SMS tokenizer");
        return 0;
    }
    return reinterpret_cast<jlong>(processor.release());
}

extern "C" JNIEXPORT jintArray JNICALL
Java_dev_authier_android_SmsSentencePiece_encode(JNIEnv* env, jobject, jlong handle, jbyteArray input) {
    auto* processor = reinterpret_cast<sentencepiece::SentencePieceProcessor*>(handle);
    if (!processor) { fail(env, "SMS tokenizer is closed"); return nullptr; }
    const auto length = env->GetArrayLength(input);
    std::string text(length, '\0');
    env->GetByteArrayRegion(input, 0, length, reinterpret_cast<jbyte*>(text.data()));
    if (env->ExceptionCheck()) return nullptr;
    sentencepiece::SentencePieceText pieces;
    if (!processor->Encode(text, &pieces).ok()) {
        fail(env, "Cannot tokenize SMS text");
        return nullptr;
    }
    // Fairseq/XLM-R IDs plus source UTF-8 offsets, interleaved. No SMS is logged.
    std::vector<jint> tokens{0, 0};
    for (const auto& piece : pieces.pieces()) {
        int id = piece.id();
        if (id == 0) id = 3;
        else if (id == 1) id = 0;
        else if (id != 2) ++id;
        tokens.push_back(id);
        tokens.push_back(piece.begin());
    }
    tokens.push_back(2);
    tokens.push_back(length);
    auto output = env->NewIntArray(static_cast<jsize>(tokens.size()));
    if (output) env->SetIntArrayRegion(output, 0, static_cast<jsize>(tokens.size()), tokens.data());
    return output;
}

extern "C" JNIEXPORT void JNICALL
Java_dev_authier_android_SmsSentencePiece_destroy(JNIEnv*, jobject, jlong handle) {
    delete reinterpret_cast<sentencepiece::SentencePieceProcessor*>(handle);
}
