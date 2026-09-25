/* Redline workspace — progressive enhancement.
   Nothing here invents an analysis: there is no model, database or upload
   endpoint in this build, and every control that would need one says so
   plainly rather than faking a result.

   Handlers are delegated from the document, not bound to nodes, because
   the report body is replaced wholesale when a library document loads. */

(function () {
  "use strict";

  var root = document.documentElement;
  root.classList.add("js");

  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var lastFocus = null;

  function $(sel, ctx) { return (ctx || document).querySelector(sel); }
  function $$(sel, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(sel)); }

  /* ---------- toast ---------- */

  var toast = $("#toast");
  var toastTimer = null;

  function say(msg) {
    if (!toast) return;
    toast.textContent = msg;
    toast.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { toast.hidden = true; }, 4500);
  }

  /* ---------- flags: one open at a time ---------- */

  function syncFlag(flag, open) {
    var toggle = $(".flag__toggle", flag);
    var body = $(".flag__body", flag);
    if (!toggle || !body) return;
    toggle.setAttribute("aria-expanded", open ? "true" : "false");
    body.hidden = !open;
    flag.classList.toggle("is-open", open);
  }

  function initFlags() {
    $$(".flag").forEach(function (flag) {
      var toggle = $(".flag__toggle", flag);
      if (!toggle) return;
      syncFlag(flag, toggle.getAttribute("aria-expanded") === "true");
    });
  }

  document.addEventListener("click", function (e) {
    var toggle = e.target.closest ? e.target.closest(".flag__toggle") : null;
    if (!toggle) return;
    var flag = toggle.closest(".flag");
    var isOpen = toggle.getAttribute("aria-expanded") === "true";
    if (!isOpen) {
      $$(".flag").forEach(function (other) {
        if (other !== flag) syncFlag(other, false);
      });
    }
    syncFlag(flag, !isOpen);
  });

  /* ---------- panels ---------- */

  var scrim = $("#scrim");

  function focusables(panel) {
    return $$("button, [href], input, textarea, select, [tabindex]:not([tabindex='-1'])", panel)
      .filter(function (el) { return !el.disabled && el.offsetParent !== null; });
  }

  function openPanel(name, citeClause) {
    var panel = $("#panel-" + name);
    if (!panel) return;
    $$(".panel").forEach(function (p) { p.hidden = true; });
    lastFocus = document.activeElement;
    panel.hidden = false;
    if (scrim) scrim.hidden = false;
    document.body.classList.add("is-locked");

    if (name === "doc" && citeClause) {
      $$(".doc__cl", panel).forEach(function (p) { p.classList.remove("is-cited"); });
      var target = $('.doc__cl[data-cl="' + citeClause + '"]', panel);
      if (target) {
        target.classList.add("is-cited");
        target.scrollIntoView({ block: "center", behavior: reduced ? "auto" : "smooth" });
      }
    }

    var head = $(".panel__title", panel);
    if (head) { head.setAttribute("tabindex", "-1"); head.focus(); }
  }

  function closePanels(silent) {
    var wasOpen = $$(".panel").some(function (p) { return !p.hidden; });
    $$(".panel").forEach(function (p) { p.hidden = true; });
    if (scrim) scrim.hidden = true;
    document.body.classList.remove("is-locked");
    if (!silent && wasOpen && lastFocus && lastFocus.focus) lastFocus.focus();
  }

  document.addEventListener("click", function (e) {
    var opener = e.target.closest ? e.target.closest("[data-panel]") : null;
    if (opener) { openPanel(opener.getAttribute("data-panel")); return; }

    var cite = e.target.closest ? e.target.closest("[data-doc]") : null;
    if (cite) { openPanel("doc", cite.getAttribute("data-doc")); return; }

    if (e.target.closest && e.target.closest("[data-close]")) { closePanels(); return; }
    if (scrim && e.target === scrim) { closePanels(); }
  });

  document.addEventListener("keydown", function (e) {
    var open = $$(".panel").filter(function (p) { return !p.hidden; })[0];
    if (!open) return;

    if (e.key === "Escape") { closePanels(); return; }
    if (e.key !== "Tab") return;

    /* keep Tab inside the open panel */
    var items = focusables(open);
    if (!items.length) return;
    var first = items[0];
    var last = items[items.length - 1];
    var active = document.activeElement;

    if (!open.contains(active)) { e.preventDefault(); first.focus(); return; }
    if (e.shiftKey && active === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && active === last) { e.preventDefault(); first.focus(); }
  });

  /* ---------- copy ---------- */

  function copyText(text, label) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(
        function () { say(label + " copied to your clipboard."); },
        function () { say("Could not reach the clipboard. Select the wording and copy it."); }
      );
    } else {
      say("Could not reach the clipboard. Select the wording and copy it.");
    }
  }

  document.addEventListener("click", function (e) {
    var btn = e.target.closest ? e.target.closest("[data-copy]") : null;
    if (!btn) return;
    var flag = btn.closest(".flag");
    var text = flag ? $(".counter", flag) : null;
    if (text) copyText(text.textContent.trim(), "Counter-offer wording");
  });

  document.addEventListener("click", function (e) {
    var btn = e.target.closest ? e.target.closest("#send-btn") : null;
    if (!btn || btn.disabled) return;
    var parts = $$(".counter").map(function (c) {
      var flag = c.closest(".flag");
      var ref = flag ? $(".flag__ref", flag) : null;
      var label = ref ? ref.textContent.replace(/Matches one of your red lines\./, "").trim() : "";
      return (label ? label + " — " : "") + c.textContent.trim();
    });
    if (!parts.length) { say("There are no counter-offers on this document."); return; }
    copyText(parts.join("\n\n"), parts.length + " counter-offers");
  });

  /* ---------- red lines ---------- */

  function refreshRedlineCount() {
    var list = $("#rl-list");
    var count = $("#rl-count");
    if (!list || !count) return;
    var matched = $$(".rl__item--matched", list).length;
    count.textContent = matched + " matched";
  }

  document.addEventListener("submit", function (e) {
    if (!e.target.matches || !e.target.matches("#rl-form")) return;
    e.preventDefault();
    var input = $("#rl-input");
    var value = input ? input.value.trim() : "";
    if (!value) { if (input) input.focus(); return; }

    var li = document.createElement("li");
    li.className = "rl__item";
    var text = document.createElement("span");
    text.className = "rl__text";
    text.textContent = value;
    var status = document.createElement("span");
    status.className = "rl__status rl__status--clear";
    status.textContent = "Added — not checked against this document yet";
    var remove = document.createElement("button");
    remove.type = "button";
    remove.className = "linkish";
    remove.setAttribute("data-remove", "");
    remove.textContent = "Remove";
    li.appendChild(text); li.appendChild(status); li.appendChild(remove);
    $("#rl-list").appendChild(li);
    input.value = "";
    say("Red line added. Re-inspect the document to check it against the text.");
  });

  document.addEventListener("click", function (e) {
    var rm = e.target.closest ? e.target.closest("[data-remove]") : null;
    if (!rm) return;
    var item = rm.closest(".rl__item");
    if (item) { item.remove(); refreshRedlineCount(); }
  });

  /* ---------- queries: no model is connected, so say so ---------- */

  document.addEventListener("submit", function (e) {
    if (!e.target.matches || !e.target.matches("#qform")) return;
    e.preventDefault();

    var input = $("#qinput");
    var btn = $("#qform button[type=submit]");
    var value = input ? input.value.trim() : "";
    if (!value) { if (input) input.focus(); return; }

    if (btn) { btn.classList.add("is-busy"); btn.setAttribute("aria-busy", "true"); btn.disabled = true; }

    setTimeout(function () {
      if (btn) { btn.classList.remove("is-busy"); btn.removeAttribute("aria-busy"); btn.disabled = false; }

      var li = document.createElement("li");
      li.className = "q";

      var ask = document.createElement("p");
      ask.className = "q__ask";
      ask.textContent = value;

      var ans = document.createElement("div");
      ans.className = "q__ans q__ans--refused";
      var head = document.createElement("p");
      head.className = "q__refusal";
      head.textContent = "Not answered in this build";
      var body = document.createElement("p");
      body.textContent = "No model is connected to this workspace yet, so this question has not been put to the document. Redline will not guess at an answer, and an invented one would be exactly the failure this product exists to avoid.";
      ans.appendChild(head); ans.appendChild(body);

      li.appendChild(ask); li.appendChild(ans);
      var list = $("#qlist");
      if (list) list.appendChild(li);
      if (input) input.value = "";
      li.scrollIntoView({ block: "nearest", behavior: reduced ? "auto" : "smooth" });
    }, reduced ? 120 : 420);
  });

  /* ---------- view switch: report <-> intake ---------- */

  var report = $("#report");
  var intake = $("#intake");
  var analysing = $("#analysing");
  var reportBody = $("#report-body");

  document.addEventListener("click", function (e) {
    var btn = e.target.closest ? e.target.closest("[data-view]") : null;
    if (!btn || btn.getAttribute("data-view") !== "intake") return;
    closePanels(true);
    if (report) report.hidden = true;
    if (intake) {
      intake.hidden = false;
      var h = $("#intake-head");
      if (h) { h.setAttribute("tabindex", "-1"); h.focus(); }
    }
  });

  /* file reading, in the browser, for the formats we can honestly read */
  document.addEventListener("click", function (e) {
    if (!e.target.closest || !e.target.closest("#file-btn")) return;
    var input = $("#file-input");
    if (input) input.click();
  });

  document.addEventListener("change", function (e) {
    if (!e.target.matches || !e.target.matches("#file-input")) return;
    var f = e.target.files && e.target.files[0];
    if (!f) return;
    if (!/\.(txt|md)$/i.test(f.name)) {
      say("This build reads .txt and .md only — a PDF reader is a dependency nobody has approved yet.");
      return;
    }
    var r = new FileReader();
    r.onload = function () {
      var paste = $("#paste");
      if (paste) { paste.value = String(r.result || ""); paste.focus(); }
      say(f.name + " read in your browser. Nothing has left it.");
    };
    r.readAsText(f);
  });

  document.addEventListener("submit", function (e) {
    if (!e.target.matches || !e.target.matches("#intake-form")) return;
    e.preventDefault();

    var paste = $("#paste");
    var err = $("#intake-err");
    var value = paste ? paste.value.trim() : "";

    if (!value) {
      if (err) err.hidden = false;
      if (paste) { paste.setAttribute("aria-invalid", "true"); paste.focus(); }
      return;
    }
    if (err) err.hidden = true;
    if (paste) paste.removeAttribute("aria-invalid");

    if (intake) intake.hidden = true;
    if (report) report.hidden = false;
    if (reportBody) reportBody.hidden = true;
    if (analysing) analysing.hidden = false;

    runSteps(function () {
      if (analysing) analysing.hidden = true;
      if (reportBody) reportBody.hidden = false;
      say("This build has no analysis connected, so the example report is shown unchanged.");
      window.scrollTo({ top: 0, behavior: reduced ? "auto" : "smooth" });
    });
  });

  function runSteps(done) {
    var steps = $$(".step");
    if (!steps.length) { done(); return; }
    var i = 0;
    steps.forEach(function (s) { s.classList.remove("is-active", "is-done"); });

    function next() {
      if (i > 0) steps[i - 1].classList.add("is-done");
      if (i >= steps.length) { done(); return; }
      steps[i].classList.add("is-active");
      i++;
      setTimeout(next, reduced ? 220 : 650);
    }
    next();
  }

  /* ---------- library: load the flagged report or the all-clear ---------- */

  var flaggedHTML = reportBody ? reportBody.innerHTML : "";

  function clearRow(n, name) {
    return '<li class="scoperow"><span class="scoperow__n tnum">' + n + '</span>' +
      '<span class="scoperow__name">' + name + '</span>' +
      '<span class="scoperow__status"><span class="sound"><span class="sound__tick" aria-hidden="true">' +
      '<svg viewBox="0 0 16 16" width="15" height="15" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="square"><path d="M2.5 8.5 6 12l7.5-8"/></svg>' +
      '</span>Inspected &middot; not found</span></span></li>';
  }

  var ALL_CLEAR = [
    '<section class="summary">',
    '<h2 class="sect-head">What this document commits you to</h2>',
    '<div class="sect-body">',
    '<p class="summary__text">This retainer engages you for a fixed monthly fee, payable within fourteen days of invoice. It is terminable by either side on thirty days&rsquo; notice, it caps each side&rsquo;s liability at the fees paid in the preceding three months, and it leaves ownership of your pre-existing tools with you.</p>',
    '<p class="summary__hedge">What these clauses mean in law depends on your jurisdiction. Redline describes what the document says; it does not advise you whether to sign.</p>',
    '</div>',
    '</section>',
    '<section class="allclear-section">',
    '<div class="allclear-block">',
    '<p class="stamp">All clear</p>',
    '<div>',
    '<h2 class="sect-head">No clause on the published list was found.</h2>',
    '<p class="sect-note">That is the result, not an empty screen. Every clause type below was inspected and found absent. An all-clear is the highest-liability output Redline produces, so it is reported with its full scope.</p>',
    '</div>',
    '</div>',
    '</section>',
    '<section class="scope">',
    '<div class="sect-bar"><h2 class="sect-head">What was looked for</h2>',
    '<p class="sect-note">All eight clause types inspected. None found.</p></div>',
    '<ol class="scopelist">',
    clearRow(1, 'Personal guarantees'),
    clearRow(2, 'Uncapped indemnification'),
    clearRow(3, 'Non-compete and non-solicit'),
    clearRow(4, 'IP assignment and work-for-hire'),
    clearRow(5, 'Limitation of liability and remedy-stripping'),
    clearRow(6, 'Termination and notice'),
    clearRow(7, 'Payment terms and nonpayment exposure'),
    clearRow(8, 'Scope and change control'),
    '</ol>',
    '<p class="scope__note">None of your red lines matched this document either. A clause that is not on this list is not looked for, and a risk arising from something the document <em>does not say</em> has no sentence to quote. An all-clear means these eight were checked &mdash; not that the document is safe.</p>',
    '</section>',
    '<section class="limits">',
    '<h2 class="sect-head">Limitations of this inspection</h2>',
    '<ul class="limitlist">',
    '<li><b>No verdict.</b> Redline never tells you whether to sign, and it is not legal advice.</li>',
    '<li><b>Negotiable documents only.</b> Terms of service and other take-it-or-leave-it documents are out of scope.</li>',
    '<li><b>Typed text only.</b> Scanned or photographed documents are not inspected.</li>',
    '<li><b>No sentence, no flag.</b> Where the exact wording cannot be quoted, the flag is withheld rather than approximated.</li>',
    '</ul>',
    '</section>',
    '<section class="queries" aria-labelledby="queries-head-ac">',
    '<div class="sect-bar"><h2 class="sect-head" id="queries-head-ac">Queries</h2>',
    '<p class="sect-note">Answered from this document only. Where the text does not answer, Redline says so.</p></div>',
    '<div class="sect-body">',
    '<ol class="qlist" id="qlist"></ol>',
    '<form class="qform" id="qform">',
    '<label class="minor" for="qinput">Ask this document a question</label>',
    '<div class="qform__row">',
    '<input type="text" id="qinput" name="q" class="field" placeholder="e.g. how much notice must I give?" autocomplete="off">',
    '<button type="submit" class="btn btn--primary">Ask</button>',
    '</div>',
    '<p class="qform__note">Answers quote the document. Nothing is inferred from outside it.</p>',
    '</form>',
    '</div>',
    '</section>'
  ].join("");

  function setHead(btn, flags) {
    var name = $(".lib__name", btn.closest(".lib__item"));
    var docName = $("#doc-name");
    var metaFlags = $("#meta-flags");
    var metaExtract = $("#meta-extract");
    var inspected = $("#meta-inspected");
    var expiry = $("#meta-expiry");

    if (docName && name) docName.textContent = name.textContent;
    if (metaFlags) metaFlags.textContent = flags;
    if (metaExtract && btn.dataset.extract) metaExtract.textContent = btn.dataset.extract;
    if (inspected && btn.dataset.inspected) {
      inspected.textContent = btn.dataset.inspected;
      if (btn.dataset.iso) inspected.setAttribute("datetime", btn.dataset.iso);
    }
    if (expiry && btn.dataset.expiry) {
      expiry.textContent = btn.dataset.expiry;
      if (btn.dataset.expiryIso) expiry.setAttribute("datetime", btn.dataset.expiryIso);
    }
  }

  function setCopyAllEnabled(on) {
    var btn = $("#send-btn");
    if (!btn) return;
    btn.disabled = !on;
    if (on) btn.removeAttribute("title");
    else btn.setAttribute("title", "This document has no counter-offers to copy.");
  }

  document.addEventListener("click", function (e) {
    var btn = e.target.closest ? e.target.closest("[data-load]") : null;
    if (!btn) return;

    var which = btn.getAttribute("data-load");
    var item = btn.closest(".lib__item");

    $$(".lib__item").forEach(function (li) { li.classList.remove("lib__item--current"); });
    if (item) item.classList.add("lib__item--current");

    if (report) report.hidden = false;
    if (intake) intake.hidden = true;

    if (which === "clear") {
      if (reportBody) reportBody.innerHTML = ALL_CLEAR;
      setHead(btn, "0");
      setCopyAllEnabled(false);
    } else {
      if (reportBody) reportBody.innerHTML = flaggedHTML;
      setHead(btn, btn.dataset.flags || "4");
      setCopyAllEnabled(true);
      initFlags();
    }
    closePanels();
    window.scrollTo({ top: 0, behavior: reduced ? "auto" : "smooth" });
  });

  /* ---------- go ---------- */

  initFlags();
  refreshRedlineCount();
})();
