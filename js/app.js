/* app.js — screens, wiring and everything the thumb touches. */

import * as S from './store.js';
import { ACTIVITY, targets, dayType, DAY_TYPES, EFFORT, weeklyHours, fmtDate, bmi } from './engine.js';
import { RECIPES, BY_ID, AISLE_LABEL, searchRecipes } from './recipes.js';
import { SLOTS, SLOT_LABEL, buildWeek, swap, retune, groceries, qty, headline, freezerNote, totals, served } from './planner.js';
import { PROBLEMS, PATTERNS, buildContext, portablePack } from './context.js';
import { MODELS, ask, testKey, AiError } from './ai.js';

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

function renderOnboard() {
  const s = S.get();
  draft ||= { profile: structuredClone(s.profile), telos: structuredClone(s.telos) };
  const p = draft.profile;
  const steps = [welcomeStep, aboutStep, workStep, kitchenStep, problemsStep, limitsStep, resultStep];
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
  if (finish) finish.onclick = () => {
    collect();
    S.set(st => {
      st.profile = draft.profile;
      st.telos = draft.telos;
      st.profile.startWeight = draft.profile.weight;
      st.onboarded = true;
      st.plan = buildWeek(draft.profile, targets(draft.profile).kcal, Math.floor(Math.random() * 1e6));
      st.grocery = { checked: [], builtFor: st.plan.start };
    });
    S.setDay(S.key(), { weight: draft.profile.weight });
    draft = null;
    show('today');
    toast('Week built. Start with today.');
  };

  function collect() {
    host.querySelectorAll('[data-field]').forEach(inp => {
      const path = inp.dataset.field;
      const numeric = inp.type === 'number' || inp.type === 'range' || inp.dataset.num !== undefined;
      let val = numeric ? Number(inp.value) : inp.value;
      if (path.startsWith('workHours.')) draft.profile.workHours[Number(path.split('.')[1])] = val;
      else if (path.startsWith('telos.')) draft.telos[path.split('.')[1]] = val;
      else draft.profile[path] = val;
    });
    if (step === 1) {
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

function planDay(k = S.key()) {
  const s = S.get();
  if (!s.plan) return null;
  const i = s.plan.days.findIndex(d => d.date === k);
  return i < 0 ? null : { day: s.plan.days[i], index: i };
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
  const dayTot = totals(day);

  $('#todayHost').innerHTML = `
    <div class="daybar" style="--tone:${type.colour}">
      <div class="daybar-top">
        <span class="pill" style="background:${type.colour}">${esc(type.label)}</span>
        <button class="hours-btn" id="editHours">${hrs}h worked ✎</button>
      </div>
      <p class="rule">${esc(headline(day))}</p>
      ${freezerNote(day) ? `<p class="freeze">${esc(freezerNote(day))}</p>` : ''}
    </div>

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

    <div class="card">
      <h3>Weigh-in</h3>
      <div class="weigh">
        <input id="wtInput" type="number" inputmode="decimal" step="0.1" placeholder="${S.trend()}" value="${log.weight ?? ''}">
        <button class="btn" id="wtSave">Log</button>
      </div>
      <p class="fine">Trend weight ${S.trend()} lb${S.trendDelta() !== null ? ` · 14-day move ${S.trendDelta() > 0 ? '+' : ''}${S.trendDelta()} lb` : ''}. React to the trend, never to one morning.</p>
    </div>

    <div class="card">
      <h3>Note to your coach</h3>
      <textarea id="dayNote" rows="2" placeholder="Slept badly. Client dinner tonight.">${esc(log.note)}</textarea>
      <button class="btn ghost sm" id="noteSave">Save note</button>
    </div>`;

  $('#editHours').onclick = () => askHours(index, k);
  $('#wtSave').onclick = () => {
    const v = Number($('#wtInput').value);
    if (!v || v < 60 || v > 700) return toast('That weight looks wrong.');
    S.setDay(k, { weight: v });
    S.set(st => { st.profile.weight = v; });
    toast('Logged.');
    render();
  };
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
    <button class="rowbtn" id="editContext"><span>My context file</span><i>›</i></button>
    <button class="rowbtn" id="aiSettings"><span>AI coach</span><i>${s.settings.apiKey ? 'connected' : 'copy mode'} ›</i></button>
    <button class="rowbtn" id="dataBtn"><span>Backup and reset</span><i>›</i></button>

    <p class="fine disclaimer">General nutrition guidance, not medical advice. If you take medication for blood pressure or diabetes, tell your doctor you are losing weight — those doses very often need adjusting as the weight comes off.</p>`;

  $('#editProfile').onclick = openProfile;
  $('#editContext').onclick = openContext;
  $('#aiSettings').onclick = openAi;
  $('#dataBtn').onclick = openData;
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

/* A day rolls over while the app sits open on the home screen. */
let lastDay = S.key();
setInterval(() => {
  const now = S.key();
  if (now !== lastDay) { lastDay = now; render(); }
}, 60_000);

render();
