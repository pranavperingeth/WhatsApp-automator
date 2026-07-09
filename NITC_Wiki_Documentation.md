# WhatsApp Contest Automator

**Author:** Pranav Peringeth | **Club:** CP HUB

The WhatsApp Contest Automator is an intelligent, state-aware WhatsApp automation system designed to ensure our club members never miss an upcoming competitive programming contest. It automatically scrapes Codeforces and LeetCode, computes local time conversions, and sends beautifully formatted alerts directly to our WhatsApp group.

---

## 🏗️ Architecture & Tech Stack

Instead of a basic Python script, CP HUB is built as a highly scalable, production-grade DevOps stack:

*   **Automation Engine:** [n8n](https://n8n.io/) (Node-based workflow engine)
*   **WhatsApp Gateway:** [Evolution API](https://evolution-api.com/) (WhatsApp Web Baileys implementation)
*   **Containerization:** **Docker** & `docker-compose`
*   **Security:** Full `.env` variable integration to protect API keys.

---

## 🧠 The "Smart" Notification Logic

CP HUB is not a "dumb" cron job. It uses custom JavaScript logic within n8n to provide state-aware memory, ensuring the WhatsApp group is never spammed.

*   **The Weekly Overview (Mondays & Thursdays, 6:00 PM):**
    Checks if today is Mon/Thu and past 6 PM. Compares today's date against its internal SQLite memory. If the message hasn't been sent today, it sends a summary of all upcoming contests and locks the memory for the day.
*   **The Morning "Contest Today" Alert (8:00 AM):**
    Evaluates if an upcoming contest's date perfectly matches today's calendar date (in IST). If the time is past 8:00 AM, it sends an alert and locks the memory.
*   **The 1-Hour Emergency Siren 🚨:**
    Uses absolute Unix Epoch time to calculate `Contest Start - Current Time`. If the difference is exactly <= 75 minutes, it fires the final alarm and locks the memory to prevent duplicate pings.

---

## 🚀 Setup & Deployment Guide

To deploy this stack on a server or local machine:

### 1. Configure Secrets
Create a `.env` file in the root directory to securely inject your credentials:
```bash
# Evolution API Security
EVOLUTION_API_KEY=your_secure_password_here

# PostgreSQL Database (Evolution API Storage)
POSTGRES_USER=postgres
POSTGRES_PASSWORD=your_db_password_here
POSTGRES_DB=evolution_api
```

### 2. Spin up the Stack
Run the following command in the terminal to pull the images and start the background daemons:
```bash
docker compose up -d
```

### 3. Connect WhatsApp
1.  Navigate to the Evolution API endpoint: `http://localhost:8080/instance/create`
2.  Pass your `apikey` in the Headers.
3.  Scan the returned base64 QR code with your WhatsApp app to link the bot.

### 4. Import the Brain
1.  Open n8n at `http://localhost:5678`.
2.  Click **Import from File** and upload the `workflow.json` provided in the repository.
3.  Open the **Send WhatsApp** HTTP node and ensure your Target Group ID and API key are configured.
4.  Toggle the workflow to **Active**.

---

## 🔮 Future Improvements / Roadmap
*   **Platform Expansion:** Add web scrapers for AtCoder, HackerRank, and CodeChef.
*   **Cloud Hosting:** Migrate the Docker-compose stack from a local machine to an Oracle Cloud Always Free VM for 24/7 uptime.
*   **Interactive Commands:** Upgrade the WhatsApp integration to listen for commands (e.g., `@bot next contest`) so users can query the schedule on demand.
