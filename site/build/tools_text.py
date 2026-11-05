"""Content for the text tools: font generator, fancy text, bold, small, glitch, strikethrough, LinkedIn formatter and
invisible characters. Each entry is one page: the tool, a long read and the FAQ."""


def styles_tool(keys, demo, frames=False, label='Type your text'):
    return f'''<div class="t-card" data-tool="styles" data-styles="{','.join(keys)}" data-demo="{demo}"{' data-frames="1"' if frames else ''}>
<label class="t-lab" for="t-in">{label}</label>
<textarea id="t-in" data-input rows="2" placeholder="{demo}"></textarea>
<ul class="t-list" data-list></ul>
</div>'''


WHERE_TABLE = '''<div class="scroll"><table class="cmp"><thead><tr><th>Where</th><th>Works?</th><th>Good to know</th></tr></thead><tbody>
<tr><th>Instagram bio and name</th><td>Yes</td><td>Your @username only takes letters, numbers, periods and underscores. The display name and bio take styled text.</td></tr>
<tr><th>Instagram captions and comments</th><td>Yes</td><td>Styled words are not found by Instagram search, so keep hashtags plain.</td></tr>
<tr><th>TikTok bio and captions</th><td>Yes</td><td>Short styled lines work best. Long styled captions are harder to read on a small screen.</td></tr>
<tr><th>X (Twitter)</th><td>Yes</td><td>Most styled letters count as 2 characters toward the 280 limit.</td></tr>
<tr><th>LinkedIn posts and headline</th><td>Yes</td><td>Use it for a word or a short heading. Recruiters search plain words, so keep job titles plain.</td></tr>
<tr><th>Facebook, Threads, Discord</th><td>Yes</td><td>Discord names and server channels take most styles too.</td></tr>
</tbody></table></div>'''

A11Y = '''<h2>Use styled text with care</h2>
<p>These letters are symbols that look like letters. That has a few side effects worth knowing before you style a whole post.</p>
<ul>
<li><b>Screen readers.</b> Many screen readers read each styled letter as a math symbol, or skip it. A sentence in a fancy font can sound like noise to someone who uses one. Style a few words, and keep the rest of the post plain.</li>
<li><b>Search.</b> Search boxes on Instagram, TikTok, LinkedIn and Google look for plain letters. A styled word is not matched by the plain word, so never style your name, your brand or a hashtag you want people to find.</li>
<li><b>Older phones.</b> Most phones made in the last few years show every style here. Very old devices can show empty boxes for the rarer ones.</li>
</ul>'''

TOOLS = []

# ---------------------------------------------------------------- Font generator
TOOLS.append(dict(
    slug='/tools/font-generator', key='font', icon='i-text', group='text',
    name='Font generator', line='Copy and paste fonts for Instagram, TikTok and more.',
    title='Font Generator: Copy and Paste Fonts for Instagram (Free) | Capybaroar',
    desc='Free font generator for Instagram, TikTok, X and Discord. Type once and copy bold, cursive, gothic, bubble and 20 more fonts that paste anywhere.',
    tag='Free tool', h1a='Font generator', h1b='for Instagram and every app',
    lead='Type your text once and copy it in more than 20 fonts. Bold, cursive, gothic, bubble and more, ready to paste into your bio, captions and comments.',
    tool=styles_tool(['bold', 'bold-sans', 'italic', 'bold-italic', 'script', 'bold-script', 'fraktur', 'bold-fraktur', 'double', 'sans', 'italic-sans', 'bold-italic-sans', 'mono', 'wide', 'small-caps', 'superscript', 'circled', 'circled-dark', 'squared', 'squared-dark', 'upside', 'strike', 'underline'], 'Capybaroar'),
    read=f'''<h2>How the font generator works</h2>
<p>Apps like Instagram and TikTok don't let you pick a font. Every bio and caption shows in the app's own typeface. So how do people get cursive names and bold captions? They use special characters.</p>
<p>The Unicode standard, which every phone and computer uses to show text, includes thousands of symbols. Some of them were made for math and look like letters in a different style: bold, italic, script, gothic and more. This tool swaps each letter you type for its look-alike symbol. Because the result is still text, you can copy it and paste it almost anywhere.</p>
<h2>How to use it</h2>
<ol>
<li>Type or paste your text in the box at the top.</li>
<li>Scroll the list to see your text in every style.</li>
<li>Press <b>Copy</b> next to the one you like.</li>
<li>Paste it into Instagram, TikTok, X, LinkedIn, Discord or any app that takes text.</li>
</ol>
<p>Nothing you type is sent anywhere. The tool runs in your browser, and it remembers nothing.</p>
<h2>Which fonts are in the list</h2>
<p>You get the styles people use most:</p>
<ul>
<li><b>Bold and bold sans</b> for headings and words you want to stand out.</li>
<li><b>Italic and bold italic</b> for a quote or a softer accent.</li>
<li><b>Script and bold script</b>, the cursive look people love for names and bios.</li>
<li><b>Gothic</b>, also called old English or fraktur, popular for tattoos, bands and gaming names.</li>
<li><b>Outline</b> (double-struck) letters with a hollow look.</li>
<li><b>Typewriter</b> for a plain, techy feel, and <b>Wide</b> for spaced-out letters.</li>
<li><b>Small caps</b> and <b>Tiny</b> letters for a quiet, neat look.</li>
<li><b>Bubbles and squares</b> in light and dark, plus <b>upside down</b> text.</li>
<li><b>Strikethrough and underline</b>, made with lines added to each letter.</li>
</ul>
<p>Some styles only cover A to Z. Numbers and punctuation stay as they are in those styles, which is normal.</p>
<h2>Where the fonts work</h2>
{WHERE_TABLE}
<h2>Ideas for your bio and captions</h2>
<p>Styled text works best in small doses. A few ideas that look good and stay easy to read:</p>
<ul>
<li>Put your name in script or bold script, and keep the rest of your bio plain.</li>
<li>Use bold sans for a short heading at the top of a long caption.</li>
<li>Use small caps for a tagline under your name.</li>
<li>Use gothic or outline letters for a gaming tag or a Discord name.</li>
</ul>
<div class="note">Planning posts for the week? Write your captions in Capybaroar, paste in your styled headings, and schedule them to 12 networks from one calendar.</div>
{A11Y}
<h2>Why a style looks different on another phone</h2>
<p>Each phone draws these symbols with its own font. The letters keep their style, bold stays bold and cursive stays cursive, but the exact shapes change a little between an iPhone, an Android phone and a computer. That's expected, and your text still reads the same everywhere.</p>''',
    faq=[('Is this font generator free?', 'Yes. It is free, needs no account and works on phones and computers.'),
         ('How do I change the font in my Instagram bio?', 'Type your bio in the box, copy the style you like and paste it into the Bio field when you edit your Instagram profile. Your @username can only use plain letters, numbers, periods and underscores, but your display name and bio take any style here.'),
         ('Are these real fonts?', 'They are Unicode characters that look like letters in another style. Because they are text, they paste anywhere, which a real font file could not do in apps like Instagram.'),
         ('Why do some letters not change?', 'A few styles only exist for A to Z, so numbers and punctuation stay plain. That is how those character sets were made.'),
         ('Can I use these fonts on TikTok and X?', 'Yes. They work in TikTok bios and captions and in X posts and names. On X, most styled letters count as 2 characters toward the 280 limit.'),
         ('Will styled text hurt my reach?', 'Styled words are not matched by search, so never style hashtags, your name or your brand. Many screen readers also read styled letters badly, so keep most of each post plain.'),
         ('Why do I see boxes instead of letters?', 'An older phone or app may not have every symbol. Most phones made in the last few years show all of them.'),
         ('Is my text saved or sent anywhere?', 'No. The tool runs in your browser. Nothing you type leaves your device.')]))

# ---------------------------------------------------------------- Fancy text
TOOLS.append(dict(
    slug='/tools/fancy-text-generator', key='fancy', icon='i-spark', group='text',
    name='Fancy text generator', line='Framed, bubble and decorated text to copy and paste.',
    title='Fancy Text Generator: Copy and Paste Cool Text (Free) | Capybaroar',
    desc='Make fancy text with frames, bubbles, stars and cool letters. Copy and paste it into Instagram, TikTok, Discord, games and more. Free, no account.',
    tag='Free tool', h1a='Fancy text generator', h1b='with frames and cool letters',
    lead='Turn plain words into fancy text with decorated frames, bubbles, squares and stylish letters. Copy any line and paste it into your profile, posts or game name.',
    tool=styles_tool(['script', 'bold-script', 'fraktur', 'double', 'circled', 'circled-dark', 'squared', 'squared-dark', 'small-caps', 'superscript', 'wide', 'mono', 'upside', 'slash', 'cross', 'underline-double', 'overline'], 'Fancy text', frames=True),
    read=f'''<h2>What makes text "fancy"</h2>
<p>Fancy text is ordinary words dressed up with special characters. Some characters replace each letter with a styled version, like cursive or gothic letters. Others add decorations around your words, like stars, brackets or Japanese-style frames. The result is still plain text, so it copies and pastes into almost any app.</p>
<p>This generator gives you both. The top of the list shows your words in styled letters. The bottom shows them inside 12 decorated frames, each one paired with a letter style that suits it.</p>
<h2>How to make fancy text</h2>
<ol>
<li>Type a word, a name or a short line in the box.</li>
<li>Look through the styles and frames below it.</li>
<li>Press <b>Copy</b> on the one you want.</li>
<li>Paste it into your bio, a caption, a comment, a Discord name or a game.</li>
</ol>
<h2>Popular ways to use fancy text</h2>
<h3>Profile names and bios</h3>
<p>A framed name like <span class="ex">꧁𝓒𝓪𝓹𝔂𝓫𝓪𝓻𝓸𝓪𝓻꧂</span> makes a profile easy to spot. Keep the frame short so the name still fits on one line on a phone.</p>
<h3>Gaming names and Discord</h3>
<p>Many games and Discord servers let you use fancy characters in your display name. Gothic letters, squares and bubbles are common choices. Some games block certain symbols, so try your name before you settle on it.</p>
<h3>Headings inside long captions</h3>
<p>A decorated heading like ★ 𝔹𝕒𝕜𝕖𝕣𝕪 𝕦𝕡𝕕𝕒𝕥𝕖 ★ breaks a long caption into parts that are easy to scan.</p>
<h2>The frames, explained</h2>
<ul>
<li><b>꧁ ꧂</b> are Javanese section marks. They make one of the most popular name frames online.</li>
<li><b>『 』 and 【 】</b> are Japanese and Chinese brackets that look neat around short words.</li>
<li><b>★ ✿ ⋆</b> stars and flowers add a soft, playful look.</li>
<li><b>▁ ▂ ▄</b> blocks build a small "sound wave" on each side of your text.</li>
</ul>
<h2>Where fancy text works</h2>
{WHERE_TABLE}
{A11Y}
<div class="note">Got your fancy heading? Paste it into a Capybaroar post and schedule it to Instagram, TikTok, X and 9 more networks at once.</div>''',
    faq=[('What is fancy text?', 'Fancy text is text made of special Unicode characters: styled letters and decorations like stars, brackets and frames. It looks like a different font, but it is still text, so it pastes anywhere.'),
         ('How do I copy fancy text?', 'Type your words, then press Copy next to the style you like. On a phone, the text is copied right away and you can paste it with a long press.'),
         ('Can I use fancy text in game names?', 'Often, yes. Many games and Discord allow it, but some block certain symbols or limit name length. Test your name in the game before you share it.'),
         ('What is the ꧁ ꧂ symbol?', 'They are section marks from the Javanese script. People use the pair as a decorative frame around names.'),
         ('Does fancy text work on Instagram?', 'Yes, in your display name, bio, captions and comments. Your @username only takes plain letters, numbers, periods and underscores.'),
         ('Why does fancy text show as boxes?', 'The device or app is missing that symbol. Newer phones show almost all of them. Pick a simpler style if your audience uses older devices.'),
         ('Is fancy text bad for accessibility?', 'It can be. Many screen readers read styled letters as symbols. Use fancy text for a name or a short heading and keep the rest of your post plain.')]))

# ---------------------------------------------------------------- Bold
TOOLS.append(dict(
    slug='/tools/bold-text-generator', key='bold', icon='i-text', group='text',
    name='Bold text generator', line='Bold text for LinkedIn, X, Instagram and Facebook.',
    title='Bold Text Generator: Bold Text for LinkedIn, X and Instagram | Capybaroar',
    desc='Make bold text you can copy and paste into LinkedIn, X, Instagram, Facebook and TikTok. Bold sans, bold serif, bold italic and more. Free.',
    tag='Free tool', h1a='Bold text generator', h1b='for LinkedIn, X and Instagram',
    lead='Social apps don\'t have a bold button. Type your words here, copy the bold version and paste it into any post, bio or comment.',
    tool=styles_tool(['bold-sans', 'bold', 'bold-italic-sans', 'bold-italic', 'bold-script', 'bold-fraktur', 'double', 'circled-dark', 'squared-dark'], 'Make this bold'),
    read=f'''<h2>Why you need a bold text generator</h2>
<p>LinkedIn, X, Instagram, Facebook and TikTok show every post in plain text. There is no bold button in the box where you write. Yet you see bold headings in posts every day. Those posts use Unicode bold characters: symbols that look like bold letters and paste like normal text.</p>
<p>This tool turns your words into those characters. Copy the result, paste it into your post and the bold stays.</p>
<h2>Which bold style to pick</h2>
<ul>
<li><b>Bold sans</b> (𝗹𝗶𝗸𝗲 𝘁𝗵𝗶𝘀) matches the plain font most apps use. It is the best pick for LinkedIn headings and key phrases.</li>
<li><b>Bold serif</b> (𝐥𝐢𝐤𝐞 𝐭𝐡𝐢𝐬) looks like a newspaper headline.</li>
<li><b>Bold italic</b> (𝙡𝙞𝙠𝙚 𝙩𝙝𝙞𝙨) adds energy to a short line.</li>
<li><b>Bold script and bold gothic</b> suit names and creative bios.</li>
<li><b>Outline, dark bubbles and dark squares</b> work for short labels and gaming names.</li>
</ul>
<h2>How to use bold text on each network</h2>
<h3>LinkedIn</h3>
<p>Use bold for the first line of a post, a short heading or one key number. The first few lines of a LinkedIn post show before "see more", so a bold opening line helps people stop and read. Our <a href="/tools/linkedin-text-formatter">LinkedIn text formatter</a> lets you bold words right inside your draft.</p>
<h3>X (Twitter)</h3>
<p>Bold letters count as 2 characters each toward the 280 limit, so a bold heading uses up space quickly. Bold one or two words, not a whole post.</p>
<h3>Instagram and TikTok</h3>
<p>Bold works in captions, comments and bios. It is a neat way to label sections of a long caption, like 𝗜𝗻𝗴𝗿𝗲𝗱𝗶𝗲𝗻𝘁𝘀 and 𝗠𝗲𝘁𝗵𝗼𝗱 in a recipe post.</p>
<h3>Facebook</h3>
<p>Bold text works in posts, comments and Page descriptions.</p>
<div class="note">Write the post in Capybaroar, paste in your bold heading and schedule it to LinkedIn, X, Instagram and more from one calendar.</div>
{A11Y}
<h2>Bold numbers too</h2>
<p>Bold sans, bold serif and bold italic include bold numbers, so a stat like 𝟰𝟬% or 𝟭𝟮 𝗻𝗲𝘄 𝗰𝗹𝗶𝗲𝗻𝘁𝘀 stands out in a sentence. Other styles leave numbers plain.</p>''',
    faq=[('How do I make text bold on LinkedIn?', 'LinkedIn posts have no bold button. Type your words here, copy the bold sans version and paste it into your LinkedIn post. It stays bold for everyone who sees it.'),
         ('How do I bold text on X (Twitter)?', 'Copy bold text from this tool and paste it into your post. Each bold letter counts as 2 characters on X, so keep bold to a few words.'),
         ('Can I bold text in an Instagram caption?', 'Yes. Paste bold text from this tool into your caption, comment or bio. Keep hashtags plain so they still work in search.'),
         ('Which bold style looks most professional?', 'Bold sans. It matches the regular font in most apps, so it looks like real bold text.'),
         ('Does bold text work on phones?', 'Yes. Current iPhones and Android phones show all the bold styles here.'),
         ('Can I remove the bold later?', 'You would need to retype the words, since bold letters are different characters. The LinkedIn text formatter has a Clear button that turns styled text back into plain letters.'),
         ('Is bold text bad for SEO or search?', 'Bold words are not matched by search, so a bold keyword will not help people find your post. Use bold for emphasis and keep keywords and hashtags plain.')]))

# ---------------------------------------------------------------- Small
TOOLS.append(dict(
    slug='/tools/small-text-generator', key='small', icon='i-text', group='text',
    name='Small text generator', line='Tiny text, small caps and subscript to copy and paste.',
    title='Small Text Generator: Tiny Text to Copy and Paste | Capybaroar',
    desc='Make small text in three styles: small caps, tiny superscript and subscript. Copy and paste it into Instagram, TikTok, Discord and more. Free.',
    tag='Free tool', h1a='Small text generator', h1b='tiny text to copy and paste',
    lead='Make your words small in three styles: small caps, tiny letters that sit high and subscript letters that sit low. Copy any of them in one tap.',
    tool=styles_tool(['small-caps', 'superscript', 'subscript'], 'small text'),
    read=f'''<h2>Three kinds of small text</h2>
<p>There is no "font size" in Instagram, TikTok or Discord. Everyone sees text at the same size. To make words look small, you swap normal letters for small versions that already exist in Unicode, the character set every device uses.</p>
<ul>
<li><b>Small caps</b> (ꜱᴍᴀʟʟ ᴄᴀᴘꜱ) are capital letters drawn at lowercase height. They are the easiest to read and the most complete set.</li>
<li><b>Tiny text</b> (ᵗⁱⁿʸ ᵗᵉˣᵗ) uses superscript letters that sit high on the line, like the 2 in x².</li>
<li><b>Subscript</b> (ₕₑₗₗₒ) uses letters that sit low, like the 2 in H₂O.</li>
</ul>
<h2>How to use it</h2>
<ol><li>Type your words in the box.</li><li>Press <b>Copy</b> next to the small style you want.</li><li>Paste it wherever you like.</li></ol>
<h2>Good to know: the letter gaps</h2>
<p>Unicode does not have a small version of every letter. Small caps covers nearly the whole alphabet. Tiny text is missing a true small "q", so the tool uses the closest match. Subscript only exists for about half the alphabet, so letters like b, c, d and g stay normal size. That is why subscript works best for short words that use the letters it has, or for numbers like ₁₂₃.</p>
<div class="scroll"><table class="cmp"><thead><tr><th>Style</th><th>Letters covered</th><th>Numbers</th><th>Best for</th></tr></thead><tbody>
<tr><th>Small caps</th><td>25 of 26 (x stays plain)</td><td>No</td><td>Taglines, names, headings</td></tr>
<tr><th>Tiny</th><td>All 26, with a stand-in for q</td><td>Yes</td><td>Little notes, cute bios</td></tr>
<tr><th>Subscript</th><td>17 of 26</td><td>Yes</td><td>Short words, numbers, formulas</td></tr>
</tbody></table></div>
<h2>Ideas for small text</h2>
<ul>
<li>A tagline under your name in your Instagram bio, like ʙᴀᴋᴇʀ ɪɴ ᴀᴜꜱᴛɪɴ.</li>
<li>A quiet sign-off at the end of a caption.</li>
<li>Small labels in a Discord server, like channel names or roles.</li>
<li>Footnote-style marks after a claim, like ʳᵉᵃᵈ ᵐᵒʳᵉ ᵇᵉˡᵒʷ.</li>
</ul>
{A11Y}
<div class="note">Plan the posts that go with your new bio in Capybaroar, and schedule a week of them to every network in one go.</div>''',
    faq=[('How do I make small text on Instagram?', 'Type your words here, copy the small caps or tiny version and paste it into your bio, caption or comment.'),
         ('Why are some letters not small?', 'Unicode only has small versions of some letters. Subscript covers about 17 letters, so the rest stay normal size. Small caps and tiny text cover almost every letter.'),
         ('What is small caps?', 'Small caps are capital letters shaped to the height of lowercase letters. They look tidy and are the easiest small style to read.'),
         ('Does small text work on TikTok and Discord?', 'Yes. Small caps and tiny text work in TikTok bios and captions and in Discord names, messages and channel names.'),
         ('Can I make numbers small?', 'Yes. Tiny text and subscript both have small numbers, like ¹²³ and ₁₂₃.'),
         ('Is small text readable for everyone?', 'Not always. Some screen readers read small letters as symbols. Use small text for short, extra details and keep the main message plain.')]))

# ---------------------------------------------------------------- Glitch
TOOLS.append(dict(
    slug='/tools/glitch-text-generator', key='glitch', icon='i-spark', group='text',
    name='Glitch text generator', line='Creepy, glitchy "zalgo" text with a strength slider.',
    title='Glitch Text Generator: Creepy Zalgo Text to Copy and Paste | Capybaroar',
    desc='Make glitch text, also called zalgo or cursed text. Pick how strong the glitch is and where the marks go, then copy and paste it. Free.',
    tag='Free tool', h1a='Glitch text generator', h1b='creepy zalgo text in one click',
    lead='Make your words look glitched, haunted or broken. Pick the strength, choose where the marks go and copy the result.',
    tool='''<div class="t-card" data-tool="glitch">
<label class="t-lab" for="g-in">Type your text</label>
<textarea id="g-in" data-input rows="2" placeholder="Glitch text"></textarea>
<div class="t-foot">
<div class="t-range"><label for="g-lvl">Strength</label><input id="g-lvl" type="range" min="1" max="12" value="5" data-level><b data-level-out>5</b></div>
<div class="t-bar" role="group" aria-label="Where the marks go"><button class="t-btn" type="button" data-dir="up" aria-pressed="true">Above</button><button class="t-btn" type="button" data-dir="mid" aria-pressed="true">Through</button><button class="t-btn" type="button" data-dir="down" aria-pressed="true">Below</button><button class="t-btn" type="button" data-reroll><svg class="ico" aria-hidden="true"><use href="#i-repeat"/></svg>New look</button></div>
</div>
<div class="t-out-big" data-out aria-live="polite"></div>
<div class="t-foot"><span></span><button class="btn sm" type="button" data-copy><svg class="ico" aria-hidden="true"><use href="#i-copy"/></svg>Copy glitch text</button></div>
</div>''',
    read=f'''<h2>What is glitch text?</h2>
<p>Glitch text, also called zalgo text or cursed text, looks like letters dripping, shaking or breaking apart. It comes from a creepy internet meme, and today people use it for horror posts, gaming names, Halloween captions and anything meant to feel "off".</p>
<p>The trick is a feature of Unicode called combining marks. These are tiny accents, lines and dots that attach to the letter before them, like the accent on é. Normal text uses one at most. Glitch text stacks many of them on every letter, above, through and below, so they spill over the lines nearby.</p>
<h2>How to make glitch text</h2>
<ol>
<li>Type your words in the box.</li>
<li>Move the <b>Strength</b> slider. Low numbers look like a light flicker. High numbers look like a total meltdown.</li>
<li>Turn <b>Above</b>, <b>Through</b> or <b>Below</b> on or off to choose where the marks go.</li>
<li>Press <b>New look</b> to shuffle the marks, then <b>Copy glitch text</b>.</li>
</ol>
<h2>Tips for glitch text that still reads</h2>
<ul>
<li>Keep it short. One or two glitched words make a stronger effect than a whole paragraph.</li>
<li>Use a strength of 2 to 5 for names and captions. Higher levels can cover the line above and below.</li>
<li>Try "Below" only for a dripping look, or "Through" only for a scratched look.</li>
</ul>
<h2>Where glitch text works</h2>
<p>Glitch text pastes into Instagram, TikTok, X, Discord, Facebook and most games. A few places limit it:</p>
<ul>
<li>Some apps cut off very tall stacks of marks, so a strong glitch may look lighter after you post.</li>
<li>Usernames and handles usually reject combining marks. Display names often accept them.</li>
<li>Each mark is a character, so glitch text uses up character limits fast. A glitched word can count as 30 characters or more. Check it with our <a href="/tools/character-counter">character counter</a>.</li>
</ul>
<h2>Is glitch text safe to use?</h2>
<p>Yes. It is plain text, so it can't harm a device. Very heavy glitch text can slow down an old phone while it draws all the marks, and some moderators remove it from comments because it makes threads hard to read. Use it for effect, not for every message.</p>
{A11Y}''',
    faq=[('What is zalgo text?', 'Zalgo text is another name for glitch text. It stacks Unicode combining marks on each letter so the text looks broken or haunted.'),
         ('How do I copy glitch text?', 'Type your words, set the strength and press Copy glitch text. Then paste it anywhere.'),
         ('Why does my glitch text look lighter after I post it?', 'Some apps trim tall stacks of marks to keep posts readable. Try a lower strength so what you see here matches what people see.'),
         ('Can I use glitch text in my username?', 'Usually not in the @handle itself, which only takes plain characters. Most apps allow it in the display name.'),
         ('Does glitch text count as more characters?', 'Yes. Every mark is a character, so one glitched word can count as dozens of characters toward a limit.'),
         ('Can glitch text crash a phone?', 'No. It is plain text. Very heavy glitch text can make an older phone slow to draw it, which is why a light strength is the better choice.')]))

# ---------------------------------------------------------------- Strikethrough
TOOLS.append(dict(
    slug='/tools/strikethrough-text-generator', key='strike', icon='i-text', group='text',
    name='Strikethrough text generator', line='Crossed-out, underlined and slashed text.',
    title='Strikethrough Text Generator: Cross Out Text to Copy and Paste | Capybaroar',
    desc='Make strikethrough text you can paste into Instagram, X, LinkedIn, Facebook and TikTok. Also underline, double underline, slash and overline. Free.',
    tag='Free tool', h1a='Strikethrough text generator', h1b='cross out any text',
    lead='Cross out words in apps that have no strikethrough button. Type, pick a line style and paste it into any post or bio.',
    tool=styles_tool(['strike', 'strike-short', 'slash', 'cross', 'underline', 'underline-double', 'overline'], 'Cross this out'),
    read=f'''<h2>How strikethrough text works</h2>
<p>Most social apps don't have a strikethrough button. This tool adds a special Unicode character, the "combining long stroke overlay", after every letter you type. Your phone draws that line across the letter before it, so the whole word looks crossed out. Because it is text, it stays crossed out when you paste it anywhere.</p>
<p>The same trick makes the other styles in the list: underline, double underline, a short line, a slash and a line above the letters.</p>
<h2>How to use it</h2>
<ol><li>Type the words you want to cross out.</li><li>Pick a style and press <b>Copy</b>.</li><li>Paste it into your post, bio or comment.</li></ol>
<h2>Ways people use crossed-out text</h2>
<ul>
<li><b>Jokes and honest edits.</b> "I'm n̶o̶t̶ obsessed with this cake." The crossed-out word shows what you "almost" said.</li>
<li><b>Sales.</b> Show the old price crossed out next to the new one: $̶4̶0̶ $28.</li>
<li><b>Checklists.</b> Cross off done items in a caption or a Discord message.</li>
<li><b>Corrections.</b> Fix a mistake in a long post and keep the change visible.</li>
</ul>
<h2>Which line style to pick</h2>
<div class="scroll"><table class="cmp"><thead><tr><th>Style</th><th>Looks like</th><th>Good for</th></tr></thead><tbody>
<tr><th>Strikethrough</th><td>S̶t̶r̶i̶k̶e̶</td><td>Prices, jokes, done items</td></tr>
<tr><th>Short strike</th><td>S̵h̵o̵r̵t̵</td><td>A lighter cross-out</td></tr>
<tr><th>Slashed</th><td>S̸l̸a̸s̸h̸</td><td>A "no" or "not this" look</td></tr>
<tr><th>Underline</th><td>U̲n̲d̲e̲r̲</td><td>Titles and key words</td></tr>
<tr><th>Double underline</th><td>D̳o̳u̳b̳l̳e̳</td><td>Totals and strong emphasis</td></tr>
<tr><th>Overline</th><td>O̅v̅e̅r̅</td><td>Decoration and math</td></tr>
</tbody></table></div>
<h2>Where strikethrough text works</h2>
<p>It works in Instagram, Facebook, X, LinkedIn, TikTok, Threads and most messaging apps. A few things to know:</p>
<ul>
<li>Each line is an extra character, so crossed-out text uses about twice the characters toward a post limit.</li>
<li>Spaces are left without a line, which keeps words easy to tell apart.</li>
<li>Discord and Slack have their own strikethrough. Wrap text in two tildes, like <code>~~this~~</code>, and the app crosses it out for you.</li>
</ul>
{A11Y}''',
    faq=[('How do I cross out text on Instagram?', 'Type your words here, copy the strikethrough version and paste it into your caption, bio or comment.'),
         ('How do I do strikethrough on Facebook?', 'Facebook posts have no strikethrough button. Copy crossed-out text from this tool and paste it into your post.'),
         ('Does strikethrough text work on LinkedIn and X?', 'Yes. It pastes into LinkedIn posts and X posts. On X, each crossed-out letter takes about twice the characters toward the 280 limit.'),
         ('Why doesn\'t the line cover the spaces?', 'The tool leaves spaces plain so each word stays easy to read. You can still copy and paste it as one piece.'),
         ('How do I strike through text in Discord?', 'Discord supports it on its own: put two tildes on each side, like ~~text~~. This tool works there too.'),
         ('Can I underline text in social media posts?', 'Yes. Pick Underline or Double underline in the list and copy it.')]))

# ---------------------------------------------------------------- LinkedIn formatter
TOOLS.append(dict(
    slug='/tools/linkedin-text-formatter', key='linkedin', icon='i-pen', group='text',
    name='LinkedIn text formatter', line='Bold, italic, lists and a live preview for LinkedIn.',
    title='LinkedIn Text Formatter: Bold, Italic and Lists for LinkedIn Posts | Capybaroar',
    desc='Format LinkedIn posts with bold, italic, underline, strikethrough and bullet lists. See where "see more" cuts your post and copy it in one click. Free.',
    tag='Free tool', h1a='LinkedIn text formatter', h1b='bold, italic and lists for your posts',
    lead='Write your LinkedIn post, select a word and make it bold or italic. Add bullet points, check where "see more" cuts it off and copy it straight into LinkedIn.',
    tool='''<div class="t-card" data-tool="linkedin">
<div class="t-two">
<div>
<div class="t-bar" role="toolbar" aria-label="Formatting">
<button class="t-btn" type="button" data-act="bold" title="Bold (Ctrl+B)"><b>B</b></button>
<button class="t-btn" type="button" data-act="italic" title="Italic (Ctrl+I)"><i>I</i></button>
<button class="t-btn" type="button" data-act="bold-italic" title="Bold italic"><b><i>BI</i></b></button>
<button class="t-btn" type="button" data-act="underline" title="Underline (Ctrl+U)"><u>U</u></button>
<button class="t-btn" type="button" data-act="strike" title="Strikethrough"><s>S</s></button>
<button class="t-btn" type="button" data-act="mono" title="Typewriter">Mono</button>
<span class="sep" aria-hidden="true"></span>
<button class="t-btn" type="button" data-act="bullets" title="Bullet list">• List</button>
<button class="t-btn" type="button" data-act="numbers" title="Numbered list">1. List</button>
<button class="t-btn" type="button" data-act="arrows" title="Arrow list">→ List</button>
<span class="sep" aria-hidden="true"></span>
<button class="t-btn" type="button" data-act="clear" title="Turn styled text back to plain">Clear style</button>
</div>
<label class="sr" for="li-in">Your LinkedIn post</label>
<textarea id="li-in" data-input rows="12" placeholder="Write your post here. Select a word and press B to make it bold."></textarea>
<div class="t-foot"><div class="t-meter"><i><b data-bar></b></i><span data-count>0 / 3,000</span></div><button class="btn sm" type="button" data-copy><svg class="ico" aria-hidden="true"><use href="#i-copy"/></svg>Copy for LinkedIn</button></div>
</div>
<div>
<span class="t-lab">Preview in the feed</span>
<div class="li-prev">
<div class="li-h"><span class="av y" style="width:40px;height:40px"><img src="/img/faces/owner.webp" alt="" width="40" height="40"></span><div><b>Your name</b><small>Your headline</small></div></div>
<div class="li-body"><span data-preview></span> <button class="li-more" type="button" data-more hidden>…see more</button></div>
<div class="li-f"><span>Like</span><span>Comment</span><span>Repost</span><span>Send</span></div>
</div>
</div>
</div>
</div>''',
    read='''<h2>Why LinkedIn posts need a formatter</h2>
<p>LinkedIn's post box has no bold, italic or list buttons. Everything you write shows as plain text. Yet the posts that get read usually have a bold first line, short lines and a clear list. A formatter lets you add that style before you paste the post into LinkedIn.</p>
<p>The bold, italic and other styles here are Unicode characters, special symbols that look like styled letters. LinkedIn shows them exactly as they look in the preview, on phones and computers.</p>
<h2>How to format a LinkedIn post</h2>
<ol>
<li>Write or paste your post in the box.</li>
<li>Select a word or a line and press <b>B</b> for bold or <b>I</b> for italic. Ctrl+B, Ctrl+I and Ctrl+U work too (Cmd on a Mac).</li>
<li>Select a few lines and press <b>• List</b>, <b>1. List</b> or <b>→ List</b> to turn them into a list.</li>
<li>Check the preview. LinkedIn shows the first part of a post and hides the rest behind "see more".</li>
<li>Press <b>Copy for LinkedIn</b>, open LinkedIn and paste.</li>
</ol>
<p>Your draft is kept in this browser, so you can close the page and come back to it. Nothing is sent anywhere.</p>
<h2>The "see more" line matters most</h2>
<p>In the feed, LinkedIn shows roughly the first 200 characters or first 3 lines of a post, then cuts it off with "see more". People decide whether to keep reading from that short opening. The preview here cuts your post at about the same point, so you can see exactly what shows before the fold.</p>
<p>Tips for the opening:</p>
<ul>
<li>Put your main point or a surprising number in the first line, and make it bold.</li>
<li>Keep the first line under about 60 characters so it doesn't wrap on a phone.</li>
<li>Leave a blank line after it. White space makes people want to read on.</li>
</ul>
<h2>Formatting tips that work on LinkedIn</h2>
<ul>
<li><b>Bold sparingly.</b> One bold line or a few bold words. A fully bold post is hard to read and looks like shouting.</li>
<li><b>Use lists for steps and takeaways.</b> Arrows (→) and bullets (•) scan faster than long paragraphs.</li>
<li><b>Short paragraphs.</b> One to three lines each. Most people read LinkedIn on a phone.</li>
<li><b>Keep names, job titles and hashtags plain.</b> LinkedIn search looks for normal letters, so a bold job title won't show up in searches for that title.</li>
<li><b>Stay under 3,000 characters.</b> That is LinkedIn's limit for a post. The meter under the box turns red if you go over.</li>
</ul>
<h2>Accessibility</h2>
<p>Screen readers often read styled letters one by one or skip them. Bold one line or a few words, keep the rest plain, and your post stays readable for everyone.</p>
<div class="note">Write once, post everywhere: Capybaroar schedules your formatted LinkedIn post to your profile and your company Page, and to 10 other networks, from one calendar.</div>
<h2>Can I format a LinkedIn article or newsletter?</h2>
<p>LinkedIn articles and newsletters have their own editor with real bold, italic and headings, so you don't need this tool there. This formatter is for regular posts, comments, your About section and your headline.</p>''',
    faq=[('How do I bold text in a LinkedIn post?', 'LinkedIn has no bold button for posts. Write your post here, select the words, press B, then copy and paste the post into LinkedIn. The bold shows for everyone.'),
         ('Can I use italic and underline on LinkedIn?', 'Yes. Select the words and press I or U, then copy your post. LinkedIn shows the styled letters as they look in the preview.'),
         ('How many characters can a LinkedIn post have?', 'Up to 3,000. The meter under the box counts as you type and turns red past the limit.'),
         ('Where does "see more" cut off a LinkedIn post?', 'Around the first 200 characters or 3 lines in the feed, and a little less on some phones. The preview here cuts your post at about the same point.'),
         ('Does bold text hurt reach on LinkedIn?', 'There is no sign that LinkedIn ranks posts with styled text lower. Styled words are not matched by search, though, so keep keywords, job titles and hashtags plain.'),
         ('Can I add bullet points to a LinkedIn post?', 'Yes. Select a few lines and press • List, 1. List or → List. Each line gets a bullet, a number or an arrow.'),
         ('How do I remove bold from my post?', 'Select the styled words and press Clear style. With nothing selected, Clear style turns the whole post back to plain text.'),
         ('Does this work for my LinkedIn headline and About section?', 'Yes. Copy styled text into your headline or About section the same way. Keep your job title plain so recruiters can find you.')]))

# ---------------------------------------------------------------- Invisible character
INV = [('3164', 'Hangul filler', 'The go-to blank for names in games and apps that reject spaces.'),
       ('2800', 'Braille blank', 'Keeps empty lines in Instagram captions and bios.'),
       ('200B', 'Zero width space', 'Takes no space at all. Lets long words or links break onto a new line.'),
       ('00A0', 'No-break space', 'A normal-width space that keeps two words on the same line.'),
       ('2003', 'Em space', 'A wide space, about the width of the letter M.'),
       ('2002', 'En space', 'A space half as wide as an em space.'),
       ('2007', 'Figure space', 'As wide as a number. Lines up columns of numbers.'),
       ('3000', 'Ideographic space', 'A full-width space used in Chinese, Japanese and Korean text.'),
       ('2060', 'Word joiner', 'Invisible. Stops a line break between two characters.')]
inv_cards = ''.join(f'<li><b>{n}</b><code>U+{c}</code><p>{d}</p><button class="t-copy" type="button" data-char="{c}" data-name="{n.lower()}"><svg class="ico" aria-hidden="true"><use href="#i-copy"/></svg><span>Copy</span></button></li>' for c, n, d in INV)
TOOLS.append(dict(
    slug='/tools/invisible-character', key='invisible', icon='i-eyeoff', group='text',
    name='Invisible character', line='Blank characters for names, bios and line breaks.',
    title='Invisible Character: Copy and Paste a Blank Space (Free) | Capybaroar',
    desc='Copy an invisible character or blank space for game names, Instagram line breaks and empty messages. 9 blank characters, plus a tool that finds hidden ones.',
    tag='Free tool', h1a='Invisible character', h1b='copy a blank space in one click',
    lead='Copy a blank character for an empty name, a line break that sticks or a gap that apps won\'t delete. There\'s a checker too, to find hidden characters in any text.',
    tool=f'''<div class="t-card" data-tool="invisible">
<div class="t-foot" style="margin:0 0 14px"><div class="t-range"><label for="iv-n">Copies at once</label><input id="iv-n" type="number" min="1" max="50" value="1" data-times class="t-in" style="width:90px;padding:8px 12px"></div></div>
<ul class="iv-grid">{inv_cards}</ul>
<h3 style="margin:24px 0 8px;font-size:16px">Find hidden characters</h3>
<label class="t-lab" for="iv-det">Paste text to check it for invisible characters</label>
<textarea id="iv-det" data-detect rows="3" placeholder="Paste any text here"></textarea>
<ul class="iv-found" data-found aria-live="polite"></ul>
<div class="t-foot"><span></span><button class="btn sm ghost" type="button" data-clean>Remove them and copy</button></div>
</div>''',
    read='''<h2>What is an invisible character?</h2>
<p>An invisible character is a real character that shows as empty space. Your keyboard's space bar types the most common one, but many apps trim normal spaces or refuse a name made only of spaces. Unicode, the character set every phone uses, has other blank characters that apps treat as "real" letters. Copy one of those and you get a blank that sticks.</p>
<h2>How to use it</h2>
<ol>
<li>Find the blank you need in the list. Each card says what it is good for.</li>
<li>Set <b>Copies at once</b> if you want several in a row, for a wider gap.</li>
<li>Press <b>Copy</b>, then paste it into the app.</li>
</ol>
<h2>Popular uses</h2>
<h3>Blank names in games and apps</h3>
<p>The <b>Hangul filler</b> (U+3164) is the classic choice for an empty-looking name in games and chat apps, because many name fields accept it as a letter. Some games block it to stop blank names, so if it doesn't work, try the halfwidth version or add one visible character.</p>
<h3>Line breaks in Instagram captions and bios</h3>
<p>Instagram can remove empty lines when you post, which squashes your paragraphs together. Put a <b>Braille blank</b> (U+2800) alone on each empty line. Instagram sees a character there, so it keeps the line.</p>
<h3>Spacing and centering</h3>
<p>Wide blanks like the <b>em space</b> let you indent lines or center a short bio by hand, since apps collapse several normal spaces into one.</p>
<h3>Breaking long links and words</h3>
<p>A <b>zero width space</b> takes no room, but it lets a long word or link wrap onto the next line instead of running off the screen.</p>
<h2>Find hidden characters in any text</h2>
<p>Invisible characters can also cause trouble. Text copied from websites, PDFs or chat apps sometimes carries hidden zero width spaces or no-break spaces. They can break a hashtag, stop a link from working or make a password "wrong". Paste the text into the checker above to see every hidden character and how many there are. Press <b>Remove them and copy</b> to get a clean copy.</p>
<h2>Things to know before you use them</h2>
<ul>
<li><b>Apps change their rules.</b> A blank that works today may be blocked later, and some apps strip invisible characters from posts.</li>
<li><b>Hashtags break.</b> An invisible character inside a hashtag ends it early, so the hashtag stops working.</li>
<li><b>Screen readers.</b> Some read blank characters out loud by name. Use them for layout, not to hide words.</li>
<li><b>Fair play.</b> Don't use blank names to pretend to be someone else or to get around a ban. Most games treat that as breaking their rules.</li>
</ul>
<div class="note">Tired of fighting line breaks? Capybaroar keeps your paragraphs as you write them and shows a phone preview for each network before you schedule.</div>''',
    faq=[('How do I copy an invisible character?', 'Press Copy on any card. The blank character is copied and ready to paste. Paste it into a name field, a caption or a message.'),
         ('Which invisible character works for game names?', 'Try the Hangul filler (U+3164) first. Many games and apps accept it as a letter. If a game blocks it, it has rules against blank names.'),
         ('How do I add line breaks in an Instagram caption?', 'Put a Braille blank (U+2800) on each empty line. Instagram keeps the line because it sees a character on it.'),
         ('What is a zero width space?', 'A character with no width at all. It is invisible and takes no room, but it lets long words and links wrap onto the next line.'),
         ('Why did my hashtag stop working?', 'A hidden character inside it can end the hashtag early. Paste your text into the checker to find and remove it.'),
         ('Can invisible characters harm my device?', 'No. They are ordinary text characters. They can only cause small problems, like breaking a hashtag or a link.'),
         ('Is it against the rules to use a blank name?', 'Some games and apps block blank names. Using one to pretend to be someone else or to dodge a ban usually breaks their rules.')]))
