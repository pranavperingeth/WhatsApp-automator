const fs = require('fs');
const https = require('https');

const API_URL = 'https://wiki.fosscell.org/api.php';
const USERNAME = 'Pranavperingeth@antigravity';
const PASSWORD = 'ab7oujmjgmt4d2bc4ne9k5p7ivtphtc8';
const TITLE = 'WhatsApp_Contest_Automator';

const markdown = `# WhatsApp Contest Automator

**Author:** Pranav Peringeth | **Club:** CP HUB

The WhatsApp Contest Automator is an intelligent, state-aware WhatsApp automation system designed to ensure our club members never miss an upcoming competitive programming contest. It automatically scrapes Codeforces and LeetCode, computes local time conversions, and sends beautifully formatted alerts directly to our WhatsApp group.

---

## 🏗️ Architecture & Tech Stack

Instead of a basic Python script, CP HUB is built as a highly scalable, production-grade DevOps stack:

*   **Automation Engine:** [n8n](https://n8n.io/) (Node-based workflow engine)
*   **WhatsApp Gateway:** [Evolution API](https://evolution-api.com/) (WhatsApp Web Baileys implementation)
*   **Containerization:** **Docker** & \`docker-compose\`
*   **Security:** Full \`.env\` variable integration to protect API keys.

---

## 🧠 The "Smart" Notification Logic

CP HUB is not a "dumb" cron job. It uses custom JavaScript logic within n8n to provide state-aware memory, ensuring the WhatsApp group is never spammed.

*   **The Weekly Overview (Mondays & Thursdays, 6:00 PM):**
    Checks if today is Mon/Thu and past 6 PM. Compares today's date against its internal SQLite memory. If the message hasn't been sent today, it sends a summary of all upcoming contests and locks the memory for the day.
*   **The Morning "Contest Today" Alert (8:00 AM):**
    Evaluates if an upcoming contest's date perfectly matches today's calendar date (in IST). If the time is past 8:00 AM, it sends an alert and locks the memory.
*   **The 1-Hour Emergency Siren 🚨:**
    Uses absolute Unix Epoch time to calculate \`Contest Start - Current Time\`. If the difference is exactly <= 75 minutes, it fires the final alarm and locks the memory to prevent duplicate pings.

---

## 🚀 Setup & Deployment Guide

To deploy this stack on a server or local machine:

### 1. Configure Secrets
Create a \`.env\` file in the root directory to securely inject your credentials:
<pre>
# Evolution API Security
EVOLUTION_API_KEY=your_secure_password_here

# PostgreSQL Database (Evolution API Storage)
POSTGRES_USER=postgres
POSTGRES_PASSWORD=your_db_password_here
POSTGRES_DB=evolution_api
</pre>

### 2. Spin up the Stack
Run the following command in the terminal to pull the images and start the background daemons:
<pre>
docker compose up -d
</pre>

### 3. Connect WhatsApp
1.  Navigate to the Evolution API endpoint: \`http://localhost:8080/instance/create\`
2.  Pass your \`apikey\` in the Headers.
3.  Scan the returned base64 QR code with your WhatsApp app to link the bot.

### 4. Import the Brain
1.  Open n8n at \`http://localhost:5678\`.
2.  Click **Import from File** and upload the \`workflow.json\` provided in the repository.
3.  Open the **Send WhatsApp** HTTP node and ensure your Target Group ID and API key are configured.
4.  Toggle the workflow to **Active**.

---

## 🔮 Future Improvements / Roadmap
*   **Platform Expansion:** Add web scrapers for AtCoder, HackerRank, and CodeChef.
*   **Cloud Hosting:** Migrate the Docker-compose stack from a local machine to an Oracle Cloud Always Free VM for 24/7 uptime.
*   **Interactive Commands:** Upgrade the WhatsApp integration to listen for commands (e.g., \`@bot next contest\`) so users can query the schedule on demand.`;

let cookieJar = [];

async function fetchApi(params, isPost = false) {
    const url = new URL(API_URL);
    if (!isPost) {
        Object.keys(params).forEach(key => url.searchParams.append(key, params[key]));
    }
    url.searchParams.append('format', 'json');

    const options = {
        method: isPost ? 'POST' : 'GET',
        headers: {
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Cookie': cookieJar.join('; '),
            'Accept': 'application/json'
        }
    };

    let postData = '';
    if (isPost) {
        const bodyParams = new URLSearchParams(params);
        bodyParams.append('format', 'json');
        postData = bodyParams.toString();
        options.headers['Content-Type'] = 'application/x-www-form-urlencoded';
        options.headers['Content-Length'] = Buffer.byteLength(postData);
    }

    return new Promise((resolve, reject) => {
        const req = https.request(url, options, (res) => {
            if (res.headers['set-cookie']) {
                res.headers['set-cookie'].forEach(c => {
                    cookieJar.push(c.split(';')[0]);
                });
            }

            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                if (res.statusCode >= 400) {
                    return reject(new Error('HTTP ' + res.statusCode + ': ' + data));
                }
                try {
                    resolve(JSON.parse(data));
                } catch (e) {
                    reject(new Error('Failed to parse JSON: ' + data.substring(0, 500)));
                }
            });
        });

        req.on('error', reject);

        if (isPost) {
            req.write(postData);
        }
        req.end();
    });
}

async function run() {
    try {
        console.log("1. Fetching login token...");
        let res = await fetchApi({ action: 'query', meta: 'tokens', type: 'login' });
        const loginToken = res.query.tokens.logintoken;
        console.log("Login token acquired.");

        console.log("2. Logging in...");
        res = await fetchApi({
            action: 'login',
            lgname: USERNAME,
            lgpassword: PASSWORD,
            lgtoken: loginToken
        }, true);
        if (res.login && res.login.result !== 'Success') {
            throw new Error("Login failed: " + JSON.stringify(res));
        }
        console.log("Login successful.");

        console.log("3. Fetching CSRF token...");
        res = await fetchApi({ action: 'query', meta: 'tokens', type: 'csrf' });
        const csrfToken = res.query.tokens.csrftoken;
        console.log("CSRF token acquired.");

        console.log("4. Uploading page...");
        res = await fetchApi({
            action: 'edit',
            title: TITLE,
            text: markdown,
            summary: 'Initial documentation upload',
            token: csrfToken
        }, true);

        if (res.error) {
            throw new Error("Edit failed: " + JSON.stringify(res.error));
        }

        console.log("SUCCESS! Page uploaded.");
        console.log(res);

    } catch (e) {
        console.error("ERROR:");
        console.error(e.message);
    }
}

run();
