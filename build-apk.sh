#!/bin/bash

# Exit on error
set -e

echo "============================================="
echo "💅 Nails by Mamta — APK Build Pipeline"
echo "============================================="

# 1. Clean up old builds and caches
echo "🧹 Step 1: Cleaning up old native directories and Metro caches..."
if [ -d "android" ]; then
  echo "   - Removing existing 'android' folder..."
  rm -rf android
fi
if [ -d ".expo" ]; then
  echo "   - Removing '.expo' cache..."
  rm -rf .expo
fi
if [ -d "builds" ]; then
  echo "   - Removing old 'builds' folder..."
  rm -rf builds
fi

# 2. Run Expo Doctor
echo "🩺 Step 2: Running Expo Doctor diagnostic check..."
if npx expo doctor; then
  echo "   ✓ Expo Doctor checks passed."
else
  echo "   ⚠️ Expo Doctor found issues. Please review the output above."
  read -p "   Do you want to continue the build anyway? (y/n) " -n 1 -r
  echo
  if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "   Build cancelled."
    exit 1
  fi
fi

# 3. Generate native Android folder (Prebuild)
echo "📦 Step 3: Generating native Android files (npx expo prebuild)..."
npx expo prebuild --platform android --clean

# 3.5 Optimize Build Settings
echo "⚙️  Step 3.5: Optimizing build settings for size (ARM only, Minification)..."
# Restrict to ARM architectures to save massive space (drops x86/x86_64)
sed -i '' 's/reactNativeArchitectures=armeabi-v7a,arm64-v8a,x86,x86_64/reactNativeArchitectures=armeabi-v7a,arm64-v8a/g' android/gradle.properties
# Enable ProGuard/Minification
echo "android.enableMinifyInReleaseBuilds=true" >> android/gradle.properties
echo "android.enableShrinkResourcesInReleaseBuilds=true" >> android/gradle.properties

# 4. Compile APK with Gradle
echo "🏗️ Step 4: Compiling APK using Gradle (assembleRelease)..."
cd android
chmod +x gradlew
./gradlew assembleRelease
cd ..

# 5. Export APK to builds folder
echo "🚚 Step 5: Exporting compiled APK..."
mkdir -p builds
APK_SOURCE="android/app/build/outputs/apk/release/app-release.apk"

if [ -f "$APK_SOURCE" ]; then
  cp "$APK_SOURCE" "builds/nails-by-mamta.apk"
  echo "============================================="
  echo "🎉 SUCCESS!"
  echo "📱 Your APK is ready: builds/nails-by-mamta.apk"
  echo "============================================="
else
  echo "❌ Error: Could not find compiled APK at $APK_SOURCE"
  exit 1
fi
