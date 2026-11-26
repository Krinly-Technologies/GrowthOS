import { createRequire } from 'node:module'; import path from 'node:path';
const [, , toolsDir, base] = process.argv;
const { chromium } = createRequire(path.join(toolsDir, 'package.json'))('playwright-core');
const b = await chromium.launch({ channel: 'chrome' });
for (const c of ['g', 'a']) {
  const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
  await p.goto(`${base}/${c}/today?range=month`, { waitUntil: 'networkidle' }); await p.waitForTimeout(800);
  const s = await p.evaluate(() => [...document.querySelectorAll('p.sr-only')].map(e => e.textContent).find(t => t?.includes('at the same point')));
  console.log(c, s);
  await p.close();
}
await b.close();
