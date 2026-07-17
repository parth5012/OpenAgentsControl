@echo off
:: Run this script as Administrator AFTER closing the Omniroute dashboard.
:: It replaces C:\Users\DELL\.omniroute with a symlink to the project's .omniroute folder.
:: Changes made via the dashboard will write directly into this project directory.

echo === Omniroute Config Symlink Setup ===
echo.

:: Check admin
net session >nul 2>&1
if %errorLevel% neq 0 (
    echo ERROR: Run this script as Administrator.
    echo Right-click ^> "Run as administrator"
    pause
    exit /b 1
)

set "LINK=%USERPROFILE%\.omniroute"
set "TARGET=D:\work\projects\OpenCode Setup\.omniroute"

echo Link:   %LINK%
echo Target: %TARGET%
echo.

:: Check target exists
if not exist "%TARGET%" (
    echo ERROR: Target does not exist: %TARGET%
    pause
    exit /b 1
)

:: Check if already a symlink
dir "%LINK%" 2>nul | findstr /C:"SYMLINKD" >nul
if %errorLevel% equ 0 (
    echo Already a symlink. Nothing to do.
    pause
    exit /b 0
)

:: Backup existing directory
if exist "%LINK%" (
    echo Backing up existing config to %LINK%.backup ...
    if exist "%LINK%.backup" (
        echo Removing old backup...
        rmdir /s /q "%LINK%.backup"
    )
    rename "%LINK%" ".omniroute.backup"
    if exist "%LINK%" (
        echo ERROR: Could not rename %LINK%
        echo Close the Omniroute dashboard and any processes using this directory.
        echo Then try again.
        pause
        exit /b 1
    )
    echo Backup created at %USERPROFILE%\.omniroute.backup
)

:: Create symlink
echo Creating symlink...
mklink /D "%LINK%" "%TARGET%"

if %errorLevel% equ 0 (
    echo.
    echo SUCCESS: Symlink created.
    echo %LINK% --^> %TARGET%
    echo.
    echo Dashboard changes will now be saved to the project directory.
    echo Your backup is at %USERPROFILE%\.omniroute.backup
) else (
    echo.
    echo FAILED: Could not create symlink.
    echo Restoring backup...
    rename "%USERPROFILE%\.omniroute.backup" ".omniroute"
    echo Try enabling Developer Mode in Windows Settings.
)

echo.
pause
