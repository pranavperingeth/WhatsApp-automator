# start_docker_and_containers.ps1
# Waits for Docker Desktop to be fully ready, then starts all containers.
# Place this in the WhatsApp-automator folder.

Write-Host "Waiting for Docker Desktop to start..."

$timeout = 120  # seconds
$elapsed = 0
$ready = $false

while ($elapsed -lt $timeout) {
    try {
        $result = docker info 2>$null
        if ($LASTEXITCODE -eq 0) {
            $ready = $true
            break
        }
    } catch {}
    Start-Sleep -Seconds 5
    $elapsed += 5
    Write-Host "  Still waiting... ($elapsed s)"
}

if (-not $ready) {
    Write-Host "Docker did not start within $timeout seconds. Exiting."
    exit 1
}

Write-Host "Docker is ready! Starting containers..."
docker compose up -d
Write-Host "All containers started."
