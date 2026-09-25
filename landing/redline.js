/* Redline landing page — progressive enhancement only.
   Without JS every flag is open and fully readable; JS collapses the
   secondary flags so one flag is open at a time, and arms the strike. */

(function () {
  "use strict";

  var root = document.documentElement;
  root.classList.add("js");

  var flags = Array.prototype.slice.call(document.querySelectorAll(".flag"));
  if (!flags.length) return;

  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function bodyOf(flag) {
    return flag.querySelector(".flag__body");
  }

  function setOpen(flag, open, animate) {
    var toggle = flag.querySelector(".flag__toggle");
    var body = bodyOf(flag);
    if (!toggle || !body) return;

    toggle.setAttribute("aria-expanded", open ? "true" : "false");
    flag.classList.toggle("is-open", open);

    if (!animate || reduced) {
      body.hidden = !open;
      body.style.height = "";
      return;
    }

    if (open) {
      body.hidden = false;
      var target = body.scrollHeight;
      body.style.height = "0px";
      // force layout so the transition has a start value
      void body.offsetHeight;
      body.style.transition = "height 260ms cubic-bezier(0.16, 1, 0.3, 1)";
      body.style.height = target + "px";
      body.addEventListener("transitionend", function done(e) {
        if (e.propertyName !== "height") return;
        body.removeEventListener("transitionend", done);
        body.style.transition = "";
        body.style.height = "";
      });
    } else {
      body.style.height = body.scrollHeight + "px";
      void body.offsetHeight;
      body.style.transition = "height 220ms cubic-bezier(0.16, 1, 0.3, 1)";
      body.style.height = "0px";
      body.addEventListener("transitionend", function done(e) {
        if (e.propertyName !== "height") return;
        body.removeEventListener("transitionend", done);
        body.style.transition = "";
        body.style.height = "";
        body.hidden = true;
      });
    }
  }

  flags.forEach(function (flag) {
    var lead = flag.classList.contains("flag--lead");
    setOpen(flag, lead, false);

    var toggle = flag.querySelector(".flag__toggle");
    if (!toggle) return;

    toggle.addEventListener("click", function () {
      var isOpen = toggle.getAttribute("aria-expanded") === "true";
      if (isOpen) {
        setOpen(flag, false, true);
        return;
      }
      // one flag fully open at a time
      flags.forEach(function (other) {
        if (other !== flag && other.querySelector(".flag__toggle").getAttribute("aria-expanded") === "true") {
          setOpen(other, false, true);
        }
      });
      setOpen(flag, true, true);
    });
  });
})();
