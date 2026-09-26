"use client";

/* Redline landing page — progressive enhancement only.
   Without JS every flag is open and fully readable; JS collapses the
   secondary flags so one flag is open at a time, and arms the strike.

   Ported from landing/redline.js. It stays imperative on purpose: the
   server-rendered markup is the no-JS baseline the CSS was authored
   against, so enhancement must not change what the first paint contains.
   The `js` class on <html> is what the stylesheet keys the strike off. */

import { useEffect } from "react";

export function FlagAccordion() {
  useEffect(() => {
    const root = document.documentElement;
    root.classList.add("js");

    const flags = Array.prototype.slice.call(
      document.querySelectorAll(".flag"),
    ) as HTMLElement[];
    if (!flags.length) {
      return () => {
        root.classList.remove("js");
      };
    }

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)")
      .matches;

    const controller = new AbortController();

    function bodyOf(flag: HTMLElement): HTMLElement | null {
      return flag.querySelector<HTMLElement>(".flag__body");
    }

    function setOpen(flag: HTMLElement, open: boolean, animate: boolean) {
      const toggle = flag.querySelector<HTMLElement>(".flag__toggle");
      const body = bodyOf(flag);
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
        const target = body.scrollHeight;
        body.style.height = "0px";
        // force layout so the transition has a start value
        void body.offsetHeight;
        body.style.transition = "height 260ms cubic-bezier(0.16, 1, 0.3, 1)";
        body.style.height = target + "px";
        body.addEventListener("transitionend", function done(e) {
          if ((e as TransitionEvent).propertyName !== "height") return;
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
          if ((e as TransitionEvent).propertyName !== "height") return;
          body.removeEventListener("transitionend", done);
          body.style.transition = "";
          body.style.height = "";
          body.hidden = true;
        });
      }
    }

    flags.forEach((flag) => {
      const lead = flag.classList.contains("flag--lead");
      setOpen(flag, lead, false);

      const toggle = flag.querySelector<HTMLElement>(".flag__toggle");
      if (!toggle) return;

      toggle.addEventListener(
        "click",
        () => {
          const isOpen = toggle.getAttribute("aria-expanded") === "true";
          if (isOpen) {
            setOpen(flag, false, true);
            return;
          }
          // one flag fully open at a time
          flags.forEach((other) => {
            if (
              other !== flag &&
              other
                .querySelector<HTMLElement>(".flag__toggle")
                ?.getAttribute("aria-expanded") === "true"
            ) {
              setOpen(other, false, true);
            }
          });
          setOpen(flag, true, true);
        },
        { signal: controller.signal },
      );
    });

    return () => {
      controller.abort();
      root.classList.remove("js");
      flags.forEach((flag) => {
        const body = bodyOf(flag);
        if (!body) return;
        body.hidden = false;
        body.style.height = "";
        body.style.transition = "";
      });
    };
  }, []);

  return null;
}
