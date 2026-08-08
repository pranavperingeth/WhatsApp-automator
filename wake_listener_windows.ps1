# wake_listener_windows.ps1
# Windows Wake Listener Setup Script for CP HUB Contest Automator
#
# Run this script once in PowerShell (as Administrator) to register a
# Task Scheduler task that pings the n8n webhook every time your laptop
# wakes from sleep.
#
# Features:
#   - 45-second delay: gives hostel/campus Wi-Fi time to reconnect before
#     n8n tries to fetch from Codeforces/LeetCode APIs
#   - 30-minute cooldown (via wake_trigger.ps1): Windows fires multiple
#     wake events per session (network, display, USB etc.) — the cooldown
#     ensures only the first one actually hits the webhook
#   - RunOnlyIfNetworkAvailable: skips silently if Wi-Fi is still not up
#   - Hidden PowerShell window: no terminal flashes on wake
#   - MultipleInstancesPolicy=IgnoreNew: won't stack duplicate triggers

$scriptPath = Split-Path -Parent $MyInvocation.MyCommand.Path
$triggerScript = Join-Path $scriptPath "wake_trigger.ps1"

$taskXml = @"
<?xml version="1.0" encoding="UTF-16"?>
<Task version="1.2" xmlns="http://schemas.microsoft.com/windows/2004/02/mit/task">
  <Triggers>
    <EventTrigger>
      <Enabled>true</Enabled>
      <Subscription>&lt;QueryList&gt;&lt;Query Id="0" Path="System"&gt;&lt;Select Path="System"&gt;*[System[Provider[@Name='Microsoft-Windows-Power-Troubleshooter'] and EventID=1]]&lt;/Select&gt;&lt;/Query&gt;&lt;/QueryList&gt;</Subscription>
      <Delay>PT45S</Delay>
    </EventTrigger>
  </Triggers>
  <Principals>
    <Principal id="Author">
      <LogonType>InteractiveToken</LogonType>
      <RunLevel>LeastPrivilege</RunLevel>
    </Principal>
  </Principals>
  <Settings>
    <MultipleInstancesPolicy>IgnoreNew</MultipleInstancesPolicy>
    <DisallowStartIfOnBatteries>false</DisallowStartIfOnBatteries>
    <StopIfGoingOnBatteries>false</StopIfGoingOnBatteries>
    <AllowHardTerminate>true</AllowHardTerminate>
    <StartWhenAvailable>true</StartWhenAvailable>
    <RunOnlyIfNetworkAvailable>true</RunOnlyIfNetworkAvailable>
    <AllowStartOnDemand>true</AllowStartOnDemand>
    <Enabled>true</Enabled>
    <Hidden>false</Hidden>
    <ExecutionTimeLimit>PT1M</ExecutionTimeLimit>
  </Settings>
  <Actions Context="Author">
    <Exec>
      <Command>powershell.exe</Command>
      <Arguments>-WindowStyle Hidden -ExecutionPolicy Bypass -File "$triggerScript"</Arguments>
    </Exec>
  </Actions>
</Task>
"@

Register-ScheduledTask -TaskName "n8n Wake Listener" -Xml $taskXml -Force

Write-Host ""
Write-Host "✅ Wake Listener task registered successfully!" -ForegroundColor Green
Write-Host ""
Write-Host "The task will fire 45 seconds after your laptop wakes from sleep."
Write-Host "A 30-minute cooldown prevents multiple wake events from spamming the webhook."
Write-Host ""
Write-Host "To verify: Open Task Scheduler and look for 'n8n Wake Listener'."
