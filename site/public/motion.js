/* Motion layer (new) */
(function(){
  var RM = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (RM || !('IntersectionObserver' in window)) return;
  var vh = function(){ return window.innerHeight || 800; };

  /* 1. Scroll reveal: only things below the fold get hidden first */
  var groups = [
    ['.head', '.tag, h2, p'],
    ['.ai-grid', '.ai-card'],
    ['.ai-foot', ':scope > *'],
    ['.nets-foot', ':scope > *'],
    ['.g-apps', ':scope > *'],
    ['.g-steps', '.g-step'],
    ['.v2-plans', '.v2-plan'],
    ['.faq', 'details'],
    ['.closing', '.closing-card'],
    ['.foot-grid', ':scope > *'],
    ['.z-text', ':scope > *'],
    ['.price-grid, .plans', ':scope > *']
  ];
  var rio = new IntersectionObserver(function(es){
    es.forEach(function(e){ if (e.isIntersecting){ var el=e.target; el.classList.add('mo-in'); rio.unobserve(el); setTimeout(function(){ el.classList.remove('mo-rv','mo-in'); el.style.removeProperty('--rd'); }, 1400); } });
  }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
  groups.forEach(function(g){
    document.querySelectorAll(g[0]).forEach(function(parent){
      if (parent.closest('.hero, .f-hero, .price-hero, [data-reveal]')) return;
      var kids = parent.querySelectorAll(g[1]);
      kids.forEach(function(el, i){
        if (el.classList.contains('rv') || el.closest('[data-reveal], [hidden]')) return;
        var r = el.getBoundingClientRect(); if (!r.height || r.top < vh()) return;
        el.style.setProperty('--rd', (i % 6) * 90 + 'ms');
        el.classList.add('mo-rv');
        rio.observe(el);
      });
    });
  });

  /* 2. AI cards: play the chat step by step */
  function play(card){
    if (card._t) card._t.forEach(clearTimeout);
    card._t = [];
    card.classList.remove('is-play');
    var used = card.querySelector('.ai-used');
    if (used) used.classList.remove('done');
    var steps = [].slice.call(card.querySelectorAll('[data-s]'));
    var t = 0, usedAt = 0;
    steps.forEach(function(el){
      if (el.classList.contains('ai-me')) t = 0;
      else if (el.classList.contains('ai-used')) { t = 450; usedAt = t; }
      else if (el.classList.contains('ai-say')) t = usedAt + 1100;
      else t = Math.max(t + 130, usedAt + (card.querySelector('.ai-say') ? 1500 : 1150));
      el.style.setProperty('--d', t + 'ms');
    });
    var last = steps[steps.length - 1];
    var lastD = last ? parseInt(last.style.getPropertyValue('--d')) : 0;
    var bars = card.querySelector('.ai-stats');
    if (bars) card.style.setProperty('--bd', (parseInt(bars.style.getPropertyValue('--d')) + 200) + 'ms');
    var img = card.querySelector('.ai-media');
    if (img) card.style.setProperty('--id', (parseInt(img.style.getPropertyValue('--d')) + 250) + 'ms');
    var old = card.querySelector('.ai-move .old');
    if (old) card.style.setProperty('--sd', (parseInt(old.style.getPropertyValue('--d')) + 350) + 'ms');
    void card.offsetWidth;
    card.classList.add('is-play');
    if (used) card._t.push(setTimeout(function(){ used.classList.add('done'); }, usedAt + 950));
    var num = card.querySelector('[data-count]');
    if (num){
      var target = +num.getAttribute('data-count'), start = parseInt(bars.style.getPropertyValue('--d')) + 150;
      num.textContent = '+0%';
      card._t.push(setTimeout(function(){
        var t0 = performance.now();
        (function step(now){
          var k = Math.min(1, (now - t0) / 900), e = 1 - Math.pow(1 - k, 3);
          num.textContent = '+' + Math.round(target * e) + '%';
          if (k < 1) requestAnimationFrame(step);
        })(t0);
      }, start));
    }
    card._done = false;
    card._t.push(setTimeout(function(){ card._done = true; }, lastD + 900));
  }
  var cards = [].slice.call(document.querySelectorAll('.ai-card'));
  cards.forEach(function(c){
    var img = c.querySelector('.ai-media img');
    if (img && !img.parentNode.classList.contains('ai-img')){
      var w = document.createElement('span'); w.className = 'ai-img';
      img.parentNode.insertBefore(w, img); w.appendChild(img);
    }
    c.classList.add('is-armed');
    c.addEventListener('mouseenter', function(){ if (c._done) play(c); });
  });
  var cio = new IntersectionObserver(function(es){
    es.forEach(function(e){
      var c = e.target;
      if (e.isIntersecting && !c._seen){ c._seen = true; setTimeout(function(){ play(c); }, 250); }
      if (!e.isIntersecting && c._seen && c._done){ c._seen = false; }
    });
  }, { threshold: 0.45 });
  cards.forEach(function(c){ cio.observe(c); });

  /* 3. Closing card: spotlight follows the pointer, calendar fills up */
  var cx = document.querySelector('.cx');
  if (!cx) return;
  cx.addEventListener('pointermove', function(e){
    var r = cx.getBoundingClientRect();
    cx.style.setProperty('--mx', (e.clientX - r.left) + 'px');
    cx.style.setProperty('--my', (e.clientY - r.top) + 'px');
  });
  var ps = [].slice.call(cx.querySelectorAll('.cx-p'));
  var cnt = cx.querySelector('.cx-cnt');
  var order = ps.map(function(_, i){ return i; });
  for (var i = order.length - 1; i > 0; i--){ var j = Math.floor(Math.random() * (i + 1)); var tmp = order[i]; order[i] = order[j]; order[j] = tmp; }
  var timer = null, running = false;
  function cycle(){
    var n = 0;
    ps.forEach(function(p){ p.classList.remove('on'); });
    if (cnt) cnt.textContent = '0';
    cx.classList.add('is-run');
    (function add(){
      if (!running) return;
      if (n < order.length){
        ps[order[n]].classList.add('on'); n++;
        if (cnt) cnt.textContent = n;
        timer = setTimeout(add, 150);
      } else {
        cx.classList.remove('is-run');
        timer = setTimeout(function(){
          var k = 0;
          (function off(){
            if (!running) return;
            if (k < order.length){ ps[order[order.length - 1 - k]].classList.remove('on'); k++; timer = setTimeout(off, 35); }
            else { timer = setTimeout(cycle, 500); }
          })();
        }, 3200);
      }
    })();
  }
  var xio = new IntersectionObserver(function(es){
    es.forEach(function(e){
      if (e.isIntersecting && !running){
        running = true; cx.classList.add('is-armed'); cycle();
      } else if (!e.isIntersecting && running){
        running = false; clearTimeout(timer); cx.classList.remove('is-run');
        ps.forEach(function(p){ p.classList.add('on'); });
        if (cnt) cnt.textContent = ps.length;
      }
    });
  }, { threshold: 0.3 });
  xio.observe(cx);
})();
