# wake_trigger.ps1
# Called by Task Scheduler on every wake event.
# Rate-limited to once per 30 minutes to prevent multiple Windows wake
# events (network reconnect, display on, USB, etc.) from spamming the webhook.

$lockFile = "$env:TEMP\n8n_wake_lock.txt"
$cooldownMinutes = 30

# Check if we ran recently
if (Test-Path $lockFile) {
    $lastRun = Get-Content $lockFile -ErrorAction SilentlyContinue | Get-Date -ErrorAction SilentlyContinue
    if ($lastRun -and ((Get-Date) - $lastRun).TotalMinutes -lt $cooldownMinutes) {
        # Ran within cooldown window — skip silently
        exit 0
    }
}

# Write the lock timestamp BEFORE calling the webhook
(Get-Date).ToString("o") | Set-Content $lockFile

# Hit the n8n webhook
try {
    Invoke-RestMethod -Uri 'http://localhost:5678/webhook/contest-check' -Method Post -TimeoutSec 10
} catch {
    # Webhook failed (Docker not running etc.) — remove the lock so next wake can retry
    Remove-Item $lockFile -ErrorAction SilentlyContinue
}
