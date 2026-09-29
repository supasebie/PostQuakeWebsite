// PostQuake marketing site

// Where the early-access form POSTs `{ email, source }` as JSON: the `waitlist` edge
// function in the PostQuake Supabase project, which writes to public.waitlist.
// Leave empty and the form says it isn't connected.
const WAITLIST_ENDPOINT = "https://ogbsbyorhywqjwlotvjc.supabase.co/functions/v1/waitlist";
// Supabase's public anon key. It is meant to ship in client code: it only gets past the
// function gateway, and the anon role has no access to the waitlist table itself.
const WAITLIST_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9nYnNieW9yaHl3cWp3bG90dmpjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTA2ODU5NTUsImV4cCI6MjEwNjI2MTk1NX0.8ZhSP7kO9rN80UOhVH4G4wo4L7Uy4W86pO5YvQSaXL8";
// Where a signup came from, from ?ref= on the landing URL (e.g. ?ref=overninethousand).
const WAITLIST_SOURCE = new URLSearchParams(location.search).get("ref");

const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/* ---------- Nav ---------- */

const nav = document.getElementById("nav");
const onScroll = () => nav.classList.toggle("scrolled", window.scrollY > 12);
window.addEventListener("scroll", onScroll, { passive: true });
onScroll();

/* ---------- Reveal on scroll ---------- */

const revealer = new IntersectionObserver(
  (entries) => {
    for (const e of entries) {
      if (e.isIntersecting) {
        e.target.classList.add("in");
        revealer.unobserve(e.target);
      }
    }
  },
  { rootMargin: "0px 0px -8% 0px" },
);
document.querySelectorAll(".reveal").forEach((el, i) => {
  el.style.transitionDelay = `${(i % 4) * 70}ms`;
  revealer.observe(el);
});

/* ---------- Slideshow players (story-style, 2.5 s per slide like the rendered MP4) ---------- */

const SLIDE_MS = 2500;

function createPlayer(root, onChange) {
  const imgs = [...root.querySelectorAll(".slides img")];
  const bar = root.querySelector(".progress");
  bar.innerHTML = imgs.map(() => "<span><i></i></span>").join("");
  const segs = [...bar.children];
  let index = 0;
  let timer = null;
  let visible = false;

  function show(i) {
    index = (i + imgs.length) % imgs.length;
    imgs.forEach((img, n) => img.classList.toggle("on", n === index));
    segs.forEach((s, n) => {
      s.classList.remove("run");
      s.classList.toggle("done", n < index);
    });
    if (!reduceMotion) {
      void bar.offsetWidth; // restart the fill animation
      segs[index].style.setProperty("--dur", `${SLIDE_MS}ms`);
      segs[index].classList.add("run");
    } else {
      segs[index].classList.add("done");
    }
    onChange?.(index);
    schedule();
  }

  function schedule() {
    clearTimeout(timer);
    if (visible && !reduceMotion) timer = setTimeout(() => show(index + 1), SLIDE_MS);
  }

  new IntersectionObserver(([e]) => {
    visible = e.isIntersecting;
    if (visible) show(index);
    else clearTimeout(timer);
  }, { threshold: 0.25 }).observe(root);

  // Tap left/right half of the screen to go back/forward, like stories.
  root.querySelector(".screen").addEventListener("click", (ev) => {
    const r = ev.currentTarget.getBoundingClientRect();
    show(index + (ev.clientX - r.left < r.width / 3 ? -1 : 1));
  });

  show(0);
  return { show };
}

createPlayer(document.querySelector('[data-player="hero"]'));

const breakdownButtons = [...document.querySelectorAll("#breakdown button")];
const outputPlayer = createPlayer(document.querySelector('[data-player="output"]'), (i) => {
  breakdownButtons.forEach((b, n) => b.setAttribute("aria-current", String(n === i)));
});
breakdownButtons.forEach((b) => b.addEventListener("click", () => outputPlayer.show(Number(b.dataset.go))));

/* ---------- Seismograph trace under the hero ---------- */

function rng(seed) {
  return () => {
    seed = (seed * 16807) % 2147483647;
    return (seed - 1) / 2147483646;
  };
}

function seismoPath(width, mid, seed) {
  const rand = rng(seed);
  const quakes = [
    { x: 180, amp: 26 },
    { x: 520, amp: 62 },
    { x: 870, amp: 38 },
    { x: 1080, amp: 16 },
  ];
  let d = `M0 ${mid}`;
  for (let x = 4; x <= width; x += 4) {
    let amp = 1.5 + rand() * 2.5;
    for (const q of quakes) {
      const dx = x - q.x;
      if (dx >= 0 && dx < 160) amp += q.amp * Math.exp(-dx / 38);
    }
    const sign = (x / 4) % 2 === 0 ? 1 : -1;
    const y = x >= width - 8 ? mid : mid + sign * amp * (0.55 + rand() * 0.45);
    d += `L${x} ${y.toFixed(1)}`;
  }
  return d;
}

const seismo = document.getElementById("seismo");
if (seismo) {
  const half = seismoPath(1200, 75, 7);
  const ns = "http://www.w3.org/2000/svg";
  seismo.innerHTML = `
    <defs>
      <linearGradient id="sg" x1="0" x2="1">
        <stop offset="0" stop-color="#FF7A1A"/><stop offset=".5" stop-color="#FF3D3D"/><stop offset="1" stop-color="#F0247F"/>
      </linearGradient>
    </defs>`;
  for (const dx of [0, 1200]) {
    const p = document.createElementNS(ns, "path");
    p.setAttribute("d", half);
    p.setAttribute("transform", `translate(${dx} 0)`);
    p.setAttribute("fill", "none");
    p.setAttribute("stroke", "url(#sg)");
    p.setAttribute("stroke-width", "2");
    p.setAttribute("stroke-linejoin", "round");
    p.setAttribute("vector-effect", "non-scaling-stroke");
    seismo.appendChild(p);
  }
}

/* ---------- How it works: steps + agent terminal ---------- */

const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const line = (cls, text) => `<span class="${cls}">${esc(text)}</span>`;

const SESSIONS = [
  [
    line("t-you", "add my app: https://psychictournament.online"),
    "",
    line("t-tool", "▸ project_init") + line("t-dim", "  psychic-tournament"),
    line("t-ok", "  ✓ ") + "followed the site to App Store + Google Play",
    line("t-ok", "  ✓ ") + "icon 1024px · 14 screenshots",
    line("t-ok", "  ✓ ") + "name, tagline, pitch, brand colours",
    "",
    line("t-dim", "Project ready. Next: a quick interview about your players."),
  ],
  [
    line("t-you", "interview's done. now research the customer"),
    "",
    line("t-dim", "Reading store reviews, forums and comment sections…"),
    "",
    line("t-tool", "▸ icp_write") + line("t-dim", "  psychic-tournament"),
    line("t-ok", "  ✓ ") + "who they are, pains, desires, objections",
    line("t-ok", "  ✓ ") + "verbatim phrases, each with a source link",
    line("t-ok", "  ✓ ") + "claims guardrails",
    line("t-ok", "  ✓ ") + "angles to test",
  ],
  [
    line("t-you", "make 7 slideshows, mix the formats"),
    "",
    line("t-tool", "▸ batch_plan") + line("t-dim", "    3 hook-story-card · 2 listicle · 2 before-after"),
    line("t-tool", "▸ set_write") + line("t-dim", "     7 sets, one angle each"),
    line("t-tool", "▸ set_validate") + line("t-dim", "  7/7 valid · 0 duplicate hooks"),
    line("t-tool", "▸ batch_render") + line("t-dim", "  slides/01–07.png + video.mp4 per set"),
    "",
    line("t-ok", "  ✓ ") + "7 sets ready · images cached · spend logged",
    line("t-hot", "  ⚑ ") + "2 sets use AI photos → will be labelled",
  ],
  [
    line("t-you", "schedule them next week on TikTok and Reels"),
    "",
    line("t-tool", "▸ schedule_batch") + line("t-dim", "  dry run"),
    line("t-dim", "  Mon 18:30  TikTok  friends-psychic-test   AI label"),
    line("t-dim", "  Tue 12:15  Reels   listicle-01"),
    line("t-dim", "  Wed 19:00  TikTok  before-after-01        AI label"),
    line("t-dim", "  …4 more"),
    "",
    line("t-you", "looks good, go"),
    line("t-ok", "  ✓ ") + "7 posts scheduled",
  ],
];

const term = document.getElementById("term");
const steps = [...document.querySelectorAll("#steps .step")];
let stepIndex = 0;
let stepTimer = null;
let typeTimer = null;
let howVisible = false;

function renderSession(i) {
  clearTimeout(typeTimer);
  const lines = SESSIONS[i];
  if (reduceMotion) {
    term.innerHTML = lines.join("\n");
    return;
  }
  let n = 0;
  const tick = () => {
    n++;
    term.innerHTML = lines.slice(0, n).join("\n") + (n < lines.length ? "\n" : " ") + '<span class="caret"></span>';
    if (n < lines.length) typeTimer = setTimeout(tick, n === 1 ? 420 : 170);
  };
  tick();
}

function setStep(i, fromUser = false) {
  stepIndex = i;
  steps.forEach((s, n) => s.classList.toggle("active", n === i));
  renderSession(i);
  clearTimeout(stepTimer);
  if (!reduceMotion && howVisible) stepTimer = setTimeout(() => setStep((stepIndex + 1) % steps.length), fromUser ? 9000 : 5200);
}

steps.forEach((s, i) => s.addEventListener("click", () => setStep(i, true)));

new IntersectionObserver(([e]) => {
  const was = howVisible;
  howVisible = e.isIntersecting;
  if (howVisible && !was) setStep(stepIndex);
  if (!howVisible) clearTimeout(stepTimer);
}, { threshold: 0.3 }).observe(document.getElementById("how"));

term.innerHTML = SESSIONS[0].join("\n");

/* ---------- Seismograph preview chart ---------- */

function drawSeisChart(svg) {
  const W = 640;
  const H = 260;
  const pad = { l: 34, r: 16, t: 36, b: 30 };
  const days = ["M", "T", "W", "T", "F", "S", "S", "M", "T", "W", "T", "F", "S", "S"];
  const mags = [2.1, 2.6, 1.8, 3.2, 2.4, 2.9, 2.2, 3.0, 7.4, 4.1, 5.2, 3.3, 4.6, 3.8];
  const x = (i) => pad.l + (i * (W - pad.l - pad.r)) / (mags.length - 1);
  const y = (m) => pad.t + (1 - m / 8) * (H - pad.t - pad.b);

  let grid = "";
  for (const m of [2, 4, 6, 8]) {
    grid += `<line x1="${pad.l}" x2="${W - pad.r}" y1="${y(m)}" y2="${y(m)}" stroke="rgba(255,255,255,.07)"/>`;
    grid += `<text x="${pad.l - 10}" y="${y(m) + 4}" fill="#6f6b78" font-size="11" font-family="JetBrains Mono, monospace" text-anchor="end">${m}</text>`;
  }
  const labels = days
    .map((d, i) => `<text x="${x(i)}" y="${H - 8}" fill="#6f6b78" font-size="11" font-family="JetBrains Mono, monospace" text-anchor="middle">${d}</text>`)
    .join("");

  const pts = mags.map((m, i) => [x(i), y(m)]);
  const lineD = pts.map(([px, py], i) => `${i ? "L" : "M"}${px.toFixed(1)} ${py.toFixed(1)}`).join("");
  const areaD = `${lineD}L${x(mags.length - 1)} ${y(0)}L${x(0)} ${y(0)}Z`;
  const peak = 8;
  const after = [10, 12];

  const dots = pts
    .map(([px, py], i) => {
      if (i === peak) return "";
      const hot = after.includes(i);
      return `<circle cx="${px}" cy="${py}" r="${hot ? 5 : 3.5}" fill="${hot ? "#F0247F" : "#1a1922"}" stroke="${hot ? "#fff" : "#a39faa"}" stroke-width="1.5"/>`;
    })
    .join("");

  const [kx, ky] = pts[peak];
  svg.innerHTML = `
    <defs>
      <linearGradient id="sc-line" x1="0" x2="1"><stop offset="0" stop-color="#FF7A1A"/><stop offset=".6" stop-color="#FF3D3D"/><stop offset="1" stop-color="#F0247F"/></linearGradient>
      <linearGradient id="sc-area" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="#FF3D3D" stop-opacity=".28"/><stop offset="1" stop-color="#FF3D3D" stop-opacity="0"/></linearGradient>
    </defs>
    ${grid}${labels}
    <path d="${areaD}" fill="url(#sc-area)"/>
    <path d="${lineD}" fill="none" stroke="url(#sc-line)" stroke-width="3" stroke-linejoin="round" stroke-linecap="round"/>
    ${dots}
    <circle cx="${kx}" cy="${ky}" r="16" fill="#FF3D3D" opacity=".18"><animate attributeName="r" values="10;22;10" dur="2.4s" repeatCount="indefinite"/></circle>
    <circle cx="${kx}" cy="${ky}" r="7" fill="#fff" stroke="#FF3D3D" stroke-width="3"/>
    <g transform="translate(${kx + 14} ${ky - 6})">
      <rect width="176" height="46" rx="10" fill="#1a1922" stroke="rgba(255,255,255,.14)"/>
      <text x="12" y="19" fill="#f6f3ee" font-size="13" font-weight="700" font-family="Inter, sans-serif">M 7.4 · friends-psychic-test</text>
      <text x="12" y="36" fill="#F0247F" font-size="11.5" font-family="JetBrains Mono, monospace">2 aftershocks queued</text>
    </g>`;
}

const seisChart = document.getElementById("seis-chart");
if (seisChart) drawSeisChart(seisChart);

/* ---------- Cost calculator ---------- */

const IMAGE_COST = 0.1;
const WEEKS_PER_MONTH = 4.33;
const ppw = document.getElementById("ppw");
const ipp = document.getElementById("ipp");
const money = (n) => `$${n.toFixed(2)}`;

function updateCost() {
  for (const r of [ppw, ipp]) {
    r.style.setProperty("--pct", `${((r.value - r.min) / (r.max - r.min)) * 100}%`);
  }
  const posts = Number(ppw.value);
  const imgs = Number(ipp.value);
  const postsMonth = Math.round(posts * WEEKS_PER_MONTH);
  const imgsMonth = Math.round(posts * imgs * WEEKS_PER_MONTH);
  document.getElementById("ppw-out").textContent = posts;
  document.getElementById("ipp-out").textContent = imgs;
  document.getElementById("c-posts").textContent = postsMonth;
  document.getElementById("c-imgs").textContent = imgsMonth;
  document.getElementById("c-per").textContent = money(imgs * IMAGE_COST);
  document.getElementById("cost-month").textContent = money(imgsMonth * IMAGE_COST);
}

ppw.addEventListener("input", updateCost);
ipp.addEventListener("input", updateCost);
updateCost();

/* ---------- Early-access form ---------- */

const form = document.getElementById("signup");
const note = document.getElementById("signup-note");

form.addEventListener("submit", async (ev) => {
  ev.preventDefault();
  const email = form.email.value.trim();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    note.className = "signup-note";
    note.textContent = "That email doesn't look right. Mind checking it?";
    form.email.focus();
    return;
  }
  if (!WAITLIST_ENDPOINT) {
    note.className = "signup-note";
    note.textContent = "Signups aren't connected yet. Set WAITLIST_ENDPOINT in main.js.";
    return;
  }
  const button = form.querySelector("button");
  button.disabled = true;
  try {
    const res = await fetch(WAITLIST_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: `Bearer ${WAITLIST_KEY}`,
      },
      body: JSON.stringify({ email, source: WAITLIST_SOURCE }),
    });
    if (!res.ok) throw new Error(String(res.status));
    form.reset();
    note.className = "signup-note ok";
    note.textContent = "You're on the list. We'll be in touch soon.";
  } catch {
    note.className = "signup-note";
    note.textContent = "Something went wrong. Please try again in a moment.";
  } finally {
    button.disabled = false;
  }
});
