@echo off
setlocal EnableExtensions EnableDelayedExpansion

REM ============================================================================
REM  Akili - Windows VPS installer (single entry point)
REM
REM  Run this file only. It launches install-vps.ps1 beside it.
REM  Keep install-vps.bat and install-vps.ps1 in the SAME flat folder.
REM  Do NOT nest copies like Desktop\scripts\scripts\scripts\...
REM
REM  Usage:
REM    install-vps.bat                 Full install
REM    install-vps.bat resume          Continue after a failed/partial install
REM    install-vps.bat update          Pull, rebuild, migrate, restart
REM    install-vps.bat start           Start server + collector
REM    install-vps.bat stop            Stop Akili processes only
REM    install-vps.bat scan            Occupancy report only (no changes)
REM    install-vps.bat /Y              Skip confirmation when other apps found
REM    install-vps.bat update /Y       Combine mode + skip confirm
REM
REM  Edit the configuration block below before first run on your VPS.
REM ============================================================================

REM Capture script dir BEFORE any SHIFT (shift overwrites %0 / %~dp0).
REM NEVER append another scripts\ segment — ps1 must sit next to this bat.
set "SCRIPT_DIR=%~dp0"
set "PS_SCRIPT=%SCRIPT_DIR%install-vps.ps1"

set "REPO_URL=https://github.com/BQI-TECH/AccelaNova"
set "REPO_BRANCH=main"
REM Existing installs on C:\Akili: set INSTALL_DIR=C:\Akili (no migration required).
set "INSTALL_DIR=C:\Akili"
set "SERVER_PORT=3001"
set "COLLECTOR_PORT=8888"
set "VITE_API_BASE=/api"
set "MIN_NODE_MAJOR=18"

REM CLONE_DEPTH=1 shallow (fast/reliable on VPS). Use 0 for full git history.
set "CLONE_DEPTH=1"
set "CLONE_RETRIES=3"

set "CLONE_IF_MISSING=true"
set "SKIP_CLONE=false"
set "INSTALL_DEPS=true"
set "BUILD_FRONTEND=true"
set "RUN_MIGRATIONS=true"
set "START_AFTER_INSTALL=true"
set "EXPOSE_FIREWALL=false"
set "INSTALL_AS_SERVICE=false"
set "YES_ARG=false"

set "NSSM_PATH=C:\Tools\nssm\nssm.exe"
set "SERVICE_NAME=Akili"
set "SERVICE_DISPLAY=Akili AI Server"

set "MODE=install"

:ParseArgs
if "%~1"=="" goto :ArgsDone
if /I "%~1"=="install" set "MODE=install" & shift & goto :ParseArgs
if /I "%~1"=="resume"  set "MODE=resume"  & shift & goto :ParseArgs
if /I "%~1"=="update"  set "MODE=update"  & shift & goto :ParseArgs
if /I "%~1"=="start"   set "MODE=start"   & shift & goto :ParseArgs
if /I "%~1"=="stop"    set "MODE=stop"    & shift & goto :ParseArgs
if /I "%~1"=="scan"    set "MODE=scan"    & shift & goto :ParseArgs
if /I "%~1"=="/Y"      set "YES_ARG=true" & shift & goto :ParseArgs
if /I "%~1"=="-Y"      set "YES_ARG=true" & shift & goto :ParseArgs
if /I "%~1"=="--yes"   set "YES_ARG=true" & shift & goto :ParseArgs
if /I "%~1"=="help"    goto :ShowHelp
if /I "%~1"=="/?"      goto :ShowHelp
if /I "%~1"=="-h"      goto :ShowHelp
if /I "%~1"=="--help"  goto :ShowHelp
echo [ERROR] Unknown argument: %~1
echo Run "%~nx0 help" for usage.
exit /b 1

:ArgsDone

REM Warn if this bat lives under a nested scripts\scripts path (broken Desktop copy).
echo %SCRIPT_DIR% | findstr /I /C:"\scripts\scripts\" >nul
if not errorlevel 1 (
    echo [WARN] Nested scripts path detected:
    echo        %SCRIPT_DIR%
    echo Copy install-vps.bat and install-vps.ps1 into ONE flat folder and re-run.
    echo.
)

if not exist "%PS_SCRIPT%" (
    echo [ERROR] Missing companion script:
    echo         %PS_SCRIPT%
    echo Both install-vps.bat and install-vps.ps1 must stay in the same folder.
    echo.
    pause
    exit /b 1
)

where powershell >nul 2>&1
if errorlevel 1 (
    echo [ERROR] powershell.exe not found on PATH.
    pause
    exit /b 1
)

echo.
echo Akili VPS installer
echo   Mode: %MODE%
echo   Dir:  %INSTALL_DIR%
echo   Branch: %REPO_BRANCH%  Depth: %CLONE_DEPTH%  Retries: %CLONE_RETRIES%
echo   Script: %PS_SCRIPT%
echo.

REM Pass true/false as quoted strings. ps1 params are [string], converted with ConvertTo-BoolFlag.
REM Never use -Flag:true or [switch]/[bool] from cmd — PowerShell rejects "true" for SwitchParameter.
powershell.exe -NoLogo -NoProfile -ExecutionPolicy Bypass -File "%PS_SCRIPT%" ^
  -Mode "%MODE%" ^
  -RepoUrl "%REPO_URL%" ^
  -RepoBranch "%REPO_BRANCH%" ^
  -InstallDir "%INSTALL_DIR%" ^
  -ServerPort %SERVER_PORT% ^
  -CollectorPort %COLLECTOR_PORT% ^
  -ViteApiBase "%VITE_API_BASE%" ^
  -MinNodeMajor %MIN_NODE_MAJOR% ^
  -CloneDepth %CLONE_DEPTH% ^
  -CloneRetries %CLONE_RETRIES% ^
  -CloneIfMissing "%CLONE_IF_MISSING%" ^
  -SkipClone "%SKIP_CLONE%" ^
  -InstallDeps "%INSTALL_DEPS%" ^
  -BuildFrontend "%BUILD_FRONTEND%" ^
  -RunMigrations "%RUN_MIGRATIONS%" ^
  -StartAfterInstall "%START_AFTER_INSTALL%" ^
  -ExposeFirewall "%EXPOSE_FIREWALL%" ^
  -InstallAsService "%INSTALL_AS_SERVICE%" ^
  -Yes "%YES_ARG%" ^
  -NssmPath "%NSSM_PATH%" ^
  -ServiceName "%SERVICE_NAME%" ^
  -ServiceDisplay "%SERVICE_DISPLAY%"

set "EXIT_CODE=!ERRORLEVEL!"

if not "!EXIT_CODE!"=="0" (
    echo.
    echo [ERROR] Installer exited with code !EXIT_CODE!
    echo Check logs under %%TEMP%%\Akili-install-logs\ ^(pre-clone^) or %INSTALL_DIR%\logs\
    echo If clone failed: delete %INSTALL_DIR% and re-run, or let the installer clear a partial clone.
echo Private repo? Use gh auth login, a PAT in REPO_URL, or an SSH deploy key.
    echo.
    pause
    exit /b !EXIT_CODE!
)

if /I not "%MODE%"=="start" if /I not "%MODE%"=="stop" if /I not "%MODE%"=="scan" (
    echo.
    echo Press any key to exit...
    pause >nul
)
exit /b 0

:ShowHelp
echo Akili Windows VPS installer
echo.
echo Usage:
echo   %~nx0              Fresh install / first-time setup
echo   %~nx0 resume       Resume after a failed or partial install
echo   %~nx0 update       Pull, rebuild, migrate, restart
echo   %~nx0 start        Start server and collector
echo   %~nx0 stop         Stop Akili node processes only
echo   %~nx0 scan         Print VPS occupancy report ^(no changes^)
echo   %~nx0 /Y           Skip confirmation when other apps are found
echo   %~nx0 resume /Y    Resume without confirmation prompt
echo   %~nx0 update /Y    Update without confirmation prompt
echo.
echo Configuration is at the top of this .bat file.
echo Logic lives in install-vps.ps1 ^(must stay beside this file^).
echo.
echo Coexistence:
echo   - Scans ports 80,443,3000,3001,8080,8888 + configured ports
echo   - Remaps SERVER_PORT/COLLECTOR_PORT if owned by another app
echo   - Never kills processes outside INSTALL_DIR
echo   - Never stops IIS/nginx/Apache
echo   - EXPOSE_FIREWALL=false by default; never opens 80/443
exit /b 0
