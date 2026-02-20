# NZ Email Alarm Alert System | n8n Workflow

> **Never miss a critical email while you sleep - intelligent email monitoring with emergency phone alerts**

---

## 🎯 Project Overview

A smart email monitoring workflow that watches emails during off-hours and triggers emergency phone alarms when important emails arrive. Built for a real use case: New Zealand job hunting across timezones, where business hours fall squarely in the middle of the night.

**The Problem:** New Zealand business hours (9 AM–5 PM NZST) translate to 1:30 AM–9:30 AM IST. Emails from immigration consultants, hiring managers, and recruiters arrive while you're asleep. A delayed response can mean a missed opportunity.

**The Solution:** An n8n workflow that polls Gmail every 15 minutes, filters emails through a layered importance check (whitelisted senders, .nz domains, subject keywords), and sends a Pushover emergency alert that bypasses Do Not Disturb and rings like an alarm until acknowledged.

---

## 🚀 What This Demonstrates

### **AI Operations & Automation Engineering Skills**
- **Real-world problem solving**: Identified a timezone-based communication gap and built an automated solution
- **Multi-layer filtering logic**: Combined sender whitelist, domain matching, and keyword detection in a single Code node
- **External API integration**: Connected Gmail OAuth2 + Pushover REST API with proper authentication and parameter handling
- **Time-zone aware automation**: Built IST-based active hours logic that converts UTC to local time for precise scheduling

### **Operational Thinking**
This project applies the same principle behind all good automation: **identify a repeating friction point → design a system that eliminates it → deploy**. The workflow runs 24/7 but only alerts during the hours that matter, respecting both urgency and sleep.

---

## 🏗️ Architecture & Workflow

### **High-Level Flow**
```
Gmail Trigger (15 min poll) → Code Node (filter + time check) → Pushover Emergency Alert
```
### **Workflow Diagram**
<img width="1918" height="696" alt="image" src="https://github.com/user-attachments/assets/44a3c8a3-25ef-4d50-9364-96f32c9e9595" />

### **Technical Components**

| Node | Technology | Function |
|------|------------|----------|
| **Gmail Trigger** | `n8n-nodes-base.gmailTrigger` | Polls for unread emails every 15 minutes via OAuth2 |
| **Code (JavaScript)** | `n8n-nodes-base.code` | Three-layer importance filter + IST active hours gate |
| **HTTP Request** | `n8n-nodes-base.httpRequest` | POST to Pushover API with Priority 2 (emergency) alert |

### **Filter Logic (Code Node)**

The Code node applies three checks to every incoming email. If **any** check passes, the email is flagged as important:

| Check | What It Does | Example Match |
|-------|-------------|---------------|
| **Sender Whitelist** | Exact match against a list of known important email addresses | `xy@newzealand-immigrations.com` |
| **Domain Check** | Matches any sender from a `.nz` domain | `recruiter@seek.co.nz` |
| **Keyword Scan** | Searches subject line for configurable keywords | Subject: "Interview scheduled for Thursday" |

Additionally, a **time gate** ensures alerts only fire during configurable active hours (default: 1:30 AM – 11:00 AM IST). Outside this window, important emails are silently ignored — you'll see them when you wake up naturally.

### **Pushover Emergency Alert**

| Parameter | Value | Purpose |
|-----------|-------|---------|
| `priority` | `2` (Emergency) | Bypasses Do Not Disturb on Android |
| `retry` | `60` | Re-alerts every 60 seconds if not acknowledged |
| `expire` | `600` | Stops retrying after 10 minutes |
| `sound` | Configurable | Set to your loudest alarm tone in the Pushover app |

The alert title tells you **why** it was flagged (e.g., "Whitelisted sender + Keyword in subject: Interview scheduled"), so you can decide whether to get up or dismiss it without opening the email.

---

## 📊 Results

| Metric | Value |
|--------|-------|
| **Response time improvement** | Hours → minutes (asleep-to-aware) |
| **Polling frequency** | Every 15 minutes |
| **False positive rate** | Near zero with layered filtering |
| **Alert acknowledgement** | Required (keeps ringing until you respond) |
| **Setup time** | ~20 minutes |

---

## 🛠️ Technical Stack

| Component | Technology | Purpose |
|-----------|-----------|---------|
| **Workflow Engine** | n8n (cloud) | Visual automation platform |
| **Email Source** | Gmail API (OAuth2) | Secure email polling |
| **Filter Logic** | JavaScript (n8n Code node) | Sender, domain, keyword, and time filtering |
| **Alert Delivery** | Pushover API | Emergency-priority mobile notifications |
| **Target Device** | Android (Pushover app) | Alarm sound + DND bypass |

---

## 🔧 Setup & Deployment

### **Prerequisites**
- n8n instance (cloud or self-hosted)
- Gmail account with OAuth2 credentials configured in n8n
- Pushover account ([pushover.net](https://pushover.net)) — free 30-day trial, then one-time $5
- Pushover app installed on Android/iOS

### **Installation**

1. **Import Workflow**
   ```
   In n8n: Settings → Import from File → Select workflow.json
   ```

2. **Configure Gmail Credential**
   - In Google Cloud Console: Create project → Enable Gmail API → OAuth 2.0 Client ID
   - In n8n: Add Gmail OAuth2 credential → Authorise

3. **Configure Pushover**
   - Create account at [pushover.net](https://pushover.net)
   - Create an application at [pushover.net/apps/build](https://pushover.net/apps/build) → get API Token
   - Copy your User Key from the Pushover dashboard
   - In the HTTP Request node: Replace `YOUR_PUSHOVER_API_TOKEN` and `YOUR_PUSHOVER_USER_KEY`

4. **Customise Filters**

   Open the Code node and edit the **SETTINGS** section at the top:

   ```javascript
   // Add/remove sender emails
   const whitelist = [
     'sender1@example.com',
     'sender2@example.com'
   ];

   // Add/remove subject line keywords
   const keywords = [
     'job', 'interview', 'visa', 'offer', 'urgent'
   ];

   // Change active hours (24-hour format, IST)
   const activeStartHour = 1;   // 1:30 AM
   const activeStartMin = 30;
   const activeEndHour = 11;    // 11:00 AM
   const activeEndMin = 0;
   ```

5. **Activate & Test**
   - Send yourself a test email with a keyword in the subject (e.g., "Interview test")
   - Execute the workflow manually to verify the alert fires
   - Toggle workflow to "Active" for production

### **Android Setup (Important)**
To ensure the alarm actually wakes you up:
- Pushover app → set emergency notification sound to a loud alarm tone
- Phone Settings → Apps → Pushover → Notifications → Override Do Not Disturb: ON
- Phone Settings → Battery → Pushover → Disable battery optimisation

---

## 🎓 Challenges & Solutions

| Challenge | Solution |
|-----------|----------|
| Gmail returns different field names (capitalised vs lowercase) | Dual fallback: `email.json.From \|\| email.json.from` |
| `From` field contains name + email in various formats | Regex extraction: `match(/<(.+?)>/)` to isolate email address |
| `internalDate` is Unix milliseconds, not readable | `new Date(Number(timestamp))` conversion (used in testing) |
| Can't test during off-hours | Wrapped time check in `/* */` block comments for testing, re-enabled for production |
| Pushover default sounds too quiet | Configured Android notification channel to use alarm-grade tone |
| n8n stops workflow when Code node returns empty array | Intentional design — no output = no alert = no unnecessary processing |

---

## 🔄 Customisation Options

- **Change timezone**: Modify `istOffset` value (e.g., `8 * 60` for SGT, `0` for UTC)
- **Add more senders**: Append to the `whitelist` array
- **Add more keywords**: Append to the `keywords` array
- **Adjust polling frequency**: Change Gmail Trigger from 15 min to any interval
- **Change alert behavior**: Modify `retry`/`expire` values in HTTP Request node
- **Add quiet notification outside hours**: Duplicate HTTP Request node with `priority: -1` on a separate branch

---

## 📂 Repository Structure
```
nz-email-alarm-alert-system/
├── workflow.json             # Sanitised n8n workflow (import directly)
├── email_alarm_filter.js     # Standalone Code node logic with full comments
├── .gitignore
└── README.md
```

---

## 🤝 Connect

**Creator:** Sai Medicherla
**Specialties:** AI Operations • AI Automation • No-Code AI Solutions • Business Analysis

**Let's Connect:**
- 🌐 Portfolio: [linkedin-replacer](https://linkedin-replacer-127790892770.us-west1.run.app/)
- 🐦 X/Twitter: [@mscb160798](https://x.com/mscb160798)
- 💼 Wellfound: [Sai Medicherla](https://wellfound.com/u/sai-medicherla)
- 💻 GitHub: [@saicbm98](https://github.com/saicbm98)

**Open to:** AI Operations • Automation Engineering • Product Operations • Operations • Business Analysis

**Availability:** 🟢 Immediate start

---

## 📜 License

MIT License - fork, modify, and use freely.

---

⭐ **If this helped you, consider starring the repo!**
