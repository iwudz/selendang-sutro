# Android Build Guide - Selendang Sutro

This project is configured to build as an Android native app using Capacitor.js.

## Prerequisites

1. **Java Development Kit (JDK) 17+**
   ```bash
   java -version
   ```

2. **Android Studio** (with SDK and command-line tools)
   - Install from: https://developer.android.com/studio
   - Set ANDROID_HOME environment variable

3. **Gradle** (included in Android Studio)

## Quick Start

### 1. Build and Sync to Android

```bash
npm run android:build
```

This will:
- Build the React app (`npm run build`)
- Sync web assets to Android project

### 2. Open Android Studio

```bash
npm run android:open
```

Or manually open the `android/` folder in Android Studio.

### 3. Build APK from Android Studio

1. Open **Build** menu
2. Select **Build Bundle(s) / APK(s)**
3. Choose **Build APK(s)**
4. APK will be generated at: `android/app/build/outputs/apk/debug/`

## Commands Reference

| Command | Description |
|---------|-------------|
| `npm run android:build` | Build web + sync to Android |
| `npm run android:open` | Open project in Android Studio |
| `npm run android:build-apk` | Build APK via command line |

## Build APK via Command Line

```bash
cd android
./gradlew assembleDebug
```

APK Output: `android/app/build/outputs/apk/debug/app-debug.apk`

## Debug APK Location

```
android/
└── app/
    └── build/
        └── outputs/
            └── apk/
                └── debug/
                    └── app-debug.apk
```

## Release APK (for Play Store)

1. Generate a signed APK:
   - In Android Studio: **Build > Generate Signed Bundle/APK**
   - Create a keystore (or use existing one)
   - Fill in keystore credentials

2. Or via command line:
   ```bash
   cd android
   ./gradlew assembleRelease
   ```

## Environment Setup

### Windows
```bash
set JAVA_HOME=C:\Program Files\Android\Android Studio\jbr
set ANDROID_HOME=C:\Users\%USERNAME%\AppData\Local\Android\Sdk
set PATH=%PATH%;%ANDROID_HOME%\cmdline-tools\latest\bin;%ANDROID_HOME%\platform-tools
```

### Linux/macOS
```bash
export JAVA_HOME=/usr/lib/jvm/java-17-openjdk-amd64
export ANDROID_HOME=$HOME/Android/Sdk
export PATH=$PATH:$ANDROID_HOME/cmdline-tools/latest/bin:$ANDROID_HOME/platform-tools
```

## Troubleshooting

### "ANDROID_HOME not set"
- Set environment variable pointing to Android SDK

### "Gradle sync failed"
- Open Android Studio and let it download Gradle
- Or manually set Gradle version in `android/gradle/wrapper/gradle-wrapper.properties`

### "Permission denied" (Linux/Mac)
```bash
chmod +x android/gradlew
```

### Network Security Error
If Supabase doesn't load, check `android/app/src/main/res/xml/network_security_config.xml` has your domain configured.

## Project Structure

```
ssutro/
├── android/                    # Android native project
│   ├── app/
│   │   ├── src/main/
│   │   │   ├── java/          # Java/Kotlin code
│   │   │   ├── res/           # Android resources
│   │   │   └── AndroidManifest.xml
│   │   └── build.gradle
│   ├── build.gradle
│   └── settings.gradle
├── src/                        # React source code
├── dist/                        # Built web assets
└── capacitor.config.ts         # Capacitor configuration
```

## Notes

- This is a web-based app wrapped as native Android
- Uses Supabase for backend (configure credentials in `.env`)
- All features work the same as in browser
- Installable as PWA (Progressive Web App)
