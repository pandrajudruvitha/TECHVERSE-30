$ErrorActionPreference = "Continue"

$repoRoot = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
$logDirectory = Join-Path $env:LOCALAPPDATA "TECHVERSE30\checks"
$null = New-Item -ItemType Directory -Path $logDirectory -Force
$logPath = Join-Path $logDirectory ("check-{0}.log" -f (Get-Date -Format "yyyyMMdd-HHmmss"))
$failures = New-Object System.Collections.Generic.List[string]
$transcriptStarted = $false

function Invoke-Check {
    param(
        [Parameter(Mandatory = $true)][string]$Name,
        [Parameter(Mandatory = $true)][scriptblock]$Command
    )

    Write-Output "`n=== $Name ==="
    $global:LASTEXITCODE = 1
    & $Command
    $result = $LASTEXITCODE
    if ($null -eq $result) {
        $result = 0
    }

    if ($result -ne 0) {
        $script:failures.Add("$Name (exit code $result)")
    }
}

try {
    Start-Transcript -Path $logPath | Out-Null
    $transcriptStarted = $true
    Write-Output "TECHVERSE 30 checks started at $(Get-Date -Format o)"
    Write-Output "Only ESLint safe fixes are applied automatically."

    Push-Location (Join-Path $repoRoot "apps\web")
    Invoke-Check -Name "ESLint auto-fix" -Command { npm run lint -- --fix }
    Invoke-Check -Name "TypeScript" -Command {
        & ".\node_modules\.bin\tsc.cmd" --noEmit -p tsconfig.json
    }
    $env:TECHVERSE_AUTOMATED_BUILD = "1"
    Invoke-Check -Name "Production build" -Command {
        npm run build
    }
    Remove-Item Env:TECHVERSE_AUTOMATED_BUILD -ErrorAction SilentlyContinue
    Pop-Location

    $python = Join-Path $repoRoot ".venv\Scripts\python.exe"
    if (Test-Path $python) {
        $env:PYTHONPATH = Join-Path $repoRoot "apps\api"
        Invoke-Check -Name "API tests" -Command {
            & $python -m pytest (Join-Path $repoRoot "apps\api\tests")
        }
    } else {
        $failures.Add("API tests (missing .venv\Scripts\python.exe)")
    }

    if ($failures.Count -eq 0) {
        Write-Output "`nAll scheduled checks passed."
    } else {
        Write-Output "`nChecks needing review:"
        $failures | ForEach-Object { Write-Output "- $_" }
    }
    Write-Output "Full log: $logPath"
} catch {
    $failures.Add("Automation script error: $($_.Exception.Message)")
    Write-Error $_
} finally {
    if (Get-Location | Where-Object { $_.Path -eq (Join-Path $repoRoot "apps\web") }) {
        Pop-Location
    }
    if ($transcriptStarted) {
        Write-Output "TECHVERSE 30 checks finished at $(Get-Date -Format o)"
        Stop-Transcript | Out-Null
    }
}

if ($failures.Count -gt 0) {
    exit 1
}
