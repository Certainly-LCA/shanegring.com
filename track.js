/* Lead and intent events. Pushed to dataLayer, picked up by GTM, sent to GA4.
   GTM only loads on the production host (see the head snippet on each page), so
   every push here is a harmless no-op on localhost and on preview builds. */
(function () {
  var dl = (window.dataLayer = window.dataLayer || []);

  function push(name, params) {
    var payload = { event: name, page_path: window.location.pathname };
    if (params) {
      for (var k in params) {
        if (Object.prototype.hasOwnProperty.call(params, k)) payload[k] = params[k];
      }
    }
    dl.push(payload);
  }

  // Let page-level scripts (the Scan) fire events without repeating this.
  window.sgTrack = push;

  // FormSubmit sends people back to the page with a hash once the mail is away,
  // so the hash on load is the only completion signal these forms have.
  var confirmations = {
    '#contact-sent': { form_name: 'contact', lead_source: 'contact_form' },
    '#intake-sent': { form_name: 'read_intake', lead_source: 'read_intake_form' }
  };
  var confirmed = confirmations[window.location.hash];
  if (confirmed) push('generate_lead', confirmed);

  // Booking and checkout both leave the site, so the click is the only signal.
  document.addEventListener('click', function (e) {
    var el = e.target;
    if (!el || typeof el.closest !== 'function') return;

    var booking = el.closest('a[href*="cal.com/shane-gring"], [data-cal-link]');
    if (booking) {
      var link = booking.getAttribute('data-cal-link') || booking.getAttribute('href') || '';
      push('book_call_click', { booking_type: link.split('/').pop(), link_url: link });
      return;
    }

    var checkout = el.closest('a[href*="buy.stripe.com"]');
    if (checkout) {
      push('begin_checkout', { link_url: checkout.getAttribute('href') || '' });
    }
  });
})();
