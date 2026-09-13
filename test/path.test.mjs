/* Path (questionnaire) regression tests.
   Run with:  node test/path.test.mjs
   Pure module, no browser, no localStorage. These assert the things that would
   quietly embarrass the app: a bedtime after midnight breaking the clock, a
   training slot landing in the slump without being told, the kitchen closing
   after bedtime, or a coach never hearing about the waist. */

import { pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const base = pathToFileURL(join(dirname(fileURLToPath(import.meta.url)), '..', 'js') + '/').href;
const P = await import(base + 'path.js');

let fails = 0;
const ok = (cond, msg) => { console.log((cond ? 'PASS  ' : 'FAIL  ') + msg); if (!cond) fails++; };

const answers = (over = {}) => ({
  ...P.blankAnswers(),
  wakeWork: '06:00', bedWork: '23:30', freeWake: '6-7', alarm: 'never', morning: 'groggy', lastHour: 'screen',
  sharpest: 'mid', dip: '14', hungry: 'evening',
  fitNow: 'walk', fitWould: ['home', 'walk'], fitMin: '30', fitWhen: 'after',
  breakfast: 'coffee', bigMeal: 'either', repeat: ['eggs', 'chicken'], alcohol: 'nightly1',
  ...over
});

/* ── completeness ────────────────────────────────────────────── */
ok(P.derivePath(P.blankAnswers()) === null, 'blank answers produce no path');
ok(P.derivePath(null) === null, 'null answers produce no path');
ok(P.complete(answers({ repeat: [], fitWould: [] })), 'empty multi-selects still count as complete');

/* ── the clock ───────────────────────────────────────────────── */
ok(P.clock(0) === '12am' && P.clock(720) === '12pm' && P.clock(390) === '6:30am' && P.clock(1350) === '10:30pm', 'clock formats the way people say it');
ok(P.clock(1500) === '1am' && P.clock(-90) === '10:30pm', 'clock wraps past midnight in both directions');

/* ── a 6am riser, short on sleep ─────────────────────────────── */
const p = P.derivePath(answers(), { sleepNeedMin: 450 });
ok(p !== null, 'complete answers produce a path');
ok(p.sleep.sleepLever === true, 'six and a half hours in bed + never waking before the alarm flags sleep as the lever');
ok(P.clock(p.sleep.bed) === '10:30pm', 'bedtime = wake minus need (6am, 7.5h -> 10:30pm)');
ok(p.sleep.kitchenCloses === p.sleep.bed - 150, 'kitchen closes two and a half hours before bed');
ok(p.sleep.windDown > p.sleep.kitchenCloses && p.sleep.windDown < p.sleep.bed, 'wind-down sits between kitchen-closed and bed');
ok(p.sleep.lastCoffee < p.energy.dip[0], 'last coffee is before the slump');
ok(p.fitness.strengthSessions === 2, 'a walker gets two strength sessions, not three');
ok(p.fitness.energyFit === 'peak', 'straight-after-work training lands in the second wind');
ok(p.food.bigMeal === 'lunch', 'hungriest in the evening + no preference -> lunch is the big meal');
ok(/Protein within 90 minutes/.test(p.food.notes[0]), 'coffee-only breakfast + evening hunger -> protein breakfast rule');
ok(p.food.anchors.includes('eggs') && p.food.anchors.includes('chicken'), 'anchor proteins carried through');
ok(/Three dry nights/.test(p.food.notes.at(-1)), 'one-most-nights drinker gets the three-dry-nights rule');
ok(p.schedule.length === 8, 'the day comes in eight ordered windows');
ok(p.schedule.every((b, i, arr) => i === 0 || b.at[0] >= arr[i - 1].at[0]), 'the day is in chronological order');
ok(/Training/.test(p.schedule.find(b => b.label === 'Second wind').do), 'training is placed inside the second wind on the day plan');

/* ── an owl whose bedtime is after midnight ──────────────────── */
const owl = P.derivePath(answers({ wakeWork: '08:30', bedWork: '01:00', freeWake: '8+', sharpest: 'eve', alarm: 'usually', morning: 'groggy', fitWhen: 'evening' }), { sleepNeedMin: 450 });
ok(owl.chronotype === 'owl', 'late free wake + evening sharpness scores as an owl');
ok(owl.sleep.bed > 1440 && P.clock(owl.sleep.bed) === '1am', 'bedtime after midnight stays on the wake-relative timeline and prints as 1am');
ok(owl.energy.eveningPeak[1] <= owl.sleep.windDown, 'the second wind never runs into the wind-down');
ok(owl.fitness.energyFit === 'peak', 'an owl training in the evening is in a peak');
ok(owl.fitness.trainWindow[0] >= owl.energy.eveningPeak[0], 'evening training starts no earlier than the second wind');

/* ── a lark training before work ─────────────────────────────── */
const lark = P.derivePath(answers({ wakeWork: '05:00', bedWork: '21:30', freeWake: '<6', sharpest: 'early', morning: 'sharp', alarm: 'usually', fitWhen: 'before', fitNow: 'both', fitMin: '45', fitWould: ['gym', 'bike'] }), { sleepNeedMin: 450 });
ok(lark.chronotype === 'lark', 'early free wake + sharp mornings scores as a lark');
ok(lark.sleep.sleepLever === false, 'eight hours in bed and waking before the alarm: sleep is not the lever');
ok(lark.fitness.strengthSessions === 3, 'someone already lifting with 45 minutes and a gym gets three sessions');
ok(lark.fitness.trainWindow[0] >= lark.energy.grog[1], 'before-work training never starts in the grogginess zone');
ok(lark.fitness.stepTarget === 10000, 'lifting and cardio -> 10k step floor');
ok(/second wind on the days it is free|Strength is easiest/.test(lark.fitness.notes[1]), 'a flat-energy slot gets the honest note about where strength is easiest');

/* ── lunchtime training sits at the tail of the morning peak ─── */
const lunch = P.derivePath(answers({ wakeWork: '07:30', dip: '13', fitWhen: 'lunch' }), { sleepNeedMin: 450 });
ok(lunch.fitness.energyFit === 'peak', 'a 7:30 riser training at noon is still inside the morning peak');
ok(lunch.fitness.trainWindow[1] <= lunch.energy.dip[0], 'the lunchtime session finishes before a 1pm slump begins');
ok(/Training at the end of this/.test(lunch.schedule.find(b => b.label === 'Morning peak').do), 'the day plan places lunchtime training at the end of the morning peak');

/* ── the markdown the coach reads ────────────────────────────── */
const md = P.pathMarkdown(p);
ok(/SLEEP IS THE PRIMARY LEVER/.test(md), 'context markdown flags the sleep lever in a way the model cannot miss');
ok(/Kitchen closes 8pm/.test(md), 'context markdown carries the kitchen-closes time');
ok(/The day in order/.test(md) && md.split('\n').filter(l => l.startsWith('  - ')).length === 8, 'context markdown carries all eight windows of the day');

/* ── sleep need from the profile moves everything ────────────── */
const eight = P.derivePath(answers(), { sleepNeedMin: 480 });
ok(eight.sleep.bed === p.sleep.bed - 30 && eight.sleep.kitchenCloses === p.sleep.kitchenCloses - 30, 'a longer sleep need pulls bedtime and kitchen-closes earlier together');

console.log(fails ? `\n${fails} check(s) failed.` : '\nAll checks passed.');
process.exit(fails ? 1 : 0);
