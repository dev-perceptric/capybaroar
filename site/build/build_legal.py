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
    top, n1 = re.subn(r'<title>[^<]*</title>', f'<title>{e(title)} | Capybaroar</title>', SHELL_TOP, count=1)
    top, n2 = re.subn(r'<meta name="description" content="[^"]*">', f'<meta name="description" content="{e(description)}">', top, count=1)
    assert n1 == 1 and n2 == 1, 'privacy page head changed: update build_legal.py'
    top = re.sub(r'<link rel="canonical" href="[^"]*">\n', '', top)
    top = top.replace('</head>', f'<link rel="canonical" href="https://capybaroar.com/{slug}">\n</head>', 1)
    open(P + slug + '.html', 'w').write(top + '<main id="main" class="wrap doc">\n' + body.strip() + '\n</main>' + SHELL_BOTTOM)


def nice_date(iso):
    y, m, d = (int(x) for x in iso.split('-'))
    return ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'][m - 1] + f' {d}, {y}'


# ---------- /subprocessors ----------
import datetime
TODAY = datetime.date.today().isoformat()
def live(x):
    return x['active'] and (not x.get('starts') or x['starts'] <= TODAY)
soon = [x for x in SUBS['subprocessors'] if x.get('starts') and x['starts'] > TODAY]
rows = []
for s in SUBS['subprocessors']:
    if not live(s):
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
{('<h2>Starting soon</h2><ul>' + ''.join(f'<li><strong>{e(x["name"])}</strong> from {nice_date(x["starts"])}: {e(x["purpose"])}. Data: {e(x["data"])}. Where: {e(x["location"])}.</li>' for x in soon) + '</ul>') if soon else ''}
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
<p>When you use AI features, the text or files you ask it to work on go to <a href="/subprocessors">our AI providers</a>. Anthropic&rsquo;s commercial terms say it doesn&rsquo;t train its models on what we send, and fal.ai handles it under its data processing addendum.</p>
<h2>Keeping and deleting data</h2>
<ul><li>Closed inbox items are deleted after 180 days, agent chats 365 days after the last message, and unfinished sign-ins after an hour.</li>
<li>Disconnecting a channel deletes its token and asks the network to end our access where it offers a way to.</li>
<li>Owners can delete a whole workspace, and anyone can delete their account, from Settings.</li></ul>
<p>More detail is in our <a href="/privacy">privacy policy</a>, and the companies we work with are on the <a href="/subprocessors">subprocessors</a> page.</p>
<h2>Report a security problem</h2>
<p>Email <a href="mailto:hello@capybaroar.com?subject=Security">hello@capybaroar.com</a> with &ldquo;Security&rdquo; in the subject. We reply within 2 business days. Please give us time to fix a problem before you share it, and don't access other people's data or disrupt the service while testing.</p>
''')

# ---------- company details and policy versions (one place for the site and the app) ----------
CO = json.load(open(os.path.join(ROOT, 'compliance', 'company.json')))
POL = json.load(open(os.path.join(ROOT, 'compliance', 'policies.json')))
WHO = f'{e(CO["legal_name"])}, doing business as {e(CO["dba"])}'
MAIL = f'<a href="mailto:{e(CO["contact"])}">{e(CO["contact"])}</a>'
active = [x for x in SUBS['subprocessors'] if live(x)]

# ---------- /dpa: the Common Paper DPA cover page, filled in ----------
CP = 'https://commonpaper.com/standards/data-processing-agreement/1.1/'
def kv(rows):
    return '<div class="scroll"><table class="cmp"><tbody>' + ''.join(f'<tr><th scope="row">{k}</th><td>{v}</td></tr>' for k, v in rows) + '</tbody></table></div>'
page('dpa', 'Data Processing Agreement', 'The Capybaroar Data Processing Agreement for customers covered by the GDPR.', f"""
<h1>Data Processing Agreement</h1>
<p class="muted">Version {e(POL["dpa"]["version"])}</p>
<p>This Data Processing Agreement (DPA) covers personal data that {WHO} (&ldquo;Provider&rdquo;) handles for you (&ldquo;Customer&rdquo;) when you use Capybaroar. It is made of this Cover Page and the <a href="{CP}">Common Paper DPA Standard Terms Version 1.1</a> (&ldquo;DPA Standard Terms&rdquo;), which are part of it by reference. Words with capital letters have the meaning given in the DPA Standard Terms.</p>
<p>This DPA is part of our <a href="/terms">Terms of Service</a>. You accept it when you accept the Terms, and it applies from that moment. For a copy signed by both sides, email {MAIL}.</p>
<h2>Key terms</h2>
{kv([
    ('Agreement', f'The Capybaroar <a href="/terms">Terms of Service</a>, version {e(POL["terms"]["version"])}, as updated from time to time.'),
    ('Approved Subprocessors', 'The list at <a href="/subprocessors">capybaroar.com/subprocessors</a>. Provider gives at least ' + str(SUBS['notice_days']) + ' days&rsquo; notice by email before adding one.'),
    ('Provider Security Contact', MAIL),
    ('Security Policy', 'The measures described at <a href="/security">capybaroar.com/security</a> and in Annex II below.'),
    ('Changes to the Agreement', 'None.'),
    ('Governing Law and Chosen Courts', 'As set out in the Agreement.'),
    ('Service Provider Relationship', 'Where the CCPA applies, Provider acts as Customer&rsquo;s service provider and does not sell or share Customer Personal Data.'),
    ('Restricted Transfers', 'Governing Member State for EEA Transfers: Ireland. For UK Transfers: England and Wales.'),
])}
<h2>Annex I(A): List of parties</h2>
{kv([
    ('Data Exporter', 'Customer: the organization or person named in the Capybaroar account. Contact: the workspace owner&rsquo;s email. Role: Controller, or Processor when Customer uses Capybaroar for its own clients.'),
    ('Data Importer', f'Provider: {WHO}. Address: {e(CO["address"])}. Contact: {MAIL}. Role: Processor.'),
])}
<h2>Annex I(B): Description of transfer and processing</h2>
{kv([
    ('Service', 'Capybaroar: scheduling, publishing and analytics for social media, an inbox for comments and messages, link-in-bio pages, client reports and AI writing tools.'),
    ('Categories of Data Subjects', 'Customer&rsquo;s team members and invited clients; people who comment on, mention or message Customer&rsquo;s connected social accounts; people who appear in content Customer uploads; visitors to Customer&rsquo;s link-in-bio pages.'),
    ('Categories of Personal Data', 'Names, email addresses and roles of team members; profile details and access tokens of connected social accounts; posts, pictures, videos and other content; comments and messages with their authors&rsquo; public names, handles and pictures; post results and follower counts; link-in-bio visit counts (visitors are stored only as a daily scrambled code, never as an IP address).'),
    ('Special Category Data', 'No. Capybaroar is not designed for special category data, and Customer will not upload it on purpose.'),
    ('Frequency of Transfer', 'Continuous, for as long as Customer uses the Service.'),
    ('Nature and Purpose of Processing', 'Receiving, holding, using, updating, protecting, sharing (with the social networks Customer chooses and the Approved Subprocessors), returning and erasing Customer Personal Data, to provide the Service under the Agreement.'),
    ('Duration of Processing', 'As set out in the DPA Standard Terms: for as long as Provider handles Customer Personal Data under the Agreement.'),
])}
<h2>Annex I(C): Competent supervisory authority</h2>
<p>As set out in the DPA Standard Terms.</p>
<h2>Annex II: Technical and organizational security measures</h2>
<p>See the Security Policy. In short:</p>
<ul><li><strong>Encryption:</strong> HTTPS for every connection; access tokens encrypted with AES-256-GCM before storage; API keys and share links stored only as hashes.</li>
<li><strong>Access control:</strong> each workspace kept apart from every other; roles and brand limits inside a workspace; only Provider&rsquo;s server reads the database; uploaded files kept private and shown through links that expire after two hours.</li>
<li><strong>Abuse limits:</strong> limits on sign-in attempts, sign-ups, password resets, invites, report emails and API calls.</li>
<li><strong>Secure development:</strong> every change passes the full test suite before release; weekly scans of the code and its packages.</li>
<li><strong>Retention and erasure:</strong> set keep times for inbox items, chats and sign-in records; Customer can delete channels, the whole workspace or an account from Settings, and ask for a copy of its data by email.</li>
<li><strong>Subprocessors:</strong> bound by written data protection terms, listed publicly, with advance notice of changes.</li></ul>
<h2>Signatures</h2>
<p>Accepting the Terms online is enough. For a countersigned copy, Provider signs as: {WHO}. Name: [Name of signer]. Title: [Title]. Customer signs with its official name, the signer&rsquo;s name and title, and the date.</p>
<p class="muted">Based on the <a href="https://commonpaper.com/standards/data-processing-agreement">Common Paper Data Processing Agreement (Version 1.1)</a>, free to use under <a href="https://creativecommons.org/licenses/by/4.0/">CC BY 4.0</a>.</p>
""")

# ---------- /privacy ----------
shared = ', '.join(f'{e(x["purpose"].split(";")[0].lower())} ({e(x["name"])})' for x in active)
page('privacy', 'Privacy Policy', 'How Capybaroar collects, uses and protects personal data.', f"""
<h1>Privacy Policy</h1>
<p class="muted">Version {e(POL["privacy"]["version"])}</p>
<p>This policy explains what Capybaroar collects, why, and what you can do about it. Capybaroar is run by {WHO} (&ldquo;we&rdquo;), {e(CO["address"])}. Contact: {MAIL}.</p>
<h2>Our two roles</h2>
<p>For your account, your billing and our website, we decide how data is used, so we are its controller. For the content you and your team add to a workspace, like posts, files and the comments and messages people send your channels, we handle it for you as your processor, under our <a href="/dpa">Data Processing Agreement</a>. If you reached us through a business that uses Capybaroar, that business decides how your data is used, so contact them first.</p>
<h2>What we collect</h2>
<ul><li><strong>Account details:</strong> name, email and password (stored hashed), or your name and email from Google if you sign in with Google.</li>
<li><strong>Connected channels:</strong> the access tokens and basic profile details each network gives us when you connect it. Tokens are encrypted.</li>
<li><strong>Your content:</strong> posts, files, schedules, campaigns, link-in-bio pages and reports you create.</li>
<li><strong>Comments and messages:</strong> what people send to your connected channels, with their public name, handle and picture, so you can answer them in the inbox.</li>
<li><strong>Results:</strong> views, likes, comments, shares and follower counts from the networks.</li>
<li><strong>Link-in-bio visits:</strong> counted with a daily scrambled code. We never store visitors&rsquo; IP addresses.</li>
<li><strong>Security data:</strong> your IP address is used to limit sign-in attempts and stop abuse. We store only a scrambled form for a short time.</li>
<li><strong>Billing:</strong> handled by Stripe. Card details go straight to Stripe and never reach us.</li></ul>
<h2>Why we use it, and on what legal basis</h2>
<div class="scroll"><table class="cmp"><thead><tr><th>Purpose</th><th>Legal basis (GDPR)</th></tr></thead><tbody>
<tr><td>Running Capybaroar: publishing, the inbox, analytics, reports, AI tools you choose to use</td><td>Contract</td></tr>
<tr><td>Account emails: sign-in, invites, failed posts, reviews</td><td>Contract</td></tr>
<tr><td>Keeping the service safe: limits, abuse prevention, fixing errors</td><td>Legitimate interests</td></tr>
<tr><td>Billing records and invoices</td><td>Legal obligation</td></tr>
<tr><td>Subprocessor change emails you sign up for</td><td>Consent (you can stop them any time)</td></tr>
</tbody></table></div>
<p>We don&rsquo;t sell your data or use it for advertising. See AI features below for what our AI providers may do with it.</p>
<h2>Data from social networks</h2>
<p>We use the data a network gives us only to publish and manage posts and show analytics for you. Capybaroar&rsquo;s use of information received from Google APIs follows the <a href="https://developers.google.com/terms/api-services-user-data-policy">Google API Services User Data Policy</a>, including the Limited Use requirements.</p>
<h2>YouTube</h2>
<p>Capybaroar uses YouTube API Services. When you connect a YouTube channel, you agree to the <a href="https://www.youtube.com/t/terms">YouTube Terms of Service</a>, and Google&rsquo;s handling of your data is covered by the <a href="https://policies.google.com/privacy">Google Privacy Policy</a>.</p>
<p>With your permission we use your YouTube data to: upload the videos you schedule with the title, description, visibility and thumbnail you choose (youtube.upload); show your channel&rsquo;s name, picture and subscriber count, and the views, likes and comments of videos you posted through Capybaroar (youtube.readonly); and, when you ask, reply to and hide comments on your videos, change a video you posted through Capybaroar, and delete it (youtube.force-ssl). We never sell YouTube data, use it for advertising, or share it with anyone except the service providers that run Capybaroar for you.</p>
<p>We keep your YouTube access token encrypted and your videos&rsquo; results for as long as the channel stays connected. When you disconnect the channel in Capybaroar, we delete its access token and ask Google to end our access, and you can ask us to delete its stored data at any time at {MAIL}. You can also remove Capybaroar&rsquo;s access at any time in your Google Account&rsquo;s security settings: <a href="https://myaccount.google.com/permissions">myaccount.google.com/permissions</a>.</p>
<h2>AI features</h2>
<p>When you use AI writing, the agent or AI pictures and video, the text or files you ask it to work on go to our AI providers to produce the result. Anthropic&rsquo;s commercial terms say it doesn&rsquo;t train its models on what we send, and fal.ai handles it under its data processing addendum. AI results are suggestions: nothing is posted unless you or a teammate schedules it.</p>
<h2>Who we share it with</h2>
<p>Only the companies we need to run Capybaroar: {shared}. Each is bound by data protection terms. The full list, with what each one handles and where, is on the <a href="/subprocessors">subprocessors</a> page. We also send your posts to the social networks you connect, which use them under their own terms.</p>
<h2>Where your data is stored</h2>
<p>Our servers are in the {e(CO["server_location"])}. When data from the EEA, the UK or Switzerland is sent there, or to our subprocessors outside those places, we use the EU Standard Contractual Clauses (with the UK Addendum for UK data).</p>
<h2>How long we keep it</h2>
<p>We keep your data while your workspace is open, and delete some of it sooner:</p>
<ul><li>Unfinished sign-ins to a network: 1 hour.</li>
<li>Inbox comments and messages you&rsquo;ve closed: 180 days.</li>
<li>Agent chats: 365 days after the last message.</li>
<li>Records of background work, like publishing and reading jobs: 30 days.</li>
<li>Exports you download: 24 hours.</li>
<li>The security log of who did what in a workspace (Settings, Audit log): 365 days. It keeps the name or email of the person who acted, even after their account is deleted, so the workspace keeps an accurate record.</li>
<li>Sign-ups for subprocessor change emails: 7 days if never confirmed, 30 days after you unsubscribe.</li></ul>
<p>When you disconnect a channel, we delete its access token and its inbox, and ask the network to end our access where it offers a way to. An owner can delete a workspace in Settings: we cancel its subscription, end its access on the networks that offer a way to, and delete its files and data. You can delete your account in Settings too, which also deletes workspaces where you&rsquo;re the only member. We keep invoices as long as tax law requires.</p>
<h2>How we protect it</h2>
<p>See our <a href="/security">security page</a>.</p>
<h2>Your rights</h2>
<p>Wherever you live, you can ask to see your data, get a copy of it, fix it or delete it. Under the GDPR you can also limit or object to how we use it, and withdraw consent you gave. You can delete channels, workspaces and your account yourself in Settings. For anything else, email {MAIL}. We reply within 30 days. If you think we got something wrong, you can complain to the data protection authority where you live.</p>
<h2>EU representative</h2>
<p>We don&rsquo;t have an office in the EU. Our representative there under Article 27 of the GDPR is: {e(CO["eu_representative"])}.</p>
<h2>Cookies</h2>
<p>We use only the cookies needed to keep you signed in, remember which workspace you&rsquo;re in, and finish connecting a channel safely. We don&rsquo;t use cookies for tracking or advertising, so there&rsquo;s nothing to accept or refuse.</p>
<h2>Children</h2>
<p>Capybaroar is not meant for anyone under 16, and we don&rsquo;t knowingly collect their data.</p>
<h2>Changes</h2>
<p>When we change this policy, we post the new version here. For important changes, we tell you in the app or by email before they apply.</p>
<h2>Contact</h2>
<p>{MAIL}</p>
""")

# ---------- /terms: the party, the DPA and the version ----------
t = open(P + 'terms.html').read()
t = re.sub(r'<p class="muted">(Last updated [^<]*|Version [^<]*)</p>', f'<p class="muted">Version {e(POL["terms"]["version"])}</p>', t, count=1)
t = re.sub(r'<p>These terms cover your use of Capybaroar, a service run by [^<]*</p>', f'<p>These terms cover your use of Capybaroar, a service run by {WHO} (&ldquo;we&rdquo;), {e(CO["address"])}. By creating an account and accepting them, you agree to them.</p>', t, count=1)
if 'id="dpa"' not in t:
    t = t.replace('<h2>Connected channels</h2>', f'<h2 id="dpa">Personal data</h2>\n<p>Our <a href="/privacy">Privacy Policy</a> explains how we handle personal data. When you use Capybaroar for a business and the GDPR or a similar law applies to the personal data in your workspace, our <a href="/dpa">Data Processing Agreement</a> is part of these terms.</p>\n<h2>Connected channels</h2>', 1)
t = t.replace('<p>We may update these terms and will post the new date here. If you keep using Capybaroar after a change, you accept the new terms.</p>', '<p>We may update these terms and will post the new version here. For important changes, we ask you to accept the new terms in the app before they apply to you.</p>')
open(P + 'terms.html', 'w').write(t)

# ---------- footer links on every page, and the sitemap ----------
OLD = '<li><a href="/data-deletion">Data deletion</a></li></ul></nav>'
NEW = '<li><a href="/data-deletion">Data deletion</a></li><li><a href="/security">Security</a></li><li><a href="/subprocessors">Subprocessors</a></li><li><a href="/dpa">DPA</a></li></ul></nav>'
PHASE1 = '<li><a href="/data-deletion">Data deletion</a></li><li><a href="/security">Security</a></li><li><a href="/subprocessors">Subprocessors</a></li></ul></nav>'
for f in glob.glob(P + '**/*.html', recursive=True):
    s = open(f).read()
    if NEW in s:
        continue
    t = s.replace(PHASE1, NEW) if PHASE1 in s else s.replace(OLD, NEW)
    if t != s:
        open(f, 'w').write(t)

sm = open(P + 'sitemap.xml').read()
for slug in ['security', 'subprocessors', 'dpa']:
    loc = f'  <url><loc>https://capybaroar.com/{slug}</loc></url>\n'
    if loc not in sm:
        sm = sm.replace('  <url><loc>https://capybaroar.com/data-deletion</loc></url>\n', '  <url><loc>https://capybaroar.com/data-deletion</loc></url>\n' + loc, 1)
open(P + 'sitemap.xml', 'w').write(sm)

# security.txt (RFC 9116): where to report, until when this file holds.
os.makedirs(P + '.well-known', exist_ok=True)
open(P + '.well-known/security.txt', 'w').write('Contact: mailto:hello@capybaroar.com\nExpires: 2027-11-14T00:00:00.000Z\nPreferred-Languages: en\nCanonical: https://capybaroar.com/.well-known/security.txt\nPolicy: https://capybaroar.com/security\n')
print('built /subprocessors, /security, /dpa, /privacy, /terms, footer links, sitemap, security.txt')
