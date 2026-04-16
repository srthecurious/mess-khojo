# ============================================================
#  MessKhojo  -  Pre-Push Quality Gate
#  run_checks.ps1
#
#  Usage:
#    powershell -ExecutionPolicy Bypass -File run_checks.ps1
#    powershell -ExecutionPolicy Bypass -File run_checks.ps1 -SkipBuild
# ============================================================

param(
    [switch]$SkipBuild
)

# -- Resolve Paths --
# Script: <project>/.agents/skills/pre-push-check/scripts/run_checks.ps1
# Levels:  scripts(1) -> pre-push-check(2) -> skills(3) -> .agents(4) -> <project>
$ScriptDir   = Split-Path -Parent $MyInvocation.MyCommand.Path
$ProjectRoot = Split-Path -Parent (Split-Path -Parent (Split-Path -Parent (Split-Path -Parent $ScriptDir)))
$ClientDir   = Join-Path $ProjectRoot "client"

# ?? Helpers ????????????????????????????????????????????????
$Results = [System.Collections.Generic.List[PSCustomObject]]::new()

function Write-Pass  { Write-Host "  [PASS] $args" -ForegroundColor Green  }
function Write-Fail  { Write-Host "  [FAIL] $args" -ForegroundColor Red    }
function Write-Warn  { Write-Host "  [WARN] $args" -ForegroundColor Yellow }
function Write-Info  { Write-Host "  [INFO] $args" -ForegroundColor Cyan   }
function Write-Section ($title) {
    Write-Host ""
    Write-Host ("=" * 60) -ForegroundColor DarkGray
    Write-Host "  $title" -ForegroundColor Magenta
    Write-Host ("=" * 60) -ForegroundColor DarkGray
}

function Add-Result($Name, $Status, $Detail) {
    $Results.Add([PSCustomObject]@{ Check = $Name; Status = $Status; Detail = $Detail })
}

# ?? Banner ?????????????????????????????????????????????????
Write-Host ""
Write-Host "  ????????????????????????????????????????????????" -ForegroundColor Magenta
Write-Host "  ?   MessKhojo  -  Pre-Push Quality Gate  ??      ?" -ForegroundColor Magenta
Write-Host "  ????????????????????????????????????????????????" -ForegroundColor Magenta
Write-Host "  Project : $ProjectRoot" -ForegroundColor DarkGray
Write-Host "  Time    : $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')" -ForegroundColor DarkGray
Write-Host ""


# ??????????????????????????????????????????????????????????
# CHECK 1  -  ESLint
# ??????????????????????????????????????????????????????????
Write-Section "1 / 7  ESLint"

Push-Location $ClientDir
$lintOut = npm run lint 2>&1
$lintExit = $LASTEXITCODE
Pop-Location

if ($lintExit -eq 0) {
    Write-Pass "No ESLint errors found"
    Add-Result "ESLint" "PASS" "No errors"
} else {
    Write-Fail "ESLint reported errors  -  fix before pushing"
    $lintOut | Where-Object { $_ -match "error|warning" } | Select-Object -First 20 | ForEach-Object {
        Write-Host "    $_" -ForegroundColor DarkRed
    }
    Add-Result "ESLint" "FAIL" "Lint errors present"
}


# ??????????????????????????????????????????????????????????
# CHECK 2  -  Vite Production Build
# ??????????????????????????????????????????????????????????
Write-Section "2 / 7  Production Build"

if ($SkipBuild) {
    Write-Warn "Build check skipped (-SkipBuild flag)"
    Add-Result "Build" "SKIP" "Skipped by flag"
} else {
    Push-Location $ClientDir
    $buildOut = npm run build 2>&1
    $buildExit = $LASTEXITCODE
    Pop-Location

    if ($buildExit -eq 0) {
        Write-Pass "Production build succeeded"
        Add-Result "Build" "PASS" "Clean build"
    } else {
        Write-Fail "Build failed  -  cannot push broken code"
        $buildOut | Select-Object -Last 30 | ForEach-Object {
            Write-Host "    $_" -ForegroundColor DarkRed
        }
        Add-Result "Build" "FAIL" "Build error"
    }
}


# ??????????????????????????????????????????????????????????
# CHECK 3  -  Secret / API Key Scanner
# ??????????????????????????????????????????????????????????
Write-Section "3 / 7  Secret Scanner"

# Patterns that suggest leaked secrets
# Using \x22 (double-quote) and \x27 (single-quote) hex escapes to avoid PowerShell string parsing issues
$SecretPatterns = @(
    'AIza[0-9A-Za-z\-_]{35}',
    'sk-[a-zA-Z0-9]{32,}',
    'PRIVATE_KEY\s*=\s*[\x22\x27][^\x22\x27]+',
    'password\s*=\s*[\x22\x27][^\x22\x27]{6,}',
    'secret\s*[:=]\s*[\x22\x27][^\x22\x27]{8,}',
    'token\s*[:=]\s*[\x22\x27][A-Za-z0-9_\-]{16,}',
    'TELEGRAM_BOT_TOKEN\s*=\s*\d+:',
    'authDomain\s*:\s*[\x22\x27][^\x22\x27]+\.firebaseapp\.com'
)

$ScanExtensions = @('*.js', '*.jsx', '*.ts', '*.tsx')
$SecretsFound   = @()

$SrcDir = Join-Path $ClientDir "src"
foreach ($ext in $ScanExtensions) {
    $files = Get-ChildItem -Path $SrcDir -Recurse -Filter $ext -ErrorAction SilentlyContinue |
             Where-Object { $_.FullName -notmatch "(node_modules|dist|\.git)" }

    foreach ($file in $files) {
        $content = Get-Content $file.FullName -Raw -ErrorAction SilentlyContinue
        if (-not $content) { continue }

        foreach ($pattern in $SecretPatterns) {
            if ($content -match $pattern) {
                $SecretsFound += "$($file.Name)  -  matched pattern: $pattern"
            }
        }
    }
}

# Also check firebase.js specifically for hardcoded config values
$FirebaseFile = Join-Path $SrcDir "firebase.js"
if (Test-Path $FirebaseFile) {
    $fbContent = Get-Content $FirebaseFile -Raw
    # It's OK if it reads from import.meta.env  -  check it's not hardcoded
    if ($fbContent -match 'apiKey\s*:\s*"AIza') {
        $SecretsFound += "firebase.js  -  hardcoded apiKey detected (should use import.meta.env)"
    }
}

if ($SecretsFound.Count -eq 0) {
    Write-Pass "No secrets or API keys detected in source files"
    Add-Result "Secret Scan" "PASS" "No secrets found"
} else {
    Write-Fail "$($SecretsFound.Count) potential secret(s) found"
    $SecretsFound | ForEach-Object { Write-Host "    ? $_" -ForegroundColor DarkRed }
    Add-Result "Secret Scan" "FAIL" "$($SecretsFound.Count) secrets detected"
}


# ??????????????????????????????????????????????????????????
# CHECK 4  -  .env File Leak Check
# ??????????????????????????????????????????????????????????
Write-Section "4 / 7  .env Leak Check"

Push-Location $ProjectRoot
$envLeaks = @()

# Use git ls-files to find any tracked .env files (excluding .env.example)
$allTracked = git ls-files 2>&1 | Where-Object { $_ -match "\.env" -and $_ -notmatch "\.env\.example" }

Pop-Location

if ($allTracked.Count -gt 0) {
    $envLeaks = $allTracked
}

if ($envLeaks.Count -eq 0) {
    Write-Pass ".env files are not tracked by git"
    # Verify .env.example exists (safe to track)
    $exampleExists = Test-Path (Join-Path $ClientDir ".env.example")
    if ($exampleExists) {
        Write-Info ".env.example found (safe  -  this is the template)"
    }
    Add-Result ".env Leak" "PASS" "No .env in git index"
} else {
    Write-Fail "The following .env files are tracked by git  -  REMOVE THEM IMMEDIATELY"
    $envLeaks | ForEach-Object { Write-Host "    ? $_" -ForegroundColor DarkRed }
    Write-Host "    Run: git rm --cached <file>" -ForegroundColor Yellow
    Add-Result ".env Leak" "FAIL" "$($envLeaks.Count) .env file(s) tracked"
}


# ??????????????????????????????????????????????????????????
# CHECK 5  -  npm audit (high/critical CVEs)
# ??????????????????????????????????????????????????????????
Write-Section "5 / 7  Dependency Audit"

Push-Location $ClientDir
$auditOut  = npm audit --audit-level=high 2>&1
$auditExit = $LASTEXITCODE
Pop-Location

if ($auditExit -eq 0) {
    Write-Pass "No high or critical vulnerabilities found"
    Add-Result "npm Audit" "PASS" "No high/critical CVEs"
} else {
    # Extract summary line
    $summary = $auditOut | Where-Object { $_ -match "vulnerabilit" } | Select-Object -Last 1
    Write-Warn "Vulnerabilities detected: $summary"
    Write-Info "Run 'npm audit' in client/ for full details"
    Write-Info "Run 'npm audit fix' to auto-fix if available"
    # Audit warnings are non-blocking if only moderate  -  check severity
    $criticalLines = $auditOut | Where-Object { $_ -match "critical|high" }
    if ($criticalLines.Count -gt 0) {
        Write-Fail "Critical/high severity CVEs present  -  address before pushing to production"
        Add-Result "npm Audit" "FAIL" "Critical/high CVEs found"
    } else {
        Write-Warn "Only moderate/low vulnerabilities  -  review but not blocking"
        Add-Result "npm Audit" "WARN" "Moderate/low CVEs only"
    }
}


# ??????????????????????????????????????????????????????????
# CHECK 6  -  Firestore & Storage Rules Safety
# ??????????????????????????????????????????????????????????
Write-Section "6 / 7  Security Rules Check"

$RulesFiles = @(
    (Join-Path $ProjectRoot "firestore.rules"),
    (Join-Path $ProjectRoot "storage.rules")
)

$RulesIssues = @()
$RulesWarnings = @()

foreach ($rulesFile in $RulesFiles) {
    if (-not (Test-Path $rulesFile)) {
        Write-Info "$(Split-Path -Leaf $rulesFile) not found  -  skipping"
        continue
    }

    $content = Get-Content $rulesFile -Raw
    $fileName = Split-Path -Leaf $rulesFile

    # Check for fully open rules
    if ($content -match "allow\s+read,\s*write\s*:\s*if\s+true") {
        $RulesIssues += "$fileName  -  DANGER: allow read, write: if true (fully open!)"
    }
    if ($content -match "allow\s+read\s*:\s*if\s+true") {
        $RulesWarnings += "$fileName  -  WARNING: allow read: if true (open read access)"
    }
    if ($content -match "allow\s+write\s*:\s*if\s+true") {
        $RulesIssues += "$fileName  -  DANGER: allow write: if true (open write access)"
    }
    if ($content -match "match\s*/\{document=\*\*\}" -and $content -match "if\s+true") {
        $RulesIssues += "$fileName  -  open wildcard rule detected"
    }

    if ($RulesIssues.Count -eq 0 -and $RulesWarnings.Count -eq 0) {
        Write-Pass "$fileName looks safe"
    }
}

if ($RulesIssues.Count -eq 0) {
    if ($RulesWarnings.Count -gt 0) {
        Add-Result "Security Rules" "WARN" "$($RulesWarnings.Count) open read rule(s)"
        $RulesWarnings | ForEach-Object { Write-Warn $_ }
    } else {
        Add-Result "Security Rules" "PASS" "No open rules detected"
    }
} else {
    Write-Fail "Dangerous security rules found:"
    $RulesIssues | ForEach-Object { Write-Host "    ? $_" -ForegroundColor DarkRed }
    Add-Result "Security Rules" "FAIL" "$($RulesIssues.Count) rule issue(s)"
}


# ??????????????????????????????????????????????????????????
# CHECK 7  -  Git Status Summary (informational)
# ??????????????????????????????????????????????????????????
Write-Section "7 / 7  Git Status Summary"

Push-Location $ProjectRoot
$gitStatus  = git status --short 2>&1
$gitBranch  = git branch --show-current 2>&1
$gitLog     = git log --oneline -5 2>&1
Pop-Location

Write-Info "Branch  : $gitBranch"
Write-Host ""
Write-Info "Files staged / modified:"
if ($gitStatus) {
    $gitStatus | ForEach-Object { Write-Host "    $_" -ForegroundColor Gray }
} else {
    Write-Host "    (nothing to commit  -  working tree clean)" -ForegroundColor DarkGray
}
Write-Host ""
Write-Info "Last 5 commits:"
$gitLog | ForEach-Object { Write-Host "    $_" -ForegroundColor DarkGray }
Add-Result "Git Status" "INFO" "Branch: $gitBranch"


# ??????????????????????????????????????????????????????????
# FINAL SUMMARY
# ??????????????????????????????????????????????????????????
Write-Host ""
Write-Host ("=" * 60) -ForegroundColor DarkGray
Write-Host "  SUMMARY" -ForegroundColor White
Write-Host ("=" * 60) -ForegroundColor DarkGray

$FailCount = 0
$WarnCount = 0

foreach ($r in $Results) {
    $color = switch ($r.Status) {
        "PASS" { "Green"  }
        "FAIL" { "Red"    }
        "WARN" { "Yellow" }
        "SKIP" { "Gray"   }
        "INFO" { "Cyan"   }
        default{ "White"  }
    }
    Write-Host ("  [{0,-4}]  {1,-20}  {2}" -f $r.Status, $r.Check, $r.Detail) -ForegroundColor $color
    if ($r.Status -eq "FAIL") { $FailCount++ }
    if ($r.Status -eq "WARN") { $WarnCount++ }
}

Write-Host ""
if ($FailCount -gt 0) {
    Write-Host "  ?  $FailCount check(s) FAILED  -  DO NOT PUSH until fixed" -ForegroundColor Red
    Write-Host ""
    exit 1
} elseif ($WarnCount -gt 0) {
    Write-Host "  ?  All blocking checks passed with $WarnCount warning(s)" -ForegroundColor Yellow
    Write-Host "  ?  Safe to push  -  but review warnings above" -ForegroundColor Green
    Write-Host ""
    exit 0
} else {
    Write-Host "  ?  All checks passed  -  safe to push! ??" -ForegroundColor Green
    Write-Host ""
    exit 0
}
