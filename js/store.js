/* store.js — all state, all local.

   Everything lives in this device's localStorage. Nothing is uploaded, there is
   no account and no server. The only bytes that ever leave the phone are the
   messages you deliberately send to the AI coach, and only if you have put in
   your own API key. */

const KEY = 'medcoach.v1';

export const DEFAULTS = {
  onboarded: false,

  profile: {
    name: '',
    age: 60,
    sex: 'male',
    heightIn: 70,
    startWeight: 210,
    weight: 210,
    goalWeight: 185,
    activity: 'light',
    rate: 1.0,                        // target lb per week
    workHours: [0, 9, 9, 9, 9, 9, 3], // index 0 = Sunday
    commuteMin: 30,
    cookNights: 3,                    // nights a week you will genuinely cook
    skill: 'ok',                      // basic | ok | confident
    kitchen: ['stovetop', 'oven'],
    dislikes: '',
    allergies: '',
    conditions: '',
    sleepNeedMin: 450,              // 7.5h; the path is measured against this
    startWaist: null,               // inches at the navel, optional
    waistGoal: null                 // inches; blank means "under 40"
  },

  /* The context layer. This is the part the user owns and edits directly —
     it is injected verbatim into every request to the assistant. */
  telos: {
    mission: '',
    problems: [],       // chosen during onboarding, editable later
    directives: ''      // free text: standing instructions to the assistant
  },

  /* The questionnaire. The path itself is derived from these plus the
     profile every time it is needed, so it never goes stale. */
  path: {
    answers: null,
    takenAt: null
  },

  settings: {
    apiKey: '',
    model: 'claude-opus-5',
    effort: 'low'
  },

  // 'YYYY-MM-DD' -> { weight, waist, hours, ate: {slot: true}, note,
  //                    sleepMin, inBedMin, bedtime, wake, sleepSource, steps, restingHR,
  //                    extras: [{name, unit, kcal, protein, qty, at}], workouts: [{type, name, minutes, kcal, source}] }
  //  Sleep is keyed by the morning you woke up on.
  log: {},

  plan: null,
  grocery: { checked: [], builtFor: null },
  chat: [],
  loved: [],
  refused: [],
  saved: []          // foods worth logging again in one tap: {name, unit, kcal, protein}
};

function merge(base, patch) {
  if (base === null || typeof base !== 'object' || Array.isArray(base)) {
    return patch === undefined ? base : patch;
  }
  const out = { ...base };
  for (const k of Object.keys(patch || {})) {
    out[k] = k in base ? merge(base[k], patch[k]) : patch[k];
  }
  return out;
}

let state = load();

function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return structuredClone(DEFAULTS);
    return merge(structuredClone(DEFAULTS), JSON.parse(raw));
  } catch (err) {
    console.warn('Saved data could not be read; starting clean.', err);
    return structuredClone(DEFAULTS);
  }
}

export const get = () => state;

export function save() {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch (err) {
    console.error('Could not save — storage full or blocked.', err);
  }
}

export function set(fn) {
  fn(state);
  save();
  return state;
}

export function reset() {
  state = structuredClone(DEFAULTS);
  save();
}

/* ── dates ─────────────────────────────────────────────────────── */

export const DAY_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
export const DAY_LONG  = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export function key(d = new Date()) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function parse(k) {
  const [y, m, d] = k.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function addDays(d, n) {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}

/** Sunday of the week containing `d`. */
export function weekStart(d = new Date()) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return addDays(x, -x.getDay());
}

/* ── the daily log ─────────────────────────────────────────────── */

export function day(k = key()) {
  return state.log[k] || { weight: null, waist: null, hours: null, ate: {}, note: '' };
}

export function setDay(k, patch) {
  return set(s => { s.log[k] = { ...day(k), ...patch }; });
}

/** Hours worked on a date: what was logged, else what is scheduled. */
export function hoursOn(k) {
  const logged = state.log[k]?.hours;
  if (logged !== null && logged !== undefined) return logged;
  return state.profile.workHours[parse(k).getDay()] ?? 8;
}

export function weights() {
  return Object.entries(state.log)
    .filter(([, v]) => typeof v.weight === 'number' && v.weight > 0)
    .map(([d, v]) => ({ date: d, weight: v.weight }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

/**
 * Seven-day rolling average. Daily weight is mostly water and yesterday's salt;
 * the trend line is the only number worth reacting to.
 */
export function trend() {
  const w = weights();
  if (!w.length) return state.profile.weight;
  const last = w.slice(-7);
  return Math.round((last.reduce((a, b) => a + b.weight, 0) / last.length) * 10) / 10;
}

/** Change in the trend over the last fortnight, in lb. Negative is loss. */
export function trendDelta() {
  const w = weights();
  if (w.length < 4) return null;
  const recent = w.slice(-5), older = w.slice(-14, -5);
  if (!older.length) return null;
  const avg = a => a.reduce((x, y) => x + y.weight, 0) / a.length;
  return Math.round((avg(recent) - avg(older)) * 10) / 10;
}

/* ── the waist ─────────────────────────────────────────────────── */

/* The scale is a poor witness once someone is lifting: muscle comes on as
   fat goes and the number sits still. A tape at the navel does not have
   that problem, and for this audience it is the number they care about. */

export function waists() {
  const out = Object.entries(state.log)
    .filter(([, v]) => typeof v.waist === 'number' && v.waist > 0)
    .map(([d, v]) => ({ date: d, waist: v.waist }))
    .sort((a, b) => a.date.localeCompare(b.date));
  if (!out.length && state.profile.startWaist) return [{ date: 'start', waist: state.profile.startWaist }];
  return out;
}

export function waistNow() {
  const w = waists();
  return w.length ? w[w.length - 1].waist : null;
}

/** Inches lost since the first measurement. Negative is loss. */
export function waistDelta() {
  const w = waists();
  if (w.length < 2) return null;
  return Math.round((w[w.length - 1].waist - w[0].waist) * 10) / 10;
}

/** True when the last tape measurement is a week or more old. */
export function waistDue() {
  const w = waists().filter(x => x.date !== 'start');
  if (!w.length) return true;
  const last = parse(w[w.length - 1].date);
  return (new Date() - last) / 86400000 >= 6.5;
}

/* ── sleep and the watch ───────────────────────────────────────── */

/** The last fourteen nights, index 0 = last night (the morning of `k`). */
export function nights(k = key(), n = 14) {
  const out = [];
  for (let i = 0; i < n; i++) {
    const d = state.log[key(addDays(parse(k), -i))];
    out.push(d && d.sleepMin > 0 ? { sleepMin: d.sleepMin, inBedMin: d.inBedMin ?? null, bedtime: d.bedtime ?? null, wake: d.wake ?? null, source: d.sleepSource || 'manual' } : null);
  }
  return out;
}

export const lastNight = (k = key()) => nights(k, 1)[0];

/** Merge a parsed Health export into the log. Watch data beats a typed number. */
export function importHealth(parsed) {
  let nightsIn = 0, daysIn = 0;
  set(s => {
    for (const [d, n] of Object.entries(parsed.nights || {})) {
      const cur = s.log[d] || day(d);
      s.log[d] = { ...cur, sleepMin: n.sleepMin, inBedMin: n.inBedMin ?? cur.inBedMin ?? null, bedtime: n.bedtime ?? cur.bedtime ?? null, wake: n.wake ?? cur.wake ?? null, sleepSource: n.source || 'watch' };
      nightsIn++;
    }
    for (const [d, x] of Object.entries(parsed.days || {})) {
      const cur = s.log[d] || day(d);
      const merged = { ...cur, ...(x.steps >= 0 ? { steps: x.steps } : {}), ...(x.restingHR > 0 ? { restingHR: x.restingHR } : {}) };
      if (x.workouts?.length) {
        // Replace what the watch previously said for that day; keep hand-typed ones.
        merged.workouts = [...(cur.workouts || []).filter(w => w.source !== 'watch'), ...x.workouts];
      }
      s.log[d] = merged;
      daysIn++;
    }
  });
  return { nightsIn, daysIn };
}

/* ── things logged outside the plan ────────────────────────────── */

export function addExtra(k, item) {
  const entry = { name: item.name, unit: item.unit || '', kcal: Math.round(item.kcal || 0), protein: Math.round(item.protein || 0), qty: item.qty || 1, at: new Date().toTimeString().slice(0, 5) };
  set(s => { const d = s.log[k] || day(k); s.log[k] = { ...d, extras: [...(d.extras || []), entry] }; });
  return entry;
}

export function removeExtra(k, i) {
  set(s => { const d = s.log[k]; if (d?.extras) d.extras = d.extras.filter((_, j) => j !== i); });
}

/** Calories and protein from everything logged with the + button today. */
export function extrasTotal(k = key()) {
  return (state.log[k]?.extras || []).reduce((a, e) => ({ kcal: a.kcal + Math.round(e.kcal * (e.qty || 1)), protein: a.protein + Math.round(e.protein * (e.qty || 1)) }), { kcal: 0, protein: 0 });
}

export function addWorkout(k, w) {
  const entry = { type: w.type, name: w.name || w.type, minutes: Math.round(w.minutes || 0), kcal: Math.round(w.kcal || 0), source: w.source || 'manual' };
  set(s => { const d = s.log[k] || day(k); s.log[k] = { ...d, workouts: [...(d.workouts || []), entry] }; });
  return entry;
}

export function removeWorkout(k, i) {
  set(s => { const d = s.log[k]; if (d?.workouts) d.workouts = d.workouts.filter((_, j) => j !== i); });
}

/** Strength sessions since Sunday, for the "2 a week" line. */
export function strengthThisWeek(d = new Date()) {
  const start = weekStart(d);
  let n = 0;
  for (let i = 0; i < 7; i++) {
    const k = key(addDays(start, i));
    n += (state.log[k]?.workouts || []).filter(w => w.type === 'strength').length;
  }
  return n;
}

export function saveFood(item) {
  set(s => {
    const name = item.name.trim();
    if (s.saved.some(x => x.name.toLowerCase() === name.toLowerCase())) return;
    s.saved.unshift({ name, unit: item.unit || '', kcal: Math.round(item.kcal || 0), protein: Math.round(item.protein || 0) });
    s.saved = s.saved.slice(0, 60);
  });
}

export function unsaveFood(name) {
  set(s => { s.saved = s.saved.filter(x => x.name !== name); });
}

/** The last few distinct things logged with +, newest first. */
export function recentExtras(n = 8) {
  const seen = new Set(), out = [];
  const keys = Object.keys(state.log).sort().reverse();
  for (const k of keys) {
    for (const e of [...(state.log[k].extras || [])].reverse()) {
      const id = e.name.toLowerCase();
      if (seen.has(id)) continue;
      seen.add(id); out.push({ name: e.name, unit: e.unit, kcal: e.kcal, protein: e.protein });
      if (out.length >= n) return out;
    }
  }
  return out;
}

export function stepsOn(k) {
  const v = state.log[k]?.steps;
  return v >= 0 ? v : null;
}

/** Share of planned meals actually ticked off over the last N days. */
export function adherence(days = 14) {
  let planned = 0, eaten = 0;
  for (let i = 0; i < days; i++) {
    const k = key(addDays(new Date(), -i));
    const d = state.log[k];
    if (!d) continue;
    planned += 4;
    eaten += Object.values(d.ate || {}).filter(Boolean).length;
  }
  if (!planned) return null;
  return Math.round((eaten / planned) * 100);
}

/* ── backup ────────────────────────────────────────────────────── */

export function exportAll() {
  const copy = structuredClone(state);
  copy.settings.apiKey = '';   // a backup file never carries the key
  return JSON.stringify(copy, null, 2);
}

export function importAll(text) {
  const incoming = JSON.parse(text);
  const keep = state.settings.apiKey;
  state = merge(structuredClone(DEFAULTS), incoming);
  state.settings.apiKey = keep;
  save();
}
