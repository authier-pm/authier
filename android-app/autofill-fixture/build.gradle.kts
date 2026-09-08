plugins {
    id("com.android.application")
    id("org.jetbrains.kotlin.android")
}

android {
    namespace = "dev.authier.autofillfixture"
    compileSdk = 35
    defaultConfig {
        applicationId = "dev.authier.autofillfixture"
        minSdk = 26
        targetSdk = 35
        versionCode = 1
        versionName = "test-only"
    }
    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }
    kotlinOptions { jvmTarget = "17" }
}
