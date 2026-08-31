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
REM    install-vps.bat                 Full install (syncs + skips done steps if repo exists)
REM    install-vps.bat resume          Continue after a failed/partial install (syncs git, skips done steps)
REM    install-vps.bat update          Pull, rebuild, migrate, restart
REM    install-vps.bat start           Start server + collector (stops existing Akili on SERVER_PORT/COLLECTOR_PORT first)
REM    install-vps.bat start --sync    Fetch remote; pull only if behind, then start
REM    install-vps.bat start --pull    Pull latest (force if diverged), then start
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
REM Default install path. Legacy VPS installs at C:\Accelanova are auto-renamed to
REM INSTALL_DIR when AUTO_MIGRATE_LEGACY_DIR=true (default). Set false to disable.
set "INSTALL_DIR=C:\Akili"
set "AUTO_MIGRATE_LEGACY_DIR=true"
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

REM PULL_ON_START: false = never | check = pull when behind origin | always = pull every start
REM CLI: start --sync sets check; start --pull sets always (+ force on diverged)
set "PULL_ON_START=false"
REM PULL_IF_REPO_EXISTS: false = never | check = pull when behind | always = pull every time
REM Used when install/resume/update finds an existing repo at INSTALL_DIR (default: check)
set "PULL_IF_REPO_EXISTS=check"
REM PULL_FAIL_POLICY: continue = warn and use local code on fetch/pull failure | fail = abort install
set "PULL_FAIL_POLICY=continue"
set "REBUILD_ON_PULL=false"
set "PULL_FORCE=false"

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
if /I "%~1"=="--pull"  set "PULL_ON_START=always" & set "PULL_FORCE=true" & shift & goto :ParseArgs
if /I "%~1"=="/PULL"   set "PULL_ON_START=always" & set "PULL_FORCE=true" & shift & goto :ParseArgs
if /I "%~1"=="--sync"  set "PULL_ON_START=check"  & shift & goto :ParseArgs
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
echo   Auto-migrate legacy: %AUTO_MIGRATE_LEGACY_DIR%
echo   Branch: %REPO_BRANCH%  Depth: %CLONE_DEPTH%  Retries: %CLONE_RETRIES%
if /I "%MODE%"=="start" echo   Pull on start: %PULL_ON_START%  Rebuild on pull: %REBUILD_ON_PULL%
if /I not "%MODE%"=="start" if /I not "%MODE%"=="stop" if /I not "%MODE%"=="scan" echo   Pull if repo exists: %PULL_IF_REPO_EXISTS%  On sync failure: %PULL_FAIL_POLICY%
echo   Script: %PS_SCRIPT%
echo.

REM Pass true/false as quoted strings. ps1 params are [string], converted with ConvertTo-BoolFlag.
REM Never use -Flag:true or [switch]/[bool] from cmd — PowerShell rejects "true" for SwitchParameter.
powershell.exe -NoLogo -NoProfile -ExecutionPolicy Bypass -File "%PS_SCRIPT%" ^
  -Mode "%MODE%" ^
  -RepoUrl "%REPO_URL%" ^
  -RepoBranch "%REPO_BRANCH%" ^
  -InstallDir "%INSTALL_DIR%" ^
  -AutoMigrateLegacyDir "%AUTO_MIGRATE_LEGACY_DIR%" ^
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
  -PullOnStart "%PULL_ON_START%" ^
  -PullIfRepoExists "%PULL_IF_REPO_EXISTS%" ^
  -PullFailPolicy "%PULL_FAIL_POLICY%" ^
  -RebuildOnPull "%REBUILD_ON_PULL%" ^
  -PullForce "%PULL_FORCE%" ^
  -NssmPath "%NSSM_PATH%" ^
  -ServiceName "%SERVICE_NAME%" ^
  -ServiceDisplay "%SERVICE_DISPLAY%"

set "EXIT_CODE=!ERRORLEVEL!"

if not "!EXIT_CODE!"=="0" (
    echo.
    echo [ERROR] Installer exited with code !EXIT_CODE!
    echo Check logs under %%TEMP%%\Akili-install-logs\ ^(pre-clone^) or %INSTALL_DIR%\logs\
    echo If clone failed: delete %INSTALL_DIR% and re-run, or let the installer clear a partial clone.
    echo If git sync failed: set PULL_IF_REPO_EXISTS=false and re-run, or use install-vps.bat start
    echo Private repo options:
    echo   git config credential.helper manager
    echo   gh auth login
    echo   Or set REPO_URL=https://TOKEN@github.com/BQI-TECH/AccelaNova.git
    echo   Or use SSH: git@github.com:BQI-TECH/AccelaNova.git
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
echo   %~nx0              Install ^(syncs git + skips done steps if repo exists^)
echo   %~nx0 resume       Resume after a failed or partial install ^(syncs git, skips done steps^)
echo   %~nx0 update       Pull, rebuild, migrate, restart ^(full update^)
echo   %~nx0 start        Start server and collector
echo   %~nx0 start --sync Fetch remote; pull if behind, then start
echo   %~nx0 start --pull Pull latest before start ^(force if diverged^)
echo   %~nx0 stop         Stop Akili node processes only
echo   %~nx0 scan         Print VPS occupancy report ^(no changes^)
echo   %~nx0 /Y           Skip confirmation when other apps are found
echo   %~nx0 resume /Y    Resume with git sync, skip confirmation prompt
echo   %~nx0 update /Y    Full update without confirmation prompt
echo.
echo Configuration is at the top of this .bat file.
echo   INSTALL_DIR=C:\Akili              Default install root
echo   AUTO_MIGRATE_LEGACY_DIR=true      Rename C:\Accelanova -^> INSTALL_DIR when found
echo   PULL_IF_REPO_EXISTS=false^|check^|always  Git sync when repo already exists ^(default: check^)
echo   PULL_FAIL_POLICY=continue^|fail           On fetch/pull failure during sync ^(default: continue^)
echo   PULL_ON_START=false^|check^|always  Git sync before start ^(default: false^)
echo   REBUILD_ON_PULL=true^|false         After pull: deps/build/migrate ^(default: false^)
echo.
echo Workarounds when git sync fails but local code is fine:
echo   install-vps.bat start                  Starts without git sync ^(PULL_ON_START=false default^)
echo   Set PULL_IF_REPO_EXISTS=false          Skips sync on install/resume
echo Logic lives in install-vps.ps1 ^(must stay beside this file^).
echo.
echo Coexistence:
echo   - Scans ports 80,443,3000,3001,8080,8888 + configured ports
echo   - Remaps SERVER_PORT/COLLECTOR_PORT if owned by another app
echo   - Never kills processes outside INSTALL_DIR
echo   - Never stops IIS/nginx/Apache
echo   - EXPOSE_FIREWALL=false by default; never opens 80/443
exit /b 0
