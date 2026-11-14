/* Cookie consent for capybaroar.com. The choice is saved in one cookie on .capybaroar.com, so the site and the app
   share it (src/lib/consentRules.ts reads the same format). Needed cookies are always on. Analytics stays off until
   someone allows it: anything that measures visits must wait for window.cbConsent.analytics() or the cb-consent event. */
(function(){
  var NAME = 'cb_consent', VER = '1', AGE = 60 * 60 * 24 * 180;
  function read(){
    var m = document.cookie.match(/(?:^|;\s*)cb_consent=([^;]+)/);
    if (!m) return null;
    var p = decodeURIComponent(m[1]).split('.');
    return p[0] === VER && (p[1] === 'a' || p[1] === 'n') ? { analytics: p[1] === 'a' } : null;
  }
  function save(analytics){
    var dom = /(^|\.)capybaroar\.com$/.test(location.hostname) ? '; Domain=.capybaroar.com' : '';
    var sec = location.protocol === 'https:' ? '; Secure' : '';
    document.cookie = NAME + '=' + VER + '.' + (analytics ? 'a' : 'n') + '; Max-Age=' + AGE + '; Path=/; SameSite=Lax' + dom + sec;
    try { window.dispatchEvent(new CustomEvent('cb-consent', { detail: { analytics: analytics } })); } catch (e) {}
  }
  window.cbConsent = { analytics: function(){ var c = read(); return !!(c && c.analytics); }, open: function(){ show(true); } };

  var css = '.cc{position:fixed;left:16px;bottom:16px;z-index:1000;width:400px;max-width:calc(100vw - 32px);padding:20px;border-radius:16px;background:var(--panel,#fff);color:var(--ink,#171717);box-shadow:var(--sh-lift);font:14px/1.5 var(--font,system-ui)}'
    + '.cc h2{font-size:15px;font-weight:600;margin:0 0 4px}.cc p{margin:0;color:var(--gray,#737373)}'
    + '.cc-row{display:flex;align-items:flex-start;gap:12px;padding:12px 0;border-top:1px solid var(--line,#ededed)}.cc-row:first-of-type{margin-top:12px}'
    + '.cc-row div{flex:1;min-width:0}.cc-row b{display:block;font-weight:500;color:var(--ink,#171717)}.cc-row small{display:block;font-size:13px;color:var(--gray,#737373)}'
    + '.cc-on{flex-shrink:0;height:22px;padding:0 8px;border-radius:6px;background:var(--shell,#f5f5f5);font-size:12px;font-weight:500;line-height:22px;color:var(--ink-2,#404040)}'
    + '.cc-sw{position:relative;flex-shrink:0;width:36px;height:20px;border:0;border-radius:999px;background:#d4d4d4;cursor:pointer;transition:background-color .15s}'
    + '.cc-sw::after{content:"";position:absolute;top:2px;left:2px;width:16px;height:16px;border-radius:50%;background:#fff;box-shadow:0 1px 2px rgba(0,0,0,.2);transition:transform .15s}'
    + '.cc-sw[aria-checked=true]{background:var(--y,#ffd202)}.cc-sw[aria-checked=true]::after{transform:translateX(16px)}'
    + '.cc-sw:focus-visible,.cc button:focus-visible{outline:0;box-shadow:var(--sh-focus)}'
    + '.cc-acts{display:flex;flex-wrap:wrap;align-items:center;gap:8px;margin-top:16px}.cc-acts .btn{height:36px;padding:0 16px;font-size:14px}'
    + '.cc-acts .cc-yes{background:var(--y,#ffd202);color:var(--y-ink,#262209);box-shadow:0 0 0 1px var(--y-h,#e6bd00)}.cc-acts .cc-yes:hover{background:var(--y-h,#e6bd00)}'
    + '.cc-more{margin-left:auto;border:0;background:none;padding:0 4px;font:500 14px/36px var(--font,system-ui);color:var(--ink,#171717);cursor:pointer;text-decoration:underline;text-underline-offset:3px}'
    + '.cc-foot{border:0;background:none;padding:0;font:inherit;color:inherit;cursor:pointer;text-align:left}.cc-foot:hover{text-decoration:underline}'
    + '@media (max-width:640px){.cc{left:16px;right:16px;bottom:16px;width:auto}}';

  var box = null;
  function show(details){
    if (box) box.remove();
    var cur = read(), on = !!(cur && cur.analytics);
    var st = document.getElementById('cc-style');
    if (!st){ st = document.createElement('style'); st.id = 'cc-style'; st.textContent = css; document.head.appendChild(st); }
    box = document.createElement('section');
    box.className = 'cc';
    box.setAttribute('role', 'dialog');
    box.setAttribute('aria-labelledby', 'cc-title');
    box.innerHTML = '<h2 id="cc-title">Cookies</h2>'
      + '<p>We use cookies that keep you signed in and keep the site working. Analytics cookies stay off unless you allow them.</p>'
      + (details
        ? '<div class="cc-row"><div><b>Needed</b><small>Sign-in, security and your settings</small></div><span class="cc-on">Always on</span></div>'
          + '<div class="cc-row"><div><b id="cc-an">Analytics</b><small>Counts visits so we can improve the site</small></div><button type="button" class="cc-sw" role="switch" aria-labelledby="cc-an" aria-checked="' + on + '"></button></div>'
          + '<div class="cc-acts"><button type="button" class="btn ghost" data-cc="n">Reject all</button><button type="button" class="btn" data-cc="save">Save</button></div>'
        : '<div class="cc-acts"><button type="button" class="btn cc-yes" data-cc="a">Accept all</button><button type="button" class="btn ghost" data-cc="n">Reject all</button><button type="button" class="cc-more" data-cc="more">Choose</button></div>');
    document.body.appendChild(box);
    var sw = box.querySelector('.cc-sw');
    if (sw) sw.addEventListener('click', function(){ sw.setAttribute('aria-checked', sw.getAttribute('aria-checked') !== 'true'); });
    box.addEventListener('click', function(e){
      var b = e.target.closest('[data-cc]'); if (!b) return;
      var k = b.getAttribute('data-cc');
      if (k === 'more') { show(true); return; }
      save(k === 'a' || (k === 'save' && sw && sw.getAttribute('aria-checked') === 'true'));
      box.remove(); box = null;
    });
    var first = box.querySelector(details ? '.cc-sw' : '[data-cc]');
    if (details && first) first.focus();
  }

  function footLink(){
    var list = document.querySelector('#f-company + ul');
    if (!list || list.querySelector('.cc-foot')) return;
    var li = document.createElement('li');
    li.innerHTML = '<button type="button" class="cc-foot">Cookie settings</button>';
    li.firstChild.addEventListener('click', function(){ show(true); });
    list.appendChild(li);
  }

  function start(){
    if (!document.getElementById('cc-style')){ var st = document.createElement('style'); st.id = 'cc-style'; st.textContent = css; document.head.appendChild(st); }
    footLink();
    if (!read()) show(false);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
})();
