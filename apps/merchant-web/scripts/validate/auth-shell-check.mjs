// Reusable authenticated browser validation for merchant-web: signs up a real local test
// account through the actual UI (no auth bypass), confirms via the local Mailpit inbox, onboards
// a workspace, and exercises the app shell — navigation, workspace switching, team/invite,
// command search, responsive layout and sign-out. Captures screenshots, axe-core and overflow
// results.
//
// Requires the local stack running per the root README ("Local development"): Supabase (Postgres
// + Auth + Mailpit), Redis, core-api and merchant-web on their default ports.
//
// Usage: node auth-shell-check.mjs <toolsDir> <outDir>
// <toolsDir> is a directory with its own package.json that has playwright-core and axe-core
// installed (see apps/design-lab/scripts/validate/README.md for the same convention). Not wired
// into any package script or CI — run manually with `node`.
//
// Creates throwaway local accounts/organizations (test-* / @example.com) in the local dev
// database only; nothing here touches a hosted environment or uses real credentials.
import { createRequire } from 'node:module';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';

const [, , toolsDir, outDir] = process.argv;
if (!toolsDir || !outDir) throw new Error('usage: auth-shell-check.mjs <toolsDir> <outDir>');
const require = createRequire(path.join(toolsDir, 'package.json'));
const { chromium } = require('playwright-core');
const AXE = readFileSync(path.join(toolsDir, 'node_modules/axe-core/axe.min.js'), 'utf8');
mkdirSync(outDir, { recursive: true });

const BASE = 'http://localhost:3000';
const MAILPIT = 'http://127.0.0.1:54324';
const stamp = Date.now();
const EMAIL = `e2e-test-${stamp}@example.com`;
const TEST_PASSWORD = 'LocalE2eTestOnly!1';
const results = [];
const log = (name, ok, detail = '') => {
  results.push({ name, ok, detail });
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? ` — ${detail}` : ''}`);
};

async function mailpitLinkFor(email) {
  for (let i = 0; i < 20; i++) {
    const res = await fetch(`${MAILPIT}/api/v1/messages?limit=20`);
    const data = await res.json();
    const msg = data.messages?.find((m) => m.To?.some((t) => t.Address === email));
    if (msg) {
      const full = await (await fetch(`${MAILPIT}/api/v1/message/${msg.ID}`)).json();
      const text = full.Text ?? full.HTML ?? '';
      const match = text.match(/https?:\/\/[^\s"<]+\/auth\/confirm[^\s"<]*/);
      if (match) return match[0];
    }
    await new Promise((r) => setTimeout(r, 500));
  }
  throw new Error(`No confirmation email found for ${email}`);
}

async function axeScan(page, label) {
  await page.addScriptTag({ content: AXE });
  const violations = await page.evaluate(async () =>
    (await window.axe.run(document)).violations.map((v) => ({ id: v.id, impact: v.impact })),
  );
  log(`axe: ${label}`, violations.length === 0, JSON.stringify(violations));
}

async function overflowCheck(page, label, width) {
  const overflowPx = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  log(`overflow: ${label} @${width}`, overflowPx <= 0, `${overflowPx}px`);
}

const browser = await chromium.launch({ channel: 'chrome', headless: true });

async function newPage(width, height, sharedContext) {
  // A new browser context is a fresh cookie jar (a different, signed-out "user"). Pass the
  // authenticated context through for same-session viewport/responsive checks.
  const ctx =
    sharedContext ??
    (await browser.newContext({
      viewport: { width, height },
      isMobile: width < 500,
      hasTouch: width < 500,
      locale: 'en-IN',
      timezoneId: 'Asia/Kolkata',
    }));
  const page = await ctx.newPage();
  if (sharedContext) await page.setViewportSize({ width, height });
  const consoleErrors = [];
  page.on('console', (m) => {
    if (m.type() === 'error') consoleErrors.push(m.text());
  });
  page.consoleErrors = consoleErrors;
  return page;
}

// 1. Sign up through the real UI.
const signup = await newPage(1440, 900);
await signup.goto(`${BASE}/signup`, { waitUntil: 'networkidle' });
await signup.fill('input[name="email"]', EMAIL);
await signup.fill('input[name="password"]', TEST_PASSWORD);
await signup.click('button[type="submit"]');
await signup.waitForSelector('text=Check your email', { timeout: 10_000 }).catch(() => null);
log('signup: submitted', true);
await signup.screenshot({ path: path.join(outDir, 'auth-signup-submitted-1440.png') });
await signup.close();

// 2. Confirm via the emailed link (Mailpit), same as a real user would.
const confirmUrl = await mailpitLinkFor(EMAIL);
log('mailpit: confirmation email received', true);
const main = await newPage(1440, 900);
await main.goto(confirmUrl, { waitUntil: 'networkidle' });
log('confirm: redirected', main.url().includes('/onboarding'), main.url());
await main.screenshot({ path: path.join(outDir, 'onboarding-1440.png') });
await axeScan(main, 'onboarding');
await overflowCheck(main, 'onboarding', 1440);

// 3. Onboard the first workspace.
const orgName = `Test Business ${stamp}`;
await main.fill('input[name="name"]', orgName);
await main.waitForTimeout(150); // let the slug auto-fill effect run
await main.click('button[type="submit"]');
await main.waitForURL(/\/o\/[^/]+$/, { timeout: 10_000 });
const org1Url = main.url();
log('onboarding: workspace created', /\/o\/[^/]+$/.test(org1Url), org1Url);
await main.waitForLoadState('networkidle');
await main.screenshot({ path: path.join(outDir, 'shell-overview-1440.png'), fullPage: true });
await axeScan(main, 'workspace overview');
await overflowCheck(main, 'workspace overview', 1440);
log('shell: wordmark + workspace switcher visible', await main.isVisible('text=Krinly'));
log('shell: Workspace nav item visible', await main.isVisible('aside a:has-text("Workspace")'));
log('shell: Team nav item visible', await main.isVisible('aside a:has-text("Team")'));

// 4. Team page.
await main.locator('aside a:has-text("Team")').click();
await main.waitForURL(/\/members$/, { timeout: 10_000 });
await main.waitForSelector('h1:has-text("Team")', { timeout: 10_000 });
await main.waitForSelector('text=Invite someone', { timeout: 10_000 }).catch(() => null);
await main.waitForLoadState('networkidle');
log('team: navigated to /members', main.url().endsWith('/members'), main.url());
await main.screenshot({ path: path.join(outDir, 'shell-team-1440.png') });
await axeScan(main, 'team page');
await overflowCheck(main, 'team page', 1440);
log('team: invite form visible', await main.isVisible('text=Invite someone'));

// 5. Command search: open with the trigger, filter, navigate to Workspace.
await main.locator('button:has-text("Search workspace")').click();
await main.waitForSelector('input[aria-label="Search"]', { timeout: 5000 });
await main.fill('input[aria-label="Search"]', 'Workspace');
await main.screenshot({ path: path.join(outDir, 'shell-command-search-1440.png') });
await main.locator('[role="dialog"] >> text="Workspace"').click();
await main.waitForURL(org1Url, { timeout: 10_000 });
log('command search: navigated to Workspace', main.url() === org1Url, main.url());

// 6. Second workspace, to exercise real switching.
await main.goto(`${BASE}/onboarding`, { waitUntil: 'networkidle' });
await main.fill('input[name="name"]', `Test Business ${stamp} (second)`);
await main.waitForTimeout(150);
await main.click('button[type="submit"]');
await main.waitForURL(/\/o\/[^/]+$/, { timeout: 10_000 });
const org2Url = main.url();
log('onboarding: second workspace created', org2Url !== org1Url, org2Url);

// Switch back to the first workspace via the sidebar switcher.
await main.selectOption('#workspace-switcher', { label: orgName });
await main.waitForURL(org1Url, { timeout: 5000 }).catch(() => null);
log('workspace switcher: switched back', main.url() === org1Url, main.url());
const authedContext = main.context();
await main.close();

// 7. Mobile shell pass (bottom nav, header, no overflow) on the first workspace. Same signed-in
// session as `main` — a new incognito-style context would be a signed-out visitor instead.
const mobile = await newPage(390, 844, authedContext);
await mobile.goto(org1Url, { waitUntil: 'networkidle' });
await mobile.waitForSelector('nav[aria-label="Main"]', { timeout: 10_000 });
await mobile.screenshot({ path: path.join(outDir, 'shell-overview-390.png') });
await overflowCheck(mobile, 'workspace overview', 390);
log('mobile: bottom nav visible', await mobile.isVisible('nav[aria-label="Main"]'));
await mobile.locator('nav[aria-label="Main"] >> text=Team').click();
await mobile.waitForURL(/\/members$/, { timeout: 10_000 });
await mobile.waitForSelector('h1:has-text("Team")', { timeout: 10_000 });
await mobile.waitForSelector('text=Invite someone', { timeout: 10_000 }).catch(() => null);
await mobile.waitForLoadState('networkidle');
await mobile.screenshot({ path: path.join(outDir, 'shell-team-390.png') });
await overflowCheck(mobile, 'team page', 390);
await axeScan(mobile, 'team page (mobile)');
log(
  'mobile console errors',
  mobile.consoleErrors.length === 0,
  JSON.stringify(mobile.consoleErrors),
);
await mobile.close();

// 8. Sign-out, from the account menu, on desktop.
const signoutPage = await newPage(1440, 900, authedContext);
await signoutPage.goto(org1Url, { waitUntil: 'networkidle' });
await signoutPage.click('aside button:has-text("account menu")');
await signoutPage.waitForSelector('text=Sign out', { timeout: 5000 });
await signoutPage.screenshot({ path: path.join(outDir, 'shell-account-menu-1440.png') });
await signoutPage.click('text=Sign out');
await signoutPage.waitForURL(/\/login/, { timeout: 10_000 });
log('sign out: returned to /login', signoutPage.url().includes('/login'), signoutPage.url());
// Confirm the session really ended: the workspace route now redirects to sign-in, not data.
await signoutPage.goto(org1Url, { waitUntil: 'networkidle' });
log(
  'sign out: workspace route now requires sign-in',
  signoutPage.url().includes('/login'),
  signoutPage.url(),
);
await signoutPage.close();

await browser.close();

writeFileSync(path.join(outDir, 'results.json'), JSON.stringify(results, null, 2));
const failed = results.filter((r) => !r.ok);
console.log(`\n${results.length - failed.length}/${results.length} checks passed.`);
if (failed.length) {
  console.log('FAILURES:', JSON.stringify(failed, null, 2));
  process.exitCode = 1;
}
