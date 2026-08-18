/* context.js — the personal-context layer.

   This app follows Daniel Miessler's approach to personal AI: the model is never
   asked to be clever from a cold start. Instead there is a single, explicit,
   human-readable CONTEXT FILE that describes who you are, what you are trying to
   do, the problems standing in the way, and what today actually looks like. It
   gets injected into every request.

   Three consequences, all deliberate:

     1. You can read it. It is markdown, shown verbatim in the app.
     2. You can edit it. The `directives` field is yours — standing instructions
        that override anything the app assumes about you.
     3. You can take it with you. One tap copies the whole thing so you can paste
        it into the Claude app, ChatGPT, or whatever you use in five years. The
        context is the asset. The model is a swappable engine.

   PATTERNS below are the second half of the method: named, reusable prompts for
   the situations that actually recur, rather than a blank chat box at 7pm when
   you are too tired to write a good question. */

import { get, day, key, hoursOn, trend, trendDelta, weights, adherence, DAY_LONG } from './store.js';
import { targets, dayType, ACTIVITY, weeklyHours, fmtDate } from './engine.js';
import { BY_ID, recipeIndex } from './recipes.js';
import { SLOTS, SLOT_LABEL, served } from './planner.js';

/* The problems worth naming. Chosen during onboarding, and they change the
   coaching more than any macro number does — a person who eats fine all day and
   then destroys the evening needs different advice from one who skips lunch. */
export const PROBLEMS = [
  { id: 'evening',    label: 'Evenings undo the day',       detail: 'I eat well until about 8pm and then graze until bed.' },
  { id: 'longdays',   label: 'Long days wreck the plan',    detail: 'When work runs long I end up eating whatever is nearest.' },
  { id: 'takeaway',   label: 'Takeaway on the way home',    detail: 'I get home too hungry to cook and order something.' },
  { id: 'skipping',   label: 'I skip meals then overeat',   detail: 'No breakfast, no lunch, then far too much dinner.' },
  { id: 'restaurant', label: 'Restaurants and client meals',detail: 'A lot of my eating is not under my control.' },
  { id: 'alcohol',    label: 'Wine adds up',                detail: 'A few glasses most nights and I never count them.' },
  { id: 'weekends',   label: 'Weekends erase the week',     detail: 'Five good days, two that undo them.' },
  { id: 'cooking',    label: 'I do not really cook',        detail: 'Limited confidence or interest in cooking from scratch.' },
  { id: 'family',     label: 'Cooking for people not dieting', detail: 'I cannot make a separate meal for myself every night.' },
  { id: 'boredom',    label: 'I get bored and quit',        detail: 'Diets work for three weeks then I lose interest.' },
  { id: 'travel',     label: 'I travel for work',           detail: 'Hotels, airports and other people choosing the restaurant.' },
  { id: 'energy',     label: 'Low energy in the afternoon', detail: 'I crash around 3pm and reach for something sugary.' }
];

/**
 * The context file. Plain markdown, deliberately readable — if you would not
 * want to read it, the model has no business being given it either.
 */
export function buildContext() {
  const s = get();
  const p = s.profile;
  const t = targets(p);
  const k = key();
  const today = day(k);
  const hrs = hoursOn(k);
  const type = dayType(hrs);
  const tr = trend();
  const delta = trendDelta();
  const adh = adherence();
  const recent = weights().slice(-6);

  const lost = Math.round((p.startWeight - tr) * 10) / 10;
  const problems = (s.telos.problems || [])
    .map(id => PROBLEMS.find(x => x.id === id))
    .filter(Boolean);

  const schedule = p.workHours.map((h, i) => `${DAY_LONG[i].slice(0, 3)} ${h}h`).join(' · ');

  const ate = SLOTS.filter(sl => today.ate?.[sl]).map(sl => SLOT_LABEL[sl]);

  let planBlock = 'No week has been planned yet.';
  let todayBlock = 'No plan for today.';
  if (s.plan) {
    planBlock = s.plan.days.map(d => {
      const meals = SLOTS.map(sl => {
        const slot = d.slots[sl];
        if (!slot) return null;
        const r = BY_ID[slot.id];
        return `${sl} ${r ? r.name : slot.id}${slot.leftover ? ' (leftovers)' : ''}`;
      }).filter(Boolean).join('; ');
      return `- ${DAY_LONG[d.dow]} — ${d.hours}h work, ${d.type.label}${d.batchDay ? ', BATCH DAY' : ''}: ${meals}`;
    }).join('\n');

    const td = s.plan.days.find(d => d.date === k);
    if (td) {
      todayBlock = SLOTS.map(sl => {
        const slot = td.slots[sl];
        if (!slot) return null;
        const r = BY_ID[slot.id];
        if (!r) return null;
        const eaten = today.ate?.[sl] ? ' [EATEN]' : '';
        return `- ${SLOT_LABEL[sl]} (${td.budget[sl]} kcal budget): ${r.name} — ${r.kcal} kcal, ${r.protein} g protein, ${r.minutes} min${slot.leftover ? ', leftovers' : ''}${eaten}`;
      }).filter(Boolean).join('\n');
    }
  }

  return `# CONTEXT FILE — ${p.name || 'the user'}
Generated ${new Date().toLocaleString()}. This describes the person you are advising.

## Identity
- ${p.age} years old, ${p.sex}, ${Math.floor(p.heightIn / 12)}ft ${p.heightIn % 12}in.
- Started at ${p.startWeight} lb. Trend weight now ${tr} lb. Goal ${p.goalWeight} lb.
- ${lost >= 0 ? `Down ${lost} lb` : `Up ${Math.abs(lost)} lb`} since starting${delta !== null ? `; the 14-day trend is moving ${delta < 0 ? `down ${Math.abs(delta)} lb` : delta > 0 ? `up ${delta} lb` : 'flat'}` : ''}.
- Activity outside work: ${ACTIVITY[p.activity]?.label} — ${ACTIVITY[p.activity]?.hint}.

## Mission
${s.telos.mission || `Lose ${t.toLose} lb on a Mediterranean pattern of eating, without it costing time that is not available, and keep the muscle.`}

## Problems in the way
${problems.length
  ? problems.map(x => `- **${x.label}** — ${x.detail}`).join('\n')
  : '- None recorded yet.'}

## Targets and why they are what they are
- Maintenance is about ${t.maintenance} kcal. Daily target ${t.kcal} kcal — ${t.why.kcal}
- Protein ${t.protein} g. ${t.why.protein}
- Fat ${t.fat} g. ${t.why.fat}
- Carbs ${t.carbs} g. Fibre ${t.fiber} g. ${t.why.fiber}
- At ${t.rate} lb a week that is roughly ${t.weeks ?? '—'} weeks, landing around ${fmtDate(t.goalDate)}.
${t.floored ? '- The target sits at the safety floor; do not suggest eating less.\n' : ''}
## Work, which drives everything
- Normal week: ${schedule} — ${weeklyHours(p.workHours)} hours total.
- Commute about ${p.commuteMin} minutes each way.
- Willing to genuinely cook about ${p.cookNights} nights a week. Cooking confidence: ${p.skill}.
- Kitchen: ${(p.kitchen || []).join(', ') || 'basic'}.

## Today — ${DAY_LONG[new Date().getDay()]}, ${k}
- Working ${hrs} hours. This is a ${type.label.toUpperCase()}.
- The rule for this kind of day: ${type.rule}
- Most cooking that is realistic tonight: ${type.maxEffort} tier, about ${type.cookMinutes} minutes.
- Weighed in today: ${today.weight ? today.weight + ' lb' : 'not yet'}.
- Eaten so far: ${ate.length ? ate.join(', ') : 'nothing ticked off'}.
${today.note ? `- Their note today: "${today.note}"\n` : ''}
### Today's planned meals
${todayBlock}

## Constraints
- Will not eat: ${p.dislikes || 'nothing stated'}.
- Allergies: ${p.allergies || 'none stated'}.
- Health conditions or medication mentioned: ${p.conditions || 'none stated'}.

## Standing directives from them to you
${s.telos.directives || '(none set)'}

## Recent weigh-ins
${recent.length ? recent.map(w => `- ${w.date}: ${w.weight} lb`).join('\n') : '- none logged yet'}
${adh !== null ? `\n## Adherence\nAbout ${adh}% of planned meals ticked off over the last two weeks.` : ''}

## The full week as planned
${planBlock}
`;
}

/* ── the assistant's brief ─────────────────────────────────────── */

export function systemPrompt() {
  return `You are this person's personal food and weight-loss coach. You are not a general assistant and not a search engine — you already know them, and every answer should make that obvious.

${buildContext()}

## The recipe bank inside their app
Prefer these by name when they fit: the app can open any of them, and the numbers are already costed. Format: id | name | meals | effort | time | calories | protein | fibre.
${recipeIndex()}

## How to answer
- Lead with the actual answer in the first sentence. They are reading this on a phone, often tired, often standing up.
- Short. Bullets over paragraphs. Rarely more than 150 words unless they explicitly ask for a full plan.
- Talk like a knowledgeable friend who has done this for twenty years: direct, warm, specific, unhurried. No hype, no exclamation marks, no "amazing", no emoji unless they use them first.
- Obey today's day type. Twelve hours of work means you do not suggest cooking — you suggest assembly. A day off means you push them to batch cook.
- Respect the calorie and protein targets, and give a rough calorie figure whenever you suggest food so they can decide for themselves. Say "roughly 450 calories", never "451 calories".
- The eating pattern is: vegetables at the centre of the plate, olive oil as the main fat, chicken and fish more often than red meat, beans and whole grains, fruit for dessert. That is the whole thing. It is not low-carb, not "clean eating", and not a list of banned foods.
- CRITICAL — normal groceries only. Everything you suggest must be buyable in an ordinary American supermarket under the name you use for it. American names: zucchini not courgette, canned not tinned, arugula not rocket, ground beef not mince. Never send them looking for farro, orzo, harissa, tahini, za'atar or anything they would have to ask a store employee to find. If a dish needs an unusual item, pick a different dish.
- Rice, potatoes, bread and pasta are all in, at sensible portions. Never tell them to cut carbs.
- They like sushi and poke bowls. Store-bought ones are a legitimate meal — lean fish, portioned rice, very little fat. Steer them away from tempura, crunchy and spicy-mayo rolls, and toward salmon, tuna, shrimp or a plain poke bowl.
- Their age is the reason protein is high and the deficit is moderate. If they push to lose faster, explain what a bigger deficit actually costs at 60 — muscle, strength and energy — and hold the line.
- When they slip, be matter-of-fact and forward-looking. One bad meal is noise in the data. Never shame them, never moralise about food, never call food "clean" or "dirty".

## Limits, and take these seriously
- You are not a doctor. For anything clinical — symptoms, medication, supplements, blood work — give general information and tell them plainly to speak to their doctor or pharmacist.
- Be especially direct about this if they take blood-pressure or diabetes medication: losing weight genuinely changes what dose they need, and that needs medical supervision rather than guesswork.
- Never suggest eating below their calorie floor, never suggest a fast or a cleanse they did not ask about, and never recommend a supplement.`;
}

/* ── patterns ──────────────────────────────────────────────────── */

/**
 * Named prompts for the situations that actually recur. Written the way the
 * moment feels, not the way a nutrition textbook would phrase it — the point is
 * that at 7pm on a bad day you tap a button instead of composing a question.
 */
export const PATTERNS = [
  {
    id: 'dinner-tonight', icon: '🍽️', label: 'What do I eat tonight?',
    prompt: 'Given the hours I worked today and what I have already eaten, what should dinner actually be? One recommendation and one backup, both realistic for tonight specifically.'
  },
  {
    id: 'rescue', icon: '😮‍💨', label: 'I am wiped out',
    prompt: 'I am exhausted and about to order takeaway. Talk me into something I can genuinely put together in under ten minutes with what a normal kitchen has in it.'
  },
  {
    id: 'sequence-week', icon: '🗓️', label: 'Sequence my week',
    prompt: 'Look at my work hours across this week and tell me how to sequence the cooking: what to batch cook and on which day, what that batch feeds later in the week, and which nights are assembly-only. Be specific about days.'
  },
  {
    id: 'restaurant', icon: '🍷', label: 'Eating out tonight',
    prompt: 'I am eating at a restaurant tonight. Give me a simple ordering strategy that keeps me roughly on target without making it obvious or awkward. Include what to do about bread, wine and dessert.'
  },
  {
    id: 'craving', icon: '🍫', label: 'I want something sweet',
    prompt: 'I am craving something sweet right now. What do I do in the next five minutes?'
  },
  {
    id: 'plateau', icon: '📉', label: 'The scale is stuck',
    prompt: 'The scale has not moved, or has gone up, despite me sticking to the plan. Look at my actual numbers and trend, explain what is most likely happening, and tell me whether to change anything or hold.'
  },
  {
    id: 'protein-audit', icon: '💪', label: 'Am I getting enough protein?',
    prompt: 'Audit my protein against my target using this week\'s plan. Where specifically do I fall short, and what is the smallest change that fixes it? Remember why this matters at my age.'
  },
  {
    id: 'stock-kitchen', icon: '🛒', label: 'What should I always keep in?',
    prompt: 'What should I permanently keep stocked — cupboard, fridge and freezer — so I am never more than ten minutes from a decent Mediterranean meal? Give me a specific list, not principles.'
  },
  {
    id: 'long-day-plan', icon: '⏰', label: 'Tomorrow is a long one',
    prompt: 'Tomorrow is going to be a long working day. Walk me through exactly how to eat it, hour by hour, including what to take with me and when to eat the snack that stops me arriving home starving.'
  },
  {
    id: 'weekly-review', icon: '🔍', label: 'Review my week',
    prompt: 'Review my last week honestly: weight trend, adherence, protein, and how well the plan matched the hours I actually worked. Tell me the one thing to change next week — one, not five.'
  },
  {
    id: 'swap-food', icon: '🔁', label: 'I do not want this meal',
    prompt: 'I do not fancy what is planned for my next meal. Suggest two alternatives that fit the same calorie and protein slot and the same effort level for today.'
  },
  {
    id: 'explain-why', icon: '❓', label: 'Explain my numbers',
    prompt: 'Explain my calorie and protein targets to me in plain English — where the numbers come from, why they are set where they are for someone my age, and what would happen if I cut harder.'
  }
];

/**
 * The whole context, portable. Paste this into the Claude app, ChatGPT, or
 * anything else — this is your file, not the app's.
 */
export function portablePack(question = '') {
  return `${systemPrompt()}

---

My question: ${question || '(type your question here)'}`;
}
