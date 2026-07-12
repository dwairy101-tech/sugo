[CmdletBinding()]
param(
  [string]$ProjectRoot = "",
  [switch]$SkipAiTest
)

$ErrorActionPreference = "Stop"
$ProgressPreference = "SilentlyContinue"
$WranglerVersion = "4.110.0"

try {
  [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
} catch {}

function Write-Step([string]$Text) {
  Write-Host ""
  Write-Host "============================================================" -ForegroundColor DarkCyan
  Write-Host $Text -ForegroundColor Cyan
  Write-Host "============================================================" -ForegroundColor DarkCyan
}

function Protect-Text([string]$Text) {
  if ([string]::IsNullOrEmpty($Text)) { return $Text }
  $safe = $Text

  # Remove authorization headers and common API key formats if a tool ever prints them.
  $safe = [regex]::Replace($safe, '(?i)(Authorization\s*:\s*Bearer\s+)[A-Za-z0-9._~+\-/=]+', '$1[REDACTED]')
  $safe = [regex]::Replace($safe, '(?i)\bsk-[A-Za-z0-9_-]{16,}\b', '[REDACTED_KEY]')
  $safe = [regex]::Replace($safe, '(?i)\bAIza[A-Za-z0-9_-]{20,}\b', '[REDACTED_KEY]')
  $safe = [regex]::Replace($safe, '(?im)^(\s*(?:CLOUDFLARE_API_TOKEN|CF_API_TOKEN|GLOBAL_API_KEY|AUTH_TOKEN|API_TOKEN|API_KEY|SECRET|PASSWORD|ADMIN_PASSWORD|GEMINI_KEY(?:_\d+)?|GEMINI_API_KEY(?:_\d+)?|CEREBRAS_KEY(?:_\d+)?|CEREBRAS_API_KEY(?:_\d+)?|GROK_API_KEY|XAI_API_KEY)\s*[:=]\s*)[^\r\n]+', '$1[REDACTED]')

  # Partially mask email addresses for privacy while leaving the domain visible.
  $safe = [regex]::Replace($safe, '\b([A-Za-z0-9._%+\-]{1,2})[A-Za-z0-9._%+\-]*(@[A-Za-z0-9.\-]+\.[A-Za-z]{2,})\b', '$1***$2')
  return $safe
}

function Save-Text([string]$Path, [string]$Text) {
  $safe = Protect-Text $Text
  Set-Content -LiteralPath $Path -Value $safe -Encoding UTF8
}

$script:Checks = @()
function Add-Check([string]$Name, [string]$Status, [string]$Details) {
  $script:Checks += [pscustomobject]@{
    Check = $Name
    Status = $Status
    Details = $Details
  }

  $color = switch ($Status) {
    "PASS" { "Green" }
    "WARN" { "Yellow" }
    "FAIL" { "Red" }
    default { "White" }
  }
  Write-Host ("[{0}] {1}: {2}" -f $Status, $Name, $Details) -ForegroundColor $color
}

function Invoke-WranglerCapture {
  param([Parameter(Mandatory=$true)][string[]]$Arguments)

  $previousPreference = $ErrorActionPreference
  try {
    $ErrorActionPreference = "Continue"
    $lines = & npx --yes "wrangler@$WranglerVersion" @Arguments 2>&1
    $exitCode = $LASTEXITCODE
  } finally {
    $ErrorActionPreference = $previousPreference
  }

  $text = (($lines | ForEach-Object { [string]$_ }) -join [Environment]::NewLine).Trim()
  return [pscustomobject]@{
    ExitCode = [int]$exitCode
    Text = $text
    Command = "npx --yes wrangler@$WranglerVersion " + ($Arguments -join " ")
  }
}

function Save-WranglerResult {
  param(
    [Parameter(Mandatory=$true)][string]$FileName,
    [Parameter(Mandatory=$true)][string]$CheckName,
    [Parameter(Mandatory=$true)][string[]]$Arguments,
    [switch]$WarnOnly
  )

  $result = Invoke-WranglerCapture -Arguments $Arguments
  $content = "$($result.Command)`r`nExit code: $($result.ExitCode)`r`n`r`n$($result.Text)"
  Save-Text (Join-Path $ReportDir $FileName) $content

  if ($result.ExitCode -eq 0) {
    Add-Check $CheckName "PASS" "Command completed successfully."
  } elseif ($WarnOnly) {
    Add-Check $CheckName "WARN" "Command returned exit code $($result.ExitCode). See $FileName."
  } else {
    Add-Check $CheckName "FAIL" "Command returned exit code $($result.ExitCode). See $FileName."
  }
  return $result
}

function Find-ProjectPaths {
  param([string]$RequestedRoot)

  $candidates = @()
  if ($RequestedRoot) { $candidates += (Resolve-Path -LiteralPath $RequestedRoot -ErrorAction SilentlyContinue).Path }
  $candidates += $PSScriptRoot
  $candidates += (Split-Path -Parent $PSScriptRoot)
  $candidates += (Get-Location).Path

  foreach ($candidate in ($candidates | Where-Object { $_ } | Select-Object -Unique)) {
    if (Test-Path (Join-Path $candidate "worker\wrangler.toml")) {
      return [pscustomobject]@{ Root = $candidate; Worker = (Join-Path $candidate "worker") }
    }
    if ((Split-Path -Leaf $candidate) -eq "worker" -and (Test-Path (Join-Path $candidate "wrangler.toml"))) {
      return [pscustomobject]@{ Root = (Split-Path -Parent $candidate); Worker = $candidate }
    }
  }
  return $null
}

function Get-WorkerName([string]$ConfigPath) {
  $config = Get-Content -LiteralPath $ConfigPath -Raw
  $match = [regex]::Match($config, '(?m)^\s*name\s*=\s*["'']([^"'']+)["'']')
  if ($match.Success) { return $match.Groups[1].Value.Trim() }
  return "sugo"
}

function Get-WorkerUrl([string]$RootDir, [string]$WorkerDir, [string]$WorkerName) {
  $files = @(
    (Join-Path $RootDir "js\config.js"),
    (Join-Path $WorkerDir "wrangler.toml"),
    (Join-Path $RootDir "README.md")
  )
  foreach ($file in $files) {
    if (-not (Test-Path $file)) { continue }
    $text = Get-Content -LiteralPath $file -Raw
    $match = [regex]::Match($text, 'https://[A-Za-z0-9.-]+\.workers\.dev')
    if ($match.Success) { return $match.Value.TrimEnd('/') }
  }
  if ($WorkerName -eq "sugo") { return "https://sugo.dwairy101.workers.dev" }
  return ""
}

function Invoke-HttpRequestSafe {
  param(
    [Parameter(Mandatory=$true)][string]$Method,
    [Parameter(Mandatory=$true)][string]$Uri,
    [hashtable]$Headers = @{},
    [string]$Body = "",
    [string]$ContentType = "application/json",
    [int]$TimeoutSeconds = 45
  )

  Add-Type -AssemblyName System.Net.Http
  $handler = New-Object System.Net.Http.HttpClientHandler
  $client = New-Object System.Net.Http.HttpClient($handler)
  $client.Timeout = [TimeSpan]::FromSeconds($TimeoutSeconds)
  $methodObject = New-Object System.Net.Http.HttpMethod($Method.ToUpperInvariant())
  $request = New-Object System.Net.Http.HttpRequestMessage($methodObject, $Uri)

  foreach ($key in $Headers.Keys) {
    [void]$request.Headers.TryAddWithoutValidation([string]$key, [string]$Headers[$key])
  }
  if ($Body -ne "") {
    $request.Content = New-Object System.Net.Http.StringContent($Body, [Text.Encoding]::UTF8, $ContentType)
  }

  try {
    $response = $client.SendAsync($request).GetAwaiter().GetResult()
    $responseBody = $response.Content.ReadAsStringAsync().GetAwaiter().GetResult()
    $responseHeaders = @{}
    foreach ($header in $response.Headers) { $responseHeaders[$header.Key] = ($header.Value -join ", ") }
    foreach ($header in $response.Content.Headers) { $responseHeaders[$header.Key] = ($header.Value -join ", ") }
    return [pscustomobject]@{
      StatusCode = [int]$response.StatusCode
      Reason = [string]$response.ReasonPhrase
      Headers = $responseHeaders
      Body = [string]$responseBody
      Error = ""
    }
  } catch {
    return [pscustomobject]@{
      StatusCode = 0
      Reason = "Request failed"
      Headers = @{}
      Body = ""
      Error = $_.Exception.Message
    }
  } finally {
    if ($request) { $request.Dispose() }
    if ($client) { $client.Dispose() }
    if ($handler) { $handler.Dispose() }
  }
}

function Save-HttpResult {
  param(
    [Parameter(Mandatory=$true)][string]$FileName,
    [Parameter(Mandatory=$true)][string]$Method,
    [Parameter(Mandatory=$true)][string]$Uri,
    [Parameter(Mandatory=$true)]$Result,
    [int]$BodyLimit = 12000
  )

  $headerLines = @()
  foreach ($key in ($Result.Headers.Keys | Sort-Object)) {
    $headerLines += "$key`: $($Result.Headers[$key])"
  }
  $body = [string]$Result.Body
  if ($body.Length -gt $BodyLimit) {
    $body = $body.Substring(0, $BodyLimit) + "`r`n...[TRUNCATED; original characters: $($Result.Body.Length)]"
  }
  $text = @"
$Method $Uri
Status: $($Result.StatusCode) $($Result.Reason)
Error: $($Result.Error)

HEADERS
$($headerLines -join [Environment]::NewLine)

BODY
$body
"@
  Save-Text (Join-Path $ReportDir $FileName) $text
}

function Get-JsonPropertyValue($Object, [string[]]$Names) {
  foreach ($name in $Names) {
    if ($null -ne $Object -and $Object.PSObject.Properties.Name -contains $name) {
      return $Object.$name
    }
  }
  return $null
}

$paths = Find-ProjectPaths -RequestedRoot $ProjectRoot
if (-not $paths) {
  Write-Host "Could not find worker\wrangler.toml. Extract this tool into the SUGO project root and run it again." -ForegroundColor Red
  Read-Host "Press Enter to close"
  exit 1
}

$RootDir = $paths.Root
$WorkerDir = $paths.Worker
$ConfigPath = Join-Path $WorkerDir "wrangler.toml"
$WorkerName = Get-WorkerName $ConfigPath
$WorkerUrl = Get-WorkerUrl $RootDir $WorkerDir $WorkerName
$Timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$ReportDir = Join-Path $RootDir "SUGO_CLOUDFLARE_REPORT_$Timestamp"
$ReportZip = "$ReportDir.zip"
New-Item -ItemType Directory -Path $ReportDir -Force | Out-Null

Set-Location $WorkerDir

Write-Step "SUGO Cloudflare read-only diagnostic"
Write-Host "Project: $RootDir"
Write-Host "Worker:  $WorkerName"
Write-Host "URL:     $WorkerUrl"
Write-Host "No deployments, secrets, KV values, or settings will be changed." -ForegroundColor Yellow

Write-Step "1/6 Checking local tools"
if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
  Add-Check "Node.js" "FAIL" "Node.js is not installed. Install Node.js LTS first."
  $script:FatalLocal = $true
} else {
  Add-Check "Node.js" "PASS" "$(node --version)"
}
if (-not (Get-Command npx -ErrorAction SilentlyContinue)) {
  Add-Check "npx" "FAIL" "npx is not available."
  $script:FatalLocal = $true
} else {
  Add-Check "npx" "PASS" "Available."
}

$systemInfo = @"
Generated: $(Get-Date -Format "yyyy-MM-dd HH:mm:ss zzz")
Computer: $env:COMPUTERNAME
Windows user: $env:USERNAME
PowerShell: $($PSVersionTable.PSVersion)
Node: $(if (Get-Command node -ErrorAction SilentlyContinue) { node --version } else { 'missing' })
NPM: $(if (Get-Command npm -ErrorAction SilentlyContinue) { npm --version } else { 'missing' })
Worker name: $WorkerName
Worker URL: $WorkerUrl
Project root: $RootDir
Wrangler requested version: $WranglerVersion
Mode: READ ONLY
"@
Save-Text (Join-Path $ReportDir "00_SYSTEM_INFO.txt") $systemInfo

if ($script:FatalLocal) {
  $script:Checks | ConvertTo-Json -Depth 5 | Set-Content -LiteralPath (Join-Path $ReportDir "SUMMARY.json") -Encoding UTF8
  Compress-Archive -Path (Join-Path $ReportDir "*") -DestinationPath $ReportZip -CompressionLevel Optimal -Force
  Write-Host "Report created: $ReportZip" -ForegroundColor Yellow
  Read-Host "Press Enter to close"
  exit 1
}

Write-Step "2/6 Signing in safely with Cloudflare OAuth"
$who = Invoke-WranglerCapture -Arguments @("whoami")
if ($who.ExitCode -ne 0 -or $who.Text -match '(?i)not authenticated|not logged in|login') {
  Write-Host "Cloudflare will open in your browser. Sign in there and approve Wrangler." -ForegroundColor Yellow
  Write-Host "Do not paste an API token or password into this window." -ForegroundColor Yellow
  $previousPreference = $ErrorActionPreference
  try {
    $ErrorActionPreference = "Continue"
    & npx --yes "wrangler@$WranglerVersion" login
    $loginExit = $LASTEXITCODE
  } finally {
    $ErrorActionPreference = $previousPreference
  }
  if ($loginExit -ne 0) {
    Add-Check "Cloudflare login" "FAIL" "OAuth login did not complete."
  } else {
    $who = Invoke-WranglerCapture -Arguments @("whoami")
  }
}
Save-Text (Join-Path $ReportDir "01_WHOAMI.txt") ("$($who.Command)`r`nExit code: $($who.ExitCode)`r`n`r`n$($who.Text)")
if ($who.ExitCode -eq 0) {
  Add-Check "Cloudflare login" "PASS" "Wrangler is authenticated."
} else {
  Add-Check "Cloudflare login" "FAIL" "Wrangler is not authenticated."
}

Write-Step "3/6 Reading Cloudflare deployment metadata"
$wranglerInfo = Save-WranglerResult -FileName "02_WRANGLER_VERSION.txt" -CheckName "Wrangler version" -Arguments @("--version")
$deployments = Save-WranglerResult -FileName "03_DEPLOYMENTS.json.txt" -CheckName "Deployment list" -Arguments @("deployments", "list", "--name", $WorkerName, "--json")
$status = Save-WranglerResult -FileName "04_DEPLOYMENT_STATUS.json.txt" -CheckName "Production deployment status" -Arguments @("deployments", "status", "--name", $WorkerName, "--json")
$versions = Save-WranglerResult -FileName "05_VERSIONS.json.txt" -CheckName "Worker versions" -Arguments @("versions", "list", "--name", $WorkerName, "--json")
$secrets = Save-WranglerResult -FileName "06_SECRET_NAMES.json.txt" -CheckName "Secret names" -Arguments @("secret", "list", "--name", $WorkerName, "--format", "json")
$kv = Save-WranglerResult -FileName "07_KV_NAMESPACES.txt" -CheckName "KV namespace list" -Arguments @("kv", "namespace", "list")

if ($status.ExitCode -eq 0) {
  $activeVersionId = $null
  try {
    $jsonStart = $status.Text.IndexOf('{')
    if ($jsonStart -ge 0) {
      $statusJson = $status.Text.Substring($jsonStart) | ConvertFrom-Json
      $activeVersions = @($statusJson.versions)
      $active = $activeVersions | Where-Object { [int]$_.percentage -eq 100 } | Select-Object -First 1
      if (-not $active) {
        $active = $activeVersions | Sort-Object { [int]$_.percentage } -Descending | Select-Object -First 1
      }
      if ($active) {
        $activeVersionId = [string](Get-JsonPropertyValue $active @("version_id", "versionId", "id"))
      }
    }
  } catch {}
  if ($activeVersionId) {
    Save-WranglerResult -FileName "08_ACTIVE_VERSION_DETAILS.json.txt" -CheckName "Active production version bindings" -Arguments @("versions", "view", $activeVersionId, "--name", $WorkerName, "--json") | Out-Null
  } else {
    Add-Check "Active production version bindings" "WARN" "Could not identify the active production version ID from deployment status."
  }
}

Write-Step "4/6 Compiling the Worker without deploying"
$dryRunDir = Join-Path $ReportDir "_dry_run_build"
$dryRun = Save-WranglerResult -FileName "09_DRY_RUN_BUILD.txt" -CheckName "Worker dry-run build" -Arguments @("deploy", "--dry-run", "--outdir", $dryRunDir)
if (Test-Path $dryRunDir) { Remove-Item -LiteralPath $dryRunDir -Recurse -Force -ErrorAction SilentlyContinue }

$sanitizedConfig = Get-Content -LiteralPath $ConfigPath -Raw
Save-Text (Join-Path $ReportDir "10_WRANGLER_CONFIG.txt") $sanitizedConfig
if (Test-Path (Join-Path $RootDir "js\config.js")) {
  Save-Text (Join-Path $ReportDir "11_WEBSITE_CONFIG.txt") (Get-Content -LiteralPath (Join-Path $RootDir "js\config.js") -Raw)
}

Write-Step "5/6 Checking the deployed Worker over HTTPS"
$healthObject = $null
$corsOrigin = "https://example.github.io"
if (-not $WorkerUrl) {
  Add-Check "Worker URL" "FAIL" "Worker URL could not be detected from js/config.js or wrangler.toml."
} else {
  $rootResponse = Invoke-HttpRequestSafe -Method "GET" -Uri "$WorkerUrl/"
  Save-HttpResult -FileName "12_HTTP_ROOT.txt" -Method "GET" -Uri "$WorkerUrl/" -Result $rootResponse
  if ($rootResponse.StatusCode -eq 200) {
    Add-Check "Worker root endpoint" "PASS" "HTTP 200."
  } else {
    Add-Check "Worker root endpoint" "FAIL" "HTTP $($rootResponse.StatusCode)."
  }

  $healthResponse = Invoke-HttpRequestSafe -Method "GET" -Uri "$WorkerUrl/health"
  Save-HttpResult -FileName "13_HTTP_HEALTH.txt" -Method "GET" -Uri "$WorkerUrl/health" -Result $healthResponse
  if ($healthResponse.StatusCode -eq 200) {
    Add-Check "Worker health endpoint" "PASS" "HTTP 200."
    try {
      $healthObject = $healthResponse.Body | ConvertFrom-Json
      if ($healthObject.bindings.kv -eq $true) { Add-Check "SUGO_KV binding" "PASS" "KV binding is active." }
      else { Add-Check "SUGO_KV binding" "FAIL" "KV binding is missing." }

      if ($healthObject.bindings.adminPassword -eq $true) { Add-Check "Administrator secret" "PASS" "ADMIN_PASSWORD exists; its value was not read." }
      else { Add-Check "Administrator secret" "WARN" "ADMIN_PASSWORD is not configured." }

      $providerCount = 0
      if ($healthObject.providers.geminiKeys) { $providerCount += [int]$healthObject.providers.geminiKeys }
      if ($healthObject.providers.cerebrasKeys) { $providerCount += [int]$healthObject.providers.cerebrasKeys }
      if ($healthObject.providers.grokKeys) { $providerCount += [int]$healthObject.providers.grokKeys }
      elseif ($healthObject.providers.grok -eq $true) { $providerCount += 1 }
      if ($providerCount -gt 0) { Add-Check "AI provider secrets" "PASS" "$providerCount provider key(s) reported by /health." }
      else { Add-Check "AI provider secrets" "FAIL" "No AI provider key is reported by /health." }

      if ($healthObject.bindings.corsOrigin -and [string]$healthObject.bindings.corsOrigin -ne "*") {
        $corsOrigin = [string]$healthObject.bindings.corsOrigin
      }
    } catch {
      Add-Check "Health JSON" "FAIL" "The /health response was not valid JSON."
    }
  } else {
    Add-Check "Worker health endpoint" "FAIL" "HTTP $($healthResponse.StatusCode)."
  }

  $diagResponse = Invoke-HttpRequestSafe -Method "GET" -Uri "$WorkerUrl/diagnostics"
  Save-HttpResult -FileName "14_HTTP_DIAGNOSTICS_PROTECTION.txt" -Method "GET" -Uri "$WorkerUrl/diagnostics" -Result $diagResponse
  if ($diagResponse.StatusCode -eq 401) {
    Add-Check "Diagnostics protection" "PASS" "Unauthorized request correctly returned HTTP 401."
  } else {
    Add-Check "Diagnostics protection" "WARN" "Expected HTTP 401 but received $($diagResponse.StatusCode)."
  }

  $corsHeaders = @{
    "Origin" = $corsOrigin
    "Access-Control-Request-Method" = "POST"
    "Access-Control-Request-Headers" = "content-type"
  }
  $corsResponse = Invoke-HttpRequestSafe -Method "OPTIONS" -Uri "$WorkerUrl/" -Headers $corsHeaders
  Save-HttpResult -FileName "15_HTTP_CORS_PREFLIGHT.txt" -Method "OPTIONS" -Uri "$WorkerUrl/" -Result $corsResponse
  $allowOrigin = ""
  if ($corsResponse.Headers.ContainsKey("Access-Control-Allow-Origin")) { $allowOrigin = [string]$corsResponse.Headers["Access-Control-Allow-Origin"] }
  if ($corsResponse.StatusCode -eq 204 -and ($allowOrigin -eq "*" -or $allowOrigin -eq $corsOrigin)) {
    Add-Check "CORS preflight" "PASS" "Origin $corsOrigin is allowed."
  } else {
    Add-Check "CORS preflight" "FAIL" "HTTP $($corsResponse.StatusCode); Access-Control-Allow-Origin='$allowOrigin'."
  }

  foreach ($endpoint in @("menu", "content", "media")) {
    $response = Invoke-HttpRequestSafe -Method "GET" -Uri "$WorkerUrl/$endpoint"
    Save-HttpResult -FileName ("16_HTTP_{0}.txt" -f $endpoint.ToUpperInvariant()) -Method "GET" -Uri "$WorkerUrl/$endpoint" -Result $response -BodyLimit 1800
    if ($response.StatusCode -eq 200) {
      Add-Check ("Public /$endpoint endpoint") "PASS" "HTTP 200; response characters: $($response.Body.Length)."
    } else {
      Add-Check ("Public /$endpoint endpoint") "FAIL" "HTTP $($response.StatusCode)."
    }
  }
}

Write-Step "6/6 Running one small AI connectivity test"
if ($SkipAiTest) {
  Add-Check "AI completion test" "WARN" "Skipped by command-line option."
} elseif (-not $WorkerUrl) {
  Add-Check "AI completion test" "FAIL" "Worker URL is unavailable."
} else {
  $testPayload = @{
    task_type = "ask_ai"
    workspace = "ask_ai"
    max_completion_tokens = 120
    response_mode = "brief"
    output_type = "answer"
    requested_language = "english"
    language = "english"
    sop_mode = "hybrid"
    strict_accuracy_gate = $false
    cache = $false
    stream = $false
    messages = @(
      @{ role = "system"; content = "This is a harmless connectivity diagnostic. Reply with exactly SUGO-CLOUDFLARE-OK." },
      @{ role = "user"; content = "Run the connectivity check now." }
    )
  }
  $testBody = $testPayload | ConvertTo-Json -Depth 8 -Compress
  $aiResponse = Invoke-HttpRequestSafe -Method "POST" -Uri "$WorkerUrl/" -Headers @{ "Origin" = $corsOrigin } -Body $testBody -ContentType "application/json" -TimeoutSeconds 90
  Save-HttpResult -FileName "17_HTTP_AI_TEST.txt" -Method "POST" -Uri "$WorkerUrl/" -Result $aiResponse -BodyLimit 8000

  if ($aiResponse.StatusCode -eq 200) {
    try {
      $aiJson = $aiResponse.Body | ConvertFrom-Json
      $answer = [string]$aiJson.choices[0].message.content
      $provider = [string]$aiJson._meta.provider
      $model = [string]$aiJson._meta.model
      if ($answer.Trim().Length -gt 0) {
        Add-Check "AI completion test" "PASS" "Provider='$provider'; model='$model'; non-empty response received."
      } else {
        Add-Check "AI completion test" "FAIL" "HTTP 200 but the answer was empty."
      }
    } catch {
      Add-Check "AI completion test" "FAIL" "HTTP 200 but response JSON could not be parsed."
    }
  } else {
    Add-Check "AI completion test" "FAIL" "HTTP $($aiResponse.StatusCode). See 17_HTTP_AI_TEST.txt."
  }
}

# Create a compact human-readable summary.
$summaryLines = @()
$summaryLines += "SUGO CLOUDFLARE DIAGNOSTIC SUMMARY"
$summaryLines += "Generated: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss zzz')"
$summaryLines += "Worker: $WorkerName"
$summaryLines += "URL: $WorkerUrl"
$summaryLines += "Mode: READ ONLY"
$summaryLines += ""
foreach ($check in $script:Checks) {
  $summaryLines += "[$($check.Status)] $($check.Check) - $($check.Details)"
}
$passCount = @($script:Checks | Where-Object { $_.Status -eq "PASS" }).Count
$warnCount = @($script:Checks | Where-Object { $_.Status -eq "WARN" }).Count
$failCount = @($script:Checks | Where-Object { $_.Status -eq "FAIL" }).Count
$summaryLines += ""
$summaryLines += "TOTAL: PASS=$passCount  WARN=$warnCount  FAIL=$failCount"
$summaryLines += ""
$summaryLines += "Security note: secret values are never requested. The report contains only secret names/types and sanitized command output."
Save-Text (Join-Path $ReportDir "SUMMARY.txt") ($summaryLines -join [Environment]::NewLine)
$script:Checks | ConvertTo-Json -Depth 6 | Set-Content -LiteralPath (Join-Path $ReportDir "SUMMARY.json") -Encoding UTF8

if (Test-Path $ReportZip) { Remove-Item -LiteralPath $ReportZip -Force }
Compress-Archive -Path (Join-Path $ReportDir "*") -DestinationPath $ReportZip -CompressionLevel Optimal -Force

Write-Step "Finished"
Write-Host "PASS: $passCount   WARN: $warnCount   FAIL: $failCount" -ForegroundColor $(if ($failCount -gt 0) { "Yellow" } else { "Green" })
Write-Host ""
Write-Host "Upload this ZIP file to ChatGPT:" -ForegroundColor Cyan
Write-Host $ReportZip -ForegroundColor White
Write-Host ""
Write-Host "This diagnostic did not deploy or change Cloudflare resources." -ForegroundColor Green
Start-Process explorer.exe -ArgumentList "/select,`"$ReportZip`"" -ErrorAction SilentlyContinue
Read-Host "Press Enter to close"
