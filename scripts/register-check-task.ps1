$ErrorActionPreference = "Stop"

$checkScript = Join-Path $PSScriptRoot "check-and-fix.ps1"
$taskName = "TECHVERSE30 - Automated checks"
$powershell = Join-Path $PSHOME "powershell.exe"
$repoRoot = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
$taskAction = New-ScheduledTaskAction `
    -Execute $powershell `
    -Argument ('-NoProfile -ExecutionPolicy Bypass -File "{0}"' -f $checkScript) `
    -WorkingDirectory $repoRoot
$taskTrigger = New-ScheduledTaskTrigger `
    -Once `
    -At (Get-Date).AddMinutes(5) `
    -RepetitionInterval (New-TimeSpan -Hours 2)
$taskSettings = New-ScheduledTaskSettingsSet `
    -StartWhenAvailable `
    -AllowStartIfOnBatteries `
    -DontStopIfGoingOnBatteries
$taskPrincipal = New-ScheduledTaskPrincipal `
    -UserId ([System.Security.Principal.WindowsIdentity]::GetCurrent().Name) `
    -LogonType Interactive `
    -RunLevel Limited

Register-ScheduledTask `
    -TaskName $taskName `
    -Action $taskAction `
    -Trigger $taskTrigger `
    -Settings $taskSettings `
    -Principal $taskPrincipal `
    -Description "Run TECHVERSE 30 lint, type, build, and API checks every two hours." `
    -Force | Out-Null

$registeredTask = Get-ScheduledTask -TaskName $taskName -ErrorAction Stop
if ($registeredTask.Triggers[0].Repetition.Interval -ne "PT2H") {
    throw "The scheduled task was registered with an unexpected repetition interval."
}

Write-Output "Registered '$taskName' to run every 2 hours."
Write-Output "Logs are written under $env:LOCALAPPDATA\TECHVERSE30\checks."
Write-Output "To remove it: Unregister-ScheduledTask -TaskName `"$taskName`" -Confirm:`$false"
