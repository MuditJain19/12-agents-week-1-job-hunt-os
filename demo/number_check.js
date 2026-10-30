// Deterministic part of the check: every number in a line must appear in the facts it cites.
const fs = require('fs');
const path = require('path');
const root = path.join(__dirname, '..');
const WORDS = { one: '1', two: '2', three: '3', four: '4', five: '5', six: '6', seven: '7', eight: '8', nine: '9', ten: '10' };
const nums = s => (String(s).toLowerCase().replace(/\b(one|two|three|four|five|six|seven|eight|nine|ten)\b/g, m => WORDS[m]).match(/\d+(?:\.\d+)?/g) || []);
const rows = fs.readFileSync(path.join(root, 'templates/truth_file.example.csv'), 'utf8').trim().split('\n').slice(1);
const facts = {};
rows.forEach(r => { const m = r.match(/^([^,]+),([^,]+),([^,]+),"(.*)",/); if (m) facts[m[1]] = { kind: m[3], text: m[4] }; });
const drafts = JSON.parse(fs.readFileSync(path.join(root, 'demo/drafts.json'), 'utf8'));
const out = {};
for (const [k, d] of Object.entries(drafts)) {
  out[k] = d.lines.map((l, i) => {
    const bad = l.ids.filter(id => !facts[id] || facts[id].kind !== 'claim');
    const allowed = nums(l.ids.map(id => (facts[id] || {}).text || '').join(' '));
    const extra = nums(l.text).filter(n => !allowed.includes(n));
    return { i, ok: !bad.length && !extra.length, bad_ids: bad, numbers_not_in_cited_facts: extra };
  });
}
fs.writeFileSync(path.join(root, 'demo/number_check.json'), JSON.stringify(out, null, 2));
for (const [k, v] of Object.entries(out)) console.log(k, v.filter(x => !x.ok).map(x => 'line ' + x.i + ' ' + JSON.stringify(x.numbers_not_in_cited_facts.concat(x.bad_ids))).join(' | ') || 'all numbers ok');
