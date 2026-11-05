/* Nav menus: hover and focus open them in CSS; this adds click and tap, closes on Escape or a click outside, and keeps
   aria-expanded in step. Shared by every page. */
(function(){
  var dds = [].slice.call(document.querySelectorAll('.dd'));
  if (!dds.length) return;
  function set(d, open){ d.classList.toggle('open', open); d.querySelector('.dd-btn').setAttribute('aria-expanded', open ? 'true' : 'false'); }
  function closeAll(except){ dds.forEach(function(d){ if (d !== except) set(d, false); }); }
  dds.forEach(function(d){
    var btn = d.querySelector('.dd-btn');
    btn.addEventListener('click', function(){
      var open = !d.classList.contains('open');
      closeAll(d); set(d, open);
      // Closing by click must win over :hover and :focus-within until the pointer leaves.
      if (!open) { btn.blur(); d.classList.add('shut'); }
    });
    // A fresh hover or focus coming from outside opens it again.
    d.addEventListener('mouseenter', function(){ d.classList.remove('shut'); });
    d.addEventListener('focusout', function(e){ if (!d.contains(e.relatedTarget)) { d.classList.remove('shut'); set(d, false); } });
  });
  document.addEventListener('click', function(e){ if (!e.target.closest('.dd')) closeAll(); });
  document.addEventListener('keydown', function(e){
    if (e.key !== 'Escape') return;
    var d = document.activeElement && document.activeElement.closest && document.activeElement.closest('.dd');
    closeAll(); dds.forEach(function(x){ x.classList.add('shut'); });
    if (d) d.querySelector('.dd-btn').focus();
  });
})();
