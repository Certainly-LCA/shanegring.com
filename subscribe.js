/**
 * Newsletter signup form — progressive enhancement for .sub-form.
 *
 * The form posts to /api/subscribe (functions/api/subscribe.js), which holds
 * the beehiiv key server-side. Without JavaScript the form cannot submit, so
 * each one carries a <noscript> link to beehiiv's own hosted page; that is
 * the fallback rather than a broken control.
 */
(function () {
  var forms = document.querySelectorAll(".sub-form");
  if (!forms.length) return;

  function setMessage(form, text, kind) {
    var msg = form.querySelector(".sub-form-msg");
    if (!msg) return;
    msg.textContent = text;
    msg.className = "sub-form-msg" + (kind ? " sub-form-msg-" + kind : "");
  }

  Array.prototype.forEach.call(forms, function (form) {
    form.addEventListener("submit", function (event) {
      event.preventDefault();

      var input = form.querySelector('input[name="email"]');
      var button = form.querySelector('button[type="submit"]');
      var trap = form.querySelector('input[name="company"]');
      var email = input ? input.value.trim() : "";

      if (!email || email.indexOf("@") < 1 || email.indexOf(".") < 0) {
        setMessage(form, "That email doesn't look right.", "error");
        if (input) input.focus();
        return;
      }

      if (button) {
        button.disabled = true;
        button.dataset.label = button.innerHTML;
        button.textContent = "Sending…";
      }
      setMessage(form, "");

      fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email,
          company: trap ? trap.value : "",
          source: form.getAttribute("data-source") || "blog"
        })
      })
        .then(function (res) {
          return res.json().then(function (body) {
            return { ok: res.ok, body: body };
          });
        })
        .then(function (result) {
          if (!result.ok) {
            setMessage(form, (result.body && result.body.error) || "Something went wrong. Try again.", "error");
            return;
          }
          // "active" means beehiiv already had the address. Saying so beats a
          // generic thank-you that leaves someone wondering whether it worked
          // the first time.
          var already = result.body && result.body.status === "active";
          form.classList.add("sub-form-done");
          setMessage(
            form,
            already
              ? "You're already on the list — nothing else to do."
              : "Done. Check your inbox to confirm.",
            "ok"
          );
          if (input) input.value = "";

          if (window.dataLayer) {
            window.dataLayer.push({
              event: "newsletter_subscribe",
              form_source: form.getAttribute("data-source") || "blog"
            });
          }
        })
        .catch(function () {
          setMessage(form, "Couldn't reach the server. Try again in a moment.", "error");
        })
        .then(function () {
          if (button) {
            button.disabled = false;
            if (button.dataset.label) button.innerHTML = button.dataset.label;
          }
        });
    });
  });
})();
