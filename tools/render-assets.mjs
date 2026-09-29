// Renders the PNG exports (app icons, apple-touch icon, OG image) from the SVG/HTML sources.
// Needs Playwright; by default it borrows the one installed in the PostQuake engine repo:
//   node tools/render-assets.mjs
//   PLAYWRIGHT_DIR=/path/to/node_modules/playwright node tools/render-assets.mjs
import { createRequire } from "node:module";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const require = createRequire(import.meta.url);
const { chromium } = require(
  process.env.PLAYWRIGHT_DIR ?? join(root, "../PostQuake/packages/core/node_modules/playwright"),
);

const browser = await chromium.launch();
const page = await browser.newPage();

async function svgToPng(svgFile, size, out, radius = 0) {
  const svg = readFileSync(join(root, svgFile), "utf8");
  await page.setViewportSize({ width: size, height: size });
  await page.setContent(
    `<html><body style="margin:0;background:transparent">
       <div style="width:${size}px;height:${size}px;border-radius:${radius}px;overflow:hidden">${svg.replace(/width="\d+" height="\d+"/, `width="${size}" height="${size}"`)}</div>
     </body></html>`,
  );
  await page.screenshot({ path: join(root, out), omitBackground: true });
  console.log("wrote", out);
}

await svgToPng("assets/logo/postquake-app-icon.svg", 1024, "assets/logo/postquake-app-icon-1024.png");
await svgToPng("assets/logo/postquake-app-icon.svg", 512, "assets/logo/postquake-app-icon-512.png");
await svgToPng("assets/logo/postquake-app-icon.svg", 180, "assets/logo/postquake-app-icon-180.png");
await svgToPng("assets/logo/postquake-mark.svg", 512, "assets/logo/postquake-mark-512.png");

await page.setViewportSize({ width: 1200, height: 630 });
await page.goto(pathToFileURL(join(root, "tools/og-image.html")).href, { waitUntil: "networkidle" });
await page.evaluate(() => document.fonts.ready);
await page.screenshot({ path: join(root, "assets/og-image.png") });
console.log("wrote assets/og-image.png");

await browser.close();
