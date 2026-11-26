// Single-page re-capture with a longer settle time.
// Usage: node recapture.mjs <toolsDir> <outDir> <slug> <url> <waitMs> <shots> [width] [height] [fullPage]
import { createRequire } from 'node:module';
import path from 'node:path';

const [, , toolsDir, outDir, slug, url, waitMs = '12000', shots = '2', width = '1440', height = '900', fullPage = ''] =
  process.argv;
const require = createRequire(path.join(toolsDir, 'package.json'));
const { chromium } = require('playwright-core');
const browser = await chromium.launch({ channel: 'chrome', headless: true });
const vw = Number(width);
const vh = Number(height);
const ctx = await browser.newContext({
  viewport: { width: vw, height: vh },
  deviceScaleFactor: 1,
  locale: 'en-IN',
  timezoneId: 'Asia/Kolkata',
  isMobile: vw < 500,
  hasTouch: vw < 500,
});
const page = await ctx.newPage();
const resp = await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });
try {
  await page.waitForLoadState('networkidle', { timeout: Number(waitMs) });
} catch {
  /* keep going: some pages never go idle */
}
await page.waitForTimeout(Math.min(Number(waitMs), 6000));
console.log(JSON.stringify({ status: resp?.status(), finalUrl: page.url(), title: await page.title() }));
for (let i = 0; i < Number(shots); i++) {
  if (i > 0) {
    await page.mouse.wheel(0, Math.round(vh * 0.92));
    await page.waitForTimeout(1500);
  }
  const file = path.join(outDir, `${slug}-${i + 1}.png`);
  await page.screenshot({ path: file, fullPage: fullPage === 'full' });
  console.log(file);
}
await browser.close();
