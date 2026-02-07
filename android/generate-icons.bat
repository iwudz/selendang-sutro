@echo off
REM Android Icon Generator for Selendang Sutro
REM Requires ImageMagick or any image editor

echo ========================================
echo Android Icon Generator - Selendang Sutro
echo ========================================
echo.

REM Check if icon source exists
if not exist "..\android\app\src\main\res\drawable\ic_launcher_foreground_custom.svg" (
    echo ERROR: SVG icon not found!
    echo Please create: android/app/src/main/res/drawable/ic_launcher_foreground_custom.svg
    pause
    exit /b 1
)

echo Icon file found: ic_launcher_foreground_custom.svg
echo.

REM Required sizes for Android
set SIZES=48 72 96 144 192

echo Generating PNG icons...
echo.

for %%s in (%SIZES%) do (
    echo Converting to mipmap-mdpi/ic_launcher_%%s.png
    convert -background none -resize %%sx%%s ../android/app/src/main/res/drawable/ic_launcher_foreground_custom.svg ../android/app/src/main/res/mipmap-mdpi/ic_launcher_%%s.png 2>nul
    convert -background none -resize %%sx%%s ../android/app/src/main/res/drawable/ic_launcher_foreground_custom.svg ../android/app/src/main/res/mipmap-mdpi/ic_launcher_round_%%s.png 2>nul
)

for %%s in (%SIZESES%) do (
    for %%d in (hdpi xhdpi xxhdpi xxxhdpi) do (
        echo Converting to mipmap-%%d/ic_launcher_%%s.png
    )
)

echo.
echo ========================================
echo Icon generation complete!
echo.
echo Next steps:
echo 1. Copy mipmap files to their respective folders
echo 2. Or use Android Studio: Right-click res folder > New > Image Asset
echo ========================================
pause
