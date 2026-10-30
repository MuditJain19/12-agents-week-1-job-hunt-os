# Job Hunt OS

**Job boards find the roles. n8n sorts them for free. Claude writes a CV for each role you like, and then checks every line of it against facts you've written down. You apply yourself.**

Week 1 of *12 Agents in 12 Weeks*.

```
LinkedIn / Naukri / iimjobs daily alert emails
        │  (Gmail label: job-alerts)
        ▼
n8n  ── parse ── filter (your rules) ── drop duplicates ──▶ Google Sheet tracker
        no AI calls, no API bill                               │ you mark rows "Interested"
                                                               ▼
Claude skill ── fit score ── tailored CV ── independent check ──▶ CV + check report
        every line cites a fact ID; lines that can't be backed up are removed
                                                               ▼
                                                     you apply, update status
```

## Why it's built this way

- **The boards already search well.** Their daily alerts cover listings that no web search or free API reaches, especially on LinkedIn and Naukri. So the agent reads alerts instead of scraping.
- **Plain code does the plumbing.** Parsing, filtering and de-duplication are code, so they cost nothing per run.
- **The AI only does the judgement**, and only for roles you've marked. It runs on your Claude plan, so you don't need an API key.
- **Nothing is invented.** CV claims come only from `truth_file.csv`. A separate pass checks every line, and a number check rejects any figure that isn't in the facts a line cites.
- **You stay in control.** The agent never logs in, signs up, messages anyone or applies for you. LinkedIn forbids automation, so LinkedIn stays manual.

## Your data stays yours

Copy `templates/truth_file.example.csv` to `truth_file.csv` and `templates/profile.example.json` to `profile.json`, then fill them in. Both files, and any `cvs/` folder, are in `.gitignore`, so they won't be committed by accident. Never commit your real truth file to a public fork.

## What's in the repo

| Path | What it is |
|---|---|
| `n8n/job-hunt-os-alerts-to-tracker.json` | Import-ready workflow: Gmail alerts → parse → filter → de-duplicate → Google Sheet, plus a sample-alert test path |
| `n8n/code/pipeline.js` | The same parsing, filter and de-duplication code, testable with Node |
| `skill/job-hunt-cv/SKILL.md` | Claude skill: fit score, tailored CV, independent check, check report |
| `templates/` | Truth file, profile, filter config, tracker header and CV layout, all for a fictional person |
| `setup/alerts-checklist.md` | One-time setup, about 20 minutes |
| `samples/` | Sample alert emails and job descriptions (fictional companies, fake job IDs) |
| `demo/` | A full run on the samples: tracker, 3 CVs, check reports |
| `eval/planted_claims.example.csv` | True and planted false claims to test the checker yourself |

## Demo run (fictional person, sample alerts)

| Step | Count |
|---|---|
| Alert emails | 3 |
| Jobs parsed | 12 |
| After de-duplication (same role on two boards) | 11 |
| Passed the free filters | 6 |
| Marked Interested | 3 |
| CV lines drafted | 20 |
| Lines removed by the check | 5 |

The check removed lines like:
- *"Owned revenue and unit economics for Dicebox Carrom"*: implied P&L ownership, which the truth file rules out.
- *"Led a team of 5 across growth analytics and CRM"*: CRM isn't in the facts.
- *"…lifting repeat usage by 15%"*: an invented number, caught by both checks.

These are demo drafts on fictional data. They show the mechanism, not a measured error rate. In the author's own test (20 planted false claims and 10 true ones about a real CV), the checker caught 20 of 20 and wrongly rejected 0 of 10.

To run the free part on the samples: `node demo/run_pipeline.js`

## Costs

- **n8n:** a few runs a day on any plan, with no AI nodes.
- **Claude:** CV writing happens in your Claude chat, on your plan.
- **Optional:** to generate CVs automatically for every shortlisted role, add an Anthropic node after the tracker. That costs money per CV, so it's off by default.

## Limitations

- Alert email formats change. If rows stop appearing, adjust the parsing patterns in **Parse Alert Emails**.
- Alerts carry the title, company, location and link, not the full job description. Claude opens the link; LinkedIn and Naukri pages often need you to paste the description instead.
- The filters are keyword rules. They will let some noise through and miss some odd titles.
- The checker reduces invented claims, but it doesn't guarantee there are none. Read your CV before you send it.

## Ideas to fork

- Telegram or WhatsApp morning digest from the tracker.
- Follow-up reminders 7 days after you apply.
- A "find referrers" step that drafts messages for you to send yourself.

All people, companies and job IDs in this repo are fictional.
