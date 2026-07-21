<div align="center">
  <img src="logo.png" alt="CP HUB Logo" width="250" style="border-radius: 10px; margin-bottom: 20px;"/>
  <h1>🏆 CP HUB Contest Automator 🤖</h1>
  <p>The official automated WhatsApp notification system for <b>CP HUB</b>. An intelligent, state-aware bot that fetches upcoming programming contests from <b>Codeforces</b> and <b>LeetCode</b> to keep the community informed and ready to code!</p>

  ![Docker](https://img.shields.io/badge/docker-%230db7ed.svg?style=for-the-badge&logo=docker&logoColor=white)
  ![n8n](https://img.shields.io/badge/n8n-%23FF6C37.svg?style=for-the-badge&logo=n8n&logoColor=white)
  ![WhatsApp](https://img.shields.io/badge/WhatsApp-25D366?style=for-the-badge&logo=whatsapp&logoColor=white)
  ![JavaScript](https://img.shields.io/badge/javascript-%23323330.svg?style=for-the-badge&logo=javascript&logoColor=%23F7DF1E)
  ![Codeforces](https://img.shields.io/badge/Codeforces-445f9d?style=for-the-badge&logo=Codeforces&logoColor=white)
  ![LeetCode](https://img.shields.io/badge/LeetCode-000000?style=for-the-badge&logo=LeetCode&logoColor=#d16c06)
</div>

---

## 🏗️ Architecture & Framework

This project is built entirely on a containerized microservices architecture to ensure it runs completely autonomously in the background without needing a cloud provider.

### The Tech Stack
* **[n8n](https://n8n.io/):** The core automation engine. It handles scheduling, orchestrating API calls, and executing the custom Javascript logic.
* **[Evolution API](https://evolution-api.com/):** A powerful open-source WhatsApp API built on top of the Baileys library. It handles the actual WhatsApp Web session via a headless browser protocol so we can send messages programmatically.
* **[Redis](https://redis.io/):** Used by Evolution API for session caching and high-performance message queuing.
* **Docker & Docker Compose:** Containerizes all three services into a single unified network, allowing them to communicate securely over `localhost`.

### How Everything Works Together
1. **The Scheduler:** n8n's internal Cron engine wakes up at frequent intervals.
2. **Data Ingestion:** n8n reaches out to the **Codeforces REST API** and the **LeetCode GraphQL API** simultaneously to pull live contest metadata. It securely bypasses LeetCode's CSRF bot-protection by injecting native `Referer` and `User-Agent` headers.
3. **The Processor:** The raw JSON data from both platforms is funneled into a custom JavaScript node. This node evaluates timezone-aware date math, filters out past contests, and formats a human-readable message. 
4. **Delivery:** The formatted payload is sent via a `POST` request over the Docker bridge network to the Evolution API, which instantly relays it to the target WhatsApp group.

---

## 🧠 How The Brain Works (State-Aware Logic)

This isn't a simple script that blindly sends messages every time it runs. The Javascript "brain" utilizes **n8n's Static Data (Memory)** to persist state between executions, creating intelligent, anti-spam alerts based on specific conditions:

### 1. Weekly Contest Overview (Mondays & Thursdays)
* **When:** Any time at or after 6:00 PM (IST) on a Monday or Thursday (even if you turn your laptop on late!).
* **What:** Sends a calendar summary of the *next* upcoming contest for both Codeforces and LeetCode, even if they are days away.
* **Anti-Spam:** It saves the date to memory. If you close your laptop and open it again later that night, it realizes it already sent the summary today and stays silent.

### 2. Morning "Contest Today" Alert
* **When:** The first time you turn on your laptop on any day where a contest is scheduled to happen. 
* **What:** Sends a "Good luck!" reminder detailing the platform, division, start time, and duration of today's contests.
* **Anti-Spam:** Only triggers once per day. If both Codeforces and LeetCode have a contest on the exact same day, it gracefully bundles them into a single neat message. 

### 3. The 1-Hour Emergency Siren 🚨
* **When:** Exactly when a contest is less than 75 minutes away.
* **What:** Sends a high-priority alert to the group: `🔥 CONTEST STARTING IN 1 HOUR! 🔥`
* **Anti-Spam:** It remembers the exact name of the contest it warned you about. If the schedule triggers again 15 minutes later, it realizes it already sent the 1-hour warning for that specific contest and skips it.

*(Note: The entire script explicitly forces the `Asia/Kolkata` (IST) timezone, safely overriding the default Docker UTC environment clock so that 6:00 PM evaluates correctly for users in India!)*

---

## 🚀 Setup Instructions

### 1. Configure Secrets (.env)

For security, API keys and database passwords should never be hardcoded or pushed to GitHub.

1. Rename the `.env.example` file to `.env`:
   ```bash
   cp .env.example .env
   ```
2. Open `.env` and replace the placeholder values with your own secure passwords and API keys. 
*(Note: Your `.env` file is safely ignored by Git and will not be uploaded to GitHub).*

### 2. Start the Services

Run the following command in this directory to start n8n, Evolution API, and Redis in the background:

```bash
docker compose up -d
```

### 3. Connect Your WhatsApp (Evolution API)

The Evolution API needs to be linked to your WhatsApp number. Use the `EVOLUTION_API_KEY` you set in your `.env` file to authenticate this request.

1. **Create Instance:**
   ```bash
   curl --location --request POST 'http://localhost:8080/instance/create' \
   --header 'apikey: YOUR_EVOLUTION_API_KEY_HERE' \
   --header 'Content-Type: application/json' \
   --data-raw '{
       "instanceName": "myinstance",
       "qrcode": true,
       "integration": "WHATSAPP-BAILEYS"
   }'
   ```

2. **Scan the QR Code:**
   The API will return a base64 string of a QR code in the response. Convert the base64 string to an image online and scan it with your WhatsApp application (*Linked Devices -> Link a Device*).

### 4. Setup n8n

1. Go to `http://localhost:5678` in your browser.
2. Create an owner account for your local n8n instance.
3. Import the `workflow.json` file into the n8n canvas.
4. **Configure the Workflow**:
   - Open the **Send WhatsApp** node in n8n.
   - Replace the `apikey` header value with your actual `.env` API Key.
   - Replace `<YOUR_GROUP_ID>@g.us` in the JSON body with your actual WhatsApp Group ID.
5. Click **Publish** in the top right corner to activate the workflow!

---

## 🔍 Fetching WhatsApp Group IDs

If you create a new WhatsApp group and need to find its internal ID, use this Evolution API endpoint after connecting your WhatsApp:

```bash
curl --location --request GET 'http://localhost:8080/group/fetchAllGroups/myinstance?getParticipants=false' \
--header 'apikey: YOUR_EVOLUTION_API_KEY_HERE'
```
Look for the `id` of your target group in the JSON response.

---

## 💻 Wake Listener Workaround (For Laptops)

If you are running this stack locally on a laptop rather than a 24/7 cloud server, your machine will likely go to sleep. **n8n's Schedule Trigger does not retroactively fire missed executions** when the machine wakes up.

To ensure you don't miss contest alerts that happened while your laptop was asleep, we've implemented a "Wake Listener" that instantly pings a Webhook in n8n the moment your computer lid is opened.

### For macOS

The macOS setup uses a native Python Cocoa daemon to listen for `NSWorkspaceDidWakeNotification`.

> **⚠️ Important:** `launchd` strips all shell environment variables, so it won't find pyobjc if you point it directly at `/usr/bin/python3`. You must use a bash wrapper that calls the exact Python binary that has pyobjc installed.

1. **Install Dependencies:**
   ```bash
   pip3 install pyobjc-framework-Cocoa
   which python3   # Note this full path — you'll need it in the wrapper
   ```
2. **Copy the script to a safe location:**
   ```bash
   mkdir -p ~/.local/bin
   cp wake_listener.py ~/.local/bin/wake_listener.py
   ```
3. **Create a bash wrapper** at `~/.local/bin/run_wake_listener.sh`:
   ```bash
   #!/bin/bash
   exec /Library/Frameworks/Python.framework/Versions/3.14/bin/python3 ~/.local/bin/wake_listener.py
   ```
   Replace the Python path with the output of `which python3`. Then make it executable:
   ```bash
   chmod +x ~/.local/bin/run_wake_listener.sh
   ```
4. **Create the LaunchAgent** at `~/Library/LaunchAgents/com.pranav.wakelistener.plist`:
   ```xml
   <?xml version="1.0" encoding="UTF-8"?>
   <!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
   <plist version="1.0">
   <dict>
       <key>Label</key>
       <string>com.pranav.wakelistener</string>
       <key>ProgramArguments</key>
       <array>
           <string>/bin/bash</string>
           <string>/Users/YOUR_USERNAME/.local/bin/run_wake_listener.sh</string>
       </array>
       <key>RunAtLoad</key>
       <true/>
       <key>KeepAlive</key>
       <true/>
       <key>StandardErrorPath</key>
       <string>/tmp/wakelistener.err</string>
       <key>StandardOutPath</key>
       <string>/tmp/wakelistener.out</string>
   </dict>
   </plist>
   ```
5. **Load and verify the daemon:**
   ```bash
   launchctl load ~/Library/LaunchAgents/com.pranav.wakelistener.plist
   launchctl list | grep wakelistener   # Should show a PID and exit code 0
   cat /tmp/wakelistener.err            # Should be empty if working correctly
   ```

### For Windows

On Windows, you do not need a Python script. You can achieve this natively using the built-in **Task Scheduler**.

> **💡 Recommended:** Use the automated PowerShell approach below instead of the manual UI steps — it configures all the optimal settings in one command.

**Automated Setup (Recommended):**

Run this in PowerShell as Administrator — it creates the task with a built-in **45-second delay** and **network availability check** to handle hostel/campus Wi-Fi that reconnects slowly after sleep:

```powershell
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
      <Arguments>-WindowStyle Hidden -Command "Invoke-RestMethod -Uri 'http://localhost:5678/webhook/contest-check' -Method Post"</Arguments>
    </Exec>
  </Actions>
</Task>
"@
Register-ScheduledTask -TaskName "n8n Wake Listener" -Xml $taskXml -Force
```

**Why the 45-second delay?** On campus/hostel networks, Wi-Fi takes 10–30 seconds to reconnect after the laptop wakes from sleep. Without the delay, the wake listener fires before the internet is available and the Codeforces/LeetCode API calls fail. The `RunOnlyIfNetworkAvailable` flag adds an extra safety net — if Wi-Fi is still not connected after 45 seconds, the task skips silently (the hourly schedule will catch up anyway).

---

## 🛠️ Troubleshooting

### ❌ "The service refused the connection" on Fetch Codeforces / LeetCode

This is almost always caused by **Cloudflare WARP** or another VPN intercepting Docker's outbound traffic.

Docker containers run inside a WSL2 virtual machine. When WARP is active, it tries to route all network traffic (including Docker's) through Cloudflare's servers — but the containers can't complete WARP's authentication, so all external API calls time out after ~21 seconds.

**Quick fix:** Disable WARP while n8n is running.

**Permanent fix (Split Tunnels):**
1. Open WARP → Settings → Advanced → **Split Tunnels**
2. Set mode to **Exclude IPs and domains**
3. Add these IP ranges:
   ```
   172.16.0.0/12
   10.0.0.0/8
   ```
4. Save — WARP stays on for your regular traffic, but Docker containers bypass it entirely.

---

### ❌ "localhost refused to connect" after restarting laptop

Docker Desktop does not auto-start on Windows boot by default. After a full restart:

1. Open **Docker Desktop** from the Start Menu
2. Accept any license/update prompts that appear
3. Wait for the whale icon in the system tray to turn **green** ("Engine running")
4. Your n8n and Evolution API containers will restart automatically (they have `restart: always` set)

If Docker Desktop gets stuck on "Starting...":
```powershell
wsl --shutdown
```
Then reopen Docker Desktop.
