"""Builds the trust pages for capybaroar.com: /subprocessors (from compliance/subprocessors.json, the same file the app
reads to tell owners about changes) and /security. Uses the privacy page's head, nav and footer, adds both pages to
the footer of every page and to the sitemap. Run from anywhere; writes into site/public."""
import glob, html as H, json, os, re

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
P = os.path.join(ROOT, 'site', 'public') + os.sep
SUBS = json.load(open(os.path.join(ROOT, 'compliance', 'subprocessors.json')))
APP = 'https://app.capybaroar.com'
e = H.escape

# ---------- the page shell, taken from the privacy page ----------
tpl = open(P + 'privacy.html').read()
head_end = tpl.index('<main id="main" class="wrap doc">')
foot_start = tpl.index('</main>')
SHELL_TOP, SHELL_BOTTOM = tpl[:head_end], tpl[foot_start + len('</main>'):]


def page(slug, title, description, body):
    top = SHELL_TOP.replace('<title>Privacy Policy | Capybaroar</title>', f'<title>{e(title)} | Capybaroar</title>')
    top = top.replace('<meta name="description" content="Capybaroar privacy policy">', f'<meta name="description" content="{e(description)}">')
    assert top != SHELL_TOP, 'privacy page head changed: update build_legal.py'
    top = top.replace('</head>', f'<link rel="canonical" href="https://capybaroar.com/{slug}">\n</head>', 1)
    open(P + slug + '.html', 'w').write(top + '<main id="main" class="wrap doc">\n' + body.strip() + '\n</main>' + SHELL_BOTTOM)


def nice_date(iso):
    y, m, d = (int(x) for x in iso.split('-'))
    return ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'][m - 1] + f' {d}, {y}'


# ---------- /subprocessors ----------
rows = []
for s in SUBS['subprocessors']:
    if not s['active']:
        continue
    dpa = f'<a href="{e(s["dpa"])}">Terms</a>' if s['dpa'] else ''
    rows.append(f'<tr><th scope="row">{e(s["name"])}</th><td>{e(s["purpose"])}</td><td>{e(s["data"])}</td><td>{e(s["location"])}<br><span class="muted">{e(s["transfer"])}</span></td><td>{dpa}</td></tr>')
chosen = ''.join(f'<li><strong>{e(c["name"])}.</strong> {e(c["detail"])}</li>' for c in SUBS['chosen_by_you'])
page('subprocessors', 'Subprocessors', 'The companies that help Capybaroar run the service and the data each one handles.', f'''
<h1>Subprocessors</h1>
<p class="muted">Last updated {nice_date(SUBS["updated"])}</p>
<p>These companies help us run Capybaroar and handle customer data for us. Each one is bound by a data processing agreement, and transfers out of the EU use the EU Standard Contractual Clauses.</p>
<div class="scroll"><table class="cmp">
<thead><tr><th>Company</th><th>What it does</th><th>Data it handles</th><th>Where</th><th>Agreement</th></tr></thead>
<tbody>
{chr(10).join(rows)}
</tbody></table></div>
<h2>Services you choose</h2>
<ul>{chosen}</ul>
<h2>Changes</h2>
<p>We email workspace owners and everyone signed up below at least {SUBS["notice_days"]} days before a new subprocessor starts handling customer data. You can object by writing to <a href="mailto:hello@capybaroar.com">hello@capybaroar.com</a> in that time.</p>
<form class="subs-form" method="post" action="{APP}/api/subprocessors/subscribe">
<label for="subs-email">Email</label>
<div class="subs-row"><input id="subs-email" name="email" type="email" required autocomplete="email" placeholder="you@company.com" maxlength="254"><button class="btn sm" type="submit">Get change notices</button></div>
</form>
<p id="subs-msg" class="muted" role="status"></p>
<script>
(function () {{
  var q = new URLSearchParams(location.search).get('subscribed');
  var t = {{ check: 'Check your inbox to confirm.', yes: 'You will get an email before any change.', off: 'You won\\u2019t get change emails anymore.', error: 'That didn\\u2019t work. Try again in a few minutes.' }}[q];
  if (t) document.getElementById('subs-msg').textContent = t;
}})();
</script>
<style>.subs-form label{{display:block;font-size:14px;font-weight:500;margin-bottom:6px}}.subs-row{{display:flex;gap:8px;flex-wrap:wrap}}.subs-row input{{flex:1;min-width:220px;height:34px;padding:0 12px;border-radius:8px;border:0;box-shadow:var(--sh-pill);font:inherit}}</style>
''')

# ---------- /security ----------
page('security', 'Security', 'How Capybaroar protects your data and how to report a security problem.', '''
<h1>Security</h1>
<p class="muted">Last updated November 14, 2026</p>
<p class="lead">How we protect your data, and how to tell us about a problem.</p>
<h2>Data in transit and at rest</h2>
<ul><li>Every connection uses HTTPS, and browsers are told to never use plain HTTP (HSTS).</li>
<li>The tokens that let us post to your channels are encrypted with AES-256-GCM before they're stored, and never sent to your browser.</li>
<li>API keys and share links are stored only as hashes. We can't read them back.</li>
<li>Files you upload sit in private storage. They're shown through links that stop working after two hours.</li></ul>
<h2>Access to your data</h2>
<ul><li>Each workspace is kept apart from every other. Inside a workspace, people can be limited to some brands, and clients can only review and approve.</li>
<li>Only Capybaroar's own server reads the database. Browsers and outside tools have no direct access to it.</li>
<li>Sign-in attempts, sign-ups, password resets, invites, report emails and API calls all have limits, so they can't be abused.</li>
<li>Apps that connect through MCP sign in with OAuth (PKCE). You approve each one and can disconnect it any time.</li></ul>
<h2>The app itself</h2>
<ul><li>Every change runs the full test suite before it can go live.</li>
<li>Code and packages are scanned for security problems every week, and package updates are checked weekly.</li>
<li>Uploads are checked by their real contents, not by their name or the type a browser claims.</li>
<li>When the app fetches a web address for you (a feed, a webhook, a link), it can only reach the public internet.</li>
<li>Webhooks we send are signed, so you can check they came from us.</li></ul>
<h2>AI</h2>
<p>When you use AI features, the text or files you ask it to work on go to <a href="/subprocessors">our AI providers</a>. Under their commercial terms they don't train their models on it.</p>
<h2>Keeping and deleting data</h2>
<ul><li>Closed inbox items are deleted after 180 days, agent chats 365 days after the last message, and unfinished sign-ins after an hour.</li>
<li>Disconnecting a channel deletes its token and asks the network to end our access where it offers a way to.</li>
<li>Owners can delete a whole workspace, and anyone can delete their account, from Settings.</li></ul>
<p>More detail is in our <a href="/privacy">privacy policy</a>, and the companies we work with are on the <a href="/subprocessors">subprocessors</a> page.</p>
<h2>Report a security problem</h2>
<p>Email <a href="mailto:hello@capybaroar.com?subject=Security">hello@capybaroar.com</a> with &ldquo;Security&rdquo; in the subject. We reply within 2 business days. Please give us time to fix a problem before you share it, and don't access other people's data or disrupt the service while testing.</p>
''')

# ---------- footer links on every page, and the sitemap ----------
OLD = '<li><a href="/data-deletion">Data deletion</a></li></ul></nav>'
NEW = '<li><a href="/data-deletion">Data deletion</a></li><li><a href="/security">Security</a></li><li><a href="/subprocessors">Subprocessors</a></li></ul></nav>'
for f in glob.glob(P + '**/*.html', recursive=True):
    s = open(f).read()
    if OLD in s and NEW not in s:
        open(f, 'w').write(s.replace(OLD, NEW))

sm = open(P + 'sitemap.xml').read()
for slug in ['security', 'subprocessors']:
    loc = f'  <url><loc>https://capybaroar.com/{slug}</loc></url>\n'
    if loc not in sm:
        sm = sm.replace('  <url><loc>https://capybaroar.com/data-deletion</loc></url>\n', '  <url><loc>https://capybaroar.com/data-deletion</loc></url>\n' + loc, 1)
open(P + 'sitemap.xml', 'w').write(sm)

# security.txt (RFC 9116): where to report, until when this file holds.
os.makedirs(P + '.well-known', exist_ok=True)
open(P + '.well-known/security.txt', 'w').write('Contact: mailto:hello@capybaroar.com\nExpires: 2027-11-14T00:00:00.000Z\nPreferred-Languages: en\nCanonical: https://capybaroar.com/.well-known/security.txt\nPolicy: https://capybaroar.com/security\n')
print('built /subprocessors, /security, footer links, sitemap, security.txt')
