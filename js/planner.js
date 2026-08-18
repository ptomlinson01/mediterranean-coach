/* planner.js — the week.

   The idea that makes this app different from a meal-plan PDF: a week of food
   is a supply chain, not a list. The batch cook is placed on your lightest day
   and its leftovers are deliberately routed forward to your heaviest ones. That
   is the entire trick. The plan survives a 13-hour Thursday because Sunday
   already fed it.

   Nothing here needs the network or the AI. The AI reads this plan; it does not
   produce it. */

import { RECIPES, BY_ID, AISLES } from './recipes.js';
import { dayType, slotBudget, rank } from './engine.js';
import { DAY_SHORT, addDays, weekStart, key, get } from './store.js';

export const SLOTS = ['breakfast', 'lunch', 'dinner', 'snack'];
export const SLOT_LABEL = { breakfast: 'Breakfast', lunch: 'Lunch', dinner: 'Dinner', snack: 'Snack' };

/**
 * How many times one batch cook may reappear as leftovers.
 *
 * The supply-chain logic will happily route a six-serving braise across six
 * consecutive nights, which is arithmetically perfect and completely inedible —
 * "I get bored and quit" is on our own list of the things that end diets. Two
 * repeats is the limit; anything the batch makes beyond that goes in the freezer
 * for a week that has not been planned yet.
 */
const MAX_REPEATS = 2;

/* A small seeded generator, so "shuffle the week" gives a genuinely different
   week while any one generation stays reproducible. */
function rng(seed) {
  let s = (seed >>> 0) || 1;
  return () => {
    s ^= s << 13; s >>>= 0;
    s ^= s >>> 17;
    s ^= s << 5;  s >>>= 0;
    return s / 4294967296;
  };
}

function terms(text) {
  return (text || '').toLowerCase().split(/[,;\n]+/).map(t => t.trim()).filter(t => t.length > 2);
}

/** Everything the user will not or cannot eat, as lowercase substrings. */
export function exclusions(profile) {
  const s = get();
  return [...terms(profile.dislikes), ...terms(profile.allergies), ...(s.refused || [])];
}

function excluded(recipe, banned) {
  if (!banned.length) return false;
  const hay = [recipe.name, ...recipe.ing.map(i => i.n), ...recipe.tags].join(' ').toLowerCase();
  return banned.some(b => b && hay.includes(b));
}

function eligible(pool, slot, day, maxRank) {
  return pool.filter(r =>
    r.meal.includes(slot) &&
    rank(r.effort) <= maxRank &&
    r.minutes <= day.type.cookMinutes
  );
}

/**
 * Score a candidate. Lower is better.
 *   - how close it lands to the slot's calorie budget
 *   - a stiff penalty for anything eaten in the last few slots
 *   - a nudge toward protein, because that is the number people miss
 *   - a nudge toward anything the user has starred
 */
function pick(cands, budget, used, loved, rand) {
  if (!cands.length) return null;
  const recent = used.slice(-8);
  return cands
    .map(r => ({
      r,
      score: Math.abs(r.kcal - budget) / Math.max(budget, 1)
        + (recent.includes(r.id) ? 1.2 : 0)
        + used.filter(id => id === r.id).length * 0.45
        - (r.protein / 100) * 0.3
        - (loved.includes(r.id) ? 0.4 : 0)
        + rand() * 0.2
    }))
    .sort((a, b) => a.score - b.score)[0].r;
}

/**
 * Build a full week.
 * @param {object} profile  state.profile
 * @param {number} kcal     daily calorie target
 * @param {number} seed     change this to get a different week
 */
export function buildWeek(profile, kcal, seed = 1) {
  const rand = rng(seed);
  const banned = exclusions(profile);
  const loved = get().loved || [];
  const pool = RECIPES.filter(r => !excluded(r, banned));

  const start = weekStart(new Date());
  const days = [];
  for (let i = 0; i < 7; i++) {
    const date = addDays(start, i);
    const k = key(date);
    // Hours actually logged for that date win; otherwise the profile's normal
    // week. Read from the profile we were handed, never from global state — the
    // caller may be planning for a profile that has not been saved yet.
    const logged = get().log[k]?.hours;
    const hours = (logged === null || logged === undefined)
      ? (Number(profile.workHours?.[date.getDay()]) || 0)
      : logged;
    days.push({
      date: k, dow: date.getDay(), name: DAY_SHORT[date.getDay()],
      hours, type: dayType(hours), budget: slotBudget(kcal, hours),
      slots: {}, batchDay: false
    });
  }

  // 1. The batch cook lands on the lightest day of the week.
  const batchIdx = days.map((d, i) => ({ i, h: d.hours })).sort((a, b) => a.h - b.h || a.i - b.i)[0].i;
  const batchDay = days[batchIdx];
  batchDay.batchDay = true;

  const used = [];
  const leftovers = [];   // { id, meals, portions, from }

  const assign = (day, slot, recipe, isLeftover = false) => {
    day.slots[slot] = { id: recipe.id, leftover: isLeftover, portions: 1 };
    used.push(recipe.id);
  };

  // 2. Seed the batch day with a dinner batch and a lunch batch, if the day can
  //    genuinely absorb them. Someone working twelve hours every single day gets
  //    no batch cook — and the plan correctly falls back to assembly food rather
  //    than lying to them about a Sunday they do not have.
  for (const slot of ['dinner', 'lunch']) {
    const cands = eligible(pool.filter(r => r.batch && !used.includes(r.id)), slot, batchDay, rank(batchDay.type.maxEffort));
    const chosen = pick(cands, batchDay.budget[slot], used, loved, rand);
    if (chosen) {
      assign(batchDay, slot, chosen);
      leftovers.push({ id: chosen.id, meals: chosen.meal, from: batchIdx,
                       portions: Math.min(chosen.servings - 1, MAX_REPEATS),
                       freeze: Math.max(0, chosen.servings - 1 - MAX_REPEATS) });
    }
  }

  // 3. Fill the rest, hardest days first, so the worst days get first claim on
  //    the leftovers. That ordering is the whole point of cooking ahead.
  let cookNights = Math.max(0, Number(profile.cookNights) || 0);
  const order = days.map((d, i) => ({ i, h: d.hours })).sort((a, b) => b.h - a.h || a.i - b.i).map(x => x.i);

  for (const slot of SLOTS) {
    for (const di of order) {
      const day = days[di];
      if (day.slots[slot]) continue;

      // Leftovers first on any day that is not a cooking day.
      if (slot !== 'breakfast' && (day.type.key === 'normal' || day.type.key === 'long' || day.type.key === 'brutal')) {
        const lo = leftovers.find(l => l.portions > 0 && l.from < di && l.meals.includes(slot));
        if (lo && BY_ID[lo.id]) {
          lo.portions -= 1;
          assign(day, slot, BY_ID[lo.id], true);
          continue;
        }
      }

      let maxRank = rank(day.type.maxEffort);
      if (slot === 'snack') maxRank = rank('none');
      if (slot === 'breakfast') maxRank = Math.min(maxRank, rank('standard'));
      // Once the week's cooking budget is spent, dinners drop to assembly.
      if (slot === 'dinner' && cookNights <= 0) maxRank = Math.min(maxRank, rank('quick'));

      let cands = eligible(pool, slot, day, maxRank);
      // Relax rather than leave a hole: first ignore the clock, then the tier.
      if (!cands.length) cands = pool.filter(r => r.meal.includes(slot) && rank(r.effort) <= maxRank);
      if (!cands.length) cands = pool.filter(r => r.meal.includes(slot));
      if (!cands.length) continue;

      const chosen = pick(cands, day.budget[slot], used, loved, rand);
      if (!chosen) continue;

      assign(day, slot, chosen);
      if (slot === 'dinner' && rank(chosen.effort) >= rank('standard')) cookNights -= 1;
      if (chosen.batch && chosen.servings > 1 && !leftovers.some(l => l.id === chosen.id)) {
        leftovers.push({ id: chosen.id, meals: chosen.meal, from: di,
                         portions: Math.min(chosen.servings - 1, MAX_REPEATS),
                         freeze: Math.max(0, chosen.servings - 1 - MAX_REPEATS) });
      }
    }
  }

  days.forEach(d => { balance(d, kcal); });

  const freeze = leftovers.filter(l => l.freeze > 0)
    .map(l => `${BY_ID[l.id]?.name} ×${l.freeze}`);
  if (freeze.length) days[batchIdx].freeze = freeze;

  return { start: key(start), built: new Date().toISOString(), seed, kcal, days };
}

/**
 * Close the gap between what the recipes happen to weigh and what this person
 * actually needs to eat.
 *
 * Every recipe in the bank is written as one sensible plate. A 60-year-old man
 * at 210 lb needs roughly 1,900 kcal a day, and four sensible plates come to
 * about 1,450 — so without this step the plan would quietly starve him 450 kcal
 * a day below the target it just told him to eat. The honest fix is not to
 * invent bigger recipes, it is to serve more of the same food: portions move in
 * quarters, which is the smallest amount a person can actually eyeball.
 */
export function balance(day, dailyKcal) {
  const filled = SLOTS.filter(sl => day.slots[sl] && BY_ID[day.slots[sl].id]);
  if (!filled.length) { day.totals = totals(day); return day; }

  const base = filled.reduce((sum, sl) => sum + BY_ID[day.slots[sl].id].kcal, 0);
  const step = 0.25, MIN = 0.75, MAX = 2.5;

  const clampStep = v => Math.min(MAX, Math.max(MIN, Math.round(v / step) * step));
  for (const sl of filled) day.slots[sl].portions = clampStep(dailyKcal / base);

  // Nudge individual meals until the day lands close. Bigger meals get adjusted
  // first, because a quarter of a dinner is easier to serve than a quarter of a
  // snack, and because nobody wants to be told to eat 2.25 handfuls of almonds.
  const order = [...filled].sort((a, b) => BY_ID[day.slots[b].id].kcal - BY_ID[day.slots[a].id].kcal);
  const total = () => filled.reduce((sum, sl) => sum + BY_ID[day.slots[sl].id].kcal * day.slots[sl].portions, 0);

  for (let i = 0; i < 24 && Math.abs(total() - dailyKcal) > 60; i++) {
    const over = total() > dailyKcal;
    const slot = order[i % order.length];
    const next = day.slots[slot].portions + (over ? -step : step);
    if (next < MIN || next > MAX) continue;
    const before = Math.abs(total() - dailyKcal);
    day.slots[slot].portions = next;
    if (Math.abs(total() - dailyKcal) >= before) day.slots[slot].portions -= (over ? -step : step);
  }

  day.totals = totals(day);
  return day;
}

export function totals(day) {
  const t = { kcal: 0, protein: 0, carbs: 0, fat: 0, fiber: 0, minutes: 0 };
  for (const slot of SLOTS) {
    const s = day.slots[slot];
    const r = s && BY_ID[s.id];
    if (!r) continue;
    const n = s.portions || 1;
    t.kcal += Math.round(r.kcal * n); t.protein += Math.round(r.protein * n);
    t.carbs += Math.round(r.carbs * n); t.fat += Math.round(r.fat * n);
    t.fiber += Math.round(r.fiber * n);
    t.minutes += s.leftover ? 4 : r.minutes;   // reheating is not cooking
  }
  return t;
}

/** What one slot actually comes to, once its portion size is applied. */
export function served(slot) {
  const r = BY_ID[slot?.id];
  if (!r) return null;
  const n = slot.portions || 1;
  return {
    recipe: r, portions: n,
    kcal: Math.round(r.kcal * n),
    protein: Math.round(r.protein * n),
    fiber: Math.round(r.fiber * n),
    minutes: slot.leftover ? 4 : r.minutes
  };
}

/** Swap one meal for the next best thing that day can actually support. */
export function swap(plan, dayIndex, slot, profile) {
  const day = plan.days[dayIndex];
  const banned = exclusions(profile);
  const pool = RECIPES.filter(r => !excluded(r, banned));
  const current = day.slots[slot]?.id;
  const used = plan.days.flatMap(d => Object.values(d.slots).map(s => s.id));

  let maxRank = slot === 'snack' ? rank('none') : rank(day.type.maxEffort);
  let cands = eligible(pool, slot, day, maxRank).filter(r => r.id !== current);
  if (!cands.length) cands = pool.filter(r => r.meal.includes(slot) && r.id !== current);
  if (!cands.length) return null;

  const chosen = pick(cands, day.budget[slot], used, get().loved || [], Math.random);
  day.slots[slot] = { id: chosen.id, leftover: false, portions: 1 };
  balance(day, plan.kcal);
  return chosen;
}

/**
 * The day you planned as nine hours turned into fourteen. Re-tune what is left
 * of it to what is now actually possible, leaving anything already eaten alone.
 * Returns a plain-language list of what changed.
 */
export function retune(plan, dayIndex, hours, profile, alreadyEaten = []) {
  const day = plan.days[dayIndex];
  const dailyKcal = plan.kcal || Object.values(day.budget).reduce((a, b) => a + b, 0);

  day.hours = hours;
  day.type = dayType(hours);
  day.budget = slotBudget(dailyKcal, hours);

  const banned = exclusions(profile);
  const pool = RECIPES.filter(r => !excluded(r, banned));
  const used = plan.days.flatMap(d => Object.values(d.slots).map(s => s.id));
  const changed = [];

  for (const slot of SLOTS) {
    if (alreadyEaten.includes(slot)) continue;
    const cur = day.slots[slot];
    const r = cur && BY_ID[cur.id];
    if (!r) continue;
    if (cur.leftover) continue;                       // reheating always survives
    const maxRank = slot === 'snack' ? rank('none') : rank(day.type.maxEffort);
    if (rank(r.effort) <= maxRank && r.minutes <= day.type.cookMinutes) continue;

    let cands = eligible(pool, slot, day, maxRank);
    if (!cands.length) cands = pool.filter(x => x.meal.includes(slot) && rank(x.effort) <= maxRank);
    const chosen = pick(cands, day.budget[slot], used, get().loved || [], Math.random);
    if (!chosen) continue;

    day.slots[slot] = { id: chosen.id, leftover: false, portions: 1 };
    changed.push(`${SLOT_LABEL[slot]}: ${r.name} → ${chosen.name}`);
  }

  balance(day, dailyKcal);
  return changed;
}

/* ── the shopping list ─────────────────────────────────────────── */

/**
 * Aggregate ingredients for every meal actually COOKED this week. Leftovers are
 * skipped because the batch cook that produced them was already shopped for.
 */
export function groceries(plan) {
  const done = new Set();
  const lines = new Map();

  for (const day of plan.days) {
    for (const slot of SLOTS) {
      const s = day.slots[slot];
      if (!s || s.leftover) continue;
      const r = BY_ID[s.id];
      if (!r) continue;

      // A batch recipe is shopped for once, however many days it goes on to feed.
      const id = r.batch ? r.id : `${r.id}@${day.date}@${slot}`;
      if (done.has(id)) continue;
      done.add(id);

      // Buy for the portion actually being served. A batch recipe's ingredient
      // list already covers all its servings, so it is left alone — eating a
      // bigger plate on Sunday just means one fewer container in the fridge.
      const scale = r.servings === 1 ? (s.portions || 1) : 1;

      for (const item of r.ing) {
        const k = `${item.n}||${item.u}`;
        const q = item.q == null ? null : Math.round(item.q * scale * 100) / 100;
        const prev = lines.get(k);
        if (prev) prev.q = (prev.q == null || q == null) ? null : prev.q + q;
        else lines.set(k, { ...item, q });
      }
    }
  }

  const byAisle = {};
  for (const item of lines.values()) {
    const aisle = AISLES.includes(item.a) ? item.a : 'pantry';
    (byAisle[aisle] ||= []).push(item);
  }
  for (const a of Object.keys(byAisle)) byAisle[a].sort((x, y) => x.n.localeCompare(y.n));
  return byAisle;
}

const FRACTIONS = { 0.25: '¼', 0.33: '⅓', 0.5: '½', 0.67: '⅔', 0.75: '¾' };

export function qty(item) {
  if (item.q == null) return item.u;
  const q = Math.round(item.q * 100) / 100;
  const whole = Math.floor(q);
  const rem = Math.round((q - whole) * 100) / 100;
  const frac = FRACTIONS[rem];
  const num = frac ? `${whole || ''}${frac}` : String(q);
  return `${num} ${item.u}`;
}

/** The one line the Today screen leads with. */
export function headline(day) {
  if (day.batchDay) return 'Batch-cook day — this is the hour that carries the week.';
  return day.type.rule;
}

/** What to put in the freezer after the batch cook, if anything is spare. */
export function freezerNote(day) {
  if (!day.freeze?.length) return null;
  return `Freeze the spare portions — ${day.freeze.join(', ')}. They are next month's bad Tuesday.`;
}
