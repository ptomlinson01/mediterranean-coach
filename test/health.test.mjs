/* Apple Watch import tests.
   Run with:  node test/health.test.mjs
   The parser and the sleep-debt maths, plus the store merge with a
   localStorage shim. The things that would quietly go wrong: a night split
   across midnight landing on the wrong day, phone and watch both logging
   the same hours and being counted twice, "Awake" being counted as sleep,
   and a typed number overwriting a real Watch night. */

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
const H = await import(base + 'health.js');
const S = await import(base + 'store.js');

let fails = 0;
const ok = (cond, msg) => { console.log((cond ? 'PASS  ' : 'FAIL  ') + msg); if (!cond) fails++; };

/* ── parsing what the Shortcut writes ─────────────────────────── */
const text = `
sleep|In Bed|2026-09-12 23:30|2026-09-13 06:45
sleep|Asleep (Core)|2026-09-12 23:41|2026-09-13 01:10
sleep|Asleep (Deep)|2026-09-13 01:10|2026-09-13 02:00
sleep|Awake|2026-09-13 02:00|2026-09-13 02:12
sleep|Asleep (REM)|2026-09-13 02:12|2026-09-13 03:30
sleep|Asleep (Core)|2026-09-13 03:30|2026-09-13 06:40
sleep|Asleep (Unspecified)|2026-09-13 00:00|2026-09-13 06:40
sleep|Asleep (Core)|2026-09-11 23:05|2026-09-12 05:35
steps|2026-09-12|6210
rhr|2026-09-12|58
workout|2026-09-12 17:10|Traditional Strength Training|38|215
workout|2026-09-12 07:00|Outdoor Walk|25|110
this is not a line
`;
const parsed = H.parseHealth(text);
ok(parsed.errors === 1, 'one junk line is counted as an error, not fatal');
ok(Object.keys(parsed.nights).sort().join(',') === '2026-09-12,2026-09-13', 'segments ending after midnight land on the morning you woke');
const n13 = parsed.nights['2026-09-13'];
ok(n13.sleepMin === 6 * 60 + 47, `overlapping phone + watch records merge to 6h 47m, not double (got ${H.fmtH(n13.sleepMin)})`);
ok(n13.inBedMin === 7 * 60 + 15, 'in-bed time comes from the In Bed record');
ok(n13.bedtime === '23:41' && n13.wake === '06:40', 'bedtime and wake come from the first and last asleep segments');
ok(n13.source === 'watch', 'a night with stages is marked as from the watch');
ok(parsed.nights['2026-09-12'].sleepMin === 390, 'the earlier night stands alone at 6h 30m');
ok(parsed.days['2026-09-12'].steps === 6210 && parsed.days['2026-09-12'].restingHR === 58, 'steps and resting HR parse per day');
const wk = parsed.days['2026-09-12'].workouts;
ok(wk.length === 2 && wk[0].type === 'strength' && wk[0].minutes === 38 && wk[0].kcal === 215 && wk[1].type === 'walk', 'workouts parse and fold into strength / walk kinds');
ok(H.workoutType('Cycling') === 'cardio' && H.workoutType('Golf') === 'sport' && H.workoutType('Functional Strength Training') === 'strength' && H.workoutType('Yoga') === 'other', 'workout names map to the four kinds');

const bare = H.parseHealth('Asleep (Core)|2026-09-13 23:00|2026-09-14 06:00');
ok(bare.nights['2026-09-14']?.sleepMin === 420, 'an unprefixed three-field line is taken as sleep');

const phoneOnly = H.parseHealth('sleep|In Bed|2026-09-13 23:00|2026-09-14 06:30');
ok(phoneOnly.nights['2026-09-14'].sleepMin === 450 && phoneOnly.nights['2026-09-14'].source === 'phone', 'a phone-only night uses in-bed as the best guess and says so');

const json = H.parseHealth(JSON.stringify({ nights: [{ date: '2026-09-13', asleepMin: 402, inBedMin: 455 }], days: [{ date: '2026-09-12', steps: 7000 }] }));
ok(json.nights['2026-09-13'].sleepMin === 402 && json.days['2026-09-12'].steps === 7000, 'the JSON contract still parses');

const locale = H.parseHealth('sleep|Asleep (Core)|Sep 12, 2026 at 11:00 PM|Sep 13, 2026 at 6:00 AM');
ok(Object.keys(locale.nights).length === 1, 'a locale-formatted date still parses');

ok(H.parseHealth('').samples === 0 && H.parseHealth('   ').samples === 0, 'empty clipboard is harmless');

/* ── sleep debt ───────────────────────────────────────────────── */
const night = m => ({ sleepMin: m });
const flat = H.sleepDebt(Array(14).fill(night(390)), 450);
ok(flat.debtMin === 14 * 60, 'an hour short every night for a fortnight reads as fourteen hours');
ok(flat.known === 14, 'all fourteen nights known');
const enough = H.sleepDebt(Array(14).fill(night(480)), 450);
ok(enough.debtMin === 0, 'sleeping past the need never produces negative debt');
const lastOnly = H.sleepDebt([night(270), ...Array(13).fill(night(450))], 450);
ok(lastOnly.debtMin === Math.round(180 * 0.15 * 14), 'last night carries 15% of the weight');
const oldOnly = H.sleepDebt([...Array(13).fill(night(450)), night(270)], 450);
ok(oldOnly.debtMin < lastOnly.debtMin, 'the oldest night counts for less than last night');
const sparse = H.sleepDebt([night(300), null, null, null, null, null, null, null, null, null, null, null, null, null], 450);
ok(sparse.known === 1 && sparse.debtMin > 0, 'missing nights are skipped and reported');

ok(H.debtBand(200).band === 'low' && H.debtBand(400).band === 'mid' && H.debtBand(700).band === 'high', 'bands at five and ten hours');

/* ── rough day ────────────────────────────────────────────────── */
ok(H.roughDay(night(340), 100)?.short === true, 'under six hours is a short night');
ok(H.roughDay(night(420), 100) === null, 'seven hours and low debt is not rough');
ok(H.roughDay(night(420), 400)?.deep === true, 'over five hours of debt is rough even after a decent night');
ok(H.roughDay(null, 100) === null, 'no data, no verdict');

/* ── the store merge ──────────────────────────────────────────── */
S.setDay('2026-09-13', { sleepMin: 300, sleepSource: 'manual', weight: 208 });
const r = S.importHealth(parsed);
ok(r.nightsIn === 2 && r.daysIn === 1, 'import reports what it merged');
const d13 = S.day('2026-09-13');
ok(d13.sleepMin === 407 && d13.sleepSource === 'watch' && d13.weight === 208, 'watch night overwrites the typed one and leaves the weigh-in alone');
const ns = S.nights('2026-09-13');
ok(ns[0].sleepMin === 407 && ns[1].sleepMin === 390 && ns[2] === null, 'nights() runs back from the given morning, unknown nights null');
ok(S.lastNight('2026-09-13').source === 'watch', 'lastNight is the morning you woke on');
ok(S.stepsOn('2026-09-12') === 6210 && S.stepsOn('2026-09-11') === null, 'steps by day, null when unknown');
S.addWorkout('2026-09-12', { type: 'strength', minutes: 20 });
S.importHealth(parsed);
const w12 = S.day('2026-09-12').workouts;
ok(w12.length === 3 && w12.filter(w => w.source === 'watch').length === 2, 're-importing replaces watch workouts and keeps typed ones');

/* ── extras and saved foods ───────────────────────────────────── */
S.addExtra('2026-09-13', { name: 'Banana, medium', unit: '1', kcal: 105, protein: 1, qty: 2 });
S.addExtra('2026-09-13', { name: 'Wine, red', unit: '5 oz glass', kcal: 125, protein: 0, qty: 1 });
const ex = S.extrasTotal('2026-09-13');
ok(ex.kcal === 335 && ex.protein === 2, 'extras total honours quantity');
S.removeExtra('2026-09-13', 0);
ok(S.extrasTotal('2026-09-13').kcal === 125, 'removing an extra takes it out of the total');
S.saveFood({ name: 'Wine, red', unit: '5 oz glass', kcal: 125, protein: 0 });
S.saveFood({ name: 'wine, RED', unit: '5 oz glass', kcal: 125, protein: 0 });
ok(S.get().saved.length === 1, 'saving the same food twice (any case) keeps one');
ok(S.recentExtras()[0].name === 'Wine, red', 'recent extras lists the latest thing logged');
S.unsaveFood('Wine, red');
ok(S.get().saved.length === 0, 'unsave removes it');
ok(S.strengthThisWeek(new Date(2026, 8, 12)) === 2, 'strength sessions this week counts typed and watch sessions in the same Sunday-to-Saturday week');

console.log(fails ? `\n${fails} check(s) failed.` : '\nAll checks passed.');
process.exit(fails ? 1 : 0);
