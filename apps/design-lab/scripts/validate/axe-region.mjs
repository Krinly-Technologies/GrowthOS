import { createRequire } from 'node:module'; import { readFileSync } from 'node:fs'; import path from 'node:path';
const [, , toolsDir, url] = process.argv;
const { chromium } = createRequire(path.join(toolsDir, 'package.json'))('playwright-core');
const b = await chromium.launch({ channel: 'chrome' }); const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
await p.goto(url, { waitUntil: 'networkidle' }); await p.waitForTimeout(800);
await p.addScriptTag({ content: readFileSync(path.join(toolsDir, 'node_modules/axe-core/axe.min.js'), 'utf8') });
console.log(JSON.stringify(await p.evaluate(async () => (await axe.run(document)).violations.map(v => ({ id: v.id, impact: v.impact, nodes: v.nodes.map(n => n.target.join(' ') + ' :: ' + n.html.slice(0, 100)) }))), null, 1));
await b.close();
