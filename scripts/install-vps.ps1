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
.NOTES
  Keep this file beside install-vps.bat. The .bat is the only entry point operators run.
#>
[CmdletBinding()]
param(
    [ValidateSet('install', 'resume', 'update', 'start', 'stop', 'scan')]
    [string]$Mode = 'install',

    [string]$RepoUrl = 'https://github.com/BQI-TECH/AccelaNova.git',
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

    [string]$NssmPath = 'C:\Tools\nssm\nssm.exe',
    [string]$ServiceName = 'Akili',
    [string]$ServiceDisplay = 'Akili AI Server'
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

function ConvertTo-BoolFlag([string]$Value) {
    if ([string]::IsNullOrWhiteSpace($Value)) { return $false }
    return @('1', 'true', 'yes', 'y', 'on') -contains ($Value.Trim().ToLowerInvariant())
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
    Resume            = ($Mode -eq 'resume')
}

if ($script:Flags.Resume) {
    $script:Flags.SkipClone = $true
}

$script:ChosenServerPort = $ServerPort
$script:ChosenCollectorPort = $CollectorPort
$script:OtherAppsFound = $false
$script:PortConflictResolved = $false

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

# Log under TEMP until clone succeeds so InstallDir stays empty for git clone.
# If the repo already exists (update/start), log under InstallDir\logs immediately.
$script:LogDir = Join-Path $env:TEMP 'Akili-install-logs'
if (Test-Path -LiteralPath (Join-Path $InstallDir '.git')) {
    $script:LogDir = Join-Path $InstallDir 'logs'
}
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
    $normalized = [System.IO.Path]::GetFullPath($StorageDir).Replace('\', '/').TrimEnd('/')
    return "file:$normalized/akili.db"
}

function Ensure-DatabaseUrl {
    param([string]$ServerEnv, [string]$StorageDir)
    $existing = Get-EnvKeyValue -Path $ServerEnv -Key 'DATABASE_URL'
    if ($existing) {
        Write-Log 'DATABASE_URL already set in server\.env'
        return $existing
    }
    $dbUrl = Get-SqliteDatabaseUrl -StorageDir $StorageDir
    Set-EnvKey -Path $ServerEnv -Key 'DATABASE_URL' -Value $dbUrl
    Write-Log "Set DATABASE_URL=$dbUrl"
    return $dbUrl
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

function Test-OwnerIsAkili {
    param([int]$ProcessId, [string]$PathOrCmd)
    if (Test-PathUnderInstall $PathOrCmd) { return $true }
    try {
        $cim = Get-CimInstance Win32_Process -Filter "ProcessId=$ProcessId" -ErrorAction SilentlyContinue
        if ($cim -and $cim.CommandLine -and ($cim.CommandLine -like "*$InstallDir*")) {
            return $true
        }
    }
    catch { }
    return $false
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
            $rows += [pscustomobject]@{
                Port    = $port
                Status  = 'IN USE'
                Pid     = $owner.Pid
                Process = $procName
                Path    = $path
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
        $script:PortConflictResolved = $true
    }
    else {
        $script:ChosenServerPort = $ServerPort
    }

    $avoid = @($script:ChosenServerPort)
    if ($collectorOwnerForeign -or ($script:ChosenServerPort -eq $CollectorPort)) {
        $script:ChosenCollectorPort = Find-NextFreePort -Preferred $CollectorPort -ListenMap $ListenMap -AlsoAvoid $avoid
        if ($script:ChosenCollectorPort -ne $CollectorPort) {
            Write-Log "COLLECTOR_PORT $CollectorPort unavailable - using $($script:ChosenCollectorPort) instead" 'WARN'
            $script:PortConflictResolved = $true
        }
    }
    else {
        $script:ChosenCollectorPort = $CollectorPort
    }

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

function Stop-AkiliProcesses {
    Write-Log "Stopping Akili node processes under $InstallDir only" 'STEP'
    Get-CimInstance Win32_Process -Filter "Name='node.exe'" -ErrorAction SilentlyContinue |
        Where-Object { $_.CommandLine -and ($_.CommandLine -like "*$InstallDir*") } |
        ForEach-Object {
            Write-Log "Stopping Akili node PID $($_.ProcessId)"
            Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue
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

function Get-CloneAuthHint {
    param([string]$GitOutput)
    $text = "$GitOutput"
    if ($text -match '(?i)(authentication failed|could not read Username|Invalid username or password|403|401 Unauthorized|Repository not found|remote:.*not found)') {
        return @"

This looks like a private-repo or auth failure.
Fix options:
  1. Run: gh auth login   (then re-run this installer)
  2. Use a PAT in REPO_URL: https://<TOKEN>@github.com/BQI-TECH/AccelaNova.git
  3. Use SSH and a deploy key: git@github.com:BQI-TECH/AccelaNova.git
"@
    }
    if ($text -match '(?i)(timed out|SSL|Connection reset|Failed to connect|unable to access|HTTP/2|RPC failed|early EOF|unexpected disconnect)') {
        return @"

Network/timeout during clone (repo pack is large; shallow clone should help).
If HTTPS keeps failing, set REPO_URL to the SSH form: git@github.com:BQI-TECH/AccelaNova.git
"@
    }
    return ''
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
        return
    }

    if (Test-GitRepoComplete -Path $InstallDir) {
        Write-Log "Skipping clone (repository already exists at $InstallDir)" 'INFO'
        Move-InstallLogToInstallDir
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

function Update-Repository {
    Write-Log 'Updating repository' 'STEP'
    if (-not (Test-Path (Join-Path $InstallDir '.git'))) {
        throw "No git repo at $InstallDir. Run install mode first."
    }

    Stop-AkiliProcesses

    Push-Location $InstallDir
    try {
        git fetch origin $RepoBranch 2>&1 | Tee-Object -FilePath $script:LogFile -Append | Out-Null
        if ((Get-ExitCode) -ne 0) { throw 'git fetch failed' }
        git checkout $RepoBranch 2>&1 | Tee-Object -FilePath $script:LogFile -Append | Out-Null
        git pull origin $RepoBranch 2>&1 | Tee-Object -FilePath $script:LogFile -Append | Out-Null
        if ((Get-ExitCode) -ne 0) { throw 'git pull failed' }
        $head = git log -1 --pretty=format:'%h'
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

function Invoke-DatabaseMigrations {
    Write-Log 'Running Prisma generate and migrate deploy' 'STEP'
    $serverDir = Join-Path $InstallDir 'server'
    $serverEnv = Join-Path $serverDir '.env'
    $storageDir = Get-EnvKeyValue -Path $serverEnv -Key 'STORAGE_DIR'
    if (-not $storageDir) {
        $storageDir = Join-Path $serverDir 'storage'
    }
    Initialize-Directory $storageDir
    $dbUrl = Ensure-DatabaseUrl -ServerEnv $serverEnv -StorageDir $storageDir
    $prevDbUrl = $env:DATABASE_URL
    $env:DATABASE_URL = $dbUrl
    try {
        Invoke-Logged -WorkDir $serverDir -Command @('npx', 'prisma', 'generate', '--schema=./prisma/schema.prisma')
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
    Read-SavedPorts

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

    Stop-AkiliProcesses

    $serverLog = Join-Path $script:LogDir 'server.log'
    $collectorLog = Join-Path $script:LogDir 'collector.log'

    $serverArgs = "/c set NODE_ENV=production&& set SERVER_PORT=$($script:ChosenServerPort)&& set COLLECTOR_PORT=$($script:ChosenCollectorPort)&& node index.js >> `"$serverLog`" 2>&1"
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

    Stop-AkiliProcesses

    $pairs = @(
        @{ Name = "$ServiceName-Server"; Dir = 'server'; Log = 'server.log'; Title = "$ServiceDisplay (Server)"; Extra = "set SERVER_PORT=$($script:ChosenServerPort)&& set COLLECTOR_PORT=$($script:ChosenCollectorPort)&&" },
        @{ Name = "$ServiceName-Collector"; Dir = 'collector'; Log = 'collector.log'; Title = "$ServiceDisplay (Collector)"; Extra = "set COLLECTOR_PORT=$($script:ChosenCollectorPort)&&" }
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

# -----------------------------------------------------------------------------
Write-Host ''
Write-Host '============================================================' -ForegroundColor Cyan
Write-Host '   Akili - Windows VPS Installer' -ForegroundColor Cyan
Write-Host '============================================================' -ForegroundColor Cyan
Write-Host ''
Write-Log "Mode: $Mode"
Write-Log "Install dir: $InstallDir"
Write-Log "Repo: $RepoUrl branch=$RepoBranch depth=$CloneDepth retries=$CloneRetries"
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
            Stop-AkiliProcesses
            Write-Log 'Stopped Akili node processes under InstallDir (if any)'
            exit 0
        }
        'start' {
            if (-not (Test-Path (Join-Path $InstallDir 'server\index.js'))) {
                throw "Install not found at $InstallDir. Run install first."
            }
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
