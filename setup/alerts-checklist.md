# Setup checklist (about 20 minutes, once)

You create every account and alert yourself. The agent never signs up, logs in or applies on your behalf.

## 1. Job alerts (the boards do the searching)

Create a daily email alert on each board with the same three settings:

| Setting | What to enter |
|---|---|
| Keywords | Your target titles, e.g. `growth manager`, `analytics manager`, `growth analytics` (one alert per keyword if the board allows only one) |
| Location | Each city you'd work in, plus `Remote` where the board offers it |
| Experience | Your band, e.g. 4 to 7 years (Naukri and iimjobs let you set this) |
| Frequency | Daily |

Boards covered by the parser: **LinkedIn** (Jobs → search → set alert), **Naukri** (save search → email alert) and **iimjobs** (job alerts). Others can be added by extending `JOB_URL` in the Parse Alert Emails node.

## 2. Gmail label

Create a Gmail filter for emails from the three boards' alert addresses and apply the label `job-alerts`. The workflow reads only emails with this label. Prefer privacy? Use a separate Gmail account just for alerts.

## 3. Google Sheet

Create a sheet, rename the first tab `Tracker` and paste the header row from `templates/tracker_header.csv`.

## 4. n8n

1. Import `n8n/job-hunt-os-alerts-to-tracker.json`.
2. Connect your Gmail and Google Sheets accounts, and pick your sheet in **Read Tracker** and **Add to Tracker**.
3. Edit `CONFIG` in **Filter by Preferences** (years, titles, locations).
4. Click **Run with Sample Alerts** to test, then publish the workflow so it checks for new alerts every hour.

## 5. Claude

1. Fill in `templates/truth_file.example.csv` with your own facts (claims) and rules (guards), and `templates/profile.example.json`.
2. Add `skill/job-hunt-cv` as a Claude skill, along with your truth file and profile.
3. In the sheet, set `decision` to `Interested` on the roles you like, then ask Claude: "make CVs for my shortlist".
4. Apply yourself. Set `status` to `applied` and fill in `applied_on`.
