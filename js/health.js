/* health.js — Apple Watch data, without an app store.

   A home-screen web app cannot read HealthKit, and iOS still will not let a
   web app be a share target. So the Watch's numbers get here the plain way:
   a Shortcut on the phone reads Health and copies a few lines of text to the
   clipboard; a button in the app pastes it. Two taps a morning, no server,
   nothing uploaded. If the Shortcut is not set up, last night's hours can be
   typed in by hand and the same maths runs.

   Everything in here is pure: parse text into nights and days, fold nights
   into a sleep debt, decide whether today is a rough day. */

/* ── the clipboard format ─────────────────────────────────────── */

/* One line per Health sample, pipe-separated. The Shortcut writes:

     sleep|Asleep (Core)|2026-09-12 23:41|2026-09-13 01:10
     steps|2026-09-12|6210
     rhr|2026-09-12|58
     workout|2026-09-12 17:10|Traditional Strength Training|38|215

   Unprefixed three-field lines are taken as sleep, so a Shortcut that only
   exports sleep still works. Dates are "yyyy-MM-dd HH:mm" ideally, but
   anything Date.parse accepts is tolerated. The JSON contract from the
   research doc is accepted too. */

export function parseHealth(text) {
  const out = { nights: {}, days: {}, samples: 0, errors: 0 };
  const t = String(text || '').trim();
  if (!t) return out;

  if (t.startsWith('{')) {
    try { return parseJson(JSON.parse(t)); } catch { /* fall through to lines */ }
  }

  const segs = [];
  for (const raw of t.split(/\r?\n/)) {
    const line = raw.trim();
    if (!line) continue;
    const f = line.split('|').map(x => x.trim());
    const kind = f.length === 4 || /^sleep$/i.test(f[0]) ? 'sleep'
      : /^steps?$/i.test(f[0]) ? 'steps'
      : /^(rhr|resting)/i.test(f[0]) ? 'rhr'
      : /^workout/i.test(f[0]) ? 'workout'
      : f.length === 3 && isDateish(f[1]) && isDateish(f[2]) ? 'sleep' : null;

    if (kind === 'workout') {
      const date = dayKey(parseDate(f[1]));
      const minutes = Math.round(Number(f[3]) || 0), kcal = Math.round(Number(f[4]) || 0);
      if (!date || !f[2] || !minutes) { out.errors++; continue; }
      const d = out.days[date] ||= {};
      (d.workouts ||= []).push({ type: workoutType(f[2]), name: String(f[2]).slice(0, 40), minutes, kcal, source: 'watch' });
      out.samples++;
      continue;
    }

    if (kind === 'sleep') {
      const [value, a, b] = f.length === 4 ? f.slice(1) : f;
      const start = parseDate(a), end = parseDate(b);
      if (!start || !end || end <= start) { out.errors++; continue; }
      const state = classify(value);
      if (!state) continue;                       // unknown labels are dropped; Awake is kept to subtract
      segs.push({ state, start, end });
      out.samples++;
    } else if (kind === 'steps' || kind === 'rhr') {
      const date = dayKey(parseDate(f[1]));
      const v = Number(String(f[2]).replace(/[^\d.]/g, ''));
      if (!date || !isFinite(v)) { out.errors++; continue; }
      const d = out.days[date] ||= {};
      if (kind === 'steps') d.steps = (d.steps || 0) + Math.round(v);
      else d.restingHR = Math.round(v);
      out.samples++;
    } else {
      out.errors++;
    }
  }

  /* fold segments into nights. A segment belongs to the night you woke
     from: the date of its end if that is before 6pm, otherwise the next day.
     Overlaps (phone and watch both logging) are merged, not double counted,
     and anything a device called Awake is taken out — awake is awake. */
  const byNight = {};
  for (const s of segs) (byNight[nightKey(s.end)] ||= []).push(s);
  for (const [k, list] of Object.entries(byNight)) {
    const asleep = subtract(union(list.filter(s => s.state === 'asleep')), union(list.filter(s => s.state === 'awake')));
    const inBed = union(list.filter(s => s.state === 'inbed'));
    const asleepMin = Math.round(asleep.reduce((a, s) => a + (s.end - s.start), 0) / 60000);
    const inBedMin = Math.max(asleepMin, Math.round(inBed.reduce((a, s) => a + (s.end - s.start), 0) / 60000));
    if (!asleepMin && !inBedMin) continue;
    const all = asleep.length ? asleep : inBed;
    const first = new Date(Math.min(...all.map(s => s.start))), last = new Date(Math.max(...all.map(s => s.end)));
    out.nights[k] = {
      sleepMin: asleepMin || inBedMin,           // a phone-only night has no stages; in-bed is the best we have
      inBedMin,
      bedtime: hhmm(first),
      wake: hhmm(last),
      source: asleep.length ? 'watch' : 'phone'
    };
  }
  return out;
}

function parseJson(j) {
  const out = { nights: {}, days: {}, samples: 0, errors: 0 };
  for (const n of j.nights || []) {
    if (!n.date || !(n.asleepMin > 0)) { out.errors++; continue; }
    out.nights[n.date] = { sleepMin: Math.round(n.asleepMin), inBedMin: Math.round(n.inBedMin || n.asleepMin), bedtime: n.bedtime || null, wake: n.wake || null, source: 'json' };
    out.samples++;
  }
  for (const d of j.days || []) {
    if (!d.date) { out.errors++; continue; }
    const x = out.days[d.date] ||= {};
    if (d.steps >= 0) x.steps = Math.round(d.steps);
    if (d.restingHR > 0) x.restingHR = Math.round(d.restingHR);
    out.samples++;
  }
  return out;
}

/** Apple's workout names folded into the four kinds the app reasons about. */
export function workoutType(name) {
  const s = String(name).toLowerCase();
  if (/strength|weight|core|functional|hiit|cross ?training|pilates/.test(s)) return 'strength';
  if (/walk|hik/.test(s)) return 'walk';
  if (/run|cycl|bike|swim|row|ellip|stair|cardio|dance/.test(s)) return 'cardio';
  if (/golf|tennis|pickle|basket|soccer|baseball|racquet|squash|badminton|paddle/.test(s)) return 'sport';
  return 'other';
}

const classify = v => {
  const s = String(v).toLowerCase();
  if (/awake/.test(s)) return 'awake';
  if (/in ?bed/.test(s)) return 'inbed';
  if (/asleep|core|deep|rem|unspecified/.test(s)) return 'asleep';
  return null;
};

const isDateish = s => /\d{4}-\d{2}-\d{2}/.test(s) || !isNaN(Date.parse(s));

function parseDate(s) {
  if (!s) return null;
  const m = String(s).match(/^(\d{4})-(\d{2})-(\d{2})(?:[ T](\d{1,2}):(\d{2}))?/);
  if (m) return new Date(+m[1], +m[2] - 1, +m[3], +(m[4] || 0), +(m[5] || 0));
  const t = Date.parse(String(s).replace(/\s+at\s+/i, ' '));   // "Sep 12, 2026 at 11:00 PM"
  return isNaN(t) ? null : new Date(t);
}

const pad = n => String(n).padStart(2, '0');
export const dayKey = d => d ? `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}` : null;
const hhmm = d => `${pad(d.getHours())}:${pad(d.getMinutes())}`;

function nightKey(end) {
  const d = new Date(end);
  if (d.getHours() >= 18) d.setDate(d.getDate() + 1);
  return dayKey(d);
}

/** Merge overlapping intervals. */
function union(list) {
  const s = [...list].sort((a, b) => a.start - b.start);
  const out = [];
  for (const x of s) {
    const last = out[out.length - 1];
    if (last && x.start <= last.end) { if (x.end > last.end) last.end = x.end; }
    else out.push({ start: x.start, end: x.end });
  }
  return out;
}

/** Remove the `cut` intervals from `base`. Both already merged and sorted. */
function subtract(base, cut) {
  let out = base.map(x => ({ ...x }));
  for (const c of cut) {
    const next = [];
    for (const x of out) {
      if (c.end <= x.start || c.start >= x.end) { next.push(x); continue; }
      if (c.start > x.start) next.push({ start: x.start, end: c.start });
      if (c.end < x.end) next.push({ start: c.end, end: x.end });
    }
    out = next;
  }
  return out;
}

/* ── sleep debt ───────────────────────────────────────────────── */

/**
 * Rise's shape: fourteen nights, last night weighted 15%, the thirteen
 * before it sharing 85% with the more recent counting more. Scaled so that
 * a person consistently one hour short shows fourteen hours of debt, which
 * is the number people have learned to read. Nights with no data count as
 * nothing, and the count of known nights comes back so the UI can be honest.
 *
 * @param nights  array of {sleepMin|null}, index 0 = last night, 13 = oldest
 */
export function sleepDebt(nights, needMin = 450) {
  const w = [0.15];
  const rest = Array.from({ length: 13 }, (_, i) => 13 - i);       // 13..1
  const sum = rest.reduce((a, b) => a + b, 0);
  for (const r of rest) w.push(0.85 * r / sum);

  let debt = 0, known = 0;
  for (let i = 0; i < 14; i++) {
    const n = nights[i];
    if (!n || !(n.sleepMin > 0)) continue;
    known++;
    debt += Math.max(0, needMin - n.sleepMin) * w[i] * 14;
  }
  return { debtMin: Math.round(debt), known };
}

/** Rise keeps people under five hours. Colour and a word, nothing more. */
export function debtBand(debtMin) {
  if (debtMin < 5 * 60) return { band: 'low', label: 'low', tone: 'good' };
  if (debtMin < 10 * 60) return { band: 'mid', label: 'building', tone: 'warn' };
  return { band: 'high', label: 'high', tone: 'bad' };
}

/**
 * A rough day: last night under six hours, or debt over five hours. Either
 * one reliably produces a hungrier evening; the app says so before it starts.
 */
export function roughDay(lastNight, debtMin) {
  const short = lastNight && lastNight.sleepMin > 0 && lastNight.sleepMin < 360;
  const deep = debtMin > 5 * 60;
  if (!short && !deep) return null;
  return {
    short, deep,
    why: short && deep ? 'a short night on top of a sleep debt' : short ? 'a short night' : 'a sleep debt over five hours'
  };
}

export const fmtH = min => {
  const h = Math.floor(min / 60), m = Math.round(min % 60);
  return h ? (m ? `${h}h ${m}m` : `${h}h`) : `${m}m`;
};
