"""Render the three LinkedIn post images (1080x1350) from the demo data."""
import csv, html, pathlib
from playwright.sync_api import sync_playwright

root = pathlib.Path(__file__).resolve().parent.parent
rows = list(csv.DictReader(open(root / "demo/tracker.csv")))

BASE = """<html><head><meta charset="utf-8"><style>
*{box-sizing:border-box}body{margin:0;width:1080px;height:1350px;background:#f6f3ee;font-family:'Helvetica Neue',Arial,sans-serif;color:#1c1b19;padding:72px 68px;display:flex;flex-direction:column}
.kick{font-size:22px;letter-spacing:.14em;text-transform:uppercase;color:#a1502a;font-weight:700}
h1{font-size:58px;line-height:1.08;margin:14px 0 18px;font-weight:800;letter-spacing:-.01em}
.sub{font-size:26px;color:#5b574f;line-height:1.4;margin-bottom:34px}
.foot{margin-top:auto;font-size:19px;color:#8a857b;display:flex;justify-content:space-between}
</style></head><body>{body}<div class="foot"><span>Job Hunt OS · 12 Agents in 12 Weeks · Week 1</span><span>{note}</span></div></body></html>"""

def page(body, note="Demo on fictional data"):
    return BASE.replace("{body}", body).replace("{note}", note)

# 1. How it works
steps = [
    ("1", "Job boards search for you", "LinkedIn, Naukri and iimjobs send daily alert emails.", "#e9e2d6"),
    ("2", "n8n sorts them, for free", "Parse → filter by your rules → drop duplicates → Google Sheet. No AI calls.", "#dfe8e1"),
    ("3", "You pick", "Mark the roles you like as Interested.", "#e9e2d6"),
    ("4", "Claude writes the CV", "Fit score + a tailored CV. Every line cites a fact from your truth file.", "#e3e3ef"),
    ("5", "A separate check removes what can't be proven", "Unbacked claims and invented numbers are cut before you see the CV.", "#f3dfd5"),
    ("6", "You apply", "The agent never logs in, messages anyone or applies for you.", "#e9e2d6"),
]
cards = "".join(f'<div style="display:flex;gap:26px;align-items:flex-start;background:{c};border-radius:18px;padding:22px 28px;margin-bottom:16px"><div style="font-size:40px;font-weight:800;color:#a1502a;width:40px">{n}</div><div><div style="font-size:30px;font-weight:700;margin-bottom:6px">{t}</div><div style="font-size:22px;color:#4d4a44;line-height:1.35">{d}</div></div></div>' for n, t, d, c in steps)
v1 = page(f'<div class="kick">How it works</div><h1>Boards find. Code sorts.<br>AI writes. Checker cuts.<br>You apply.</h1>{cards}', "No API bill")

# 2. Tracker
def chip(r):
    if r["status"] == "cv_ready": return '<span style="background:#1f6f4a;color:#fff;padding:4px 10px;border-radius:20px">CV ready · fit ' + r["fit_score"] + '</span>'
    if r["filter_result"] == "shortlist" and r["decision"] == "Skip": return '<span style="background:#ddd6ca;padding:4px 10px;border-radius:20px">you skipped</span>'
    if r["filter_result"] == "shortlist": return '<span style="background:#f0d9a8;padding:4px 10px;border-radius:20px">shortlisted</span>'
    return '<span style="color:#8a857b">' + html.escape(r["filter_result"].replace("skip: ", "filtered: ")) + '</span>'
trs = "".join(f'<tr><td style="padding:13px 10px;border-bottom:1px solid #ddd6ca"><b>{html.escape(r["title"])}</b><br><span style="color:#6b675f">{html.escape(r["company"])} · {html.escape(r["location"].split(",")[0])} · {r["source"]}</span></td><td style="padding:13px 10px;border-bottom:1px solid #ddd6ca;text-align:right;font-size:18px">{chip(r)}</td></tr>' for r in rows)
v2 = page(f'<div class="kick">The tracker</div><h1>12 alert jobs → 6 worth a look → 3 CVs</h1><div class="sub">One duplicate (same role on LinkedIn and iimjobs) dropped automatically.</div><table style="width:100%;border-collapse:collapse;font-size:21px;background:#fffdf9;border-radius:16px">{trs}</table>')

# 3. Checker
catches = [
    ("Owned revenue and unit economics for Dicebox Carrom…", "Implies P&L ownership. The truth file says she never owned the P&L."),
    ("Led a team of 5 across growth analytics and CRM…", "CRM isn't in her facts. The team was 5 analysts."),
    ("…60+ A/B tests…, lifting repeat usage by 15%.", "Invented outcome. '15' appears in none of the facts it cites."),
]
cc = "".join(f'<div style="background:#fffdf9;border-radius:18px;padding:24px 28px;margin-bottom:18px;border-left:8px solid #b5442a"><div style="font-size:25px;text-decoration:line-through;color:#7a2a1a;margin-bottom:10px">“{html.escape(a)}”</div><div style="font-size:22px;color:#4d4a44">✕ {html.escape(b)}</div></div>' for a, b in catches)
stat = '<div style="display:flex;gap:18px;margin-top:10px"><div style="flex:1;background:#1c1b19;color:#f6f3ee;border-radius:18px;padding:24px 28px"><div style="font-size:54px;font-weight:800">20 / 20</div><div style="font-size:21px;color:#cfc8bb">planted false claims caught in my own test</div></div><div style="flex:1;background:#1c1b19;color:#f6f3ee;border-radius:18px;padding:24px 28px"><div style="font-size:54px;font-weight:800">0 / 10</div><div style="font-size:21px;color:#cfc8bb">true claims wrongly rejected</div></div></div>'
v3 = page(f'<div class="kick">The checker</div><h1>Tailoring tempts you to stretch the truth. The checker cuts it.</h1>{cc}{stat}', "Demo lines: fictional person")

out = root / "docs"
with sync_playwright() as p:
    b = p.chromium.launch()
    for name, doc in [("1_how_it_works", v1), ("2_tracker", v2), ("3_checker", v3)]:
        pg = b.new_page(viewport={"width": 1080, "height": 1350})
        pg.set_content(doc)
        pg.screenshot(path=str(out / f"{name}.png"))
        pg.close()
    b.close()
print("ok")
