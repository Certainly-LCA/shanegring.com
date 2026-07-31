/* Site nav robustness — layered on top of the inline hamburger toggle so
   the basic mobile menu still works even if this file fails to load.
   Adds: close on Escape / outside-click / resize, tap-to-open the
   "Work with me" submenu on touch (no-hover) devices, and aria state.
   Deliberately does NOT bind the hamburger click (the inline handler owns
   it) so the two never double-fire. */
(function () {
  var nav = document.querySelector('.site-nav');
  if (!nav) return;

  var menu = nav.querySelector('#nav-menu');
  var toggle = nav.querySelector('.nav-toggle');
  var drop = nav.querySelector('.nav-drop');
  var dropLink = drop ? drop.querySelector('a') : null;

  if (dropLink) {
    dropLink.setAttribute('aria-haspopup', 'true');
    dropLink.setAttribute('aria-expanded', 'false');
  }

  function closeMobile() {
    if (menu) menu.classList.remove('open');
    if (toggle) toggle.setAttribute('aria-expanded', 'false');
  }
  function closeDrop() {
    if (drop) drop.classList.remove('open');
    if (dropLink) dropLink.setAttribute('aria-expanded', 'false');
  }
  function closeAll() { closeMobile(); closeDrop(); }

  // Touch / no-hover devices at desktop width: hover can't open the submenu,
  // so the first tap on "Work with me" opens it; a second tap follows the link.
  if (drop && dropLink) {
    var noHover = window.matchMedia('(hover: none)');
    dropLink.addEventListener('click', function (e) {
      if (window.innerWidth > 768 && noHover.matches && !drop.classList.contains('open')) {
        e.preventDefault();
        drop.classList.add('open');
        dropLink.setAttribute('aria-expanded', 'true');
      }
    });
    // Keep aria in sync when hover/focus opens it via CSS.
    drop.addEventListener('mouseenter', function () { if (window.innerWidth > 768) dropLink.setAttribute('aria-expanded', 'true'); });
    drop.addEventListener('mouseleave', function () { if (!drop.classList.contains('open')) dropLink.setAttribute('aria-expanded', 'false'); });
  }

  // Escape closes everything.
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' || e.keyCode === 27) closeAll();
  });

  // A click outside the nav closes any open menu.
  document.addEventListener('click', function (e) {
    if (!nav.contains(e.target)) closeAll();
  });

  // Crossing the mobile/desktop breakpoint should never leave a menu stuck open.
  var rt;
  window.addEventListener('resize', function () {
    clearTimeout(rt);
    rt = setTimeout(closeAll, 150);
  });
})();

/* Fragment-scroll fallback.
   `scroll-behavior: smooth` on <html> makes Chrome drop the initial fragment
   scroll on a fresh page load: /partner#site-you-have and /site#inquiry both
   land at the top of the page instead of at the section. This predates the
   offer restructure, but it started mattering with it — /holding-pattern
   301s to /partner#site-you-have, and that is where Scan traffic lands.

   Only corrects the case the browser got wrong (still parked at the top).
   If the reader has already scrolled, leave them alone. */
(function () {
  var hash = window.location.hash;
  if (!hash || hash.length < 2) return;

  var id;
  try { id = decodeURIComponent(hash.slice(1)); } catch (e) { id = hash.slice(1); }
  if (!id) return;

  var done = false;
  function apply() {
    if (done) return;
    done = true;
    var el = document.getElementById(id);
    if (!el) return;
    var se = document.scrollingElement || document.documentElement;
    if (se.scrollTop > 4) return; // browser (or reader) already moved us
    el.scrollIntoView({ block: 'start', behavior: 'instant' });
  }

  if (document.readyState === 'complete') setTimeout(apply, 0);
  else window.addEventListener('load', function () { setTimeout(apply, 0); });
})();
