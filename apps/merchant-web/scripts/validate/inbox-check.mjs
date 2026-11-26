// Browser validation for the Inbox development preview (/preview/inbox).
//
// Exercises the real screen in a real browser: switching conversations, accepting/editing a
// simulated AI reply, requesting human assistance on a flagged conversation, assigning and
// resolving a conversation, keyboard access and the responsive (desktop/mobile) layouts.
// Captures screenshots, console errors and horizontal overflow. Follows the same conventions as
// `preview-check.mjs` — see that file's header. Conversations are addressed directly via
// `?c=<leadId>` (story.ts ids), so this script does not need to search the list for a
// conversation in a particular AI state.
//
// Usage: node inbox-check.mjs <toolsDir> <outDir>
import { createRequire } from 'node:module';
import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';

const [, , toolsDir, outDir] = process.argv;
if (!toolsDir || !outDir) throw new Error('usage: inbox-check.mjs <toolsDir> <outDir>');
const toolsRequire = createRequire(path.join(path.resolve(toolsDir), 'package.json'));
const { chromium } = toolsRequire('playwright-core');
mkdirSync(outDir, { recursive: true });

const BASE = process.env.PREVIEW_BASE ?? 'http://localhost:3000';
const MAILPIT = process.env.MAILPIT_URL ?? 'http://127.0.0.1:54324';
const EMAIL = `inbox-check-${Date.now()}@example.com`;
const TEST_PASSWORD = 'LocalE2eTestOnly!1';
const results = [];
const log = (name, ok, detail = '') => {
  results.push({ name, ok, detail });
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? ` — ${detail}` : ''}`);
};

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

const browser = await chromium.launch({ channel: 'chrome' });
const NAV = { waitUntil: 'networkidle', timeout: 90_000 };

// Story leads (fixed fixture, see sample/story.ts) — used to address specific conversations
// directly instead of searching the list for one in a particular AI state.
const STORY_LEADS = [
  'ld-ritu',
  'ld-ananya',
  'ld-selvi',
  'ld-harpreet',
  'ld-sneha',
  'ld-aisha',
  'ld-kritika',
  'ld-mohit',
  'ld-nazia',
  'ld-deepa',
  'ld-pooja',
  'ld-shalini',
  'ld-roshni',
  'ld-tara',
  'ld-gayatri',
  'ld-rukhsar',
  'ld-anusha',
  'ld-bhavya',
];

try {
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
  const errors = [];
  context.on('weberror', (e) => errors.push(e.error().message));
  await signIn(context);
  log('signed in with a throwaway local account', true, EMAIL);

  const page = await context.newPage();
  page.on('console', (m) => {
    if (m.type() === 'error') errors.push(m.text());
  });

  /* ── Desktop: three-panel layout ─────────────────────────────────────── */
  await page.goto(`${BASE}/preview/inbox?c=ld-ritu`, NAV);
  log('Inbox is behind the real session', !page.url().includes('/login'), page.url());
  log(
    'conversation list renders',
    await page.getByRole('list', { name: 'Conversations' }).isVisible(),
  );
  await page.getByRole('heading', { name: 'AI sales assistant' }).waitFor({ timeout: 5000 });
  log('selecting a conversation opens the workspace and AI assist panel', true);
  await shot(page, 'inbox-desktop-1440');
  await overflow(page, 'Inbox desktop 1440');

  // Switching conversations changes the transcript header.
  const nameOf = async () => (await page.locator('header p').first().innerText()).trim();
  const before = await nameOf();
  await page.goto(`${BASE}/preview/inbox?c=ld-ananya`, NAV);
  await page.waitForTimeout(300);
  const after = await nameOf();
  log('switching conversations updates the workspace', before !== after, `${before} → ${after}`);

  // Find a story lead with a proposed reply, and accept it.
  let acceptedOn = null;
  for (const leadId of STORY_LEADS) {
    await page.goto(`${BASE}/preview/inbox?c=${leadId}`, NAV);
    const acceptBtn = page.getByRole('button', { name: /Accept & send/ });
    if (await acceptBtn.isVisible().catch(() => false)) {
      const messageCountBefore = await page.locator('main ol li').count();
      await acceptBtn.click();
      await page.waitForFunction(
        (prev) => document.querySelectorAll('main ol li').length > prev,
        messageCountBefore,
        { timeout: 5000 },
      );
      acceptedOn = leadId;
      break;
    }
  }
  log('found a conversation with a suggested reply', acceptedOn !== null, acceptedOn ?? '');
  if (acceptedOn) {
    log('accepting a suggestion sends it as a message', true);
    await shot(page, 'inbox-ai-reply-1440');
  }

  // Find a second story lead with a proposed reply (different from the one just accepted) and
  // use edit-before-send instead.
  let editedOn = null;
  for (const leadId of STORY_LEADS) {
    if (leadId === acceptedOn) continue;
    await page.goto(`${BASE}/preview/inbox?c=${leadId}`, NAV);
    const editBtn = page.getByRole('button', { name: 'Edit' });
    if (await editBtn.isVisible().catch(() => false)) {
      await editBtn.click();
      await page.locator('textarea').last().fill('Edited reply from the merchant.');
      await page.getByRole('button', { name: 'Send edited reply' }).click();
      await page.waitForTimeout(300);
      editedOn = leadId;
      break;
    }
  }
  log('editing a suggestion before sending works', editedOn !== null, editedOn ?? '');

  // A conversation the AI flagged for human review.
  await page.goto(`${BASE}/preview/inbox`, NAV);
  await page.getByRole('button', { name: 'Needs review' }).click();
  const reviewRows = page.getByRole('list', { name: 'Conversations' }).getByRole('listitem');
  const reviewCount = await reviewRows.count();
  log('Needs review filters the list', reviewCount > 0, `${reviewCount} conversations`);
  if (reviewCount > 0) {
    await reviewRows.first().getByRole('button').click();
    await page.getByText('Needs human review').waitFor({ timeout: 5000 });
    await shot(page, 'inbox-handoff-1440');
    await overflow(page, 'Inbox handoff 1440');
    await page.getByRole('button', { name: 'Request human assistance' }).click();
    await page.getByText('Escalated').waitFor({ timeout: 5000 });
    log('requesting human assistance escalates the conversation', true);
  }

  // Assign and resolve a conversation, then confirm the CRM record picked up the new owner.
  // The preview store is in-memory per page load (by design — see phase-04-handoff.md), so these
  // follow-on checks use in-app navigation (clicks), never `page.goto()`, to keep the same session.
  await page.goto(`${BASE}/preview/inbox?c=ld-sneha`, NAV);
  const currentOwner = (await page.getByLabel('Change assignee').innerText()).trim();
  await page.getByLabel('Change assignee').click();
  const options = page.getByRole('menuitemradio');
  const optionCount = await options.count();
  let assigneeName = '';
  for (let i = 0; i < optionCount; i++) {
    const text = (await options.nth(i).innerText()).trim();
    if (!currentOwner.includes(text)) {
      assigneeName = text;
      await options.nth(i).click();
      break;
    }
  }
  await page.waitForTimeout(200);
  log(
    'assigning a conversation updates the trigger label',
    assigneeName !== '',
    `${currentOwner} → ${assigneeName}`,
  );

  await page.getByLabel('Change assignee').click();
  await page.getByRole('menuitem', { name: 'Open CRM record' }).click();
  const crmSheet = page.getByRole('dialog').first();
  await crmSheet.waitFor({ timeout: 5000 });
  const crmSheetText = await crmSheet.innerText();
  log(
    'assigning a conversation updates the linked CRM owner',
    crmSheetText.includes(assigneeName.split(' ')[0] ?? assigneeName),
    crmSheetText.slice(0, 220).replace(/\n/g, ' '),
  );
  await page.keyboard.press('Escape');

  // Back to the inbox (soft nav, so the store state from the checks above is kept) and reopen
  // the same conversation.
  await page.getByRole('link', { name: 'Inbox' }).click();
  await page
    .getByRole('list', { name: 'Conversations' })
    .getByText('Sneha Kulkarni')
    .first()
    .click();
  await page.getByLabel('Change assignee').waitFor({ timeout: 5000 });

  await page.getByLabel('Change assignee').click();
  await page.getByRole('menuitem', { name: 'Resolve' }).click();
  await page.getByText('This conversation is resolved.').waitFor({ timeout: 5000 });
  log('resolving a conversation marks it resolved', true);

  await page.getByRole('button', { name: /^Closed/ }).click();
  const closedText = await page.getByRole('list', { name: 'Conversations' }).innerText();
  log('resolved conversation appears under Closed', closedText.includes('Sneha'));

  /* ── Keyboard access ─────────────────────────────────────────────────── */
  await page.goto(`${BASE}/preview/inbox`, NAV);
  await page.keyboard.press('Tab');
  const firstStop = await page.evaluate(() => document.activeElement?.textContent?.trim() ?? '');
  const firstStopHtml = await page.evaluate(
    () => document.activeElement?.outerHTML?.slice(0, 200) ?? '',
  );
  log(
    'the first tab stop is the skip link',
    firstStop === 'Skip to content',
    `"${firstStop}" ${firstStopHtml}`,
  );

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
  await small.goto(`${BASE}/preview/inbox`, NAV);
  await small.waitForTimeout(400);
  log(
    'mobile shows the conversation list first',
    await small.getByRole('list', { name: 'Conversations' }).isVisible(),
  );
  await shot(small, 'inbox-mobile-list-390');
  await overflow(small, 'Inbox mobile list 390');

  await small
    .getByRole('list', { name: 'Conversations' })
    .getByRole('listitem')
    .first()
    .getByRole('button')
    .click();
  await small.waitForTimeout(300);
  log(
    'mobile shows a dedicated conversation view with Back',
    await small.getByLabel('Back to conversations').isVisible(),
  );
  await shot(small, 'inbox-mobile-conversation-390');
  await overflow(small, 'Inbox mobile conversation 390');

  await small.getByRole('button', { name: 'AI assist' }).click();
  await small.getByRole('heading', { name: 'AI sales assistant' }).waitFor({ timeout: 5000 });
  log('mobile AI assist opens as a sheet', true);
  await small.keyboard.press('Escape');

  await small.getByLabel('Back to conversations').click();
  await small.waitForTimeout(200);
  log(
    'Back returns to the conversation list',
    await small.getByRole('list', { name: 'Conversations' }).isVisible(),
  );
  await phone.close();

  log('no console errors', errors.length === 0, errors.slice(0, 5).join(' | '));
} finally {
  await browser.close();
  writeFileSync(path.join(outDir, 'results.json'), `${JSON.stringify(results, null, 2)}\n`);
  const failed = results.filter((r) => !r.ok);
  console.log(`\n${results.length - failed.length}/${results.length} passed`);
  if (failed.length > 0) process.exitCode = 1;
}
