/* path.js — the questionnaire and the path it produces.

   Seventeen one-tap questions about sleep, energy, fitness and food, and a
   pure function that turns the answers into a PATH: when to wake and wind
   down, when the kitchen closes, where the energy peaks land, what training
   is realistic and when, how to shape the day's food, and what to do about
   alcohol. Nothing here is clever — every rule is a sentence you could say
   out loud and defend. The path is shown to the user, written into the
   context file, and re-derived whenever the answers or the profile change.

   The organising idea, borrowed from Rise: do not fight the energy. The day
   has a groggy start, a morning peak, an afternoon dip, a second wind and a
   wind-down, and each of those is good for some things and bad for others.
   Training, the hardest work, the big meal, the nap, the last coffee and the
   kitchen closing all get placed INSIDE the window that suits them. */

/* ── the questions ─────────────────────────────────────────────── */

export const SECTIONS = [
  { id: 'sleep',   title: 'Sleep and waking', lede: 'Sleep is the lever most diet apps ignore. A short night reliably produces a bad evening.' },
  { id: 'energy',  title: 'Your energy',      lede: 'Everyone has two peaks and a dip. Knowing where yours fall decides when you train and when the kitchen closes.' },
  { id: 'fitness', title: 'Fitness, honestly', lede: 'Past 50 the job is to keep muscle while the fat goes. That needs two strength sessions a week — the question is what kind you would actually do.' },
  { id: 'food',    title: 'How you eat',      lede: 'Not what you should eat — how your hunger actually behaves. The plan bends to that, not the other way round.' }
];

export const QUESTIONS = [
  { id: 'wakeWork', section: 'sleep', type: 'time', q: 'On a work day, when do you usually wake up?', def: '06:30' },
  { id: 'bedWork',  section: 'sleep', type: 'time', q: 'And when do you usually fall asleep?', def: '23:00' },
  { id: 'freeWake', section: 'sleep', q: 'No alarm, nowhere to be — when would you naturally wake?',
    opts: [['<6', 'Before 6'], ['6-7', '6 to 7'], ['7-8', '7 to 8'], ['8+', 'After 8']] },
  { id: 'alarm', section: 'sleep', q: 'Do you wake before your alarm?',
    opts: [['usually', 'Usually'], ['sometimes', 'Sometimes'], ['never', 'Never — it drags me out']] },
  { id: 'morning', section: 'sleep', q: 'The first hour after waking, you are…',
    opts: [['groggy', 'Groggy for an hour or more'], ['slow', 'Slow for twenty minutes'], ['sharp', 'Up and running']] },
  { id: 'lastHour', section: 'sleep', q: 'The last hour before bed is usually…',
    opts: [['screen', 'TV or phone in bed'], ['work', 'Work email'], ['snack', 'A snack and the TV'], ['calm', 'Reading, a walk, quiet']] },

  { id: 'sharpest', section: 'energy', q: 'When are you at your sharpest?',
    opts: [['early', 'First thing'], ['mid', 'Late morning'], ['aft', 'Mid-afternoon'], ['eve', 'Evening']] },
  { id: 'dip', section: 'energy', q: 'When does the afternoon slump hit?',
    opts: [['13', 'Around 1 to 2pm'], ['14', 'Around 2 to 3pm'], ['15', 'Around 3 to 4pm'], ['none', 'I do not really get one']] },
  { id: 'hungry', section: 'energy', q: 'When are you hungriest?',
    opts: [['morning', 'Morning'], ['afternoon', 'Mid-afternoon'], ['evening', 'Dinner time'], ['late', 'Late at night']] },

  { id: 'fitNow', section: 'fitness', q: 'What do you actually do for exercise right now?',
    opts: [['none', 'Nothing regular'], ['walk', 'I walk'], ['cardio', 'Cardio — bike, run, swim'], ['lift', 'I lift weights'], ['both', 'Lifting and cardio']] },
  { id: 'fitWould', section: 'fitness', multi: true, q: 'Which of these would you honestly do? Pick all that apply.',
    opts: [['walk', 'Walking'], ['home', 'Dumbbells or bodyweight at home'], ['gym', 'Weights at a gym'], ['bike', 'Bike, swim or row'], ['sport', 'A sport — golf, tennis, pickleball']] },
  { id: 'fitMin', section: 'fitness', q: 'How long per session, realistically?',
    opts: [['15', '15 minutes'], ['30', '30 minutes'], ['45', '45 minutes or more']] },
  { id: 'fitWhen', section: 'fitness', q: 'When could training actually happen?',
    opts: [['before', 'Before work'], ['lunch', 'Lunchtime'], ['after', 'Straight after work'], ['evening', 'Later in the evening'], ['weekend', 'Weekends only']] },

  { id: 'breakfast', section: 'food', q: 'Breakfast on a work day is…',
    opts: [['skip', 'Skipped'], ['coffee', 'Coffee only'], ['small', 'Something small'], ['proper', 'A proper meal']] },
  { id: 'bigMeal', section: 'food', q: 'If one meal is going to be big, which should it be?',
    opts: [['lunch', 'Lunch'], ['dinner', 'Dinner'], ['either', 'Do not mind']] },
  { id: 'repeat', section: 'food', multi: true, q: 'Which of these could you eat most days without getting bored?',
    opts: [['eggs', 'Eggs'], ['chicken', 'Chicken'], ['fish', 'Fish and tuna'], ['beef', 'Beef'], ['pork', 'Pork'], ['beans', 'Beans and lentils'], ['salads', 'Big salads'], ['soups', 'Soups and stews']] },
  { id: 'alcohol', section: 'food', q: 'Alcohol, honestly',
    opts: [['none', 'None, or rarely'], ['weekly', 'A couple of drinks a week'], ['nightly1', 'One most nights'], ['nightly2', 'Two or more most nights']] }
];

export const BY_SECTION = id => QUESTIONS.filter(q => q.section === id);

/** Every question answered? Multi-selects may be empty; times always have a default. */
export function complete(a) {
  if (!a) return false;
  return QUESTIONS.every(q => q.multi || q.type === 'time' || (a[q.id] !== undefined && a[q.id] !== null && a[q.id] !== ''));
}

export function blankAnswers() {
  const a = {};
  for (const q of QUESTIONS) a[q.id] = q.multi ? [] : q.type === 'time' ? q.def : null;
  return a;
}

/* ── time helpers ──────────────────────────────────────────────── */

export const toMin = hhmm => {
  const [h, m] = String(hhmm || '00:00').split(':').map(Number);
  return (h * 60 + (m || 0)) % 1440;
};

/** "06:30" -> "6:30am" — the way a person says it. */
export function clock(min) {
  let m = ((Math.round(min) % 1440) + 1440) % 1440;
  const h24 = Math.floor(m / 60), mm = m % 60;
  const h12 = h24 % 12 === 0 ? 12 : h24 % 12;
  return `${h12}${mm ? ':' + String(mm).padStart(2, '0') : ''}${h24 < 12 ? 'am' : 'pm'}`;
}

export const span = (a, b) => `${clock(a)}–${clock(b)}`;

const H = 60;

/* ── the derivation ────────────────────────────────────────────── */

const LABEL = (id, v) => {
  const q = QUESTIONS.find(x => x.id === id);
  const o = q?.opts?.find(([k]) => k === v);
  return o ? o[1] : String(v ?? '');
};

/**
 * Turn answers + profile into a path. Pure. Everything is minutes since
 * midnight unless it says otherwise; bedtime after midnight is handled.
 */
export function derivePath(a, profile = {}) {
  if (!complete(a)) return null;

  /* chronotype: a small score, deliberately coarse */
  let score = 0;
  score += { '<6': -2, '6-7': -1, '7-8': 1, '8+': 2 }[a.freeWake] ?? 0;
  score += { early: -1, mid: 0, aft: 1, eve: 1 }[a.sharpest] ?? 0;
  score += { sharp: -1, slow: 0, groggy: 1 }[a.morning] ?? 0;
  const chronotype = score <= -2 ? 'lark' : score >= 2 ? 'owl' : 'neutral';

  /* sleep */
  const needMin = profile.sleepNeedMin || 450;                 // 7.5h — a sane default for a man past 50
  const wake = toMin(a.wakeWork);
  let bedRaw = toMin(a.bedWork);
  const actualMin = ((wake - bedRaw) + 1440) % 1440 || 1440;    // in-bed minutes, wrapping midnight
  const debtPerNight = Math.max(0, needMin - actualMin);
  const sleepLever = actualMin < 6.5 * H || a.alarm === 'never' || (debtPerNight >= 45 && a.morning === 'groggy');

  // Hold the wake time steady seven days a week and move bedtime to meet the need.
  const bed = wake + 1440 - needMin;                            // on a wake-relative timeline; clock() wraps past midnight
  const windDown = bed - 1 * H;
  const kitchenCloses = bed - 2.5 * H;
  const lastCoffee = bed - 10 * H;

  const sleepNotes = [];
  if (sleepLever) sleepNotes.push(`Sleep is probably your biggest lever right now: you are in bed about ${fmtH(actualMin)} against a need of about ${fmtH(needMin)}. Every hour short is worth roughly 200 extra calories the next day, most of them after 8pm.`);
  sleepNotes.push(`Wake at ${clock(wake)} every day, weekends included. Bedtime consistency is a third of a sleep score and the cheapest fix there is.`);
  if (a.morning === 'groggy') sleepNotes.push('Ten minutes outside within an hour of waking, ideally walking. Daylight is what ends grogginess, not the second coffee.');
  if (a.lastHour === 'screen') sleepNotes.push(`Phone charges outside the bedroom from ${clock(windDown)}. The screen is the reason the bedtime drifts.`);
  if (a.lastHour === 'work') sleepNotes.push(`Email closes at ${clock(windDown)}. A work problem at 10pm costs you sleep and gains the problem nothing.`);
  if (a.lastHour === 'snack') sleepNotes.push(`The evening snack is the kitchen-closes rule in disguise: nothing after ${clock(kitchenCloses)}. If you are genuinely hungry then, dinner was too small.`);
  sleepNotes.push(`Last coffee by ${clock(lastCoffee)}.`);

  /* energy windows */
  const grogMin = { groggy: 75, slow: 30, sharp: 15 }[a.morning];
  const peakOffset = { lark: 1.5, neutral: 2.5, owl: 3.5 }[chronotype] * H;
  const morningPeak = [wake + peakOffset, wake + peakOffset + 3 * H];
  const dipStart = a.dip === 'none' ? wake + 7 * H : Number(a.dip) * H;
  const dip = [dipStart, dipStart + 1.5 * H];
  const eveningPeak = [dip[1] + 1 * H, Math.min(dip[1] + 4 * H, windDown)];
  const energy = {
    grog: [wake, wake + grogMin],
    morningPeak, dip, eveningPeak,
    windDown: [windDown, bed],
    bed
  };

  /* fitness */
  const would = a.fitWould || [];
  const lifts = a.fitNow === 'lift' || a.fitNow === 'both';
  const modality = would.includes('gym') ? 'weights at the gym'
    : would.includes('home') ? 'dumbbells or bodyweight at home'
    : 'two short bodyweight sessions at home — squats, push-ups, rows with whatever is heavy';
  const minutes = Number(a.fitMin);
  let strengthSessions = 2;
  if (lifts && minutes >= 45 && (would.includes('gym') || would.includes('home'))) strengthSessions = 3;
  const stepTarget = { none: 7000, walk: 9000, cardio: 9000, lift: 9000, both: 10000 }[a.fitNow];
  // Strength and coordination peak in the late afternoon / early evening for
  // nearly everyone (body temperature is highest then). Larks get a usable
  // morning peak too. The training slot is placed inside a peak that the
  // person can actually reach, never in the grogginess zone or the dip.
  const windows = {
    before:  [wake + grogMin, wake + grogMin + 60],
    lunch:   [12 * H, 13 * H],
    after:   [eveningPeak[0], eveningPeak[0] + Math.max(minutes, 45)],
    evening: [eveningPeak[0], eveningPeak[1]],
    weekend: chronotype === 'owl' ? eveningPeak : morningPeak
  };
  const trainWindow = windows[a.fitWhen];
  const inPeak = r => (r[0] >= morningPeak[0] && r[0] < morningPeak[1]) || (r[0] >= eveningPeak[0] && r[0] < eveningPeak[1]);
  const inDip = r => r[0] >= dip[0] && r[0] < dip[1];
  const energyFit = inPeak(trainWindow) ? 'peak' : inDip(trainWindow) ? 'dip' : 'flat';
  const whenLabel = {
    before: `${span(trainWindow[0], trainWindow[1])}, once the grogginess has lifted`,
    lunch: `at lunchtime, ${span(trainWindow[0], trainWindow[1])}`,
    after: `straight after work, ${span(trainWindow[0], trainWindow[1])}`,
    evening: `in your second wind, ${span(trainWindow[0], trainWindow[1])}`,
    weekend: `at the weekend in your ${chronotype === 'owl' ? 'second wind' : 'morning peak'}, ${span(trainWindow[0], trainWindow[1])}, plus one walk-only weekday`
  }[a.fitWhen];
  const cardioExtra = would.filter(w => ['bike', 'sport', 'walk'].includes(w)).map(w => LABEL('fitWould', w).toLowerCase());
  const fitNotes = [];
  fitNotes.push(`${strengthSessions} strength sessions a week, ${minutes} minutes each, ${modality}, ${whenLabel}. This is the non-negotiable — it is what keeps the weight you lose from being muscle.`);
  if (energyFit === 'peak') fitNotes.push(`That slot sits inside an energy peak, which is where strength work belongs. You are not fighting your body.`);
  else if (energyFit === 'dip') fitNotes.push(`That slot lands in your slump (${span(dip[0], dip[1])}). Move it to ${span(eveningPeak[0], eveningPeak[0] + 60)} if you possibly can — the same session will feel easier and go better. If you cannot, walk in the slump and lift in the second wind on the days it is free.`);
  else fitNotes.push(`Strength is easiest ${span(eveningPeak[0], eveningPeak[1])} — body temperature and coordination peak then. Before-work sessions work, but keep them shorter and warm up longer; save the heavy stuff for the days you can train in the second wind.`);
  fitNotes.push(`${stepTarget.toLocaleString()} steps a day. Not a workout — a floor. The easy place to bank them is a ten-minute walk in the grogginess zone and another in the slump.`);
  if (cardioExtra.length) fitNotes.push(`${cap(cardioExtra.join(', '))} on the other days, as much as you like — that is for the heart and the head, the lifting is for the waist.`);
  if (a.fitNow === 'none') fitNotes.push('Start with one session this week, not two. Two comes in week three.');
  fitNotes.push('On a short-sleep day, walk instead of lifting. Never skip both.');

  /* food */
  const bigMeal = a.bigMeal === 'dinner' ? 'dinner'
    : a.bigMeal === 'lunch' ? 'lunch'
    : (a.hungry === 'afternoon' || a.hungry === 'evening' || a.hungry === 'late') ? 'lunch' : 'dinner';
  const firstMeal = wake + 90;
  const breakfastRule =
    (a.breakfast === 'skip' || a.breakfast === 'coffee') && (a.hungry === 'evening' || a.hungry === 'late')
      ? `Protein within 90 minutes of waking — eggs or Greek yogurt, by ${clock(firstMeal)}. You skip breakfast and the day catches up with you at night; this is the single food change most likely to fix the evening.`
    : a.breakfast === 'skip' || a.breakfast === 'coffee'
      ? `Breakfast is optional for you, but the first thing you eat must be protein, and it must be before ${clock(wake + 5 * H)}.`
    : a.breakfast === 'small'
      ? 'Keep breakfast small but make it protein — eggs, yogurt, cottage cheese — not toast alone.'
      : 'Keep the proper breakfast. Make sure it carries 30 g of protein.';
  const splitRule = bigMeal === 'lunch'
    ? `Lunch is the big meal. A planned protein snack around ${clock(dip[0] + 30)}, and dinner is the smallest meal of the day — that is how the evening stops being the problem.`
    : `Dinner is the big meal, and that is fine — but lunch has to be real, and dinner is on the table by ${clock(kitchenCloses - 45)} so the kitchen still closes at ${clock(kitchenCloses)}.`;
  const anchors = (a.repeat || []).map(v => LABEL('repeat', v).toLowerCase());
  const alcoholRule = {
    none: 'Alcohol is not a factor for you. Keep it that way while you are losing.',
    weekly: 'Keep drinks to the weekend and with food. Never after the kitchen closes.',
    nightly1: `One most nights is roughly 900 calories a week and the reason the sleep score is lower than it should be. Three dry nights a week, wine with dinner only, nothing after ${clock(kitchenCloses)}.`,
    nightly2: `Two or more most nights is likely 300-plus calories a night and a full point off every sleep metric you have. Cap it at one, four dry nights a week, and log it — the app will show you what it does to your sleep and your next day.`
  }[a.alcohol];
  const foodNotes = [breakfastRule, splitRule, `Kitchen closes at ${clock(kitchenCloses)}. Not a fast — just no calories in the two and a half hours before bed.`];
  if (anchors.length) foodNotes.push(`Anchor proteins: ${anchors.join(', ')}. The plan leans on these; the coach should suggest them first.`);
  foodNotes.push(alcoholRule);

  /* the day, in order — what each window is for */
  const bigMealAtLunch = bigMeal === 'lunch';
  const lunchAt = Math.min(Math.max(morningPeak[1], 12 * H), dip[0] - 30);
  const dinnerAt = Math.min(eveningPeak[1] - 30, kitchenCloses - 45);
  const schedule = [
    { at: [wake, wake + grogMin], label: 'Groggy start', do: `Daylight, water, a ten-minute walk, then coffee. No decisions, no scale panic, no email yet.${a.breakfast === 'skip' || a.breakfast === 'coffee' ? '' : ' Breakfast lands at the end of this.'}` },
    { at: [wake + grogMin, morningPeak[0]], label: 'Warming up', do: `Easy tasks, planning the day, the protein breakfast by ${clock(firstMeal)}.` },
    { at: morningPeak, label: 'Morning peak', do: `The hardest, most important work. Meetings you need to be sharp for. Nothing that could be done by a tired version of you.${a.fitWhen === 'lunch' ? ` Training at the end of this, ${span(trainWindow[0], trainWindow[1])}.` : ''}` },
    { at: [lunchAt, lunchAt + 45], label: bigMealAtLunch ? 'Lunch — the big meal' : 'Lunch', do: bigMealAtLunch ? 'The largest plate of the day. Protein first, then everything else. Ten minutes walking after it blunts the slump.' : 'A real lunch with real protein — this is what stops the 4pm raid. Ten minutes walking after it.' },
    { at: dip, label: 'The slump', do: `Admin, calls, errands, driving, a walk — or twenty minutes with your eyes shut. Protein snack at ${clock(dip[0] + 30)}. Do not schedule anything that needs judgement here, and do not fight it with sugar. Last coffee was ${clock(lastCoffee)}.` },
    { at: eveningPeak, label: 'Second wind', do: `${['after', 'evening'].includes(a.fitWhen) || (a.fitWhen === 'weekend' && chronotype === 'owl') ? `Training, ${span(trainWindow[0], trainWindow[1])} — this is where strength work belongs. ` : ''}The second block of good work, or the things that need you at your best at home. Dinner at about ${clock(dinnerAt)}.` },
    { at: [kitchenCloses, windDown], label: 'Kitchen closed', do: `Nothing with calories from ${clock(kitchenCloses)}. Tea, water, sparkling water. If you are hungry here, tomorrow's dinner needs to be bigger — not tonight's snack.` },
    { at: [windDown, bed], label: 'Wind down', do: `Lights down, screens off, tomorrow's list written so the brain can let go of it. ${a.lastHour === 'screen' ? 'Phone charges in the kitchen. ' : ''}${a.lastHour === 'work' ? 'Email is closed; it will still be wrong in the morning. ' : ''}In bed by ${clock(bed)} so ${clock(wake)} is easy.` }
  ];

  const headline = sleepLever
    ? `Fix the wake-up first — ${clock(wake)} every day, in bed by ${clock(bed)} — then ${strengthSessions} short strength sessions and a kitchen that closes at ${clock(kitchenCloses)}.`
    : `Hold ${clock(wake)} wake-ups, ${strengthSessions} strength sessions a week ${whenLabel}, ${bigMeal} as the big meal, kitchen closed at ${clock(kitchenCloses)}.`;

  return {
    chronotype, score, headline,
    sleep: { needMin, actualMin, debtPerNight, sleepLever, wake, bed, windDown, kitchenCloses, lastCoffee, notes: sleepNotes },
    energy, schedule,
    fitness: { strengthSessions, minutes, modality, when: a.fitWhen, whenLabel, trainWindow, energyFit, stepTarget, notes: fitNotes },
    food: { bigMeal, firstMeal, kitchenCloses, breakfast: a.breakfast, anchors, alcohol: a.alcohol, notes: foodNotes }
  };
}

const fmtH = min => {
  const h = Math.floor(min / 60), m = Math.round(min % 60);
  return m ? `${h}h ${m}m` : `${h}h`;
};
const cap = s => s.charAt(0).toUpperCase() + s.slice(1);

export const CHRONO_LABEL = {
  lark: 'a morning person', neutral: 'neither a lark nor an owl', owl: 'an evening person'
};

/** The path as markdown, for the context file. */
export function pathMarkdown(p) {
  if (!p) return '';
  const e = p.energy;
  return `## Their path (from the questionnaire)
${p.headline}
- Chronotype: ${CHRONO_LABEL[p.chronotype]}. Sharpest ${span(e.morningPeak[0], e.morningPeak[1])}; slump ${span(e.dip[0], e.dip[1])}; second wind ${span(e.eveningPeak[0], e.eveningPeak[1])}.
- Sleep: wake ${clock(p.sleep.wake)} daily, bed by ${clock(p.sleep.bed)}, wind down from ${clock(p.sleep.windDown)}, last coffee ${clock(p.sleep.lastCoffee)}. Currently in bed about ${fmtH(p.sleep.actualMin)} against a ${fmtH(p.sleep.needMin)} need.${p.sleep.sleepLever ? ' SLEEP IS THE PRIMARY LEVER — expect cravings on short nights and say so before dinner.' : ''}
- Fitness: ${p.fitness.strengthSessions} strength sessions a week, ${p.fitness.minutes} min, ${p.fitness.modality}, ${p.fitness.whenLabel}. ${p.fitness.stepTarget.toLocaleString()} steps a day. Short-sleep day: walk, do not lift.
- Food: ${p.food.bigMeal} is the big meal. Kitchen closes ${clock(p.food.kitchenCloses)}. ${p.food.anchors.length ? `Anchor proteins: ${p.food.anchors.join(', ')}.` : ''} Alcohol: ${LABEL('alcohol', p.food.alcohol).toLowerCase()}.
- The day in order (do not fight the energy — put things in the window that suits them):
${p.schedule.map(b => `  - ${span(b.at[0], b.at[1])} ${b.label}: ${b.do}`).join('\n')}
`;
}
