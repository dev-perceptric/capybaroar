(function(){
var RM = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
var $ = function(s, r){ return (r || document).querySelector(s); };
var $$ = function(s, r){ return [].slice.call((r || document).querySelectorAll(s)); };
var on = function(el, c){ el && el.classList.add(c); };
var off = function(el, c){ el && el.classList.remove(c); };

/* A scene is a reset() plus a list of [wait ms, step]. The runner plays it, loops it or hands off when done. */
function Scene(def){
  var timer = null, timers = [], i = 0, live = false;
  var sc = {
    later: function(fn, ms){ var t = setTimeout(fn, RM ? 0 : ms); timers.push(t); return t; },
    type: function(el, text, cps){
      if (RM){ el.textContent = text; return; }
      el.textContent = ''; el.classList.add('caret'); var k = 0;
      var t = setInterval(function(){ k++; el.textContent = text.slice(0, k); if (k >= text.length){ clearInterval(t); el.classList.remove('caret'); } }, 1000 / (cps || 38));
      timers.push(t);
    }
  };
  var steps = def.steps(sc);
  sc.total = steps.reduce(function(a, s){ return a + s[0]; }, 0);
  function clear(){ clearTimeout(timer); timers.forEach(function(t){ clearTimeout(t); clearInterval(t); }); timers = []; }
  function next(){
    if (!live) return;
    if (i >= steps.length){
      if (def.onEnd){ live = false; def.onEnd(); return; }
      i = 0; clear(); def.reset(sc);
    }
    var s = steps[i++];
    timer = setTimeout(function(){ s[1](); next(); }, s[0]);
  }
  sc.start = function(){ clear(); def.reset(sc); if (RM){ steps.forEach(function(s){ s[1](); }); return; } live = true; i = 0; next(); };
  sc.stop = function(){ live = false; clear(); };
  return sc;
}
function whenSeen(el, sc){
  if (!el) return;
  if (!('IntersectionObserver' in window)){ sc.start(); return; }
  var playing = false;
  new IntersectionObserver(function(es){ es.forEach(function(e){
    if (e.isIntersecting && !playing){ playing = true; sc.start(); }
    else if (!e.isIntersecting && playing){ playing = false; sc.stop(); }
  }); }, { threshold: 0.25 }).observe(el);
}
function fmt(n){ return n.toLocaleString('en-US'); }
function count(el, to, ms, sc){
  var pre = el.dataset.pre || '', k = el.dataset.fmt === 'k';
  var show = function(v){ el.textContent = pre + (k ? (v / 1000).toFixed(1) + 'K' : fmt(Math.round(v))); };
  if (RM){ show(to); return; }
  var t0 = performance.now();
  (function f(t){ var p = Math.min(1, (t - t0) / ms); p = 1 - Math.pow(1 - p, 3); show(to * p); if (p < 1 && el.isConnected) sc.later(function(){ f(performance.now()); }, 16); })(t0);
}
function movePtr(ptr, stage, target, dx, dy){
  var a = stage.getBoundingClientRect(), b = target.getBoundingClientRect();
  ptr.style.left = (b.left - a.left + (dx || b.width * 0.6)) + 'px';
  ptr.style.top = (b.top - a.top + (dy || b.height * 0.55)) + 'px';
}

/* ---------- Hero: rotating "works with" ---------- */
(function(){
  var rot = $('#rot'); if (!rot) return;
  var items = [['a-claude','Claude'],['a-chatgpt','ChatGPT'],['a-cursor','Cursor'],['n-instagram','Instagram'],['n-linkedin','LinkedIn'],['n-tiktok','TikTok'],['n-youtube','YouTube'],['n-x','X'],['n-bluesky','Bluesky'],['n-threads','Threads'],['n-pinterest','Pinterest']];
  var els = items.map(function(it){ var s = document.createElement('span'); s.className = 'rot-w'; s.innerHTML = '<svg aria-hidden="true"><use href="#' + it[0] + '"/></svg>' + it[1]; rot.appendChild(s); return s; });
  var cur = 0;
  function fit(){ rot.style.width = els[cur].offsetWidth + 'px'; }
  els[0].classList.add('on'); fit();
  window.addEventListener('resize', fit);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(fit);
  if (RM) return;
  setInterval(function(){
    var old = els[cur]; cur = (cur + 1) % els.length; var nw = els[cur];
    old.classList.remove('on'); old.classList.add('out');
    nw.classList.remove('out'); void nw.offsetWidth; nw.classList.add('on'); fit();
    setTimeout(function(){ old.classList.remove('out'); }, 560);
  }, 2200);
})();

/* ---------- Showcase scenes ---------- */
var S = {};

S.sched = function(onEnd){
  var chs = $$('#sc-sched .s-ch'), txt = $('#s-txt'), comp = $('#s-comp'), nw = $('#s-new'), btn = $('#s-btn'), time = $('#s-time'), toast = $('#s-toast');
  return Scene({ onEnd: onEnd,
    reset: function(){ chs.forEach(function(c){ off(c, 'on'); }); txt.textContent = ''; off(comp, 'out'); off(nw, 'in'); off(btn, 'press'); off(time, 'pick'); off(toast, 'in'); },
    steps: function(sc){ return [
      [500, function(){ on(chs[0], 'on'); }], [220, function(){ on(chs[1], 'on'); }], [220, function(){ on(chs[2], 'on'); }], [220, function(){ on(chs[3], 'on'); }],
      [400, function(){ sc.type(txt, 'Sourdough drops Friday at 8. Pre-order now and we save you a loaf.', 40); }],
      [2000, function(){ on(time, 'pick'); }],
      [700, function(){ on(btn, 'press'); }], [180, function(){ off(btn, 'press'); }],
      [200, function(){ on(comp, 'out'); }],
      [420, function(){ on(nw, 'in'); }],
      [300, function(){ on(toast, 'in'); }],
      [3600, function(){}]
    ]; } });
};

S.inbox = function(onEnd){
  var root = $('#sc-inbox'), msgs = $$('#i-list .i-msg'), t = $('#i-t'), sent = $('#i-sent'), sug = $('#i-sug'), send = $('#i-send'), st = $('#i-state');
  return Scene({ onEnd: onEnd,
    reset: function(){ msgs.forEach(function(m, k){ off(m, 'on'); off(m, 'read'); if (k < 2) on(m, 'in'); else off(m, 'in'); }); t.textContent = ''; off(sent, 'in'); off(sug, 'pick'); off(send, 'press'); st.innerHTML = '<span class="badge">Open</span>'; },
    steps: function(sc){ return [
      [500, function(){ on(msgs[2], 'in'); }], [350, function(){ on(msgs[3], 'in'); }], [350, function(){ on(msgs[4], 'in'); }],
      [600, function(){ on(msgs[2], 'on'); on(msgs[2], 'read'); }],
      [700, function(){ on(sug, 'pick'); }],
      [400, function(){ sc.type(t, "Yes! Doors open at 8 and we're holding pre-orders until noon. See you Friday.", 46); }],
      [2100, function(){ on(send, 'press'); }], [160, function(){ off(send, 'press'); t.textContent = ''; on(sent, 'in'); }],
      [500, function(){ st.innerHTML = '<span class="badge green">Done</span>'; }],
      [3600, function(){}]
    ]; } });
};

S.agent = function(onEnd){
  var ask = $('#a-ask'), steps = $('#a-steps'), rows = $$('#a-steps .a-step'), drs = $$('#a-drafts .dr'), tools = $$('#sc-agent [data-tool]');
  return Scene({ onEnd: onEnd,
    reset: function(){ off(ask, 'in'); off(steps, 'in'); rows.forEach(function(r){ off(r, 'done'); r.style.display = 'none'; }); drs.forEach(function(d){ off(d, 'in'); off(d, 'made'); }); tools.forEach(function(x){ off(x, 'pick'); }); },
    steps: function(sc){ var out = [
      [400, function(){ on(ask, 'in'); }],
      [700, function(){ on(steps, 'in'); rows[0].style.display = ''; }],
      [900, function(){ on(rows[0], 'done'); rows[1].style.display = ''; }],
      [1000, function(){ on(rows[1], 'done'); rows[2].style.display = ''; on(tools[0], 'pick'); drs.forEach(function(d, k){ sc.later(function(){ on(d, 'in'); }, k * 90); }); }]
    ];
      drs.forEach(function(d){ out.push([380, function(){ on(d, 'made'); }]); });
      out.push([300, function(){ on(rows[2], 'done'); off(tools[0], 'pick'); rows[3].style.display = ''; }]);
      out.push([700, function(){ on(rows[3], 'done'); }]);
      out.push([3800, function(){}]);
      return out; } });
};

S.ana = function(onEnd){
  var win = $('#n-win'), chart = $('#n-chart'), nums = $$('#n-win .n-stat b');
  var data = [38, 52, 44, 61, 57, 72, 49, 66, 81, 70, 95, 77, 63, 88], days = ['M','T','W','T','F','S','S','M','T','W','T','F','S','S'];
  chart.innerHTML = data.map(function(v, k){ return '<div class="n-bar' + (v === 95 ? ' top' : '') + '" style="--h:' + v + '%;transition-delay:' + (k * 45) + 'ms"><span>' + days[k] + '</span></div>'; }).join('') + '<div class="n-tip" id="n-tip">Thursday: 6,240 reach</div>';
  var tip = $('#n-tip');
  return Scene({ onEnd: onEnd,
    reset: function(){ off(win, 'grow'); off(tip, 'in'); nums.forEach(function(b){ b.textContent = (b.dataset.pre || '') + '0'; }); },
    steps: function(sc){ return [
      [400, function(){ nums.forEach(function(b){ count(b, +b.dataset.to, 1400, sc); }); on(win, 'grow'); }],
      [1500, function(){ var top = $('.n-bar.top', chart), a = chart.getBoundingClientRect(), b = top.getBoundingClientRect(); tip.style.left = Math.max(0, Math.min(a.width - 150, b.left - a.left - 60)) + 'px'; tip.style.top = (b.top - a.top - 34) + 'px'; on(tip, 'in'); }],
      [4600, function(){}]
    ]; } });
};

S.bio = function(onEnd){
  var stage = $('#sc-bio'), parts = $$('#b-ph > .pop'), l1 = $('#b-l1'), rip = $('.rip', l1), ptr = $('#b-ptr'), v = $('#b-v'), c = $('#b-c'), t1 = $('#b-t1'), t1n = $('#b-t1n');
  return Scene({ onEnd: onEnd,
    reset: function(){ parts.forEach(function(p){ off(p, 'in'); }); off(ptr, 'in'); off(ptr, 'tap'); off(rip, 'go'); off(t1, 'hit'); v.textContent = '2,481'; c.textContent = '734'; t1n.textContent = '312'; ptr.style.left = '70%'; ptr.style.top = '85%'; },
    steps: function(sc){ var out = [];
      parts.forEach(function(p, k){ out.push([k ? 140 : 400, function(){ on(p, 'in'); }]); });
      out.push([500, function(){ v.textContent = '2,482'; on(ptr, 'in'); }]);
      out.push([100, function(){ movePtr(ptr, stage, l1); }]);
      out.push([800, function(){ on(ptr, 'tap'); rip.style.left = '60%'; rip.style.top = '40%'; on(rip, 'go'); }]);
      out.push([160, function(){ off(ptr, 'tap'); c.textContent = '735'; t1n.textContent = '313'; on(t1, 'hit'); }]);
      out.push([4000, function(){}]);
      return out; } });
};

/* Tabs: auto-advance when a scene finishes, with a yellow progress line under the open tab */
(function(){
  var tabs = $$('.sc-tab'), keys = ['sched','inbox','agent','ana','bio'], cur = 0, scenes = {}, seen = false;
  if (!tabs.length) return;
  var box = $('#features');
  function scene(k){
    if (!scenes[k]) scenes[k] = S[k](function(){ pick((cur + 1) % tabs.length); });
    return scenes[k];
  }
  function bar(t, ms){
    var b = $('.sc-bar', t); tabs.forEach(function(x){ var y = $('.sc-bar', x); y.style.transition = 'none'; y.style.transform = 'scaleX(0)'; });
    if (RM){ b.style.transform = 'scaleX(1)'; return; }
    void b.offsetWidth; b.style.transition = 'transform ' + ms + 'ms linear'; b.style.transform = 'scaleX(1)';
  }
  function pick(n, focus){
    var old = scenes[keys[cur]]; if (old) old.stop();
    cur = n;
    tabs.forEach(function(t, k){ var o = k === n; t.setAttribute('aria-selected', o); t.tabIndex = o ? 0 : -1; document.getElementById(t.getAttribute('aria-controls')).hidden = !o; });
    if (focus) tabs[n].focus();
    if (!seen) return;
    var sc = scene(keys[n]); bar(tabs[n], sc.total); sc.start();
  }
  tabs.forEach(function(t, k){
    t.addEventListener('click', function(){ pick(k); });
    t.addEventListener('keydown', function(e){ var j = e.key === 'ArrowRight' ? k + 1 : e.key === 'ArrowLeft' ? k - 1 : null; if (j === null) return; e.preventDefault(); pick((j + tabs.length) % tabs.length, true); });
  });
  if ('IntersectionObserver' in window){
    new IntersectionObserver(function(es){ es.forEach(function(e){
      if (e.isIntersecting && !seen){ seen = true; pick(cur); }
      else if (!e.isIntersecting && seen){ seen = false; var s = scenes[keys[cur]]; if (s) s.stop(); bar(tabs[cur], 0); $('.sc-bar', tabs[cur]).style.transform = 'scaleX(0)'; }
    }); }, { threshold: 0.2 }).observe(box);
  } else { seen = true; pick(0); }
})();

/* ---------- Zigzag scenes ---------- */
(function(){
  var root = $('#z-prev'); if (!root) return;
  var chips = $$('.pill', root), pvs = $$('.pv', root), cnt = $('#p-cnt'), barEl = $('#p-bar');
  var lim = [['132 / 3,000', 4], ['89 / 2,200', 4], ['64 / 280', 23], ['88 / 500', 18]];
  function show(n){ chips.forEach(function(c, k){ c.classList.toggle('pick', k === n); }); pvs.forEach(function(p, k){ p.classList.toggle('on', k === n); }); cnt.textContent = lim[n][0]; barEl.style.width = lim[n][1] + '%'; }
  show(0);
  whenSeen(root, Scene({ reset: function(){ show(0); }, steps: function(){ return [[2400, function(){ show(1); }], [2400, function(){ show(2); }], [2400, function(){ show(3); }], [2400, function(){}]]; } }));
})();

(function(){
  var root = $('#z-inbox'); if (!root) return;
  var chips = $$('.pill', root), rows = $$('.f-msg', root), order = ['all','instagram','tiktok','all','bluesky','linkedin'];
  function show(f){ chips.forEach(function(c){ c.classList.toggle('pick', c.dataset.f === f); }); rows.forEach(function(r){ r.classList.toggle('hide', f !== 'all' && r.dataset.n !== f); }); }
  show('all');
  whenSeen(root, Scene({ reset: function(){ show('all'); }, steps: function(){ return order.slice(1).map(function(f){ return [2000, function(){ show(f); }]; }).concat([[2000, function(){}]]); } }));
})();

(function(){
  var root = $('#z-ai'); if (!root) return;
  var its = $$('.m-it', root), res = $('#m-res'), layers = [res.children[0], res.children[1], res.children[2]], prog = $('#m-prog'), pi = $('i', prog), prompt = $('#m-prompt'), kind = $('#m-kind'), go = $('#m-go'), wave = $('.m-wave', res);
  wave.innerHTML = [30,55,80,45,90,60,35,70,95,50,28,65,85,40,58].map(function(h, k){ return '<i style="--h:' + h + '%;--d:' + (k * 70) + 'ms"></i>'; }).join('');
  var jobs = [
    [0, 'Picture', 'A round sourdough loaf on a wood board, soft morning light, top view'],
    [3, 'Video', 'Slow push in on a baker shaping dough, flour in the air, 8 seconds'],
    [6, 'Voiceover', 'Warm, friendly voice: "Fresh sourdough, every Friday at Crumb and Co."']
  ];
  function reset(){ its.forEach(function(x){ off(x, 'on'); }); layers.forEach(function(l){ off(l, 'on'); }); off(prog, 'on'); pi.style.transition = 'none'; pi.style.width = '0'; prompt.textContent = ''; }
  whenSeen(root, Scene({ reset: reset, steps: function(sc){ var out = [];
    jobs.forEach(function(j, n){
      out.push([n ? 1800 : 300, function(){ layers.forEach(function(l){ off(l, 'on'); }); its.forEach(function(x){ off(x, 'on'); }); on(its[j[0]], 'on'); kind.textContent = j[1]; prompt.textContent = ''; }]);
      out.push([350, function(){ sc.type(prompt, j[2], 48); }]);
      out.push([1700, function(){ on(go, 'press'); }]);
      out.push([160, function(){ off(go, 'press'); on(prog, 'on'); pi.style.transition = 'none'; pi.style.width = '0'; void pi.offsetWidth; pi.style.transition = ''; pi.style.width = '100%'; }]);
      out.push([1700, function(){ off(prog, 'on'); on(layers[n], 'on'); }]);
    });
    out.push([1800, function(){}]);
    return out; } }));
})();

(function(){
  var root = $('#z-heat'); if (!root) return;
  var grid = $('#h-grid'), days = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'], hrs = ['8a','','10a','','12p','','2p','','4p','','6p',''];
  var html = '<span></span>' + hrs.map(function(h){ return '<span class="hc">' + h + '</span>'; }).join('');
  var vals = [];
  days.forEach(function(d, r){
    html += '<span class="hl">' + d + '</span>';
    for (var c = 0; c < 12; c++){
      var v = Math.max(0.05, Math.min(0.9, 0.06 + 0.55 * Math.exp(-Math.pow((c - 1.2) / 1.8, 2)) + 0.45 * Math.exp(-Math.pow((c - 10) / 1.6, 2)) - (r > 4 ? 0.22 : 0) + ((r * 7 + c * 3) % 5) * 0.03 - (r === 3 ? 0.05 : 0)));
      if (r === 1 && c === 1) v = 1;
      vals.push(v); html += '<span class="hx' + (r === 1 && c === 1 ? ' best' : '') + '"><i></i></span>';
    }
  });
  html += '<span class="h-tip" id="h-tip">Tue 9 AM is your best time</span>';
  grid.innerHTML = html;
  var cells = $$('.hx i', grid), best = $('.hx.best', grid), tip = $('#h-tip');
  function reset(){ cells.forEach(function(i){ i.style.transitionDelay = '0ms'; i.style.opacity = 0; }); off(tip, 'in'); best.style.boxShadow = 'none'; }
  whenSeen(root, Scene({ reset: reset, steps: function(){ return [
    [300, function(){ cells.forEach(function(i, k){ i.style.transitionDelay = (RM ? 0 : (k % 12) * 45 + Math.floor(k / 12) * 30) + 'ms'; i.style.opacity = vals[k].toFixed(2); }); }],
    [1400, function(){ best.style.boxShadow = ''; var a = grid.getBoundingClientRect(), b = best.getBoundingClientRect(); tip.style.left = Math.max(70, b.left - a.left + b.width / 2) + 'px'; tip.style.top = (b.top - a.top) + 'px'; on(tip, 'in'); }],
    [4200, function(){}]
  ]; } }));
})();

(function(){
  var root = $('#z-bio'); if (!root) return;
  var addb = $('#e-addb'), menu = $('#e-menu'), vid = $('#e-vid'), nb = $('#e-new'), pv = $('#e-pv');
  function reset(){ off(menu, 'in'); off(vid, 'hov'); on(nb, 'hide'); off(pv, 'in'); off(addb, 'pick'); }
  whenSeen(root, Scene({ reset: reset, steps: function(){ return [
    [900, function(){ on(addb, 'press'); }], [160, function(){ off(addb, 'press'); on(addb, 'pick'); on(menu, 'in'); }],
    [900, function(){ on(vid, 'hov'); }],
    [600, function(){ off(menu, 'in'); off(addb, 'pick'); off(nb, 'hide'); }],
    [400, function(){ on(pv, 'in'); }],
    [3400, function(){}]
  ]; } }));
})();

/* ---------- Networks: a yellow ring walks the grid ---------- */
(function(){
  var ts = $$('#nets .nt'); if (!ts.length || RM) return;
  var k = 0; setInterval(function(){ ts.forEach(function(t){ off(t, 'lit'); }); on(ts[k % ts.length], 'lit'); k++; }, 900);
})();

/* ---------- MCP guide ---------- */
(function(){
  if (!$('#mcp-demo')) return;
  var tabs = $$('.g-apps [role=tab]'), appName = $('#g-app'), logo = $('#c-logo use'), name = $('#c-name');
  var root = $('#mcp-demo'), ask = $('#c-ask'), calls = [$('#c1'), $('#c2'), $('#c3')], done = $('#c-done'), evs = $$('.g-drafts .ev', root);
  var apps = [['a-claude','Claude'],['a-chatgpt','ChatGPT'],['a-cursor','Cursor'],['a-code','Claude Code']];
  function reset(){ ask.textContent = ''; calls.forEach(function(c){ off(c, 'in'); off(c, 'done'); }); off(done, 'in'); evs.forEach(function(e){ off(e, 'in'); }); }
  var sc = Scene({ reset: reset, steps: function(s){ var out = [
    [400, function(){ s.type(ask, 'Use Capybaroar. Look at my channels and recent posts, then write a week of posts about our sourdough launch. Save them as drafts at my next queue times.', 55); }],
    [2900, function(){ on(calls[0], 'in'); }], [800, function(){ on(calls[0], 'done'); }],
    [300, function(){ on(calls[1], 'in'); }], [700, function(){ on(calls[1], 'done'); }],
    [300, function(){ on(calls[2], 'in'); }]
  ];
    evs.forEach(function(e, k){ out.push([k ? 140 : 700, function(){ on(e, 'in'); }]); });
    out.push([300, function(){ on(calls[2], 'done'); }]);
    out.push([400, function(){ on(done, 'in'); }]);
    out.push([4500, function(){}]);
    return out; } });
  whenSeen(root, sc);
  function pick(n, focus){
    tabs.forEach(function(t, k){ var o = k === n; t.setAttribute('aria-selected', o); t.tabIndex = o ? 0 : -1; document.getElementById(t.getAttribute('aria-controls')).hidden = !o; });
    appName.textContent = apps[n][1]; logo.setAttribute('href', '#' + apps[n][0]); name.textContent = apps[n][1];
    if (focus) tabs[n].focus();
  }
  tabs.forEach(function(t, k){
    t.addEventListener('click', function(){ pick(k); sc.stop(); sc.start(); });
    t.addEventListener('keydown', function(e){ var j = e.key === 'ArrowRight' ? k + 1 : e.key === 'ArrowLeft' ? k - 1 : null; if (j === null) return; e.preventDefault(); pick((j + tabs.length) % tabs.length, true); });
  });
})();

/* ---------- Copy buttons ---------- */
(function(){
  $$('.g-copy').forEach(function(b){
    b.addEventListener('click', function(){
      var src = b.parentNode.querySelector('pre') || b.parentNode.querySelector('p');
      var small = src.querySelector('small');
      var text = small ? src.textContent.slice(small.textContent.length) : src.textContent;
      var label = $('span', b);
      var flash = function(t){ label.textContent = t; setTimeout(function(){ label.textContent = 'Copy'; }, 1600); };
      var fallback = function(){ var r = document.createRange(); r.selectNodeContents(src); var s = getSelection(); s.removeAllRanges(); s.addRange(r); flash('Selected'); };
      try { navigator.clipboard.writeText(text).then(function(){ flash('Copied'); }, fallback); } catch (e) { fallback(); }
    });
  });
})();

/* ---------- Scenes placed on their own (feature pages) ---------- */
$$('[data-scene]').forEach(function(el){ if (S[el.dataset.scene]) whenSeen(el, S[el.dataset.scene]()); });

/* ---------- Mock cards that build in once when seen ---------- */
(function(){
  var vs = $$('[data-reveal]'); if (!vs.length) return;
  var go = function(v){ $$('.rv', v).forEach(function(x, k){ setTimeout(function(){ on(x, 'in'); }, RM ? 0 : 120 + k * 110); }); };
  if (!('IntersectionObserver' in window) || RM){ vs.forEach(go); return; }
  var io = new IntersectionObserver(function(es){ es.forEach(function(e){ if (e.isIntersecting){ go(e.target); io.unobserve(e.target); } }); }, { threshold: 0.25 });
  vs.forEach(function(v){ io.observe(v); });
})();
})();
