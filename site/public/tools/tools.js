/* Capybaroar free tools. One file for every tool page: each block starts only when its own markup is on the page.
   Everything runs in the browser; nothing a person types or uploads is sent anywhere. */
(function(){
'use strict';
var $ = function(s, r){ return (r || document).querySelector(s); };
var $$ = function(s, r){ return [].slice.call((r || document).querySelectorAll(s)); };
var store = {
  get: function(k){ try { return localStorage.getItem(k); } catch (e) { return null; } },
  set: function(k, v){ try { localStorage.setItem(k, v); } catch (e) {} }
};

/* ---------- Copy and the toast ---------- */
var toastEl = null, toastT = null;
function toast(msg){
  if (!toastEl){ toastEl = document.createElement('div'); toastEl.className = 't-toast'; toastEl.setAttribute('role', 'status'); toastEl.setAttribute('aria-live', 'polite'); document.body.appendChild(toastEl); }
  toastEl.textContent = msg; toastEl.classList.add('in');
  clearTimeout(toastT); toastT = setTimeout(function(){ toastEl.classList.remove('in'); }, 1500);
}
/* Tells the Capybaroar card (promo.js) that someone got something out of the tool. */
function used(){ try { document.dispatchEvent(new CustomEvent('capy:used')); } catch (e) {} }
function copy(text, label){
  used();
  var done = function(){ toast(label || 'Copied'); };
  var fallback = function(){
    var ta = document.createElement('textarea'); ta.value = text; ta.setAttribute('readonly', ''); ta.style.position = 'fixed'; ta.style.opacity = '0';
    document.body.appendChild(ta); ta.select();
    var ok = false; try { ok = document.execCommand('copy'); } catch (e) {}
    document.body.removeChild(ta);
    toast(ok ? (label || 'Copied') : 'Press Ctrl+C to copy');
  };
  try { if (navigator.clipboard && window.isSecureContext) navigator.clipboard.writeText(text).then(done, fallback); else fallback(); } catch (e) { fallback(); }
}
function esc(s){ return String(s).replace(/[&<>"]/g, function(c){ return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
function cps(s){ return Array.from(s); }
function fmt(n){ return Number(n).toLocaleString('en-US'); }

/* ---------- Unicode text styles ---------- */
// Letters live in the Mathematical Alphanumeric Symbols block; a few letters were already in Letterlike Symbols, so the
// block has holes that point there instead.
var HOLES = { 0x1D455: 0x210E, 0x1D49D: 0x212C, 0x1D4A0: 0x2130, 0x1D4A1: 0x2131, 0x1D4A3: 0x210B, 0x1D4A4: 0x2110, 0x1D4A7: 0x2112, 0x1D4A8: 0x2133, 0x1D4AD: 0x211B,
  0x1D4BA: 0x212F, 0x1D4BC: 0x210A, 0x1D4C4: 0x2134, 0x1D506: 0x212D, 0x1D50B: 0x210C, 0x1D50C: 0x2111, 0x1D515: 0x211C, 0x1D51D: 0x2128,
  0x1D53A: 0x2102, 0x1D53F: 0x210D, 0x1D545: 0x2115, 0x1D547: 0x2119, 0x1D548: 0x211A, 0x1D549: 0x211D, 0x1D551: 0x2124 };
function block(up, lo, dg){
  return function(ch){
    var c = ch.codePointAt(0), o = null;
    if (c >= 65 && c <= 90 && up) o = up + c - 65;
    else if (c >= 97 && c <= 122 && lo) o = lo + c - 97;
    else if (c >= 48 && c <= 57 && dg) o = dg + c - 48;
    if (o === null) return ch;
    return String.fromCodePoint(HOLES[o] || o);
  };
}
function table(lower, upper, digits){
  return function(ch){
    var c = ch.codePointAt(0);
    if (c >= 97 && c <= 122 && lower) return cps(lower)[c - 97];
    if (c >= 65 && c <= 90) return upper ? cps(upper)[c - 65] : (lower ? cps(lower)[c - 65] : ch);
    if (c >= 48 && c <= 57 && digits) return cps(digits)[c - 48];
    return ch;
  };
}
function mark(m){ return function(ch){ return /\s/.test(ch) ? ch : ch + m; }; }
var CIRCLED_D = '⓪①②③④⑤⑥⑦⑧⑨';
var STYLES = {
  'bold': ['Bold', block(0x1D400, 0x1D41A, 0x1D7CE)],
  'bold-sans': ['Bold sans', block(0x1D5D4, 0x1D5EE, 0x1D7EC)],
  'italic': ['Italic', block(0x1D434, 0x1D44E, null)],
  'italic-sans': ['Italic sans', block(0x1D608, 0x1D622, null)],
  'bold-italic': ['Bold italic', block(0x1D468, 0x1D482, 0x1D7CE)],
  'bold-italic-sans': ['Bold italic sans', block(0x1D63C, 0x1D656, 0x1D7EC)],
  'script': ['Script', block(0x1D49C, 0x1D4B6, null)],
  'bold-script': ['Bold script', block(0x1D4D0, 0x1D4EA, 0x1D7CE)],
  'fraktur': ['Gothic', block(0x1D504, 0x1D51E, null)],
  'bold-fraktur': ['Bold gothic', block(0x1D56C, 0x1D586, 0x1D7CE)],
  'double': ['Outline', block(0x1D538, 0x1D552, 0x1D7D8)],
  'sans': ['Sans', block(0x1D5A0, 0x1D5BA, 0x1D7E2)],
  'mono': ['Typewriter', block(0x1D670, 0x1D68A, 0x1D7F6)],
  'wide': ['Wide', block(0xFF21, 0xFF41, 0xFF10)],
  'circled': ['Bubbles', function(ch){ var c = ch.codePointAt(0); if (c >= 48 && c <= 57) return cps(CIRCLED_D)[c - 48]; return block(0x24B6, 0x24D0, null)(ch); }],
  'circled-dark': ['Dark bubbles', function(ch){ var c = ch.codePointAt(0); if (c >= 97 && c <= 122) c -= 32; return c >= 65 && c <= 90 ? String.fromCodePoint(0x1F150 + c - 65) : ch; }],
  'squared': ['Squares', function(ch){ var c = ch.codePointAt(0); if (c >= 97 && c <= 122) c -= 32; return c >= 65 && c <= 90 ? String.fromCodePoint(0x1F130 + c - 65) : ch; }],
  'squared-dark': ['Dark squares', function(ch){ var c = ch.codePointAt(0); if (c >= 97 && c <= 122) c -= 32; return c >= 65 && c <= 90 ? String.fromCodePoint(0x1F170 + c - 65) : ch; }],
  'small-caps': ['Small caps', table('ᴀʙᴄᴅᴇꜰɢʜɪᴊᴋʟᴍɴᴏᴘǫʀꜱᴛᴜᴠᴡxʏᴢ', null, null)],
  'superscript': ['Tiny', table('ᵃᵇᶜᵈᵉᶠᵍʰⁱʲᵏˡᵐⁿᵒᵖᑫʳˢᵗᵘᵛʷˣʸᶻ', 'ᴬᴮᶜᴰᴱᶠᴳᴴᴵᴶᴷᴸᴹᴺᴼᴾQᴿˢᵀᵁⱽᵂˣʸᶻ', '⁰¹²³⁴⁵⁶⁷⁸⁹')],
  'subscript': ['Subscript', table('ₐbcdₑfgₕᵢⱼₖₗₘₙₒₚqᵣₛₜᵤᵥwₓyz', null, '₀₁₂₃₄₅₆₇₈₉')],
  'strike': ['Strikethrough', mark('̶')],
  'strike-short': ['Short strike', mark('̵')],
  'slash': ['Slashed', mark('̸')],
  'cross': ['Crossed', mark('̽')],
  'underline': ['Underline', mark('̲')],
  'underline-double': ['Double underline', mark('̳')],
  'overline': ['Overline', mark('̅')],
  'upside': ['Upside down', null],
  'reverse': ['Backwards', null],
  'mirror': ['Mirror', null]
};
var FLIP = { a: 'ɐ', b: 'q', c: 'ɔ', d: 'p', e: 'ǝ', f: 'ɟ', g: 'ƃ', h: 'ɥ', i: 'ᴉ', j: 'ɾ', k: 'ʞ', l: 'l', m: 'ɯ', n: 'u', o: 'o', p: 'd', q: 'b', r: 'ɹ', s: 's', t: 'ʇ', u: 'n', v: 'ʌ', w: 'ʍ', x: 'x', y: 'ʎ', z: 'z',
  A: '∀', B: 'ᗺ', C: 'Ɔ', D: 'ᗡ', E: 'Ǝ', F: 'Ⅎ', G: '⅁', H: 'H', I: 'I', J: 'ſ', K: 'ʞ', L: '˥', M: 'W', N: 'N', O: 'O', P: 'Ԁ', Q: 'Ό', R: 'ᴚ', S: 'S', T: '⊥', U: '∩', V: 'Λ', W: 'M', X: 'X', Y: '⅄', Z: 'Z',
  '1': 'Ɩ', '2': 'ᄅ', '3': 'Ɛ', '4': 'ㄣ', '5': 'ϛ', '6': '9', '7': 'ㄥ', '8': '8', '9': '6', '0': '0', '.': '˙', ',': '\'', '\'': ',', '"': '„', '!': '¡', '?': '¿', '(': ')', ')': '(', '[': ']', ']': '[', '{': '}', '}': '{', '<': '>', '>': '<', '&': '⅋', '_': '‾' };
var MIRROR = { a: 'ɒ', b: 'd', c: 'ɔ', d: 'b', e: 'ɘ', f: 'ꟻ', g: 'ǫ', h: 'ʜ', j: 'ꞁ', k: 'ʞ', p: 'q', q: 'p', r: 'ɿ', s: 'ƨ', t: 'ƚ', y: 'ʏ', z: 'ƹ', B: 'ᙠ', C: 'Ɔ', D: 'ᗡ', E: 'Ǝ', F: 'ꟻ', G: 'Ꭾ', J: 'Ⴑ', K: 'ꓘ', L: '⅃', N: 'И', P: 'ꟼ', Q: 'Ọ', R: 'Я', S: 'Ƨ', Z: 'Ƹ', '(': ')', ')': '(', '[': ']', ']': '[', '{': '}', '}': '{', '<': '>', '>': '<', '?': '⸮' };
function styleText(key, s){
  if (key === 'upside') return cps(s).map(function(ch){ return FLIP[ch] || ch; }).reverse().join('');
  if (key === 'reverse') return cps(s).reverse().join('');
  if (key === 'mirror') return cps(s).map(function(ch){ return MIRROR[ch] || ch; }).reverse().join('');
  var f = STYLES[key][1];
  return cps(s).map(f).join('');
}
// Styled letters back to plain ones, for "remove formatting" and for counting.
var PLAIN = null;
function plainMap(){
  if (PLAIN) return PLAIN;
  PLAIN = {};
  var src = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  Object.keys(STYLES).forEach(function(k){
    var f = STYLES[k][1]; if (!f || k === 'strike' || k.indexOf('line') > -1 || k === 'slash' || k === 'cross' || k === 'strike-short') return;
    // Skip plain ASCII results (a style with no capitals maps G to g): only real styled characters go back.
    cps(src).forEach(function(ch){ var o = f(ch); if (o !== ch && !/^[A-Za-z0-9]$/.test(o) && !PLAIN[o]) PLAIN[o] = ch; });
  });
  return PLAIN;
}
function unstyle(s){
  var m = plainMap();
  return cps(s.replace(/[̵̶̸̲̳̅̽]/g, '')).map(function(ch){ return m[ch] || ch; }).join('');
}
var FRAMES = [['꧁', '꧂'], ['★ ', ' ★'], ['『', '』'], ['【', '】'], ['✿ ', ' ✿'], ['•°• ', ' •°•'], ['⋆｡˚ ', ' ˚｡⋆'], ['»» ', ' ««'], ['☆彡 ', ' ミ☆'], ['▁ ▂ ▄ ', ' ▄ ▂ ▁'], ['⟦', '⟧'], ['◥◣ ', ' ◢◤']];

/* A list of styled versions of what the person types, each with its own Copy button. */
function styleList(root){
  var input = $('[data-input]', root), list = $('[data-list]', root);
  var keys = (root.dataset.styles || '').split(',').filter(Boolean);
  var frames = root.dataset.frames === '1';
  var demo = root.dataset.demo || 'Your text here';
  var rows = [];
  keys.forEach(function(k){ rows.push({ name: STYLES[k][0], make: function(s){ return styleText(k, s); } }); });
  if (frames) FRAMES.forEach(function(fr, i){
    var inner = ['bold-script', 'small-caps', 'fraktur', 'italic', 'double', 'circled', 'script', 'bold', 'mono', 'wide', 'bold-italic', 'sans'][i];
    rows.push({ name: 'Framed ' + (i + 1), make: function(s){ return fr[0] + styleText(inner, s) + fr[1]; } });
  });
  list.innerHTML = rows.map(function(r, i){ return '<li class="t-row"><span class="t-name">' + esc(r.name) + '</span><span class="t-out" data-i="' + i + '"></span><button class="t-copy" type="button" data-i="' + i + '" aria-label="Copy ' + esc(r.name) + '"><svg class="ico" aria-hidden="true"><use href="#i-copy"/></svg><span>Copy</span></button></li>'; }).join('');
  var outs = $$('.t-out', list);
  function render(){
    var s = input.value || demo;
    rows.forEach(function(r, i){ outs[i].textContent = r.make(s); });
  }
  input.addEventListener('input', render);
  list.addEventListener('click', function(e){
    var b = e.target.closest('.t-copy'); if (!b) return;
    var txt = outs[+b.dataset.i].textContent;
    copy(txt, 'Copied ' + rows[+b.dataset.i].name.toLowerCase());
  });
  render();
}
$$('[data-tool="styles"]').forEach(styleList);

/* ---------- Glitch text ---------- */
(function(){
  var root = $('[data-tool="glitch"]'); if (!root) return;
  function range(a, b){ var o = []; for (var i = a; i <= b; i++) o.push(i); return o; }
  var UP = [].concat(range(0x0300, 0x0315), range(0x033D, 0x0344), [0x0346], range(0x034A, 0x034C), range(0x0350, 0x0352), [0x0357, 0x035B], range(0x0363, 0x036F));
  var DOWN = [].concat(range(0x0316, 0x0319), range(0x031C, 0x0333), range(0x0339, 0x033C), [0x0345], range(0x0347, 0x0349), [0x034D, 0x034E], range(0x0353, 0x0356), [0x0359, 0x035A]);
  var MID = [0x0334, 0x0335, 0x0336, 0x0337, 0x0338, 0x0315, 0x031B, 0x0340, 0x0341, 0x0358, 0x0321, 0x0322, 0x0327, 0x0328];
  var input = $('[data-input]', root), out = $('[data-out]', root), lvl = $('[data-level]', root), lvlOut = $('[data-level-out]', root), seed = 1;
  var dirs = { up: true, mid: true, down: true };
  function rnd(){ seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; }
  function render(){
    var level = +lvl.value; lvlOut.textContent = level;
    var s0 = seed, s = input.value || 'Glitch text';
    var res = cps(s).map(function(ch){
      if (/\s/.test(ch)) return ch;
      var add = '';
      [['up', UP], ['mid', MID], ['down', DOWN]].forEach(function(d){
        if (!dirs[d[0]]) return;
        var n = Math.round(rnd() * level * (d[0] === 'mid' ? 0.4 : 1));
        for (var i = 0; i < n; i++) add += String.fromCodePoint(d[1][Math.floor(rnd() * d[1].length)]);
      });
      return ch + add;
    }).join('');
    seed = s0;
    out.textContent = res;
  }
  input.addEventListener('input', render); lvl.addEventListener('input', render);
  $$('[data-dir]', root).forEach(function(b){ b.addEventListener('click', function(){ dirs[b.dataset.dir] = !dirs[b.dataset.dir]; b.setAttribute('aria-pressed', dirs[b.dataset.dir]); render(); }); });
  $('[data-reroll]', root).addEventListener('click', function(){ seed = Math.floor(Math.random() * 2147483646) + 1; render(); });
  $('[data-copy]', root).addEventListener('click', function(){ copy(out.textContent, 'Copied glitch text'); });
  render();
})();

/* ---------- LinkedIn text formatter ---------- */
(function(){
  var root = $('[data-tool="linkedin"]'); if (!root) return;
  var ta = $('[data-input]', root), prev = $('[data-preview]', root), cnt = $('[data-count]', root), bar = $('[data-bar]', root), more = $('[data-more]', root), LIMIT = 3000, FOLD = 210;
  function apply(fn){
    var a = ta.selectionStart, b = ta.selectionEnd;
    if (a === b){ toast('Select some text first'); ta.focus(); return; }
    var sel = ta.value.slice(a, b), out = fn(sel);
    ta.setRangeText(out, a, b, 'select'); ta.focus(); update();
  }
  function lines(fn){
    var a = ta.selectionStart, b = ta.selectionEnd, v = ta.value;
    var s = v.lastIndexOf('\n', a - 1) + 1, e = v.indexOf('\n', b); if (e < 0) e = v.length;
    var block = v.slice(s, e).split('\n').map(fn).join('\n');
    ta.setRangeText(block, s, e, 'select'); ta.focus(); update();
  }
  var actions = {
    bold: function(){ apply(function(s){ return styleText('bold-sans', unstyle(s)); }); },
    italic: function(){ apply(function(s){ return styleText('italic-sans', unstyle(s)); }); },
    'bold-italic': function(){ apply(function(s){ return styleText('bold-italic-sans', unstyle(s)); }); },
    underline: function(){ apply(function(s){ return styleText('underline', unstyle(s)); }); },
    strike: function(){ apply(function(s){ return styleText('strike', unstyle(s)); }); },
    mono: function(){ apply(function(s){ return styleText('mono', unstyle(s)); }); },
    bullets: function(){ lines(function(l){ return l.trim() ? '• ' + l.replace(/^(\s*[•▪→✓]\s|\s*\d+\.\s)/, '') : l; }); },
    arrows: function(){ lines(function(l){ return l.trim() ? '→ ' + l.replace(/^(\s*[•▪→✓]\s|\s*\d+\.\s)/, '') : l; }); },
    numbers: function(){ var n = 0; lines(function(l){ return l.trim() ? (++n) + '. ' + l.replace(/^(\s*[•▪→✓]\s|\s*\d+\.\s)/, '') : l; }); },
    clear: function(){ var a = ta.selectionStart, b = ta.selectionEnd; if (a === b){ ta.value = unstyle(ta.value); update(); return; } apply(unstyle); }
  };
  $$('[data-act]', root).forEach(function(b){ b.addEventListener('click', function(){ actions[b.dataset.act](); }); });
  ta.addEventListener('keydown', function(e){
    if (!(e.ctrlKey || e.metaKey)) return;
    var k = e.key.toLowerCase();
    if (k === 'b'){ e.preventDefault(); actions.bold(); } else if (k === 'i'){ e.preventDefault(); actions.italic(); } else if (k === 'u'){ e.preventDefault(); actions.underline(); }
  });
  function update(){
    var v = ta.value, n = cps(v).length;
    cnt.textContent = fmt(n) + ' / ' + fmt(LIMIT);
    cnt.classList.toggle('over', n > LIMIT);
    bar.style.width = Math.min(100, n / LIMIT * 100) + '%';
    bar.classList.toggle('over', n > LIMIT);
    var shown = v, cut = false, c = cps(v);
    if (c.length > FOLD || v.split('\n').length > 3){
      var firstLines = v.split('\n').slice(0, 3).join('\n');
      shown = cps(firstLines).slice(0, FOLD).join('').replace(/\s+\S*$/, '');
      cut = shown.length < v.length;
    }
    prev.textContent = (cut ? shown : v) || 'Your post shows here.';
    more.hidden = !cut;
    store.set('li-draft', v);
  }
  more.addEventListener('click', function(){ prev.textContent = ta.value; more.hidden = true; });
  $('[data-copy]', root).addEventListener('click', function(){ if (!ta.value.trim()){ toast('Write your post first'); return; } copy(ta.value, 'Copied. Paste it into LinkedIn'); });
  var saved = store.get('li-draft'); if (saved) ta.value = saved;
  ta.addEventListener('input', update); update();
})();

/* ---------- Character counter ---------- */
(function(){
  var root = $('[data-tool="counter"]'); if (!root) return;
  var ta = $('[data-input]', root), nets = $$('[data-limit]', root);
  var seg = (window.Intl && Intl.Segmenter) ? new Intl.Segmenter(undefined, { granularity: 'grapheme' }) : null;
  var wseg = (window.Intl && Intl.Segmenter) ? new Intl.Segmenter(undefined, { granularity: 'word' }) : null;
  var EMOJI = /\p{Extended_Pictographic}/u;
  function graphemes(s){ return seg ? Array.from(seg.segment(s), function(x){ return x.segment; }) : cps(s); }
  // X counts most characters as 2 and Latin, punctuation and a few spaces as 1; every link counts as 23 and every
  // emoji as 2 (X's open counting rules, twitter-text v3).
  var URL_RE = /\bhttps?:\/\/[^\s]+|\b(?:[a-z0-9-]+\.)+(?:com|net|org|io|co|ai|app|dev|me|ly|gg|tv|xyz|info|biz|us|uk|ca|de|fr|es|it|nl|au|in)(?:\/[^\s]*)?/gi;
  function xWeight(s){
    var n = 0, rest = s.replace(URL_RE, function(){ n += 23; return ''; });
    graphemes(rest).forEach(function(g){
      if (EMOJI.test(g)) { n += 2; return; }
      cps(g).forEach(function(ch){
        var c = ch.codePointAt(0);
        n += (c <= 4351 || (c >= 8192 && c <= 8205) || (c >= 8208 && c <= 8223) || (c >= 8242 && c <= 8247)) ? 1 : 2;
      });
    });
    return n;
  }
  var stat = {}; $$('[data-stat]', root).forEach(function(el){ stat[el.dataset.stat] = el; });
  function update(){
    var v = ta.value, g = graphemes(v);
    stat.chars.textContent = fmt(g.length);
    stat.nospace.textContent = fmt(g.filter(function(x){ return !/\s/.test(x); }).length);
    stat.words.textContent = fmt(wseg ? Array.from(wseg.segment(v)).filter(function(x){ return x.isWordLike; }).length : (v.trim() ? v.trim().split(/\s+/).length : 0));
    stat.lines.textContent = fmt(v ? v.split('\n').length : 0);
    stat.emoji.textContent = fmt(g.filter(function(x){ return EMOJI.test(x); }).length);
    stat.hashtags.textContent = fmt((v.match(/(^|\s)#[\p{L}\p{N}_]+/gu) || []).length);
    stat.mentions.textContent = fmt((v.match(/(^|\s)@[\w.]+/g) || []).length);
    stat.links.textContent = fmt((v.match(URL_RE) || []).length);
    nets.forEach(function(row){
      var lim = +row.dataset.limit, how = row.dataset.how, n;
      if (how === 'x') n = xWeight(v);
      else if (how === 'bytes') n = new TextEncoder().encode(v).length;
      else if (how === 'g') n = graphemes(v).length;
      else n = cps(v).length;
      $('[data-n]', row).textContent = fmt(n);
      var pct = Math.min(100, n / lim * 100);
      var b = $('[data-b]', row); b.style.width = pct + '%';
      row.classList.toggle('over', n > lim); row.classList.toggle('near', n <= lim && n > lim * 0.9);
      $('[data-left]', row).textContent = n > lim ? fmt(n - lim) + ' over' : fmt(lim - n) + ' left';
    });
    store.set('cc-draft', v);
  }
  var saved = store.get('cc-draft'); if (saved) ta.value = saved;
  ta.addEventListener('input', update);
  $('[data-clear]', root).addEventListener('click', function(){ ta.value = ''; update(); ta.focus(); });
  $('[data-copy]', root).addEventListener('click', function(){ copy(ta.value, 'Copied your text'); });
  update();
})();

/* ---------- Invisible characters ---------- */
(function(){
  var root = $('[data-tool="invisible"]'); if (!root) return;
  root.addEventListener('click', function(e){
    var b = e.target.closest('[data-char]'); if (!b) return;
    var n = Math.max(1, +(($('[data-times]', root) || {}).value || 1));
    copy(String.fromCodePoint(parseInt(b.dataset.char, 16)).repeat(n), 'Copied ' + b.dataset.name + (n > 1 ? ' × ' + n : ''));
  });
  var det = $('[data-detect]', root), out = $('[data-found]', root);
  if (det){
    var NAMES = { '200B': 'zero width space', '200C': 'zero width non-joiner', '200D': 'zero width joiner', '2060': 'word joiner', 'FEFF': 'zero width no-break space', '3164': 'Hangul filler', '2800': 'Braille blank',
      'FFA0': 'halfwidth Hangul filler', '00A0': 'no-break space', '2002': 'en space', '2003': 'em space', '2007': 'figure space', '2009': 'thin space', '200A': 'hair space', '3000': 'ideographic space', '115F': 'Hangul choseong filler', '1160': 'Hangul jungseong filler', '00AD': 'soft hyphen' };
    det.addEventListener('input', function(){
      var found = {};
      cps(det.value).forEach(function(ch){ var h = ch.codePointAt(0).toString(16).toUpperCase().padStart(4, '0'); if (NAMES[h]) found[h] = (found[h] || 0) + 1; });
      var keys = Object.keys(found);
      out.innerHTML = keys.length ? keys.map(function(k){ return '<li><code>U+' + k + '</code> ' + NAMES[k] + ' <b>× ' + found[k] + '</b></li>'; }).join('') : (det.value ? '<li>No hidden characters found.</li>' : '');
    });
    $('[data-clean]', root).addEventListener('click', function(){
      var clean = det.value.replace(/[​‌⁠﻿ㅤ⠀ﾠᅟᅠ­]/g, '').replace(/[      　]/g, ' ');
      det.value = clean; det.dispatchEvent(new Event('input')); copy(clean, 'Copied the cleaned text');
    });
  }
})();

/* ---------- UTM builder ---------- */
(function(){
  var root = $('[data-tool="utm"]'); if (!root) return;
  var f = {}; $$('[data-f]', root).forEach(function(el){ f[el.dataset.f] = el; });
  var out = $('[data-out]', root), err = $('[data-err]', root), low = $('[data-lower]', root);
  function clean(v){ v = v.trim().replace(/\s+/g, '_'); return low.getAttribute('aria-checked') === 'true' ? v.toLowerCase() : v; }
  function update(){
    var raw = f.url.value.trim(); err.textContent = '';
    if (!raw){ out.textContent = 'Your link shows here.'; out.classList.add('empty'); return; }
    if (!/^https?:\/\//i.test(raw)) raw = 'https://' + raw;
    var u; try { u = new URL(raw); } catch (e) { err.textContent = 'Enter a full web address, like https://example.com/page'; out.textContent = ''; return; }
    ['source', 'medium', 'campaign', 'term', 'content'].forEach(function(k){ var v = clean(f[k].value); if (v) u.searchParams.set('utm_' + k, v); else u.searchParams.delete('utm_' + k); });
    if (!f.source.value.trim() || !f.medium.value.trim() || !f.campaign.value.trim()) err.textContent = 'Add a source, medium and campaign so your analytics can group the visits.';
    out.textContent = u.toString(); out.classList.remove('empty');
    store.set('utm', JSON.stringify({ url: f.url.value, campaign: f.campaign.value }));
  }
  $$('[data-preset]', root).forEach(function(b){
    b.addEventListener('click', function(){
      var p = b.dataset.preset.split('|'); f.source.value = p[0]; f.medium.value = p[1];
      $$('[data-preset]', root).forEach(function(x){ x.setAttribute('aria-pressed', x === b); });
      update();
    });
  });
  low.addEventListener('click', function(){ low.setAttribute('aria-checked', low.getAttribute('aria-checked') !== 'true'); update(); });
  Object.keys(f).forEach(function(k){ f[k].addEventListener('input', update); });
  $('[data-copy]', root).addEventListener('click', function(){ if (out.classList.contains('empty') || !out.textContent) { toast('Add your link first'); return; } copy(out.textContent, 'Copied your tracking link'); });
  try { var s = JSON.parse(store.get('utm') || 'null'); if (s){ f.url.value = s.url || ''; f.campaign.value = s.campaign || ''; } } catch (e) {}
  update();
})();

/* ---------- YouTube money calculator ---------- */
(function(){
  var root = $('[data-tool="ytmoney"]'); if (!root) return;
  var views = $('[data-views]', root), viewsOut = $('[data-views-out]', root), lo = $('[data-lo]', root), hi = $('[data-hi]', root), kind = 'long';
  var DEF = root.dataset.def ? JSON.parse(root.dataset.def) : { long: [1.5, 6], shorts: [0.02, 0.1] };
  var out = {}; $$('[data-r]', root).forEach(function(el){ out[el.dataset.r] = el; });
  function money(n){ return n >= 10 ? '$' + fmt(Math.round(n)) : '$' + n.toFixed(2); }
  // The slider moves on a log scale so 1,000 and 10 million views are both easy to pick.
  function viewsFromSlider(v){ return Math.round(Math.pow(10, 3 + v / 100 * 5) / 100) * 100; }
  function sliderFromViews(n){ return Math.max(0, Math.min(100, (Math.log10(Math.max(1000, n)) - 3) / 5 * 100)); }
  var monthly = 100000;
  function update(){
    var l = Math.max(0, parseFloat(lo.value) || 0), h = Math.max(l, parseFloat(hi.value) || 0);
    viewsOut.value = fmt(monthly);
    var mLo = monthly / 1000 * l, mHi = monthly / 1000 * h;
    out.day.textContent = money(mLo / 30) + ' to ' + money(mHi / 30);
    out.month.textContent = money(mLo) + ' to ' + money(mHi);
    out.year.textContent = money(mLo * 12) + ' to ' + money(mHi * 12);
  }
  views.addEventListener('input', function(){ monthly = viewsFromSlider(+views.value); update(); });
  viewsOut.addEventListener('change', function(){ var n = parseInt(String(viewsOut.value).replace(/[^\d]/g, ''), 10); if (n > 0){ monthly = n; views.value = sliderFromViews(n); } update(); });
  [lo, hi].forEach(function(i){ i.addEventListener('input', update); });
  $$('[data-kind]', root).forEach(function(b){
    b.addEventListener('click', function(){
      kind = b.dataset.kind; $$('[data-kind]', root).forEach(function(x){ x.setAttribute('aria-pressed', x === b); });
      lo.value = DEF[kind][0]; hi.value = DEF[kind][1]; update();
    });
  });
  views.value = sliderFromViews(monthly); update();
})();

/* ---------- Best time to post: your audience's hours in your own time ---------- */
(function(){
  var root = $('[data-tool="besttime"]'); if (!root) return;
  var mine = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
  var zones = (Intl.supportedValuesOf ? Intl.supportedValuesOf('timeZone') : ['UTC', 'America/New_York', 'America/Chicago', 'America/Denver', 'America/Los_Angeles', 'Europe/London', 'Europe/Paris', 'Europe/Berlin', 'Asia/Tokyo', 'Asia/Singapore', 'Australia/Sydney', 'Asia/Kolkata']);
  var input = $('[data-zone]', root), list = $('[data-zones]', root), times = $('[data-times]', root), table = $('[data-table]', root), mineEl = $('[data-mine]', root);
  var audience = store.get('bt-zone') || 'America/New_York';
  var hours = [8, 12, 18];
  try { var h = JSON.parse(store.get('bt-hours') || 'null'); if (Array.isArray(h) && h.length) hours = h; } catch (e) {}
  mineEl.textContent = mine.replace(/_/g, ' ');
  function label(z){ return z.replace(/_/g, ' ').replace(/\//g, ' / '); }
  function offsetMin(zone, at){
    var p = {}; new Intl.DateTimeFormat('en-US', { timeZone: zone, hourCycle: 'h23', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }).formatToParts(at).forEach(function(x){ p[x.type] = x.value; });
    return (Date.UTC(+p.year, +p.month - 1, +p.day, +p.hour % 24, +p.minute) - Math.floor(at.getTime() / 60000) * 60000) / 60000;
  }
  function hourLabel(h){ var am = h < 12; var hh = h % 12 || 12; return hh + ':00 ' + (am ? 'AM' : 'PM'); }
  function render(){
    input.value = label(audience);
    times.innerHTML = hours.map(function(h, i){ return '<span class="bt-h"><button type="button" data-step="-1" data-i="' + i + '" aria-label="Earlier">−</button><b>' + hourLabel(h) + '</b><button type="button" data-step="1" data-i="' + i + '" aria-label="Later">+</button><button type="button" class="bt-x" data-rm="' + i + '" aria-label="Remove ' + hourLabel(h) + '">×</button></span>'; }).join('') + (hours.length < 5 ? '<button type="button" class="pill" data-add><svg class="ico" aria-hidden="true"><use href="#i-plus"/></svg>Add a time</button>' : '');
    var now = new Date(), diff = offsetMin(mine, now) - offsetMin(audience, now);
    var rows = hours.slice().sort(function(a, b){ return a - b; }).map(function(h){
      var mins = h * 60 + diff, dayShift = Math.floor(mins / 1440), m = ((mins % 1440) + 1440) % 1440;
      var t = new Date(Date.UTC(2000, 0, 1, Math.floor(m / 60), m % 60)).toLocaleTimeString('en-US', { timeZone: 'UTC', hour: 'numeric', minute: '2-digit' });
      var note = dayShift > 0 ? ' <span class="badge">next day</span>' : dayShift < 0 ? ' <span class="badge">day before</span>' : '';
      return '<tr><th scope="row">' + hourLabel(h) + '</th><td><b>' + t + '</b>' + note + '</td></tr>';
    }).join('');
    var dh = diff / 60, sign = dh > 0 ? 'ahead of' : 'behind';
    table.innerHTML = '<caption>' + (diff === 0 ? 'You and your audience share a time zone.' : 'You are ' + Math.abs(dh) + ' hour' + (Math.abs(dh) === 1 ? '' : 's') + ' ' + sign + ' your audience.') + '</caption><thead><tr><th scope="col">Their time</th><th scope="col">Your time</th></tr></thead><tbody>' + rows + '</tbody>';
    store.set('bt-zone', audience); store.set('bt-hours', JSON.stringify(hours));
  }
  times.addEventListener('click', function(e){
    var b = e.target.closest('button'); if (!b) return;
    if (b.hasAttribute('data-add')){ hours.push((hours[hours.length - 1] + 3) % 24); }
    else if (b.dataset.rm !== undefined){ if (hours.length > 1) hours.splice(+b.dataset.rm, 1); }
    else if (b.dataset.step){ var i = +b.dataset.i; hours[i] = (hours[i] + (+b.dataset.step) + 24) % 24; }
    render();
  });
  function showList(q){
    q = (q || '').toLowerCase().replace(/\s+/g, ' ').trim();
    var hits = zones.filter(function(z){ return !q || label(z).toLowerCase().indexOf(q) > -1; }).slice(0, 40);
    list.innerHTML = hits.length ? hits.map(function(z){ return '<li role="option" tabindex="-1" data-z="' + esc(z) + '">' + esc(label(z)) + '</li>'; }).join('') : '<li class="none">No matching time zone</li>';
    list.hidden = false; input.setAttribute('aria-expanded', 'true');
  }
  function hideList(){ list.hidden = true; input.setAttribute('aria-expanded', 'false'); }
  input.addEventListener('focus', function(){ input.select(); showList(''); });
  input.addEventListener('input', function(){ showList(input.value); });
  input.addEventListener('keydown', function(e){
    var items = $$('[data-z]', list), cur = list.querySelector('.on'), i = items.indexOf(cur);
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp'){ e.preventDefault(); if (list.hidden) showList(input.value); items = $$('[data-z]', list); i = e.key === 'ArrowDown' ? Math.min(items.length - 1, i + 1) : Math.max(0, i - 1); items.forEach(function(x, k){ x.classList.toggle('on', k === i); }); if (items[i]) items[i].scrollIntoView({ block: 'nearest' }); }
    else if (e.key === 'Enter'){ e.preventDefault(); var pick = cur || items[0]; if (pick){ audience = pick.dataset.z; hideList(); render(); } }
    else if (e.key === 'Escape'){ hideList(); input.value = label(audience); }
  });
  list.addEventListener('mousedown', function(e){ var li = e.target.closest('[data-z]'); if (!li) return; e.preventDefault(); audience = li.dataset.z; hideList(); input.blur(); render(); });
  input.addEventListener('blur', function(){ setTimeout(function(){ hideList(); input.value = label(audience); }, 120); });
  $$('[data-quick]', root).forEach(function(b){ b.addEventListener('click', function(){ audience = b.dataset.quick; render(); }); });
  render();
})();

/* ---------- Images: load, fit, export ---------- */
function loadImage(file, cb){
  if (!file || !/^image\//.test(file.type)){ toast('Pick a picture file (JPG, PNG, WebP or GIF)'); return; }
  var url = URL.createObjectURL(file), img = new Image();
  img.onload = function(){ cb(img, file); };
  img.onerror = function(){ toast('This picture could not be opened'); };
  img.src = url;
}
function dropZone(zone, input, cb){
  zone.addEventListener('click', function(e){ if (e.target === input) return; input.click(); });
  zone.addEventListener('keydown', function(e){ if (e.key === 'Enter' || e.key === ' '){ e.preventDefault(); input.click(); } });
  input.addEventListener('change', function(){ if (input.files[0]) loadImage(input.files[0], cb); });
  ['dragenter', 'dragover'].forEach(function(t){ zone.addEventListener(t, function(e){ e.preventDefault(); zone.classList.add('drag'); }); });
  ['dragleave', 'drop'].forEach(function(t){ zone.addEventListener(t, function(e){ e.preventDefault(); zone.classList.remove('drag'); }); });
  zone.addEventListener('drop', function(e){ var f = e.dataTransfer.files[0]; if (f) loadImage(f, cb); });
  document.addEventListener('paste', function(e){ var it = [].slice.call((e.clipboardData || {}).items || []).filter(function(x){ return x.type.indexOf('image') === 0; })[0]; if (it) loadImage(it.getAsFile(), cb); });
}
/** Draw img into a w×h canvas: crop to fill around a focus point, or fit inside on a color or a blurred copy. */
function render(img, w, h, mode, fx, fy, fill){
  var c = document.createElement('canvas'); c.width = w; c.height = h;
  var x = c.getContext('2d'); x.imageSmoothingQuality = 'high';
  var iw = img.naturalWidth, ih = img.naturalHeight;
  if (mode === 'crop'){
    var s = Math.max(w / iw, h / ih), sw = w / s, sh = h / s;
    var sx = Math.max(0, Math.min(iw - sw, iw * fx - sw / 2)), sy = Math.max(0, Math.min(ih - sh, ih * fy - sh / 2));
    x.drawImage(img, sx, sy, sw, sh, 0, 0, w, h);
  } else {
    if (fill === 'blur'){
      var s2 = Math.max(w / iw, h / ih);
      x.filter = 'blur(' + Math.round(Math.max(w, h) / 30) + 'px) brightness(0.9)';
      x.drawImage(img, (w - iw * s2) / 2 - 20, (h - ih * s2) / 2 - 20, iw * s2 + 40, ih * s2 + 40);
      x.filter = 'none';
    } else { x.fillStyle = fill; x.fillRect(0, 0, w, h); }
    var s3 = Math.min(w / iw, h / ih), dw = iw * s3, dh = ih * s3;
    x.drawImage(img, (w - dw) / 2, (h - dh) / 2, dw, dh);
  }
  return c;
}
function toBlob(canvas, type, q){ return new Promise(function(res){ canvas.toBlob(res, type, q); }); }
function save(blob, name){
  used();
  var a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = name; document.body.appendChild(a); a.click();
  setTimeout(function(){ URL.revokeObjectURL(a.href); a.remove(); }, 2000);
}
function kb(n){ return n >= 1048576 ? (n / 1048576).toFixed(2) + ' MB' : Math.round(n / 1024) + ' KB'; }
function gcd(a, b){ return b ? gcd(b, a % b) : a; }
function ratioLabel(w, h){
  var r = w / h, known = [[1, 1], [4, 5], [3, 4], [9, 16], [16, 9], [1.91, 1], [3, 2], [2, 3], [4, 3], [21, 9]];
  for (var i = 0; i < known.length; i++){ if (Math.abs(r - known[i][0] / known[i][1]) < 0.012) return known[i][0] + ':' + known[i][1]; }
  var g = gcd(w, h); return (w / g) + ':' + (h / g);
}

/* A resizer: the picture, a format picker, crop or fit, a focus point and a download. Used by the Instagram and YouTube pages. */
(function(){
  $$('[data-tool="resize"]').forEach(function(root){
    var zone = $('[data-drop]', root), file = $('input[type=file]', root), stage = $('[data-stage]', root), info = $('[data-info]', root), checks = $('[data-checks]', root);
    var fmts = $$('[data-fmt]', root), modes = $$('[data-mode]', root), fills = $$('[data-fill]', root), dl = $('[data-download]', root);
    var maxBytes = +(root.dataset.maxBytes || 0), prefix = root.dataset.name || 'image';
    var img = null, src = null, W = 0, H = 0, mode = 'crop', fill = '#ffffff', fx = 0.5, fy = 0.5, fmtName = '';
    function pick(b){ fmts.forEach(function(x){ x.setAttribute('aria-pressed', x === b); }); W = +b.dataset.w; H = +b.dataset.h; fmtName = b.dataset.fmt; draw(); }
    fmts.forEach(function(b){ b.addEventListener('click', function(){ pick(b); }); });
    modes.forEach(function(b){ b.addEventListener('click', function(){ mode = b.dataset.mode; modes.forEach(function(x){ x.setAttribute('aria-pressed', x === b); }); root.classList.toggle('fit', mode === 'fit'); draw(); }); });
    fills.forEach(function(b){ b.addEventListener('click', function(){ fill = b.dataset.fill; fills.forEach(function(x){ x.setAttribute('aria-pressed', x === b); }); draw(); }); });
    function draw(){
      if (!img){ dl.disabled = true; return; }
      var c = render(img, W, H, mode, fx, fy, fill);
      c.className = 'rs-canvas'; c.setAttribute('role', 'img'); c.setAttribute('aria-label', 'Preview at ' + W + ' by ' + H);
      stage.innerHTML = ''; stage.appendChild(c); stage.style.aspectRatio = W + ' / ' + H;
      // Tall formats would hit the height cap and leave empty sides; size the frame to the picture instead.
      stage.style.maxWidth = Math.round(560 * W / H) + 'px';
      zones();
      stage.classList.toggle('can-move', mode === 'crop');
      dl.disabled = false;
    }
    var views = root.dataset.views ? JSON.parse(root.dataset.views) : null, zBtn = $('[data-zones]', root), showZones = true;
    if (zBtn) zBtn.addEventListener('click', function(){ showZones = !showZones; zBtn.setAttribute('aria-pressed', showZones); zones(); });
    function zones(){
      var old = $('.rs-zones', stage); if (old) old.remove();
      if (!views || !showZones || !img) return;
      var list = views[fmtName] || views['*']; if (!list) return;
      var box = document.createElement('div'); box.className = 'rs-zones'; box.setAttribute('aria-hidden', 'true');
      list.forEach(function(v){
        var el = document.createElement('div'), x, y, w, h;
        if (v.ratio){ var r = W / H; if (v.ratio < r){ w = v.ratio / r; h = 1; } else { w = 1; h = r / v.ratio; } x = (1 - w) / 2; y = (1 - h) / 2; }
        else if (v.circle){ var rw = v.circle[2] * H / W; w = rw * 2; h = v.circle[2] * 2; x = v.circle[0] - rw; y = v.circle[1] - v.circle[2]; el.classList.add('round'); }
        else { x = v.rect[0]; y = v.rect[1]; w = v.rect[2]; h = v.rect[3]; }
        el.className += ' rs-z ' + (v.style || 'line');
        el.style.left = x * 100 + '%'; el.style.top = y * 100 + '%'; el.style.width = w * 100 + '%'; el.style.height = h * 100 + '%';
        var lab = document.createElement('span'); lab.textContent = v.label; el.appendChild(lab);
        box.appendChild(el);
      });
      stage.appendChild(box);
    }
    function inspect(i, f){
      var w = i.naturalWidth, h = i.naturalHeight, rules = JSON.parse(root.dataset.rules || '[]');
      info.innerHTML = '<span><b>' + w + ' × ' + h + '</b> px</span><span>' + ratioLabel(w, h) + '</span><span>' + kb(f.size) + '</span><span>' + (f.type.split('/')[1] || '').toUpperCase() + '</span>';
      if (checks) checks.innerHTML = rules.map(function(r){
        var ok;
        if (r.k === 'minw') ok = w >= r.v; else if (r.k === 'minh') ok = h >= r.v; else if (r.k === 'ratio') ok = Math.abs(w / h - r.v) < 0.012; else if (r.k === 'bytes') ok = f.size <= r.v; else if (r.k === 'type') ok = r.v.indexOf(f.type) > -1; else if (r.k === 'exact') ok = w === r.v[0] && h === r.v[1];
        return '<li class="' + (ok ? 'ck-ok' : 'ck-no') + '">' + (ok ? r.ok : r.no) + '</li>';
      }).join('');
      // Suggest the format closest to the picture's own shape.
      var best = null, bd = 9; fmts.forEach(function(b){ var d = Math.abs(Math.log((w / h) / (+b.dataset.w / +b.dataset.h))); if (d < bd){ bd = d; best = b; } });
      if (best && !root.dataset.keepFormat) pick(best);
    }
    dropZone(zone, file, function(i, f){ img = i; src = f; fx = 0.5; fy = 0.5; root.classList.add('has-img'); inspect(i, f); draw(); });
    // Drag the picture to move the crop.
    var drag = null;
    stage.addEventListener('pointerdown', function(e){ if (!img || mode !== 'crop') return; drag = { x: e.clientX, y: e.clientY, fx: fx, fy: fy }; stage.setPointerCapture(e.pointerId); });
    stage.addEventListener('pointermove', function(e){
      if (!drag) return;
      var r = stage.getBoundingClientRect(), iw = img.naturalWidth, ih = img.naturalHeight, s = Math.max(W / iw, H / ih);
      var visW = (W / s) / iw, visH = (H / s) / ih;
      fx = Math.max(visW / 2, Math.min(1 - visW / 2, drag.fx - (e.clientX - drag.x) / r.width * visW));
      fy = Math.max(visH / 2, Math.min(1 - visH / 2, drag.fy - (e.clientY - drag.y) / r.height * visH));
      draw();
    });
    stage.addEventListener('pointerup', function(){ drag = null; });
    dl.addEventListener('click', function(){
      if (!img) return;
      var c = render(img, W, H, mode, fx, fy, fill);
      var go = function(q){
        toBlob(c, 'image/jpeg', q).then(function(b){
          if (maxBytes && b.size > maxBytes && q > 0.5) return go(q - 0.07);
          save(b, prefix + '-' + fmtName + '-' + W + 'x' + H + '.jpg');
          toast('Saved ' + W + ' × ' + H + ', ' + kb(b.size));
        });
      };
      go(0.92);
    });
    var first = fmts.filter(function(b){ return b.getAttribute('aria-pressed') === 'true'; })[0] || fmts[0];
    if (first){ W = +first.dataset.w; H = +first.dataset.h; fmtName = first.dataset.fmt; }
    void src;
  });
})();

/* ---------- Zip (stored, no compression): enough to hand over a set of JPGs ---------- */
var CRC = (function(){ var t = [], c; for (var n = 0; n < 256; n++){ c = n; for (var k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; } return t; })();
function crc32(u8){ var c = 0xFFFFFFFF; for (var i = 0; i < u8.length; i++) c = CRC[(c ^ u8[i]) & 255] ^ (c >>> 8); return (c ^ 0xFFFFFFFF) >>> 0; }
function zip(files){
  var parts = [], central = [], offset = 0, enc = new TextEncoder();
  files.forEach(function(f){
    var name = enc.encode(f.name), data = f.data, crc = crc32(data);
    var h = new DataView(new ArrayBuffer(30));
    h.setUint32(0, 0x04034b50, true); h.setUint16(4, 20, true); h.setUint16(8, 0, true); h.setUint32(14, crc, true); h.setUint32(18, data.length, true); h.setUint32(22, data.length, true); h.setUint16(26, name.length, true);
    parts.push(new Uint8Array(h.buffer), name, data);
    var c = new DataView(new ArrayBuffer(46));
    c.setUint32(0, 0x02014b50, true); c.setUint16(4, 20, true); c.setUint16(6, 20, true); c.setUint32(16, crc, true); c.setUint32(20, data.length, true); c.setUint32(24, data.length, true); c.setUint16(28, name.length, true); c.setUint32(42, offset, true);
    central.push(new Uint8Array(c.buffer), name);
    offset += 30 + name.length + data.length;
  });
  var size = central.reduce(function(a, b){ return a + b.length; }, 0);
  var e = new DataView(new ArrayBuffer(22));
  e.setUint32(0, 0x06054b50, true); e.setUint16(8, files.length, true); e.setUint16(10, files.length, true); e.setUint32(12, size, true); e.setUint32(16, offset, true);
  return new Blob(parts.concat(central, [new Uint8Array(e.buffer)]), { type: 'application/zip' });
}

/* ---------- Instagram grid maker ---------- */
(function(){
  var root = $('[data-tool="grid"]'); if (!root) return;
  var zone = $('[data-drop]', root), file = $('input[type=file]', root), grid = $('[data-grid]', root), dl = $('[data-download]', root), order = $('[data-order]', root);
  var img = null, rows = 1, ratio = [3, 4], TW = 1080;
  $$('[data-rows]', root).forEach(function(b){ b.addEventListener('click', function(){ rows = +b.dataset.rows; $$('[data-rows]', root).forEach(function(x){ x.setAttribute('aria-pressed', x === b); }); draw(); }); });
  $$('[data-ratio]', root).forEach(function(b){ b.addEventListener('click', function(){ ratio = b.dataset.ratio.split(':').map(Number); $$('[data-ratio]', root).forEach(function(x){ x.setAttribute('aria-pressed', x === b); }); draw(); }); });
  function tiles(){
    var TH = Math.round(TW * ratio[1] / ratio[0]), full = render(img, TW * 3, TH * rows, 'crop', 0.5, 0.5, '#fff'), out = [];
    for (var r = 0; r < rows; r++) for (var c = 0; c < 3; c++){
      var t = document.createElement('canvas'); t.width = TW; t.height = TH;
      t.getContext('2d').drawImage(full, c * TW, r * TH, TW, TH, 0, 0, TW, TH);
      out.push({ canvas: t, r: r, c: c });
    }
    return out;
  }
  function draw(){
    if (!img){ dl.disabled = true; return; }
    var ts = tiles(), n = ts.length;
    grid.style.gridTemplateColumns = 'repeat(3, 1fr)';
    grid.innerHTML = '';
    ts.forEach(function(t, i){
      var cell = document.createElement('div'); cell.className = 'gm-cell';
      t.canvas.className = 'gm-img'; cell.appendChild(t.canvas);
      var badge = document.createElement('span'); badge.className = 'gm-n'; badge.textContent = n - i; cell.appendChild(badge);
      cell.style.aspectRatio = ratio[0] + ' / ' + ratio[1];
      grid.appendChild(cell);
    });
    order.textContent = 'Post them in number order, starting with 1 at the bottom right. Instagram shows the newest post first, so the picture comes together on your profile.';
    dl.disabled = false;
  }
  dropZone(zone, file, function(i){ img = i; root.classList.add('has-img'); draw(); });
  dl.addEventListener('click', function(){
    if (!img) return;
    var ts = tiles(), n = ts.length;
    Promise.all(ts.map(function(t, i){ return toBlob(t.canvas, 'image/jpeg', 0.92).then(function(b){ return b.arrayBuffer().then(function(a){ return { name: 'grid-' + String(n - i).padStart(2, '0') + '.jpg', data: new Uint8Array(a) }; }); }); }))
      .then(function(files){ files.sort(function(a, b){ return a.name < b.name ? -1 : 1; }); save(zip(files), 'instagram-grid-' + rows + 'x3.zip'); toast('Saved ' + n + ' tiles'); });
  });
})();

/* ---------- Emoji picker ---------- */
(function(){
  var tool = $('[data-tool="emoji"]'); if (!tool) return;
  var q = $('#ej-q'), out = $('#ej-out'), copyB = $('#ej-copy'), clearB = $('#ej-clear'), back = $('#ej-back'), none = $('#ej-none'), bar = $('.ej-bar', tool);
  var all = $$('.ej-sec:not(#recent) .ej', tool), secs = $$('.ej-sec:not(#recent)', tool), recentSec = $('#recent'), recentGrid = $('#ej-recent'), recentChip = $('[data-to="recent"]', tool);
  var chips = $$('.ej-chip', tool), tones = $$('.ej-tone', tool);
  var byBase = {}; all.forEach(function(b){ b.dataset.b = b.textContent; byBase[b.dataset.b] = b; });
  var tone = +(store.get('ej-tone') || 0), picked = [], recent = [];
  try { recent = JSON.parse(store.get('ej-recent') || '[]').filter(function(e){ return byBase[e]; }); } catch (e) {}
  function glyph(b){ var s = b.dataset.s; return tone && s ? s.split(' ')[tone - 1] : b.dataset.b; }
  function applyTone(){ $$('.ej[data-s]', tool).forEach(function(b){ b.textContent = glyph(b); }); tones.forEach(function(t){ t.setAttribute('aria-pressed', +t.dataset.t === tone); }); }
  function renderOut(){ out.textContent = picked.join(''); var has = picked.length > 0; copyB.disabled = !has; clearB.disabled = !has; back.disabled = !has; }
  function renderRecent(){
    recentGrid.innerHTML = '';
    recent.forEach(function(e){ var c = byBase[e].cloneNode(true); recentGrid.appendChild(c); });
    var show = recent.length > 0 && !q.value.trim();
    recentSec.hidden = !show; recentChip.hidden = !recent.length;
    applyTone();
  }
  tool.addEventListener('click', function(e){
    var b = e.target.closest('.ej'); if (!b) return;
    var g = b.textContent; picked.push(g); renderOut(); copy(g, 'Copied ' + g);
    var base = b.dataset.b; recent = [base].concat(recent.filter(function(x){ return x !== base; })).slice(0, 32); store.set('ej-recent', JSON.stringify(recent)); renderRecent();
  });
  copyB.addEventListener('click', function(){ copy(picked.join(''), 'Copied ' + picked.length + ' emoji'); });
  clearB.addEventListener('click', function(){ picked = []; renderOut(); });
  back.addEventListener('click', function(){ picked.pop(); renderOut(); });
  tones.forEach(function(t){ t.addEventListener('click', function(){ tone = +t.dataset.t; store.set('ej-tone', tone); applyTone(); }); });
  var timer = null;
  q.addEventListener('input', function(){
    clearTimeout(timer);
    timer = setTimeout(function(){
      var words = q.value.toLowerCase().trim().split(/\s+/).filter(Boolean);
      var shown = 0;
      all.forEach(function(b){ var k = b.dataset.k, ok = words.every(function(w){ return k.indexOf(w) > -1; }); b.hidden = !ok; if (ok) shown++; });
      secs.forEach(function(s){ s.hidden = !$$('.ej:not([hidden])', s).length; });
      none.hidden = shown > 0; none.textContent = shown ? '' : 'No emoji match "' + q.value.trim() + '". Try a simpler word, like heart, cat or party.';
      renderRecent();
    }, 60);
  });
  // Category chips jump to their section; the chip for the section in view stays picked.
  function barH(){ tool.style.setProperty('--ej-bar', bar.offsetHeight + 'px'); }
  barH(); window.addEventListener('resize', barH);
  chips.forEach(function(c){ c.addEventListener('click', function(){ var s = document.getElementById(c.dataset.to); if (s){ if (q.value){ q.value = ''; q.dispatchEvent(new Event('input')); } setTimeout(function(){ s.scrollIntoView({ behavior: 'smooth', block: 'start' }); }, q.value ? 80 : 0); } }); });
  if ('IntersectionObserver' in window){
    var io = new IntersectionObserver(function(es){ es.forEach(function(e){ if (e.isIntersecting){ chips.forEach(function(c){ c.setAttribute('aria-current', c.dataset.to === e.target.id); }); var cur = chips.filter(function(c){ return c.dataset.to === e.target.id; })[0]; if (cur && cur.scrollIntoView) cur.parentNode.scrollTo({ left: cur.offsetLeft - 40, behavior: 'smooth' }); } }); }, { rootMargin: '-45% 0px -50% 0px' });
    secs.concat([recentSec]).forEach(function(s){ io.observe(s); });
  }
  applyTone(); renderOut(); renderRecent();
})();

/* ---------- Word counter ---------- */
(function(){
  var root = $('[data-tool="words"]'); if (!root) return;
  var ta = $('[data-input]', root), top = $('[data-top]', root), stat = {};
  $$('[data-stat]', root).forEach(function(el){ stat[el.dataset.stat] = el; });
  var wseg = (window.Intl && Intl.Segmenter) ? new Intl.Segmenter(undefined, { granularity: 'word' }) : null;
  var sseg = (window.Intl && Intl.Segmenter) ? new Intl.Segmenter(undefined, { granularity: 'sentence' }) : null;
  var gseg = (window.Intl && Intl.Segmenter) ? new Intl.Segmenter(undefined, { granularity: 'grapheme' }) : null;
  var STOP = ' a an and are as at be but by for from has have he her his i if in into is it its me my no not of on or our she so than that the their them then there these they this to too up us was we were what when which who will with you your just can do does did get got had how all any been more most much one only out over some such very would could should about after also because before being both each few own same while '.split(' ').reduce(function(o, w){ if (w) o[w] = 1; return o; }, {});
  function time(min){ if (min < 1) return Math.max(0, Math.round(min * 60)) + ' sec'; var m = Math.floor(min), sec = Math.round((min - m) * 60); return m + ' min' + (sec ? ' ' + sec + ' sec' : ''); }
  function update(){
    var v = ta.value;
    var words = wseg ? Array.from(wseg.segment(v)).filter(function(x){ return x.isWordLike; }).map(function(x){ return x.segment; }) : (v.match(/[\p{L}\p{N}'’-]+/gu) || []);
    var n = words.length;
    var chars = gseg ? Array.from(gseg.segment(v)).length : cps(v).length;
    var sentences = sseg ? Array.from(sseg.segment(v)).filter(function(x){ return /[\p{L}\p{N}]/u.test(x.segment); }) : v.split(/[.!?]+\s/).filter(function(x){ return x.trim(); });
    var paras = v.split(/\n\s*\n/).filter(function(x){ return x.trim(); }).length;
    stat.words.textContent = fmt(n);
    stat.chars.textContent = fmt(chars);
    stat.nospace.textContent = fmt(cps(v.replace(/\s/g, '')).length);
    stat.sentences.textContent = fmt(sentences.length);
    stat.paragraphs.textContent = fmt(paras);
    stat.read.textContent = time(n / 238);
    stat.speak.textContent = time(n / 140);
    stat.avg.textContent = n ? (words.reduce(function(a, w){ return a + cps(w).length; }, 0) / n).toFixed(1) : '0';
    var longest = 0; sentences.forEach(function(x){ var c = (x.segment || x).split(/\s+/).filter(Boolean).length; if (c > longest) longest = c; });
    stat.longest.textContent = fmt(longest) + (longest === 1 ? ' word' : ' words');
    var freq = {}; words.forEach(function(w){ w = w.toLowerCase(); if (w.length > 2 && !STOP[w] && !/^\d+$/.test(w)) freq[w] = (freq[w] || 0) + 1; });
    var list = Object.keys(freq).sort(function(a, b){ return freq[b] - freq[a] || (a < b ? -1 : 1); }).slice(0, 10);
    top.innerHTML = list.length ? list.map(function(w){ return '<li><span>' + esc(w) + '</span><b>' + freq[w] + '</b><small>' + (freq[w] / n * 100).toFixed(1) + '%</small></li>'; }).join('') : '<li class="none">Your most used words show here.</li>';
    store.set('wc-draft', v);
  }
  var saved = store.get('wc-draft'); if (saved) ta.value = saved;
  ta.addEventListener('input', update);
  $('[data-clear]', root).addEventListener('click', function(){ ta.value = ''; update(); ta.focus(); });
  $('[data-copy]', root).addEventListener('click', function(){ copy(ta.value, 'Copied your text'); });
  update();
})();

/* ---------- Engagement rate calculator ---------- */
(function(){
  var root = $('[data-tool="engagement"]'); if (!root) return;
  var f = {}; $$('[data-f]', root).forEach(function(el){ f[el.dataset.f] = el; });
  var out = {}; $$('[data-r]', root).forEach(function(el){ out[el.dataset.r] = el; });
  function num(el){ var n = parseFloat(String(el.value).replace(/[^\d.]/g, '')); return isFinite(n) && n > 0 ? n : 0; }
  function update(){
    var inter = num(f.likes) + num(f.comments) + num(f.shares) + num(f.saves), posts = Math.max(1, num(f.posts) || 1);
    var per = inter / posts;
    out.total.textContent = fmt(Math.round(inter));
    [['followers', 'byFollowers'], ['reach', 'byReach'], ['views', 'byViews']].forEach(function(p){
      var d = num(f[p[0]]);
      out[p[1]].textContent = d ? (per / d * 100).toFixed(2) + '%' : '–';
      out[p[1]].parentNode.classList.toggle('dim', !d);
    });
    store.set('er', JSON.stringify(Object.keys(f).reduce(function(o, k){ o[k] = f[k].value; return o; }, {})));
  }
  try { var s = JSON.parse(store.get('er') || 'null'); if (s) Object.keys(s).forEach(function(k){ if (f[k]) f[k].value = s[k]; }); } catch (e) {}
  Object.keys(f).forEach(function(k){ f[k].addEventListener('input', update); });
  update();
})();
})();
