# Push Akili to GitHub in smaller batches (useful for large history or slow connections)
# Run in PowerShell: .\push-in-bits.ps1

$ErrorActionPreference = "Stop"
$RepoRoot = $PSScriptRoot
$BatchSize = 10   # commits per push (increase for faster, decrease for smaller "bits")
$Remote = "origin"
$Branch = "main"

Set-Location $RepoRoot

# Ensure remote exists
$remotes = git remote
if ($remotes -notmatch $Remote) {
    Write-Host "Adding remote $Remote..."
    git remote add origin "https://github.com/GeotechCompanybq/AccelaNova.git"
}
git remote set-url $Remote "https://github.com/GeotechCompanybq/AccelaNova.git"
git branch -M $Branch

# Smaller post buffer = smaller chunks over the wire (optional, in bytes)
git config http.postBuffer 5242880   # 5MB per chunk

# Fetch to know what's on remote (may fail if first push)
$fetchOk = $false
try { git fetch $Remote 2>&1 | Out-Null; $fetchOk = $true } catch {}

# Get list of commits to push (main not on origin/main), oldest first
$commitsToPush = @()
if ($fetchOk) {
    $commitsToPush = git rev-list main ^origin/main --reverse 2>$null
    if ($commitsToPush) { $commitsToPush = $commitsToPush -split "`n" | Where-Object { $_.Trim() } }
}

if (-not $commitsToPush -or $commitsToPush.Count -eq 0) {
    Write-Host "Pushing entire branch in one go..."
    git push -u $Remote $Branch
    exit $LASTEXITCODE
}

$total = $commitsToPush.Count
Write-Host "Pushing $total commits in batches of $BatchSize..."

$batches = [System.Collections.ArrayList]@()
for ($i = 0; $i -lt $commitsToPush.Count; $i += $BatchSize) {
    $end = [Math]::Min($i + $BatchSize, $commitsToPush.Count) - 1
    $batchLastCommit = $commitsToPush[$end]
    [void]$batches.Add($batchLastCommit)
}

$num = 0
foreach ($batchTip in $batches) {
    $num++
    Write-Host "Bit $num of $($batches.Count): pushing up to $batchTip..."
    git push $Remote "${batchTip}:refs/heads/${Branch}"
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Push failed at bit $num. Fix and re-run script to continue."
        exit $LASTEXITCODE
    }
}

Write-Host "Setting upstream and syncing..."
git push -u $Remote $Branch
Write-Host "Done. All bits pushed to $Remote/$Branch."
git config --unset-all http.postBuffer 2>$null
