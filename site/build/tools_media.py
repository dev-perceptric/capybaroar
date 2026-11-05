"""Content for the image tools: Instagram post size, YouTube thumbnail size and the Instagram grid maker."""
import json, html as H
TOOLS = []


def drop(label, hint):
    return f'''<div class="rs-drop" data-drop role="button" tabindex="0" aria-label="{label}">
<span class="ic"><svg class="ico" aria-hidden="true"><use href="#i-upload"/></svg></span><b>{label}</b><small>{hint}</small><input type="file" accept="image/*">
</div>'''


def opts(items, attr, pressed):
    return ''.join(f'<button class="t-btn" type="button" {attr}="{v}"' + ''.join(f' data-{k}="{x}"' for k, x in extra.items()) + f' aria-pressed="{"true" if v == pressed else "false"}">{t}<small>{s}</small></button>' for v, t, s, extra in items)


MODES = '<div class="rs-group"><span class="t-lab">Fit</span><div class="rs-opts"><button class="t-btn" type="button" data-mode="crop" aria-pressed="true">Crop to fill<small>Drag the picture to move it</small></button><button class="t-btn" type="button" data-mode="fit" aria-pressed="false">Fit whole picture<small>Adds space around it</small></button></div></div>'
FILLS = '<div class="rs-group rs-fill"><span class="t-lab">Space around it</span><div class="rs-opts"><button class="t-btn" type="button" data-fill="#ffffff" aria-pressed="true">White</button><button class="t-btn" type="button" data-fill="#000000" aria-pressed="false">Black</button><button class="t-btn" type="button" data-fill="blur" aria-pressed="false">Blurred copy</button></div></div>'


def resizer(name, rules, fmts, pressed, max_bytes=0, drop_label='Choose a picture', keep=False):
    return f'''<div class="t-card" data-tool="resize" data-name="{name}" data-rules='{H.escape(json.dumps(rules), quote=True)}'{f' data-max-bytes="{max_bytes}"' if max_bytes else ''}{' data-keep-format="1"' if keep else ''}>
{drop(drop_label, 'Drop it here, paste it or tap to pick. It stays on your device.')}
<div class="rs-wrap">
<div><div class="rs-stage" data-stage></div><p class="rs-hint" style="margin-top:8px;text-align:center">The preview shows exactly what you download.</p></div>
<div class="rs-side">
<div class="rs-group"><span class="t-lab">Your picture</span><div class="rs-info" data-info></div><ul class="rs-checks" data-checks></ul></div>
<div class="rs-group"><span class="t-lab">Size</span><div class="rs-opts">{opts(fmts, 'data-fmt', pressed)}</div></div>
{MODES}{FILLS}
<button class="btn" type="button" data-download disabled><svg class="ico" aria-hidden="true"><use href="#i-upload"/></svg>Download JPG</button>
</div>
</div>
</div>'''


# ---------------------------------------------------------------- Instagram post size
IG_FMTS = [('portrait', 'Portrait 4:5', '1080 × 1350, best for the feed', {'w': 1080, 'h': 1350}),
           ('grid', 'Tall 3:4', '1080 × 1440, fills a profile tile', {'w': 1080, 'h': 1440}),
           ('square', 'Square 1:1', '1080 × 1080', {'w': 1080, 'h': 1080}),
           ('landscape', 'Landscape 1.91:1', '1080 × 566', {'w': 1080, 'h': 566}),
           ('story', 'Story and Reel 9:16', '1080 × 1920', {'w': 1080, 'h': 1920})]
IG_RULES = [{'k': 'minw', 'v': 1080, 'ok': 'Wide enough: 1080 pixels or more', 'no': 'Narrower than 1080 pixels. Instagram will show it softer.'},
            {'k': 'ratio', 'v': 0.8, 'ok': 'Already 4:5, the best feed shape', 'no': 'Not 4:5 yet. Pick a size to crop or fit it.'}]
TOOLS.append(dict(
    slug='/tools/instagram-post-size', key='igsize', icon='i-image', group='image',
    name='Instagram post size', line='Check and resize pictures for posts, Stories and Reels.',
    title='Instagram Post Size 2026: Free Checker and Resizer | Capybaroar',
    desc='Every Instagram post size for 2026, with a free tool that checks your picture and resizes it to 4:5, 3:4, square, landscape or Story size. No upload needed.',
    tag='Free tool', h1a='Instagram post size', h1b='checker and resizer',
    lead='Drop in a picture to see if it fits Instagram, then crop or fit it to the right size for the feed, your profile grid, Stories or Reels. It never leaves your device.',
    tool=resizer('instagram', IG_RULES, IG_FMTS, 'portrait'),
    read='''<h2>Instagram post sizes at a glance</h2>
<div class="scroll"><table class="cmp"><thead><tr><th>Format</th><th>Size in pixels</th><th>Shape</th><th>Use it for</th></tr></thead><tbody>
<tr><th>Portrait</th><td>1080 × 1350</td><td>4:5</td><td>Most feed posts and carousels. Takes the most room in the feed.</td></tr>
<tr><th>Tall</th><td>1080 × 1440</td><td>3:4</td><td>Posts you want to fill a tile on your profile grid.</td></tr>
<tr><th>Square</th><td>1080 × 1080</td><td>1:1</td><td>Classic posts, logos and quote cards.</td></tr>
<tr><th>Landscape</th><td>1080 × 566</td><td>1.91:1</td><td>Wide photos. Shows smaller in the feed.</td></tr>
<tr><th>Stories and Reels</th><td>1080 × 1920</td><td>9:16</td><td>Full-screen Stories, Reels and Reel covers.</td></tr>
</tbody></table></div>
<p>Instagram shows pictures 1080 pixels wide. A wider picture is scaled down, and a narrower one is scaled up and looks softer, so 1080 pixels wide is the size to aim for.</p>
<h2>Which size should I use?</h2>
<p><b>For most feed posts, use portrait 4:5 at 1080 × 1350.</b> It is the tallest shape the feed shows in full, so it fills more of the screen than a square and catches more attention as people scroll. It is also the shape that scheduling tools, Capybaroar included, can publish through Instagram's API.</p>
<p><b>Your profile grid now shows tiles in a taller 3:4 shape.</b> A 4:5 post shows almost whole in its tile, with a thin slice cut from each side. If you post straight from the Instagram app and want a post to fill its tile exactly, use 3:4 at 1080 × 1440. Some guides say posts in 3:4 can't be used as ads or published by scheduling tools, so 4:5 is the safe choice for anything you schedule.</p>
<h2>How to use the checker and resizer</h2>
<ol>
<li>Drop a picture on the box, paste one, or tap to pick a file. It stays on your device and is never uploaded.</li>
<li>Read the checks. They tell you if the picture is wide enough and if it is already in the best shape.</li>
<li>Pick a size. The tool suggests the one closest to your picture's shape.</li>
<li>Choose <b>Crop to fill</b> and drag the picture to choose what stays in the frame, or <b>Fit whole picture</b> to keep everything and add white, black or a blurred copy around it.</li>
<li>Press <b>Download JPG</b>.</li>
</ol>
<h2>Stories and Reels: the safe zone</h2>
<p>Stories and Reels fill the whole phone screen at 1080 × 1920. Instagram puts your name at the top and buttons, captions and the reply box at the bottom and right side. Keep text and faces out of roughly the top 250 pixels and bottom 340 pixels, and away from the right edge on Reels, so nothing important is covered.</p>
<p>Reels also show in the feed and on your profile, cropped to a shorter shape. Keep the main subject near the center so it still looks good when cropped.</p>
<h2>Carousels</h2>
<p>A carousel can hold up to 10 pictures or videos. Every slide is shown in the shape of the first one, so make all your slides the same size, ideally 1080 × 1350. Mixed shapes get cropped to match the first slide.</p>
<h2>Tips for sharp pictures</h2>
<ul>
<li>Export at 1080 pixels wide. Bigger files are shrunk by Instagram and can lose detail.</li>
<li>Use JPG for photos and PNG for graphics with text. This tool saves JPG at high quality.</li>
<li>Don't upload screenshots of screenshots. Each copy loses quality.</li>
<li>Keep text large. Most people see your post on a phone, often small in a grid.</li>
</ul>
<div class="note">Capybaroar shows a phone preview for each format before you schedule, and lets you crop pictures to fit Instagram right in the composer.</div>''',
    faq=[('What is the best Instagram post size in 2026?', '1080 × 1350 pixels in a 4:5 portrait shape. It takes the most room in the feed and works for posts you schedule with tools like Capybaroar.'),
         ('What size is the Instagram profile grid?', 'Profile tiles now show in a taller 3:4 shape. A 1080 × 1440 post fills a tile exactly. A 4:5 post shows almost whole with thin slices cut from the sides.'),
         ('What is the Instagram Story size?', '1080 × 1920 pixels, a 9:16 shape. Keep text away from the top and bottom, where Instagram puts its buttons.'),
         ('What size are Instagram Reels?', '1080 × 1920 pixels, 9:16. On your profile and in the feed, Reels are shown cropped, so keep the subject near the center.'),
         ('Can I post a square picture?', 'Yes. 1080 × 1080 still works. It just takes less room in the feed than a 4:5 picture.'),
         ('Why does Instagram crop my photo?', 'Instagram only shows shapes from 1.91:1 (wide) to 4:5 (tall) in the feed. Anything taller or wider is cropped. Resize it here to control what stays in.'),
         ('Is my picture uploaded anywhere?', 'No. The checker and resizer run in your browser. Your picture never leaves your device.'),
         ('What file type should I use?', 'JPG for photos and PNG for graphics with text. This tool saves a high-quality JPG.')]))

# ---------------------------------------------------------------- YouTube thumbnail
YT_FMTS = [('thumbnail', 'Thumbnail 16:9', '1280 × 720, YouTube\'s size', {'w': 1280, 'h': 720}),
           ('thumbnail-hd', 'Thumbnail HD 16:9', '1920 × 1080', {'w': 1920, 'h': 1080})]
YT_RULES = [{'k': 'minw', 'v': 640, 'ok': 'At least 640 pixels wide', 'no': 'Narrower than 640 pixels, YouTube\'s minimum'},
            {'k': 'ratio', 'v': 16 / 9, 'ok': 'Already 16:9', 'no': 'Not 16:9. YouTube adds black bars or crops it.'},
            {'k': 'bytes', 'v': 2097152, 'ok': 'Under 2 MB', 'no': 'Over 2 MB, YouTube\'s limit. The download fixes this.'},
            {'k': 'type', 'v': ['image/jpeg', 'image/png', 'image/gif', 'image/bmp'], 'ok': 'A file type YouTube accepts', 'no': 'YouTube takes JPG, PNG, GIF or BMP. The download is a JPG.'}]
TOOLS.append(dict(
    slug='/tools/youtube-thumbnail-size', key='ytthumb', icon='i-play', group='image',
    name='YouTube thumbnail size', line='Check and fix thumbnails: 1280 × 720, under 2 MB.',
    title='YouTube Thumbnail Size 2026: Free Checker and Resizer (1280 × 720) | Capybaroar',
    desc='The right YouTube thumbnail size is 1280 × 720 at 16:9, under 2 MB. Check your thumbnail and resize it to fit for free, with no upload.',
    tag='Free tool', h1a='YouTube thumbnail size', h1b='checker and resizer',
    lead='Drop in your thumbnail to check it against YouTube\'s rules, then crop or fit it to 1280 × 720 and save it under 2 MB. It never leaves your device.',
    tool=resizer('youtube', YT_RULES, YT_FMTS, 'thumbnail', max_bytes=2000000, drop_label='Choose your thumbnail', keep=True),
    read='''<h2>The right YouTube thumbnail size</h2>
<div class="scroll"><table class="cmp"><thead><tr><th>Rule</th><th>What YouTube wants</th></tr></thead><tbody>
<tr><th>Size</th><td>1280 × 720 pixels</td></tr>
<tr><th>Shape</th><td>16:9, the same as a widescreen video</td></tr>
<tr><th>Smallest width</th><td>640 pixels</td></tr>
<tr><th>File size</th><td>Under 2 MB</td></tr>
<tr><th>File types</th><td>JPG, PNG or GIF (some guides list BMP too)</td></tr>
</tbody></table></div>
<p>1920 × 1080 also works and looks sharp on big screens, as long as the file stays under 2 MB. The resizer can make either size and keeps the file under the limit.</p>
<h2>How to use the checker</h2>
<ol>
<li>Drop your thumbnail on the box, paste it, or tap to pick a file. It stays on your device.</li>
<li>Read the checks for size, shape, file size and file type.</li>
<li>Pick 1280 × 720 or 1920 × 1080.</li>
<li>Choose <b>Crop to fill</b> and drag the picture to frame it, or <b>Fit whole picture</b> to keep all of it with space around it.</li>
<li>Press <b>Download JPG</b>. If the file would be over 2 MB, the tool lowers the quality a little until it fits.</li>
</ol>
<h2>Design tips for thumbnails that get clicks</h2>
<ul>
<li><b>Design for small.</b> Most people see thumbnails on a phone, about the size of a matchbox. Use big shapes, few words and strong contrast.</li>
<li><b>Three words or fewer.</b> Your title already explains the video. The thumbnail should add a feeling or a question.</li>
<li><b>Show a face.</b> A clear face with a strong expression is easy to read at small sizes.</li>
<li><b>Keep the bottom-right corner clear.</b> YouTube puts the video length there and covers whatever is under it.</li>
<li><b>Make it match the video.</b> A thumbnail that promises something the video doesn't deliver leads to quick exits, which can hurt how YouTube recommends your video.</li>
<li><b>Test it.</b> YouTube Studio's "Test and compare" feature lets some channels try up to three thumbnails on one video and keeps the one people watch most.</li>
</ul>
<h2>How to upload a custom thumbnail</h2>
<ol>
<li>Open YouTube Studio and go to <b>Content</b>.</li>
<li>Pick your video and open its details.</li>
<li>Under <b>Thumbnail</b>, choose <b>Upload file</b> and pick the JPG you downloaded here.</li>
<li>Save.</li>
</ol>
<p>Custom thumbnails need a verified channel. If you don't see the upload option, verify your channel with a phone number in YouTube Studio's settings.</p>
<h2>Why does my thumbnail look blurry or have black bars?</h2>
<p>A thumbnail smaller than 1280 × 720 is stretched to fit and looks soft. A picture in a different shape, like a square, gets black bars or is cropped. Resize it to 16:9 at 1280 × 720 here and both problems go away.</p>
<div class="note">Capybaroar schedules YouTube uploads with their title, description, tags and your custom thumbnail, so the video goes live exactly as you planned.</div>''',
    faq=[('What size is a YouTube thumbnail?', '1280 × 720 pixels in a 16:9 shape, under 2 MB, as JPG, PNG or GIF. The smallest width YouTube allows is 640 pixels.'),
         ('Can a YouTube thumbnail be 1920 × 1080?', 'Yes. It keeps the 16:9 shape and looks sharp on big screens. Just keep the file under 2 MB.'),
         ('How do I make my thumbnail smaller than 2 MB?', 'Drop it in this tool and download it. The tool saves a JPG and lowers the quality slightly until the file is under 2 MB.'),
         ('Why can\'t I upload a custom thumbnail?', 'Custom thumbnails need a verified YouTube channel. Verify yours with a phone number in YouTube Studio.'),
         ('What is the YouTube Shorts thumbnail size?', 'Shorts use a frame from the video, or a cover you pick in the YouTube app. Shorts are 9:16, so keep the main subject in the center.'),
         ('Why does YouTube add black bars to my thumbnail?', 'The picture isn\'t 16:9. Crop or fit it to 1280 × 720 here before you upload it.'),
         ('Is my thumbnail uploaded anywhere?', 'No. Everything runs in your browser and the file never leaves your device.')]))

# ---------------------------------------------------------------- Grid maker
TOOLS.append(dict(
    slug='/tools/instagram-grid-maker', key='grid', icon='i-grid', group='image',
    name='Instagram grid maker', line='Split one picture into a grid for your profile.',
    title='Instagram Grid Maker: Split a Picture Into Grid Posts (Free) | Capybaroar',
    desc='Split one picture into 3, 6, 9 or 12 Instagram posts that join up on your profile. Pick the tile shape, download every tile and post them in the right order. Free.',
    tag='Free tool', h1a='Instagram grid maker', h1b='one picture, one big grid',
    lead='Split a picture into 3, 6, 9 or 12 tiles that join into one big image on your profile. The tool numbers each tile so you post them in the right order.',
    tool=f'''<div class="t-card" data-tool="grid">
{drop('Choose a picture', 'Drop it here, paste it or tap to pick. It stays on your device.')}
<div class="rs-wrap">
<div><div class="gm-grid" data-grid></div><p class="gm-order" data-order></p></div>
<div class="rs-side">
<div class="rs-group"><span class="t-lab">Rows</span><div class="rs-opts"><button class="t-btn" type="button" data-rows="1" aria-pressed="true">1 row<small>3 posts</small></button><button class="t-btn" type="button" data-rows="2" aria-pressed="false">2 rows<small>6 posts</small></button><button class="t-btn" type="button" data-rows="3" aria-pressed="false">3 rows<small>9 posts</small></button><button class="t-btn" type="button" data-rows="4" aria-pressed="false">4 rows<small>12 posts</small></button></div></div>
<div class="rs-group"><span class="t-lab">Tile shape</span><div class="rs-opts"><button class="t-btn" type="button" data-ratio="3:4" aria-pressed="true">3:4<small>Matches the profile grid</small></button><button class="t-btn" type="button" data-ratio="4:5" aria-pressed="false">4:5<small>Best for scheduling</small></button><button class="t-btn" type="button" data-ratio="1:1" aria-pressed="false">1:1<small>Square</small></button></div></div>
<button class="btn" type="button" data-download disabled><svg class="ico" aria-hidden="true"><use href="#i-upload"/></svg>Download all tiles (ZIP)</button>
</div>
</div>
</div>''',
    read='''<h2>What is an Instagram grid post?</h2>
<p>A grid post, also called a puzzle feed or split post, is one big picture cut into tiles. You post each tile as its own post, and on your profile they line up into the full picture. It is a bold way to launch a product, announce news or give your profile a fresh look.</p>
<h2>How to make one</h2>
<ol>
<li>Drop in a picture, paste it or tap to pick one. A wide picture works best for one row, a square or tall one for three or four rows.</li>
<li>Pick how many rows you want. Every row is three posts.</li>
<li>Pick the tile shape (more on that below).</li>
<li>Press <b>Download all tiles</b>. You get a ZIP file with every tile, numbered in posting order.</li>
<li>Post the tiles in number order, starting with tile 1.</li>
</ol>
<h2>Why the posting order matters</h2>
<p>Instagram shows your newest post first, at the top left of your profile. So the tile that belongs at the bottom right of the big picture has to go up first, and the top-left tile goes up last. The tool numbers the tiles for you: post 1 first, then 2, and so on. Each new post pushes the others along until the picture comes together.</p>
<p>Post them close together, ideally within a few minutes. Until the last tile is up, your profile shows a half-finished puzzle.</p>
<h2>Which tile shape to pick</h2>
<ul>
<li><b>3:4</b> matches the tall tiles Instagram now uses on profile grids, so the big picture lines up with almost nothing cut off.</li>
<li><b>4:5</b> is the best size for scheduling tools and for the feed, where each tile shows on its own. On your profile, a thin slice is cut from each side of every tile, so leave a little space near the edges.</li>
<li><b>1:1</b> squares make the cleanest seams if your followers mostly see your posts in the feed.</li>
</ul>
<h2>Tips for a grid that looks great</h2>
<ul>
<li><b>Each tile is seen alone in the feed.</b> Followers see one tile at a time as they scroll. Make sure every tile still looks interesting on its own, or add a caption that says "see the full picture on our profile".</li>
<li><b>Keep faces and text away from the seams.</b> Lines between tiles cut through anything that sits on them.</li>
<li><b>Use a big, sharp picture.</b> A 3-row grid needs a picture at least 3240 pixels wide to stay sharp on every tile.</li>
<li><b>Don't do it too often.</b> A grid is a special moment. Several in a row can make your profile hard to browse.</li>
<li><b>Pinned posts sit on top.</b> If you pin posts, they appear first on your grid and shift the puzzle. Unpin them while the grid is fresh, or plan around them.</li>
</ul>
<div class="note">Scheduling a grid? In Capybaroar, put the tiles in your queue a few minutes apart, in number order, and they go up on their own while you get on with your day.</div>
<h2>Is the picture uploaded anywhere?</h2>
<p>No. The tiles are cut in your browser, and the ZIP file is made on your device. Nothing is sent to Capybaroar or anyone else.</p>''',
    faq=[('How do I split a picture for Instagram?', 'Drop it in this tool, pick the number of rows and the tile shape, then download the tiles. Post them in number order, starting with tile 1.'),
         ('In what order do I post grid tiles?', 'Start with tile 1, which is the bottom-right piece, and finish with the top-left piece. Instagram shows the newest post first, so the picture comes together on your profile.'),
         ('What size should grid tiles be?', 'Each tile is 1080 pixels wide. Pick 3:4 tiles (1080 × 1440) to match the profile grid, or 4:5 tiles (1080 × 1350) if you schedule your posts.'),
         ('How many posts is a grid?', 'Three per row. One row is 3 posts, two rows 6, three rows 9 and four rows 12.'),
         ('Why doesn\'t my grid line up?', 'Usually a post went up in the wrong order, a pinned post shifted the grid, or the tiles were cropped by the profile view. Check the order, unpin posts and try 3:4 tiles.'),
         ('Can I schedule grid posts?', 'Yes. Schedule the tiles a few minutes apart in number order. Capybaroar can post them for you.'),
         ('Is my picture uploaded?', 'No. The tiles are made in your browser, and your picture never leaves your device.')]))
