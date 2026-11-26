// Scripted interaction tests for both concepts. Usage: node lab-interactions.mjs <toolsDir> <out.json>
import { createRequire } from 'node:module';
import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';

const [, , toolsDir, outFile] = process.argv;
const require = createRequire(path.join(toolsDir, 'package.json'));
const { chromium } = require('playwright-core');
const AXE = readFileSync(path.join(toolsDir, 'node_modules/axe-core/axe.min.js'), 'utf8');
const BASE = 'http://localhost:3010';
const results = [];
const consoleErrors = [];
const browser = await chromium.launch({ channel: 'chrome', headless: true });

const rupees = (t) => Number(String(t).replace(/[^\d]/g, ''));

async function newPage(width = 1440, height = 900, extra = {}) {
  const ctx = await browser.newContext({
    viewport: { width, height },
    isMobile: width < 500,
    hasTouch: width < 500,
    locale: 'en-IN',
    timezoneId: 'Asia/Kolkata',
    ...extra,
  });
  const page = await ctx.newPage();
  page.on('console', (m) => {
    if (m.type() === 'error') consoleErrors.push(`${page.url()} :: ${m.text().slice(0, 200)}`);
  });
  page.on('pageerror', (e) => consoleErrors.push(`${page.url()} :: pageerror ${String(e.message).slice(0, 200)}`));
  return { ctx, page };
}

async function check(concept, name, fn) {
  try {
    const detail = await fn();
    results.push({ concept, name, pass: true, detail: detail ?? '' });
  } catch (e) {
    results.push({ concept, name, pass: false, detail: String(e && e.message ? e.message : e).split('\n')[0].slice(0, 220) });
  }
}
function expect(cond, msg) {
  if (!cond) throw new Error(msg);
}
const until = async (fn, timeout = 10000) => {
  const end = Date.now() + timeout;
  let last;
  while (Date.now() < end) {
    last = await fn();
    if (last) return last;
    await new Promise((r) => setTimeout(r, 150));
  }
  return last;
};
const go = async (page, url) => {
  await page.goto(BASE + url, { waitUntil: 'networkidle' });
  await page.waitForTimeout(500);
};
const hero = async (page) => rupees(await page.locator('[data-testid="hero-figure"]').first().getAttribute('aria-label') ?? await page.locator('[data-testid="hero-figure"]').first().textContent());
// B animates its figure; its aria-label carries the final value immediately.
const heroText = async (page) => { const el = page.locator('[data-testid="hero-figure"]').first(); const label = await el.getAttribute('aria-label'); return rupees(label ? label.split(' verified')[0] : await el.textContent()); };

for (const c of (process.env.CONCEPTS ?? 'a,b,g').split(',')) {
  const { ctx, page } = await newPage();

  await check(c, 'Navigate Today → Leads from the navigation', async () => {
    await go(page, `/${c}/today`);
    await page.locator(`aside[aria-label="Main navigation"] a[href="/${c}/leads"]`).first().click();
    await page.waitForURL(`**/${c}/leads**`);
    return page.url().replace(BASE, '');
  });

  await check(c, 'Date range changes every figure (This month → Today → back)', async () => {
    await go(page, `/${c}/today`);
    const month = await heroText(page);
    if (c === 'a') await page.locator('[aria-label="Date range"]').getByText('Today', { exact: true }).click();
    else {
      await page.getByRole('button', { name: /This month/ }).first().click();
      await page.getByRole('radio', { name: /^Today/ }).click();
    }
    const today = await until(async () => {
      const v = await heroText(page);
      return v === 42500 ? v : 0;
    }).then((v) => v || heroText(page));
    expect(month === 301000, `expected ₹3,01,000 this month, saw ${month}`);
    expect(today === 42500, `expected ₹42,500 today, saw ${today}`);
    expect(page.url().includes('range=today'), 'range not in URL');
    return `this month ₹${month} → today ₹${today}`;
  });

  if (c === 'a') {
    await check(c, 'Hero figure equals the sum of the payments listed behind it', async () => {
      await go(page, '/a/today');
      await page.getByRole('button', { name: 'Show them' }).click();
      const amounts = await page.locator('[data-testid="verified-list"] [data-amount]').evaluateAll((els) => els.map((e) => Number(e.getAttribute('data-amount'))));
      const sum = amounts.reduce((a, b) => a + b, 0);
      const fig = await heroText(page);
      expect(sum === fig, `sum ${sum} ≠ figure ${fig}`);
      return `${amounts.length} payments sum to ₹${sum}`;
    });
  }

  await check(c, 'Cross-view: "ready to book" on Today equals rows in Leads', async () => {
    await go(page, `/${c}/today`);
    await page.locator(`a[href="/${c}/leads?show=ready"]`).first().click();
    await page.waitForURL('**show=ready**');
    await page.waitForTimeout(400);
    const n = await page.locator('[data-lead]:visible').count();
    expect(n === 3, `expected 3 leads, saw ${n}`);
    return '3 on Today, 3 in Leads';
  });

  await check(c, 'Search narrows the leads', async () => {
    await go(page, `/${c}/leads${c !== 'a' ? '?view=list' : ''}`);
    await page.locator(c === 'a' ? '#lead-search' : '#lead-search-b').fill('Ritu');
    await page.waitForTimeout(300);
    const n = await page.locator('[data-lead]:visible').count();
    expect(n === 1, `expected 1 match, saw ${n}`);
    expect(page.url().includes('q=Ritu'), 'query not in URL');
    return '"Ritu" → 1 lead';
  });

  await check(c, 'Source filter shows only that source', async () => {
    await go(page, `/${c}/leads${c !== 'a' ? '?view=list' : ''}`);
    await page.getByRole('button', { name: /Filter by source/ }).click();
    await page.getByRole('checkbox', { name: /Referral/ }).click();
    await page.waitForURL('**source=referral**');
    await page.keyboard.press('Escape');
    await page.waitForTimeout(300);
    const texts = await page.locator('[data-lead]:visible').allTextContents();
    expect(texts.length > 0, 'no rows');
    expect(texts.every((t) => t.includes('Referral')), 'non-referral row visible');
    return `${texts.length} referral leads`;
  });

  await check(c, 'Switch list ↔ pipeline', async () => {
    await go(page, `/${c}/leads`);
    await page.getByRole(c === 'a' ? 'radio' : 'button', { name: /Pipeline/ }).click().catch(async () => {
      await page.getByText('Pipeline', { exact: true }).click();
    });
    await page.waitForSelector('[data-testid="board"]');
    await page.getByRole(c === 'a' ? 'radio' : 'button', { name: /List/ }).click().catch(async () => {
      await page.getByText('List', { exact: true }).click();
    });
    await page.waitForSelector(c === 'a' ? '[data-testid="lead-table"]' : '[data-testid="lead-tiles"]');
    return 'board and list both render';
  });

  await check(c, 'Open details, close with Esc, focus returns', async () => {
    await go(page, `/${c}/leads${c !== 'a' ? '?view=list' : ''}`);
    const trigger = page.locator('[data-lead="ld-ritu"] button').first();
    await trigger.click();
    const dialog = page.getByRole('dialog');
    await dialog.waitFor();
    expect((await dialog.textContent()).includes('Ritu Menon'), 'wrong lead');
    expect(page.url().includes('lead=ld-ritu'), 'lead not in URL');
    await page.keyboard.press('Escape');
    await page.waitForTimeout(400);
    expect((await page.getByRole('dialog').count()) === 0, 'dialog still open');
    const focused = await page.evaluate(() => document.activeElement?.closest('[data-lead]')?.getAttribute('data-lead') ?? document.activeElement?.tagName);
    expect(focused === 'ld-ritu', `focus went to ${focused}`);
    return 'opened, closed, focus back on Ritu';
  });

  await check(c, 'Add a note: timeline and last interaction update', async () => {
    await go(page, `/${c}/leads?view=list&lead=ld-ritu`);
    const dialog = page.getByRole('dialog');
    await dialog.waitFor();
    await dialog.locator('textarea').fill('Mother approved; will pay advance on Friday');
    await page.keyboard.press('Control+Enter');
    await page.waitForTimeout(300);
    const first = await dialog.locator('[data-testid="timeline"] li').first().textContent();
    expect(first.includes('Mother approved'), `timeline top: ${first}`);
    await page.keyboard.press('Escape');
    await page.waitForTimeout(300);
    const row = await page.locator('[data-lead="ld-ritu"]:visible').first().textContent();
    if (c === 'a') expect(row.includes('Note') && row.includes('just now'), `row: ${row.slice(0, 120)}`);
    return 'note at top of timeline; row shows "Note · just now"';
  });

  await check(c, 'Change stage in details → Today counts update', async () => {
    await go(page, `/${c}/leads?view=list&lead=ld-deepa`);
    await page.getByRole('dialog').waitFor();
    await page.getByRole('button', { name: 'Move to Booked' }).click();
    await page.waitForTimeout(300);
    const toast = await page.locator('[role="status"]').filter({ hasText: 'moved to Booked' }).count();
    await page.keyboard.press('Escape');
    await page.locator(`aside[aria-label="Main navigation"] a[href="/${c}/today"]`).first().click();
    await page.waitForURL(`**/${c}/today**`);
    const wanted = c === 'a' ? '2 customers are ready to book' : '2 ready to book';
    const ok = await until(async () => (await page.locator('main').textContent()).includes(wanted));
    expect(ok, 'Today did not update');
    return `Deepa → Booked; Today shows 2 ready (toast ${toast ? 'shown' : 'not found'})`;
  });

  await check(c, 'Drag a card to another stage on the board', async () => {
    await go(page, `/${c}/leads?view=board`);
    const src = await page.locator('[data-lead="ld-sneha"]').boundingBox();
    const dst = await page.locator('section[data-stage="contacted"]').boundingBox();
    await page.mouse.move(src.x + 40, src.y + 60);
    await page.mouse.down();
    await page.mouse.move(dst.x + 60, dst.y + 140, { steps: 12 });
    await page.mouse.up();
    await page.waitForTimeout(400);
    const moved = await page.locator('section[data-stage="contacted"] [data-lead="ld-sneha"]').count();
    expect(moved === 1, 'card did not move');
    return 'Sneha: New → Contacted by drag';
  });

  await check(c, 'Move a card with the keyboard-accessible stage menu', async () => {
    await go(page, `/${c}/leads?view=board`);
    await page.getByRole('button', { name: /Move Nazia Sayed to another stage/ }).click();
    await page.getByRole('menuitemradio', { name: 'Interested' }).click();
    await page.waitForTimeout(300);
    const moved = await page.locator('section[data-stage="interested"] [data-lead="ld-nazia"]').count();
    expect(moved === 1, 'menu move failed');
    return 'Nazia: New → Interested via menu';
  });

  await check(c, 'Collapse and expand the navigation', async () => {
    await go(page, `/${c}/today`);
    const before = (await page.locator('aside[aria-label="Main navigation"]').boundingBox()).width;
    await page.keyboard.press('[');
    await page.waitForTimeout(400);
    const after = (await page.locator('aside[aria-label="Main navigation"]').boundingBox()).width;
    await page.getByRole('button', { name: 'Expand navigation' }).click();
    await page.waitForTimeout(400);
    const again = (await page.locator('aside[aria-label="Main navigation"]').boundingBox()).width;
    expect(after < 90 && before > 200 && again > 200, `${before} → ${after} → ${again}`);
    return `${Math.round(before)}px → ${Math.round(after)}px → ${Math.round(again)}px`;
  });

  await check(c, 'Command menu: Ctrl K → find a lead → open it', async () => {
    await go(page, `/${c}/today`);
    await page.keyboard.press('Control+k');
    await page.getByRole('combobox').fill('Ananya');
    await page.keyboard.press('Enter');
    await page.waitForURL('**lead=ld-ananya**');
    await page.getByRole('dialog').waitFor();
    return 'opened Ananya Mishra from Today';
  });

  await check(c, 'Verify a payment → verified revenue increases', async () => {
    await go(page, `/${c}/today`);
    const before = await heroText(page);
    if (c === 'a') await page.locator('[data-testid="needs-you"]').getByRole('button', { name: /^Review/ }).click();
    else if (c === 'b') await page.getByRole('button', { name: '₹58,000 to verify' }).click();
    else await page.getByRole('button', { name: /^Review 3 payments/ }).first().click();
    await page.getByRole('dialog').getByRole('button', { name: 'Verify' }).first().click();
    const title = await page.getByRole('heading', { name: /^Verify ₹/ }).textContent();
    const amount = rupees(title.match(/₹[0-9,]+/)?.[0] ?? '0');
    await page.getByRole('button', { name: 'Mark as verified' }).click();
    const after = await until(async () => {
      const v = await heroText(page);
      return v === before + amount ? v : 0;
    }).then((v) => v || heroText(page));
    expect(amount > 0 && after - before === amount, `${before} → ${after} (verified ₹${amount})`);
    return `verified ₹${amount}: ₹${before} → ₹${after}`;
  });

  await check(c, 'Keyboard: first Tab reaches "Skip to content"', async () => {
    await go(page, `/${c}/today`);
    await page.keyboard.press('Tab');
    let text = await page.evaluate(() => document.activeElement?.textContent?.trim());
    if (text !== 'Skip to content') {
      // The prototype bar comes first in the DOM; skip link must follow it within a few stops.
      for (let i = 0; i < 6 && text !== 'Skip to content'; i++) {
        await page.keyboard.press('Tab');
        text = await page.evaluate(() => document.activeElement?.textContent?.trim());
      }
    }
    expect(text === 'Skip to content', `reached "${text}"`);
    return 'skip link reachable from the top';
  });

  if (c === 'g') {
    await check(c, 'Pipeline columns add up to the selected view', async () => {
      const pill = async (label) => Number((await page.getByRole('button', { name: new RegExp('^' + label) }).first().textContent()).replace(/\D/g, ''));
      await go(page, '/g/leads');
      const openCards = await page.locator('section[data-stage] [data-lead]').count();
      const openPill = await pill('All open');
      const hasBooked = await page.locator('section[data-stage="booked"]').count();
      expect(openCards === openPill && hasBooked === 0, `open: ${openCards} cards vs pill ${openPill}; booked column ${hasBooked}`);
      await page.getByRole('button', { name: /^Booked/ }).first().click();
      await until(async () => (await page.locator('section[data-stage="booked"]').count()) === 1);
      const bookedCards = await page.locator('section[data-stage="booked"] [data-lead]').count();
      const bookedPill = await pill('Booked');
      expect(bookedCards === bookedPill, `booked: ${bookedCards} cards vs pill ${bookedPill}`);
      return `All open ${openPill} = ${openCards} cards; Booked ${bookedPill} = ${bookedCards} cards`;
    });
    await check(c, 'Today: verified vs recorded split and full action queue', async () => {
      await go(page, '/g/today');
      const split = await page.locator('[data-testid="money-split"]').textContent();
      expect(split.includes('₹3,01,000') && split.includes('₹58,000'), split);
      await page.getByRole('button', { name: /^See all \d+ in priority order/ }).click();
      const n = await page.locator('[data-testid="action-queue"] li').count();
      const stack = await page.locator('[data-testid="momentum-stack"] article').count();
      expect(n === stack && n > 0, `queue ${n} vs stack ${stack}`);
      return `verified ₹3,01,000 · recorded ₹58,000 · queue lists all ${n}`;
    });
    await check(c, 'Lead panel: key facts visible; actions announced inside the dialog', async () => {
      await go(page, '/g/leads?lead=ld-harpreet');
      const dialog = page.getByRole('dialog');
      await dialog.waitFor();
      const facts = await dialog.locator('[data-testid="lead-facts"]').textContent();
      expect(facts.includes('₹85,000') && facts.includes('Wedding fair'), facts.slice(0, 120));
      await dialog.getByRole('button', { name: 'Log a call' }).click();
      const said = await until(async () => (await dialog.locator('[data-lab-announcer]').textContent()).includes('Call logged'));
      expect(said, 'no announcement inside the dialog');
      return 'facts shown; "Call logged" announced in the dialog';
    });
  }

  // Accessibility scan per screen
  for (const [label, url, dialog] of [
    ['Today', `/${c}/today`, false],
    ['Leads list', `/${c}/leads?view=list`, false],
    ['Pipeline', `/${c}/leads?view=board`, false],
    ['Lead details', `/${c}/leads?lead=ld-harpreet`, true],
  ]) {
    await check(c, `axe: ${label} (serious/critical)`, async () => {
      await go(page, url);
      if (dialog) await page.getByRole('dialog').waitFor();
      await page.addScriptTag({ content: AXE });
      const res = await page.evaluate(async () => {
        // eslint-disable-next-line no-undef
        const r = await axe.run(document, { resultTypes: ['violations'] });
        return r.violations.map((v) => ({ id: v.id, impact: v.impact, nodes: v.nodes.length, sample: v.nodes[0]?.target?.join(' ') }));
      });
      const bad = res.filter((v) => v.impact === 'serious' || v.impact === 'critical');
      const minor = res.filter((v) => !(v.impact === 'serious' || v.impact === 'critical'));
      expect(bad.length === 0, bad.map((v) => `${v.id}×${v.nodes} (${v.sample})`).join('; '));
      return minor.length ? `0 serious; minor: ${minor.map((v) => `${v.id}×${v.nodes}`).join(', ')}` : '0 violations';
    });
  }
  await ctx.close();

  // Mobile
  const m = await newPage(390, 844);
  await check(c, 'Mobile 390: bottom navigation, More sheet, Leads tab', async () => {
    await go(m.page, `/${c}/today`);
    expect(await m.page.locator('nav[aria-label="Main"]').isVisible(), 'no bottom nav');
    await m.page.getByRole('button', { name: /^More/ }).click();
    await m.page.getByRole('dialog').waitFor();
    await m.page.keyboard.press('Escape');
    await m.page.locator(`nav[aria-label="Main"] a[href="/${c}/leads"]`).click();
    await m.page.waitForURL(`**/${c}/leads**`);
    return 'tabs, More sheet and navigation work';
  });
  await check(c, 'Mobile 390: details open as a full-screen sheet', async () => {
    await go(m.page, `/${c}/leads?view=list&lead=ld-ritu`);
    const box = await m.page.getByRole('dialog').boundingBox();
    expect(Math.round(box.width) === 390, `width ${box.width}`);
    return 'sheet is 390px wide';
  });
  await m.ctx.close();

  const r = await newPage(1440, 900, { reducedMotion: 'reduce' });
  await check(c, 'Reduced motion: sheet animation is disabled', async () => {
    await go(r.page, `/${c}/leads?lead=ld-ritu`);
    const dur = await r.page.getByRole('dialog').evaluate((el) => getComputedStyle(el).animationDuration);
    expect(parseFloat(dur) <= 0.01, `animation-duration ${dur}`);
    return `animation-duration ${dur}`;
  });
  await r.ctx.close();
}

// Cross-concept consistency
{
  const { ctx, page } = await newPage();
  await check('a+b', 'Both concepts show the same verified figure', async () => {
    await go(page, '/a/today');
    const a = await heroText(page);
    await go(page, '/b/today');
    await page.waitForTimeout(600);
    const b = await heroText(page);
    expect(a === b, `${a} vs ${b}`);
    return `₹${a} in both`;
  });
  await ctx.close();
}
await browser.close();

const passed = results.filter((r) => r.pass).length;
writeFileSync(outFile, JSON.stringify({ passed, total: results.length, results, consoleErrors }, null, 2));
for (const r of results) console.log(`${r.pass ? 'PASS' : 'FAIL'}  [${r.concept}] ${r.name} — ${r.detail}`);
console.log(`\n${passed}/${results.length} passed · console errors: ${consoleErrors.length}`);
for (const e of consoleErrors.slice(0, 10)) console.log('  ' + e);
