"""Round two of free tools: five text styles, five size checkers with safe zones, a word counter, a TikTok money
calculator and an engagement rate calculator."""
import os, json, html as H
HERE = os.path.dirname(os.path.abspath(__file__))
exec(open(os.path.join(HERE, 'tools_text.py')).read())   # styles_tool, WHERE_TABLE, A11Y
exec(open(os.path.join(HERE, 'tools_media.py')).read())  # drop, opts, MODES, FILLS
TOOLS = []

# ---------------------------------------------------------------- A to Z tables for the font pages
HOLES = {0x1D455: 0x210E, 0x1D49D: 0x212C, 0x1D4A0: 0x2130, 0x1D4A1: 0x2131, 0x1D4A3: 0x210B, 0x1D4A4: 0x2110, 0x1D4A7: 0x2112, 0x1D4A8: 0x2133, 0x1D4AD: 0x211B,
         0x1D4BA: 0x212F, 0x1D4BC: 0x210A, 0x1D4C4: 0x2134, 0x1D506: 0x212D, 0x1D50B: 0x210C, 0x1D50C: 0x2111, 0x1D515: 0x211C, 0x1D51D: 0x2128}


def styled(up, lo, s):
    out = ''
    for ch in s:
        c = ord(ch)
        if 65 <= c <= 90:
            o = up + c - 65
        elif 97 <= c <= 122:
            o = lo + c - 97
        else:
            out += ch
            continue
        out += chr(HOLES.get(o, o))
    return out


def az_table(rows):
    letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
    head = '<tr><th>Plain</th>' + ''.join(f'<th>{n}</th>' for n, _, _ in rows) + '</tr>'
    body = ''
    for L in letters:
        body += f'<tr><th>{L} {L.lower()}</th>' + ''.join(f'<td>{styled(u, l, L)} {styled(u, l, L.lower())}</td>' for _, u, l in rows) + '</tr>'
    return f'<div class="scroll"><table class="cmp az"><thead>{head}</thead><tbody>{body}</tbody></table></div>'


# ---------------------------------------------------------------- Old English
TOOLS.append(dict(
    slug='/tools/old-english-font-generator', key='oldenglish', icon='i-text', group='text',
    name='Old English font generator', line='Gothic, blackletter text to copy and paste.',
    title='Old English Font Generator: Gothic Text to Copy and Paste | Capybaroar',
    desc='Turn any text into Old English, gothic or blackletter letters you can copy and paste into Instagram, TikTok, Discord and more. Free, no account.',
    tag='Free tool', h1a='Old English font generator', h1b='gothic text to copy and paste',
    lead='Type your words and get them in Old English, also called gothic or blackletter. Copy the style you like and paste it into your bio, name or post.',
    tool=styles_tool(['fraktur', 'bold-fraktur', 'script', 'bold-script', 'double', 'small-caps'], 'Old English'),
    read=f'''<h2>What is an Old English font?</h2>
<p>"Old English" is the name most people use for blackletter: the heavy, pointed letters you see on old Bibles, newspaper mastheads, diplomas, tattoos and band logos. Type designers call it blackletter, gothic or fraktur, after the style that German printers used for centuries.</p>
<p>The top two lines of the list, <b>Gothic</b> and <b>Bold gothic</b>, are that look. The others are close relatives that pair well with it: script, outline letters and small caps.</p>
<h2>How the generator works</h2>
<p>Social apps don't let you pick a font, so the generator uses Unicode instead. Unicode, the character set every device uses, includes a full set of fraktur letters made for math. The generator swaps each letter you type for its gothic twin. The result is text, so you can paste it into Instagram, TikTok, X, Discord or anywhere else that takes text.</p>
<ol><li>Type your text in the box.</li><li>Pick <b>Gothic</b> or <b>Bold gothic</b>.</li><li>Press <b>Copy</b> and paste it where you want it.</li></ol>
<h2>The full Old English alphabet</h2>
<p>Here is every letter in both gothic styles, in capitals and lowercase. A few capitals, like ℭ, ℌ, ℑ, ℜ and ℨ, come from a different part of Unicode, so they can look a little different from the rest on some phones.</p>
{az_table([('Gothic', 0x1D504, 0x1D51E), ('Bold gothic', 0x1D56C, 0x1D586)])}
<h2>Where people use gothic text</h2>
<ul>
<li><b>Gaming and Discord names.</b> Bold gothic looks strong in a player list.</li>
<li><b>Band, streetwear and tattoo-studio profiles.</b> A gothic name in your bio sets the mood right away.</li>
<li><b>Headings in a caption.</b> One gothic word as a title, with plain text below it.</li>
</ul>
{WHERE_TABLE}
<h2>Want Old English for a tattoo, a logo or print?</h2>
<p>The letters here are made for screens and social posts. For a tattoo stencil, a logo or anything printed, use a real blackletter font file instead, so the letters keep a clean, even shape at any size. Microsoft Office includes one called Old English Text MT, and Google Fonts has free blackletter fonts such as UnifrakturMaguntia that you can use in design apps.</p>
{A11Y}''',
    faq=[('How do I get the Old English font on Instagram?', 'Type your text here, copy the Gothic or Bold gothic version and paste it into your Instagram name, bio or caption. Your @username can only use plain letters, numbers, periods and underscores.'),
         ('Is Old English the same as gothic text?', 'Yes, people use the names for the same style. Designers call it blackletter or fraktur.'),
         ('Why do some gothic capitals look different?', 'ℭ, ℌ, ℑ, ℜ and ℨ were added to Unicode earlier, in a different block, so some phones draw them in a slightly different shape from the other letters.'),
         ('Can I use this for a tattoo?', 'Use it to try out words, then have your artist use a real blackletter font file for the stencil. Screen text can look uneven when it is printed large.'),
         ('Does gothic text work in Discord and games?', 'Yes, in Discord nicknames and display names and in most games that allow special characters. Usernames often only allow plain letters.'),
         ('Are there gothic numbers?', 'No. Unicode only has gothic letters, so numbers stay plain. Bold gothic pairs well with bold numbers from our bold text generator.')]))

# ---------------------------------------------------------------- Cursive
TOOLS.append(dict(
    slug='/tools/cursive-generator', key='cursive', icon='i-pen', group='text',
    name='Cursive generator', line='Cursive text to copy and paste anywhere.',
    title='Cursive Generator: Cursive Text to Copy and Paste | Capybaroar',
    desc='Turn your text into cursive you can copy and paste into Instagram, TikTok, Discord and more. Script, bold script and italic styles, plus the full cursive alphabet.',
    tag='Free tool', h1a='Cursive generator', h1b='cursive text to copy and paste',
    lead='Type your words and copy them in cursive. Script, bold script and italic styles that paste into any bio, name or caption.',
    tool=styles_tool(['script', 'bold-script', 'italic', 'bold-italic', 'italic-sans', 'bold-italic-sans'], 'Cursive text'),
    read=f'''<h2>How the cursive generator works</h2>
<p>Instagram, TikTok and Discord don't have a cursive font option. Every profile uses the same typeface. To get cursive, this tool swaps each letter for a "script" letter from Unicode, the character set every phone and computer shares. Those letters look like handwriting, but they are text, so they copy and paste like normal words.</p>
<ol><li>Type your name, a word or a short line.</li><li>Pick <b>Script</b> for light, elegant cursive or <b>Bold script</b> for a thicker, easier-to-read look.</li><li>Press <b>Copy</b> and paste it anywhere.</li></ol>
<h2>Which cursive style should I pick?</h2>
<ul>
<li><b>Script</b> (𝒸𝓊𝓇𝓈𝒾𝓋ℯ) is thin and fancy. It looks lovely large, but small words can be hard to read on a phone.</li>
<li><b>Bold script</b> (𝓬𝓾𝓻𝓼𝓲𝓿𝓮) is the most popular choice for names and bios because it stays readable.</li>
<li><b>Italic</b> and <b>bold italic</b> lean like handwriting without the loops, a good pick for quotes.</li>
</ul>
<h2>The cursive alphabet, A to Z</h2>
<p>Every letter in both script styles, capitals and lowercase. Copy straight from the table if you only need one letter.</p>
{az_table([('Script', 0x1D49C, 0x1D4B6), ('Bold script', 0x1D4D0, 0x1D4EA)])}
<p>A few script letters, like ℬ, ℰ, ℱ, ℋ, ℐ, ℒ, ℳ, ℛ, ℯ, ℊ and ℴ, were added to Unicode earlier than the rest. On some phones they look slightly different, which is normal.</p>
<h2>Ideas for cursive text</h2>
<ul>
<li>Your name in bold script at the top of your Instagram or TikTok bio.</li>
<li>A signature line at the end of a caption, like 𝓧𝓸𝔁𝓸, 𝓜𝓪𝔂𝓪.</li>
<li>Wedding, event and boutique profiles that want a soft, elegant feel.</li>
<li>A Discord nickname or a role name.</li>
</ul>
{WHERE_TABLE}
{A11Y}
<div class="note">Planning posts to go with your new bio? Capybaroar schedules a whole week of posts to Instagram, TikTok and 10 more networks from one calendar.</div>''',
    faq=[('How do I write in cursive on Instagram?', 'Type your text here, copy the Script or Bold script version and paste it into your name, bio, caption or comment.'),
         ('Is this a real cursive font?', 'It is made of Unicode script letters, which look like cursive and paste anywhere as text. A real font file only works in apps that let you choose fonts.'),
         ('Why do some cursive letters look different?', 'A few script letters were added to Unicode earlier than the rest, so some phones draw them in a slightly different style.'),
         ('Does cursive work on TikTok and Discord?', 'Yes, in TikTok bios and captions and in Discord display names, nicknames and messages.'),
         ('Can I get cursive numbers?', 'Bold script includes bold numbers. Regular script keeps numbers plain.'),
         ('Is cursive text readable for everyone?', 'Not always. Some screen readers read script letters as symbols. Use cursive for a name or a short line, and keep the rest plain.')]))

# ---------------------------------------------------------------- Instagram fonts
TOOLS.append(dict(
    slug='/tools/instagram-fonts', key='igfonts', icon='i-image', group='text',
    name='Instagram fonts', line='Fonts for your Instagram bio, name and captions.',
    title='Instagram Fonts: Copy and Paste Fonts for Your Bio and Captions | Capybaroar',
    desc='Copy and paste Instagram fonts for your bio, name, captions and Stories. 20+ styles, framed names and tips for a bio that looks good and stays easy to find.',
    tag='Free tool', h1a='Instagram fonts', h1b='for your bio, name and captions',
    lead='Make your Instagram stand out with fonts you can copy and paste. Type once, pick a style and paste it into your bio, name, captions or comments.',
    tool=styles_tool(['bold-script', 'script', 'bold-sans', 'bold', 'italic', 'bold-italic-sans', 'fraktur', 'bold-fraktur', 'double', 'small-caps', 'superscript', 'mono', 'wide', 'circled', 'circled-dark', 'squared-dark'], 'Your Instagram name', frames=True),
    read='''<h2>Where you can use fonts on Instagram</h2>
<div class="scroll"><table class="cmp"><thead><tr><th>Part of your profile</th><th>Fonts work?</th><th>Good to know</th></tr></thead><tbody>
<tr><th>Name</th><td>Yes</td><td>The bold line at the top of your profile. Instagram lets you change it twice in 14 days.</td></tr>
<tr><th>Username (@handle)</th><td>No</td><td>Only letters, numbers, periods and underscores, up to 30 characters.</td></tr>
<tr><th>Bio</th><td>Yes</td><td>Up to 150 characters. Styled letters count toward the limit.</td></tr>
<tr><th>Captions and comments</th><td>Yes</td><td>Keep hashtags plain, or they stop working.</td></tr>
<tr><th>Story text</th><td>Yes</td><td>Paste styled text into a text sticker. Stories also have their own built-in fonts.</td></tr>
<tr><th>Highlights names</th><td>Yes</td><td>Short styled words make tidy highlight labels.</td></tr>
</tbody></table></div>
<h2>How to change the font in your Instagram bio</h2>
<ol>
<li>Type your bio here and pick a style.</li>
<li>Press <b>Copy</b>.</li>
<li>In Instagram, go to your profile and tap <b>Edit profile</b>.</li>
<li>Tap <b>Bio</b> (or <b>Name</b>), paste and save.</li>
</ol>
<h2>Bio ideas that look good</h2>
<ul>
<li><b>Name in bold script, details plain.</b> 𝓒𝓻𝓾𝓶𝓫 & 𝓒𝓸. on top, then "Sourdough, baked daily in Austin" in normal text.</li>
<li><b>Small caps for a tagline.</b> ʙᴀᴋᴇʀ | ᴛᴇᴀᴄʜᴇʀ | ᴅᴏɢ ᴍᴏᴍ reads cleanly in a line.</li>
<li><b>A framed name.</b> The frames at the bottom of the list, like ꧁ ꧂, make a name pop.</li>
<li><b>Bold sans for one call to action.</b> 𝗡𝗲𝘄 𝗿𝗲𝗰𝗶𝗽𝗲𝘀 𝗲𝘃𝗲𝗿𝘆 𝗙𝗿𝗶𝗱𝗮𝘆 above your link.</li>
</ul>
<h2>Don't hide your name from search</h2>
<p>Instagram search matches the letters in your username and your name. If your name is fully styled, people who type it in plain letters may not find you. Two ways around it:</p>
<ul>
<li>Keep your username plain (it has to be anyway) and make sure it's easy to guess.</li>
<li>Style only part of your name, or add the plain version after it, like 𝓜𝓪𝔂𝓪 | Maya Ruiz.</li>
</ul>
<h2>Fonts in captions</h2>
<p>A styled first line works like a headline and gets people to tap "more". Use bold sans or bold script for it, then write the rest in plain text so it's easy to read and screen readers can follow it. Our <a href="/tools/character-counter">character counter</a> checks that your caption stays under 2,200 characters.</p>
<div class="note">Capybaroar shows how your caption looks on a phone before it goes out, and schedules Instagram posts, carousels, Reels and Stories for you.</div>''',
    faq=[('How do I get different fonts on Instagram?', 'Type your text here, copy the style you like and paste it into your Instagram name, bio, caption or comment.'),
         ('Can I change the font of my Instagram username?', 'No. Usernames only take letters, numbers, periods and underscores. Your name and bio take any style here.'),
         ('How many characters is an Instagram bio?', 'Up to 150 characters. Styled letters and emoji count toward that.'),
         ('Will Instagram fonts hurt my reach?', 'They don\'t lower reach, but styled words are not matched by search. Keep your username plain and your hashtags plain.'),
         ('Why do my fonts show as boxes for some people?', 'An older phone may be missing a few symbols. Bold sans, bold script and small caps show on almost every device.'),
         ('Can I use these fonts in Instagram Stories?', 'Yes. Copy a style here and paste it into a Story text sticker.'),
         ('What are the most popular Instagram fonts?', 'Bold script for names, bold sans for headings and small caps for taglines.')]))

# ---------------------------------------------------------------- Discord fonts
DISCORD_MD = '''<div class="scroll"><table class="cmp"><thead><tr><th>Type this</th><th>Discord shows</th></tr></thead><tbody>
<tr><th><code>**bold**</code></th><td><b>bold</b></td></tr>
<tr><th><code>*italic*</code> or <code>_italic_</code></th><td><i>italic</i></td></tr>
<tr><th><code>***bold italic***</code></th><td><b><i>bold italic</i></b></td></tr>
<tr><th><code>__underline__</code></th><td><u>underline</u></td></tr>
<tr><th><code>~~strikethrough~~</code></th><td><s>strikethrough</s></td></tr>
<tr><th><code>||spoiler||</code></th><td>Hidden until someone clicks it</td></tr>
<tr><th><code>`code`</code></th><td>Code in a gray box</td></tr>
<tr><th><code>```code block```</code></th><td>A block of code over several lines</td></tr>
<tr><th><code># Heading</code> (also <code>##</code>, <code>###</code>)</th><td>Big, medium and small headings, at the start of a line</td></tr>
<tr><th><code>-# small text</code></th><td>Small gray subtext</td></tr>
<tr><th><code>&gt; quote</code></th><td>A quote with a bar on the left</td></tr>
<tr><th><code>- item</code></th><td>A bullet list</td></tr>
</tbody></table></div>'''
TOOLS.append(dict(
    slug='/tools/discord-font-generator', key='discord', icon='i-text', group='text',
    name='Discord font generator', line='Fonts for Discord names, nicknames and messages.',
    title='Discord Font Generator: Fonts for Names, Nicknames and Messages | Capybaroar',
    desc='Copy and paste fonts for your Discord display name, nickname, server and channel names. Plus every Discord text formatting code, from bold to spoilers.',
    tag='Free tool', h1a='Discord font generator', h1b='for names, nicknames and messages',
    lead='Type your name and copy it in gothic, bubbles, small caps and more for your Discord profile, nickname, server or channels. Discord\'s own formatting codes are below too.',
    tool=styles_tool(['bold-fraktur', 'fraktur', 'bold-script', 'double', 'bold-sans', 'small-caps', 'mono', 'wide', 'circled', 'circled-dark', 'squared', 'squared-dark', 'superscript', 'upside'], 'YourName', frames=True),
    read=f'''<h2>Where fonts work on Discord</h2>
<div class="scroll"><table class="cmp"><thead><tr><th>Where</th><th>Fonts work?</th><th>Good to know</th></tr></thead><tbody>
<tr><th>Display name</th><td>Yes</td><td>The name people see in chat and member lists.</td></tr>
<tr><th>Server nickname</th><td>Yes</td><td>Up to 32 characters. Styled letters count toward it.</td></tr>
<tr><th>Username</th><td>No</td><td>Only lowercase letters, numbers, periods and underscores.</td></tr>
<tr><th>Server and channel names</th><td>Yes</td><td>Admins can style channel names, like #ᴀɴɴᴏᴜɴᴄᴇᴍᴇɴᴛꜱ.</td></tr>
<tr><th>Role names and messages</th><td>Yes</td><td>Paste styled text anywhere you can type.</td></tr>
</tbody></table></div>
<h2>How to change your Discord name font</h2>
<ol>
<li>Type your name here, pick a style and press <b>Copy</b>.</li>
<li>In Discord, open <b>User Settings</b>, then <b>Profiles</b>.</li>
<li>Paste into <b>Display Name</b> and save. For one server only, right-click the server, choose <b>Edit Per-server Profile</b> and paste into the nickname.</li>
</ol>
<h2>Discord's own text formatting</h2>
<p>Discord messages have formatting built in. Type these codes and Discord styles your message for you, no generator needed:</p>
{DISCORD_MD}
<p>The difference: formatting codes only work in messages, and only inside Discord. Fonts from the generator work in names, channel names and anywhere else, including other apps.</p>
<h2>Ideas for a Discord server</h2>
<ul>
<li><b>Channel names in small caps</b> look neat in the sidebar: #ʀᴜʟᴇꜱ, #ɢᴇɴᴇʀᴀʟ, #ᴄʟɪᴘꜱ.</li>
<li><b>Role names in bold gothic</b> for a gaming or fantasy server.</li>
<li><b>Framed names</b> for mods and admins, so members can spot them.</li>
</ul>
<h2>Mods: think about mentions and search</h2>
<p>A styled name is harder to @mention and search, because people type plain letters. Some servers ask members to keep names readable for that reason. Discord's own rules don't ban special characters, but each server can set its own.</p>
{A11Y}''',
    faq=[('How do I change my font on Discord?', 'Discord has no font picker for names. Copy a style from this tool and paste it into your display name or server nickname.'),
         ('Can I use fonts in my Discord username?', 'No. Usernames only take lowercase letters, numbers, periods and underscores. Display names and nicknames take styled text.'),
         ('How do I make bold text on Discord?', 'In a message, put two asterisks on each side: **bold**. For bold in a name, copy a bold style from this tool.'),
         ('How long can a Discord nickname be?', 'Up to 32 characters. Styled letters count toward that.'),
         ('How do I make small text in Discord messages?', 'Start a line with -# and a space to make small gray subtext. Small caps from this tool also work in names and channels.'),
         ('Can I use fonts in channel names?', 'Yes. Server admins can paste styled text into channel and role names.'),
         ('Will a fancy name stop people mentioning me?', 'It can make you harder to find, since people type plain letters. Keep part of your name plain if you want to be easy to @mention.')]))

# ---------------------------------------------------------------- Upside down
TOOLS.append(dict(
    slug='/tools/upside-down-text-generator', key='upside', icon='i-repeat', group='text',
    name='Upside down text', line='Flip, reverse and mirror text to copy and paste.',
    title='Upside Down Text Generator: Flip Text to Copy and Paste | Capybaroar',
    desc='Flip text upside down, write it backwards or mirror it. Copy and paste it into Instagram, TikTok, X, Discord and more. Free, no account.',
    tag='Free tool', h1a='Upside down text generator', h1b='flip, reverse and mirror',
    lead='Type anything and get it upside down, backwards or mirrored. Copy it in one tap and paste it into posts, comments and names.',
    tool=styles_tool(['upside', 'reverse', 'mirror'], 'Hello world'),
    read='''<h2>How upside down text works</h2>
<p>There is no "flip" button for text. Upside down text is made of letters from other alphabets and symbol sets that happen to look like normal letters turned over. An upside-down "e" is the letter ǝ, an upside-down "a" is ɐ, and so on. The tool swaps each letter for its flipped look-alike, then reverses the order, so the whole line reads correctly when you turn your phone around.</p>
<h2>Three ways to flip</h2>
<ul>
<li><b>Upside down</b> (ʇxǝʇ uʍop ǝpısdn): turned over and reversed, so it reads when you rotate the screen.</li>
<li><b>Backwards</b>: the same letters in reverse order, like a word game.</li>
<li><b>Mirror</b>: letters flipped left to right as if seen in a mirror, using look-alike characters where they exist.</li>
</ul>
<h2>How to use it</h2>
<ol><li>Type your text.</li><li>Pick a style and press <b>Copy</b>.</li><li>Paste it into a post, comment, bio or game chat.</li></ol>
<h2>Good to know</h2>
<ul>
<li><b>Some letters have no perfect twin.</b> Unicode doesn't have a flipped version of every letter and number, so a few use the closest match.</li>
<li><b>Mirror text is partial.</b> Letters that look the same in a mirror, like A, H, O and X, stay as they are.</li>
<li><b>It can be hard to read.</b> That's the fun of it, but keep important details, like a date or a link, in normal text.</li>
<li><b>Screen readers can't read it.</b> They read each symbol by name, so flipped text is best for jokes and decoration.</li>
</ul>
<h2>Fun ways to use it</h2>
<ul>
<li>"Turn your phone around" jokes on April Fools' Day.</li>
<li>A playful bio line for an Australia-based account, "down under".</li>
<li>Puzzles and giveaways where followers have to decode a word.</li>
<li>Gaming names that stand out in a list.</li>
</ul>
<div class="note">Plan your April Fools' post in advance: write it in Capybaroar, schedule it for 9 AM on April 1 and it goes out to every network on its own.</div>''',
    faq=[('How do I type upside down?', 'Type normally in the box. The tool flips each letter and reverses the order. Copy the result and paste it anywhere.'),
         ('Does upside down text work on Instagram and TikTok?', 'Yes. It pastes into captions, comments and bios on Instagram, TikTok, X, Facebook and Discord.'),
         ('Why do some letters not flip?', 'Unicode has no flipped twin for a few letters and numbers, so the tool uses the closest match or keeps the letter.'),
         ('What is the difference between backwards and mirror text?', 'Backwards text reverses the order of the letters. Mirror text also flips each letter left to right where a mirrored look-alike exists.'),
         ('Can I flip emoji?', 'No. Emoji stay as they are, but they move to the reversed position.'),
         ('Is upside down text accessible?', 'Not really. Screen readers read each symbol by name. Use it for fun, not for important information.')]))

# ---------------------------------------------------------------- Size checkers with safe zones
def resizer2(name, rules, fmts, pressed, views, max_bytes=0, label='Choose a picture'):
    return f'''<div class="t-card" data-tool="resize" data-name="{name}" data-keep-format="1" data-rules='{H.escape(json.dumps(rules), quote=True)}' data-views='{H.escape(json.dumps(views), quote=True)}'{f' data-max-bytes="{max_bytes}"' if max_bytes else ''}>
{drop(label, 'Drop it here, paste it or tap to pick. It stays on your device.')}
<div class="rs-wrap">
<div><div class="rs-stage" data-stage></div><div class="t-foot" style="justify-content:center"><button class="t-btn" type="button" data-zones aria-pressed="true">Show safe zones</button><span class="rs-hint">The download has no lines on it.</span></div></div>
<div class="rs-side">
<div class="rs-group"><span class="t-lab">Your picture</span><div class="rs-info" data-info></div><ul class="rs-checks" data-checks></ul></div>
<div class="rs-group"><span class="t-lab">Size</span><div class="rs-opts">{opts(fmts, 'data-fmt', pressed)}</div></div>
{MODES}{FILLS}
<button class="btn" type="button" data-download disabled><svg class="ico" aria-hidden="true"><use href="#i-upload"/></svg>Download JPG</button>
</div>
</div>
</div>'''


def size_rules(minw, minh, ratio, ratio_name, max_bytes=0, max_label=''):
    r = [{'k': 'minw', 'v': minw, 'ok': f'At least {minw:,} pixels wide', 'no': f'Narrower than {minw:,} pixels. It will look soft.'},
         {'k': 'minh', 'v': minh, 'ok': f'At least {minh:,} pixels tall', 'no': f'Shorter than {minh:,} pixels.'},
         {'k': 'ratio', 'v': ratio, 'ok': f'Already {ratio_name}', 'no': f'Not {ratio_name} yet. Pick crop or fit below.'}]
    if max_bytes:
        r.append({'k': 'bytes', 'v': max_bytes, 'ok': f'Under {max_label}', 'no': f'Over {max_label}. The download fixes this.'})
    return r


# YouTube banner: TV shows it all, computers a center strip, phones the safe area in the middle of that strip.
YT_VIEWS = {'banner': [{'label': 'Computers show this strip', 'rect': [0, 0.3531, 1, 0.2938]}, {'label': 'Phones: the safe area', 'rect': [0.1980, 0.3531, 0.6039, 0.2938]}]}
TOOLS.append(dict(
    slug='/tools/youtube-banner-size', key='ytbanner', icon='i-play', group='image',
    name='YouTube banner size', line='2560 × 1440 with the safe area marked.',
    title='YouTube Banner Size 2026: 2560 × 1440 Checker With Safe Area | Capybaroar',
    desc='The YouTube banner size is 2560 × 1440 pixels with a 1546 × 423 safe area. Check your banner, see what TVs, computers and phones show, and resize it for free.',
    tag='Free tool', h1a='YouTube banner size', h1b='checker with the safe area',
    lead='Drop in your channel banner to see exactly what shows on TVs, computers and phones. Then crop or fit it to 2560 × 1440 and save it under 6 MB.',
    tool=resizer2('youtube', size_rules(2048, 1152, 16 / 9, '16:9', 6000000, '6 MB'), [('banner', 'Channel banner 16:9', '2560 × 1440', {'w': 2560, 'h': 1440})], 'banner', YT_VIEWS, 6000000, 'Choose your banner'),
    read='''<h2>YouTube banner size at a glance</h2>
<div class="scroll"><table class="cmp"><thead><tr><th>Rule</th><th>What YouTube wants</th></tr></thead><tbody>
<tr><th>Best size</th><td>2560 × 1440 pixels (16:9)</td></tr>
<tr><th>Smallest size</th><td>2048 × 1152 pixels</td></tr>
<tr><th>Safe area</th><td>About 1546 × 423 pixels in the center (1235 × 338 at the smallest size)</td></tr>
<tr><th>File size</th><td>6 MB or smaller</td></tr>
<tr><th>File types</th><td>JPG or PNG (guides differ on others, so these two are the safe picks)</td></tr>
</tbody></table></div>
<h2>Why the safe area matters</h2>
<p>YouTube shows the same banner differently on every screen:</p>
<ul>
<li><b>TVs</b> show the whole 2560 × 1440 picture.</li>
<li><b>Computers</b> show a wide strip across the middle, about 2560 × 423.</li>
<li><b>Phones and tablets</b> show only the center of that strip, about 1546 × 423.</li>
</ul>
<p>So anything you want everyone to see, like your channel name, upload schedule or logo, has to sit inside the safe area in the middle. The checker draws both boxes on your banner so you can see it before you upload.</p>
<h2>How to use the checker</h2>
<ol>
<li>Drop your banner on the box, paste it, or tap to pick a file. It stays on your device.</li>
<li>Look at the dashed boxes. The wide one is what computers show. The middle one is the safe area phones show.</li>
<li>If your picture isn't 16:9, choose <b>Crop to fill</b> and drag it into place, or <b>Fit whole picture</b> to keep all of it.</li>
<li>Press <b>Download JPG</b>. The file is 2560 × 1440 and under 6 MB, with no lines on it.</li>
</ol>
<h2>Design tips for a channel banner</h2>
<ul>
<li><b>Name, promise and schedule.</b> Most great banners say who you are, what viewers get and when new videos come out, all inside the safe area.</li>
<li><b>Use the edges for mood.</b> The outer parts only show on TVs and computers, so fill them with color or a background photo, not words.</li>
<li><b>Mind the corners.</b> On computers, YouTube puts your profile picture and channel details near the banner, so keep the lower edge simple.</li>
<li><b>Big, bold type.</b> On a phone the safe area is small. Text has to be large to read.</li>
</ul>
<h2>How to upload your banner</h2>
<ol><li>Open YouTube Studio and choose <b>Customization</b>, then <b>Profile</b>.</li><li>Next to <b>Banner image</b>, choose <b>Upload</b> or <b>Change</b>.</li><li>Pick your file, adjust the crop preview and choose <b>Done</b>, then <b>Publish</b>.</li></ol>
<div class="note">Banner done? Capybaroar schedules your YouTube uploads with their title, tags and thumbnail, next to your posts on 11 other networks.</div>''',
    faq=[('What size is a YouTube banner?', '2560 × 1440 pixels in a 16:9 shape, 6 MB or smaller. The smallest YouTube accepts is 2048 × 1152.'),
         ('What is the YouTube banner safe area?', 'About 1546 × 423 pixels in the center of a 2560 × 1440 banner. That is the part phones show, so keep text and logos there.'),
         ('Why does my YouTube banner look cut off?', 'Computers and phones only show the middle of the banner. Put important things inside the safe area the checker marks.'),
         ('What does a YouTube banner look like on TV?', 'TVs show the whole 2560 × 1440 picture, so fill the edges with background, not words.'),
         ('How do I make my banner smaller than 6 MB?', 'Drop it in the checker and download it. The tool saves a JPG and lowers the quality slightly until it fits.'),
         ('Is my banner uploaded anywhere?', 'No. The checker runs in your browser and your file never leaves your device.')]))

# LinkedIn banners
LI_VIEWS = {'personal': [{'label': 'Profile photo (about here)', 'circle': [0.125, 0.98, 0.4], 'style': 'line'}]}
TOOLS.append(dict(
    slug='/tools/linkedin-banner-size', key='libanner', icon='i-image', group='image',
    name='LinkedIn banner size', line='1584 × 396 for profiles, 1128 × 191 for Pages.',
    title='LinkedIn Banner Size 2026: 1584 × 396 Checker and Resizer | Capybaroar',
    desc='The LinkedIn banner size is 1584 × 396 pixels for personal profiles and 1128 × 191 for company Pages. Check your banner, see where your photo covers it and resize it free.',
    tag='Free tool', h1a='LinkedIn banner size', h1b='checker and resizer',
    lead='Drop in your banner to see where your profile photo covers it, then crop or fit it to 1584 × 396 for your profile or 1128 × 191 for a company Page.',
    tool=resizer2('linkedin', size_rules(1584, 396, 4, '4:1'), [('personal', 'Personal profile 4:1', '1584 × 396', {'w': 1584, 'h': 396}), ('company', 'Company Page', '1128 × 191', {'w': 1128, 'h': 191})], 'personal', LI_VIEWS, 0, 'Choose your banner'),
    read='''<h2>LinkedIn banner sizes</h2>
<div class="scroll"><table class="cmp"><thead><tr><th>Banner</th><th>Size in pixels</th><th>Shape</th></tr></thead><tbody>
<tr><th>Personal profile background</th><td>1584 × 396</td><td>4:1</td></tr>
<tr><th>Company Page cover</th><td>1128 × 191 (most often cited)</td><td>About 6:1</td></tr>
</tbody></table></div>
<p>LinkedIn's help pages recommend 1584 × 396 for personal backgrounds. Company Page sizes are listed differently by different guides, so 1128 × 191 is the safest choice there. Use JPG or PNG.</p>
<h2>Your profile photo covers part of the banner</h2>
<p>On a personal profile, your round profile photo sits over the lower-left part of the banner. Anything you put there gets hidden. The checker marks roughly where the photo sits, so you can keep words and logos to the right of it.</p>
<p>On phones, LinkedIn shows the banner smaller and crops a little from the sides. Keep your main message in the center-right area, and don't put text right at the edges.</p>
<h2>How to use the checker</h2>
<ol>
<li>Drop in your banner. It stays on your device.</li>
<li>Pick <b>Personal profile</b> or <b>Company Page</b>.</li>
<li>Check where the profile photo falls, then crop or fit the picture.</li>
<li>Press <b>Download JPG</b>. The download has no lines on it.</li>
</ol>
<h2>What to put on a LinkedIn banner</h2>
<ul>
<li><b>What you do, in a few words.</b> "Helping bakeries grow online" says more than a stock photo.</li>
<li><b>Proof.</b> A logo row of clients, a book cover or an award.</li>
<li><b>A next step.</b> Your website, newsletter or booking link, written large.</li>
<li><b>Your brand colors.</b> A clean color background with one line of text often looks better than a busy photo.</li>
</ul>
<h2>How to change your LinkedIn banner</h2>
<ol><li>Open your profile.</li><li>Click the camera or pencil icon on the banner.</li><li>Upload the file you downloaded here, adjust it and save.</li></ol>
<div class="note">Profile ready? Capybaroar schedules posts to your LinkedIn profile and company Page from one calendar, with bold text and a "see more" preview.</div>''',
    faq=[('What size is a LinkedIn banner?', '1584 × 396 pixels (4:1) for personal profiles. Company Page covers are most often listed as 1128 × 191.'),
         ('Why is my LinkedIn banner cut off?', 'Your profile photo covers the lower left, and phones crop the sides a little. Keep text right of the photo and away from the edges.'),
         ('Where does the profile photo cover the banner?', 'The lower-left part. The checker marks roughly where it sits on a personal profile.'),
         ('What file type should I use?', 'JPG or PNG. This tool saves a high-quality JPG.'),
         ('Can I use the same banner for my company Page?', 'It needs a different shape. Pick Company Page in the checker to crop or fit it to 1128 × 191.'),
         ('Is my banner uploaded anywhere?', 'No. Everything runs in your browser and the file stays on your device.')]))

# Facebook cover
FB_VIEWS = {'*': [{'label': 'Computers show this', 'ratio': 820 / 312}, {'label': 'Phones show this', 'ratio': 640 / 360}]}
TOOLS.append(dict(
    slug='/tools/facebook-cover-photo-size', key='fbcover', icon='i-image', group='image',
    name='Facebook cover photo size', line='See what computers and phones show.',
    title='Facebook Cover Photo Size 2026: Checker for Desktop and Mobile | Capybaroar',
    desc='The Facebook cover photo size is 851 × 315 pixels, shown at 820 × 312 on computers and 640 × 360 on phones. Check your cover and resize it to look right on both. Free.',
    tag='Free tool', h1a='Facebook cover photo size', h1b='for computers and phones',
    lead='Drop in your cover photo to see what computers and phones each show. Then crop or fit it so it looks right everywhere, and download it.',
    tool=resizer2('facebook-cover', [{'k': 'minw', 'v': 820, 'ok': 'At least 820 pixels wide', 'no': 'Narrower than 820 pixels, the width Facebook shows on computers'}], [('classic', 'Classic 851 × 315', 'The usual cover size', {'w': 851, 'h': 315}), ('everywhere', 'Phone friendly', '1640 × 924, fits phones in full', {'w': 1640, 'h': 924})], 'classic', FB_VIEWS, 0, 'Choose your cover photo'),
    read='''<h2>Facebook cover photo sizes</h2>
<div class="scroll"><table class="cmp"><thead><tr><th>Where</th><th>Shown at</th></tr></thead><tbody>
<tr><th>Upload size</th><td>851 × 315 pixels is the classic size</td></tr>
<tr><th>On computers</th><td>About 820 × 312, a wide strip</td></tr>
<tr><th>On phones</th><td>About 640 × 360, a taller shape</td></tr>
</tbody></table></div>
<p>Computers and phones show the cover in different shapes. Computers show a wide strip. Phones show a taller box and cut off the sides. A picture that looks perfect on one can lose its edges on the other.</p>
<h2>Two ways to get it right</h2>
<ul>
<li><b>Classic 851 × 315.</b> Looks right on computers. On phones, the left and right sides are cut, so keep text and faces in the middle.</li>
<li><b>Phone friendly 1640 × 924.</b> Shows in full on phones. On computers, a band from the top and bottom is cut, so keep important things in the middle band.</li>
</ul>
<p>Either way, the safe place for words and logos is the center. The checker draws what each screen shows, so you can see the overlap for yourself.</p>
<h2>How to use the checker</h2>
<ol>
<li>Drop in your cover photo. It stays on your device.</li>
<li>Pick <b>Classic</b> or <b>Phone friendly</b>.</li>
<li>Check the dashed boxes, then crop or fit your picture.</li>
<li>Press <b>Download JPG</b>. The download has no lines on it.</li>
</ol>
<h2>Watch the profile picture</h2>
<p>Your profile picture overlaps the bottom-left of the cover on computers, and sits under the cover on phones. Keep the lower-left corner free of text.</p>
<h2>Tips for a sharp cover</h2>
<ul>
<li>Upload a picture at least 820 pixels wide. Smaller pictures are stretched and look blurry.</li>
<li>For covers with a logo or text, PNG can look sharper than JPG. For photos, JPG is fine.</li>
<li>Keep the message short. A cover is seen in a second, often on a small phone.</li>
<li>Update it for launches, seasons and events. It's the biggest picture on your Page.</li>
</ul>
<div class="note">Running a Facebook Page? Capybaroar schedules your Page posts and Reels and brings comments and Messenger messages into one inbox.</div>''',
    faq=[('What size is a Facebook cover photo?', 'Upload at 851 × 315 pixels. Facebook shows about 820 × 312 on computers and about 640 × 360 on phones.'),
         ('Why is my Facebook cover photo cut off on mobile?', 'Phones show a taller shape and cut off the sides. Keep text and faces in the center, or use the phone friendly size.'),
         ('What is the best size for both desktop and mobile?', 'Many people use 1640 × 924, which shows in full on phones and loses a band from the top and bottom on computers. Keep important things in the middle.'),
         ('Does my profile picture cover the cover photo?', 'On computers, it overlaps the lower-left corner. Keep that area free of text.'),
         ('JPG or PNG for a Facebook cover?', 'JPG for photos. PNG can look sharper for covers with a logo or text.'),
         ('Is my cover photo uploaded anywhere?', 'No. The checker runs in your browser and your picture stays on your device.')]))

# Instagram Story
STORY_VIEWS = {'*': [{'label': 'Name and progress bar cover this', 'rect': [0, 0, 1, 0.13], 'style': 'shade'}, {'label': 'Reply box and buttons cover this', 'rect': [0, 0.823, 1, 0.177], 'style': 'shade'}]}
TOOLS.append(dict(
    slug='/tools/instagram-story-size', key='igstory', icon='i-image', group='image',
    name='Instagram Story size', line='1080 × 1920 with Instagram\'s covered areas marked.',
    title='Instagram Story Size 2026: 1080 × 1920 Checker With Safe Zones | Capybaroar',
    desc='The Instagram Story size is 1080 × 1920 pixels (9:16). Check your Story, see which parts Instagram covers with buttons, and resize any picture to fit. Free.',
    tag='Free tool', h1a='Instagram Story size', h1b='checker with safe zones',
    lead='Drop in a picture to see how it fits a Story and where Instagram\'s name, buttons and reply box cover it. Then crop or fit it to 1080 × 1920.',
    tool=resizer2('instagram', size_rules(1080, 1920, 9 / 16, '9:16'), [('story', 'Story and Reel 9:16', '1080 × 1920', {'w': 1080, 'h': 1920})], 'story', STORY_VIEWS, 0, 'Choose a picture'),
    read='''<h2>Instagram Story size</h2>
<div class="scroll"><table class="cmp"><thead><tr><th>Rule</th><th>Size</th></tr></thead><tbody>
<tr><th>Story size</th><td>1080 × 1920 pixels</td></tr>
<tr><th>Shape</th><td>9:16, the full phone screen</td></tr>
<tr><th>Top area to keep clear</th><td>About the top 250 pixels</td></tr>
<tr><th>Bottom area to keep clear</th><td>About the bottom 340 pixels</td></tr>
</tbody></table></div>
<p>The same size works for Reels and for Facebook Stories.</p>
<h2>What Instagram covers</h2>
<p>A Story fills the whole screen, but Instagram draws its own things on top: your name, profile picture and the progress bar at the top, and the reply box, like and share buttons at the bottom. Text or faces in those areas get covered. The checker shades both areas so you can keep everything important in the middle.</p>
<h2>How to use the checker</h2>
<ol>
<li>Drop in a picture. It stays on your device.</li>
<li>Look at the shaded areas at the top and bottom.</li>
<li>Choose <b>Crop to fill</b> and drag to frame it, or <b>Fit whole picture</b> to keep all of it. For a wide photo, try <b>Blurred copy</b>, which fills the space with a soft version of the same picture.</li>
<li>Press <b>Download JPG</b>.</li>
</ol>
<h2>Putting a wide photo in a Story</h2>
<p>A normal phone photo is 3:4 or 16:9, not 9:16. You can crop it, which loses the sides, or fit it with space above and below. The blurred fill looks the most natural and leaves room above and below for text or stickers.</p>
<h2>Tips for Stories people watch</h2>
<ul>
<li><b>Say it in the first second.</b> People tap through Stories fast.</li>
<li><b>Large text, high contrast.</b> White text with a dark shadow, or dark text on a light block.</li>
<li><b>Leave room for stickers.</b> Polls, questions and links work best in the middle third.</li>
<li><b>Add a link sticker</b> to send people to your site or link in bio page.</li>
</ul>
<div class="note">Capybaroar schedules Instagram Stories with one picture or video and posts them at the time you pick, no reminder to tap.</div>''',
    faq=[('What size is an Instagram Story?', '1080 × 1920 pixels in a 9:16 shape, the full phone screen.'),
         ('What are the Instagram Story safe zones?', 'Keep text and faces out of about the top 250 pixels and the bottom 340 pixels, where Instagram puts your name, the reply box and buttons.'),
         ('How do I fit a whole photo in a Story?', 'Choose Fit whole picture in the checker. Blurred copy fills the space above and below with a soft version of your photo.'),
         ('Is the Reels size the same?', 'Yes, Reels are 1080 × 1920 too. On your profile grid they show cropped, so keep the subject centered.'),
         ('Can I schedule Instagram Stories?', 'Yes. Capybaroar schedules Stories with one picture or video and publishes them for you.'),
         ('Is my picture uploaded anywhere?', 'No. The checker runs in your browser and your picture stays on your device.')]))

# X header
X_VIEWS = {'*': [{'label': 'May be cut on phones', 'rect': [0, 0, 1, 0.12], 'style': 'shade'}, {'label': 'May be cut on phones', 'rect': [0, 0.88, 1, 0.12], 'style': 'shade'}, {'label': 'Profile photo (about here)', 'circle': [0.14, 1.0, 0.33]}]}
TOOLS.append(dict(
    slug='/tools/x-header-size', key='xheader', icon='i-image', group='image',
    name='X header size', line='1500 × 500 with the profile photo marked.',
    title='X (Twitter) Header Size 2026: 1500 × 500 Checker and Resizer | Capybaroar',
    desc='The X (Twitter) header size is 1500 × 500 pixels (3:1). Check your header, see where your profile photo and phone crops fall, and resize it for free.',
    tag='Free tool', h1a='X header size', h1b='checker and resizer for Twitter banners',
    lead='Drop in your header to see where your profile photo covers it and what phones may crop. Then crop or fit it to 1500 × 500.',
    tool=resizer2('x', size_rules(1500, 500, 3, '3:1', 5000000, '5 MB'), [('header', 'Header 3:1', '1500 × 500', {'w': 1500, 'h': 500})], 'header', X_VIEWS, 5000000, 'Choose your header'),
    read='''<h2>X header size at a glance</h2>
<div class="scroll"><table class="cmp"><thead><tr><th>Rule</th><th>Size</th></tr></thead><tbody>
<tr><th>Header size</th><td>1500 × 500 pixels</td></tr>
<tr><th>Shape</th><td>3:1</td></tr>
<tr><th>File size</th><td>Keep it under 5 MB (the limit most guides give)</td></tr>
<tr><th>File types</th><td>JPG, PNG or GIF</td></tr>
<tr><th>Profile photo</th><td>400 × 400 pixels, shown as a circle</td></tr>
</tbody></table></div>
<h2>What covers your header</h2>
<ul>
<li><b>Your profile photo</b> sits over the lower-left part of the header on computers and phones.</li>
<li><b>Phones</b> can trim a strip from the top and bottom of the header.</li>
</ul>
<p>The checker marks both, so you can keep words and logos in the middle and to the right of your photo.</p>
<h2>How to use the checker</h2>
<ol>
<li>Drop in your header. It stays on your device.</li>
<li>Check where the profile photo and the phone crop fall.</li>
<li>Crop or fit your picture, then press <b>Download JPG</b>. The download has no lines on it and stays under 5 MB.</li>
</ol>
<h2>What to put on your X header</h2>
<ul>
<li><b>One line about you</b>, like your job, your show or your newsletter.</li>
<li><b>Proof</b>, such as a book cover, an app screenshot or client logos.</li>
<li><b>A pinned-post nudge</b>: "New episode every Tuesday, see pinned post."</li>
<li><b>Your colors.</b> A simple header looks cleaner next to a busy timeline.</li>
</ul>
<h2>How to change your header</h2>
<ol><li>On your profile, choose <b>Edit profile</b>.</li><li>Tap the header image and upload the file you downloaded here.</li><li>Adjust it if asked, then save.</li></ol>
<div class="note">Capybaroar schedules your X posts with pictures, a video or a GIF, and counts characters the way X does.</div>''',
    faq=[('What size is an X (Twitter) header?', '1500 × 500 pixels in a 3:1 shape. Keep the file under 5 MB.'),
         ('Why is my Twitter header cut off?', 'Phones can trim the top and bottom, and your profile photo covers the lower left. Keep important things in the middle.'),
         ('What size is the X profile photo?', '400 × 400 pixels. X shows it as a circle.'),
         ('Can my X header be a GIF?', 'X accepts GIF files for headers, but the header shows as a still picture.'),
         ('Is my header uploaded anywhere?', 'No. The checker runs in your browser and your file stays on your device.')]))

# ---------------------------------------------------------------- Word counter
WC_STATS = [('words', 'Words', True), ('chars', 'Characters', False), ('nospace', 'No spaces', False), ('sentences', 'Sentences', False), ('paragraphs', 'Paragraphs', False),
            ('read', 'Reading time', True), ('speak', 'Speaking time', False), ('avg', 'Average word length', False), ('longest', 'Longest sentence', False)]
wc_stats = ''.join(f'<div{" class=big" if big else ""}><small>{l}</small><b data-stat="{k}">0</b></div>' for k, l, big in WC_STATS)
TOOLS.append(dict(
    slug='/tools/word-counter', key='words', icon='i-text', group='write',
    name='Word counter', line='Words, reading time and your most used words.',
    title='Word Counter: Count Words, Characters and Reading Time | Capybaroar',
    desc='Free word counter. Count words, characters, sentences and paragraphs, see reading and speaking time, and find your most used words. Nothing leaves your browser.',
    tag='Free tool', h1a='Word counter', h1b='words, reading time and more',
    lead='Paste or type your text to count words, characters, sentences and paragraphs, see how long it takes to read or say out loud, and spot words you use too often.',
    tool=f'''<div class="t-card" data-tool="words">
<label class="t-lab" for="wc-in">Your text</label>
<textarea id="wc-in" data-input rows="10" placeholder="Paste or write your text here"></textarea>
<div class="t-foot" style="margin-top:8px"><span class="rs-hint">Counted in your browser. Nothing is sent anywhere.</span><span class="t-bar" style="margin:0"><button class="t-btn" type="button" data-copy><svg class="ico" aria-hidden="true"><use href="#i-copy"/></svg>Copy</button><button class="t-btn" type="button" data-clear>Clear</button></span></div>
<div class="wc-stats" style="grid-template-columns:repeat(auto-fill,minmax(150px,1fr))">{wc_stats}</div>
<h3 style="margin:22px 0 4px;font-size:16px">Most used words</h3>
<ul class="wc-top" data-top></ul>
</div>''',
    read='''<h2>How the word counter counts</h2>
<ul>
<li><b>Words</b> are counted the way your device splits text into words, so it works for English and most other languages, and numbers count as words.</li>
<li><b>Characters</b> count what you see. An emoji or an accented letter counts as one.</li>
<li><b>Sentences</b> end at a period, question mark or exclamation mark.</li>
<li><b>Paragraphs</b> are blocks of text separated by an empty line.</li>
</ul>
<h2>Reading and speaking time</h2>
<p>Reading time uses 238 words per minute. That is the average silent reading speed for adults reading non-fiction, from a large 2019 review of 190 reading studies. Speaking time uses 140 words per minute, a comfortable pace for a talk, a podcast or a video voiceover.</p>
<p>Speaking time is handy for video scripts: a 60-second video holds about 140 words, and a 30-second Reel or TikTok about 70.</p>
<h2>Most used words</h2>
<p>The list under the counter shows the 10 words you use most, leaving out short common words like "the" and "and". Each word shows how many times it appears and what share of all your words it is. Use it to:</p>
<ul>
<li>Spot words you lean on too much, like "really" or "very".</li>
<li>Check that a blog post uses its main topic often enough, without stuffing it in.</li>
<li>Find a theme for hashtags or a title.</li>
</ul>
<h2>How long should it be?</h2>
<div class="scroll"><table class="cmp"><thead><tr><th>Writing</th><th>Common length</th></tr></thead><tbody>
<tr><th>Tweet or X post</th><td>Up to 280 characters, often 20 to 40 words</td></tr>
<tr><th>Instagram caption</th><td>Up to 2,200 characters</td></tr>
<tr><th>LinkedIn post</th><td>Up to 3,000 characters</td></tr>
<tr><th>Short video script</th><td>About 70 words for 30 seconds, 140 for a minute</td></tr>
<tr><th>Email newsletter</th><td>Often 200 to 500 words</td></tr>
<tr><th>Blog post</th><td>Long enough to fully answer the question, often 800 to 2,000 words</td></tr>
</tbody></table></div>
<p>For posts, the network's character limit matters more than words. Our <a href="/tools/character-counter">character counter</a> checks your text against the limit on 14 networks at once.</p>
<h2>Is my text private?</h2>
<p>Yes. Counting happens in your browser. Your text is kept only in this browser, so it's still there if you reload, and nothing is sent to Capybaroar or anyone else.</p>
<div class="note">Turning a blog post into social posts? Paste it into Capybaroar's agent and get a week of drafts for every network, ready to check and schedule.</div>''',
    faq=[('How many words is a 5-minute speech?', 'About 700 words at 140 words per minute. Paste your script here and check the speaking time.'),
         ('How long does it take to read 1,000 words?', 'About 4 minutes at the average adult reading speed of 238 words per minute.'),
         ('Does the word counter count numbers?', 'Yes. Numbers count as words, like most word processors count them.'),
         ('Do emoji count as characters?', 'Yes. Each emoji you see counts as one character here. Some networks count emoji differently, so check posts with the character counter.'),
         ('Is my text saved or sent anywhere?', 'It stays in your own browser so it survives a reload. Nothing is sent anywhere.'),
         ('How do I count characters for social media?', 'Use our character counter, which checks your text against the limits on X, Instagram, LinkedIn, TikTok and more.')]))

# ---------------------------------------------------------------- TikTok money
TOOLS.append(dict(
    slug='/tools/tiktok-money-calculator', key='ttmoney', icon='i-chart', group='plan',
    name='TikTok money calculator', line='Estimate Creator Rewards earnings from views.',
    title='TikTok Money Calculator: Estimate Creator Rewards Earnings | Capybaroar',
    desc='Estimate what TikTok pays through the Creator Rewards Program from your qualified views and RPM. Learn the requirements and other ways TikTok creators earn.',
    tag='Free tool', h1a='TikTok money calculator', h1b='estimate Creator Rewards earnings',
    lead='Enter your monthly qualified views and an RPM range to estimate what TikTok\'s Creator Rewards Program pays. Then see what it takes to qualify.',
    tool='''<div class="t-card" data-tool="ytmoney" data-def='{"tiktok":[0.4,1]}'>
<div class="ym-in">
<div><label class="t-lab" for="tt-views">Qualified views per month</label><div class="t-range"><input id="tt-views" type="range" min="0" max="100" step="0.5" data-views aria-label="Qualified views per month"></div></div>
<div><label class="t-lab" for="tt-vo">Exact views</label><input id="tt-vo" type="text" inputmode="numeric" data-views-out spellcheck="false"></div>
<div class="ym-rpm"><span class="t-lab">RPM range (US$ per 1,000 views)</span><div style="display:flex;gap:6px;align-items:center"><input type="number" min="0" step="0.01" value="0.4" data-lo aria-label="Low RPM"><span>to</span><input type="number" min="0" step="0.01" value="1" data-hi aria-label="High RPM"></div></div>
</div>
<div class="ym-res"><div><small>Per day</small><b data-r="day">$0</b></div><div><small>Per month</small><b data-r="month">$0</b></div><div><small>Per year</small><b data-r="year">$0</b></div></div>
<p class="rs-hint" style="margin-top:10px">Estimates only. The RPM range is what creators commonly report; TikTok doesn't publish its rates.</p>
</div>''',
    read='''<h2>How TikTok pays creators</h2>
<p>TikTok pays for views through the <b>Creator Rewards Program</b>, which replaced the old Creator Fund at the end of 2023. It pays for <b>qualified views</b> on videos <b>longer than one minute</b>. TikTok decides which views qualify; repeat views, views from paid promotion and views it judges fake are left out.</p>
<p>TikTok doesn't publish a fixed rate. Creators commonly report earning roughly <b>$0.40 to $1.00 for every 1,000 qualified views</b>, and some report more. That is why this calculator shows a range.</p>
<h2>Who can join the Creator Rewards Program?</h2>
<ul>
<li>At least <b>10,000 followers</b>.</li>
<li>At least <b>100,000 video views in the last 30 days</b>.</li>
<li>Age <b>18 or older</b>, with a personal account (not a Business account) in good standing.</li>
<li>Living in a country where the program is offered.</li>
</ul>
<p>TikTok updates these rules from time to time. The Creator Rewards page in TikTok Studio shows whether your account qualifies.</p>
<h2>How to use the calculator</h2>
<ol>
<li>Drag the slider or type your qualified views per month. TikTok Studio shows qualified views once you're in the program.</li>
<li>Change the RPM range to match your own results.</li>
<li>Read your estimated earnings per day, month and year.</li>
</ol>
<h2>What changes your RPM</h2>
<ul>
<li><b>Where viewers live.</b> Views from countries where ads cost more tend to pay more.</li>
<li><b>Watch time and engagement.</b> TikTok says it rewards videos people watch and interact with.</li>
<li><b>Original content.</b> Reposts, duets with little added and copied clips don't qualify.</li>
<li><b>Search value.</b> TikTok has said videos that are useful in search can earn more.</li>
</ul>
<h2>Other ways TikTok creators earn</h2>
<ul>
<li><b>Brand deals</b>, usually the biggest earner for mid-size creators.</li>
<li><b>TikTok Shop affiliate</b> commissions on products you show.</li>
<li><b>LIVE gifts</b> and subscriptions.</li>
<li>Sending followers to your own products, courses or newsletter through your link in bio.</li>
</ul>
<p>This calculator only estimates Creator Rewards, so total earnings with deals and sales can be much higher.</p>
<div class="note">Posting every day is what grows a TikTok account. Capybaroar schedules TikTok videos that post straight to your profile, so you can batch a week in one sitting.</div>''',
    faq=[('How much does TikTok pay per 1,000 views?', 'Creators commonly report about $0.40 to $1.00 per 1,000 qualified views in the Creator Rewards Program. TikTok doesn\'t publish exact rates.'),
         ('How many followers do you need to get paid on TikTok?', 'The Creator Rewards Program needs 10,000 followers and 100,000 views in the last 30 days, and you must be 18 or older.'),
         ('Do short TikToks make money?', 'Not through Creator Rewards. It only pays for videos longer than one minute.'),
         ('What is a qualified view?', 'A view TikTok counts for payment. It leaves out things like repeat views, promoted views and views it judges fake.'),
         ('Is the TikTok Creator Fund still running?', 'No. It closed at the end of 2023 and was replaced by the Creator Rewards Program.'),
         ('How accurate is this calculator?', 'It is an estimate based on the RPM you enter. Use the RPM in your own TikTok Studio for the closest number.')]))

# ---------------------------------------------------------------- Engagement rate
ER_FIELDS = [('likes', 'Likes'), ('comments', 'Comments'), ('shares', 'Shares'), ('saves', 'Saves'), ('followers', 'Followers'), ('reach', 'Reach (optional)'), ('views', 'Views (optional)'), ('posts', 'Number of posts')]
er_in = ''.join(f'<div><label class="t-lab" for="er-{k}">{l}</label><input id="er-{k}" type="text" inputmode="numeric" data-f="{k}" placeholder="{"1" if k == "posts" else "0"}" autocomplete="off"></div>' for k, l in ER_FIELDS)
TOOLS.append(dict(
    slug='/tools/engagement-rate-calculator', key='engagement', icon='i-chart', group='plan',
    name='Engagement rate calculator', line='By followers, reach or views, for any network.',
    title='Engagement Rate Calculator for Instagram, TikTok and More | Capybaroar',
    desc='Calculate engagement rate by followers, reach or views for Instagram, TikTok, LinkedIn and any network. See the formulas and how to read your results. Free.',
    tag='Free tool', h1a='Engagement rate calculator', h1b='for Instagram, TikTok and more',
    lead='Enter likes, comments, shares and saves with your followers, reach or views. Get your engagement rate three ways and learn which one to use.',
    tool=f'''<div class="t-card" data-tool="engagement">
<div class="er-in">{er_in}</div>
<div class="er-res">
<div><small>Total interactions</small><b data-r="total">0</b></div>
<div class="main"><small>By followers</small><b data-r="byFollowers">–</b></div>
<div><small>By reach</small><b data-r="byReach">–</b></div>
<div><small>By views</small><b data-r="byViews">–</b></div>
</div>
<p class="rs-hint" style="margin-top:10px">For several posts, add up their numbers and enter how many posts. The rates show the average per post.</p>
</div>''',
    read='''<h2>What is engagement rate?</h2>
<p>Engagement rate shows how many people interact with your posts compared with how many could have. It is the fairest way to compare posts and accounts of different sizes: 500 likes is great for an account with 5,000 followers, and weak for one with 500,000.</p>
<h2>The three formulas</h2>
<div class="scroll"><table class="cmp"><thead><tr><th>Rate</th><th>Formula</th><th>Best for</th></tr></thead><tbody>
<tr><th>By followers</th><td>interactions ÷ followers × 100</td><td>Comparing accounts, since follower counts are public</td></tr>
<tr><th>By reach</th><td>interactions ÷ reach × 100</td><td>Judging your own posts, since it counts only people who saw them</td></tr>
<tr><th>By views</th><td>interactions ÷ views × 100</td><td>Video: TikTok, Reels, YouTube Shorts</td></tr>
</tbody></table></div>
<p><b>Interactions</b> are likes + comments + shares + saves. Leave a box at 0 if the network doesn't show it.</p>
<h2>How to use the calculator</h2>
<ol>
<li>Enter the likes, comments, shares and saves for one post, or the totals for several posts.</li>
<li>Enter your follower count. Add reach or views if you have them.</li>
<li>For several posts, enter how many. The calculator gives the average rate per post.</li>
</ol>
<h2>Which rate should I use?</h2>
<ul>
<li><b>Instagram, Facebook, LinkedIn:</b> use rate by reach for your own posts (reach is in your insights), and rate by followers when comparing with other accounts.</li>
<li><b>TikTok, Reels, Shorts:</b> use rate by views. Videos often reach far more people than follow you, which makes the follower rate jump around.</li>
<li><b>X:</b> use rate by views (X shows views on each post).</li>
</ul>
<h2>What is a good engagement rate?</h2>
<p>It depends on the network, the industry and the size of the account. Smaller accounts usually have higher rates than big ones, and rates by reach or views are lower than rates by followers when posts travel far. The most useful comparison is with yourself: work out the rate for your last 10 posts, then aim to beat that average.</p>
<h2>Ways to raise it</h2>
<ul>
<li><b>Ask a clear question</b> in the caption that's easy to answer in a few words.</li>
<li><b>Post when your followers are online.</b> Our <a href="/tools/best-time-to-post">best time to post</a> planner helps.</li>
<li><b>Make saveable posts</b>: tips, checklists, recipes and how-tos.</li>
<li><b>Reply to comments quickly.</b> Conversations bring people back.</li>
<li><b>Share posts to Stories</b> to reach followers who missed them.</li>
</ul>
<div class="note">Capybaroar works out engagement for every post and channel for you, and shows your best posts, formats and times side by side.</div>''',
    faq=[('How do I calculate engagement rate?', 'Add likes, comments, shares and saves, divide by followers (or reach, or views) and multiply by 100.'),
         ('Should I use followers or reach?', 'Use reach for your own posts and followers to compare with other accounts, since follower counts are public.'),
         ('How do I calculate TikTok engagement rate?', 'Use rate by views: interactions divided by views, times 100. Enter the video\'s likes, comments, shares and saves with its views.'),
         ('Do saves and shares count?', 'Yes. They are strong signals, so this calculator includes them. Leave them at 0 if your network doesn\'t show them.'),
         ('Can I calculate the rate for several posts?', 'Yes. Add up their numbers, enter how many posts, and the calculator gives the average per post.'),
         ('What is a good engagement rate?', 'It varies by network, industry and account size. Compare with your own last 10 posts and aim to beat your average.')]))
