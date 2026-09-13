/* app.js — screens, wiring and everything the thumb touches. */

import * as S from './store.js';
import { ACTIVITY, targets, dayType, DAY_TYPES, EFFORT, weeklyHours, fmtDate, bmi } from './engine.js';
import { RECIPES, BY_ID, AISLE_LABEL, searchRecipes } from './recipes.js';
import { SLOTS, SLOT_LABEL, buildWeek, swap, retune, groceries, qty, headline, freezerNote, totals, served } from './planner.js';
import { PROBLEMS, PATTERNS, buildContext, portablePack } from './context.js';
import { MODELS, ask, testKey, AiError } from './ai.js';
import { SECTIONS, BY_SECTION, blankAnswers, derivePath, clock, span, CHRONO_LABEL } from './path.js';
import { parseHealth, sleepDebt, debtBand, roughDay, fmtH } from './health.js';
import { searchFoods, searchOnline } from './foods.js';
import { estimateFood } from './ai.js';

const BUILD = '2026-09-13b';

/* ── tiny helpers ──────────────────────────────────────────────── */

const $  = sel => document.querySelector(sel);
const $$ = sel => Array.from(document.querySelectorAll(sel));

const esc = str => String(str ?? '').replace(/[&<>"']/g, c =>
  ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

let toastTimer;
function toast(msg) {
  const t = $('#toast');
  t.textContent = msg;
  t.classList.add('on');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('on'), 2600);
}

async function copy(text, note = 'Copied') {
  try {
    await navigator.clipboard.writeText(text);
    toast(note);
  } catch {
    // iOS occasionally refuses clipboard writes outside a direct gesture.
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.cssText = 'position:fixed;opacity:0';
    document.body.appendChild(ta);
    ta.select();
    document.execCommand('copy');
    ta.remove();
    toast(note);
  }
}

function sheet(title, html) {
  $('#sheetBody').innerHTML = `
    <div class="sheet-grip"></div>
    <div class="sheet-head"><h2>${esc(title)}</h2><button class="x" data-close>Done</button></div>
    <div class="sheet-scroll">${html}</div>`;
  $('#sheet').classList.add('on');
  document.body.style.overflow = 'hidden';
}
function closeSheet() {
  $('#sheet').classList.remove('on');
  document.body.style.overflow = '';
}

/* Portions move in quarters. Say it the way a person would say it out loud. */
function portionLabel(n) {
  const words = { 0.75: 'three-quarter plate', 1.25: 'one and a quarter', 1.5: 'one and a half',
                  1.75: 'one and three-quarters', 2: 'double portion', 2.25: 'two and a quarter',
                  2.5: 'two and a half' };
  return words[n] || `${n}× portion`;
}

const pct = (a, b) => Math.max(0, Math.min(100, Math.round((a / Math.max(b, 1)) * 100)));

/* Minimal, safe markdown — escape first, then allow a handful of shapes. */
function md(text) {
  const lines = esc(text).split('\n');
  let html = '', inList = false;
  for (let line of lines) {
    line = line
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/(^|[\s(])\*(?!\s)([^*]+?)\*(?=[\s.,;:)!?]|$)/g, '$1<em>$2</em>')
      .replace(/`([^`]+)`/g, '<code>$1</code>');
    const bullet = line.match(/^\s*[-*•]\s+(.*)$/);
    const numbered = line.match(/^\s*\d+[.)]\s+(.*)$/);
    if (bullet || numbered) {
      if (!inList) { html += '<ul>'; inList = true; }
      html += `<li>${(bullet || numbered)[1]}</li>`;
      continue;
    }
    if (inList) { html += '</ul>'; inList = false; }
    if (/^\s*#{1,4}\s/.test(line)) html += `<p class="md-h">${line.replace(/^\s*#{1,4}\s/, '')}</p>`;
    else if (line.trim()) html += `<p>${line}</p>`;
  }
  if (inList) html += '</ul>';
  return html;
}

/* ── navigation ────────────────────────────────────────────────── */

let tab = 'today';

function show(name) {
  tab = name;
  window.scrollTo(0, 0);
  render();
}

function render() {
  const s = S.get();
  const active = s.onboarded ? tab : 'onboard';

  // Do this on every render, not only on a tab tap: a returning visitor never
  // taps anything before the first paint, and without this the app booted with
  // every view hidden and showed them a blank page.
  $$('.view').forEach(v => v.classList.toggle('on', v.id === `view-${active}`));
  $$('#tabbar button').forEach(b => b.classList.toggle('on', b.dataset.tab === tab));
  $('#tabbar').hidden = !s.onboarded;

  if (!s.onboarded) return renderOnboard();
  ({ today: renderToday, week: renderWeek, recipes: renderRecipes, coach: renderCoach, me: renderMe }[tab] || renderToday)();
}

/* ── onboarding ────────────────────────────────────────────────── */

let step = 0;
let draft = null;
let obMode = 'full';   // 'full' = first-run setup; 'path' = retaking just the questionnaire

const QUESTION_STEPS = SECTIONS.map(sec => () => questionStep(sec));

function renderOnboard() {
  const s = S.get();
  draft ||= {
    profile: structuredClone(s.profile),
    telos: structuredClone(s.telos),
    path: s.path?.answers ? structuredClone(s.path.answers) : blankAnswers()
  };
  const p = draft.profile;
  const steps = obMode === 'path'
    ? [...QUESTION_STEPS, pathStep]
    : [welcomeStep, aboutStep, workStep, kitchenStep, problemsStep, limitsStep, ...QUESTION_STEPS, pathStep, resultStep];
  const total = steps.length;

  $('#onboardHost').innerHTML = `
    <div class="ob">
      <div class="ob-bar"><i style="width:${((step) / (total - 1)) * 100}%"></i></div>
      ${steps[step](p)}
    </div>`;

  const host = $('#onboardHost');
  host.querySelectorAll('[data-next]').forEach(b => b.onclick = () => {
    if (!collect()) return;
    step = Math.min(step + 1, total - 1);
    renderOnboard();
  });
  host.querySelectorAll('[data-back]').forEach(b => b.onclick = () => {
    collect();
    step = Math.max(0, step - 1);
    renderOnboard();
  });
  host.querySelectorAll('[data-problem]').forEach(b => b.onclick = () => {
    const id = b.dataset.problem;
    const list = draft.telos.problems;
    const i = list.indexOf(id);
    if (i >= 0) list.splice(i, 1); else list.push(id);
    b.classList.toggle('on');
  });
  const finish = host.querySelector('[data-finish]');
  if (finish && obMode === 'path') finish.onclick = () => {
    collect();
    S.set(st => { st.path = { answers: draft.path, takenAt: S.key() }; });
    draft = null; step = 0; obMode = 'full';
    show('me');
    toast('Path updated.');
  };
  else if (finish) finish.onclick = () => {
    collect();
    S.set(st => {
      st.profile = draft.profile;
      st.telos = draft.telos;
      st.profile.startWeight = draft.profile.weight;
      st.path = { answers: draft.path, takenAt: S.key() };
      st.onboarded = true;
      st.plan = buildWeek(draft.profile, targets(draft.profile).kcal, Math.floor(Math.random() * 1e6));
      st.grocery = { checked: [], builtFor: st.plan.start };
    });
    S.setDay(S.key(), { weight: draft.profile.weight, waist: draft.profile.startWaist || null });
    draft = null;
    show('today');
    toast('Week built. Start with today.');
  };

  function collect() {
    host.querySelectorAll('[data-field]').forEach(inp => {
      const path = inp.dataset.field;
      const numeric = inp.type === 'number' || inp.type === 'range' || inp.dataset.num !== undefined;
      let val = numeric ? (inp.value === '' ? null : Number(inp.value)) : inp.value;
      if (path.startsWith('workHours.')) draft.profile.workHours[Number(path.split('.')[1])] = val;
      else if (path.startsWith('telos.')) draft.telos[path.split('.')[1]] = val;
      else draft.profile[path] = val;
    });
    host.querySelectorAll('input[data-q]').forEach(inp => { draft.path[inp.dataset.q] = inp.value || inp.dataset.def; });
    const sec = host.querySelector('[data-section]')?.dataset.section;
    if (sec) {
      const missing = BY_SECTION(sec).find(q => !q.multi && q.type !== 'time' && !draft.path[q.id]);
      if (missing) { toast('One more to answer on this page.'); return false; }
    }
    if (obMode === 'full' && step === 1) {
      const p2 = draft.profile;
      if (!(p2.age >= 18 && p2.age <= 100)) { toast('Age looks wrong.'); return false; }
      if (!(p2.weight > 60 && p2.weight < 700)) { toast('Current weight looks wrong.'); return false; }
      if (!(p2.goalWeight > 60 && p2.goalWeight < p2.weight)) { toast('Goal weight must be below your current weight.'); return false; }
    }
    return true;
  }
}

const navRow = (backLabel = 'Back', nextLabel = 'Continue') => `
  <div class="ob-nav">
    ${step > 0 ? `<button class="btn ghost" data-back>${backLabel}</button>` : '<span></span>'}
    <button class="btn primary" data-next>${nextLabel}</button>
  </div>`;

function welcomeStep() {
  return `
    <div class="ob-hero">
      <div class="ob-mark">🫒</div>
      <h1>Plate</h1>
      <p class="lede">Ordinary food from an ordinary grocery store, planned around the hours you actually work — not the hours a meal plan wishes you worked.</p>
      <ul class="ob-points">
        <li><b>Nothing unusual to buy.</b> Chicken, ground beef, eggs, canned tuna, salmon, shrimp, pork, vegetables, rice and potatoes. That is the whole shopping list.</li>
        <li><b>Your week is a supply chain.</b> The batch cook lands on your lightest day and feeds your heaviest ones.</li>
        <li><b>Protein stays high.</b> Past 55 the risk is not failing to lose weight, it is losing muscle along with the fat.</li>
        <li><b>The deficit stays moderate.</b> This is built for the version of you that is still doing it in eight months.</li>
      </ul>
      <p class="fine">Everything stays on this phone. There is no account and no server. General guidance only — it is not medical advice, and anyone on blood-pressure or diabetes medication should tell their doctor they are losing weight, because the dose often needs to change.</p>
    </div>
    ${navRow('', 'Set it up')}`;
}

function aboutStep(p) {
  const ft = Math.floor(p.heightIn / 12), inch = p.heightIn % 12;
  return `
    <h1 class="ob-h">About you</h1>
    <p class="lede">This sets your calorie and protein targets. Be honest rather than optimistic.</p>
    <label class="fld"><span>Name (optional)</span><input data-field="name" value="${esc(p.name)}" placeholder="What should the coach call you?"></label>
    <div class="row2">
      <label class="fld"><span>Age</span><input data-field="age" type="number" inputmode="numeric" value="${p.age}"></label>
      <label class="fld"><span>Sex</span><select data-field="sex">
        <option value="male" ${p.sex === 'male' ? 'selected' : ''}>Male</option>
        <option value="female" ${p.sex === 'female' ? 'selected' : ''}>Female</option>
      </select></label>
    </div>
    <label class="fld"><span>Height</span>
      <select data-field="heightIn" data-num>
        ${Array.from({ length: 26 }, (_, i) => 58 + i).map(v =>
          `<option value="${v}" ${v === p.heightIn ? 'selected' : ''}>${Math.floor(v / 12)}ft ${v % 12}in</option>`).join('')}
      </select>
    </label>
    <div class="row2">
      <label class="fld"><span>Weight now (lb)</span><input data-field="weight" type="number" inputmode="decimal" value="${p.weight}"></label>
      <label class="fld"><span>Goal weight (lb)</span><input data-field="goalWeight" type="number" inputmode="decimal" value="${p.goalWeight}"></label>
    </div>
    <label class="fld"><span>Waist at the navel, inches (optional but worth it)</span><input data-field="startWaist" type="number" inputmode="decimal" step="0.25" value="${p.startWaist ?? ''}" placeholder="Tape at the navel, relaxed, breathing out"></label>
    <label class="fld"><span>Activity outside work</span>
      <select data-field="activity">
        ${Object.entries(ACTIVITY).map(([k, v]) =>
          `<option value="${k}" ${p.activity === k ? 'selected' : ''}>${v.label} — ${v.hint}</option>`).join('')}
      </select>
    </label>
    <label class="fld"><span>How fast (lb per week)</span>
      <select data-field="rate" data-num>
        <option value="0.5" ${p.rate === 0.5 ? 'selected' : ''}>0.5 — gentle, barely noticeable</option>
        <option value="0.75" ${p.rate === 0.75 ? 'selected' : ''}>0.75 — steady</option>
        <option value="1" ${p.rate === 1 ? 'selected' : ''}>1.0 — recommended</option>
        <option value="1.5" ${p.rate === 1.5 ? 'selected' : ''}>1.5 — aggressive, gets capped</option>
      </select>
    </label>
    <p class="fine">Currently ${ft}ft ${inch}in. Anything faster than about 1 lb a week gets capped automatically — at your age a deeper cut mostly costs muscle.</p>
    ${navRow()}`;
}

function workStep(p) {
  return `
    <h1 class="ob-h">The hours you work</h1>
    <p class="lede">This is the part most diet apps never ask. It decides which meals you get offered, which day the batch cook lands on, and how the day's calories are split.</p>
    <div class="hours">
      ${S.DAY_LONG.map((d, i) => `
        <label class="hour-row">
          <span>${d}</span>
          <input data-field="workHours.${i}" type="number" inputmode="numeric" min="0" max="18" value="${p.workHours[i]}">
          <em>hrs</em>
        </label>`).join('')}
    </div>
    <label class="fld"><span>Commute, each way (minutes)</span><input data-field="commuteMin" type="number" inputmode="numeric" value="${p.commuteMin}"></label>
    <p class="fine">A typical week for you as entered: ${weeklyHours(p.workHours)} hours. Put in what a normal week looks like — you can override any individual day later when reality disagrees.</p>
    ${navRow()}`;
}

function kitchenStep(p) {
  const kit = ['stovetop', 'oven', 'microwave', 'slow cooker', 'air fryer', 'blender'];
  return `
    <h1 class="ob-h">Cooking, realistically</h1>
    <p class="lede">Under-promise here. A plan built for three cooking nights that you actually do beats a plan built for six that you abandon.</p>
    <label class="fld"><span>Nights a week you will genuinely cook</span>
      <select data-field="cookNights" data-num>
        ${[0,1,2,3,4,5,6,7].map(n => `<option value="${n}" ${p.cookNights === n ? 'selected' : ''}>${n} ${n === 1 ? 'night' : 'nights'}</option>`).join('')}
      </select>
    </label>
    <label class="fld"><span>How confident are you cooking?</span>
      <select data-field="skill">
        <option value="basic" ${p.skill === 'basic' ? 'selected' : ''}>Basic — I can make eggs and toast</option>
        <option value="ok" ${p.skill === 'ok' ? 'selected' : ''}>Fine — I can follow a recipe</option>
        <option value="confident" ${p.skill === 'confident' ? 'selected' : ''}>Confident — I cook without one</option>
      </select>
    </label>
    <p class="fld-label">Kitchen</p>
    <div class="chips">
      ${kit.map(k => `<button type="button" class="chip kit ${p.kitchen.includes(k) ? 'on' : ''}" data-kit="${k}">${k}</button>`).join('')}
    </div>
    ${navRow()}`;
}

function problemsStep() {
  const chosen = draft.telos.problems;
  return `
    <h1 class="ob-h">What actually goes wrong</h1>
    <p class="lede">Pick everything that sounds like you. This shapes the coaching more than any calorie number does — someone whose evenings undo the day needs completely different advice from someone who skips lunch.</p>
    <div class="chips col">
      ${PROBLEMS.map(x => `
        <button type="button" class="chip wide ${chosen.includes(x.id) ? 'on' : ''}" data-problem="${x.id}">
          <b>${esc(x.label)}</b><i>${esc(x.detail)}</i>
        </button>`).join('')}
    </div>
    ${navRow()}`;
}

function limitsStep(p) {
  return `
    <h1 class="ob-h">Anything to avoid</h1>
    <p class="lede">Anything you list here is filtered out of every plan the app builds, permanently.</p>
    <label class="fld"><span>Foods you will not eat</span><input data-field="dislikes" value="${esc(p.dislikes)}" placeholder="sardines, aubergine, olives"></label>
    <label class="fld"><span>Allergies</span><input data-field="allergies" value="${esc(p.allergies)}" placeholder="shellfish, walnuts"></label>
    <label class="fld"><span>Health conditions or medication worth knowing</span><textarea data-field="conditions" rows="3" placeholder="Type 2 diabetes, on metformin. High blood pressure.">${esc(p.conditions)}</textarea></label>
    <label class="fld"><span>Standing instructions to your coach</span><textarea data-field="telos.directives" rows="3" placeholder="Don't nag me about wine. I cook for two. Keep answers very short.">${esc(draft.telos.directives)}</textarea></label>
    <p class="fine">Anything clinical is passed to the coach so it can be careful — it is not a substitute for your doctor, and the app will keep saying so.</p>
    ${navRow()}`;
}

function questionStep(sec) {
  const a = draft.path;
  return `
    <h1 class="ob-h">${esc(sec.title)}</h1>
    <p class="lede">${esc(sec.lede)}</p>
    <div data-section="${sec.id}">
      ${BY_SECTION(sec.id).map(q => `
        <div class="qz">
          <p class="fld-label">${esc(q.q)}</p>
          ${q.type === 'time'
            ? `<input class="time" type="time" data-q="${q.id}" data-def="${q.def}" value="${esc(a[q.id] || q.def)}">`
            : `<div class="chips">${q.opts.map(([v, label]) => {
                const on = q.multi ? (a[q.id] || []).includes(v) : a[q.id] === v;
                return `<button type="button" class="chip q ${on ? 'on' : ''}" data-qid="${q.id}" data-v="${v}" ${q.multi ? 'data-multi' : ''}>${esc(label)}</button>`;
              }).join('')}</div>`}
        </div>`).join('')}
    </div>
    ${navRow()}`;
}

function pathStep() {
  const path = derivePath(draft.path, draft.profile);
  const last = obMode === 'path';
  return `
    <h1 class="ob-h">Your path</h1>
    <p class="lede">Built from your answers. It goes into your context file, so the coach plans around it — and you can retake the questionnaire any time from Me.</p>
    ${pathCard(path)}
    <div class="ob-nav">
      <button class="btn ghost" data-back>Back</button>
      ${last ? '<button class="btn primary" data-finish>Save my path</button>' : '<button class="btn primary" data-next>Continue</button>'}
    </div>`;
}

/** The path, as cards. Shared by onboarding and the Me screen. */
function pathCard(path) {
  if (!path) return '<div class="card"><p>Answer the questions first and the path appears here.</p></div>';
  const e = path.energy;
  const dayStart = e.grog[0], dayEnd = e.bed;
  const total = ((dayEnd - dayStart) + 1440) % 1440 || 1440;
  const seg = (range, cls, label) => {
    const from = ((range[0] - dayStart) + 1440) % 1440, len = Math.max(0, range[1] - range[0]);
    return `<i class="${cls}" style="left:${(from / total) * 100}%;width:${(len / total) * 100}%" title="${label}"></i>`;
  };
  return `
    <div class="card path-head">
      <p class="path-headline">${esc(path.headline)}</p>
      <p class="fine">You are ${CHRONO_LABEL[path.chronotype]}.</p>
    </div>

    <div class="card">
      <h3>Energy through the day</h3>
      <div class="energy">
        ${seg(e.grog, 'grog', 'groggy')}
        ${seg(e.morningPeak, 'peak', 'morning peak')}
        ${seg(e.dip, 'dip', 'slump')}
        ${seg(e.eveningPeak, 'peak', 'second wind')}
        ${seg(e.windDown, 'wind', 'wind down')}
      </div>
      <div class="energy-key">
        <span><i class="peak"></i>Peak ${span(e.morningPeak[0], e.morningPeak[1])}</span>
        <span><i class="dip"></i>Slump ${span(e.dip[0], e.dip[1])}</span>
        <span><i class="peak"></i>Second wind ${span(e.eveningPeak[0], e.eveningPeak[1])}</span>
        <span><i class="wind"></i>Wind down ${clock(e.windDown[0])}</span>
      </div>
    </div>

    <div class="card path-sec">
      <h3>Your day, in order</h3>
      <p class="fine">Each window is good for some things and bad for others. Put things where they belong and you stop fighting your own energy.</p>
      <ul class="dayplan">
        ${path.schedule.map(b => `<li><time>${esc(span(b.at[0], b.at[1]))}</time><div><b>${esc(b.label)}</b><p>${esc(b.do)}</p></div></li>`).join('')}
      </ul>
    </div>

    <div class="card path-sec">
      <h3>Waking</h3>
      <div class="path-times">
        <div><b>${clock(path.sleep.wake)}</b><span>wake, every day</span></div>
        <div><b>${clock(path.sleep.bed)}</b><span>in bed by</span></div>
        <div><b>${clock(path.sleep.lastCoffee)}</b><span>last coffee</span></div>
      </div>
      <ul>${path.sleep.notes.map(n => `<li>${esc(n)}</li>`).join('')}</ul>
    </div>

    <div class="card path-sec">
      <h3>Fitness</h3>
      <div class="path-times">
        <div><b>${path.fitness.strengthSessions}x</b><span>strength a week</span></div>
        <div><b>${path.fitness.minutes} min</b><span>per session</span></div>
        <div><b>${(path.fitness.stepTarget / 1000)}k</b><span>steps a day</span></div>
      </div>
      <ul>${path.fitness.notes.map(n => `<li>${esc(n)}</li>`).join('')}</ul>
    </div>

    <div class="card path-sec">
      <h3>Food</h3>
      <div class="path-times">
        <div><b>${clock(path.food.firstMeal)}</b><span>first protein by</span></div>
        <div><b>${esc(path.food.bigMeal)}</b><span>the big meal</span></div>
        <div><b>${clock(path.food.kitchenCloses)}</b><span>kitchen closes</span></div>
      </div>
      <ul>${path.food.notes.map(n => `<li>${esc(n)}</li>`).join('')}</ul>
    </div>`;
}

function resultStep(p) {
  const t = targets(p);
  return `
    <h1 class="ob-h">Your numbers</h1>
    <div class="target-grid">
      <div class="tgt big"><b>${t.kcal}</b><span>calories a day</span></div>
      <div class="tgt"><b>${t.protein}g</b><span>protein</span></div>
      <div class="tgt"><b>${t.fat}g</b><span>fat</span></div>
      <div class="tgt"><b>${t.carbs}g</b><span>carbs</span></div>
      <div class="tgt"><b>${t.fiber}g</b><span>fibre</span></div>
    </div>
    <div class="card explain">
      <p><b>Calories.</b> ${esc(t.why.kcal)}</p>
      <p><b>Protein.</b> ${esc(t.why.protein)}</p>
      <p><b>Fat.</b> ${esc(t.why.fat)}</p>
      <p><b>The timeline.</b> ${t.toLose} lb to lose at about ${t.rate} lb a week — roughly ${t.weeks} weeks, landing near ${fmtDate(t.goalDate)}. Your BMI today is ${bmi(p.weight, p.heightIn)}.</p>
    </div>
    <div class="ob-nav">
      <button class="btn ghost" data-back>Back</button>
      <button class="btn primary" data-finish>Build my week</button>
    </div>`;
}

/* ── today ─────────────────────────────────────────────────────── */

/* Today reads top to bottom the way a morning does: what kind of day this is
   and how you slept (one sentence), where you are in your own energy right
   now, the check-in (weight, sleep, the weekly tape), then the food. */

let checkinOpen = null;   // null = decide from what is logged; true/false = the user chose

function planDay(k = S.key()) {
  const s = S.get();
  if (!s.plan) return null;
  const i = s.plan.days.findIndex(d => d.date === k);
  return i < 0 ? null : { day: s.plan.days[i], index: i };
}

function todayPath() {
  const s = S.get();
  return derivePath(s.path?.answers, s.profile);
}

function sleepState(k) {
  const p = S.get().profile;
  const ln = S.lastNight(k);
  const debt = sleepDebt(S.nights(k), p.sleepNeedMin || 450);
  return { ln, debt, band: debtBand(debt.debtMin), rough: roughDay(ln, debt.debtMin) };
}

/** Which window of the path we are in right now, and what is next. */
function nowWindow(path) {
  if (!path) return null;
  const d = new Date();
  let now = d.getHours() * 60 + d.getMinutes();
  if (now < path.sleep.wake - 120) now += 1440;      // small hours belong to yesterday's timeline
  const sch = path.schedule;
  if (now >= path.sleep.bed) return { label: 'Past bedtime', do: `You planned to be asleep by ${clock(path.sleep.bed)}. Tomorrow starts with how tonight ends.`, until: null, next: null };
  if (now < sch[0].at[0]) return { label: 'Before the alarm', do: `Up at ${clock(path.sleep.wake)}. If you are awake now, daylight and a glass of water beat lying there.`, until: sch[0].at[0], next: sch[0] };
  for (let i = 0; i < sch.length; i++) {
    const b = sch[i];
    if (now >= b.at[0] && now < b.at[1]) return { ...b, until: b.at[1], next: sch[i + 1] || null };
  }
  const last = sch[sch.length - 1];
  return { ...last, until: last.at[1], next: null };
}

/** The one sentence at the top. Sleep first, because it changes the day. */
function briefing(day, type, ss, path) {
  if (ss.rough && path) {
    const e = path.energy;
    return `${cap(ss.rough.why)} on a ${type.label.toLowerCase()}. Hunger will come early and late — the planned snack at ${clock(e.dip[0] + 30)}, dinner on time, kitchen closed at ${clock(path.food.kitchenCloses)}. Walk today, do not lift.`;
  }
  if (ss.rough) return `${cap(ss.rough.why)} on a ${type.label.toLowerCase()}. Expect stronger pulls mid-afternoon and after dinner; eat the planned snack and keep dinner on plan.`;
  return headline(day);
}
const cap = s => s.charAt(0).toUpperCase() + s.slice(1);

function sleepChip(ss) {
  if (!ss.ln && !ss.debt.known) return `<button class="chip-btn muted" id="logSleepBtn">Sleep not logged</button>`;
  const tone = ss.rough ? 'bad' : ss.band.tone;
  const slept = ss.ln ? `Slept ${fmtH(ss.ln.sleepMin)}` : 'No sleep data last night';
  return `<button class="chip-btn ${tone}" id="logSleepBtn">${slept} · debt ${fmtH(ss.debt.debtMin)}</button>`;
}

function briefingCard(day, type, hrs, ss, path) {
  const nw = nowWindow(path);
  const e = path?.energy;
  let energyRow = '';
  if (path && e) {
    const dayStart = e.grog[0], total = ((e.bed - dayStart) + 1440) % 1440 || 1440;
    const seg = (r, cls) => `<i class="${cls}" style="left:${(((r[0] - dayStart) + 1440) % 1440) / total * 100}%;width:${Math.max(0, r[1] - r[0]) / total * 100}%"></i>`;
    const d = new Date();
    let now = d.getHours() * 60 + d.getMinutes();
    if (now < dayStart - 120) now += 1440;
    const nowPct = Math.max(0, Math.min(100, ((now - dayStart) / total) * 100));
    energyRow = `
      <div class="energy slim">
        ${seg(e.grog, 'grog')}${seg(e.morningPeak, 'peak')}${seg(e.dip, 'dip')}${seg(e.eveningPeak, 'peak')}${seg(e.windDown, 'wind')}
        <b class="now" style="left:${nowPct}%"></b>
      </div>
      <div class="now-row">
        <div><span class="now-label">Now · ${esc(nw.label)}${nw.until ? ` until ${clock(nw.until)}` : ''}</span><p>${esc(nw.do)}</p></div>
      </div>
      ${nw.next ? `<p class="next">Next: ${esc(nw.next.label.toLowerCase())} at ${clock(nw.next.at[0])} · kitchen closes ${clock(path.food.kitchenCloses)} · bed ${clock(path.sleep.bed)}</p>` : ''}`;
  } else {
    energyRow = `<button class="rowbtn inset" id="openPathBtn"><span>Take the two-minute questionnaire to see your energy through the day</span><i>›</i></button>`;
  }
  return `
    <div class="daybar" style="--tone:${type.colour}">
      <div class="daybar-top">
        <div class="pills"><span class="pill" style="background:${type.colour}">${esc(type.label)}</span>${sleepChip(ss)}</div>
        <button class="hours-btn" id="editHours">${hrs}h ✎</button>
      </div>
      <p class="rule">${esc(briefing(day, type, ss, path))}</p>
      ${freezerNote(day) ? `<p class="freeze">${esc(freezerNote(day))}</p>` : ''}
      ${energyRow}
    </div>`;
}

/** Weight, sleep, the weekly tape — one card, collapsed once it is done. */
function checkinCard(k, log, ss) {
  const waistDue = S.waistDue() || log.waist;
  const done = log.weight && (log.sleepMin > 0) && (!S.waistDue() || log.waist);
  const open = checkinOpen === null ? !done : checkinOpen;
  const trendLine = `Trend ${S.trend()} lb${S.trendDelta() !== null ? ` (${S.trendDelta() > 0 ? '+' : ''}${S.trendDelta()} over 14 days)` : ''}`;
  const waistNow = S.waistNow(), wd = S.waistDelta();
  const waistLine = waistNow ? `waist ${waistNow} in${wd !== null ? ` (${wd > 0 ? '+' : ''}${wd})` : ''}` : 'waist not measured';
  const summary = [
    log.weight ? `${log.weight} lb` : 'no weigh-in',
    log.sleepMin > 0 ? `slept ${fmtH(log.sleepMin)}${log.sleepSource === 'watch' ? ' ⌚' : ''}` : 'sleep not logged',
    log.waist ? `waist ${log.waist} in` : null
  ].filter(Boolean).join(' · ');

  if (!open) {
    return `
    <div class="card checkin">
      <div class="ci-head"><h3>This morning</h3><button class="link" id="ciToggle">Edit</button></div>
      <p class="ci-sum">${esc(summary)}</p>
      <p class="fine">${esc(trendLine)} · ${esc(waistLine)}.</p>
    </div>`;
  }
  return `
    <div class="card checkin">
      <div class="ci-head"><h3>This morning</h3>${done ? '<button class="link" id="ciToggle">Done</button>' : ''}</div>
      <div class="ci-grid ${waistDue ? 'three' : ''}">
        <label><span>Weight (lb)</span><input id="wtInput" type="number" inputmode="decimal" step="0.1" placeholder="${S.trend()}" value="${log.weight ?? ''}"></label>
        <label><span>Slept (hours)</span><input id="slInput" type="number" inputmode="decimal" step="0.25" placeholder="7.5" value="${log.sleepMin > 0 ? Math.round(log.sleepMin / 15) / 4 : ''}"></label>
        ${waistDue ? `<label><span>Waist (in)</span><input id="waistInput" type="number" inputmode="decimal" step="0.25" placeholder="${waistNow ?? 'navel'}" value="${log.waist ?? ''}"></label>` : ''}
      </div>
      <div class="ci-actions">
        <button class="btn primary" id="ciSave">Save</button>
        <button class="btn ghost" id="pasteWatch">⌚ Paste from Watch</button>
      </div>
      <p class="fine">${esc(trendLine)}. ${waistDue ? 'Tape at the navel, relaxed, breathing out — once a week. ' : ''}${ss.debt.known ? `Sleep debt ${fmtH(ss.debt.debtMin)} over ${ss.debt.known} known nights. ` : ''}<a href="#" id="watchHelp">How the Watch button works</a>.</p>
    </div>`;
}

function renderToday() {
  const s = S.get();
  const p = s.profile;
  const t = targets(p);
  const k = S.key();
  const log = S.day(k);
  const hrs = S.hoursOn(k);
  const type = dayType(hrs);
  const found = planDay(k);
  const path = todayPath();
  const ss = sleepState(k);

  $('#hdrTitle').textContent = 'Today';
  $('#hdrSub').textContent = new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' });

  if (!found) {
    $('#todayHost').innerHTML = `
      <div class="card center">
        <p>There is no plan covering today yet.</p>
        <button class="btn primary" id="mkweek">Build this week</button>
      </div>`;
    $('#mkweek').onclick = regenerate;
    return;
  }

  const { day, index } = found;
  const eaten = SLOTS.filter(sl => log.ate?.[sl]);
  const ateTotals = eaten.reduce((acc, sl) => {
    const v = served(day.slots[sl]);
    if (v) { acc.kcal += v.kcal; acc.protein += v.protein; }
    return acc;
  }, { kcal: 0, protein: 0 });
  const ext = S.extrasTotal(k);
  ateTotals.kcal += ext.kcal;
  ateTotals.protein += ext.protein;
  const dayTot = totals(day);

  $('#todayHost').innerHTML = `
    ${dayStrip(k)}
    ${briefingCard(day, type, hrs, ss, path)}
    ${checkinCard(k, log, ss)}

    <div class="card rings">
      <div class="ring-row">
        <div class="metric">
          <div class="bar"><i style="width:${pct(ateTotals.kcal, t.kcal)}%"></i></div>
          <b>${ateTotals.kcal}</b><span>of ${t.kcal} kcal eaten</span>
        </div>
        <div class="metric">
          <div class="bar protein"><i style="width:${pct(ateTotals.protein, t.protein)}%"></i></div>
          <b>${ateTotals.protein}g</b><span>of ${t.protein}g protein</span>
        </div>
      </div>
      <p class="fine">Everything planned today comes to ${dayTot.kcal} kcal and ${dayTot.protein}g protein, with about ${dayTot.minutes} minutes at the stove.</p>
    </div>

    ${SLOTS.map(sl => mealCard(day, index, sl, log)).join('')}
    ${alsoLoggedCard(k, log)}

    <div class="card">
      <h3>Note to your coach</h3>
      <textarea id="dayNote" rows="2" placeholder="Client dinner tonight. Knee is sore.">${esc(log.note)}</textarea>
      <button class="btn ghost sm" id="noteSave">Save note</button>
    </div>

    <button class="fab" id="addBtn" aria-label="Add food or exercise">+</button>`;

  $('#addBtn').onclick = () => openAdd(k);
  $$('[data-rm-extra]').forEach(b => b.onclick = () => { S.removeExtra(k, Number(b.dataset.rmExtra)); render(); });
  $$('[data-rm-workout]').forEach(b => b.onclick = () => { S.removeWorkout(k, Number(b.dataset.rmWorkout)); render(); });
  $$('[data-day]').forEach(b => b.onclick = () => show('week'));

  const ps = $('#openPathBtn'); if (ps) ps.onclick = openPath;
  $('#editHours').onclick = () => askHours(index, k);
  $('#logSleepBtn').onclick = () => { checkinOpen = true; render(); $('#slInput')?.focus(); };
  const tg = $('#ciToggle'); if (tg) tg.onclick = () => { checkinOpen = tg.textContent === 'Edit'; render(); };
  const save = $('#ciSave');
  if (save) save.onclick = () => {
    const patch = {};
    const w = Number($('#wtInput').value);
    if ($('#wtInput').value) { if (w < 60 || w > 700) return toast('That weight looks wrong.'); patch.weight = w; }
    const sl = Number($('#slInput').value);
    if ($('#slInput').value) { if (sl < 1 || sl > 16) return toast('Sleep in hours, please.'); if (log.sleepSource !== 'watch' || Math.round(sl * 60) !== log.sleepMin) { patch.sleepMin = Math.round(sl * 60); patch.sleepSource = 'manual'; } }
    const wi = $('#waistInput');
    if (wi && wi.value) { const v = Number(wi.value); if (v < 20 || v > 80) return toast('That waist looks wrong.'); patch.waist = v; }
    if (!Object.keys(patch).length) return toast('Nothing to save yet.');
    S.setDay(k, patch);
    S.set(st => { if (patch.weight) st.profile.weight = patch.weight; if (patch.waist && !st.profile.startWaist) st.profile.startWaist = patch.waist; });
    checkinOpen = null;
    toast('Logged.');
    render();
  };
  const pw = $('#pasteWatch'); if (pw) pw.onclick = pasteFromWatch;
  const wh = $('#watchHelp'); if (wh) wh.onclick = e => { e.preventDefault(); openWatch(); };
  $('#noteSave').onclick = () => {
    S.setDay(k, { note: $('#dayNote').value });
    toast('Saved.');
  };

  $$('[data-eat]').forEach(b => b.onclick = () => {
    const sl = b.dataset.eat;
    const cur = S.day(k).ate || {};
    S.setDay(k, { ate: { ...cur, [sl]: !cur[sl] } });
    render();
  });
  $$('[data-open]').forEach(b => b.onclick = () => openRecipe(b.dataset.open));
  $$('[data-swap]').forEach(b => b.onclick = () => {
    const sl = b.dataset.swap;
    const s2 = S.get();
    const chosen = swap(s2.plan, index, sl, s2.profile);
    if (!chosen) return toast('Nothing else fits that slot today.');
    S.save();
    toast(`Swapped to ${chosen.name}.`);
    render();
  });
}

/* ── the week strip, the + button and the four ways to log ─────── */

/** How many meals a day has: planned slots ticked, plus anything added with +. */
function mealsLogged(k) {
  const d = S.get().log[k];
  if (!d) return 0;
  return Object.values(d.ate || {}).filter(Boolean).length + (d.extras || []).length;
}

/** Mon → Sun. Today ringed; a day goes green at two meals. */
function dayStrip(k) {
  const today = S.parse(k);
  const mon = S.addDays(today, -((today.getDay() + 6) % 7));
  return `<div class="daystrip">${Array.from({ length: 7 }, (_, i) => {
    const d = S.addDays(mon, i), dk = S.key(d);
    const n = mealsLogged(dk);
    const cls = [dk === k ? 'today' : '', n >= 2 ? 'full' : n === 1 ? 'half' : '', d > today ? 'future' : ''].join(' ');
    return `<button class="dayb ${cls}" data-day="${dk}"><span>${['Mon','Tue','Wed','Thu','Fri','Sat','Sun'][i]}</span><b>${d.getDate()}</b></button>`;
  }).join('')}</div>`;
}

function alsoLoggedCard(k, log) {
  const extras = log.extras || [], workouts = log.workouts || [];
  if (!extras.length && !workouts.length) return '';
  const row = (icon, name, sub, kcal, rm) => `
    <div class="also">
      <span class="ic">${icon}</span>
      <div><b>${esc(name)}</b><span>${esc(sub)}</span></div>
      <em>${kcal}</em>
      <button class="x" ${rm} aria-label="Remove">×</button>
    </div>`;
  return `
    <div class="card">
      <h3>Also logged</h3>
      ${extras.map((e, i) => row('🍴', `${e.name}${e.qty && e.qty !== 1 ? ` ×${e.qty}` : ''}`, `${e.unit || ''}${e.at ? ` · ${e.at}` : ''}`, `${Math.round(e.kcal * (e.qty || 1))} kcal`, `data-rm-extra="${i}"`)).join('')}
      ${workouts.map((w, i) => row(w.type === 'strength' ? '🏋️' : w.type === 'walk' ? '🚶' : w.type === 'cardio' ? '🚴' : w.type === 'sport' ? '🎾' : '⚡', w.name, `${w.minutes} min · ${w.source === 'watch' ? 'from the Watch' : 'typed in'}`, w.kcal ? `~${w.kcal} kcal` : '', `data-rm-workout="${i}"`)).join('')}
      ${workouts.length ? '<p class="fine">Exercise calories are shown, not added back to the food budget — your activity level already accounts for them.</p>' : ''}
    </div>`;
}

/* The + sheet. One entry point, four ways in; each re-renders the same
   sheet body so the Back button always works. */
let addCtl = null;   // AbortController for an online search in flight

function openAdd(k, mode = null) {
  if (addCtl) { addCtl.abort(); addCtl = null; }
  const back = `<button class="link" id="addBack">‹ Back</button>`;
  if (!mode) {
    sheet('Add', `
      <div class="add-grid">
        <button class="add-opt" data-mode="search"><span>🔍</span><b>Food database</b><i>Search common foods, or online for packaged ones</i></button>
        <button class="add-opt" data-mode="scan"><span>📷</span><b>Scan food</b><i>Take a photo and let the coach estimate it</i></button>
        <button class="add-opt" data-mode="saved"><span>⭐</span><b>Saved foods</b><i>Things you log often, one tap</i></button>
        <button class="add-opt" data-mode="exercise"><span>🏋️</span><b>Log exercise</b><i>Typed in, or from the Watch</i></button>
      </div>`);
    $$('[data-mode]').forEach(b => b.onclick = () => openAdd(k, b.dataset.mode));
    return;
  }
  if (mode === 'search') return addSearch(k, back);
  if (mode === 'scan') return addScan(k, back);
  if (mode === 'saved') return addSaved(k, back);
  if (mode === 'exercise') return addExercise(k, back);
}

const foodRow = (f, i, extra = '') => `
  <div class="frow" data-food="${i}">
    <div><b>${esc(f.n)}</b><span>${esc(f.u)}${extra}</span></div>
    <em>${f.k} kcal · ${f.p}g</em>
  </div>`;

function addSearch(k, back) {
  sheet('Food database', `
    ${back}
    <input id="foodQ" type="search" placeholder="banana, ribeye, IPA, salmon roll…" autocomplete="off">
    <div id="foodResults" class="frows"><p class="fine">Start typing. The recipe bank and about 150 common foods are searched on the phone; tap <b>Search online</b> for packaged and branded items.</p></div>`);
  $('#addBack').onclick = () => openAdd(k);
  const q = $('#foodQ'), host = $('#foodResults');
  let results = [];
  const paint = (extraHtml = '') => {
    host.innerHTML = results.length
      ? results.map((f, i) => foodRow(f, i, f.t === 'recipe' ? ' · from your recipes' : f.t === 'online' ? ' · online' : '')).join('') + extraHtml
      : `<p class="fine">Nothing on the phone matches.</p>${extraHtml}`;
    $$('[data-food]').forEach(r => r.onclick = () => confirmFood(k, results[Number(r.dataset.food)], () => openAdd(k, 'search')));
    const ob = $('#onlineBtn'); if (ob) ob.onclick = online;
  };
  const local = () => {
    const term = q.value.trim();
    if (!term) { results = []; host.innerHTML = '<p class="fine">Start typing.</p>'; return; }
    const recipes = searchRecipes(term).slice(0, 4).map(r => ({ n: r.name, u: '1 serving', k: r.kcal, p: r.protein, t: 'recipe' }));
    results = [...searchFoods(term, 10), ...recipes];   // plain foods first; a recipe is a whole meal
    paint(`<button class="btn ghost sm" id="onlineBtn">Search online for “${esc(term)}”</button>`);
  };
  const online = async () => {
    const term = q.value.trim(); if (!term) return;
    host.insertAdjacentHTML('beforeend', '<p class="fine" id="onlineWait">Searching Open Food Facts…</p>');
    addCtl = new AbortController();
    try {
      const found = await searchOnline(term, addCtl.signal);
      results = [...results.filter(f => f.t !== 'online'), ...found];
      paint(found.length ? '' : '<p class="fine">Nothing online either. Try fewer words, or the brand name.</p>');
    } catch (err) {
      if (err.name !== 'AbortError') { $('#onlineWait')?.remove(); toast('Online search failed. Check the connection.'); }
    }
  };
  q.oninput = local;
  q.focus();
}

/** Portion and save, then it goes on today's list. */
function confirmFood(k, f, onBack) {
  const saved = S.get().saved.some(x => x.name.toLowerCase() === f.n.toLowerCase());
  sheet(f.n, `
    <button class="link" id="cfBack">‹ Back</button>
    <p class="lede">${esc(f.u)} — ${f.k} kcal, ${f.p} g protein</p>
    <p class="fld-label">How much?</p>
    <div class="chips" id="qtyChips">
      ${[0.5, 1, 1.5, 2, 3].map(x => `<button class="chip ${x === 1 ? 'on' : ''}" data-qty="${x}">${x === 0.5 ? 'half' : x === 1 ? 'one' : x === 1.5 ? 'one and a half' : x === 2 ? 'two' : 'three'}</button>`).join('')}
    </div>
    <p class="fine" id="cfTotal">One ${esc(f.u)}: ${f.k} kcal, ${f.p} g protein.</p>
    <div class="ci-actions">
      <button class="btn primary" id="cfAdd">Add to today</button>
      <button class="btn ghost" id="cfSave">${saved ? '★ Saved' : '☆ Save'}</button>
    </div>`);
  let qty = 1;
  $('#cfBack').onclick = onBack;
  $$('[data-qty]').forEach(b => b.onclick = () => {
    qty = Number(b.dataset.qty);
    $$('[data-qty]').forEach(c => c.classList.toggle('on', c === b));
    $('#cfTotal').textContent = `${qty} × ${f.u}: ${Math.round(f.k * qty)} kcal, ${Math.round(f.p * qty)} g protein.`;
  });
  $('#cfSave').onclick = () => {
    if (saved) { S.unsaveFood(f.n); toast('Removed from saved.'); }
    else { S.saveFood({ name: f.n, unit: f.u, kcal: f.k, protein: f.p }); toast('Saved for next time.'); }
    confirmFood(k, f, onBack);
  };
  $('#cfAdd').onclick = () => {
    S.addExtra(k, { name: f.n, unit: f.u, kcal: f.k, protein: f.p, qty });
    closeSheet();
    toast(`Logged ${f.n}.`);
    render();
  };
}

function addSaved(k, back) {
  const saved = S.get().saved;
  const recent = S.recentExtras(8).filter(r => !saved.some(x => x.name.toLowerCase() === r.name.toLowerCase()));
  const list = (items, off) => items.map((f, i) => foodRow({ n: f.name, u: f.unit, k: f.kcal, p: f.protein }, off + i)).join('');
  sheet('Saved foods', `
    ${back}
    ${saved.length ? `<h3>Saved</h3><div class="frows">${list(saved, 0)}</div>` : '<p class="fine">Nothing saved yet. When you add a food, tap ☆ Save and it lands here.</p>'}
    ${recent.length ? `<h3>Recent</h3><div class="frows">${list(recent, saved.length)}</div>` : ''}`);
  $('#addBack').onclick = () => openAdd(k);
  const all = [...saved, ...recent];
  $$('[data-food]').forEach(r => r.onclick = () => {
    const f = all[Number(r.dataset.food)];
    confirmFood(k, { n: f.name, u: f.unit, k: f.kcal, p: f.protein }, () => openAdd(k, 'saved'));
  });
}

function addScan(k, back) {
  const hasKey = !!S.get().settings.apiKey;
  sheet('Scan food', `
    ${back}
    ${hasKey ? '' : '<p class="lede">Scanning a photo uses the AI coach, which needs a key under <b>Me → AI coach</b>. Until then, use the food database.</p>'}
    <label class="btn primary block scan-btn">📷 Take a photo<input id="scanFile" type="file" accept="image/*" capture="environment" hidden ${hasKey ? '' : 'disabled'}></label>
    <label class="btn ghost block scan-btn">Choose from photos<input id="scanPick" type="file" accept="image/*" hidden ${hasKey ? '' : 'disabled'}></label>
    <input id="scanHint" placeholder="Optional: “half of it”, “with rice”, “restaurant portion”">
    <div id="scanOut"></div>`);
  $('#addBack').onclick = () => openAdd(k);
  const handle = async file => {
    if (!file) return;
    const out = $('#scanOut');
    out.innerHTML = '<p class="fine">Reading the photo…</p>';
    let dataUrl;
    try { dataUrl = await shrinkImage(file, 1024); } catch { out.innerHTML = '<p class="fine">Could not read that image.</p>'; return; }
    out.innerHTML = `<img class="scan-preview" src="${dataUrl}" alt=""><p class="fine">Estimating…</p>`;
    try {
      const est = await estimateFood(dataUrl, $('#scanHint').value.trim());
      if (!est.items.length) { out.innerHTML += `<p class="fine">${esc(est.note || 'No food found.')}</p>`; return; }
      out.innerHTML = `
        <img class="scan-preview" src="${dataUrl}" alt="">
        <p class="fine">${esc(est.note || '')} Edit anything that looks wrong, then add.</p>
        ${est.items.map((it, i) => `
          <div class="est">
            <input data-est-name="${i}" value="${esc(it.name)}">
            <input data-est-kcal="${i}" type="number" inputmode="numeric" value="${it.kcal}"><span>kcal</span>
            <input data-est-p="${i}" type="number" inputmode="numeric" value="${it.protein}"><span>g</span>
            <label class="tick sm"><input type="checkbox" data-est-on="${i}" checked></label>
          </div>
          <p class="fine est-portion">${esc(it.portion)}</p>`).join('')}
        <button class="btn primary block" id="estAdd">Add to today</button>`;
      $('#estAdd').onclick = () => {
        let n = 0;
        est.items.forEach((it, i) => {
          if (!$(`[data-est-on="${i}"]`).checked) return;
          S.addExtra(k, { name: $(`[data-est-name="${i}"]`).value.trim() || it.name, unit: it.portion, kcal: Number($(`[data-est-kcal="${i}"]`).value) || 0, protein: Number($(`[data-est-p="${i}"]`).value) || 0, qty: 1 });
          n++;
        });
        closeSheet();
        toast(n ? `Logged ${n} item${n === 1 ? '' : 's'} from the photo.` : 'Nothing selected.');
        render();
      };
    } catch (err) {
      out.innerHTML = `<img class="scan-preview" src="${dataUrl}" alt=""><p class="fine">${esc(err.message || 'The estimate failed.')}</p>`;
    }
  };
  $('#scanFile').onchange = e => handle(e.target.files[0]);
  $('#scanPick').onchange = e => handle(e.target.files[0]);
}

/** Phones take 12-megapixel photos; the model needs a thousand pixels. */
function shrinkImage(file, max) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const scale = Math.min(1, max / Math.max(img.width, img.height));
      const c = document.createElement('canvas');
      c.width = Math.round(img.width * scale); c.height = Math.round(img.height * scale);
      c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
      URL.revokeObjectURL(url);
      resolve(c.toDataURL('image/jpeg', 0.82));
    };
    img.onerror = reject;
    img.src = url;
  });
}

function addExercise(k, back) {
  const kinds = [['strength', '🏋️ Strength'], ['walk', '🚶 Walk'], ['cardio', '🚴 Cardio'], ['sport', '🎾 Sport'], ['other', '⚡ Other']];
  sheet('Log exercise', `
    ${back}
    <p class="fld-label">What was it?</p>
    <div class="chips">${kinds.map(([v, l], i) => `<button class="chip ${i === 0 ? 'on' : ''}" data-kind="${v}">${l}</button>`).join('')}</div>
    <div class="row2">
      <label class="fld"><span>Minutes</span><input id="exMin" type="number" inputmode="numeric" placeholder="30"></label>
      <label class="fld"><span>Calories (optional)</span><input id="exKcal" type="number" inputmode="numeric" placeholder="from the Watch"></label>
    </div>
    <label class="fld"><span>Name (optional)</span><input id="exName" placeholder="Dumbbells in the garage"></label>
    <div class="ci-actions">
      <button class="btn primary" id="exSave">Log it</button>
      <button class="btn ghost" id="exWatch">⌚ Paste from Watch</button>
    </div>
    <p class="fine">Strength sessions this week: <b>${S.strengthThisWeek()}</b>. The Watch button imports workouts along with sleep if the Shortcut exports them — see Me → Apple Watch. Calories burned are recorded, not added back to what you can eat.</p>`);
  $('#addBack').onclick = () => openAdd(k);
  let kind = 'strength';
  $$('[data-kind]').forEach(b => b.onclick = () => { kind = b.dataset.kind; $$('[data-kind]').forEach(c => c.classList.toggle('on', c === b)); });
  $('#exWatch').onclick = pasteFromWatch;
  $('#exSave').onclick = () => {
    const minutes = Number($('#exMin').value);
    if (!(minutes > 0 && minutes < 600)) return toast('How many minutes?');
    const label = kinds.find(x => x[0] === kind)[1].replace(/^\S+\s/, '');
    S.addWorkout(k, { type: kind, name: $('#exName').value.trim() || label, minutes, kcal: Number($('#exKcal').value) || 0 });
    closeSheet();
    toast(`Logged ${minutes} minutes.`);
    render();
  };
}

/* ── the watch ─────────────────────────────────────────────────── */

async function pasteFromWatch() {
  let text = '';
  try { text = await navigator.clipboard.readText(); }
  catch { return openWatch(true); }          // no permission: fall back to a paste box
  importText(text);
}

function importText(text) {
  const parsed = parseHealth(text);
  if (!parsed.samples) {
    toast('Nothing from Health on the clipboard. Run the Shortcut first.');
    return false;
  }
  const r = S.importHealth(parsed);
  checkinOpen = null;
  closeSheet();
  toast(`Imported ${r.nightsIn} night${r.nightsIn === 1 ? '' : 's'}${r.daysIn ? ` and ${r.daysIn} days` : ''}.`);
  render();
  return true;
}

/** Setup and fallback for the Watch pipeline. */
function openWatch(pasteFirst = false) {
  sheet('Apple Watch', `
    ${pasteFirst ? '<p class="lede">Safari did not let the app read the clipboard. Paste here instead.</p>' : ''}
    <textarea id="watchPaste" rows="4" placeholder="Run the Shortcut, then paste here"></textarea>
    <button class="btn primary" id="watchImport">Import</button>

    <h3>How it works</h3>
    <p class="fine">A web app cannot read Apple Health directly, so a Shortcut on your phone reads the Watch's sleep and copies it to the clipboard. Tap <b>Paste from Watch</b> on Today and the app takes it from there. Nothing is uploaded anywhere.</p>

    <h3>Build the Shortcut once</h3>
    <ol class="steps">
      <li>Open <b>Shortcuts</b>, tap <b>+</b>, name it <b>Trim Path</b>.</li>
      <li>Add <b>Find Health Samples</b>. Set <b>Type</b> to <b>Sleep Analysis</b>. Add a filter: <b>Start Date · is in the last · 14 days</b>. Sort by Start Date.</li>
      <li>Add <b>Repeat with Each</b> (it will pick up the Health Samples).</li>
      <li>Inside the repeat, add <b>Text</b> and type exactly:<br><code>sleep|Repeat Item|Repeat Item|Repeat Item</code><br>Then tap the three <i>Repeat Item</i> tokens in turn and change them to <b>Value</b>, <b>Start Date</b>, <b>End Date</b>. For the two dates, tap the token again → <b>Date Format: Custom</b> → <code>yyyy-MM-dd HH:mm</code>.</li>
      <li>After the repeat, add <b>Combine Text</b> (Repeat Results, with New Lines), then <b>Copy to Clipboard</b>.</li>
      <li>Optional, for steps: add a second <b>Find Health Samples</b> with Type <b>Steps</b>, same 14-day filter, <b>Group By Day</b>; repeat it with a Text of <code>steps|Start Date|Value</code> (date format <code>yyyy-MM-dd</code>) and combine both results before copying.</li>
      <li>Optional, for workouts: <b>Find Workouts</b> (last 14 days), repeat with a Text of <code>workout|Start Date|Workout Type|Duration|Active Energy</code> — Start Date as <code>yyyy-MM-dd HH:mm</code>, Duration in minutes, Active Energy in kcal.</li>
    </ol>
    <p class="fine">Then, each morning: run the Shortcut (add it to the Home Screen or ask Siri), open this app, tap Paste from Watch. To make it automatic, add a Shortcuts <b>Automation</b> for when your alarm stops — the phone must be unlocked for Health to be read, so a fixed time will not work.</p>
    <p class="fine">The app takes any line shaped <code>sleep|value|start|end</code>; Awake segments are dropped and overlapping phone and Watch records are merged, not double counted.</p>`);
  $('#watchImport').onclick = () => importText($('#watchPaste').value);
}

function mealCard(day, index, slot, log) {
  const v = served(day.slots[slot]);
  if (!v) return '';
  const { recipe: r, portions } = v;
  const s = day.slots[slot];
  const done = !!log.ate?.[slot];
  return `
    <div class="meal ${done ? 'done' : ''}">
      <div class="meal-head">
        <span class="slot">${SLOT_LABEL[slot]}</span>
        <span class="budget">${day.budget[slot]} kcal budget</span>
      </div>
      <h3>${esc(r.name)}</h3>
      <div class="tags">
        <span class="tag effort-${s.leftover ? 'none' : r.effort}">${s.leftover ? 'Reheat' : EFFORT[r.effort].label}</span>
        <span class="tag">${s.leftover ? 'Leftovers · 4 min' : r.minutes + ' min'}</span>
        <span class="tag">${v.kcal} kcal</span>
        <span class="tag">${v.protein}g protein</span>
        ${portions !== 1 ? `<span class="tag portion">${portionLabel(portions)}</span>` : ''}
      </div>
      ${s.leftover ? '<p class="fine leftover">Already cooked earlier in the week. Reheat it.</p>' : ''}
      <div class="meal-actions">
        <button class="btn ${done ? 'ghost' : 'primary'} sm" data-eat="${slot}">${done ? 'Eaten ✓' : 'Mark eaten'}</button>
        <button class="btn ghost sm" data-open="${r.id}">Recipe</button>
        <button class="btn ghost sm" data-swap="${slot}">Swap</button>
      </div>
    </div>`;
}

function askHours(index, k) {
  const cur = S.hoursOn(k);
  sheet('How long are you working today?', `
    <p class="lede">Change this whenever the day turns out different from the plan. Everything you have not eaten yet gets re-tuned to what is now realistic.</p>
    <div class="hourpick">
      ${Array.from({ length: 17 }, (_, i) => i).map(h => `
        <button class="hbtn ${h === cur ? 'on' : ''}" data-h="${h}">${h}h<i>${dayType(h).label}</i></button>`).join('')}
    </div>`);
  $$('[data-h]').forEach(b => b.onclick = () => {
    const h = Number(b.dataset.h);
    S.setDay(k, { hours: h });
    const s = S.get();
    const eaten = SLOTS.filter(sl => S.day(k).ate?.[sl]);
    const changed = retune(s.plan, index, h, s.profile, eaten);
    S.save();
    closeSheet();
    render();
    toast(changed.length ? `Re-tuned: ${changed.join(' · ')}` : `Set to ${h} hours.`);
  });
}

/* ── the week ──────────────────────────────────────────────────── */

function regenerate() {
  const s = S.get();
  const t = targets(s.profile);
  S.set(st => {
    st.plan = buildWeek(st.profile, t.kcal, Math.floor(Math.random() * 1e6));
    st.grocery = { checked: [], builtFor: st.plan.start };
  });
  render();
  toast('New week built.');
}

function renderWeek() {
  const s = S.get();
  $('#hdrTitle').textContent = 'This week';
  $('#hdrSub').textContent = s.plan ? `From ${fmtDate(S.parse(s.plan.start))}` : '';

  if (!s.plan) {
    $('#weekHost').innerHTML = `<div class="card center"><p>No plan yet.</p><button class="btn primary" id="mk">Build my week</button></div>`;
    $('#mk').onclick = regenerate;
    return;
  }

  const today = S.key();
  $('#weekHost').innerHTML = `
    <div class="week-actions">
      <button class="btn primary" id="shop">Shopping list</button>
      <button class="btn ghost" id="regen">Shuffle week</button>
    </div>
    ${s.plan.days.map((d, i) => `
      <div class="wday ${d.date === today ? 'now' : ''}" style="--tone:${d.type.colour}">
        <div class="wday-head">
          <div>
            <b>${S.DAY_LONG[d.dow]}</b>
            <span class="wday-meta">${d.hours}h · ${esc(d.type.label)}${d.batchDay ? ' · BATCH DAY' : ''}</span>
          </div>
          <span class="wday-kcal">${d.totals.kcal} kcal<i>${d.totals.protein}g P</i></span>
        </div>
        ${SLOTS.map(sl => {
          const v = served(d.slots[sl]);
          if (!v) return '';
          return `<div class="wmeal" data-open="${v.recipe.id}">
            <span class="wslot">${SLOT_LABEL[sl]}</span>
            <span class="wname">${esc(v.recipe.name)}${d.slots[sl].leftover ? ' <i>leftovers</i>' : ''}${v.portions !== 1 ? ` <i>${portionLabel(v.portions)}</i>` : ''}</span>
            <span class="wkcal">${v.kcal}</span>
          </div>`;
        }).join('')}
        ${d.batchDay ? `<p class="batch-note">Cook the batch today. It is what makes the rest of the week possible.</p>` : ''}
      </div>`).join('')}`;

  $('#regen').onclick = regenerate;
  $('#shop').onclick = openGroceries;
  $$('[data-open]').forEach(el => el.onclick = () => openRecipe(el.dataset.open));
}

function openGroceries() {
  const s = S.get();
  const list = groceries(s.plan);
  const checked = new Set(s.grocery.checked);
  const body = Object.entries(list).map(([aisle, items]) => `
    <div class="aisle">
      <h3>${AISLE_LABEL[aisle] || aisle}</h3>
      ${items.map(it => {
        const id = `${it.n}||${it.u}`;
        return `<label class="tick ${checked.has(id) ? 'on' : ''}">
          <input type="checkbox" data-buy="${esc(id)}" ${checked.has(id) ? 'checked' : ''}>
          <span>${esc(it.n)}</span><em>${esc(qty(it))}</em>
        </label>`;
      }).join('')}
    </div>`).join('');

  sheet('Shopping list', `
    <p class="lede">Only what actually needs cooking this week. Leftovers are already paid for by the batch cook that made them.</p>
    ${body}
    <button class="btn ghost" id="copyList">Copy the whole list</button>`);

  $$('[data-buy]').forEach(cb => cb.onchange = () => {
    const id = cb.dataset.buy;
    S.set(st => {
      const i = st.grocery.checked.indexOf(id);
      if (cb.checked && i < 0) st.grocery.checked.push(id);
      if (!cb.checked && i >= 0) st.grocery.checked.splice(i, 1);
    });
    cb.closest('.tick').classList.toggle('on', cb.checked);
  });
  $('#copyList').onclick = () => {
    const text = Object.entries(list).map(([aisle, items]) =>
      `${(AISLE_LABEL[aisle] || aisle).toUpperCase()}\n` + items.map(i => `- ${i.n} — ${qty(i)}`).join('\n')
    ).join('\n\n');
    copy(text, 'Shopping list copied');
  };
}

/* ── recipes ───────────────────────────────────────────────────── */

let recipeFilter = { q: '', meal: '', effort: '' };

function renderRecipes() {
  $('#hdrTitle').textContent = 'Recipes';
  $('#hdrSub').textContent = `${RECIPES.length} in the bank`;

  const results = searchRecipes(recipeFilter.q, {
    meal: recipeFilter.meal || undefined,
    effort: recipeFilter.effort || undefined
  });

  $('#recipesHost').innerHTML = `
    <input class="search" id="rq" placeholder="Search by name or ingredient" value="${esc(recipeFilter.q)}">
    <div class="chips scroll">
      ${['', 'breakfast', 'lunch', 'dinner', 'snack'].map(m =>
        `<button class="chip ${recipeFilter.meal === m ? 'on' : ''}" data-meal="${m}">${m ? SLOT_LABEL[m] : 'All meals'}</button>`).join('')}
    </div>
    <div class="chips scroll">
      ${['', 'none', 'quick', 'standard', 'project'].map(e =>
        `<button class="chip ${recipeFilter.effort === e ? 'on' : ''}" data-effort="${e}">${e ? EFFORT[e].label : 'Any effort'}</button>`).join('')}
    </div>
    ${results.length ? results.map(r => `
      <div class="rcard" data-open="${r.id}">
        <div>
          <h3>${esc(r.name)}</h3>
          <div class="tags">
            <span class="tag effort-${r.effort}">${EFFORT[r.effort].label}</span>
            <span class="tag">${r.minutes} min</span>
            <span class="tag">${r.protein}g protein</span>
            ${r.batch ? `<span class="tag batch">makes ${r.servings}</span>` : ''}
          </div>
        </div>
        <span class="rkcal">${r.kcal}</span>
      </div>`).join('') : '<div class="card center"><p>Nothing matches that.</p></div>'}`;

  const q = $('#rq');
  q.oninput = () => { recipeFilter.q = q.value; renderRecipes(); q.focus(); };
  $$('[data-meal]').forEach(b => b.onclick = () => { recipeFilter.meal = b.dataset.meal; renderRecipes(); });
  $$('[data-effort]').forEach(b => b.onclick = () => { recipeFilter.effort = b.dataset.effort; renderRecipes(); });
  $$('[data-open]').forEach(b => b.onclick = () => openRecipe(b.dataset.open));
}

function openRecipe(id) {
  const r = BY_ID[id];
  if (!r) return;
  const loved = S.get().loved.includes(id);
  sheet(r.name, `
    <div class="tags big">
      <span class="tag effort-${r.effort}">${EFFORT[r.effort].label}</span>
      <span class="tag">${r.minutes} min</span>
      <span class="tag">${r.kcal} kcal</span>
      <span class="tag">${r.protein}g protein</span>
      <span class="tag">${r.fiber}g fibre</span>
      ${r.batch ? `<span class="tag batch">makes ${r.servings}</span>` : ''}
    </div>
    ${r.why ? `<p class="why">${esc(r.why)}</p>` : ''}
    <h3>Ingredients${r.servings > 1 ? ` — for ${r.servings}` : ''}</h3>
    <ul class="ing">${r.ing.map(i => `<li><span>${esc(i.n)}</span><em>${esc(qty(i))}</em></li>`).join('')}</ul>
    <h3>Method</h3>
    <ol class="steps">${r.steps.map(s => `<li>${esc(s)}</li>`).join('')}</ol>
    <div class="sheet-actions">
      <button class="btn ${loved ? 'primary' : 'ghost'}" id="love">${loved ? 'Starred ★' : 'Star this ☆'}</button>
      <button class="btn ghost" id="never">Never again</button>
    </div>
    <p class="fine">Starred meals get picked more often. "Never again" removes it from every future plan.</p>`);

  $('#love').onclick = () => {
    S.set(st => {
      const i = st.loved.indexOf(id);
      if (i >= 0) st.loved.splice(i, 1); else st.loved.push(id);
    });
    closeSheet();
    toast(S.get().loved.includes(id) ? 'Starred.' : 'Unstarred.');
  };
  $('#never').onclick = () => {
    S.set(st => { if (!st.refused.includes(r.name.toLowerCase())) st.refused.push(r.name.toLowerCase()); });
    closeSheet();
    toast('Removed from future plans.');
  };
}

/* ── coach ─────────────────────────────────────────────────────── */

let streaming = null;

function renderCoach() {
  const s = S.get();
  $('#hdrTitle').textContent = 'Coach';
  $('#hdrSub').textContent = s.settings.apiKey ? MODELS.find(m => m.id === s.settings.model)?.label || '' : 'No API key — copy mode';

  $('#coachHost').innerHTML = `
    <div class="patterns">
      ${PATTERNS.map(p => `<button class="pat" data-pat="${p.id}"><span>${p.icon}</span>${esc(p.label)}</button>`).join('')}
    </div>
    <div class="thread" id="thread">
      ${s.chat.length ? s.chat.map(m => `
        <div class="msg ${m.role}">${m.role === 'user' ? esc(m.content) : md(m.content)}</div>`).join('')
      : `<div class="card center empty">
          <p><b>Your coach already knows you.</b></p>
          <p class="fine">Every question carries your context file — your age, targets, work hours, today's plan and what you have already eaten. Tap a button above or just ask.</p>
        </div>`}
    </div>
    <div class="composer">
      <textarea id="msg" rows="1" placeholder="Ask your coach…"></textarea>
      <button class="send" id="send">↑</button>
    </div>
    <div class="coach-foot">
      <button class="btn ghost sm" id="copyCtx">Copy context</button>
      ${s.chat.length ? '<button class="btn ghost sm" id="clearChat">Clear chat</button>' : ''}
    </div>`;

  const box = $('#msg');
  box.oninput = () => { box.style.height = 'auto'; box.style.height = Math.min(box.scrollHeight, 140) + 'px'; };
  box.onkeydown = e => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) { e.preventDefault(); send(box.value); } };
  $('#send').onclick = () => send(box.value);
  $$('[data-pat]').forEach(b => b.onclick = () => {
    const p = PATTERNS.find(x => x.id === b.dataset.pat);
    send(p.prompt);
  });
  $('#copyCtx').onclick = () => copy(portablePack(box.value.trim()),
    'Context copied — paste it into the Claude app');
  const clear = $('#clearChat');
  if (clear) clear.onclick = () => { S.set(st => { st.chat = []; }); render(); };

  const thread = $('#thread');
  thread.scrollTop = thread.scrollHeight;
}

async function send(text) {
  const content = (text || '').trim();
  if (!content || streaming) return;
  const s = S.get();

  if (!s.settings.apiKey) {
    await copy(portablePack(content), 'No API key — context and question copied instead');
    sheet('Two ways to use the coach', `
      <p class="lede">Your question and your full context file are on the clipboard. Paste them into the Claude app and you will get the same answer.</p>
      <p>To get replies inside this app instead, add an Anthropic API key under <b>Me → AI coach</b>. It is stored only on this phone, and you pay Anthropic directly for what you use — typically a few cents a day.</p>
      <button class="btn primary" id="goSettings">Add a key</button>`);
    $('#goSettings').onclick = () => { closeSheet(); show('me'); };
    return;
  }

  S.set(st => { st.chat.push({ role: 'user', content }); });
  renderCoach();
  $('#msg').value = '';

  const thread = $('#thread');
  const bubble = document.createElement('div');
  bubble.className = 'msg assistant streaming';
  bubble.innerHTML = '<span class="dots"><i></i><i></i><i></i></span>';
  thread.appendChild(bubble);
  thread.scrollTop = thread.scrollHeight;

  const controller = new AbortController();
  streaming = controller;
  $('#send').textContent = '■';
  $('#send').onclick = () => controller.abort();

  let acc = '';
  try {
    const reply = await ask(S.get().chat, chunk => {
      acc += chunk;
      bubble.innerHTML = md(acc);
      thread.scrollTop = thread.scrollHeight;
    }, controller.signal);
    S.set(st => { st.chat.push({ role: 'assistant', content: reply }); });
  } catch (err) {
    if (err.name === 'AbortError') {
      if (acc.trim()) S.set(st => { st.chat.push({ role: 'assistant', content: acc }); });
    } else {
      const message = err instanceof AiError ? err.message : 'Something went wrong talking to Claude.';
      bubble.className = 'msg error';
      bubble.textContent = message;
      toast(message);
      streaming = null;
      const btn = $('#send');
      btn.textContent = '↑';
      btn.onclick = () => send($('#msg').value);
      return;
    }
  } finally {
    streaming = null;
  }
  renderCoach();
}

/* ── me ────────────────────────────────────────────────────────── */

function renderMe() {
  const s = S.get();
  const p = s.profile;
  const t = targets(p);
  $('#hdrTitle').textContent = 'Me';
  $('#hdrSub').textContent = p.name || '';

  $('#meHost').innerHTML = `
    <div class="card stats">
      <div><b>${S.trend()}</b><span>trend weight</span></div>
      <div><b>${Math.round((p.startWeight - S.trend()) * 10) / 10}</b><span>lb lost</span></div>
      <div><b>${t.toLose}</b><span>lb to go</span></div>
      <div><b>${S.adherence() ?? '—'}${S.adherence() !== null ? '%' : ''}</b><span>adherence</span></div>
    </div>

    ${S.waistNow() ? `
    <div class="card stats three">
      <div><b>${S.waistNow()}</b><span>waist, inches</span></div>
      <div><b>${S.waistDelta() !== null ? (S.waistDelta() > 0 ? '+' : '') + S.waistDelta() : '—'}</b><span>inches moved</span></div>
      <div><b>${p.waistGoal || 40}</b><span>${p.waistGoal ? 'goal' : 'the health line'}</span></div>
    </div>` : ''}

    <div class="card">
      <h3>Your targets</h3>
      <div class="target-grid sm">
        <div class="tgt"><b>${t.kcal}</b><span>kcal</span></div>
        <div class="tgt"><b>${t.protein}g</b><span>protein</span></div>
        <div class="tgt"><b>${t.fat}g</b><span>fat</span></div>
        <div class="tgt"><b>${t.carbs}g</b><span>carbs</span></div>
        <div class="tgt"><b>${t.fiber}g</b><span>fibre</span></div>
      </div>
      <p class="fine">${esc(t.why.kcal)} ${esc(t.why.protein)}</p>
    </div>

    <button class="rowbtn" id="editProfile"><span>Profile and work hours</span><i>›</i></button>
    <button class="rowbtn" id="myPath"><span>My path</span><i>${s.path?.answers ? 'sleep · energy · fitness · food' : 'not taken yet'} ›</i></button>
    <button class="rowbtn" id="watchBtn"><span>Apple Watch</span><i>${S.nights().some(Boolean) ? 'sleep connected' : 'set up'} ›</i></button>
    <button class="rowbtn" id="editContext"><span>My context file</span><i>›</i></button>
    <button class="rowbtn" id="aiSettings"><span>AI coach</span><i>${s.settings.apiKey ? 'connected' : 'copy mode'} ›</i></button>
    <button class="rowbtn" id="dataBtn"><span>Backup and reset</span><i>›</i></button>

    <p class="fine build">Build ${BUILD}. If a new version does not show up, close the app fully and open it twice.</p>
    <p class="fine disclaimer">General nutrition guidance, not medical advice. If you take medication for blood pressure or diabetes, tell your doctor you are losing weight — those doses very often need adjusting as the weight comes off.</p>`;

  $('#editProfile').onclick = openProfile;
  $('#myPath').onclick = openPath;
  $('#watchBtn').onclick = () => openWatch();
  $('#editContext').onclick = openContext;
  $('#aiSettings').onclick = openAi;
  $('#dataBtn').onclick = openData;
}

function openPath() {
  const s = S.get();
  const path = derivePath(s.path?.answers, s.profile);
  sheet('My path', `
    ${path ? pathCard(path) : '<div class="card"><p>Seventeen quick questions about how you sleep, when your energy peaks, what training you would actually do and how your hunger behaves. Two minutes. The answers shape every plan and every coaching reply.</p></div>'}
    <button class="btn primary block" id="retakePath">${path ? 'Retake the questionnaire' : 'Take the questionnaire'}</button>
    ${path ? `<p class="fine">Taken ${esc(s.path.takenAt)}. The times move automatically if you change your sleep need in Profile.</p>` : ''}`);
  $('#retakePath').onclick = () => {
    closeSheet();
    obMode = 'path'; step = 0; draft = null;
    show('onboard');
  };
}

function openProfile() {
  const p = S.get().profile;
  sheet('Profile', `
    <label class="fld"><span>Name</span><input id="f-name" value="${esc(p.name)}"></label>
    <div class="row2">
      <label class="fld"><span>Age</span><input id="f-age" type="number" inputmode="numeric" value="${p.age}"></label>
      <label class="fld"><span>Weight now (lb)</span><input id="f-weight" type="number" inputmode="decimal" value="${p.weight}"></label>
    </div>
    <div class="row2">
      <label class="fld"><span>Goal weight (lb)</span><input id="f-goal" type="number" inputmode="decimal" value="${p.goalWeight}"></label>
      <label class="fld"><span>lb per week</span>
        <select id="f-rate">
          ${[0.5, 0.75, 1, 1.5].map(v => `<option value="${v}" ${p.rate === v ? 'selected' : ''}>${v}</option>`).join('')}
        </select>
      </label>
    </div>
    <div class="row2">
      <label class="fld"><span>Waist goal (in, optional)</span><input id="f-waistgoal" type="number" inputmode="decimal" step="0.5" value="${p.waistGoal ?? ''}" placeholder="under 40"></label>
      <label class="fld"><span>Sleep need (hours)</span>
        <select id="f-sleep">${[6.5, 7, 7.5, 8, 8.5].map(h => `<option value="${h * 60}" ${p.sleepNeedMin === h * 60 ? 'selected' : ''}>${h}</option>`).join('')}</select>
      </label>
    </div>
    <label class="fld"><span>Activity</span>
      <select id="f-activity">${Object.entries(ACTIVITY).map(([k, v]) =>
        `<option value="${k}" ${p.activity === k ? 'selected' : ''}>${v.label}</option>`).join('')}</select>
    </label>
    <label class="fld"><span>Cooking nights a week</span>
      <select id="f-cook">${[0,1,2,3,4,5,6,7].map(n => `<option value="${n}" ${p.cookNights === n ? 'selected' : ''}>${n}</option>`).join('')}</select>
    </label>
    <h3>Normal working week</h3>
    <div class="hours">
      ${S.DAY_LONG.map((d, i) => `
        <label class="hour-row"><span>${d}</span>
          <input id="f-h${i}" type="number" inputmode="numeric" min="0" max="18" value="${p.workHours[i]}"><em>hrs</em>
        </label>`).join('')}
    </div>
    <label class="fld"><span>Foods you will not eat</span><input id="f-dislikes" value="${esc(p.dislikes)}"></label>
    <label class="fld"><span>Allergies</span><input id="f-allergies" value="${esc(p.allergies)}"></label>
    <label class="fld"><span>Conditions / medication</span><textarea id="f-conditions" rows="2">${esc(p.conditions)}</textarea></label>
    <button class="btn primary" id="saveProfile">Save and rebuild the week</button>`);

  $('#saveProfile').onclick = () => {
    const weight = Number($('#f-weight').value);
    const goal = Number($('#f-goal').value);
    if (!(goal > 60 && goal < weight)) return toast('Goal weight must be below your current weight.');
    S.set(st => {
      const q = st.profile;
      q.name = $('#f-name').value;
      q.age = Number($('#f-age').value);
      q.weight = weight;
      q.goalWeight = goal;
      q.rate = Number($('#f-rate').value);
      q.waistGoal = Number($('#f-waistgoal').value) || null;
      q.sleepNeedMin = Number($('#f-sleep').value) || 450;
      q.activity = $('#f-activity').value;
      q.cookNights = Number($('#f-cook').value);
      q.dislikes = $('#f-dislikes').value;
      q.allergies = $('#f-allergies').value;
      q.conditions = $('#f-conditions').value;
      q.workHours = S.DAY_LONG.map((_, i) => Number($(`#f-h${i}`).value) || 0);
    });
    regenerate();
    closeSheet();
    toast('Saved and rebuilt.');
  };
}

function openContext() {
  const s = S.get();
  sheet('My context file', `
    <p class="lede">This is what your coach is given, word for word, on every single question. Read it. Change anything that is wrong.</p>
    <label class="fld"><span>Mission — why you are doing this</span>
      <textarea id="c-mission" rows="3" placeholder="Be able to keep up with my grandchildren. Get off the blood-pressure tablets if my doctor agrees.">${esc(s.telos.mission)}</textarea></label>
    <label class="fld"><span>Standing directives to your coach</span>
      <textarea id="c-directives" rows="3" placeholder="Never suggest fish on Mondays. Keep answers under 80 words. Don't mention wine.">${esc(s.telos.directives)}</textarea></label>
    <p class="fld-label">Problems in the way</p>
    <div class="chips col">
      ${PROBLEMS.map(x => `<button type="button" class="chip wide ${s.telos.problems.includes(x.id) ? 'on' : ''}" data-prob="${x.id}"><b>${esc(x.label)}</b><i>${esc(x.detail)}</i></button>`).join('')}
    </div>
    <button class="btn primary" id="saveCtx">Save</button>
    <h3>The file itself</h3>
    <pre class="ctx">${esc(buildContext())}</pre>
    <button class="btn ghost" id="copyCtx2">Copy it</button>
    <p class="fine">Copy it into the Claude app, ChatGPT, or anything else. The context is yours — the model is just an engine, and you should be able to change engines whenever you like.</p>`);

  $$('[data-prob]').forEach(b => b.onclick = () => {
    S.set(st => {
      const i = st.telos.problems.indexOf(b.dataset.prob);
      if (i >= 0) st.telos.problems.splice(i, 1); else st.telos.problems.push(b.dataset.prob);
    });
    b.classList.toggle('on');
  });
  $('#saveCtx').onclick = () => {
    S.set(st => {
      st.telos.mission = $('#c-mission').value;
      st.telos.directives = $('#c-directives').value;
    });
    closeSheet();
    toast('Context saved.');
  };
  $('#copyCtx2').onclick = () => copy(buildContext(), 'Context file copied');
}

function openAi() {
  const s = S.get();
  sheet('AI coach', `
    <p class="lede">The coach works two ways. Without a key, every question copies your full context to the clipboard for pasting into the Claude app. With a key, replies appear here.</p>
    <label class="fld"><span>Anthropic API key</span>
      <input id="k-key" type="password" placeholder="sk-ant-…" value="${esc(s.settings.apiKey)}"></label>
    <label class="fld"><span>Model</span>
      <select id="k-model">${MODELS.map(m => `<option value="${m.id}" ${s.settings.model === m.id ? 'selected' : ''}>${m.label} — ${m.note}</option>`).join('')}</select></label>
    <label class="fld"><span>How hard it thinks</span>
      <select id="k-effort">
        <option value="low" ${s.settings.effort === 'low' ? 'selected' : ''}>Low — quickest, fine for "what's for dinner"</option>
        <option value="medium" ${s.settings.effort === 'medium' ? 'selected' : ''}>Medium — better for planning a week</option>
        <option value="high" ${s.settings.effort === 'high' ? 'selected' : ''}>High — slowest, most careful</option>
      </select></label>
    <div class="sheet-actions">
      <button class="btn primary" id="saveKey">Save</button>
      <button class="btn ghost" id="testK">Test the key</button>
    </div>
    <p class="fine">Get a key at console.anthropic.com. It is stored only in this phone's browser storage and is sent only to Anthropic, never to me or anyone else. Backups you export never include it.</p>`);

  $('#saveKey').onclick = () => {
    S.set(st => {
      st.settings.apiKey = $('#k-key').value.trim();
      st.settings.model = $('#k-model').value;
      st.settings.effort = $('#k-effort').value;
    });
    closeSheet();
    render();
    toast('Saved.');
  };
  $('#testK').onclick = async () => {
    const btn = $('#testK');
    btn.textContent = 'Testing…';
    btn.disabled = true;
    const res = await testKey($('#k-key').value, $('#k-model').value);
    btn.disabled = false;
    btn.textContent = 'Test the key';
    toast(res.ok ? 'Key works.' : res.message);
  };
}

function openData() {
  sheet('Backup and reset', `
    <p class="lede">Everything lives in this browser's storage. Clearing Safari's website data would wipe it, so take a backup now and then.</p>
    <button class="btn" id="exp">Copy a backup</button>
    <label class="fld"><span>Restore from a backup</span><textarea id="imp" rows="4" placeholder="Paste a backup here"></textarea></label>
    <button class="btn ghost" id="impBtn">Restore</button>
    <h3>Start over</h3>
    <p class="fine">Deletes your profile, plan, logged weights and chat history from this device. It cannot be undone.</p>
    <button class="btn danger" id="wipe">Erase everything</button>`);

  $('#exp').onclick = () => copy(S.exportAll(), 'Backup copied — paste it somewhere safe');
  $('#impBtn').onclick = () => {
    try {
      S.importAll($('#imp').value);
      closeSheet();
      render();
      toast('Restored.');
    } catch {
      toast('That does not look like a backup file.');
    }
  };
  $('#wipe').onclick = () => {
    const btn = $('#wipe');
    if (btn.dataset.sure) {
      S.reset();
      step = 0; draft = null; tab = 'today';
      closeSheet();
      render();
      return;
    }
    btn.dataset.sure = '1';
    btn.textContent = 'Tap again to erase everything';
  };
}

/* ── boot ──────────────────────────────────────────────────────── */

$$('#tabbar button').forEach(b => b.onclick = () => show(b.dataset.tab));
$('#sheet').onclick = e => { if (e.target.id === 'sheet' || e.target.dataset.close !== undefined) closeSheet(); };

/* Kitchen chips live in the onboarding flow and need their own listener,
   bound at the document level because that step re-renders often. */
document.addEventListener('click', e => {
  const chip = e.target.closest('.chip.kit');
  if (!chip || !draft) return;
  const k = chip.dataset.kit;
  const list = draft.profile.kitchen;
  const i = list.indexOf(k);
  if (i >= 0) list.splice(i, 1); else list.push(k);
  chip.classList.toggle('on');
});

/* Questionnaire chips, same reason. */
document.addEventListener('click', e => {
  const chip = e.target.closest('.chip.q');
  if (!chip || !draft) return;
  const { qid, v } = chip.dataset;
  if (chip.dataset.multi !== undefined) {
    const list = draft.path[qid] ||= [];
    const i = list.indexOf(v);
    if (i >= 0) list.splice(i, 1); else list.push(v);
    chip.classList.toggle('on');
  } else {
    draft.path[qid] = v;
    chip.parentElement.querySelectorAll('.chip.q').forEach(c => c.classList.toggle('on', c === chip));
  }
});

/* A day rolls over while the app sits open on the home screen. */
let lastDay = S.key();
setInterval(() => {
  const now = S.key();
  if (now !== lastDay) { lastDay = now; render(); }
}, 60_000);

render();
