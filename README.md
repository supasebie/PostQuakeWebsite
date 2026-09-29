# PostQuake website

Marketing site and brand assets for [PostQuake](../PostQuake). Static HTML/CSS/JS with no
build step, so any static host (Cloudflare Pages, Netlify, Vercel, GitHub Pages) can serve
the folder as-is.

```bash
python3 -m http.server 4321   # then open http://localhost:4321
```

## Files

```
index.html          landing page
brand.html          brand kit: logos, colours, type, usage rules
styles.css          all styles (tokens at the top of the file)
main.js             slideshow players, seismograph trace, agent terminal, cost calculator, signup
favicon.svg
assets/logo/        SVG masters + PNG exports (app icon 1024/512/180, mark 512)
assets/showcase/    real PostQuake output for Psychic Tournament (WebP, from the engine repo)
assets/og-image.png social share card (1200x630)
tools/              og-image.html + render-assets.mjs to regenerate the PNGs
```

## Before launch

- **Waitlist:** connected. The form posts `{ email, source }` to the `waitlist` edge
  function in the PostQuake Supabase project, which writes to `public.waitlist` (RLS on,
  no anon access). `source` comes from `?ref=` on the landing URL, so links like
  `https://postquake.app/?ref=overninethousand#access` show where signups came from.
- **Analytics:** Google Analytics 4, property "PostQuake" (`p556576077`), measurement ID
  `G-CQE6NMJCCS`, tagged in the `<head>` of `index.html` and `brand.html`. A successful
  waitlist signup sends a `generate_lead` event with `lead_source` (the `?ref=` value or
  `direct`), never the email.
- **Cookie consent:** Google Consent Mode v2. Ad storage is always denied (no ads). Analytics
  cookies are off by default in the EEA, UK and Switzerland and on elsewhere; `consent.js`
  shows the banner, saves the choice in `localStorage` (`pq-consent`) and deletes `_ga`
  cookies on decline. "Cookie settings" in the footer reopens it. The site has no privacy
  policy page yet.
- **Domain:** `og:image` in `index.html` points at `https://postquake.app/assets/og-image.png`.
  Change it if the site ships on postquake.net instead.
- **Claims:** the roadmap and "Ship it" step mark scheduling as rolling out. Update the
  tags in `index.html` as milestones land (see `../PostQuake/docs/phase-1-plan.md`).

## Regenerating PNGs

After editing an SVG in `assets/logo/` or `tools/og-image.html`:

```bash
node tools/render-assets.mjs
```

This uses the Playwright install from the sibling `PostQuake` repo; set `PLAYWRIGHT_DIR`
to use a different one. The wordmark text is outlined (Bricolage Grotesque ExtraBold, OFL),
so the logo files don't depend on installed fonts.

## Showcase images

Slides in `assets/showcase/` are real renders from the engine repo:
`examples/psychic-tournament/.../friends-psychic-test` (`pt-*`) and batch `2026-09-28-b`
(`li-*` listicle-01, `ba-*` before-after-01). They contain AI-generated photos; the site
says so next to them. Swap in newer sets by converting the PNGs with
`cwebp -q 80 -resize 720 1280 in.png -o out.webp`.
