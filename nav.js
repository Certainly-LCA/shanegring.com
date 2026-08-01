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

/* Mobile overlay behaviour.
   The menu is a full-screen overlay under 768px, and an overlay owes the
   user four things the inline toggle does not provide: the background must
   not scroll underneath it, focus must stay inside it, Escape must close
   it, and focus must return to the button that opened it.

   The inline hamburger handler still owns the open/close class — this
   watches for it rather than binding the click, so the two never
   double-fire (same rule as the rest of this file). */
(function () {
  var nav = document.querySelector('.site-nav');
  if (!nav) return;
  var menu = nav.querySelector('#nav-menu');
  var toggle = nav.querySelector('.nav-toggle');
  if (!menu || !toggle || !window.MutationObserver) return;

  var FOCUSABLE = 'a[href], button:not([disabled]), input, select, textarea, [tabindex]:not([tabindex="-1"])';
  var isMobile = function () { return window.matchMedia('(max-width: 768px)').matches; };
  var open = false;

  function focusables() {
    return Array.prototype.filter.call(
      menu.querySelectorAll(FOCUSABLE),
      function (el) { return el.offsetParent !== null; }
    );
  }

  function onKeydown(e) {
    if (e.key !== 'Tab' && e.keyCode !== 9) return;
    var items = focusables();
    if (!items.length) return;
    // the toggle is the close button, so it belongs inside the loop
    items.unshift(toggle);
    var first = items[0], last = items[items.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  }

  function onOpen() {
    open = true;
    document.body.classList.add('nav-open');
    document.addEventListener('keydown', onKeydown, true);
  }

  function onClose(returnFocus) {
    open = false;
    document.body.classList.remove('nav-open');
    document.removeEventListener('keydown', onKeydown, true);
    if (returnFocus) { try { toggle.focus(); } catch (e) {} }
  }

  new MutationObserver(function () {
    var nowOpen = menu.classList.contains('open') && isMobile();
    if (nowOpen && !open) onOpen();
    else if (!nowOpen && open) onClose(false);
  }).observe(menu, { attributes: true, attributeFilter: ['class'] });

  // Tapping a link inside the overlay must dismiss it — otherwise a
  // same-page anchor leaves the menu covering the section it jumped to.
  menu.addEventListener('click', function (e) {
    if (!open) return;
    var a = e.target.closest && e.target.closest('a[href]');
    if (!a) return;
    menu.classList.remove('open');
    toggle.setAttribute('aria-expanded', 'false');
    onClose(false);
  });

  // Escape closes and hands focus back to the button that opened it.
  document.addEventListener('keydown', function (e) {
    if (!open) return;
    if (e.key === 'Escape' || e.keyCode === 27) {
      menu.classList.remove('open');
      toggle.setAttribute('aria-expanded', 'false');
      onClose(true);
    }
  });

  // Crossing back to desktop width must not leave the body scroll-locked.
  window.addEventListener('resize', function () {
    if (open && !isMobile()) onClose(false);
  });
})();

/* Same-page anchor clicks.
   `scroll-behavior: smooth` on <html> makes in-page jumps unreliable in the
   same way it broke the on-load fragment scroll above — sometimes the jump
   simply does not happen. The three question links at the top of
   /work-with-me are the whole point of that block, so drive the scroll
   ourselves instead of trusting the default, and keep the URL updating so
   the link is still copyable and the back button still works. */
(function () {
  document.addEventListener('click', function (e) {
    if (e.defaultPrevented || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
    var a = e.target.closest && e.target.closest('a[href^="#"]');
    if (!a) return;
    var id = a.getAttribute('href').slice(1);
    if (!id) return;
    var el = document.getElementById(id);
    if (!el) return;
    e.preventDefault();
    var se = document.scrollingElement || document.documentElement;
    var before = se.scrollTop;
    el.scrollIntoView({ block: 'start', behavior: 'smooth' });

    /* Smooth scrolling silently does nothing in some engines. Check back
       once the animation would have finished and correct it, but only if
       nothing moved at all — if the reader scrolled themselves in the
       meantime, leave them where they are. */
    setTimeout(function () {
      var moved = Math.abs(se.scrollTop - before) > 2;
      var arrived = Math.abs(el.getBoundingClientRect().top) < 120;
      if (!moved && !arrived) el.scrollIntoView({ block: 'start', behavior: 'instant' });
    }, 500);

    if (history.replaceState) history.replaceState(null, '', '#' + id);
    else window.location.hash = id;
    // keep it reachable for keyboard and screen-reader users
    if (!el.hasAttribute('tabindex')) el.setAttribute('tabindex', '-1');
    el.focus({ preventScroll: true });
  }, false);
})();
