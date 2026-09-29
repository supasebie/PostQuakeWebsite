// Cookie banner for Google Analytics (Consent Mode v2).
// Each page's <head> sets the consent defaults and re-applies a saved choice before gtag loads;
// this file only asks, saves the answer and tells gtag. Any [data-cookie-settings] element reopens it.
(() => {
  const KEY = "pq-consent";

  const read = () => {
    try {
      return localStorage.getItem(KEY);
    } catch {
      return null;
    }
  };

  const save = (value) => {
    try {
      localStorage.setItem(KEY, value);
    } catch {
      /* private mode: the choice lasts for this page view only */
    }
  };

  // GA sets _ga and _ga_<id> on the top-level domain; clear them when someone declines.
  function clearAnalyticsCookies() {
    const host = location.hostname;
    const domains = ["", host, `.${host}`, `.${host.split(".").slice(-2).join(".")}`];
    for (const name of document.cookie.split(";").map((c) => c.split("=")[0].trim())) {
      if (!name.startsWith("_ga")) continue;
      for (const d of domains) {
        document.cookie = `${name}=; Max-Age=0; path=/${d ? `; domain=${d}` : ""}`;
      }
    }
  }

  let banner = null;

  function build() {
    banner = document.createElement("div");
    banner.className = "cookie";
    banner.setAttribute("role", "region");
    banner.setAttribute("aria-label", "Cookie consent");
    banner.innerHTML = `
      <p><b>Cookies?</b> We use Google Analytics cookies to see which pages are useful.
      No ads, and we never sell your data.</p>
      <div class="cookie-actions">
        <button type="button" class="btn btn-ghost btn-sm" data-choice="denied">Decline</button>
        <button type="button" class="btn btn-ghost btn-sm" data-choice="granted">Accept</button>
      </div>`;
    banner.addEventListener("click", (ev) => {
      const button = ev.target.closest("[data-choice]");
      if (button) choose(button.dataset.choice);
    });
    document.body.appendChild(banner);
  }

  function show(focus) {
    if (!banner) build();
    banner.hidden = false;
    requestAnimationFrame(() => banner.classList.add("in"));
    if (focus) banner.querySelector("[data-choice]").focus();
  }

  function choose(value) {
    save(value);
    window.gtag?.("consent", "update", { analytics_storage: value });
    if (value === "denied") clearAnalyticsCookies();
    banner.classList.remove("in");
    banner.hidden = true;
  }

  document.addEventListener("click", (ev) => {
    if (ev.target.closest("[data-cookie-settings]")) show(true);
  });

  const saved = read();
  if (saved !== "granted" && saved !== "denied") show(false);
})();
