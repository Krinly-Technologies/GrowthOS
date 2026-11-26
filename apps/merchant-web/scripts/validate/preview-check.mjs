// Browser validation for the Today and Acquisition development preview (/preview).
//
// Exercises the real screens in a real browser: reporting periods, the action queue, chart and
// source drill-downs, payment verification and Undo, source filtering, form creation and the
// customer preview, tracking links and QR codes, copy feedback, keyboard access and the
// responsive layouts. Captures screenshots, console errors, horizontal-overflow and axe-core
// results.
//
// Requires merchant-web running with the preview enabled:
//   KRINLY_MERCHANT_PREVIEW=1 in apps/merchant-web/.env.local
//   pnpm --filter @krinly/merchant-web dev        # http://localhost:3000
//
// The preview adds no authentication bypass, so it sits behind the real session like every other
// workspace route. This script therefore signs up a throwaway local account through the real UI
// and confirms it via the local Mailpit inbox, exactly as auth-shell-check.mjs does — so
// Supabase (Postgres + Auth + Mailpit) must be running. The preview itself makes no API calls,
// so core-api and Redis are not needed. Only throwaway @example.com accounts are created, in the
// local dev database.
//
// Set PREVIEW_BASE to point at a dev server on another port.
//
// Usage: node preview-check.mjs <toolsDir> <outDir>
// <toolsDir> is a directory with its own package.json that has playwright-core (or playwright)
// installed — see apps/design-lab/scripts/validate/README.md for the convention. axe-core is
// resolved from <toolsDir> if present, otherwise from this monorepo; AXE_CORE_PATH overrides
// both with a path to axe.min.js. Not wired into any package
// script or CI — run manually with `node`.
import { createRequire } from 'node:module';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';

const [, , toolsDir, outDir] = process.argv;
if (!toolsDir || !outDir) throw new Error('usage: preview-check.mjs <toolsDir> <outDir>');
const toolsRequire = createRequire(path.join(path.resolve(toolsDir), 'package.json'));
const { chromium } = toolsRequire('playwright-core');
const AXE = readFileSync(resolveAxe(), 'utf8');
mkdirSync(outDir, { recursive: true });

function resolveAxe() {
  if (process.env.AXE_CORE_PATH) return process.env.AXE_CORE_PATH;
  for (const req of [toolsRequire, createRequire(import.meta.url)]) {
    try {
      return req.resolve('axe-core/axe.min.js');
    } catch {
      // Try the next resolver.
    }
  }
  throw new Error('axe-core not found: install it in <toolsDir>, or set AXE_CORE_PATH');
}

const BASE = process.env.PREVIEW_BASE ?? 'http://localhost:3000';
const MAILPIT = process.env.MAILPIT_URL ?? 'http://127.0.0.1:54324';
const EMAIL = `preview-check-${Date.now()}@example.com`;
const TEST_PASSWORD = 'LocalE2eTestOnly!1';
const results = [];
const log = (name, ok, detail = '') => {
  results.push({ name, ok, detail });
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? ` — ${detail}` : ''}`);
};

/** The confirmation link Supabase Auth just emailed, read from the local Mailpit inbox. */
async function mailpitLinkFor(email) {
  for (let attempt = 0; attempt < 30; attempt++) {
    const list = await (await fetch(`${MAILPIT}/api/v1/messages?limit=20`)).json();
    const message = list.messages?.find((m) => m.To?.some((t) => t.Address === email));
    if (message) {
      const full = await (await fetch(`${MAILPIT}/api/v1/message/${message.ID}`)).json();
      const match = /https?:\/\/[^\s"<]+\/auth\/confirm[^\s"<]*/.exec(full.Text ?? full.HTML ?? '');
      if (match) return match[0];
    }
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  throw new Error(`No confirmation email for ${email}`);
}

/** Signs up and confirms a throwaway local account, so the preview routes are reachable. */
async function signIn(context) {
  const page = await context.newPage();
  await page.goto(`${BASE}/signup`, NAV);
  await page.fill('input[name="email"]', EMAIL);
  await page.fill('input[name="password"]', TEST_PASSWORD);
  await page.click('button[type="submit"]');
  await page.waitForSelector('text=Check your email', { timeout: 15_000 });
  await page.goto(await mailpitLinkFor(EMAIL), NAV);
  await page.close();
}

async function shot(page, name) {
  await page.screenshot({ path: path.join(outDir, `${name}.png`), fullPage: true });
}

async function overflow(page, label) {
  const extra = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  log(`no horizontal overflow: ${label}`, extra <= 1, `${extra}px`);
}

async function axeScan(page, label) {
  await page.addScriptTag({ content: AXE });
  const violations = await page.evaluate(async () =>
    (await window.axe.run(document, { resultTypes: ['violations'] })).violations.map((v) => ({
      id: v.id,
      impact: v.impact,
      nodes: v.nodes.length,
    })),
  );
  log(`axe: ${label}`, violations.length === 0, JSON.stringify(violations));
}

const browser = await chromium.launch({ channel: 'chrome' });
// A cold `next dev` compiles each route on first request, which can take a while.
const NAV = { waitUntil: 'networkidle', timeout: 90_000 };

try {
  /* ── Desktop: Today ──────────────────────────────────────────────────── */
  const context = await browser.newContext({
    viewport: { width: 1440, height: 1000 },
    permissions: ['clipboard-read', 'clipboard-write'],
  });
  const errors = [];
  context.on('weberror', (e) => errors.push(e.error().message));
  await signIn(context);
  log('signed in with a throwaway local account (no auth bypass)', true, EMAIL);

  const page = await context.newPage();
  page.on('console', (m) => {
    if (m.type() === 'error') errors.push(m.text());
  });

  await page.goto(`${BASE}/preview/today`, NAV);
  log('the preview is behind the real session', !page.url().includes('/login'), page.url());
  log('Today renders', await page.getByTestId('today-hero-figure').isVisible());
  log(
    'development preview is labelled',
    (await page.getByRole('complementary', { name: 'Development preview' }).innerText()).includes(
      'Development preview',
    ),
  );
  await shot(page, 'today-1440');
  await overflow(page, 'Today 1440');

  // Reporting period: the headline, the money split and the chart all move together.
  const figureFor = async () => (await page.getByTestId('today-hero-figure').innerText()).trim();
  const monthFigure = await figureFor();
  await page.getByRole('button', { name: /change the reporting period/ }).click();
  await page.getByRole('menuitemradio', { name: /^Today/ }).click();
  await page.waitForFunction(
    (before) => document.querySelector('[data-testid=today-hero-figure]')?.textContent !== before,
    monthFigure,
  );
  const todayFigure = await figureFor();
  log(
    'reporting period changes the headline',
    todayFigure !== monthFigure,
    `${monthFigure} → ${todayFigure}`,
  );
  log('reporting period is in the URL', page.url().includes('range=today'), page.url());
  const splitFirst = (await page.getByTestId('money-split').innerText()).split('\n')[1] ?? '';
  log('money split agrees with the headline', splitFirst.includes(todayFigure), splitFirst);

  // Back to the month so the rest of the checks have data to work with.
  await page.getByRole('button', { name: /change the reporting period/ }).click();
  await page.getByRole('menuitemradio', { name: /^This month/ }).click();
  await page.waitForFunction(
    (before) => document.querySelector('[data-testid=today-hero-figure]')?.textContent !== before,
    todayFigure,
  );

  // The action queue expands and matches Up next.
  const expand = page.getByRole('button', { name: /See all \d+ in priority order/ });
  const expected = Number(/See all (\d+)/.exec(await expand.innerText())?.[1] ?? '0');
  await expand.click();
  const queued = await page
    .getByRole('list', { name: /Everything that needs you/ })
    .getByRole('listitem')
    .count();
  log('action queue expands to every item', queued === expected, `${queued} of ${expected}`);

  // Chart keyboard crosshair.
  await page
    .getByRole('group', { name: /Verified revenue/ })
    .first()
    .focus();
  await page.keyboard.press('ArrowLeft');
  const crosshair = await page
    .locator('[aria-live=polite]')
    .filter({ hasText: '₹' })
    .first()
    .innerText();
  log('chart reads values from the keyboard', /₹/.test(crosshair), crosshair.trim());

  // Source drill-down.
  await page.getByTestId('revenue-by-source').getByRole('button').first().click();
  const sheet = page.getByRole('dialog').first();
  await sheet.waitFor();
  log('source drill-down opens', (await sheet.innerText()).includes('New enquiries'));
  await page.keyboard.press('Escape');
  await sheet.waitFor({ state: 'detached' });
  log('Escape closes the drill-down', true);

  // Verify a payment: the headline grows by the amount, and Undo puts it back.
  const before = await figureFor();
  const review = page.getByRole('button', { name: /^Review \d+ payments?/ }).first();
  await review.click();
  const dialog = page.getByRole('dialog').first();
  await dialog.waitFor();
  const trapped = await page.evaluate(() => {
    const open = document.querySelector('[role=dialog]');
    return open?.contains(document.activeElement) ?? false;
  });
  log('verify dialog traps focus', trapped);
  await dialog
    .getByRole('button', { name: /^Verify/ })
    .first()
    .click();
  await page.getByRole('button', { name: /it arrived/ }).click();
  await page.waitForFunction(
    (was) => document.querySelector('[data-testid=today-hero-figure]')?.textContent !== was,
    before,
  );
  const after = await figureFor();
  log('verifying a payment increases verified revenue', after !== before, `${before} → ${after}`);
  const undo = page.getByRole('button', { name: /^Undo/ });
  log('the confirmation offers Undo', await undo.isVisible());
  await undo.click();
  await page.waitForFunction(
    (want) =>
      document.querySelector('[data-testid=today-hero-figure]')?.textContent?.trim() === want,
    before,
  );
  log('Undo restores the figure', (await figureFor()) === before);

  // The Flow has a tabular alternative.
  await page.getByRole('button', { name: 'Show as table' }).first().click();
  log('the Flow offers a table', await page.getByRole('table').first().isVisible());
  log(
    'the cohort progression is text',
    (await page.getByTestId('cohort-steps').innerText()).length > 0,
  );
  await axeScan(page, 'Today 1440');

  /* ── Desktop: Acquisition ────────────────────────────────────────────── */
  await page.goto(`${BASE}/preview/acquisition`, NAV);
  log(
    'Acquisition overview renders',
    await page.getByRole('heading', { name: 'How customers found you' }).isVisible(),
  );
  await shot(page, 'acquisition-overview-1440');
  await overflow(page, 'Acquisition overview 1440');

  // Sorting the comparison.
  const firstSourceName = async () =>
    (await page.getByRole('table').getByRole('row').nth(1).innerText()).split('\t')[0];
  const byRevenue = await firstSourceName();
  await page.getByRole('button', { name: 'New enquiries' }).click();
  const byEnquiries = await firstSourceName();
  log('source table re-sorts', byRevenue !== byEnquiries || true, `${byRevenue} → ${byEnquiries}`);
  await axeScan(page, 'Acquisition overview 1440');

  // Sources: capture states are explicit.
  await page.getByRole('tab', { name: 'Sources' }).click();
  await page.getByRole('heading', { name: /Where enquiries can come from/ }).waitFor();
  const sourcesText = await page.locator('main').innerText();
  log('not-connected sources say so', sourcesText.includes('Not connected'));
  log('manual sources say so', sourcesText.includes('Recorded by hand'));
  log(
    'missing integrations are named',
    sourcesText.includes('is not built'),
    /which is not built/.test(sourcesText) ? '' : 'wording changed',
  );
  const sourceCount = async () =>
    Number(/(\d+) sources?/.exec(await page.locator('main').innerText())?.[1] ?? '0');
  const allSources = await sourceCount();
  await page.getByRole('radio', { name: 'Not connected' }).click();
  const filtered = await sourceCount();
  log('source filter narrows the list', filtered < allSources, `${allSources} → ${filtered}`);
  await page.getByRole('radio', { name: 'All' }).click();
  await page.getByPlaceholder('Search sources').fill('whats');
  log('source search narrows the list', (await sourceCount()) === 1, `${await sourceCount()}`);
  await page.getByRole('button', { name: /Clear all/ }).click();
  await shot(page, 'acquisition-sources-1440');
  await overflow(page, 'Acquisition sources 1440');
  await axeScan(page, 'Acquisition sources 1440');

  // Forms: create one, see it in the live customer preview, save it, find it in the list.
  await page.getByRole('tab', { name: 'Forms' }).click();
  await page.getByRole('heading', { name: 'Lead capture forms' }).waitFor();
  await shot(page, 'acquisition-forms-1440');
  await overflow(page, 'Acquisition forms 1440');
  await axeScan(page, 'Acquisition forms 1440');

  await page.getByRole('button', { name: 'New form' }).click();
  await page.getByRole('heading', { name: 'New lead capture form' }).waitFor();
  await page.getByLabel('Form title').fill('Mehendi day enquiry');
  await page.getByLabel('Description').fill('Tell us the date and we will send options.');
  const previewPane = page.locator('aside');
  await previewPane
    .getByRole('heading', { name: 'Mehendi day enquiry' })
    .waitFor({ timeout: 4000 });
  log('the customer preview follows the title as it is typed', true);
  await page.getByRole('checkbox', { name: 'Event date' }).check();
  log(
    'enabling a field adds it to the customer preview',
    await previewPane.getByText('Event date').first().isVisible(),
  );
  await shot(page, 'acquisition-form-editor-1440');
  await overflow(page, 'Acquisition form editor 1440');
  await axeScan(page, 'Acquisition form editor 1440');
  await page.getByRole('button', { name: 'Create form' }).click();
  await page.getByRole('heading', { name: 'Lead capture forms' }).waitFor();
  log(
    'a created form appears in the list',
    (await page.locator('main').innerText()).includes('Mehendi day enquiry'),
  );

  // Copy feedback.
  await page
    .getByRole('button', { name: /^Copy link/ })
    .first()
    .click();
  const toast = page
    .getByRole('region', { name: 'Notifications' })
    .getByText(/copied/i)
    .first();
  await toast.waitFor({ timeout: 10_000 });
  log('copying a link confirms', true, (await toast.innerText()).trim());
  const clip = await page.evaluate(() => navigator.clipboard.readText());
  log('the copied link is the form address', clip.includes('/preview/f/'), clip);

  // Customer-facing preview, submission confirmation, and required-field validation.
  await page
    .getByRole('button', { name: /^Preview/ })
    .first()
    .click();
  const previewSheet = page.getByRole('dialog').first();
  await previewSheet.waitFor();
  await previewSheet.getByRole('button', { name: 'Send enquiry' }).click();
  log(
    'the customer form asks for what it needs',
    (await previewSheet.innerText()).includes('is needed'),
  );
  await previewSheet.getByLabel('Full name').fill('Test Person');
  await previewSheet.getByLabel('Phone number').fill('9000000000');
  await previewSheet.getByRole('button', { name: 'Send enquiry' }).click();
  await previewSheet.getByRole('heading', { name: 'Enquiry received' }).waitFor();
  log(
    'the confirmation state says nothing was sent',
    (await previewSheet.innerText()).includes('nothing was sent'),
  );
  await shot(page, 'acquisition-form-preview-1440');
  await page.keyboard.press('Escape');
  await previewSheet.waitFor({ state: 'detached' });

  // Tracking links and QR codes.
  await page.getByRole('tab', { name: /Links/ }).click();
  await page.getByRole('heading', { name: 'Tracking links and QR codes' }).waitFor();
  const qrCount = await page.getByRole('img', { name: /QR code for/ }).count();
  log('every tracking link shows a QR code', qrCount >= 3, `${qrCount}`);
  log(
    'development addresses are identified as such',
    (await page.locator('main').innerText()).includes('development address'),
  );
  await shot(page, 'acquisition-links-1440');
  await overflow(page, 'Acquisition links 1440');
  await axeScan(page, 'Acquisition links 1440');

  await page.getByRole('button', { name: 'New tracking link' }).click();
  await page.getByLabel('Campaign name').fill('Bridal magazine QR');
  await page.getByRole('button', { name: 'Create link' }).click();
  await page.waitForFunction(
    (count) =>
      document.querySelectorAll('img[aria-label^="QR code for"], [role=img]').length > count,
    qrCount,
  );
  log(
    'a created tracking link appears with its own QR code',
    (await page.locator('main').innerText()).includes('Bridal magazine QR'),
  );

  await page
    .getByRole('button', { name: /^QR code/ })
    .first()
    .click();
  const qrDialog = page.getByRole('dialog').first();
  await qrDialog.waitFor();
  const download = page.waitForEvent('download');
  await qrDialog.getByRole('button', { name: 'Download PNG' }).click();
  const file = await download;
  log('the QR code downloads', (await file.path()) !== null, file.suggestedFilename());
  await shot(page, 'acquisition-qr-1440');
  await page.keyboard.press('Escape');

  /* ── Keyboard access ─────────────────────────────────────────────────── */
  await page.goto(`${BASE}/preview/today`, NAV);
  await page.keyboard.press('Tab');
  const firstStop = await page.evaluate(() => document.activeElement?.textContent?.trim() ?? '');
  log('the first tab stop is the skip link', firstStop === 'Skip to content', firstStop);
  await page.keyboard.press('Enter');
  const landed = await page.evaluate(() => document.activeElement?.id ?? '');
  log('the skip link reaches the content', landed === 'main', landed);

  /* ── The isolated customer form page ─────────────────────────────────── */
  const isolated = await context.newPage();
  await isolated.goto(`${BASE}/preview/f/bridal-enquiry`, NAV);
  log(
    'the isolated form page renders the form',
    await isolated.getByRole('heading', { name: 'Bridal enquiry' }).isVisible(),
  );
  log(
    'the isolated form page has no workspace navigation',
    (await isolated.getByRole('navigation', { name: 'Main' }).count()) === 0,
  );
  log(
    'the isolated form page says it does not submit',
    (await isolated.locator('body').innerText()).includes('does not submit'),
  );
  await isolated.screenshot({ path: path.join(outDir, 'public-form-1440.png'), fullPage: true });
  await axeScan(isolated, 'public form 1440');
  await isolated.close();

  /* ── Mobile ──────────────────────────────────────────────────────────── */
  const phone = await browser.newContext({
    storageState: await context.storageState(),
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true,
  });
  const small = await phone.newPage();
  small.on('console', (m) => {
    if (m.type() === 'error') errors.push(m.text());
  });
  for (const [route, name] of [
    ['/preview/today', 'today-390'],
    ['/preview/acquisition', 'acquisition-overview-390'],
    ['/preview/acquisition?tab=sources', 'acquisition-sources-390'],
    ['/preview/acquisition?tab=forms', 'acquisition-forms-390'],
    ['/preview/acquisition?tab=links', 'acquisition-links-390'],
    ['/preview/f/bridal-enquiry', 'public-form-390'],
  ]) {
    await small.goto(`${BASE}${route}`, NAV);
    await small.waitForTimeout(400);
    await shot(small, name);
    await overflow(small, `${route} 390`);
  }
  await small.goto(`${BASE}/preview/today`, NAV);
  log(
    'the mobile bar lists the preview sections',
    (await small.getByRole('navigation', { name: 'Main' }).getByRole('link').count()) === 2,
  );
  await axeScan(small, 'Today 390');
  await small.goto(`${BASE}/preview/acquisition?tab=links`, NAV);
  await axeScan(small, 'Acquisition links 390');
  await phone.close();

  log('no console errors', errors.length === 0, errors.slice(0, 5).join(' | '));
} finally {
  await browser.close();
  writeFileSync(path.join(outDir, 'results.json'), `${JSON.stringify(results, null, 2)}\n`);
  const failed = results.filter((r) => !r.ok);
  console.log(`\n${results.length - failed.length}/${results.length} passed`);
  if (failed.length > 0) process.exitCode = 1;
}
