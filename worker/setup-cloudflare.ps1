$ErrorActionPreference = "Stop"
$Host.UI.RawUI.WindowTitle = "SUGO GitHub Ready + Cloudflare Setup"

function Write-Step([string]$Text) {
  Write-Host ""
  Write-Host "============================================================" -ForegroundColor DarkRed
  Write-Host $Text -ForegroundColor Cyan
  Write-Host "============================================================" -ForegroundColor DarkRed
}

function Invoke-WranglerCapture {
  param([Parameter(ValueFromRemainingArguments=$true)][string[]]$Arguments)

  # Windows PowerShell 5.1 converts native stderr (including harmless Wrangler warnings)
  # into PowerShell error records. Temporarily use Continue, capture all output, then
  # trust the native process exit code instead of the output color/channel.
  $previousPreference = $ErrorActionPreference
  try {
    $ErrorActionPreference = "Continue"
    $lines = & npx --yes wrangler@4.110.0 @Arguments 2>&1
    $exitCode = $LASTEXITCODE
  } finally {
    $ErrorActionPreference = $previousPreference
  }

  $text = (($lines | ForEach-Object { [string]$_ }) -join [Environment]::NewLine).Trim()
  if ($exitCode -ne 0) {
    throw "Wrangler command failed (exit $exitCode): wrangler $($Arguments -join ' ')`n$text"
  }
  return $text
}

function Run-Wrangler {
  param([Parameter(ValueFromRemainingArguments=$true)][string[]]$Arguments)
  $output = Invoke-WranglerCapture @Arguments
  if ($output) { Write-Host $output }
}

function Run-WranglerText {
  param([Parameter(ValueFromRemainingArguments=$true)][string[]]$Arguments)
  return (Invoke-WranglerCapture @Arguments)
}

function Get-WorkerUrl([string]$DeployOutput) {
  $matches = [regex]::Matches($DeployOutput, 'https://[a-zA-Z0-9.-]+\.workers\.dev')
  if ($matches.Count -gt 0) { return $matches[$matches.Count - 1].Value.TrimEnd('/') }
  return "https://sugo.dwairy101.workers.dev"
}

function Find-FirstUuid($Node) {
  if ($null -eq $Node) { return $null }
  if ($Node -is [string] -and $Node -match '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$') { return $Node }
  if ($Node -is [System.Collections.IDictionary]) {
    foreach ($key in $Node.Keys) {
      $found = Find-FirstUuid $Node[$key]
      if ($found) { return $found }
    }
  } elseif ($Node -is [System.Collections.IEnumerable] -and -not ($Node -is [string])) {
    foreach ($item in $Node) {
      $found = Find-FirstUuid $item
      if ($found) { return $found }
    }
  } else {
    foreach ($prop in $Node.PSObject.Properties) {
      $found = Find-FirstUuid $prop.Value
      if ($found) { return $found }
    }
  }
  return $null
}

function Get-DeployedVersionId($StatusJson) {
  if ($null -eq $StatusJson) { return $null }
  $versions = @()
  try { $versions = @($StatusJson.versions) } catch {}
  if (-not $versions -or $versions.Count -eq 0) { return $null }

  $selected = $versions | Where-Object { [int]$_.percentage -eq 100 } | Select-Object -First 1
  if (-not $selected) {
    $selected = $versions | Sort-Object { [int]$_.percentage } -Descending | Select-Object -First 1
  }

  foreach ($candidate in @('version_id', 'versionId', 'id')) {
    try {
      $value = [string]$selected.$candidate
      if ($value -match '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$') {
        return $value
      }
    } catch {}
  }
  return $null
}

function Find-KvNamespaceId($Node) {
  if ($null -eq $Node) { return $null }
  $props = @{}
  try {
    foreach ($prop in $Node.PSObject.Properties) { $props[$prop.Name] = $prop.Value }
  } catch {}
  $values = @($props.Values | ForEach-Object { [string]$_ })
  $isSugoKv = $values -contains 'SUGO_KV'
  if ($isSugoKv) {
    foreach ($candidate in @('namespace_id','namespaceId','id')) {
      if ($props.ContainsKey($candidate)) {
        $v = [string]$props[$candidate]
        if ($v -match '^[0-9a-fA-F]{32}$') { return $v }
      }
    }
  }
  if ($Node -is [System.Collections.IDictionary]) {
    foreach ($key in $Node.Keys) {
      $found = Find-KvNamespaceId $Node[$key]
      if ($found) { return $found }
    }
  } elseif ($Node -is [System.Collections.IEnumerable] -and -not ($Node -is [string])) {
    foreach ($item in $Node) {
      $found = Find-KvNamespaceId $item
      if ($found) { return $found }
    }
  } else {
    foreach ($prop in $Node.PSObject.Properties) {
      $found = Find-KvNamespaceId $prop.Value
      if ($found) { return $found }
    }
  }
  return $null
}

$WorkerDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$RootDir = Split-Path -Parent $WorkerDir
$WorkerName = "sugo"
Set-Location $WorkerDir

Write-Step "1/6 Checking Node.js"
if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
  Write-Host "Node.js is not installed." -ForegroundColor Red
  Write-Host "Install the LTS version from nodejs.org, then run START_CLOUDFLARE_SETUP.bat again."
  exit 1
}
Write-Host "Node.js found: $(node --version)" -ForegroundColor Green

Write-Step "2/6 Signing in to Cloudflare"
$who = ""
try { $who = Run-WranglerText whoami } catch {}
if (-not $who -or $who -match 'not authenticated') {
  Write-Host "A Cloudflare page will open. Sign in and press Allow." -ForegroundColor Yellow
  Run-Wrangler login
} else {
  Write-Host "Cloudflare login already active." -ForegroundColor Green
}

Write-Step "3/6 Reusing your existing SUGO Worker and storage"
$kvId = $null
$previousVersionId = $null
try {
  $statusText = Run-WranglerText deployments status --name $WorkerName --json
  $statusJson = $statusText | ConvertFrom-Json
  $previousVersionId = Get-DeployedVersionId $statusJson
  if (-not $previousVersionId) {
    throw "The active production version ID could not be identified."
  }

  $viewText = Run-WranglerText versions view $previousVersionId --name $WorkerName --json
  $viewJson = $viewText | ConvertFrom-Json
  $kvId = Find-KvNamespaceId $viewJson
  if (-not $kvId) {
    throw "The active SUGO_KV binding could not be identified."
  }
} catch {
  Write-Host "SAFE STOP: Cloudflare storage could not be identified reliably." -ForegroundColor Red
  Write-Host "No deployment was made and no KV binding was changed." -ForegroundColor Yellow
  Write-Host $_.Exception.Message -ForegroundColor DarkYellow
  exit 1
}
$toml = @"
name = "$WorkerName"
main = "worker.js"
compatibility_date = "2026-07-11"
workers_dev = true
preview_urls = false

[[kv_namespaces]]
binding = "SUGO_KV"
id = "$kvId"

[vars]
DEBUG_ERRORS = "false"
STRICT_ACCURACY_GATE = "true"
"@
Set-Content -Path (Join-Path $WorkerDir 'wrangler.toml') -Value $toml -Encoding UTF8
Write-Host "Worker name: $WorkerName" -ForegroundColor Green
Write-Host "SUGO_KV: $kvId" -ForegroundColor Green
Write-Host "The existing AI secrets are not being replaced." -ForegroundColor Green
Set-Content -Path (Join-Path $RootDir 'CLOUDFLARE_PREVIOUS_VERSION.txt') -Value "Previous production version: $previousVersionId`r`nSUGO_KV namespace: $kvId`r`nCaptured: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss zzz')" -Encoding UTF8

Write-Step "4/6 Deploying the updated Worker"
$deployOutput = Run-WranglerText deploy --keep-vars
Write-Host $deployOutput
$workerUrl = Get-WorkerUrl $deployOutput
Write-Host "Worker URL: $workerUrl" -ForegroundColor Green

Write-Step "5/6 Verifying existing AI and administrator access"
Start-Sleep -Seconds 3
$health = $null
try { $health = Invoke-RestMethod -Uri "$workerUrl/health" -TimeoutSec 30 } catch {}
if (-not $health) { throw "The Worker was deployed but /health did not respond." }

$hasProvider = ([int]$health.providers.geminiKeys -gt 0) -or
               ([int]$health.providers.cerebrasKeys -gt 0) -or
               ([int]$health.providers.grokKeys -gt 0) -or
               ($health.providers.grok -eq $true)
if ($hasProvider) {
  Write-Host "Existing AI connection: OK" -ForegroundColor Green
} else {
  Write-Host "WARNING: The existing Worker did not report an AI provider key." -ForegroundColor Yellow
  Write-Host "No AI key was deleted or replaced by this setup." -ForegroundColor Yellow
}

if ($health.bindings.adminPassword) {
  Write-Host "Existing administrator password: OK" -ForegroundColor Green
} else {
  $chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789'
  $generated = -join (1..20 | ForEach-Object { $chars[(Get-Random -Maximum $chars.Length)] })
  $previousPreference = $ErrorActionPreference
  try {
    $ErrorActionPreference = "Continue"
    $secretOutput = ($generated | & npx --yes wrangler@4.110.0 secret put ADMIN_PASSWORD --name $WorkerName 2>&1)
    $secretExitCode = $LASTEXITCODE
  } finally {
    $ErrorActionPreference = $previousPreference
  }
  if ($secretOutput) { Write-Host (($secretOutput | ForEach-Object { [string]$_ }) -join [Environment]::NewLine) }
  if ($secretExitCode -ne 0) { throw "Could not create ADMIN_PASSWORD." }
  $passwordFile = Join-Path $RootDir 'ADMIN_PASSWORD_READ_ME.txt'
  Set-Content -Path $passwordFile -Value "Your SUGO administrator password:`r`n$generated`r`n`r`nKeep this file private. It is not included in the GitHub ZIP." -Encoding UTF8
  Write-Host "A new administrator password was generated and saved in ADMIN_PASSWORD_READ_ME.txt" -ForegroundColor Yellow
}

if (-not $health.bindings.kv) { throw "SUGO_KV binding is not active." }
if ($health.bindings.mediaStorage -ne 'kv') { throw "KV image storage is not active." }
Write-Host "Article storage and image storage: OK" -ForegroundColor Green


# The secured Worker must reject an unauthenticated diagnostics request.
$diagStatus = 0
try {
  $diagResponse = Invoke-WebRequest -Uri "$workerUrl/diagnostics" -UseBasicParsing -TimeoutSec 30
  $diagStatus = [int]$diagResponse.StatusCode
} catch {
  try { $diagStatus = [int]$_.Exception.Response.StatusCode.value__ } catch { $diagStatus = 0 }
}
if ($diagStatus -ne 401) {
  throw "Security verification failed: /diagnostics returned HTTP $diagStatus instead of 401."
}
Write-Host "Diagnostics protection: OK (HTTP 401)" -ForegroundColor Green

# Run one harmless AI request to confirm provider secrets survived the deployment.
$aiPayload = @{
  task_type = "ask_ai"
  workspace = "ask_ai"
  max_completion_tokens = 80
  response_mode = "brief"
  output_type = "answer"
  requested_language = "english"
  language = "english"
  sop_mode = "hybrid"
  strict_accuracy_gate = $false
  cache = $false
  stream = $false
  messages = @(
    @{ role = "system"; content = "Reply with exactly SUGO-CLOUDFLARE-OK." },
    @{ role = "user"; content = "Connectivity check." }
  )
} | ConvertTo-Json -Depth 8 -Compress
$aiResult = Invoke-RestMethod -Method Post -Uri "$workerUrl/" -ContentType "application/json" -Body $aiPayload -TimeoutSec 90
$aiText = [string]$aiResult.choices[0].message.content
if ([string]::IsNullOrWhiteSpace($aiText)) {
  throw "AI verification failed after deployment: the response was empty."
}
Write-Host "AI completion after deployment: OK" -ForegroundColor Green

Write-Step "6/6 Connecting the website and creating the GitHub package"
$configJs = @"
/* Generated automatically. Uses the existing SUGO Worker and its AI secrets. */
window.SUGO_WORKER_URL = "$workerUrl";
"@
Set-Content -Path (Join-Path $RootDir 'js\config.js') -Value $configJs -Encoding UTF8

$zipPath = Join-Path $RootDir 'SUGO_GITHUB_UPLOAD_READY.zip'
if (Test-Path $zipPath) { Remove-Item $zipPath -Force }

$stageDir = Join-Path ([System.IO.Path]::GetTempPath()) ("sugo-github-" + [guid]::NewGuid().ToString("N"))
New-Item -ItemType Directory -Path $stageDir | Out-Null
try {
  $items = Get-ChildItem $RootDir -Force | Where-Object {
    $_.Name -notin @('.git', 'node_modules', '.wrangler', 'SUGO_GITHUB_UPLOAD_READY.zip', 'ADMIN_PASSWORD_READ_ME.txt', 'CLOUDFLARE_PREVIOUS_VERSION.txt')
  }
  foreach ($item in $items) {
    Copy-Item -Path $item.FullName -Destination $stageDir -Recurse -Force
  }
  foreach ($generatedPath in @(
    (Join-Path $stageDir 'worker\node_modules'),
    (Join-Path $stageDir 'worker\.wrangler'),
    (Join-Path $stageDir 'ADMIN_PASSWORD_READ_ME.txt'),
    (Join-Path $stageDir 'CLOUDFLARE_PREVIOUS_VERSION.txt')
  )) {
    if (Test-Path $generatedPath) { Remove-Item $generatedPath -Recurse -Force }
  }
  $stageItems = Get-ChildItem $stageDir -Force
  Compress-Archive -Path $stageItems.FullName -DestinationPath $zipPath -CompressionLevel Optimal
} finally {
  if (Test-Path $stageDir) { Remove-Item $stageDir -Recurse -Force }
}

Write-Host ""
Write-Host "SUCCESS" -ForegroundColor Green
Write-Host "Existing AI Worker kept: $workerUrl" -ForegroundColor Green
Write-Host "Complete GitHub repository package:" -ForegroundColor Cyan
Write-Host $zipPath -ForegroundColor White
Write-Host "Extract the ZIP, then upload its CONTENTS to the GitHub repository root." -ForegroundColor Yellow
