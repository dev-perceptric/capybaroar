/* The floating Capybaroar card on the free tools and the blog. It shows after someone uses a tool (copy, download,
   save) or scrolls past it, never on arrival, and a close keeps it away for 7 days. */
(function(){
  var el = document.querySelector('[data-promo]'); if (!el) return;
  var KEY = 'capy-promo-off', WEEK = 7 * 864e5;
  try { var off = +localStorage.getItem(KEY); if (off && Date.now() - off < WEEK) return; } catch (e) {}
  var shown = false, io = null;
  function show(){
    if (shown) return; shown = true; if (io) io.disconnect();
    el.hidden = false;
    requestAnimationFrame(function(){ requestAnimationFrame(function(){ el.classList.add('in'); document.body.classList.add('has-promo'); }); });
  }
  document.addEventListener('capy:used', function(){ setTimeout(show, 900); });
  var anchor = document.querySelector('.t-card') || document.querySelector('.hero-text') || document.querySelector('main > section');
  if ('IntersectionObserver' in window && anchor){
    io = new IntersectionObserver(function(es){ es.forEach(function(e){ if (!e.isIntersecting && e.boundingClientRect.top < 0) show(); }); });
    io.observe(anchor);
  } else setTimeout(show, 20000);
  el.querySelector('[data-promo-close]').addEventListener('click', function(){
    el.classList.remove('in'); document.body.classList.remove('has-promo');
    try { localStorage.setItem(KEY, String(Date.now())); } catch (e) {}
    setTimeout(function(){ el.hidden = true; }, 300);
  });
})();
