/* End-to-end tests in WebKit at iPhone size — the same engine Safari uses.

   Needs playwright once:   npm i -D playwright && npx playwright install webkit
   Then, from the project root:
     python -m http.server 8777 --bind 127.0.0.1 &
     node test/ui.test.mjs

   Screenshots of every screen land in test/shots/. */

import { webkit, devices } from 'playwright';

const BASE = process.env.BASE || 'http://127.0.0.1:8777';
import { mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const SHOT = join(dirname(fileURLToPath(import.meta.url)), 'shots');
mkdirSync(SHOT, { recursive: true });

const browser = await webkit.launch();
const ctx = await browser.newContext({ ...devices['iPhone 13'] });
const page = await ctx.newPage();

const errors = [];
page.on('console', m => { if (m.type() === 'error') errors.push('console: ' + m.text()); });
page.on('pageerror', e => errors.push('pageerror: ' + e.message));

const step = async (name, fn) => {
  try { await fn(); console.log('PASS  ' + name); }
  catch (e) { console.log('FAIL  ' + name + ' -> ' + e.message); errors.push(name + ': ' + e.message); }
};

await page.goto(BASE + '/index.html', { waitUntil: 'networkidle' });

await step('welcome screen renders', async () => {
  await page.waitForSelector('.ob-hero h1', { timeout: 5000 });
  const h = await page.textContent('.ob-hero h1');
  if (!/Mediterranean/.test(h)) throw new Error('title was ' + h);
});
await page.screenshot({ path: `${SHOT}/01-welcome.png` });

await step('walk through onboarding', async () => {
  await page.click('[data-next]');                       // -> about
  await page.fill('[data-field="name"]', 'Phill');
  await page.fill('[data-field="age"]', '60');
  await page.selectOption('[data-field="heightIn"]', '71');
  await page.fill('[data-field="weight"]', '212');
  await page.fill('[data-field="goalWeight"]', '187');
  await page.selectOption('[data-field="activity"]', 'light');
  await page.screenshot({ path: `${SHOT}/02-about.png` });
  await page.click('[data-next]');                       // -> work hours
  for (const [i, h] of [[0,0],[1,10],[2,9],[3,12],[4,9],[5,8],[6,2]]) {
    await page.fill(`[data-field="workHours.${i}"]`, String(h));
  }
  await page.screenshot({ path: `${SHOT}/03-hours.png` });
  await page.click('[data-next]');                       // -> kitchen
  await page.selectOption('[data-field="cookNights"]', '3');
  await page.click('.chip.kit:nth-of-type(3)');
  await page.click('[data-next]');                       // -> problems
  await page.click('[data-problem="longdays"]');
  await page.click('[data-problem="evening"]');
  await page.click('[data-problem="takeaway"]');
  await page.screenshot({ path: `${SHOT}/04-problems.png` });
  await page.click('[data-next]');                       // -> limits
  await page.fill('[data-field="dislikes"]', 'sardines');
  await page.click('[data-next]');                       // -> results
  await page.waitForSelector('.tgt.big', { timeout: 5000 });
});

const kcal = await page.textContent('.tgt.big b');
console.log(`      target shown: ${kcal} kcal`);
await page.screenshot({ path: `${SHOT}/05-targets.png`, fullPage: true });

await step('finish and land on Today', async () => {
  await page.click('[data-finish]');
  await page.waitForSelector('.meal', { timeout: 5000 });
  const meals = await page.$$('.meal');
  if (meals.length !== 4) throw new Error(`expected 4 meal cards, got ${meals.length}`);
  const bar = await page.isVisible('#tabbar');
  if (!bar) throw new Error('tab bar did not appear');
});
await page.screenshot({ path: `${SHOT}/06-today.png`, fullPage: true });

await step('mark a meal eaten updates the calorie bar', async () => {
  const before = await page.textContent('.metric b');
  await page.click('[data-eat="breakfast"]');
  await page.waitForTimeout(200);
  const after = await page.textContent('.metric b');
  if (before === after) throw new Error(`bar did not move (${before} -> ${after})`);
  console.log(`      eaten total ${before} -> ${after}`);
});

await step('change hours re-tunes the day', async () => {
  await page.click('#editHours');
  await page.waitForSelector('.hourpick', { timeout: 3000 });
  await page.screenshot({ path: `${SHOT}/07-hours-sheet.png` });
  await page.click('[data-h="14"]');
  await page.waitForTimeout(400);
  const pill = await page.textContent('.pill');
  if (!/Brutal/.test(pill)) throw new Error('day type did not flip, got ' + pill);
});
await page.screenshot({ path: `${SHOT}/08-today-brutal.png`, fullPage: true });

await step('week tab renders seven days', async () => {
  await page.click('[data-tab="week"]');
  await page.waitForSelector('.wday', { timeout: 3000 });
  const days = await page.$$('.wday');
  if (days.length !== 7) throw new Error(`got ${days.length} days`);
  const batch = await page.$$('.batch-note');
  if (batch.length !== 1) throw new Error(`expected 1 batch day, got ${batch.length}`);
});
await page.screenshot({ path: `${SHOT}/09-week.png`, fullPage: true });

await step('shopping list opens with items', async () => {
  await page.click('#shop');
  await page.waitForSelector('.aisle', { timeout: 3000 });
  const items = await page.$$('.tick');
  if (items.length < 15) throw new Error(`only ${items.length} items`);
  console.log(`      ${items.length} shopping lines`);
  await page.click('.tick input');
});
await page.screenshot({ path: `${SHOT}/10-shopping.png`, fullPage: true });
await page.click('[data-close]');

await step('recipes tab searches', async () => {
  await page.click('[data-tab="recipes"]');
  await page.waitForSelector('.rcard', { timeout: 3000 });
  const all = (await page.$$('.rcard')).length;
  await page.fill('#rq', 'chickpea');
  await page.waitForTimeout(250);
  const some = (await page.$$('.rcard')).length;
  if (!(some > 0 && some < all)) throw new Error(`search did not filter (${all} -> ${some})`);
  console.log(`      ${all} recipes, ${some} match "chickpea"`);
  await page.fill('#rq', '');
  await page.waitForTimeout(200);
});
await page.screenshot({ path: `${SHOT}/11-recipes.png`, fullPage: true });

await step('recipe sheet opens', async () => {
  await page.click('.rcard');
  await page.waitForSelector('.ing li', { timeout: 3000 });
});
await page.screenshot({ path: `${SHOT}/12-recipe.png`, fullPage: true });
await page.click('[data-close]');

await step('coach tab shows patterns and falls back to copy mode', async () => {
  await page.click('[data-tab="coach"]');
  await page.waitForSelector('.pat', { timeout: 3000 });
  const pats = (await page.$$('.pat')).length;
  if (pats < 8) throw new Error(`only ${pats} patterns`);
  await page.click('[data-pat="dinner-tonight"]');
  await page.waitForSelector('.sheet-backdrop.on', { timeout: 3000 });
  const txt = await page.textContent('.sheet-head h2');
  if (!/Two ways/.test(txt)) throw new Error('expected the no-key explainer, got ' + txt);
});
await page.screenshot({ path: `${SHOT}/13-coach.png`, fullPage: true });
await page.click('[data-close]');

await step('me tab and the context file', async () => {
  await page.click('[data-tab="me"]');
  await page.waitForSelector('.stats', { timeout: 3000 });
  await page.click('#editContext');
  await page.waitForSelector('pre.ctx', { timeout: 3000 });
  const ctxText = await page.textContent('pre.ctx');
  for (const need of ['CONTEXT FILE', 'Long days wreck the plan', 'Brutal', 'sardines']) {
    if (!ctxText.includes(need)) throw new Error(`context missing "${need}"`);
  }
  if (/undefined|NaN/.test(ctxText)) throw new Error('context contains undefined/NaN');
  console.log(`      context file is ${ctxText.length} chars and mentions the chosen problems`);
});
await page.screenshot({ path: `${SHOT}/14-context.png`, fullPage: true });
await page.click('[data-close]');

await step('state survives a reload', async () => {
  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForSelector('.meal', { timeout: 5000 });
  const name = await page.textContent('.app-header .title');
  if (name !== 'Today') throw new Error('did not resume on Today, got ' + name);
});

// Dark mode pass
const dark = await ctx.newPage();
await dark.emulateMedia({ colorScheme: 'dark' });
await dark.goto(BASE + '/index.html', { waitUntil: 'networkidle' });
await dark.waitForSelector('.meal', { timeout: 5000 });
await dark.screenshot({ path: `${SHOT}/15-dark.png`, fullPage: true });
console.log('PASS  dark mode renders');

await browser.close();

if (errors.length) {
  console.log('\nERRORS:');
  errors.forEach(e => console.log('  ' + e));
  process.exit(1);
}
console.log('\nNo console or page errors. All UI checks passed.');
