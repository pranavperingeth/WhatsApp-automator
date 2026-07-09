# WhatsApp Automator (n8n + Evolution API)

This project automates fetching upcoming LeetCode and Codeforces contests and sending a notification to a WhatsApp group via the Evolution API and n8n.

## Prerequisites

- [Docker](https://docs.docker.com/get-docker/) and Docker Compose installed.
- Your WhatsApp number (to scan the QR code).

## Setup Instructions

### 1. Start the Services

Run the following command in this directory to start n8n and Evolution API in the background:

```bash
docker compose up -d
```

### 2. Connect Your WhatsApp (Evolution API)

The Evolution API needs to be linked to your WhatsApp number. Since we are using an API key (`my_global_api_key_123` as set in `docker-compose.yml`), you can create an instance and generate a QR code using standard HTTP requests (e.g., Postman or curl).

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
   - Replace `"YOUR_GROUP_ID_HERE"` with your actual WhatsApp Group ID (it usually ends in `@g.us`).
5. Activate the workflow and test it!

## Fetching Group IDs

To find your Group ID, you can use the Evolution API after connecting your WhatsApp:
```bash
curl --location --request GET 'http://localhost:8080/group/fetchAllGroups/myinstance?getParticipants=false' \
--header 'apikey: my_global_api_key_123'
```
Look for the `id` of the desired group in the response.
