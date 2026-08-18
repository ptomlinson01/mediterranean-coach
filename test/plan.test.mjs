/* Planning-engine regression tests.
   Run with:  node test/plan.test.mjs
   No browser, no dependencies — the modules are loaded straight into Node with
   a localStorage shim standing in for the phone. */
const mem = new Map();
globalThis.localStorage = {
  getItem: k => (mem.has(k) ? mem.get(k) : null),
  setItem: (k, v) => mem.set(k, String(v)),
  removeItem: k => mem.delete(k)
};

import { pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const base = pathToFileURL(join(dirname(fileURLToPath(import.meta.url)), '..', 'js') + '/').href;
const S = await import(base + 'store.js');
const E = await import(base + 'engine.js');
const R = await import(base + 'recipes.js');
const P = await import(base + 'planner.js');
const C = await import(base + 'context.js');

let fails = 0;
const ok = (cond, msg) => { console.log((cond ? 'PASS  ' : 'FAIL  ') + msg); if (!cond) fails++; };

/* ── profile: 60yo man, 210 lb, wants 185, works long weekdays ── */
S.set(st => {
  Object.assign(st.profile, {
    name: 'Test', age: 60, sex: 'male', heightIn: 70,
    startWeight: 210, weight: 210, goalWeight: 185,
    activity: 'light', rate: 1.0,
    workHours: [0, 11, 9, 13, 9, 8, 2],   // Wed is brutal, Sun is free
    cookNights: 3, dislikes: 'sardines', allergies: ''
  });
  st.telos.problems = ['longdays', 'evening'];
  st.onboarded = true;
});

const p = S.get().profile;
const t = E.targets(p);
console.log(`\ntargets: ${t.kcal} kcal, ${t.protein}g protein, ${t.fat}g fat, ${t.carbs}g carbs, rate ${t.rate} lb/wk, ${t.weeks} weeks`);
ok(t.kcal > 1550 && t.kcal < 2400, 'calorie target is in a sane range');
ok(t.maintenance > t.kcal, 'target is below maintenance');
ok(t.protein >= 110 && t.protein <= 160, `protein target high for age (${t.protein}g)`);
ok(Math.abs((t.protein * 4 + t.fat * 9 + t.carbs * 4) - t.kcal) < 30, 'macros add up to the calorie target');
ok(t.rate <= 1.0 + 1e-9, 'rate never exceeds what was asked');

// A 1.5 lb/wk request on a modest TDEE must be capped.
S.set(st => { st.profile.rate = 1.5; });
const fast = E.targets(S.get().profile);
ok(fast.capped, 'aggressive rate gets capped');
ok(fast.kcal >= Math.round(fast.maintenance * 0.78) - 12, 'cap holds the deficit at ~22%');
S.set(st => { st.profile.rate = 1.0; });

/* ── the week ─────────────────────────────────────────────────── */
const plan = P.buildWeek(S.get().profile, t.kcal, 42);
S.set(st => { st.plan = plan; });

ok(plan.days.length === 7, 'seven days built');

let holes = 0, effortViolations = 0, dislikeLeaks = 0;
for (const d of plan.days) {
  for (const slot of P.SLOTS) {
    const s = d.slots[slot];
    if (!s) { holes++; continue; }
    const r = R.BY_ID[s.id];
    if (!r) { holes++; continue; }
    if (!s.leftover && E.rank(r.effort) > E.rank(d.type.maxEffort)) {
      effortViolations++;
      console.log(`   ! ${d.name} ${slot}: ${r.name} (${r.effort}) on a ${d.type.label} (max ${d.type.maxEffort})`);
    }
    if (/sardine/i.test(r.name)) dislikeLeaks++;
  }
}
ok(holes === 0, 'no empty meal slots anywhere in the week');
ok(effortViolations === 0, 'no meal exceeds its day\'s effort ceiling');
ok(dislikeLeaks === 0, 'disliked food filtered out of the plan');

const batch = plan.days.filter(d => d.batchDay);
ok(batch.length === 1, 'exactly one batch day');
ok(batch[0].hours === Math.min(...plan.days.map(d => d.hours)), `batch day is the lightest day (${batch[0].name}, ${batch[0].hours}h)`);

const leftoverDays = plan.days.filter(d => Object.values(d.slots).some(s => s.leftover));
ok(leftoverDays.length > 0, `leftovers routed forward (${leftoverDays.map(d => d.name).join(', ')})`);

const brutal = plan.days.find(d => d.type.key === 'brutal');
if (brutal) {
  const dinner = R.BY_ID[brutal.slots.dinner.id];
  const isEasy = brutal.slots.dinner.leftover || dinner.effort === 'none';
  ok(isEasy, `13-hour day gets no cooking (${dinner.name}${brutal.slots.dinner.leftover ? ', leftovers' : ''})`);
}

console.log('\nweek shape:');
for (const d of plan.days) {
  console.log(`  ${d.name} ${String(d.hours).padStart(2)}h ${d.type.label.padEnd(11)} ${String(d.totals.kcal).padStart(4)}kcal P${String(d.totals.protein).padStart(3)} ${String(d.totals.minutes).padStart(3)}min${d.batchDay ? '  <- BATCH' : ''}`);
}

const portions = plan.days.flatMap(d => P.SLOTS.map(sl => d.slots[sl]?.portions).filter(Boolean));
console.log(`portion sizes in use: ${[...new Set(portions)].sort((a,b)=>a-b).join(', ')}`);
ok(portions.every(n => n >= 0.75 && n <= 2.5 && Math.abs(n * 4 - Math.round(n * 4)) < 1e-9),
  'every portion is a sane quarter-step multiple');

const kcals = plan.days.map(d => d.totals.kcal);
ok(Math.min(...kcals) > t.kcal * 0.9 && Math.max(...kcals) < t.kcal * 1.1,
  `every day lands within 10% of the target (${Math.min(...kcals)}-${Math.max(...kcals)} vs ${t.kcal})`);
ok(Math.min(...kcals) >= 1550, `no day drops under the safety floor (lowest ${Math.min(...kcals)})`);
const proteins = plan.days.map(d => d.totals.protein);
ok(Math.min(...proteins) > t.protein * 0.75, `protein stays near target (low day ${Math.min(...proteins)}g vs ${t.protein}g)`);

/* ── variety: nobody eats the same dinner six nights running ───── */
for (const slot of ['lunch', 'dinner']) {
  const names = plan.days.map(d => R.BY_ID[d.slots[slot]?.id]?.name).filter(Boolean);
  const counts = {};
  names.forEach(n => { counts[n] = (counts[n] || 0) + 1; });
  const worst = Object.entries(counts).sort((a, b) => b[1] - a[1])[0];
  ok(worst[1] <= 3, `${slot}: nothing appears more than 3x a week (worst: ${worst[0]} x${worst[1]})`);
  ok(new Set(names).size >= 4, `${slot}: at least 4 distinct meals a week (${new Set(names).size})`);
}

// Someone who works 12h every weekday must still get a varied, cookable week.
const grind = { ...S.get().profile, workHours: [8, 12, 12, 12, 12, 12, 8], cookNights: 1 };
const gp = P.buildWeek(grind, t.kcal, 7);
const gDinners = gp.days.map(d => R.BY_ID[d.slots.dinner.id]?.name);
ok(new Set(gDinners).size >= 3, `12h-a-day week still gets ${new Set(gDinners).size} distinct dinners`);
ok(gp.days.every(d => {
  const sl = d.slots.dinner;
  return sl.leftover || E.rank(R.BY_ID[sl.id].effort) <= E.rank(d.type.maxEffort);
}), 'grind week never asks for cooking it does not have time for');
console.log('   grind-week dinners: ' + gDinners.join(' | '));

/* ── groceries ────────────────────────────────────────────────── */
const g = P.groceries(plan);
const aisles = Object.keys(g);
const itemCount = Object.values(g).flat().length;
console.log(`\ngroceries: ${itemCount} lines across ${aisles.join(', ')}`);
ok(itemCount > 15, 'shopping list is populated');
ok(aisles.every(a => R.AISLES.includes(a)), 'every aisle is a known aisle');
ok(Object.values(g).flat().every(i => typeof P.qty(i) === 'string' && !/undefined|NaN/.test(P.qty(i))), 'quantities format cleanly');

/* ── retune: the day blows up ─────────────────────────────────── */
const sundayIdx = 0;
const before = P.SLOTS.map(sl => R.BY_ID[plan.days[sundayIdx].slots[sl]?.id]?.name);
const changed = P.retune(plan, sundayIdx, 14, S.get().profile, ['breakfast']);
const after = P.SLOTS.map(sl => R.BY_ID[plan.days[sundayIdx].slots[sl]?.id]?.name);
console.log(`\nretune Sunday 0h -> 14h: ${changed.length} meals changed`);
ok(plan.days[sundayIdx].type.key === 'brutal', 'day type flips to brutal');
ok(before[0] === after[0], 'an already-eaten meal is left alone');
ok(P.SLOTS.filter(sl => sl !== 'breakfast').every(sl => {
  const s = plan.days[sundayIdx].slots[sl];
  return s.leftover || E.rank(R.BY_ID[s.id].effort) <= E.rank('none');
}), 'after retune nothing left to eat needs cooking');
ok(Math.abs(plan.days[sundayIdx].totals.kcal - t.kcal) < 200, 'retuned day still hits the calorie target');

/* ── context file ─────────────────────────────────────────────── */
S.setDay(S.key(), { weight: 208.5, ate: { breakfast: true } });
const ctx = C.buildContext();
const needs = ['# CONTEXT FILE', '## Mission', '## Problems in the way', '## Targets', '## Work, which drives everything', "### Today's planned meals", '## Constraints', '## The full week as planned'];
ok(needs.every(n => ctx.includes(n)), 'context file has every section');
ok(ctx.includes('Long days wreck the plan'), 'chosen problems appear in the context');
ok(!ctx.includes('undefined') && !ctx.includes('NaN'), 'no undefined/NaN leaks into the context');
ok(C.systemPrompt().includes(R.RECIPES[0].id), 'system prompt carries the recipe index');
console.log(`\ncontext file: ${ctx.length} chars, system prompt ${C.systemPrompt().length} chars (~${Math.round(C.systemPrompt().length / 3.6)} tokens)`);

/* ── plain-groceries guarantee ─────────────────────────────────── */
const BRITISH = /courgette|aubergine|\brocket\b|tinned|wholemeal|passata|\bmince\b|crispbread|caster|rasher/i;
const SPECIALTY = /farro|orzo|puy|harissa|tahini|za'?atar|miso paste|anchov|caper|sumac|freekeh|bulgur|pancetta|halloumi|labneh/i;

const offenders = [];
for (const r of R.RECIPES) {
  const text = [r.name, ...r.ing.map(i => i.n), ...r.steps].join(' | ');
  if (BRITISH.test(text)) offenders.push(`${r.id}: British term -> ${text.match(BRITISH)[0]}`);
  if (SPECIALTY.test(text)) offenders.push(`${r.id}: specialty item -> ${text.match(SPECIALTY)[0]}`);
}
ok(offenders.length === 0, `every ingredient is a normal US supermarket item${offenders.length ? '\n   ' + offenders.join('\n   ') : ''}`);

const proteinSources = { chicken: /chicken/i, 'ground beef/turkey': /ground (beef|turkey)/i, eggs: /\beggs?\b/i,
                   tuna: /tuna/i, salmon: /salmon/i, shrimp: /shrimp/i, pork: /pork/i, sushi: /sushi|poke/i };
for (const [label, re] of Object.entries(proteinSources)) {
  const n = R.RECIPES.filter(r => r.ing.some(i => re.test(i.n))).length;
  ok(n >= 1, `${label}: appears in ${n} recipes`);
}

/* ── the operator's actual constraints ─────────────────────────── */
const rawTomato = R.RECIPES.filter(r =>
  r.ing.some(i => /tomato/i.test(i.n) && !/canned|paste|marinara|salsa|sauce/i.test(i.n)));
ok(rawTomato.length === 0, `no recipe serves a raw tomato${rawTomato.length ? ' -> ' + rawTomato.map(r => r.id).join(', ') : ' (cooked and canned still fine)'}`);

ok(!R.RECIPES.some(r => /pork loin/i.test(r.name) || r.ing.some(i => /pork loin/i.test(i.n))), 'no pork loin anywhere');
ok(R.RECIPES.some(r => r.ing.some(i => /pork chop/i.test(i.n))), 'pork chops still in');

const cottage = R.RECIPES.filter(r => r.ing.some(i => /cottage cheese/i.test(i.n)));
ok(cottage.every(r => r.meal.length === 1 && r.meal[0] === 'snack'), `cottage cheese is snack-only (${cottage.length} recipe)`);
ok(!cottage.some(r => r.ing.some(i => /tomato/i.test(i.n))), 'cottage cheese never paired with tomatoes');

ok(R.RECIPES.filter(r => r.ing.some(i => /refried/i.test(i.n))).length >= 3, 'refried beans used in at least 3 recipes');
ok(R.RECIPES.filter(r => r.ing.some(i => /rotisserie/i.test(i.n))).length >= 4, 'rotisserie chicken used in at least 4 recipes');

/* ── equipment gating: the kitchen answer must actually matter ──── */
const noBlender = R.RECIPES.filter(r => r.needs?.includes('blender'));
ok(noBlender.length === 0, 'nothing requires a blender');

// A kitchen with no oven must never be handed an oven recipe.
S.set(st => { st.profile.kitchen = ['stovetop', 'microwave']; });
const stovetopOnly = P.buildWeek(S.get().profile, t.kcal, 11);
const ovenLeaks = [];
for (const d of stovetopOnly.days) {
  for (const slot of P.SLOTS) {
    const r = R.BY_ID[d.slots[slot]?.id];
    if (r?.needs?.includes('oven')) ovenLeaks.push(`${d.name} ${slot}: ${r.name}`);
  }
}
ok(ovenLeaks.length === 0, `a stovetop-only kitchen is never given an oven recipe${ovenLeaks.length ? '\n   ' + ovenLeaks.join('\n   ') : ''}`);
ok(P.SLOTS.every(sl => stovetopOnly.days.every(d => d.slots[sl])), 'stovetop-only week still fills every slot');
S.set(st => { st.profile.kitchen = ['stovetop', 'oven']; });

/* ── recipe data integrity ────────────────────────────────────── */
let bad = [];
for (const r of R.RECIPES) {
  const calc = r.protein * 4 + r.carbs * 4 + r.fat * 9;
  if (Math.abs(calc - r.kcal) > r.kcal * 0.12) bad.push(`${r.id}: stated ${r.kcal}, macros imply ${calc}`);
  if (!r.ing.every(i => R.AISLES.includes(i.a))) bad.push(`${r.id}: bad aisle`);
  if (!r.steps.length) bad.push(`${r.id}: no method`);
  if (!r.meal.length) bad.push(`${r.id}: no meal slot`);
}
ok(bad.length === 0, `all ${R.RECIPES.length} recipes internally consistent${bad.length ? '\n   ' + bad.join('\n   ') : ''}`);

for (const slot of P.SLOTS) {
  const n = R.RECIPES.filter(r => r.meal.includes(slot)).length;
  const noCook = R.RECIPES.filter(r => r.meal.includes(slot) && r.effort === 'none').length;
  ok(noCook >= 2, `${slot}: ${n} recipes, ${noCook} need no cooking (enough for a brutal day)`);
}

console.log(fails ? `\n${fails} FAILURES` : '\nAll checks passed.');
process.exit(fails ? 1 : 0);
