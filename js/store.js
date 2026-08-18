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
    conditions: ''
  },

  /* The context layer. This is the part the user owns and edits directly —
     it is injected verbatim into every request to the assistant. */
  telos: {
    mission: '',
    problems: [],       // chosen during onboarding, editable later
    directives: ''      // free text: standing instructions to the assistant
  },

  settings: {
    apiKey: '',
    model: 'claude-opus-5',
    effort: 'low'
  },

  // 'YYYY-MM-DD' -> { weight, hours, ate: {slot: true}, note }
  log: {},

  plan: null,
  grocery: { checked: [], builtFor: null },
  chat: [],
  loved: [],
  refused: []
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
  return state.log[k] || { weight: null, hours: null, ate: {}, note: '' };
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
