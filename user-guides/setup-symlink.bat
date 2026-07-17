@echo off
:: Run this script as Administrator AFTER closing all opencode processes.
:: It replaces C:\Users\DELL\.config\opencode with a symlink to the project .opencode folder.

echo === OpenCode Config Symlink Setup ===
echo.

:: Check admin
net session >nul 2>&1
if %errorLevel% neq 0 (
    echo ERROR: Run this script as Administrator.
    echo Right-click ^> "Run as administrator"
    pause
    exit /b 1
)

set "LINK=C:\Users\DELL\.config\opencode"
set "TARGET=D:\work\projects\OpenCode Setup\.opencode"

echo Link:   %LINK%
echo Target: %TARGET%
echo.

:: Check target exists
if not exist "%TARGET%" (
    echo ERROR: Target does not exist: %TARGET%
    pause
    exit /b 1
)

:: Remove existing directory (must not be locked)
if exist "%LINK%" (
    echo Removing existing directory...
    rmdir "%LINK%" 2>nul
    if exist "%LINK%" (
        echo ERROR: Could not remove %LINK%
        echo Make sure all opencode processes are closed first.
        echo Run: taskkill /f /im opencode.exe
        pause
        exit /b 1
    )
)

:: Create symlink
echo Creating symlink...
mklink /D "%LINK%" "%TARGET%"

if %errorLevel% equ 0 (
    echo.
    echo SUCCESS: Symlink created.
    echo %LINK% --^> %TARGET%
) else (
    echo.
    echo FAILED: Could not create symlink.
    echo Try enabling Developer Mode in Windows Settings.
)

echo.
pause
