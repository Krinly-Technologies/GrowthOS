// Captures every prototype state at every width. Usage: node lab-capture.mjs <toolsDir> <outDir>
import { createRequire } from 'node:module';
import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';

const [, , toolsDir, outDir] = process.argv;
const require = createRequire(path.join(toolsDir, 'package.json'));
const { chromium } = require('playwright-core');
mkdirSync(outDir, { recursive: true });
const BASE = 'http://localhost:3010';
const WIDTHS = [
  [1440, 900],
  [1280, 800],
  [768, 1024],
  [390, 844],
  [360, 760],
];
const SCREENS = [
  { id: 'today', a: '/a/today', b: '/b/today' },
  { id: 'leads', a: '/a/leads', b: '/b/leads?view=list' },
  { id: 'pipeline', a: '/a/leads?view=board', b: '/b/leads' },
  { id: 'drawer', a: '/a/leads?lead=ld-harpreet', b: '/b/leads?lead=ld-harpreet', dialog: true },
];
const browser = await chromium.launch({ channel: 'chrome', headless: true });
const report = [];

async function shoot(concept, screen, url, [w, h], { full = true, action, dialog = false, name } = {}) {
  const ctx = await browser.newContext({
    viewport: { width: w, height: h },
    deviceScaleFactor: 1,
    isMobile: w < 500,
    hasTouch: w < 500,
    locale: 'en-IN',
    timezoneId: 'Asia/Kolkata',
  });
  const page = await ctx.newPage();
  const errors = [];
  page.on('console', (m) => {
    if (m.type() === 'error') errors.push(m.text().slice(0, 240));
  });
  page.on('pageerror', (e) => errors.push(`pageerror: ${String(e.message).slice(0, 240)}`));
  await page.goto(BASE + url, { waitUntil: 'networkidle', timeout: 120000 });
  await page.waitForTimeout(700);
  if (dialog) await page.waitForSelector('[role="dialog"]', { timeout: 10000 });
  if (action) await action(page);
  await page.waitForTimeout(450);
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  const file = `${concept}-${name ?? screen}-${w}.png`;
  await page.screenshot({ path: path.join(outDir, file), fullPage: full && !dialog && w >= 768 });
  report.push({ file, url, width: w, overflowPx: overflow, consoleErrors: errors });
  await ctx.close();
}

for (const screen of SCREENS) {
  for (const size of WIDTHS) {
    for (const concept of ['a', 'b']) {
      await shoot(concept, screen.id, screen[concept], size, { dialog: Boolean(screen.dialog) });
    }
  }
}
// Extras
for (const concept of ['a', 'b']) {
  await shoot(concept, 'collapsed', `/${concept}/today`, [1440, 900], {
    name: 'collapsed-nav',
    full: false,
    action: async (p) => {
      await p.keyboard.press('[');
    },
  });
  await shoot(concept, 'command', `/${concept}/today`, [1440, 900], {
    name: 'command-menu',
    full: false,
    action: async (p) => {
      await p.keyboard.press('Control+k');
      await p.waitForSelector('[role="combobox"]');
      await p.keyboard.type('har');
    },
  });
  await shoot(concept, 'more', `/${concept}/today`, [390, 844], {
    name: 'mobile-more',
    full: false,
    action: async (p) => {
      await p.getByRole('button', { name: 'More', exact: true }).click();
      await p.waitForSelector('[role="dialog"]');
    },
  });
}
await shoot('lab', 'type', '/type', [1440, 900], { name: 'type' });
await browser.close();

writeFileSync(path.join(outDir, 'report.json'), JSON.stringify(report, null, 2));
const rows = [...SCREENS.map((s) => s.id), 'collapsed-nav', 'command-menu', 'mobile-more'];
const cells = (id, w) =>
  ['a', 'b']
    .map((c) => {
      const f = `${c}-${id}-${w}.png`;
      return report.some((r) => r.file === f)
        ? `<figure><figcaption>Concept ${c.toUpperCase()} · ${id} · ${w}px</figcaption><a href="${f}"><img loading="lazy" src="${f}"></a></figure>`
        : '';
    })
    .join('');
let body = '';
for (const id of rows)
  for (const [w] of [...WIDTHS, [1440], [390]]) {
    const html = cells(id, w);
    if (html && !body.includes(`${id}-${w}.png`)) body += `<section><h2>${id} — ${w}px</h2><div class="pair">${html}</div></section>`;
  }
writeFileSync(
  path.join(outDir, 'index.html'),
  `<!doctype html><meta charset="utf-8"><title>Krinly 02A — A vs B</title><style>body{font:14px system-ui;margin:24px;background:#f4f5f3;color:#111c2d}h1{margin:0 0 4px}h2{font-size:15px;margin:28px 0 8px}.pair{display:grid;grid-template-columns:1fr 1fr;gap:16px;align-items:start}figure{margin:0;background:#fff;border:1px solid #dfe3de;border-radius:10px;padding:8px}figcaption{font-size:12px;color:#5c6676;margin-bottom:6px}img{width:100%;display:block;border-radius:6px}</style><h1>Krinly GrowthOS · Phase 02A · Concept A vs Concept B</h1><p>Fictional sample data. Local file only — not uploaded anywhere. Click an image for full size.</p>${body}<section><h2>Typography &amp; colour</h2><a href="lab-type-1440.png"><img src="lab-type-1440.png" style="max-width:900px"></a></section>`,
);
const bad = report.filter((r) => r.consoleErrors.length || r.overflowPx > 0);
console.log(`captured ${report.length} screenshots; issues: ${bad.length}`);
for (const r of bad) console.log(JSON.stringify(r));
