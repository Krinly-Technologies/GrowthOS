// Refined concept deliverables + overflow checks. Usage: node g-capture.mjs <toolsDir> <outDir>
import { createRequire } from 'node:module';
import path from 'node:path';

const [, , toolsDir, outDir] = process.argv;
const { chromium } = createRequire(path.join(toolsDir, 'package.json'))('playwright-core');
const BASE = 'http://localhost:3010';
const browser = await chromium.launch({ channel: 'chrome', headless: true });
const shots = [
  ['g-today-1440.png', '/g/today', 1440, 900, true],
  ['g-leads-1440.png', '/g/leads?view=list', 1440, 900, true],
  ['g-pipeline-1440.png', '/g/leads', 1440, 900, true],
  ['g-drawer-1440.png', '/g/leads?lead=ld-harpreet', 1440, 900, false],
  ['g-today-390.png', '/g/today', 390, 844, false],
  ['g-leads-390.png', '/g/leads?view=list', 390, 844, false],
  ['g-drawer-390.png', '/g/leads?view=list&lead=ld-harpreet', 390, 844, false],
];
const checks = [
  ['/g/today', 360],
  ['/g/leads?view=list', 360],
  ['/g/leads', 360],
  ['/g/leads?lead=ld-harpreet', 360],
  ['/g/today', 768],
  ['/g/leads', 768],
];
const errors = [];
async function open(url, w, h) {
  const ctx = await browser.newContext({ viewport: { width: w, height: h }, isMobile: w < 500, hasTouch: w < 500, locale: 'en-IN' });
  const page = await ctx.newPage();
  page.on('console', (m) => m.type() === 'error' && errors.push(`${url}@${w}: ${m.text().slice(0, 160)}`));
  page.on('pageerror', (e) => errors.push(`${url}@${w}: ${e.message}`));
  await page.goto(BASE + url, { waitUntil: 'networkidle', timeout: 120000 });
  await page.waitForTimeout(900);
  return { ctx, page };
}
for (const [file, url, w, h, full] of shots) {
  const { ctx, page } = await open(url, w, h);
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth);
  await page.screenshot({ path: path.join(outDir, file), fullPage: full });
  console.log(file, 'overflow', overflow);
  await ctx.close();
}
for (const [url, w] of checks) {
  const { ctx, page } = await open(url, w, 800);
  console.log('check', url, w, 'overflow', await page.evaluate(() => document.documentElement.scrollWidth - innerWidth));
  await ctx.close();
}
await browser.close();
console.log('console errors:', errors.length, errors.slice(0, 5).join(' | '));
