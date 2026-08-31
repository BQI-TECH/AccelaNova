#Requires -Version 5.1
<#
.SYNOPSIS
  Akili Windows VPS bare-metal installer / updater.
.DESCRIPTION
  Implements BARE_METAL.md production flow with VPS occupancy checks so Akili
  coexists with IIS, nginx, Apache, and other Node apps. Never kills processes outside
  InstallDir. Never stops IIS/nginx/Apache. Default: no firewall changes for 80/443.
.PARAMETER Mode
  install | resume | update | start | stop | scan
.PARAMETER PullOnStart
  false | check | always — git sync before start (default false). check pulls only when behind origin.
.PARAMETER PullIfRepoExists
  false | check | always — git sync when install/resume/update finds an existing repo (default check).
.PARAMETER RebuildOnPull
  When true and a pull occurred during start, run deps/build/migrate before starting services.
.PARAMETER PullForce
  When true, attempt pull even if the repo has diverged from origin (set by start --pull).
.PARAMETER PullFailPolicy
  continue | fail — when git fetch/pull fails during install/resume/start sync (default continue).
  continue logs a warning and proceeds with local code; fail aborts the installer.
.NOTES
  Keep this file beside install-vps.bat. The .bat is the only entry point operators run.
  Default InstallDir is C:\Akili. Legacy VPS installs at C:\Accelanova are auto-migrated
  to InstallDir when AUTO_MIGRATE_LEGACY_DIR=true (default in install-vps.bat).
#>
[CmdletBinding()]
param(
    [ValidateSet('install', 'resume', 'update', 'start', 'stop', 'scan')]
    [string]$Mode = 'install',

    [string]$RepoUrl = 'https://github.com/BQI-TECH/AccelaNova',
    [string]$RepoBranch = 'main',
    [string]$InstallDir = 'C:\Akili',
    [int]$ServerPort = 3001,
    [int]$CollectorPort = 8888,
    [string]$ViteApiBase = '/api',
    [int]$MinNodeMajor = 18,

    # CloneDepth: 1 = shallow (default, reliable on VPS); 0 = full history.
    [int]$CloneDepth = 1,
    [int]$CloneRetries = 3,

    # true/false strings are safe from cmd.exe (avoid [bool]/[switch] from .bat).
    [string]$CloneIfMissing = 'true',
    [string]$SkipClone = 'false',
    [string]$InstallDeps = 'true',
    [string]$BuildFrontend = 'true',
    [string]$RunMigrations = 'true',
    [string]$StartAfterInstall = 'true',
    [string]$ExposeFirewall = 'false',
    [string]$InstallAsService = 'false',
    [string]$Yes = 'false',

    # PullOnStart: false | check | always — git sync before start mode only.
    [string]$PullOnStart = 'false',
    # PullIfRepoExists: false | check | always — git sync when repo already at InstallDir (install/resume/update).
    [string]$PullIfRepoExists = 'check',
    [string]$RebuildOnPull = 'false',
    [string]$PullForce = 'false',
    [string]$PullFailPolicy = 'continue',

    [string]$NssmPath = 'C:\Tools\nssm\nssm.exe',
    [string]$ServiceName = 'Akili',
    [string]$ServiceDisplay = 'Akili AI Server',

    # When true, rename C:\Accelanova (and other known legacy paths) into InstallDir.
    [string]$AutoMigrateLegacyDir = 'true'
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

function ConvertTo-BoolFlag([string]$Value) {
    if ([string]::IsNullOrWhiteSpace($Value)) { return $false }
    return @('1', 'true', 'yes', 'y', 'on') -contains ($Value.Trim().ToLowerInvariant())
}

function Resolve-PullOnStartMode {
    param([string]$Value)
    if ([string]::IsNullOrWhiteSpace($Value)) { return 'false' }
    switch ($Value.Trim().ToLowerInvariant()) {
        { $_ -in @('false', '0', 'no', 'off', 'never') } { return 'false' }
        { $_ -in @('check', 'sync', 'auto', 'if-needed', 'ifneeded') } { return 'check' }
        { $_ -in @('true', 'always', '1', 'yes', 'on', 'pull') } { return 'always' }
        default { return 'false' }
    }
}

function Resolve-PullFailPolicy {
    param([string]$Value)
    if ([string]::IsNullOrWhiteSpace($Value)) { return 'continue' }
    switch ($Value.Trim().ToLowerInvariant()) {
        { $_ -in @('fail', 'stop', 'error', 'abort') } { return 'fail' }
        default { return 'continue' }
    }
}

# Convert bat-passed "true"/"false" strings once; never use [switch]/[bool] from cmd.exe.
$script:Flags = @{
    CloneIfMissing    = ConvertTo-BoolFlag $CloneIfMissing
    SkipClone         = ConvertTo-BoolFlag $SkipClone
    InstallDeps       = ConvertTo-BoolFlag $InstallDeps
    BuildFrontend     = ConvertTo-BoolFlag $BuildFrontend
    RunMigrations     = ConvertTo-BoolFlag $RunMigrations
    StartAfterInstall = ConvertTo-BoolFlag $StartAfterInstall
    ExposeFirewall    = ConvertTo-BoolFlag $ExposeFirewall
    InstallAsService  = ConvertTo-BoolFlag $InstallAsService
    Yes               = ConvertTo-BoolFlag $Yes
    RebuildOnPull     = ConvertTo-BoolFlag $RebuildOnPull
    PullForce             = ConvertTo-BoolFlag $PullForce
    AutoMigrateLegacyDir  = ConvertTo-BoolFlag $AutoMigrateLegacyDir
    Resume                = ($Mode -eq 'resume')
}

$script:PullOnStartMode = Resolve-PullOnStartMode -Value $PullOnStart
$script:PullIfRepoExistsMode = Resolve-PullOnStartMode -Value $PullIfRepoExists
$script:PullFailPolicy = Resolve-PullFailPolicy -Value $PullFailPolicy
if ([string]::IsNullOrWhiteSpace($PullIfRepoExists) -and ($Mode -in @('install', 'resume', 'update'))) {
    $script:PullIfRepoExistsMode = 'check'
}

if ($script:Flags.Resume) {
    $script:Flags.SkipClone = $true
}

$script:ChosenServerPort = $ServerPort
$script:ChosenCollectorPort = $CollectorPort
$script:OtherAppsFound = $false
$script:PortConflictResolved = $false
$script:PortsResolvedThisRun = $false

# Normalize early so drive-root parents (C:\) never hit broken New-Item paths.
$InstallDir = [System.IO.Path]::GetFullPath($InstallDir.Trim().TrimEnd('\', '/'))

function Initialize-Directory {
    param([string]$Path)
    if ([string]::IsNullOrWhiteSpace($Path)) { return }
    $full = [System.IO.Path]::GetFullPath($Path.Trim().TrimEnd('\', '/'))
    # Drive roots (C:\) already exist; New-Item on them throws "path is not of a legal form".
    $root = [System.IO.Path]::GetPathRoot($full)
    if ($full.TrimEnd('\') -eq $root.TrimEnd('\')) { return }
    if (-not (Test-Path -LiteralPath $full)) {
        [void][System.IO.Directory]::CreateDirectory($full)
    }
}

# Log under TEMP until InstallDir is resolved (legacy migration may run first).
$script:LogDir = Join-Path $env:TEMP 'Akili-install-logs'
Initialize-Directory $script:LogDir

$RunStamp = Get-Date -Format 'yyyy-MM-dd_HH-mm-ss'
$script:LogFile = Join-Path $script:LogDir "install-$RunStamp.log"

function Move-InstallLogToInstallDir {
    $destDir = Join-Path $InstallDir 'logs'
    Initialize-Directory $destDir
    $destFile = Join-Path $destDir (Split-Path $script:LogFile -Leaf)
    try {
        if ((Test-Path -LiteralPath $script:LogFile) -and ($script:LogFile -ne $destFile)) {
            Copy-Item -LiteralPath $script:LogFile -Destination $destFile -Force -ErrorAction Stop
            $script:LogFile = $destFile
        }
    }
    catch {
        # Keep writing to TEMP if copy fails; install itself already succeeded.
    }
    $script:LogDir = $destDir
}

function Write-Log {
    param(
        [string]$Message,
        [ValidateSet('INFO', 'WARN', 'ERROR', 'STEP')][string]$Level = 'INFO'
    )
    $line = "[$(Get-Date -Format 'HH:mm:ss')] [$Level] $Message"
    try { Add-Content -Path $script:LogFile -Value $line -ErrorAction SilentlyContinue } catch { }
    switch ($Level) {
        'ERROR' { Write-Host $line -ForegroundColor Red }
        'WARN'  { Write-Host $line -ForegroundColor Yellow }
        'STEP'  { Write-Host "`n>> $Message" -ForegroundColor Cyan }
        default { Write-Host $line -ForegroundColor DarkGray }
    }
}

function Test-Command {
    param([string]$Name)
    return [bool](Get-Command $Name -ErrorAction SilentlyContinue)
}

function Get-ExitCode {
    if (Test-Path variable:global:LASTEXITCODE) {
        return [int]$global:LASTEXITCODE
    }
    return 0
}

function Write-CommandOutputLine {
    param([object]$Line)
    $text = if ($Line -is [System.Management.Automation.ErrorRecord]) {
        if ($Line.Exception -and $Line.Exception.Message) { $Line.Exception.Message }
        else { $Line.ToString() }
    }
    else {
        "$Line"
    }
    if ([string]::IsNullOrWhiteSpace($text)) { return }
    try { Add-Content -Path $script:LogFile -Value $text -ErrorAction SilentlyContinue } catch { }
    Write-Host $text -ForegroundColor DarkGray
}

function Invoke-Logged {
    param([string]$WorkDir, [string[]]$Command)
    if (-not $Command -or $Command.Count -lt 1) { throw 'Invoke-Logged requires a command' }
    Push-Location $WorkDir
    $prevEap = $ErrorActionPreference
    try {
        Write-Log ("Running in {0}: {1}" -f $WorkDir, ($Command -join ' '))
        # Native stderr (e.g. Browserslist warnings) must not terminate the script when exit code is 0.
        $ErrorActionPreference = 'Continue'
        if ($Command.Count -eq 1) {
            $output = & $Command[0] 2>&1
        }
        else {
            $output = & $Command[0] $Command[1..($Command.Count - 1)] 2>&1
        }
        # Capture exit code before pipeline consumers (e.g. ForEach-Object) reset $LASTEXITCODE.
        $code = Get-ExitCode
        if ($null -ne $output) {
            foreach ($line in @($output)) {
                Write-CommandOutputLine $line
            }
        }
        if ($code -ne 0) { throw "Command failed with exit code $code" }
    }
    finally {
        $ErrorActionPreference = $prevEap
        Pop-Location
    }
}

function Set-EnvKey {
    param([string]$Path, [string]$Key, [string]$Value)
    if (-not (Test-Path $Path)) { return }
    $lines = Get-Content $Path
    $out = @()
    $done = $false
    foreach ($line in $lines) {
        if ($line -match ("^\s*#?\s*" + [regex]::Escape($Key) + "\s*=")) {
            $out += ($Key + '="' + $Value + '"')
            $done = $true
        }
        else {
            $out += $line
        }
    }
    if (-not $done) { $out += ($Key + '="' + $Value + '"') }
    Set-Content -Path $Path -Value $out -Encoding UTF8
}

function Get-EnvKeyValue {
    param([string]$Path, [string]$Key)
    if (-not (Test-Path -LiteralPath $Path)) { return $null }
    foreach ($line in Get-Content -LiteralPath $Path) {
        if ($line -match ("^\s*#?\s*" + [regex]::Escape($Key) + "\s*=\s*(?:['""]?)([^'""\n#]*)(?:['""]?)\s*(?:#.*)?$")) {
            $val = $Matches[1].Trim()
            if ($val) { return $val }
        }
    }
    return $null
}

function Get-SqliteDatabaseUrl {
    param([string]$StorageDir)
    $storageFull = [System.IO.Path]::GetFullPath($StorageDir)
    Initialize-Directory $storageFull
    $candidates = @('akili.db', 'anythingllm.db', 'accelanova.db')
    $dbFile = Join-Path $storageFull $candidates[0]
    foreach ($name in $candidates) {
        $candidate = Join-Path $storageFull $name
        if (Test-Path -LiteralPath $candidate) {
            $dbFile = $candidate
            break
        }
    }
    $normalized = [System.IO.Path]::GetFullPath($dbFile).Replace('\', '/')
    return "file:$normalized"
}

function Test-DatabaseUrlNeedsRewrite {
    param(
        [string]$ExistingUrl,
        [string]$StorageDir
    )
    if ([string]::IsNullOrWhiteSpace($ExistingUrl)) { return $true }
    # Prefer absolute file: URLs under the install storage dir.
    if ($ExistingUrl -match '(?i)^file:\.\.?/') { return $true }
    if ($ExistingUrl -match '(?i)^file:storage/') { return $true }
    if ($ExistingUrl -notmatch '(?i)^file:') { return $false }

    $pathPart = $ExistingUrl -replace '(?i)^file:', ''
    # Relative or non-rooted Windows paths need rewrite.
    if ($pathPart -match '^[A-Za-z]:/') { return $false }
    if ($pathPart.StartsWith('/')) { return $false }
    return $true
}

function Ensure-DatabaseUrl {
    param([string]$ServerEnv, [string]$StorageDir)
    $existing = Get-EnvKeyValue -Path $ServerEnv -Key 'DATABASE_URL'
    if ($existing -and -not (Test-DatabaseUrlNeedsRewrite -ExistingUrl $existing -StorageDir $StorageDir)) {
        Write-Log "DATABASE_URL already set in server\.env ($existing)"
        return $existing
    }
    $dbUrl = Get-SqliteDatabaseUrl -StorageDir $StorageDir
    Set-EnvKey -Path $ServerEnv -Key 'DATABASE_URL' -Value $dbUrl
    if ($existing) {
        Write-Log "Rewrote DATABASE_URL from '$existing' to '$dbUrl'"
    }
    else {
        Write-Log "Set DATABASE_URL=$dbUrl"
    }
    return $dbUrl
}

function Ensure-ServerRuntimeEnv {
    # Make sure STORAGE_DIR + DATABASE_URL exist before node starts (install/update/start).
    $serverEnv = Join-Path $InstallDir 'server\.env'
    $storageDir = Join-Path $InstallDir 'server\storage'
    if (-not (Test-Path -LiteralPath $serverEnv)) {
        if (Test-Path -LiteralPath (Join-Path $InstallDir 'server\.env.example')) {
            Copy-Item (Join-Path $InstallDir 'server\.env.example') $serverEnv
            Write-Log 'Created server\.env from example (start path)'
        }
        else {
            throw "Missing server\.env at $serverEnv — run install/update first"
        }
    }
    Set-EnvKey -Path $serverEnv -Key 'STORAGE_DIR' -Value $storageDir
    $dbUrl = Ensure-DatabaseUrl -ServerEnv $serverEnv -StorageDir $storageDir
    Set-EnvKey -Path $serverEnv -Key 'SERVER_PORT' -Value "$($script:ChosenServerPort)"
    Set-EnvKey -Path $serverEnv -Key 'COLLECTOR_PORT' -Value "$($script:ChosenCollectorPort)"
    Initialize-Directory $storageDir
    return [pscustomobject]@{
        ServerEnv   = $serverEnv
        StorageDir  = $storageDir
        DatabaseUrl = $dbUrl
    }
}

function Test-PathUnderInstall {
    param([string]$Path)
    if ([string]::IsNullOrWhiteSpace($Path)) { return $false }
    try {
        $full = [System.IO.Path]::GetFullPath($Path)
        $root = [System.IO.Path]::GetFullPath($InstallDir).TrimEnd('\')
        return $full.StartsWith($root, [System.StringComparison]::OrdinalIgnoreCase)
    }
    catch {
        return $false
    }
}

function Get-ProcessPathSafe {
    param([int]$ProcessId)
    try {
        $p = Get-Process -Id $ProcessId -ErrorAction Stop
        if ($p.Path) { return $p.Path }
    }
    catch { }
    try {
        $cim = Get-CimInstance Win32_Process -Filter "ProcessId=$ProcessId" -ErrorAction SilentlyContinue
        if ($cim -and $cim.ExecutablePath) { return $cim.ExecutablePath }
        if ($cim -and $cim.CommandLine) { return $cim.CommandLine }
    }
    catch { }
    return ''
}

function Get-ListeningPortMap {
    $map = @{}
    try {
        $conns = Get-NetTCPConnection -State Listen -ErrorAction Stop
        foreach ($c in $conns) {
            $port = [int]$c.LocalPort
            if (-not $map.ContainsKey($port)) {
                $map[$port] = [System.Collections.Generic.List[object]]::new()
            }
            $map[$port].Add([pscustomobject]@{
                Pid  = [int]$c.OwningProcess
                Addr = $c.LocalAddress
            })
        }
    }
    catch {
        Write-Log 'Get-NetTCPConnection unavailable; falling back to netstat' 'WARN'
        $raw = netstat -ano -p tcp 2>$null
        foreach ($line in $raw) {
            if ($line -notmatch 'LISTENING') { continue }
            $parts = ($line -split '\s+') | Where-Object { $_ -ne '' }
            if ($parts.Count -lt 5) { continue }
            $local = $parts[1]
            $procId = 0
            [void][int]::TryParse($parts[-1], [ref]$procId)
            if ($local -match ':(\d+)$') {
                $port = [int]$Matches[1]
                if (-not $map.ContainsKey($port)) {
                    $map[$port] = [System.Collections.Generic.List[object]]::new()
                }
                $map[$port].Add([pscustomobject]@{ Pid = $procId; Addr = $local })
            }
        }
    }
    return $map
}

function Get-ServicePresence {
    $names = @('W3SVC', 'WAS', 'IISADMIN', 'nginx', 'Apache2.4', 'httpd', 'Apache')
    $found = @()
    foreach ($n in $names) {
        $svc = Get-Service -Name $n -ErrorAction SilentlyContinue
        if ($svc) {
            $found += [pscustomobject]@{
                Name   = $svc.Name
                Status = $svc.Status.ToString()
                DisplayName = $svc.DisplayName
            }
        }
    }
    # nginx/Apache often run as plain processes without a Windows service of that name
    foreach ($procName in @('nginx', 'httpd', 'apache', 'apache2')) {
        Get-Process -Name $procName -ErrorAction SilentlyContinue | ForEach-Object {
            $found += [pscustomobject]@{
                Name        = $procName
                Status      = 'Running(process)'
                DisplayName = $_.Path
            }
        }
    }
    return $found
}

function Get-ProcessCommandLineSafe {
    param([int]$ProcessId)
    try {
        $cim = Get-CimInstance Win32_Process -Filter "ProcessId=$ProcessId" -ErrorAction SilentlyContinue
        if ($cim -and $cim.CommandLine) { return $cim.CommandLine }
    }
    catch { }
    return ''
}

function Get-AkiliStopPaths {
    $paths = [System.Collections.Generic.List[string]]::new()
    $install = [System.IO.Path]::GetFullPath($InstallDir.Trim().TrimEnd('\', '/'))
    [void]$paths.Add($install)
    foreach ($legacy in (Get-LegacyInstallCandidates -TargetDir $install)) {
        if (Test-Path -LiteralPath $legacy) {
            $normalized = [System.IO.Path]::GetFullPath($legacy)
            if (-not ($paths -contains $normalized)) {
                [void]$paths.Add($normalized)
            }
        }
    }
    return [string[]]$paths.ToArray()
}

function Test-ProcessIsAkili {
    param(
        [int]$ProcessId,
        [string]$PathOrCmd = '',
        [string[]]$SearchPaths = @()
    )
    if ([string]::IsNullOrWhiteSpace($PathOrCmd)) {
        $PathOrCmd = Get-ProcessPathSafe -ProcessId $ProcessId
    }
    $cmd = $PathOrCmd
    $cmdLine = Get-ProcessCommandLineSafe -ProcessId $ProcessId
    if ($cmdLine) { $cmd = "$cmd $cmdLine" }

    $paths = if ($SearchPaths.Count -gt 0) { $SearchPaths } else { @(Get-AkiliStopPaths) }
    foreach ($root in $paths) {
        if ([string]::IsNullOrWhiteSpace($root)) { continue }
        $normalized = [System.IO.Path]::GetFullPath($root.Trim().TrimEnd('\', '/'))
        if ($cmd -like "*$normalized*") { return $true }
        $fwd = $normalized.Replace('\', '/')
        if ($cmd -like "*$fwd*") { return $true }
        foreach ($marker in @('server\index.js', 'collector\index.js', 'server/index.js', 'collector/index.js')) {
            $full = Join-Path $normalized $marker
            if ($cmd -like "*$full*") { return $true }
            $fullFwd = $full.Replace('\', '/')
            if ($cmd -like "*$fullFwd*") { return $true }
        }
    }
    return $false
}

function Get-AkiliProcessDisplayPath {
    param([int]$ProcessId, [string]$PathOrCmd = '')
    $path = $PathOrCmd
    if ([string]::IsNullOrWhiteSpace($path)) {
        $path = Get-ProcessPathSafe -ProcessId $ProcessId
    }
    $cmdLine = Get-ProcessCommandLineSafe -ProcessId $ProcessId
    $combined = "$path $cmdLine".Trim()
    foreach ($root in (Get-AkiliStopPaths)) {
        if ([string]::IsNullOrWhiteSpace($root)) { continue }
        $normalized = [System.IO.Path]::GetFullPath($root.Trim().TrimEnd('\', '/'))
        if ($combined -like "*$normalized*") { return $normalized }
        $fwd = $normalized.Replace('\', '/')
        if ($combined -like "*$fwd*") { return $normalized }
        foreach ($marker in @('server\index.js', 'collector\index.js', 'server/index.js', 'collector/index.js')) {
            $full = Join-Path $normalized $marker
            if ($combined -like "*$full*") { return $normalized }
            $fullFwd = $full.Replace('\', '/')
            if ($combined -like "*$fullFwd*") { return $normalized }
        }
    }
    if (Test-PathUnderInstall $path) { return $path }
    return $path
}

function Test-OwnerIsAkili {
    param([int]$ProcessId, [string]$PathOrCmd)
    $path = $PathOrCmd
    if ([string]::IsNullOrWhiteSpace($path)) {
        $path = Get-ProcessPathSafe -ProcessId $ProcessId
    }
    if (Test-PathUnderInstall $path) { return $true }
    $cmdLine = Get-ProcessCommandLineSafe -ProcessId $ProcessId
    $combined = "$path $cmdLine".Trim()
    return Test-ProcessIsAkili -ProcessId $ProcessId -PathOrCmd $combined -SearchPaths @(Get-AkiliStopPaths)
}

function Find-NextFreePort {
    param(
        [int]$Preferred,
        [hashtable]$ListenMap,
        [int[]]$AlsoAvoid = @()
    )
    $candidates = @($Preferred)
    for ($i = 1; $i -le 20; $i++) { $candidates += ($Preferred + $i) }
    if ($Preferred -eq 3001) {
        $candidates += @(3010, 3011, 3020, 3101, 3200)
    }
    elseif ($Preferred -eq 8888) {
        $candidates += @(8889, 8890, 8988, 9000)
    }

    foreach ($p in ($candidates | Select-Object -Unique)) {
        if ($AlsoAvoid -contains $p) { continue }
        $inUse = $ListenMap.ContainsKey($p)
        if (-not $inUse) { return $p }
        # Allow reuse if every listener belongs to Akili under InstallDir
        $allOurs = $true
        foreach ($owner in $ListenMap[$p]) {
            $path = Get-ProcessPathSafe -ProcessId $owner.Pid
            if (-not (Test-OwnerIsAkili -ProcessId $owner.Pid -PathOrCmd $path)) {
                $allOurs = $false
                break
            }
        }
        if ($allOurs) { return $p }
    }
    throw "No free TCP port near $Preferred"
}

function Show-VpsOccupancyReport {
    Write-Log 'VPS occupancy report' 'STEP'
    Write-Host ''
    Write-Host '========== VPS OCCUPANCY REPORT ==========' -ForegroundColor Cyan

    $listenMap = Get-ListeningPortMap
    $watchPorts = @(80, 443, 3000, 3001, 8080, 8888, $ServerPort, $CollectorPort) |
        Select-Object -Unique |
        Sort-Object

    $rows = @()
    foreach ($port in $watchPorts) {
        if (-not $listenMap.ContainsKey($port)) {
            $rows += [pscustomobject]@{
                Port    = $port
                Status  = 'FREE'
                Pid     = ''
                Process = ''
                Path    = ''
                Ours    = ''
            }
            continue
        }
        $seen = @{}
        foreach ($owner in $listenMap[$port]) {
            if ($seen.ContainsKey($owner.Pid)) { continue }
            $seen[$owner.Pid] = $true
            $procName = ''
            try { $procName = (Get-Process -Id $owner.Pid -ErrorAction SilentlyContinue).ProcessName } catch { }
            $path = Get-ProcessPathSafe -ProcessId $owner.Pid
            $ours = Test-OwnerIsAkili -ProcessId $owner.Pid -PathOrCmd $path
            if (-not $ours) { $script:OtherAppsFound = $true }
            $displayPath = if ($ours) {
                Get-AkiliProcessDisplayPath -ProcessId $owner.Pid -PathOrCmd $path
            }
            else {
                $path
            }
            $rows += [pscustomobject]@{
                Port    = $port
                Status  = 'IN USE'
                Pid     = $owner.Pid
                Process = $procName
                Path    = $displayPath
                Ours    = $(if ($ours) { 'Akili' } else { 'OTHER' })
            }
        }
    }

    $rows | Format-Table -AutoSize | Out-String | ForEach-Object {
        Write-Host $_
        Add-Content -Path $script:LogFile -Value $_ -ErrorAction SilentlyContinue
    }

    $services = Get-ServicePresence
    if ($services.Count -gt 0) {
        Write-Host 'Web-related services / processes:' -ForegroundColor Yellow
        $script:OtherAppsFound = $true
        foreach ($s in $services) {
            $line = "  - $($s.Name) [$($s.Status)] $($s.DisplayName)"
            Write-Host $line
            Add-Content -Path $script:LogFile -Value $line -ErrorAction SilentlyContinue
        }
    }
    else {
        Write-Host 'No IIS/nginx/Apache services detected by name.' -ForegroundColor DarkGray
    }

    # Foreign node.exe (not under InstallDir)
    $foreignNode = @()
    Get-CimInstance Win32_Process -Filter "Name='node.exe'" -ErrorAction SilentlyContinue | ForEach-Object {
        if (-not (Test-OwnerIsAkili -ProcessId $_.ProcessId -PathOrCmd $_.CommandLine)) {
            $foreignNode += $_
            $script:OtherAppsFound = $true
        }
    }
    if ($foreignNode.Count -gt 0) {
        Write-Host "Other Node.js processes (outside $InstallDir):" -ForegroundColor Yellow
        foreach ($n in $foreignNode) {
            $clip = if ($n.CommandLine.Length -gt 120) { $n.CommandLine.Substring(0, 120) + '...' } else { $n.CommandLine }
            $line = "  - PID $($n.ProcessId): $clip"
            Write-Host $line
            Add-Content -Path $script:LogFile -Value $line -ErrorAction SilentlyContinue
        }
    }
    else {
        Write-Host "No foreign Node.js processes outside $InstallDir." -ForegroundColor DarkGray
    }

    Write-Host 'Safety policy:' -ForegroundColor Cyan
    Write-Host '  - Will NOT kill processes outside InstallDir'
    Write-Host '  - Will NOT stop IIS / nginx / Apache / other services'
    Write-Host '  - Firewall: EXPOSE_FIREWALL defaults off (will not claim 80/443)'
    Write-Host '=========================================='
    Write-Host ''

    return $listenMap
}

function Resolve-PortsSafely {
    param([hashtable]$ListenMap)

    $serverOwnerForeign = $false
    if ($ListenMap.ContainsKey($ServerPort)) {
        foreach ($owner in $ListenMap[$ServerPort]) {
            $path = Get-ProcessPathSafe -ProcessId $owner.Pid
            if (-not (Test-OwnerIsAkili -ProcessId $owner.Pid -PathOrCmd $path)) {
                $serverOwnerForeign = $true
                break
            }
        }
    }

    $collectorOwnerForeign = $false
    if ($ListenMap.ContainsKey($CollectorPort)) {
        foreach ($owner in $ListenMap[$CollectorPort]) {
            $path = Get-ProcessPathSafe -ProcessId $owner.Pid
            if (-not (Test-OwnerIsAkili -ProcessId $owner.Pid -PathOrCmd $path)) {
                $collectorOwnerForeign = $true
                break
            }
        }
    }

    if ($serverOwnerForeign) {
        $script:ChosenServerPort = Find-NextFreePort -Preferred $ServerPort -ListenMap $ListenMap
        Write-Log "SERVER_PORT $ServerPort is used by another app - using $($script:ChosenServerPort) instead" 'WARN'
        Write-Log "Akili will listen on http://localhost:$($script:ChosenServerPort) ($ServerPort was in use)" 'WARN'
        $script:PortConflictResolved = $true
    }
    else {
        $script:ChosenServerPort = $ServerPort
        if ($ListenMap.ContainsKey($ServerPort)) {
            Write-Log "Port $ServerPort is in use by Akili — will stop and reuse this port on start"
        }
    }

    $avoid = @($script:ChosenServerPort)
    if ($collectorOwnerForeign -or ($script:ChosenServerPort -eq $CollectorPort)) {
        $script:ChosenCollectorPort = Find-NextFreePort -Preferred $CollectorPort -ListenMap $ListenMap -AlsoAvoid $avoid
        if ($script:ChosenCollectorPort -ne $CollectorPort) {
            Write-Log "COLLECTOR_PORT $CollectorPort unavailable - using $($script:ChosenCollectorPort) instead" 'WARN'
            Write-Log "Collector will listen on port $($script:ChosenCollectorPort) ($CollectorPort was in use)" 'WARN'
            $script:PortConflictResolved = $true
        }
    }
    else {
        $script:ChosenCollectorPort = $CollectorPort
        if ($ListenMap.ContainsKey($CollectorPort)) {
            Write-Log "Port $CollectorPort is in use by Akili — will stop and reuse this port on start"
        }
    }

    $script:PortsResolvedThisRun = $true
    Save-ChosenPorts
}

function Save-ChosenPorts {
    # Prefer InstallDir\logs after clone; fall back to TEMP during pre-clone port resolve.
    $portDir = if (Test-Path -LiteralPath (Join-Path $InstallDir '.git')) {
        Join-Path $InstallDir 'logs'
    }
    else {
        Join-Path $env:TEMP 'Akili-install-logs'
    }
    $portFile = Join-Path $portDir 'chosen-ports.json'
    try {
        Initialize-Directory $portDir
        @{
            ServerPort    = $script:ChosenServerPort
            CollectorPort = $script:ChosenCollectorPort
            UpdatedAt     = (Get-Date).ToString('o')
        } | ConvertTo-Json | Set-Content -Path $portFile -Encoding UTF8
    }
    catch {
        Write-Log "Could not write chosen-ports.json: $($_.Exception.Message)" 'WARN'
    }
}

function Confirm-ContinueIfBusy {
    if (-not $script:OtherAppsFound -and -not $script:PortConflictResolved) { return }
    if ($script:Flags.Yes) {
        Write-Log 'Other apps detected; continuing because -Yes was passed' 'WARN'
        return
    }
    Write-Host ''
    Write-Host 'Other applications are present on this VPS (see report above).' -ForegroundColor Yellow
    Write-Host 'Akili will NOT stop them. Ports may have been remapped.' -ForegroundColor Yellow
    $answer = Read-Host 'Continue? [Y/N]'
    if ($answer -notmatch '^(Y|y|Yes|yes)$') {
        throw 'Aborted by operator (other apps present). Re-run with /Y to skip this prompt.'
    }
}

function Read-SavedPorts {
    # Resolve-PortsSafely is authoritative for install/resume/update/start this run.
    # Do not let a stale chosen-ports.json (e.g. 3002) override a reclaimed configured port (3001).
    if ($script:PortsResolvedThisRun) { return }

    $portFile = Join-Path $InstallDir 'logs\chosen-ports.json'
    if (Test-Path $portFile) {
        try {
            $j = Get-Content $portFile -Raw | ConvertFrom-Json
            if ($j.ServerPort) { $script:ChosenServerPort = [int]$j.ServerPort }
            if ($j.CollectorPort) { $script:ChosenCollectorPort = [int]$j.CollectorPort }
        }
        catch { }
    }
}

function Stop-ProcessGracefully {
    param(
        [int]$ProcessId,
        [string]$Reason
    )
    if ($ProcessId -le 0) { return }
    try {
        $proc = Get-Process -Id $ProcessId -ErrorAction SilentlyContinue
        if (-not $proc) { return }
        Write-Log "Stopping $Reason PID $ProcessId ($($proc.ProcessName))"
        Stop-Process -Id $ProcessId -ErrorAction SilentlyContinue
        $deadline = (Get-Date).AddSeconds(5)
        while ((Get-Date) -lt $deadline) {
            if (-not (Get-Process -Id $ProcessId -ErrorAction SilentlyContinue)) { return }
            Start-Sleep -Milliseconds 200
        }
        Stop-Process -Id $ProcessId -Force -ErrorAction SilentlyContinue
        Write-Log "Force-stopped PID $ProcessId"
    }
    catch {
        Stop-Process -Id $ProcessId -Force -ErrorAction SilentlyContinue
    }
}

function Get-ListenersOnPort {
    param([int]$Port)
    $listeners = [System.Collections.Generic.List[object]]::new()
    try {
        Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction Stop |
            ForEach-Object { [void]$listeners.Add($_) }
    }
    catch {
        $map = Get-ListeningPortMap
        if ($map.ContainsKey($Port)) {
            foreach ($owner in $map[$Port]) {
                [void]$listeners.Add([pscustomobject]@{
                    OwningProcess = $owner.Pid
                    LocalPort     = $Port
                })
            }
        }
    }
    return @($listeners.ToArray())
}

function Stop-AkiliListeners {
    param([int[]]$Ports = @())

    $portList = if ($Ports.Count -gt 0) {
        @($Ports | Where-Object { $_ -gt 0 } | Select-Object -Unique)
    }
    else {
        @($ServerPort, $CollectorPort, $script:ChosenServerPort, $script:ChosenCollectorPort) |
            Where-Object { $_ -gt 0 } |
            Select-Object -Unique
    }
    if ($portList.Count -eq 0) { return }

    Write-Log "Stopping Akili listeners on port(s): $($portList -join ', ')" 'STEP'
    $stopPaths = Get-AkiliStopPaths
    $stoppedPids = @{}

    foreach ($port in $portList) {
        foreach ($conn in (Get-ListenersOnPort -Port $port)) {
            $procId = [int]$conn.OwningProcess
            if ($procId -le 0 -or $stoppedPids.ContainsKey($procId)) { continue }

            $path = Get-ProcessPathSafe -ProcessId $procId
            $cmdLine = Get-ProcessCommandLineSafe -ProcessId $procId
            $combined = "$path $cmdLine".Trim()

            if (Test-ProcessIsAkili -ProcessId $procId -PathOrCmd $combined -SearchPaths $stopPaths) {
                Stop-ProcessGracefully -ProcessId $procId -Reason "Akili listener on port $port"
                $stoppedPids[$procId] = $true
            }
            else {
                Write-Log "Port $port held by non-Akili PID $procId ($path) - will not stop" 'WARN'
            }
        }
    }
}

function Assert-ServerPortAvailableForStart {
    $port = $script:ChosenServerPort
    $stopPaths = Get-AkiliStopPaths

    foreach ($conn in (Get-ListenersOnPort -Port $port)) {
        $procId = [int]$conn.OwningProcess
        if ($procId -le 0) { continue }
        $path = Get-ProcessPathSafe -ProcessId $procId
        if (-not (Test-ProcessIsAkili -ProcessId $procId -PathOrCmd $path -SearchPaths $stopPaths)) {
            throw @"
Cannot start Akili: port $port is in use by a non-Akili process (PID $procId, $path).
Stop that application, choose a different SERVER_PORT, or re-run install to remap ports.
"@
        }
    }
}

function Prepare-AkiliForStart {
    Read-SavedPorts
    Stop-AkiliListeners
    Stop-AkiliProcesses
    Start-Sleep -Milliseconds 500
    Assert-ServerPortAvailableForStart
}

function Stop-AkiliProcessesUnderPath {
    param([string]$Path)
    if ([string]::IsNullOrWhiteSpace($Path)) { return }
    $root = [System.IO.Path]::GetFullPath($Path.Trim().TrimEnd('\', '/'))
    Get-CimInstance Win32_Process -Filter "Name='node.exe'" -ErrorAction SilentlyContinue |
        Where-Object { $_.CommandLine -and ($_.CommandLine -like "*$root*") } |
        ForEach-Object {
            Stop-ProcessGracefully -ProcessId $_.ProcessId -Reason "Akili node under $root"
        }
}

function Stop-AkiliProcesses {
    param([string[]]$ExtraPaths = @())
    $paths = @(Get-AkiliStopPaths)
    foreach ($extra in $ExtraPaths) {
        if ([string]::IsNullOrWhiteSpace($extra)) { continue }
        $normalized = [System.IO.Path]::GetFullPath($extra.Trim().TrimEnd('\', '/'))
        if ($paths -notcontains $normalized) {
            $paths += $normalized
        }
    }
    Write-Log "Stopping Akili node processes under: $($paths -join ', ')" 'STEP'
    foreach ($p in ($paths | Select-Object -Unique)) {
        Stop-AkiliProcessesUnderPath -Path $p
    }
}

function Test-Prerequisites {
    Write-Log 'Checking prerequisites' 'STEP'

    if (-not (Test-Command git)) {
        throw 'Git is not installed. Install with: winget install Git.Git'
    }
    Write-Log ("Found " + (git --version))

    if (-not (Test-Command node)) {
        throw 'Node.js is not installed. Install with: winget install OpenJS.NodeJS.LTS'
    }
    $nodeVersion = (node --version) -replace '^v', ''
    $nodeMajor = [int]($nodeVersion.Split('.')[0])
    if ($nodeMajor -lt $MinNodeMajor) {
        throw "Node $MinNodeMajor+ required; found v$nodeVersion"
    }
    Write-Log "Found Node v$nodeVersion"

    if (-not (Test-Command yarn)) {
        Write-Log 'Yarn not found; enabling corepack...' 'WARN'
        corepack enable 2>&1 | Out-Null
        corepack prepare yarn@stable --activate 2>&1 | Out-Null
    }
    if (-not (Test-Command yarn)) {
        throw 'Yarn is required. Install with: npm install -g yarn'
    }
    Write-Log ("Found Yarn " + (yarn --version))
}

function Test-GitRepoComplete {
    param([string]$Path)
    $gitDir = Join-Path $Path '.git'
    if (-not (Test-Path -LiteralPath $gitDir)) { return $false }
    # Incomplete clones leave .git without HEAD or an empty objects pack.
    $head = Join-Path $gitDir 'HEAD'
    if (-not (Test-Path -LiteralPath $head)) { return $false }
    Push-Location $Path
    try {
        $null = git rev-parse --verify HEAD 2>$null
        return ((Get-ExitCode) -eq 0)
    }
    catch {
        return $false
    }
    finally {
        Pop-Location
    }
}

function Test-InstallDirIsInstallerNoiseOnly {
    param([string]$Path)
    if (-not (Test-Path -LiteralPath $Path)) { return $true }
    $entries = @(Get-ChildItem -LiteralPath $Path -Force -ErrorAction Stop)
    if ($entries.Count -eq 0) { return $true }
    foreach ($entry in $entries) {
        $name = $entry.Name
        if ($name -ieq 'logs' -or $name -ieq 'chosen-ports.json') { continue }
        return $false
    }
    return $true
}

function Remove-PartialInstallDir {
    param(
        [string]$Path,
        [string]$Reason
    )
    if (-not (Test-Path -LiteralPath $Path)) { return }
    Write-Log "Removing incomplete install dir ($Reason): $Path" 'WARN'
    # Best-effort unlock: drop read-only attrs that AV or git leave behind.
    try {
        Get-ChildItem -LiteralPath $Path -Recurse -Force -ErrorAction SilentlyContinue |
            ForEach-Object { $_.Attributes = 'Normal' }
    }
    catch { }
    Remove-Item -LiteralPath $Path -Recurse -Force -ErrorAction Stop
}

function Get-LegacyInstallCandidates {
    param([string]$TargetDir)
    $target = [System.IO.Path]::GetFullPath($TargetDir.Trim().TrimEnd('\', '/'))
    $known = @(
        'C:\Accelanova'
    )
    $seen = @{}
    $result = [System.Collections.Generic.List[string]]::new()
    foreach ($candidate in $known) {
        $normalized = [System.IO.Path]::GetFullPath($candidate.Trim().TrimEnd('\', '/'))
        if ($normalized -ieq $target) { continue }
        if ($seen.ContainsKey($normalized.ToLowerInvariant())) { continue }
        $seen[$normalized.ToLowerInvariant()] = $true
        [void]$result.Add($normalized)
    }
    return [string[]]$result.ToArray()
}

function Move-LegacyInstallDirectory {
    param(
        [string]$SourceDir,
        [string]$TargetDir
    )
    $source = [System.IO.Path]::GetFullPath($SourceDir.Trim().TrimEnd('\', '/'))
    $target = [System.IO.Path]::GetFullPath($TargetDir.Trim().TrimEnd('\', '/'))
    $parent = Split-Path -Parent $target
    Initialize-Directory $parent

    Write-Log "Migrating install from $source to $target" 'STEP'
    try {
        Move-Item -LiteralPath $source -Destination $target -Force -ErrorAction Stop
    }
    catch {
        Write-Log "Move-Item failed ($($_.Exception.Message)); trying robocopy /MOVE" 'WARN'
        $robocopyArgs = @(
            $source,
            $target,
            '/E', '/MOVE', '/R:2', '/W:2', '/NFL', '/NDL', '/NJH', '/NJS', '/NC', '/NS'
        )
        & robocopy @robocopyArgs 2>&1 | ForEach-Object { Write-Log "$_" }
        $rc = Get-ExitCode
        if ($rc -ge 8) {
            throw "robocopy /MOVE failed with exit code $rc while migrating $source to $target"
        }
        if (Test-Path -LiteralPath $source) {
            Remove-PartialInstallDir -Path $source -Reason 'leftover after robocopy /MOVE'
        }
    }

    if (-not (Test-GitRepoComplete -Path $target)) {
        throw "Migration finished but $target is not a complete git repository"
    }
}

function Update-EnvPathsAfterMigration {
    param(
        [string]$InstallPath,
        [string]$OldPath
    )
    $newRoot = [System.IO.Path]::GetFullPath($InstallPath.Trim().TrimEnd('\', '/'))
    $oldRoot = [System.IO.Path]::GetFullPath($OldPath.Trim().TrimEnd('\', '/'))
    if ($newRoot -ieq $oldRoot) { return }

    $oldVariants = @(
        $oldRoot,
        ($oldRoot -replace '\\', '/'),
        ($oldRoot -replace '/', '\')
    ) | Select-Object -Unique

    $envFiles = @(
        (Join-Path $newRoot 'server\.env')
        (Join-Path $newRoot 'frontend\.env')
        (Join-Path $newRoot 'collector\.env')
    )

    foreach ($envFile in $envFiles) {
        if (-not (Test-Path -LiteralPath $envFile)) { continue }
        $content = Get-Content -LiteralPath $envFile -Raw -ErrorAction Stop
        $updated = $content
        foreach ($variant in $oldVariants) {
            if ([string]::IsNullOrWhiteSpace($variant)) { continue }
            $updated = [regex]::Replace(
                $updated,
                [regex]::Escape($variant),
                $newRoot,
                [System.Text.RegularExpressions.RegexOptions]::IgnoreCase
            )
        }
        if ($updated -ne $content) {
            Set-Content -LiteralPath $envFile -Value $updated -NoNewline -ErrorAction Stop
            Write-Log "Updated legacy paths in $envFile"
        }
    }
}

function Resolve-InstallDirectory {
    param(
        [string]$TargetDir,
        [bool]$AutoMigrate
    )

    $target = [System.IO.Path]::GetFullPath($TargetDir.Trim().TrimEnd('\', '/'))

    if (Test-GitRepoComplete -Path $target) {
        Write-Log "Using existing install at $target" 'INFO'
        return $target
    }

    if (-not $AutoMigrate) {
        Write-Log "AutoMigrateLegacyDir=false; using InstallDir as configured: $target" 'INFO'
        return $target
    }

    $legacyFound = $null
    foreach ($legacy in (Get-LegacyInstallCandidates -TargetDir $target)) {
        if (Test-GitRepoComplete -Path $legacy) {
            $legacyFound = $legacy
            break
        }
    }

    if (-not $legacyFound) {
        return $target
    }

    Write-Log "Found legacy install at $legacyFound (target: $target)" 'INFO'

    Stop-AkiliListeners -Ports @($ServerPort, $CollectorPort)
    Stop-AkiliProcessesUnderPath -Path $legacyFound
    Stop-AkiliProcessesUnderPath -Path $target

    $targetExists = Test-Path -LiteralPath $target
    if (-not $targetExists) {
        Move-LegacyInstallDirectory -SourceDir $legacyFound -TargetDir $target
        Update-EnvPathsAfterMigration -InstallPath $target -OldPath $legacyFound
        Write-Log "Legacy install migrated to $target" 'INFO'
        return $target
    }

    if (Test-InstallDirIsInstallerNoiseOnly -Path $target) {
        Remove-PartialInstallDir -Path $target -Reason 'empty before legacy migration'
        Move-LegacyInstallDirectory -SourceDir $legacyFound -TargetDir $target
        Update-EnvPathsAfterMigration -InstallPath $target -OldPath $legacyFound
        Write-Log "Legacy install migrated to $target" 'INFO'
        return $target
    }

    if (Test-GitRepoComplete -Path $target) {
        throw @"

Both install directories have complete git repositories:
  Target: $target
  Legacy: $legacyFound

Set INSTALL_DIR to one path, or delete one folder, then re-run.
"@
    }

    throw @"

Install directory exists but is incomplete: $target
Legacy install found at: $legacyFound

Delete $target, set INSTALL_DIR=$legacyFound, or finish migration manually.
"@
}

function Invoke-ResolveInstallDirectorySelfTest {
    $failures = [System.Collections.Generic.List[string]]::new()
    function Assert-Test {
        param([bool]$Condition, [string]$Message)
        if (-not $Condition) { [void]$failures.Add($Message) }
    }

    $candidates = Get-LegacyInstallCandidates -TargetDir 'C:\Akili'
    Assert-Test ($candidates -contains 'C:\Accelanova') 'Get-LegacyInstallCandidates should include C:\Accelanova'
    Assert-Test ($candidates -notcontains 'C:\Akili') 'Get-LegacyInstallCandidates should exclude the target dir'

    $noLegacy = @(Get-LegacyInstallCandidates -TargetDir 'C:\Accelanova')
    Assert-Test ($noLegacy.Count -eq 0) 'When target is C:\Accelanova, no legacy candidates should remain'

    Assert-Test ((Resolve-PullOnStartMode -Value 'check') -eq 'check') 'Resolve-PullOnStartMode should accept check'
    Assert-Test ((Resolve-PullOnStartMode -Value 'false') -eq 'false') 'Resolve-PullOnStartMode should accept false'
    Assert-Test ((Resolve-PullOnStartMode -Value 'always') -eq 'always') 'Resolve-PullOnStartMode should accept always'
    Assert-Test ((Resolve-PullOnStartMode -Value 'sync') -eq 'check') 'Resolve-PullOnStartMode should map sync to check'

    $tempRoot = Join-Path $env:TEMP ("Akili-installer-selftest-{0}" -f ([guid]::NewGuid().ToString('N')))
    $targetDir = Join-Path $tempRoot 'target'
    $serverEnv = Join-Path $targetDir 'server\.env'
    try {
        Initialize-Directory (Split-Path -Parent $serverEnv)
        Set-Content -LiteralPath $serverEnv -Value "STORAGE_DIR=C:\Accelanova\server\storage`nDATABASE_URL=`"file:C:/Accelanova/server/storage/akili.db`"" -NoNewline
        Update-EnvPathsAfterMigration -InstallPath $targetDir -OldPath 'C:\Accelanova'
        $envText = Get-Content -LiteralPath $serverEnv -Raw
        Assert-Test ($envText -notmatch 'Accelanova') 'Update-EnvPathsAfterMigration should replace Accelanova paths'
        Assert-Test ($envText -match 'server[/\\]storage') 'Update-EnvPathsAfterMigration should preserve storage path suffix'
    }
    finally {
        if (Test-Path -LiteralPath $tempRoot) {
            Remove-Item -LiteralPath $tempRoot -Recurse -Force -ErrorAction SilentlyContinue
        }
    }

    if ($failures.Count -gt 0) {
        foreach ($failure in $failures) {
            Write-Host "[FAIL] $failure" -ForegroundColor Red
        }
        throw ("Resolve-InstallDirectory self-test failed ({0} assertion(s))" -f $failures.Count)
    }

    Write-Host '[OK] Resolve-InstallDirectory self-test passed' -ForegroundColor Green
}

function Get-CloneAuthHint {
    param([string]$GitOutput)
    $text = "$GitOutput"
    if ($text -match '(?i)(authentication failed|could not read Username|Invalid username or password|403|401 Unauthorized|Repository not found|remote:.*not found|terminal prompts disabled|Permission denied \(publickey\))') {
        return Get-PrivateRepoAuthHint
    }
    if ($text -match '(?i)(timed out|timeout|SSL|Connection reset|Failed to connect|unable to access|HTTP/2|RPC failed|early EOF|unexpected disconnect|Could not resolve host)') {
        return @"

Network/timeout during git operation (repo pack is large; shallow clone should help).
If HTTPS keeps failing, set REPO_URL to the SSH form: git@github.com:BQI-TECH/AccelaNova.git
"@
    }
    return ''
}

function Get-PrivateRepoAuthHint {
    return @"

Private repo options:
  git config credential.helper manager
  gh auth login
  Or set REPO_URL=https://TOKEN@github.com/BQI-TECH/AccelaNova.git
  Or use SSH: git@github.com:BQI-TECH/AccelaNova.git
"@
}

function Get-GitSyncFailureKind {
    param(
        [string]$Output,
        [int]$ExitCode
    )
    $text = "$Output"
    if ($text -match '(?i)(authentication failed|could not read Username|Invalid username or password|403|401|Repository not found|terminal prompts disabled|Permission denied \(publickey\)|remote:.*not found)') {
        return 'auth'
    }
    if ($text -match '(?i)(timed out|timeout|SSL|Connection reset|Failed to connect|unable to access|HTTP/2|RPC failed|early EOF|unexpected disconnect|Could not resolve host)') {
        return 'network'
    }
    if ($ExitCode -ne 0 -and [string]::IsNullOrWhiteSpace($text)) {
        return 'other'
    }
    return 'other'
}

function Invoke-GitCommand {
    param([string[]]$GitArgs)

    $lines = [System.Collections.Generic.List[string]]::new()
    $prevEap = $ErrorActionPreference
    try {
        # Git writes progress to stderr; never let that terminate the script when exit code is 0.
        $ErrorActionPreference = 'Continue'
        & git @GitArgs 2>&1 | ForEach-Object {
            $text = if ($_ -is [System.Management.Automation.ErrorRecord]) {
                if ($_.Exception -and $_.Exception.Message) { $_.Exception.Message }
                else { "$_" }
            }
            else {
                "$_"
            }
            if (-not [string]::IsNullOrWhiteSpace($text)) {
                [void]$lines.Add($text)
                Write-CommandOutputLine $text
            }
        }
        $exitCode = Get-ExitCode
    }
    finally {
        $ErrorActionPreference = $prevEap
    }

    $output = ($lines -join "`n")
    return [pscustomobject]@{
        ExitCode = $exitCode
        Output   = $output
        Ok       = ($exitCode -eq 0)
    }
}

function Invoke-GitCommandWithNetworkRetry {
    param(
        [string[]]$GitArgs,
        [string]$Stage
    )

    $result = Invoke-GitCommand -GitArgs $GitArgs
    if ($result.Ok) { return $result }

    $kind = Get-GitSyncFailureKind -Output $result.Output -ExitCode $result.ExitCode
    if ($kind -eq 'network') {
        Write-Log "Network error during git $Stage; retrying once..." 'WARN'
        Start-Sleep -Seconds 3
        $result = Invoke-GitCommand -GitArgs $GitArgs
    }
    return $result
}

function Handle-GitSyncFailure {
    param(
        [string]$Stage,
        [pscustomobject]$Result
    )

    $kind = Get-GitSyncFailureKind -Output $Result.Output -ExitCode $Result.ExitCode
    $detail = if ($Result.Output) { $Result.Output.Trim() } else { "(exit code $($Result.ExitCode); no output)" }

    $summary = switch ($kind) {
        'auth' { "git $Stage failed (authentication/authorization)" }
        'network' { "git $Stage failed (network/timeout)" }
        default { "git $Stage failed" }
    }

    $hint = Get-CloneAuthHint -GitOutput $Result.Output
    if ($kind -eq 'auth' -and [string]::IsNullOrWhiteSpace($hint)) {
        $hint = Get-PrivateRepoAuthHint
    }

    if ($script:PullFailPolicy -eq 'fail') {
        throw "$summary`n$detail$hint"
    }

    Write-Log "Could not pull updates ($summary); continuing with local code" 'WARN'
    if ($detail) { Write-Log $detail 'WARN' }
    if ($hint) {
        foreach ($hintLine in ($hint.Trim() -split "`n")) {
            if (-not [string]::IsNullOrWhiteSpace($hintLine)) {
                Write-Log $hintLine.Trim() 'WARN'
            }
        }
    }

    return [pscustomobject]@{
        Pulled       = $false
        Skipped      = $false
        SyncFailed   = $true
        FailureKind  = $kind
        FailureStage = $Stage
    }
}

function Set-CloneGitEnvironment {
    # Prefer long paths on Windows Server; do not fail install if global config is locked down.
    try {
        git config --global core.longpaths true 2>$null | Out-Null
    }
    catch { }
    # Tolerate slow VPS links: abort only if transfer stays under 1 KB/s for 5 minutes.
    $env:GIT_HTTP_LOW_SPEED_LIMIT = '1000'
    $env:GIT_HTTP_LOW_SPEED_TIME = '300'
    # Avoid HTTP/2 quirks on some Windows Server TLS stacks.
    try {
        git config --global http.version HTTP/1.1 2>$null | Out-Null
    }
    catch { }
    try {
        git config --global http.postBuffer 524288000 2>$null | Out-Null
    }
    catch { }
}

function Invoke-GitCloneAttempt {
    param(
        [string]$Url,
        [string]$Branch,
        [string]$TargetDir,
        [int]$Depth
    )

    $gitArgs = @(
        '-c', 'core.longpaths=true',
        'clone',
        '--branch', $Branch,
        '--single-branch',
        '--progress'
    )
    if ($Depth -gt 0) {
        $gitArgs += @('--depth', "$Depth")
    }
    $gitArgs += @($Url, $TargetDir)

    Write-Log ("git " + ($gitArgs -join ' '))

    $lines = [System.Collections.Generic.List[string]]::new()
    $prevEap = $ErrorActionPreference
    $ErrorActionPreference = 'Continue'
    try {
        # Stream line-by-line so progress is not stuck in Tee-Object buffering.
        & git @gitArgs 2>&1 | ForEach-Object {
            $text = "$_"
            if (-not [string]::IsNullOrWhiteSpace($text)) {
                [void]$lines.Add($text)
                Write-Log $text
            }
        }
    }
    finally {
        $ErrorActionPreference = $prevEap
    }

    $exitCode = Get-ExitCode
    $joined = ($lines -join "`n")
    return [pscustomobject]@{
        ExitCode = $exitCode
        Output   = $joined
        Ok       = (($exitCode -eq 0) -and (Test-GitRepoComplete -Path $TargetDir))
    }
}

function Initialize-Repository {
    Write-Log 'Preparing install directory' 'STEP'

    if ($script:Flags.SkipClone -or $script:Flags.Resume) {
        if (-not (Test-GitRepoComplete -Path $InstallDir)) {
            throw "SkipClone/resume set but $InstallDir is not a complete git repository"
        }
        Write-Log "Skipping clone (repository already present at $InstallDir)" 'INFO'
        Move-InstallLogToInstallDir
        Sync-ExistingRepository
        return
    }

    if (Test-GitRepoComplete -Path $InstallDir) {
        Write-Log "Skipping clone (repository already exists at $InstallDir)" 'INFO'
        Move-InstallLogToInstallDir
        Sync-ExistingRepository
        return
    }

    if (-not $script:Flags.CloneIfMissing) {
        throw "Install directory missing and CloneIfMissing not set"
    }

    # Incomplete leftover from a failed clone (few files / broken .git) must be cleared.
    if (Test-Path -LiteralPath $InstallDir) {
        if (Test-InstallDirIsInstallerNoiseOnly -Path $InstallDir) {
            Remove-PartialInstallDir -Path $InstallDir -Reason 'empty or installer logs only'
        }
        elseif (-not (Test-GitRepoComplete -Path $InstallDir)) {
            Remove-PartialInstallDir -Path $InstallDir -Reason 'partial or broken clone'
        }
        else {
            $entries = @(Get-ChildItem -LiteralPath $InstallDir -Force -ErrorAction Stop)
            $names = ($entries | ForEach-Object { $_.Name }) -join ', '
            throw @"
Install directory already exists and is not empty: $InstallDir
Contents: $names
Pick another INSTALL_DIR in install-vps.bat, or delete this folder and re-run.
"@
        }
    }

    $parent = Split-Path -Parent $InstallDir
    if ($parent) {
        Initialize-Directory $parent
    }

    $depth = $CloneDepth
    if ($depth -lt 0) { $depth = 0 }
    $retries = $CloneRetries
    if ($retries -lt 1) { $retries = 1 }

    Set-CloneGitEnvironment

    $depthLabel = if ($depth -gt 0) { "depth $depth" } else { 'full history' }
    Write-Log "Cloning $RepoUrl (branch $RepoBranch, $depthLabel, up to $retries attempt(s)) into $InstallDir" 'STEP'

    $lastDetail = ''
    $succeeded = $false
    for ($attempt = 1; $attempt -le $retries; $attempt++) {
        if (Test-Path -LiteralPath $InstallDir) {
            Remove-PartialInstallDir -Path $InstallDir -Reason "before attempt $attempt"
        }

        Write-Log "Clone attempt $attempt of $retries" 'STEP'
        $result = Invoke-GitCloneAttempt -Url $RepoUrl -Branch $RepoBranch -TargetDir $InstallDir -Depth $depth
        if ($result.Ok) {
            $succeeded = $true
            break
        }

        $lastDetail = $result.Output
        if ([string]::IsNullOrWhiteSpace($lastDetail)) {
            $lastDetail = "(no git output; exit code $($result.ExitCode))"
        }
        else {
            $lastDetail = "exit code $($result.ExitCode)`n$lastDetail"
        }
        Write-Log "Clone attempt $attempt failed: $lastDetail" 'ERROR'

        if (Test-Path -LiteralPath $InstallDir) {
            try {
                Remove-PartialInstallDir -Path $InstallDir -Reason "failed attempt $attempt"
            }
            catch {
                Write-Log "Could not remove partial dir after failed attempt: $($_.Exception.Message)" 'WARN'
            }
        }

        if ($attempt -lt $retries) {
            $waitSec = [Math]::Min(15 * $attempt, 45)
            Write-Log "Waiting ${waitSec}s before retry..."
            Start-Sleep -Seconds $waitSec
        }
    }

    if (-not $succeeded) {
        $hint = Get-CloneAuthHint -GitOutput $lastDetail
        $sshHint = ''
        if ($RepoUrl -match '^https?://') {
            $sshHint = "`nOptional fallback: set REPO_URL=git@github.com:BQI-TECH/AccelaNova.git in install-vps.bat"
        }
        throw "git clone failed after $retries attempt(s):`n$lastDetail$hint$sshHint"
    }

    if (-not (Test-GitRepoComplete -Path $InstallDir)) {
        throw "git clone reported success but $InstallDir is not a complete git repository"
    }

    Move-InstallLogToInstallDir
    Save-ChosenPorts
}

function Sync-ExistingRepository {
    param(
        [ValidateSet('false', 'check', 'always')]
        [string]$SyncMode = $script:PullIfRepoExistsMode,
        [switch]$ForcePull
    )

    Write-Log "Repository already at $InstallDir — checking for updates..." 'INFO'
    if ($SyncMode -eq 'false') {
        Write-Log 'Skipping git sync (PULL_IF_REPO_EXISTS=false)' 'INFO'
        return [pscustomobject]@{ Pulled = $false; Skipped = $true }
    }

    return Sync-RepositoryIfNeeded -SyncMode $SyncMode -ForcePull:$ForcePull
}

function Sync-RepositoryIfNeeded {
    param(
        [ValidateSet('false', 'check', 'always')]
        [string]$SyncMode,
        [switch]$ForcePull
    )

    if ($SyncMode -eq 'false') {
        return [pscustomobject]@{ Pulled = $false; Skipped = $true }
    }

    Write-Log "Syncing repository (mode=$SyncMode)" 'STEP'

    if (-not (Test-GitRepoComplete -Path $InstallDir)) {
        Write-Log "Skipping git sync: $InstallDir is not a complete git repository" 'WARN'
        return [pscustomobject]@{ Pulled = $false; Skipped = $true }
    }

    Set-CloneGitEnvironment

    Push-Location $InstallDir
    try {
        $fetchResult = Invoke-GitCommandWithNetworkRetry -GitArgs @('fetch', 'origin', $RepoBranch) -Stage 'fetch'
        if (-not $fetchResult.Ok) {
            return Handle-GitSyncFailure -Stage 'fetch' -Result $fetchResult
        }

        $checkoutResult = Invoke-GitCommand -GitArgs @('checkout', $RepoBranch)
        if (-not $checkoutResult.Ok) {
            return Handle-GitSyncFailure -Stage "checkout $RepoBranch" -Result $checkoutResult
        }

        $remoteRef = "origin/$RepoBranch"
        $revListResult = Invoke-GitCommand -GitArgs @('rev-list', '--left-right', '--count', "HEAD...$remoteRef")
        if (-not $revListResult.Ok) {
            return Handle-GitSyncFailure -Stage "compare HEAD to $remoteRef" -Result $revListResult
        }

        $countLine = $revListResult.Output.Trim()
        $counts = @($countLine -split '\s+' | Where-Object { -not [string]::IsNullOrWhiteSpace($_) })
        if ($counts.Count -lt 2) {
            if ($script:PullFailPolicy -eq 'fail') {
                throw "Unexpected rev-list output: $countLine"
            }
            Write-Log "Could not compare HEAD to $remoteRef ($countLine); continuing with local code" 'WARN'
            return [pscustomobject]@{ Pulled = $false; Skipped = $false; SyncFailed = $true; FailureKind = 'other' }
        }

        $ahead = [int]$counts[0]
        $behind = [int]$counts[1]

        if ($behind -eq 0) {
            if ($ahead -gt 0) {
                Write-Log "Repository is ahead of $remoteRef by $ahead commit(s). Skipping pull." 'WARN'
            }
            else {
                Write-Log 'Already up to date'
            }
            return [pscustomobject]@{ Pulled = $false; Skipped = $false; Ahead = $ahead; Behind = $behind }
        }

        if ($SyncMode -eq 'check' -and $ahead -gt 0) {
            if ($ForcePull) {
                Write-Log "Repository diverged ($ahead ahead, $behind behind). Force pull requested." 'WARN'
            }
            else {
                Write-Log "Repository diverged ($ahead ahead, $behind behind). Skipping pull. Run 'install-vps.bat update' or 'install-vps.bat start --pull'." 'WARN'
                return [pscustomobject]@{ Pulled = $false; Skipped = $false; Ahead = $ahead; Behind = $behind }
            }
        }

        if ($SyncMode -eq 'always' -and $ahead -gt 0 -and -not $ForcePull) {
            Write-Log "Repository diverged ($ahead ahead, $behind behind). Skipping pull without --pull / PullForce. Run 'install-vps.bat update' or 'install-vps.bat start --pull'." 'WARN'
            return [pscustomobject]@{ Pulled = $false; Skipped = $false; Ahead = $ahead; Behind = $behind }
        }

        Write-Log "Pulling $behind commit(s) from origin/$RepoBranch"
        $pullResult = Invoke-GitCommandWithNetworkRetry -GitArgs @('pull', 'origin', $RepoBranch) -Stage 'pull'
        if (-not $pullResult.Ok) {
            return Handle-GitSyncFailure -Stage 'pull' -Result $pullResult
        }

        $headResult = Invoke-GitCommand -GitArgs @('log', '-1', '--pretty=format:%h %s')
        $head = if ($headResult.Ok) { $headResult.Output.Trim() } else { '(unknown)' }
        Write-Log "Pulled $behind commit(s) from origin/$RepoBranch. HEAD is now $head"
        return [pscustomobject]@{ Pulled = $true; Skipped = $false; Ahead = $ahead; Behind = $behind }
    }
    finally {
        Pop-Location
    }
}

function Invoke-PostPullRebuild {
    Write-Log 'Running post-pull rebuild (REBUILD_ON_PULL=true)' 'STEP'
    Test-Prerequisites
    Read-SavedPorts
    Stop-AkiliListeners
    Stop-AkiliProcesses
    Initialize-EnvFiles
    if ($script:Flags.InstallDeps) { Install-Dependencies }
    if ($script:Flags.BuildFrontend) { Publish-Frontend }
    if ($script:Flags.RunMigrations) { Invoke-DatabaseMigrations }
}

function Update-Repository {
    Write-Log 'Updating repository' 'STEP'
    if (-not (Test-Path (Join-Path $InstallDir '.git'))) {
        throw "No git repo at $InstallDir. Run install mode first."
    }

    Stop-AkiliListeners
    Stop-AkiliProcesses

    Set-CloneGitEnvironment

    Push-Location $InstallDir
    try {
        $fetchResult = Invoke-GitCommandWithNetworkRetry -GitArgs @('fetch', 'origin', $RepoBranch) -Stage 'fetch'
        if (-not $fetchResult.Ok) {
            $hint = Get-CloneAuthHint -GitOutput $fetchResult.Output
            $detail = if ($fetchResult.Output) { $fetchResult.Output.Trim() } else { "(exit code $($fetchResult.ExitCode))" }
            throw "git fetch failed`n$detail$hint"
        }

        $checkoutResult = Invoke-GitCommand -GitArgs @('checkout', $RepoBranch)
        if (-not $checkoutResult.Ok) {
            $detail = if ($checkoutResult.Output) { $checkoutResult.Output.Trim() } else { "(exit code $($checkoutResult.ExitCode))" }
            throw "git checkout $RepoBranch failed`n$detail"
        }

        $pullResult = Invoke-GitCommandWithNetworkRetry -GitArgs @('pull', 'origin', $RepoBranch) -Stage 'pull'
        if (-not $pullResult.Ok) {
            $hint = Get-CloneAuthHint -GitOutput $pullResult.Output
            $detail = if ($pullResult.Output) { $pullResult.Output.Trim() } else { "(exit code $($pullResult.ExitCode))" }
            throw "git pull failed`n$detail$hint"
        }

        $headResult = Invoke-GitCommand -GitArgs @('log', '-1', '--pretty=format:%h')
        $head = if ($headResult.Ok) { $headResult.Output.Trim() } else { '(unknown)' }
        Write-Log "HEAD is now $head"
    }
    finally {
        Pop-Location
    }
}

function Initialize-EnvFiles {
    Write-Log 'Setting up environment files' 'STEP'

    $serverEnv = Join-Path $InstallDir 'server\.env'
    $frontendEnv = Join-Path $InstallDir 'frontend\.env'
    $collectorEnv = Join-Path $InstallDir 'collector\.env'
    $storageDir = Join-Path $InstallDir 'server\storage'

    if (-not (Test-Path $serverEnv)) {
        Copy-Item (Join-Path $InstallDir 'server\.env.example') $serverEnv
        Write-Log 'Created server\.env from example'
    }
    else {
        Write-Log 'server\.env already exists - updating ports/STORAGE_DIR/DATABASE_URL only'
    }

    if (-not (Test-Path $frontendEnv) -and (Test-Path (Join-Path $InstallDir 'frontend\.env.example'))) {
        Copy-Item (Join-Path $InstallDir 'frontend\.env.example') $frontendEnv
        Write-Log 'Created frontend\.env from example'
    }

    if (-not (Test-Path $collectorEnv) -and (Test-Path (Join-Path $InstallDir 'collector\.env.example'))) {
        Copy-Item (Join-Path $InstallDir 'collector\.env.example') $collectorEnv
        Write-Log 'Created collector\.env from example'
    }

    Set-EnvKey -Path $serverEnv -Key 'STORAGE_DIR' -Value $storageDir
    Ensure-DatabaseUrl -ServerEnv $serverEnv -StorageDir $storageDir | Out-Null
    Set-EnvKey -Path $serverEnv -Key 'SERVER_PORT' -Value "$($script:ChosenServerPort)"
    Set-EnvKey -Path $frontendEnv -Key 'VITE_API_BASE' -Value $ViteApiBase
    if (Test-Path $collectorEnv) {
        Set-EnvKey -Path $collectorEnv -Key 'COLLECTOR_PORT' -Value "$($script:ChosenCollectorPort)"
    }
    # Collector port is also read by server when talking to collector
    Set-EnvKey -Path $serverEnv -Key 'COLLECTOR_PORT' -Value "$($script:ChosenCollectorPort)"

    Initialize-Directory $storageDir
    Save-ChosenPorts

    Write-Log "Configured SERVER_PORT=$($script:ChosenServerPort) COLLECTOR_PORT=$($script:ChosenCollectorPort)"
    Write-Log 'Edit server\.env before production: JWT_SECRET, SIG_KEY, SIG_SALT, LLM_PROVIDER, API keys' 'WARN'
}

function Get-InstallMarkerPath {
    param([string]$ProjectDir, [string]$MarkerName = '.install-vps-deps-done')
    return Join-Path $ProjectDir $MarkerName
}

function Set-InstallMarker {
    param([string]$ProjectDir, [string]$MarkerName = '.install-vps-deps-done')
    try {
        $marker = Get-InstallMarkerPath -ProjectDir $ProjectDir -MarkerName $MarkerName
        Set-Content -Path $marker -Value (Get-Date).ToString('o') -Encoding UTF8 -ErrorAction Stop
    }
    catch {
        Write-Log "Could not write marker $MarkerName in $ProjectDir : $($_.Exception.Message)" 'WARN'
    }
}

function Test-ProjectDepsInstalled {
    param([string]$ProjectDir)
    $nodeModules = Join-Path $ProjectDir 'node_modules'
    if (-not (Test-Path -LiteralPath $nodeModules)) { return $false }

    $pkgJson = Join-Path $ProjectDir 'package.json'
    if (-not (Test-Path -LiteralPath $pkgJson)) { return $false }
    $pkgTime = (Get-Item -LiteralPath $pkgJson).LastWriteTimeUtc

    $marker = Get-InstallMarkerPath -ProjectDir $ProjectDir
    if (Test-Path -LiteralPath $marker) {
        if ((Get-Item -LiteralPath $marker).LastWriteTimeUtc -ge $pkgTime) { return $true }
    }

    $integrity = Join-Path $nodeModules '.yarn-integrity'
    if (Test-Path -LiteralPath $integrity) {
        if ((Get-Item -LiteralPath $integrity).LastWriteTimeUtc -ge $pkgTime) { return $true }
    }

    return $false
}

function Get-FrontendDistEntryHtmlPath {
    param([string]$DistDir)
    foreach ($name in @('_index.html', 'index.html')) {
        $path = Join-Path $DistDir $name
        if (Test-Path -LiteralPath $path) { return $path }
    }
    return $null
}

function Test-FrontendDistHasAssets {
    param([string]$DistDir)
    if (Test-Path -LiteralPath (Join-Path $DistDir 'index.js')) { return $true }
    $assetsDir = Join-Path $DistDir 'assets'
    if (Test-Path -LiteralPath $assetsDir) {
        return ((Get-ChildItem -LiteralPath $assetsDir -File -ErrorAction SilentlyContinue).Count -gt 0)
    }
    return $false
}

function Test-FrontendDistValid {
    param([string]$DistDir)
    if (-not (Test-Path -LiteralPath $DistDir)) { return $false }
    if (-not (Get-FrontendDistEntryHtmlPath -DistDir $DistDir)) { return $false }
    return (Test-FrontendDistHasAssets -DistDir $DistDir)
}

function Test-FrontendBuildComplete {
    $frontendDir = Join-Path $InstallDir 'frontend'
    $distDir = Join-Path $frontendDir 'dist'
    if (-not (Test-FrontendDistValid -DistDir $distDir)) { return $false }

    $distEntry = Get-FrontendDistEntryHtmlPath -DistDir $distDir
    $marker = Get-InstallMarkerPath -ProjectDir $frontendDir -MarkerName '.install-vps-frontend-built'
    if (Test-Path -LiteralPath $marker) { return $true }

    $pkgJson = Join-Path $frontendDir 'package.json'
    if (-not (Test-Path -LiteralPath $pkgJson)) { return $false }
    return ((Get-Item -LiteralPath $distEntry).LastWriteTimeUtc -ge (Get-Item -LiteralPath $pkgJson).LastWriteTimeUtc)
}

function Test-PublicAssetsDeployed {
    $publicDir = Join-Path $InstallDir 'server\public'
    $distDir = Join-Path $InstallDir 'frontend\dist'
    $publicEntry = Get-FrontendDistEntryHtmlPath -DistDir $publicDir
    if (-not $publicEntry) { return $false }
    if (-not (Test-FrontendDistHasAssets -DistDir $publicDir)) { return $false }
    $distEntry = Get-FrontendDistEntryHtmlPath -DistDir $distDir
    if (-not $distEntry) { return $true }
    return ((Get-Item -LiteralPath $publicEntry).LastWriteTimeUtc -ge (Get-Item -LiteralPath $distEntry).LastWriteTimeUtc)
}

function Update-BrowserslistDatabase {
    param([string]$FrontendDir)
    Write-Log 'Updating browserslist / caniuse-lite database (prevents build failures)' 'INFO'
    $prevEap = $ErrorActionPreference
    $ErrorActionPreference = 'Continue'
    Push-Location $FrontendDir
    try {
        & npx --yes update-browserslist-db@latest 2>&1 | ForEach-Object { Write-CommandOutputLine $_ }
        $code = Get-ExitCode
        if ($code -ne 0) {
            Write-Log "update-browserslist-db exited $code; continuing with BROWSERSLIST_IGNORE_OLD_DATA=true" 'WARN'
        }
    }
    finally {
        Pop-Location
        $ErrorActionPreference = $prevEap
    }
}

function Install-ProjectDependencies {
    param(
        [string]$ProjectName,
        [switch]$SkipIfInstalled
    )
    $dir = Join-Path $InstallDir $ProjectName
    if ($SkipIfInstalled -and (Test-ProjectDepsInstalled -ProjectDir $dir)) {
        Write-Log "Skipping $ProjectName yarn install (dependencies already installed)" 'INFO'
        return
    }
    Write-Log "Installing $ProjectName dependencies" 'INFO'
    Invoke-Logged -WorkDir $dir -Command @('yarn')
    Set-InstallMarker -ProjectDir $dir
}

function Install-Dependencies {
    param([switch]$SkipIfInstalled)
    Write-Log 'Installing dependencies (server, collector, frontend)' 'STEP'
    foreach ($dir in @('server', 'collector', 'frontend')) {
        Install-ProjectDependencies -ProjectName $dir -SkipIfInstalled:$SkipIfInstalled
    }
}

function Copy-FrontendToPublic {
    $dist = Join-Path $InstallDir 'frontend\dist'
    $public = Join-Path $InstallDir 'server\public'
    if (-not (Test-FrontendDistValid -DistDir $dist)) {
        throw "Frontend build output missing or incomplete: $dist (expected _index.html or index.html plus JS/CSS assets)"
    }
    Write-Log 'Copying frontend/dist to server/public' 'STEP'
    if (Test-Path -LiteralPath $public) { Remove-Item -LiteralPath $public -Recurse -Force }
    Copy-Item -LiteralPath $dist -Destination $public -Recurse
}

function Publish-Frontend {
    param(
        [switch]$SkipBuildIfComplete,
        [switch]$SkipCopyIfComplete
    )
    $frontendDir = Join-Path $InstallDir 'frontend'
    $shouldBuild = -not ($SkipBuildIfComplete -and (Test-FrontendBuildComplete))

    if ($shouldBuild) {
        Write-Log 'Building frontend' 'STEP'
        Update-BrowserslistDatabase -FrontendDir $frontendDir

        $prevBrowserslist = $env:BROWSERSLIST_IGNORE_OLD_DATA
        $env:BROWSERSLIST_IGNORE_OLD_DATA = 'true'
        try {
            Invoke-Logged -WorkDir $frontendDir -Command @('yarn', 'build')
        }
        finally {
            if ($null -eq $prevBrowserslist) {
                Remove-Item -Path env:BROWSERSLIST_IGNORE_OLD_DATA -ErrorAction SilentlyContinue
            }
            else {
                $env:BROWSERSLIST_IGNORE_OLD_DATA = $prevBrowserslist
            }
        }
        Set-InstallMarker -ProjectDir $frontendDir -MarkerName '.install-vps-frontend-built'
    }
    else {
        Write-Log 'Skipping frontend build (dist already present and up to date)' 'INFO'
    }

    if ($SkipCopyIfComplete -and (Test-PublicAssetsDeployed)) {
        Write-Log 'Skipping copy to server/public (already deployed)' 'INFO'
        return
    }
    Copy-FrontendToPublic
}

function Stop-AkiliWindowsServices {
    foreach ($svcName in @("$ServiceName-Server", "$ServiceName-Collector", $ServiceName)) {
        $svc = Get-Service -Name $svcName -ErrorAction SilentlyContinue
        if (-not $svc) { continue }
        if ($svc.Status -eq 'Stopped') { continue }
        try {
            Write-Log "Stopping Windows service $svcName"
            Stop-Service -Name $svcName -Force -ErrorAction Stop
        }
        catch {
            Write-Log "Could not stop service $svcName : $($_.Exception.Message)" 'WARN'
        }
    }
}

function Unlock-PrismaQueryEngine {
    param([string]$ServerDir)
    $enginePath = Join-Path $ServerDir 'node_modules\.prisma\client\query_engine-windows.dll.node'
    if (-not (Test-Path -LiteralPath $enginePath)) { return }
    try {
        $item = Get-Item -LiteralPath $enginePath -ErrorAction Stop
        $item.Attributes = 'Normal'
    }
    catch { }
    # If still locked, rename aside so prisma generate can write a fresh copy.
    try {
        $bak = "$enginePath.locked-$(Get-Date -Format 'yyyyMMddHHmmss')"
        Move-Item -LiteralPath $enginePath -Destination $bak -Force -ErrorAction Stop
        Write-Log "Moved locked Prisma engine aside: $bak" 'WARN'
    }
    catch {
        Write-Log "Prisma engine still locked: $($_.Exception.Message)" 'WARN'
    }
}

function Invoke-PrismaGenerateWithRetry {
    param([string]$ServerDir)
    $maxAttempts = 3
    for ($attempt = 1; $attempt -le $maxAttempts; $attempt++) {
        try {
            Invoke-Logged -WorkDir $ServerDir -Command @('npx', 'prisma', 'generate', '--schema=./prisma/schema.prisma')
            return
        }
        catch {
            $msg = "$_"
            $isLock = $msg -match '(?i)EPERM|EBUSY|operation not permitted|cannot access|being used by another process'
            if (-not $isLock -or $attempt -eq $maxAttempts) { throw }
            Write-Log "Prisma generate hit a file lock (attempt $attempt/$maxAttempts). Stopping Akili and retrying..." 'WARN'
            Stop-AkiliWindowsServices
            Stop-AkiliListeners
            Stop-AkiliProcesses
            Start-Sleep -Seconds 2
            Unlock-PrismaQueryEngine -ServerDir $ServerDir
            Start-Sleep -Seconds 1
        }
    }
}

function Invoke-DatabaseMigrations {
    Write-Log 'Running Prisma generate and migrate deploy' 'STEP'
    $serverDir = Join-Path $InstallDir 'server'
    $serverEnv = Join-Path $serverDir '.env'
    $storageDir = Get-EnvKeyValue -Path $serverEnv -Key 'STORAGE_DIR'
    if (-not $storageDir) {
        $storageDir = Join-Path $serverDir 'storage'
    }
    Initialize-Directory $storageDir

    # Prisma generate replaces query_engine-windows.dll.node — that fails with EPERM
    # while node/Akili still has the DLL loaded.
    Write-Log 'Stopping Akili before Prisma generate (unlocks query engine DLL)'
    Stop-AkiliWindowsServices
    Stop-AkiliListeners
    Stop-AkiliProcesses
    Start-Sleep -Seconds 2

    $dbUrl = Ensure-DatabaseUrl -ServerEnv $serverEnv -StorageDir $storageDir
    $prevDbUrl = $env:DATABASE_URL
    $env:DATABASE_URL = $dbUrl
    try {
        Invoke-PrismaGenerateWithRetry -ServerDir $serverDir
        Invoke-Logged -WorkDir $serverDir -Command @('npx', 'prisma', 'migrate', 'deploy', '--schema=./prisma/schema.prisma')
    }
    finally {
        if ($null -eq $prevDbUrl) {
            Remove-Item -Path env:DATABASE_URL -ErrorAction SilentlyContinue
        }
        else {
            $env:DATABASE_URL = $prevDbUrl
        }
    }
}

function Add-FirewallRule {
    Write-Log "Opening Windows Firewall for Akili TCP $($script:ChosenServerPort) only (not 80/443)" 'STEP'
    if (@(80, 443) -contains $script:ChosenServerPort) {
        Write-Log 'Refusing to open firewall for 80/443 unless you set SERVER_PORT to a non-privileged app port' 'ERROR'
        throw 'EXPOSE_FIREWALL will not open 80 or 443. Put IIS/nginx on 80/443 and Akili on 3001+.'
    }
    $ruleName = "Akili HTTP $($script:ChosenServerPort)"
    $existing = Get-NetFirewallRule -DisplayName $ruleName -ErrorAction SilentlyContinue
    if ($existing) {
        Write-Log 'Firewall rule already exists'
        return
    }
    New-NetFirewallRule -DisplayName $ruleName -Direction Inbound -Action Allow -Protocol TCP -LocalPort $script:ChosenServerPort | Out-Null
    Write-Log "Firewall rule added for port $($script:ChosenServerPort)"
}

function Start-AkiliServices {
    Write-Log 'Starting Akili server and collector' 'STEP'
    Prepare-AkiliForStart
    $runtime = Ensure-ServerRuntimeEnv

    if ($script:Flags.InstallAsService -and (Test-Path $NssmPath)) {
        $serverSvc = "$ServiceName-Server"
        if (Get-Service -Name $serverSvc -ErrorAction SilentlyContinue) {
            Start-Service $serverSvc
            Start-Service "$ServiceName-Collector"
            Write-Log "Started Windows services $ServiceName-Server and $ServiceName-Collector"
            return
        }
        Write-Log 'Windows services not registered. Set InstallAsService during install.' 'WARN'
    }

    $serverLog = Join-Path $script:LogDir 'server.log'
    $collectorLog = Join-Path $script:LogDir 'collector.log'

    # Pass DATABASE_URL + STORAGE_DIR explicitly so Prisma works even if dumpENV wiped .env earlier.
    $serverArgs = "/c set NODE_ENV=production&& set SERVER_PORT=$($script:ChosenServerPort)&& set COLLECTOR_PORT=$($script:ChosenCollectorPort)&& set STORAGE_DIR=$($runtime.StorageDir)&& set DATABASE_URL=$($runtime.DatabaseUrl)&& node index.js >> `"$serverLog`" 2>&1"
    Start-Process -FilePath 'cmd.exe' -ArgumentList $serverArgs -WorkingDirectory (Join-Path $InstallDir 'server') -WindowStyle Hidden

    $collectorArgs = "/c set NODE_ENV=production&& set COLLECTOR_PORT=$($script:ChosenCollectorPort)&& node index.js >> `"$collectorLog`" 2>&1"
    Start-Process -FilePath 'cmd.exe' -ArgumentList $collectorArgs -WorkingDirectory (Join-Path $InstallDir 'collector') -WindowStyle Hidden

    Start-Sleep -Seconds 3
    Write-Log "Server log: $serverLog"
    Write-Log "Collector log: $collectorLog"
    Write-Log "App URL: http://localhost:$($script:ChosenServerPort)"
}

function Register-WindowsServices {
    Write-Log 'Registering Windows services via NSSM' 'STEP'
    if (-not (Test-Path $NssmPath)) {
        throw "NSSM not found at $NssmPath. Download from https://nssm.cc/"
    }

    Prepare-AkiliForStart
    $runtime = Ensure-ServerRuntimeEnv

    $pairs = @(
        @{
            Name  = "$ServiceName-Server"
            Dir   = 'server'
            Log   = 'server.log'
            Title = "$ServiceDisplay (Server)"
            Extra = "set SERVER_PORT=$($script:ChosenServerPort)&& set COLLECTOR_PORT=$($script:ChosenCollectorPort)&& set STORAGE_DIR=$($runtime.StorageDir)&& set DATABASE_URL=$($runtime.DatabaseUrl)&&"
        },
        @{
            Name  = "$ServiceName-Collector"
            Dir   = 'collector'
            Log   = 'collector.log'
            Title = "$ServiceDisplay (Collector)"
            Extra = "set COLLECTOR_PORT=$($script:ChosenCollectorPort)&&"
        }
    )

    foreach ($svc in $pairs) {
        $logPath = Join-Path $script:LogDir $svc.Log
        $workDir = Join-Path $InstallDir $svc.Dir
        $appArgs = "/c $($svc.Extra) set NODE_ENV=production&& node index.js"

        & $NssmPath install $svc.Name 'cmd.exe' $appArgs 2>&1 | Tee-Object -FilePath $script:LogFile -Append | Out-Null
        & $NssmPath set $svc.Name AppDirectory $workDir 2>&1 | Out-Null
        & $NssmPath set $svc.Name DisplayName $svc.Title 2>&1 | Out-Null
        & $NssmPath set $svc.Name Start SERVICE_AUTO_START 2>&1 | Out-Null
        & $NssmPath set $svc.Name AppStdout $logPath 2>&1 | Out-Null
        & $NssmPath set $svc.Name AppStderr $logPath 2>&1 | Out-Null
        Start-Service $svc.Name
    }

    Write-Log "Registered and started $ServiceName-Server and $ServiceName-Collector"
}

if ($env:AKILI_INSTALLER_SELFTEST -eq '1') {
    Invoke-ResolveInstallDirectorySelfTest
    exit 0
}

$InstallDir = Resolve-InstallDirectory -TargetDir $InstallDir -AutoMigrate $script:Flags.AutoMigrateLegacyDir
if (Test-Path -LiteralPath (Join-Path $InstallDir '.git')) {
    Move-InstallLogToInstallDir
}

# -----------------------------------------------------------------------------
Write-Host ''
Write-Host '============================================================' -ForegroundColor Cyan
Write-Host '   Akili - Windows VPS Installer' -ForegroundColor Cyan
Write-Host '============================================================' -ForegroundColor Cyan
Write-Host ''
Write-Log "Mode: $Mode"
Write-Log "Install dir: $InstallDir"
Write-Log "Repo: $RepoUrl branch=$RepoBranch depth=$CloneDepth retries=$CloneRetries"
if ($Mode -eq 'start') {
    Write-Log "Pull on start: $($script:PullOnStartMode) rebuildOnPull=$($script:Flags.RebuildOnPull) pullForce=$($script:Flags.PullForce) pullFailPolicy=$($script:PullFailPolicy)"
}
elseif ($Mode -in @('install', 'resume', 'update')) {
    Write-Log "Pull if repo exists: $($script:PullIfRepoExistsMode) pullFailPolicy=$($script:PullFailPolicy)"
}
Write-Log "Log file: $script:LogFile"

try {
    $listenMap = Show-VpsOccupancyReport

    if ($Mode -eq 'scan') {
        Write-Log 'Scan-only complete (no changes made)' 'STEP'
        exit 0
    }

    if ($Mode -in @('install', 'resume', 'update', 'start')) {
        Resolve-PortsSafely -ListenMap $listenMap
        Write-Log "Using SERVER_PORT=$($script:ChosenServerPort) COLLECTOR_PORT=$($script:ChosenCollectorPort)"
        Confirm-ContinueIfBusy
    }
    elseif ($Mode -eq 'stop') {
        if ($script:OtherAppsFound -and -not $script:Flags.Yes) {
            Write-Host 'Other apps detected. stop mode only kills Akili processes under InstallDir.' -ForegroundColor Yellow
            $answer = Read-Host 'Continue with Akili-only stop? [Y/N]'
            if ($answer -notmatch '^(Y|y|Yes|yes)$') {
                throw 'Aborted by operator.'
            }
        }
    }

    switch ($Mode) {
        'stop' {
            Read-SavedPorts
            Stop-AkiliListeners
            Stop-AkiliProcesses
            Write-Log 'Stopped Akili listeners and node processes (InstallDir + legacy paths)'
            exit 0
        }
        'start' {
            if (-not (Test-Path (Join-Path $InstallDir 'server\index.js'))) {
                throw "Install not found at $InstallDir. Run install first."
            }
            if ($script:PullOnStartMode -ne 'false') {
                $syncResult = Sync-RepositoryIfNeeded -SyncMode $script:PullOnStartMode -ForcePull:$script:Flags.PullForce
                if ($syncResult.Pulled -and $script:Flags.RebuildOnPull) {
                    Invoke-PostPullRebuild
                }
            }
            # Always repair STORAGE_DIR / DATABASE_URL before start (fixes Multi-User Prisma errors).
            Ensure-ServerRuntimeEnv | Out-Null
            Start-AkiliServices
            exit 0
        }
        'resume' {
            Write-Log 'Resume mode: skipping completed install steps' 'STEP'
            Test-Prerequisites
            if (-not (Test-GitRepoComplete -Path $InstallDir)) {
                throw "Resume requires an existing install at $InstallDir with a valid .git repository. Run install first."
            }
            Move-InstallLogToInstallDir
            Sync-ExistingRepository
            Read-SavedPorts
            Initialize-EnvFiles
            if ($script:Flags.InstallDeps) {
                Install-Dependencies -SkipIfInstalled
            }
            if ($script:Flags.BuildFrontend) {
                Publish-Frontend -SkipBuildIfComplete -SkipCopyIfComplete
            }
            if ($script:Flags.RunMigrations) { Invoke-DatabaseMigrations }
            if ($script:Flags.ExposeFirewall) { Add-FirewallRule }
            if ($script:Flags.InstallAsService) { Register-WindowsServices }
            elseif ($script:Flags.StartAfterInstall) { Start-AkiliServices }
        }
        'update' {
            Test-Prerequisites
            Update-Repository
            Initialize-EnvFiles
            if ($script:Flags.InstallDeps) { Install-Dependencies }
            if ($script:Flags.BuildFrontend) { Publish-Frontend }
            if ($script:Flags.RunMigrations) { Invoke-DatabaseMigrations }
            if ($script:Flags.ExposeFirewall) { Add-FirewallRule }
            if ($script:Flags.InstallAsService) { Register-WindowsServices }
            elseif ($script:Flags.StartAfterInstall) { Start-AkiliServices }
        }
        default {
            # install
            Test-Prerequisites
            Initialize-Repository
            Initialize-EnvFiles
            if ($script:Flags.InstallDeps) { Install-Dependencies }
            if ($script:Flags.BuildFrontend) { Publish-Frontend }
            if ($script:Flags.RunMigrations) { Invoke-DatabaseMigrations }
            if ($script:Flags.ExposeFirewall) { Add-FirewallRule }
            if ($script:Flags.InstallAsService) { Register-WindowsServices }
            elseif ($script:Flags.StartAfterInstall) { Start-AkiliServices }
        }
    }

    Write-Log 'Done' 'STEP'
    Write-Log "Akili should be available at http://localhost:$($script:ChosenServerPort)"
    Write-Log 'Review server/.env for LLM keys, JWT_SECRET, and STORAGE_DIR.'
    if ($script:PortConflictResolved) {
        Write-Log "Ports were remapped. Chosen ports saved to $InstallDir\logs\chosen-ports.json" 'WARN'
    }
    exit 0
}
catch {
    Write-Log $_.Exception.Message 'ERROR'
    Write-Host ''
    Write-Host "Installer failed. See log: $script:LogFile" -ForegroundColor Red
    exit 1
}
