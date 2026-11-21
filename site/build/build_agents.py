"""Builds the agent pages: /chatgpt, /claude, /claude-code and one per AI app in site/build/agents/agents.json.

Run by build_tools.py after every other page, so page(), CLOSE and the shared nav and footer are already loaded.
Each page explains how to connect that app with the MCP link and plays a live demo: a replay of a real Blazed Kitty
session (scrape the store, pick photos, match the feed, catch problems, bulk edit, bulk schedule). The demo only shows
real Capybaroar MCP tools (src/lib/api/ops.ts); web.fetch and vision.review stand for the AI app's own tools.

Sources in site/build/agents/:
  agents.json  each app: name, logo, setup steps; plus the app logos and network logos as inline SVG
  body.html    the page body, with {{...}} filled per app here
  agents.css   every class ag- prefixed and every token --ag- prefixed, so nothing clashes with style.css
  agents.js    the demo and the copy buttons
Pictures live in site/public/img/agents/ (Blazed Kitty product photos, used with the owner's permission).
Running cost: static files only, nothing added to the bill at Beta or Growth."""
import os, re, json, html as H

AG = os.path.join(HERE, 'agents')
AV = '1'  # bump when agents.css or agents.js change, so browsers fetch the new files
ADATA = json.load(open(os.path.join(AG, 'agents.json')))
ABODY = open(os.path.join(AG, 'body.html')).read()
open(P + 'agents.css', 'w').write(open(os.path.join(AG, 'agents.css')).read())
open(P + 'agents.js', 'w').write('const DATA=' + json.dumps(ADATA, ensure_ascii=False, separators=(',', ':')) + ';\n' + open(os.path.join(AG, 'agents.js')).read())


def agent_faq(A):
    n = A['name']
    qs = [
        (f'How do I connect Capybaroar to {n}?', f'Open Settings in Capybaroar, then API and MCP, and press New key. Copy the MCP link and add it to {n}. {re.sub("<[^>]+>", "", A["body"])}'),
        ('Is it on the Free plan?', 'Yes. Every plan includes the MCP link, Free too. Plan limits like brands and channels still apply.'),
        (f'Will {n} post without asking me?', 'It saves drafts unless you ask it to schedule or post now. If a brand needs approval, posts wait for an owner, an admin or the client.'),
        ('Does it use my Capybaroar AI credits?', f'Writing in {n} uses {n}. Capybaroar credits are only spent when you make pictures or videos in Capybaroar, or use its own agent.'),
        ('Can it handle hundreds of posts?', 'Yes. It creates up to 25 posts per call, so a month of posts takes a few calls. Each post is checked on its own, so one bad post does not stop the rest.'),
        ('How do I disconnect it?', 'Delete the key in Settings, then API and MCP. The link stops working right away.'),
    ]
    return qs


def agent_body(key, A):
    b = ABODY.replace('{{V}}', AV).replace('{{NAME}}', H.escape(A['name'])).replace('{{LOGO}}', ADATA['logos'][A['logo']])
    b = b.replace('<div class="agp" id="agp">', f'<div class="agp" id="agp" data-agent="{key}">', 1)
    fills = {'s2time': H.escape(A['time']), 's2title': H.escape(A['title']), 's2body': A['body'], 's2where': H.escape(A['where']),
             's2pre': H.escape(A['code']), 's2note': H.escape(A['note'])}
    for id_, val in fills.items():
        b, n = re.subn(rf'(id="{id_}"[^>]*>)[^<]*', lambda m: m.group(1) + val, b, count=1)
        assert n == 1, id_
    b = b.replace('id="s2copy">', f'id="s2copy" data-copy="{H.escape(A["code"])}">', 1)
    b += CLOSE.format(a='Your socials,', b='run from ' + H.escape(A['name']) + '.')
    b += f'\n<script src="/agents.js?v={AV}" defer></script>\n'
    assert '{{' not in b
    return b


AGENT_URLS = []
for key, A in ADATA['agents'].items():
    if A.get('href'):  # a card that points at another page (the general /mcp guide)
        continue
    slug = '/' + key
    n = A['name']
    html = page(slug, 'mcp', f'Schedule social media posts from {n} | Capybaroar',
                f'Connect Capybaroar to {n} with one MCP link. Ask {n} to plan, write, check and schedule posts on Instagram, Pinterest, TikTok, LinkedIn and more. Free on every plan.',
                agent_body(key, A), agent_faq(A))
    open(P + key + '.html', 'w').write(html)
    AGENT_URLS.append(slug)

sm = open(P + 'sitemap.xml').read()
add = ''.join(f'  <url><loc>https://capybaroar.com{u}</loc></url>\n' for u in AGENT_URLS if f'capybaroar.com{u}<' not in sm)
if add:
    anchor = '  <url><loc>https://capybaroar.com/mcp</loc></url>\n'
    assert anchor in sm
    sm = sm.replace(anchor, anchor + add, 1)
    open(P + 'sitemap.xml', 'w').write(sm)
print('agent pages built:', len(AGENT_URLS))
