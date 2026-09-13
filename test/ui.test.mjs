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
  if (!/Plate/.test(h)) throw new Error('title was ' + h);
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
  await page.click('[data-next]');                       // -> questionnaire: sleep
  await page.waitForSelector('[data-section="sleep"]');
});

await step('questionnaire refuses to advance with a question unanswered', async () => {
  await page.click('[data-next]');
  await page.waitForTimeout(150);
  if (!(await page.isVisible('[data-section="sleep"]'))) throw new Error('advanced past an unanswered section');
});

await step('questionnaire: one tap per question, four pages', async () => {
  const pick = async (id, v) => page.click(`.chip.q[data-qid="${id}"][data-v="${v}"]`);
  await page.fill('input[data-q="wakeWork"]', '06:00');
  await page.fill('input[data-q="bedWork"]', '23:30');
  await pick('freeWake', '6-7'); await pick('alarm', 'never'); await pick('morning', 'groggy'); await pick('lastHour', 'screen');
  await page.screenshot({ path: `${SHOT}/04b-q-sleep.png`, fullPage: true });
  await page.click('[data-next]');                       // -> energy
  await page.waitForSelector('[data-section="energy"]');
  await pick('sharpest', 'mid'); await pick('dip', '14'); await pick('hungry', 'evening');
  await page.click('[data-next]');                       // -> fitness
  await page.waitForSelector('[data-section="fitness"]');
  await pick('fitNow', 'walk'); await pick('fitWould', 'home'); await pick('fitWould', 'walk');
  await pick('fitMin', '30'); await pick('fitWhen', 'after');
  await page.click('[data-next]');                       // -> food
  await page.waitForSelector('[data-section="food"]');
  await pick('breakfast', 'coffee'); await pick('bigMeal', 'either');
  await pick('repeat', 'eggs'); await pick('repeat', 'chicken'); await pick('alcohol', 'nightly1');
  await page.click('[data-next]');                       // -> your path
  await page.waitForSelector('.path-headline', { timeout: 5000 });
  const head = await page.textContent('.path-headline');
  if (!/6am/.test(head)) throw new Error(`path headline did not carry the wake time: ${head}`);
  const windows = await page.$$('.dayplan li');
  if (windows.length !== 8) throw new Error(`expected 8 windows in the day plan, got ${windows.length}`);
  await page.screenshot({ path: `${SHOT}/04c-path.png`, fullPage: true });
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

await step('today: week strip, briefing, and the morning check-in', async () => {
  const days = await page.$$('.dayb');
  if (days.length !== 7) throw new Error(`expected 7 day bubbles, got ${days.length}`);
  const first = await page.textContent('.dayb:first-child span');
  if (first !== 'Mon') throw new Error(`week should start Monday, got ${first}`);
  if (!(await page.isVisible('.dayb.today'))) throw new Error('today is not marked in the strip');
  const nowLabel = await page.textContent('.now-label');
  if (!/Now/.test(nowLabel)) throw new Error('the "now" window is missing from the briefing');
  await page.fill('#wtInput', '208');
  await page.fill('#slInput', '6.5');
  await page.fill('#waistInput', '42.5');
  await page.click('#ciSave');
  await page.waitForTimeout(250);
  const sum = await page.textContent('.ci-sum');
  if (!/208 lb/.test(sum) || !/6h 30m/.test(sum) || !/42.5/.test(sum)) throw new Error(`check-in did not collapse to a summary: ${sum}`);
  const chip = await page.textContent('#logSleepBtn');
  if (!/Slept 6h 30m/.test(chip)) throw new Error(`sleep chip wrong: ${chip}`);
  await page.screenshot({ path: `${SHOT}/06b-today-checked-in.png`, fullPage: true });
});

await step('the + button: food database search logs a banana', async () => {
  const before = Number(await page.textContent('.metric b'));
  await page.click('#addBtn');
  await page.waitForSelector('[data-mode="search"]');
  await page.screenshot({ path: `${SHOT}/06c-add-sheet.png` });
  await page.click('[data-mode="search"]');
  await page.fill('#foodQ', 'banana');
  await page.waitForSelector('[data-food]');
  await page.click('[data-food="0"]');
  await page.waitForSelector('#cfAdd');
  await page.click('#cfSave');
  await page.waitForSelector('#cfSave');
  await page.click('#cfAdd');
  await page.waitForTimeout(250);
  const after = Number(await page.textContent('.metric b'));
  if (after - before !== 105) throw new Error(`banana should add 105 kcal, bar moved ${before} -> ${after}`);
  const also = await page.textContent('.also b');
  if (!/Banana/.test(also)) throw new Error('Also logged does not list the banana');
});

await step('the + button: saved foods and exercise', async () => {
  await page.click('#addBtn');
  await page.click('[data-mode="saved"]');
  await page.waitForSelector('[data-food="0"]');
  const savedName = await page.textContent('[data-food="0"] b');
  if (!/Banana/.test(savedName)) throw new Error('saved banana not listed');
  await page.click('#addBack');
  await page.click('[data-mode="exercise"]');
  await page.fill('#exMin', '30');
  await page.click('#exSave');
  await page.waitForTimeout(250);
  const rows = await page.$$eval('.also b', els => els.map(e => e.textContent));
  if (!rows.some(t => /Strength/.test(t))) throw new Error(`exercise not in Also logged: ${rows}`);
});

await step('mark a meal eaten updates the calorie bar', async () => {
  const before = await page.textContent('.metric b');
  await page.click('[data-eat="breakfast"]');
  await page.waitForTimeout(200);
  const after = await page.textContent('.metric b');
  if (before === after) throw new Error(`bar did not move (${before} -> ${after})`);
  console.log(`      eaten total ${before} -> ${after}`);
  if (!(await page.isVisible('.dayb.today.full'))) throw new Error('today should turn green at two meals (breakfast + the banana)');
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
  await page.fill('#rq', 'chicken');
  await page.waitForTimeout(250);
  const some = (await page.$$('.rcard')).length;
  if (!(some > 0 && some < all)) throw new Error(`search did not filter (${all} -> ${some})`);
  console.log(`      ${all} recipes, ${some} match "chicken"`);
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
  await page.waitForSelector('#myPath');
  const row = await page.textContent('#myPath');
  if (!/sleep/.test(row)) throw new Error('My path row does not show as taken');
  await page.click('#myPath');
  await page.waitForSelector('#retakePath');
  await page.screenshot({ path: `${SHOT}/09b-my-path.png`, fullPage: true });
  await page.click('[data-close]');
  await page.waitForTimeout(200);
  await page.waitForSelector('.stats', { timeout: 3000 });
  await page.click('#editContext');
  await page.waitForSelector('pre.ctx', { timeout: 3000 });
  const ctxText = await page.textContent('pre.ctx');
  for (const need of ['CONTEXT FILE', 'Long days wreck the plan', 'Brutal', 'sardines', 'Their path', 'Kitchen closes 8pm', 'Waist at the navel: 42.5', 'The day in order', 'Last night: 6h 30m', 'Banana', 'Strength sessions this week (since Sunday): 1']) {
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
