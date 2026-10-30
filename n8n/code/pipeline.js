// Job Hunt OS: parse job-alert emails, filter, dedupe. Pure functions, no API calls.
// The same code is pasted into the n8n Code nodes; run `node demo/run_pipeline.js` to test locally.

const JOB_URL = /https?:\/\/(?:[a-z]{2,3}\.)?(?:www\.)?(linkedin\.com\/(?:comm\/)?jobs\/view\/(\d+)|naukri\.com\/job-listings-[^\s"'<>]*?(\d{6,})|iimjobs\.com\/j\/[^\s"'<>]*?(\d{5,}))[^\s"'<>]*/gi;

function htmlToText(html) {
  return String(html || '')
    .replace(/<a\b[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi, '$2\n$1\n')
    .replace(/<(br|\/p|\/div|\/tr|\/li|\/h\d)[^>]*>/gi, '\n')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&amp;/g, '&').replace(/&nbsp;/g, ' ').replace(/&#39;/g, "'").replace(/&quot;/g, '"')
    .replace(/[ \t]+/g, ' ');
}

function parseYears(s) {
  const m = String(s || '').match(/(\d{1,2})\s*(?:-|–|to)\s*(\d{1,2})\s*(?:yrs|years|yr)/i);
  return m ? { min: Number(m[1]), max: Number(m[2]) } : { min: null, max: null };
}

function parseEmail(email) {
  const text = email.text || htmlToText(email.html || '');
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
  const jobs = [];
  let block = [];
  for (const line of lines) {
    JOB_URL.lastIndex = 0;
    const m = JOB_URL.exec(line);
    if (!m) { block.push(line); continue; }
    const url = m[0];
    const source = /linkedin/i.test(url) ? 'linkedin' : (/naukri/i.test(url) ? 'naukri' : 'iimjobs');
    const id = m[2] || m[3] || m[4];
    const b = block.filter(l => !/^(view job|apply|see all|sample alert)/i.test(l)).slice(-3);
    block = [];
    let title = '', company = '', location = '', years = { min: null, max: null };
    if (source === 'linkedin') {
      [title, company, location] = [b[0] || '', b[1] || '', b[2] || ''];
    } else if (source === 'naukri') {
      [title, company] = [b[0] || '', b[1] || ''];
      const meta = (b[2] || '').split('|').map(x => x.trim());
      years = parseYears(meta[0]);
      location = meta[1] || '';
    } else {
      const head = b.length >= 2 ? b[b.length - 2] : (b[0] || '');
      location = b.length >= 2 ? b[b.length - 1] : '';
      years = parseYears(head);
      const noYears = head.replace(/\(\s*\d{1,2}\s*-\s*\d{1,2}\s*yrs?\s*\)/i, '').trim();
      const parts = noYears.split(/\s+-\s+/);
      company = parts.length > 1 ? parts.pop() : '';
      title = parts.join(' - ');
    }
    const cleanUrl = source === 'linkedin' ? 'https://www.linkedin.com/jobs/view/' + id + '/' : url;
    jobs.push({ job_key: source + ':' + id, source, title, company, location, years_min: years.min, years_max: years.max, link: cleanUrl, alert_date: email.date || '' });
  }
  return jobs;
}

function judge(job, cfg) {
  const t = (job.title || '').toLowerCase();
  const loc = (job.location || '').toLowerCase();
  if (!new RegExp(cfg.title_level_regex, 'i').test(t)) return 'skip: not manager or lead level';
  if (!new RegExp(cfg.title_function_regex, 'i').test(t)) return 'skip: function not growth or analytics';
  if (new RegExp(cfg.title_exclude_regex, 'i').test(t)) return 'skip: excluded title';
  if (!new RegExp(cfg.location_ok_regex, 'i').test(loc)) return 'skip: location';
  if (job.years_min != null && job.years_min > cfg.years_max) return 'skip: needs ' + job.years_min + '+ years';
  if (job.years_max != null && job.years_max < cfg.years_min) return 'skip: too junior';
  return 'shortlist';
}

function norm(s) { return String(s || '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim(); }
function matchKey(job) { return norm(job.company) + '|' + norm(job.title); }

function dedupe(jobs, existingRows) {
  const seen = new Set();
  (existingRows || []).forEach(r => { seen.add(r.job_key); seen.add(matchKey(r)); });
  const out = [];
  for (const j of jobs) {
    if (seen.has(j.job_key) || seen.has(matchKey(j))) continue;
    seen.add(j.job_key); seen.add(matchKey(j));
    out.push(j);
  }
  return out;
}

if (typeof module !== 'undefined') module.exports = { parseEmail, judge, dedupe, htmlToText };
