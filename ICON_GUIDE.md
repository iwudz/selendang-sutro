# Icon Generator Guide - Selendang Sutro

## Quick Method: Use Android Studio (Recommended)

### Step 1: Open Android Studio
```bash
npm run android:open
```

### Step 2: Generate Icons via Android Studio
1. Right-click on `android/app/src/main/res` folder
2. Select **New > Image Asset**
3. Choose **Launcher Icons (Adaptive and Legacy)**
4. Configure as below:

```
Path:     Select the SVG file below:
Foreground Layer: android/app/src/main/res/drawable/ic_launcher_foreground_custom.svg
Background Layer: Create with Color: #059669 (Emerald Green)
```

### Step 3: Click Next > Finish

---

## Manual Method: Create PNG Icons

### Required Sizes (mdpi to xxxhdpi)

| Density | Size | Folder |
|---------|------|--------|
| mdpi    | 48x48 | `mipmap-mdpi/` |
| hdpi    | 72x72 | `mipmap-hdpi/` |
| xhdpi   | 96x96 | `mipmap-xhdpi/` |
| xxhdpi  | 144x144 | `mipmap-xxhdpi/` |
| xxxhdpi | 192x192 | `mipmap-xxxhdpi/` |

### Files to Create (both round and regular):

```
mipmap-mdpi/ic_launcher.png
mipmap-mdpi/ic_launcher_round.png
mipmap-hdpi/ic_launcher.png
mipmap-hdpi/ic_launcher_round.png
mipmap-xhdpi/ic_launcher.png
mipmap-xhdpi/ic_launcher_round.png
mipmap-xxhdpi/ic_launcher.png
mipmap-xxhdpi/ic_launcher_round.png
mipmap-xxxhdpi/ic_launcher.png
mipmap-xxxhdpi/ic_launcher_round.png
```

---

## Online Tools (No Installation Required)

Use these free tools to convert SVG to PNG:

### 1. **SVG to PNG Converter**
- https://svgtopng.com/
- Upload: `android/app/src/main/res/drawable/ic_launcher_foreground_custom.svg`
- Download all sizes

### 2. **Android Icon Generator**
- https://appicon.co/
- Upload your logo
- Download all Android sizes at once

### 3. **Favicon.io**
- https://favicon.io/
- Upload your icon
- Download "Android" sized icons

---

## Current Icon Files

Our custom icon is already configured:
- ✅ `android/app/src/main/res/drawable/ic_launcher_foreground_custom.svg`
- ✅ `android/app/src/main/res/drawable/ic_launcher_background_custom.xml`
- ✅ `android/app/src/main/res/mipmap-anydpi-v26/ic_launcher.xml`
- ✅ `android/app/src/main/res/mipmap-anydpi-v26/ic_launcher_round.xml`

## After Creating PNGs

1. Copy generated PNGs to respective `mipmap-*` folders
2. Rebuild: `npm run android:build`
3. APK ready at: `android/app/build/outputs/apk/debug/app-debug.apk`

---

## Icon Design

The icon features:
- **Background**: Emerald green gradient (#059669 → #047857)
- **Foreground**: White "S" letter (Selendang Sutra)
- **Decoration**: Fork and spoon icon

![Icon Preview](data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxMDggMTA4Ij4KICA8IS0tIEJhY2tncm91bmQgQ2lyY2xlIC0tPgogIDxkZWZzPgogICAgPGxpbmVhckdyYWRpZW50IGlkPSJiZ0dyYWQiIHgxPSIwJSIgeTE9IjAlIiB4Mj0iMTAwJSIgeTI9IjEwMCUiPgogICAgICA8c3RvcCBvZmZzZXQ9IjAlIiBzdHlsZT0ic3RvcC1jb2xvcjojMDU5NjY5O3N0b3Atb3BhY2l0eToxIiAvPgogICAgICA8c3RvcCBvZmZzZXQ9IjEwMCUiIHN0eWxlPSJzdG9wLWNvbG9yOiMwNDc4NTc7c3RvcC1vcGFjaXR5OjEiIC8+CiAgICA8L2xpbmVhckdyYWRpZW50PgogIDwvZGVmcz4KICA8IS0tIEJhY2tncm91bmQgLS0+CiAgPGNpcmNsZSBjeD0iNTQiIGN5PSI1NCIgcj0iNTQiIGZpbGw9InVybCgjYmFHcmFkKSIvPgogIDwhLS0gIlMiIExldHRlciAtLT4KICA8dGV4dCB4PSI1NCIgeT0iNjgiIGZvbnQtZmFtaWx5PSJBcmlhbCBCbGFjaywgQXJpYWwsIHNhbnMtc2VyaWYiIGZvbnQtc2l6ZT0iNTIiIGZvbnQtd2VpZ2h0PSI5MDAiIGZpbGw9IiNmZmZmZmYiIHRleHQtYW5jaG9yPSJtaWRkbGUiPjwvdGV4dD4KICA8IS0tIFV0ZW5zaWxzIC0tPgogIDxnIHRyYW5zZm9ybT0idHJhbnNsYXRlKDIwLDQwKSIgb3BhY2l0eT0iMC45Ij4KICAgIDwhLS0gU3Bvb24gLS0+CiAgICA8ZWxsaXBzZSBjeD0iMTUiIGN5PSI4IiByeD0iNSIgc3J5PSI4IiBmaWxsPSIjZmZmZmZmIi8+CiAgICA8bGluZSB4MT0iMTUiIHkxPSIxNiIgeDI9IjE1IiB5Mj0iNDUiIHN0cm9rZT0iI2ZmZmZmZiIgc3Ryb2tlLXdpZHRoPSIzIiBzdHJva2UtbGluZWNhcD0icm91bmQiLz4KCiAgICA8IS0tIEZvcmsgLS0+CiAgICA8cGF0aCBkPSJNNzUgOCBMNzUgNDIgTTM1IDggUTM1IDUgNDAgNSBRNDUgNSA0NSA4IEw0NSAxNCBNMzUgMTggTTM1IDQyIE00MCAxOCBMNDAgNDIgTTQ1IDE4IEw0NSIgc3Ryb2tlPSIjZmZmZmZmIiBzdHJva2Utd2lkdGg9IjMiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWpvaW4PSJyb3VuZCIgZmlsbD0ibm9uZSIvPgogIDwvZz4KPC9zdmc+)