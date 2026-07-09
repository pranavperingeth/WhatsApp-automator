# WhatsApp Contest Automator 🤖📱

An intelligent, state-aware WhatsApp automation system that fetches upcoming programming contests from **Codeforces** and **LeetCode** and alerts your WhatsApp group so you never miss a contest again. 

Built using **n8n** (for automation workflows) and **Evolution API** (for WhatsApp integration), entirely containerized in Docker.

---

## 🧠 How The Brain Works (Notification Logic)

This isn't just a dumb script that spams you every 5 minutes. The n8n workflow uses a custom JavaScript "brain" combined with n8n's Static Data (Memory) to keep track of what it has already told you today. 

It triggers frequently in the background, but only sends a message when one of the following specific conditions is met:

### 1. Weekly Contest Overview (Mondays & Thursdays)
* **When:** Any time after 6:00 PM (IST) on a Monday or Thursday.
* **What:** Sends a calendar summary of the *next* upcoming contest for both Codeforces and LeetCode, even if they are days away.
* **Anti-Spam:** It remembers that it sent this overview and will only send it **once** per Monday/Thursday.

### 2. Morning "Contest Today" Alert
* **When:** The morning of any day where a contest is scheduled to happen. 
* **What:** Sends a "Good luck!" reminder detailing the platform, division, start time, and duration of today's contests.
* **Anti-Spam:** It will only send this once per day. If both Codeforces and LeetCode have a contest on the exact same day, it will bundle them into a single neat message. 

### 3. The 1-Hour Emergency Siren 🚨
* **When:** Exactly when a contest is less than 75 minutes away.
* **What:** Sends a high-priority alert to the group: `🔥 CONTEST STARTING IN 1 HOUR! 🔥`
* **Anti-Spam:** It remembers the exact name of the contest it warned you about. If the schedule triggers again 15 minutes later, it realizes it already sent the 1-hour warning for that specific contest and stays silent. 

*(Note: The logic explicitly uses the `Asia/Kolkata` (IST) timezone, completely bypassing the default Docker UTC timezone, so 6:00 PM means 6:00 PM in India!)*

---

## 🚀 Setup Instructions

### 1. Start the Services

Run the following command in this directory to start n8n, Evolution API, and Redis in the background:

```bash
docker compose up -d
```

### 2. Connect Your WhatsApp (Evolution API)

The Evolution API needs to be linked to your WhatsApp number. Since we are using an API key (`my_global_api_key_123` as set in `docker-compose.yml`), you can create an instance and generate a QR code using standard HTTP requests.

1. **Create Instance:**
   ```bash
   curl --location --request POST 'http://localhost:8080/instance/create' \
   --header 'apikey: my_global_api_key_123' \
   --header 'Content-Type: application/json' \
   --data-raw '{
       "instanceName": "myinstance",
       "qrcode": true,
       "integration": "WHATSAPP-BAILEYS"
   }'
   ```

2. **Scan the QR Code:**
   The API will return a base64 string of a QR code in the response. You can convert the base64 string to an image online and scan it with your WhatsApp application (Linked Devices -> Link a Device).

### 3. Setup n8n

1. Go to `http://localhost:5678` in your browser.
2. Create an owner account for your local n8n instance.
3. Import the `workflow.json` file into n8n.
4. **Configure the Workflow**:
   - Open the **Send WhatsApp** node in n8n.
   - Replace `<YOUR_GROUP_ID>@g.us` in the JSON body with your actual WhatsApp Group ID.
5. Click **Publish** in the top right corner to activate the workflow!

---

## 🔍 Fetching WhatsApp Group IDs

If you create a new WhatsApp group and need to find its ID, you can use the Evolution API after connecting your WhatsApp:

```bash
curl --location --request GET 'http://localhost:8080/group/fetchAllGroups/myinstance?getParticipants=false' \
--header 'apikey: my_global_api_key_123'
```
Look for the `id` of the desired group in the response.
