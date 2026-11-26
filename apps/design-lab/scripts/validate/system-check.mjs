// Validates the /system showcase: console errors, overflow, axe, keyboard Undo inside dialog and
// sheet, focus return, chart comparison value, reduced motion, truncation; captures screenshots.
import { createRequire } from 'node:module';
import { mkdirSync, readFileSync } from 'node:fs';
import path from 'node:path';

const [, , toolsDir, base, outDir] = process.argv;
const { chromium } = createRequire(path.join(toolsDir, 'package.json'))('playwright-core');
const axeSrc = readFileSync(path.join(toolsDir, 'node_modules/axe-core/axe.min.js'), 'utf8');
mkdirSync(outDir, { recursive: true });

const results = [];
const check = (name, ok, detail = '') => {
  results.push({ name, ok, detail });
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? ` — ${detail}` : ''}`);
};

const browser = await chromium.launch({ channel: 'chrome' });

async function open(theme, width, height = 900, extra = {}) {
  const ctx = await browser.newContext({ viewport: { width, height }, ...extra });
  const page = await ctx.newPage();
  const errors = [];
  page.on('console', (m) => {
    if (m.type() === 'error') errors.push(m.text());
  });
  page.on('pageerror', (e) => errors.push(String(e)));
  await page.goto(`${base}/system?theme=${theme}`, { waitUntil: 'networkidle' });
  await page.waitForFunction(
    (t) => document.documentElement.classList.contains('dark') === (t === 'dark'),
    theme,
  );
  await page.waitForTimeout(500);
  return { ctx, page, errors };
}

async function axe(page, label) {
  await page.addScriptTag({ content: axeSrc });
  const v = await page.evaluate(async () =>
    (await axe.run(document)).violations.map((x) => ({
      id: x.id,
      impact: x.impact,
      n: x.nodes.length,
      nodes: x.nodes.slice(0, 3).map((n) => n.target.join(' ')),
    })),
  );
  const serious = v.filter((x) => x.impact === 'serious' || x.impact === 'critical');
  check(`axe ${label}: no serious/critical`, serious.length === 0, JSON.stringify(serious));
  if (v.length) console.log(`      all axe findings (${label}):`, JSON.stringify(v));
}

// 1. Layout, overflow, console, screenshots
for (const theme of ['light', 'dark']) {
  for (const width of [1440, 1280, 768, 390, 360]) {
    const { ctx, page, errors } = await open(theme, width);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    check(`${theme} ${width}: no horizontal overflow`, overflow <= 0, `${overflow}px`);
    check(`${theme} ${width}: no console errors`, errors.length === 0, errors.slice(0, 2).join(' | '));
    if ([1440, 390].includes(width) || (theme === 'light' && width === 768)) {
      await page.screenshot({ path: path.join(outDir, `system-${theme}-${width}.png`), fullPage: true });
    }
    if (width === 1440) await axe(page, `${theme} page`);
    await ctx.close();
  }
}

// 2. Keyboard: Undo inside a dialog
{
  const { ctx, page } = await open('light', 1440);
  const opener = page.getByRole('button', { name: 'Open dialog' });
  await opener.focus();
  await page.keyboard.press('Enter');
  const dialog = page.getByRole('dialog', { name: 'Move to a new stage' });
  await dialog.waitFor();
  // Tab to "Contacted"
  let found = false;
  for (let i = 0; i < 10 && !found; i++) {
    await page.keyboard.press('Tab');
    found = (await page.evaluate(() => document.activeElement?.textContent?.trim())) === 'Contacted';
  }
  check('dialog: reach stage button by Tab', found);
  await page.keyboard.press('Enter');
  const toast = dialog.getByText('Moved to Contacted', { exact: true });
  await toast.waitFor({ timeout: 3000 }).catch(() => undefined);
  check('dialog: toast renders inside the dialog', await toast.isVisible());
  await page.waitForTimeout(250);
  await page.screenshot({ path: path.join(outDir, 'system-dialog-toast.png') });
  let undo = false;
  for (let i = 0; i < 12 && !undo; i++) {
    await page.keyboard.press('Tab');
    undo = await page.evaluate(() => (document.activeElement?.textContent ?? '').startsWith('Undo'));
  }
  check('dialog: Undo reachable by keyboard', undo);
  await page.keyboard.press('Enter');
  await page.waitForTimeout(200);
  const desc = await dialog.locator('p').first().textContent();
  check('dialog: Undo restores the previous stage', /Currently: Interested/.test(desc ?? ''), desc ?? '');
  const announced = await dialog.locator('[aria-live="polite"]').count();
  check('dialog: has a live region for announcements', announced > 0);
  await page.keyboard.press('Escape');
  await page.waitForTimeout(300);
  check('dialog: Escape closes', (await page.getByRole('dialog').count()) === 0);
  check(
    'dialog: focus returns to opener',
    await page.evaluate(() => document.activeElement?.textContent?.trim() === 'Open dialog'),
  );
  await ctx.close();
}

// 3. Sheet: stepper, keyboard Undo, focus return (desktop + mobile, light + dark)
for (const [theme, width] of [
  ['light', 1440],
  ['dark', 1440],
  ['light', 390],
]) {
  const { ctx, page } = await open(theme, width, width < 640 ? 844 : 900);
  const opener = page.getByRole('button', { name: 'Open sheet' });
  await opener.focus();
  await page.keyboard.press('Enter');
  const sheet = page.getByRole('dialog', { name: 'Asha Menon' });
  await sheet.waitFor();
  await page.waitForTimeout(400);
  if (theme === 'light' && width === 1440) {
    await sheet.getByRole('button', { name: /Ready/ }).click();
    await page.waitForTimeout(150);
    const toastIn = await sheet.getByText('Moved to Ready', { exact: true }).isVisible();
    check('sheet: stage toast renders inside the sheet', toastIn);
    await sheet.getByRole('button', { name: /^Undo/ }).focus();
    await page.keyboard.press('Enter');
    await page.waitForTimeout(150);
    const cur = await sheet.locator('[aria-current="step"]').textContent();
    check('sheet: Undo restores stage', /Interested/.test(cur ?? ''), cur ?? '');
  }
  await page.screenshot({ path: path.join(outDir, `system-sheet-${theme}-${width}.png`) });
  if (theme === 'dark') await axe(page, 'dark sheet open');
  await page.keyboard.press('Escape');
  await page.waitForTimeout(300);
  check(
    `sheet ${theme} ${width}: focus returns to opener`,
    await page.evaluate(() => document.activeElement?.textContent?.trim() === 'Open sheet'),
  );
  await ctx.close();
}

// 4. Chart: comparison marker uses the headline's value
{
  const { ctx, page } = await open('light', 1440);
  const chart = page.locator('figure', { hasText: 'Verified revenue, adding up day by day' });
  const svgText = await chart.locator('svg').textContent();
  check('chart: draws ₹2.12 L comparison label', (svgText ?? '').includes('₹2.12 L'), svgText?.slice(0, 120));
  const summary = await chart.locator('.sr-only').first().textContent();
  check(
    'chart: summary states ₹3,01,000 and ₹2,12,000',
    (summary ?? '').includes('₹3,01,000') && (summary ?? '').includes('₹2,12,000'),
    summary ?? '',
  );
  const headline = await page.locator('#charts p', { hasText: 'so far this month' }).textContent();
  check('chart: headline delta ₹89,000', (headline ?? '').includes('₹89,000'), headline ?? '');
  await chart.locator('[role="group"]').focus();
  await page.keyboard.press('ArrowLeft');
  const live = await chart.locator('[aria-live="polite"]').textContent();
  check('chart: keyboard crosshair announces a point', /24 Nov/.test(live ?? ''), live ?? '');
  await chart.getByRole('button', { name: 'Show as table' }).click();
  check('chart: table view', (await chart.locator('table tbody tr').count()) === 31);
  await ctx.close();
}

// 5. Reduced motion + truncation
{
  const { ctx, page } = await open('light', 1440, 900, { reducedMotion: 'reduce' });
  await page.getByRole('button', { name: 'Open dialog' }).click();
  const dur = await page.getByRole('dialog').evaluate((el) => getComputedStyle(el).animationDuration);
  check('reduced motion: dialog animation is instant', parseFloat(dur) < 0.01, dur);
  await page.keyboard.press('Escape');
  await page.setViewportSize({ width: 390, height: 844 });
  await page.waitForTimeout(300);
  const t = await page.evaluate(() => {
    const el = [...document.querySelectorAll('.truncate')].find(
      (n) => n.textContent?.startsWith('Neha Kulkarni with a very long') && n.getClientRects().length > 0,
    );
    if (!el) return null;
    return { overflow: getComputedStyle(el).textOverflow, clipped: el.scrollWidth > el.clientWidth };
  });
  check('truncation: long name ellipsised', t?.overflow === 'ellipsis' && t.clipped, JSON.stringify(t));
  await ctx.close();
}

// 6. Skip link is first tab stop and inside a landmark
{
  const { ctx, page } = await open('light', 1440);
  await page.keyboard.press('Tab');
  const info = await page.evaluate(() => ({
    text: document.activeElement?.textContent,
    landmark: !!document.activeElement?.closest('nav,main,header,footer,aside,[role=region]'),
  }));
  check('skip link: first tab stop, inside a landmark', info.text === 'Skip to content' && info.landmark, JSON.stringify(info));
  await ctx.close();
}

await browser.close();
const failed = results.filter((r) => !r.ok);
console.log(`\n${results.length - failed.length}/${results.length} checks passed`);
process.exit(failed.length ? 1 : 0);
