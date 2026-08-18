/* engine.js — the numbers.

   Two models live here and nothing else:

   1. ENERGY   Mifflin-St Jeor BMR -> TDEE -> a deliberately moderate deficit,
               with protein floored high. Past 55 the failure mode of a diet is
               not "didn't lose weight", it is "lost ten pounds of muscle along
               with the fat and got weaker". Every default below is tuned for
               that, not for the fastest possible number on the scale.

   2. TIME     How many hours you work on a given day decides what you can
               realistically cook that night. That single input drives recipe
               eligibility, the calorie split across meals, and where the
               batch cook lands in the week.
*/

/* ── energy ────────────────────────────────────────────────────── */

export const ACTIVITY = {
  sedentary: { mult: 1.20,  label: 'Sedentary',  hint: 'Desk job, little deliberate walking' },
  light:     { mult: 1.375, label: 'Light',      hint: 'Some walking, 1–2 sessions a week' },
  moderate:  { mult: 1.55,  label: 'Moderate',   hint: 'On your feet, or 3–4 sessions a week' },
  active:    { mult: 1.725, label: 'Active',     hint: 'Physical work, or 5+ sessions a week' }
};

const LB_PER_KG   = 2.20462;
const KCAL_PER_LB = 3500;

export const lbToKg = lb => lb / LB_PER_KG;

export function bmr({ sex, age, heightIn, weight }) {
  const base = 10 * lbToKg(weight) + 6.25 * (heightIn * 2.54) - 5 * age;
  return Math.round(sex === 'female' ? base - 161 : base + 5);
}

export function tdee(p) {
  return Math.round(bmr({ sex: p.sex, age: p.age, heightIn: p.heightIn, weight: p.weight })
    * (ACTIVITY[p.activity]?.mult ?? 1.375));
}

/**
 * Daily targets, plus the reasoning behind them. A target you don't understand
 * is a target you quit in week three, so every number comes back with a plain
 * English `why` that the app shows and the AI coach can quote.
 */
export function targets(p) {
  const maintenance = tdee(p);

  const askedDeficit = (p.rate || 1) * KCAL_PER_LB / 7;
  // Never cut more than 22% below maintenance. Deeper cuts at this age cost
  // lean mass and energy, and adherence falls off a cliff.
  const cap = maintenance * 0.22;
  const floor = p.sex === 'female' ? 1300 : 1550;

  let capped = false, floored = false;
  let deficit = askedDeficit;
  if (deficit > cap) { deficit = cap; capped = true; }

  let kcal = Math.round((maintenance - deficit) / 10) * 10;
  if (kcal < floor) { kcal = floor; floored = true; }

  const realDeficit = maintenance - kcal;
  const realRate = Math.round(((realDeficit * 7) / KCAL_PER_LB) * 100) / 100;

  // Protein at 1.6 g per kg of GOAL weight. This is the most important number
  // on the page: it decides whether the weight you lose is fat or muscle.
  const proteinIdeal = Math.round(lbToKg(p.goalWeight) * 1.6);
  const proteinCeil  = Math.round((kcal * 0.40) / 4);
  const protein = Math.min(proteinIdeal, proteinCeil);

  // Fat at 35%. Mediterranean eating runs on olive oil, nuts and fish —
  // cutting fat here would turn it into a different diet entirely.
  const fat = Math.round((kcal * 0.35) / 9);
  const carbs = Math.max(0, Math.round((kcal - protein * 4 - fat * 9) / 4));
  const fiber = p.sex === 'female' ? 28 : 34;

  const toLose = Math.max(0, Math.round((p.weight - p.goalWeight) * 10) / 10);
  const weeks = realRate > 0 ? Math.ceil(toLose / realRate) : null;
  const goalDate = weeks ? addWeeks(new Date(), weeks) : null;

  return {
    maintenance, kcal, protein, carbs, fat, fiber,
    deficit: Math.round(realDeficit), rate: realRate,
    capped, floored, proteinIdeal, toLose, weeks, goalDate,
    why: {
      kcal: capped
        ? `Capped at a 22% cut below your ${maintenance} kcal maintenance. You asked for ${p.rate} lb a week; ${realRate} lb a week is the fastest that is worth doing at your age.`
        : `${maintenance} kcal maintenance minus a ${Math.round(realDeficit)} kcal deficit — about ${realRate} lb a week.`,
      protein: protein < proteinIdeal
        ? `Held at ${protein} g because that is already 40% of your calories. Ideal would be ${proteinIdeal} g.`
        : '1.6 g per kg of your goal weight. This is what protects muscle while you lose fat — treat it as a floor, not a target.',
      fat: 'About 35% of calories. Olive oil, nuts, olives and oily fish are the point of this way of eating, not a compromise.',
      fiber: `${fiber} g. Legumes, vegetables and whole grains — also most of the reason this pattern helps blood pressure and cholesterol.`
    }
  };
}

function addWeeks(d, w) {
  const x = new Date(d);
  x.setDate(x.getDate() + w * 7);
  return x;
}

/** Shown once during onboarding for context, and never nagged about again. */
export function bmi(weight, heightIn) {
  return Math.round((703 * weight / (heightIn * heightIn)) * 10) / 10;
}

/* ── time ──────────────────────────────────────────────────────── */

/**
 * Day archetypes, keyed off hours worked.
 *
 * `maxEffort` is a hard gate on which recipes a day may be assigned.
 * `split` moves calories toward the middle of the day as the day gets longer —
 * a long shift needs a bigger lunch and a planned late-afternoon snack, because
 * the meal that actually derails people is the one eaten in the car at 7pm.
 */
export const DAY_TYPES = {
  free: {
    key: 'free', label: 'Day off', maxEffort: 'project', cookMinutes: 120,
    split: { breakfast: 0.25, lunch: 0.30, dinner: 0.35, snack: 0.10 },
    rule:  'This is your batch-cook window. An hour here buys back three weeknights.',
    colour: '#2E7D5B'
  },
  short: {
    key: 'short', label: 'Short day', maxEffort: 'project', cookMinutes: 75,
    split: { breakfast: 0.25, lunch: 0.30, dinner: 0.35, snack: 0.10 },
    rule:  'Room to cook something real. Make double — tomorrow will not be this generous.',
    colour: '#3E8E6E'
  },
  normal: {
    key: 'normal', label: 'Normal day', maxEffort: 'standard', cookMinutes: 35,
    split: { breakfast: 0.25, lunch: 0.32, dinner: 0.33, snack: 0.10 },
    rule:  'A 30-minute dinner is realistic tonight. Anything longer is optimism.',
    colour: '#C08A2E'
  },
  long: {
    key: 'long', label: 'Long day', maxEffort: 'quick', cookMinutes: 20,
    split: { breakfast: 0.24, lunch: 0.36, dinner: 0.28, snack: 0.12 },
    rule:  'Bigger lunch, lighter dinner, and eat the planned snack around hour nine. That snack is the whole defence against the drive-home binge.',
    colour: '#C4682E'
  },
  brutal: {
    key: 'brutal', label: 'Brutal day', maxEffort: 'none', cookMinutes: 8,
    split: { breakfast: 0.22, lunch: 0.38, dinner: 0.26, snack: 0.14 },
    rule:  'No cooking tonight. Assembly only. Tonight the win is not a good dinner — it is not ordering one.',
    colour: '#B0463C'
  }
};

export function dayType(hours) {
  const h = Number(hours) || 0;
  if (h <= 0)  return DAY_TYPES.free;
  if (h <= 6)  return DAY_TYPES.short;
  if (h <= 9)  return DAY_TYPES.normal;
  if (h <= 11) return DAY_TYPES.long;
  return DAY_TYPES.brutal;
}

/** Calorie budget per meal slot, rounded to something a human can act on. */
export function slotBudget(kcal, hours) {
  const t = dayType(hours);
  const out = {};
  for (const [slot, frac] of Object.entries(t.split)) out[slot] = Math.round((kcal * frac) / 5) * 5;
  return out;
}

export const EFFORT = {
  none:     { rank: 0, label: 'No cook',    hint: 'Assembly only — nothing hits a stove' },
  quick:    { rank: 1, label: 'Quick',      hint: 'One pan, under 20 minutes' },
  standard: { rank: 2, label: 'Cook',       hint: 'A real dinner, 25–40 minutes' },
  project:  { rank: 3, label: 'Batch cook', hint: 'Cook once, eat it three or four times' }
};

export const rank = e => EFFORT[e]?.rank ?? 0;

export function weeklyHours(hours) {
  return (hours || []).reduce((a, b) => a + (Number(b) || 0), 0);
}

export function fmtDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}
