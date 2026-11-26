// Screenshot a lab URL and report console errors and horizontal overflow.
// Usage: node lab-shot.mjs <toolsDir> <url> <out.png> [width] [height] [full] [evalSelector]
import { createRequire } from 'node:module';
import path from 'node:path';

const [, , toolsDir, url, out, width = '1440', height = '900', full = '', selector = ''] = process.argv;
const require = createRequire(path.join(toolsDir, 'package.json'));
const { chromium } = require('playwright-core');
const browser = await chromium.launch({ channel: 'chrome', headless: true });
const vw = Number(width);
const ctx = await browser.newContext({
  viewport: { width: vw, height: Number(height) },
  deviceScaleFactor: 1,
  isMobile: vw < 500,
  hasTouch: vw < 500,
  locale: 'en-IN',
  timezoneId: 'Asia/Kolkata',
});
const page = await ctx.newPage();
const errors = [];
page.on('console', (m) => {
  if (m.type() === 'error') errors.push(m.text().slice(0, 300));
});
page.on('pageerror', (e) => errors.push(`pageerror: ${String(e.message).slice(0, 300)}`));
await page.goto(url, { waitUntil: 'networkidle', timeout: 120000 });
await page.waitForTimeout(1200);
if (selector) {
  await page.waitForFunction(
    (sel) => [...document.querySelectorAll(sel)].every((el) => el.getAttribute('data-measured') === 'true'),
    selector,
    { timeout: 20000 },
  ).catch(() => {});
  const text = await page.$$eval(selector, (els) => els.map((e) => `${e.getAttribute('data-font')}: ${e.textContent}`));
  console.log(text.join('\n'));
}
const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
await page.screenshot({ path: out, fullPage: full === 'full' });
console.log(JSON.stringify({ url, out: path.basename(out), overflowPx: overflow, consoleErrors: errors }));
await browser.close();
