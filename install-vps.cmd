@echo off
setlocal EnableExtensions

REM Convenience launcher from repo root. Prefer scripts\install-vps.bat;
REM if this file was copied into the same folder as the installer, call it directly
REM (avoids Desktop\scripts\scripts\... nesting).

cd /d "%~dp0"

if exist "%~dp0install-vps.bat" if /I not "%~nx0"=="install-vps.bat" (
    call "%~dp0install-vps.bat" %*
    exit /b %ERRORLEVEL%
)

if exist "%~dp0scripts\install-vps.bat" (
    call "%~dp0scripts\install-vps.bat" %*
    exit /b %ERRORLEVEL%
)

echo [ERROR] Cannot find install-vps.bat beside this file or under scripts\
echo Put install-vps.bat and install-vps.ps1 in the same flat folder.
exit /b 1
