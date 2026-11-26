// Composite up to 4 screenshots into one 2x2 sheet for faster review.
// Usage: node contact-sheet.mjs <toolsDir> <out.png> <img1> [img2] [img3] [img4]
import { createRequire } from 'node:module';
import { writeFileSync } from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const [, , toolsDir, out, ...imgs] = process.argv;
const require = createRequire(path.join(toolsDir, 'package.json'));
const { chromium } = require('playwright-core');
const cells = imgs
  .map(
    (p) =>
      `<figure><img src="${pathToFileURL(p).href}"><figcaption>${path.basename(p)}</figcaption></figure>`,
  )
  .join('');
const html = `<!doctype html><meta charset="utf-8"><style>
body{margin:0;background:#222;display:grid;grid-template-columns:1fr 1fr;gap:6px;padding:6px;font:12px system-ui;color:#ddd}
figure{margin:0}img{width:100%;display:block}figcaption{padding:2px 4px}</style>${cells}`;
const htmlPath = out.replace(/\.png$/, '.html');
writeFileSync(htmlPath, html);
const browser = await chromium.launch({ channel: 'chrome', headless: true });
const page = await browser.newPage({ viewport: { width: 1600, height: 1000 }, deviceScaleFactor: 1 });
await page.goto(pathToFileURL(htmlPath).href);
await page.waitForTimeout(500);
await page.screenshot({ path: out, fullPage: true });
await browser.close();
console.log(out);
