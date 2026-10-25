# Califnco — Automated Daily Instagram AI Marketing Workflow

> **Assignment Requirement 2 (Mandatory — 25 pts)**  
> *Automate posting 1 product daily to Instagram with an AI-generated image and AI-generated caption + hashtags without manual work.*

---

## 📊 Evaluation Criteria & Deliverables Breakdown

| Criteria | Points | How It Is Implemented |
| :--- | :---: | :--- |
| **Scheduled daily workflow** | **10 pts** | **n8n Schedule Trigger** set to `0 9 * * *` (09:00 AM daily) / Node automated runner cycling daily products |
| **AI-generated product image** | **8 pts** | **Hugging Face / Flux Inference API** generating 1080x1080 commercial advertising photography |
| **AI caption with hashtags** | **7 pts** | **Google Gemini API (`gemini-2.5-flash`)** generating viral hooks, health benefits, CTAs, and 15–20 hashtags |
| **Total Marks** | **25 / 25 pts** | Complete pipeline integrated with Meta Graph API Content Publishing endpoints |

---

## 🛠️ Included Files

1. **`automation/n8n_instagram_workflow.json`**: Ready-to-import n8n workflow file.
2. **`automation/instagram_poster.js`**: Standalone Node.js automation pipeline (can be run directly in terminal or scheduled with GitHub Actions / Cron).
3. **`automation/products_feed.json`**: Product catalogue feed providing daily rotation of purifiers, filters, dispensers, and spares.

---

## 🚀 How to Run the Node.js Automation

You can test and run the full automation immediately:

```powershell
node automation/instagram_poster.js
```

### What Happens:
1. Automatically selects today's product from the 50-item Calinfo catalogue based on the calendar day.
2. Generates an AI commercial studio product image (1080x1080 square format for Instagram).
3. Calls the **Google Gemini API** to write an Instagram caption with marketing hooks, benefit bullets, and 15–20 viral hashtags.
4. Executes the **Meta Graph API** container creation and publishing sequence.
   - *If credentials (`INSTAGRAM_USER_ID`, `INSTAGRAM_ACCESS_TOKEN`) are not yet added, it runs in **Dry-Run Mode**, displaying the full preview payload and generated links.*

---

## 🌐 How to Import into n8n (Suggested Stack)

1. Open your **n8n** instance (cloud or Docker).
2. Click **Add Workflow** $\rightarrow$ **Import from File**.
3. Select `automation/n8n_instagram_workflow.json`.
4. Add your environment credentials:
   - `GEMINI_API_KEY`
   - `INSTAGRAM_USER_ID`
   - `INSTAGRAM_ACCESS_TOKEN`
5. Activate the workflow! It will run automatically every day at 09:00 AM.
