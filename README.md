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
