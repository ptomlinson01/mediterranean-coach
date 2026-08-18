# Plate

A weight-loss app for the iPhone, built for someone around 60 whose real obstacle is not
knowledge — it is a working week.

It is a self-contained web app you add to your home screen. No App Store, no account,
no server, no subscription. Everything lives on the phone.

**No unusual groceries.** Chicken, ground beef, eggs, canned tuna, salmon, shrimp, pork,
vegetables, rice, potatoes, bread and pasta. Every ingredient is sold in a normal American
supermarket under the name the app uses for it.

---

## What you actually eat

The pattern underneath is the one with the best evidence behind it — vegetables at the
center of the plate, olive oil as the main fat, chicken and fish more often than red meat,
beans and whole grains, fruit for dessert. That is the entire thing. It is often called
"Mediterranean", which makes people think they need feta, olives and a specialty aisle.
They do not. Nothing in this app requires an ingredient you would have to go looking for.

Carbs stay in. Rice, potatoes, bread and pasta are all here at sensible portions, because
a plan you resent is a plan you quit in March.

## The two ideas it is built on

**1. Hours worked drive everything.**
Most diet apps ask your weight and your goal. This one also asks how many hours you work
on each day of the week, because that is what actually decides whether a dinner plan
survives. Each day gets an archetype:

| Hours | Day type | What you get offered | Calorie split |
|---|---|---|---|
| 0 | Day off | Batch cooking, up to 2 hours | Even |
| 1–6 | Short day | Real cooking, up to 75 min | Even |
| 7–9 | Normal day | A 30-minute dinner | Even |
| 10–11 | Long day | One pan, 20 minutes | Bigger lunch, planned afternoon snack |
| 12+ | Brutal day | Assembly only, nothing hits a stove | Biggest lunch, largest snack |

The batch cook is placed on your lightest day and its leftovers are deliberately routed
forward to your heaviest ones. That is the whole trick — the plan survives a 13-hour
Thursday because Sunday already fed it.

Tap the hours button on Today whenever reality disagrees with the plan. A day that turns
into fourteen hours re-tunes every meal you have not eaten yet, and leaves alone the ones
you have.

**2. The personal-context method (after Daniel Miessler).**
The AI coach is never asked to be clever from a cold start. There is one explicit,
human-readable **context file** — who you are, your mission, the problems in your way,
your targets and why they are set there, your work pattern, today's plan, what you have
already eaten — and it is injected into every single request.

You can read it (Me → My context file), edit it, and copy it out. Alongside it are
twelve **patterns**: named prompts for the situations that actually recur, so at 7pm on a
bad day you tap a button instead of composing a question.

The context is the asset; the model is a swappable engine. That is why the copy button
exists — paste it into the Claude app, ChatGPT, or whatever you use in five years.

---

## Getting it onto your iPhone

It is already live here:

**https://ptomlinson01.github.io/mediterranean-coach/**

On the iPhone: open that link **in Safari** (not Chrome), tap **Share**, tap
**Add to Home Screen**, tap **Add**. Done — it behaves like a normal app from then on,
full screen, no browser bars, and works with no signal once it has loaded once.

### Pushing changes

Edit the files, then:

```bash
cd C:\Users\ptomlinson\Documents\DEV\SaaS\mediterranean-coach
git add -A && git commit -m "what changed" && git push
```

Live again in about a minute. On the phone, close the app fully (swipe it away in the app
switcher) and reopen it to pick up the new version — the offline cache serves the old one
until you do.

### Running it locally instead

To try changes before pushing:

```bash
cd C:\Users\ptomlinson\Documents\DEV\SaaS\mediterranean-coach
python -m http.server 8777
```

Then `http://localhost:8777` on the PC, or `http://<your-pc-ip>:8777` from the phone on
the same wifi.

---

## The AI coach

It works in two modes.

**Copy mode (no setup).** Tap any pattern and your whole context file plus the question
land on the clipboard. Paste into the Claude app. Costs nothing, one extra step.

**Connected mode.** Put an Anthropic API key in under **Me → AI coach** and replies stream
inside the app. Get a key at [console.anthropic.com](https://console.anthropic.com).

- The key is stored only in this phone's browser storage, sent only to Anthropic, and is
  deliberately stripped out of any backup you export.
- You pay Anthropic directly for what you use. Each question sends about 2,700 tokens of
  context, so on Claude Opus 5 a typical day of coaching is a few cents.
- Model and thinking effort are both switchable. Low effort is right for "what's for
  dinner"; raise it when you ask it to plan a week.
- Requests enable Anthropic's server-side fallback, so a request that trips a safety
  classifier gets re-routed rather than returning nothing.

---

## What is in the box

```
index.html            shell — five tabs and a sheet
styles.css            light + dark, iOS safe areas, nothing below 15px
manifest.webmanifest  home-screen install
sw.js                 offline cache (never touches the API)
make_icons.py         regenerates the icons: python make_icons.py
js/
  engine.js           BMR/TDEE, capped deficit, protein floor, day archetypes
  recipes.js          50 everyday recipes, each tagged with an effort tier
  planner.js          week building, leftover routing, portion sizing, groceries
  store.js            all state, localStorage only
  context.js          the context file, the system prompt, the twelve patterns
  ai.js               streaming Anthropic client
  app.js              screens and wiring
test/
  plan.test.mjs       planning-engine regression tests (node, no deps)
  ui.test.mjs         end-to-end tests in WebKit at iPhone size
```

### The numbers, and why they are what they are

- **Mifflin-St Jeor** BMR → activity multiplier → TDEE.
- **The deficit is capped at 22%** below maintenance, with a hard floor of 1,550 kcal
  (1,300 for women). Ask for 1.5 lb a week and you will be given about 1 lb and told why.
  At 60 the failure mode of a diet is not failing to lose weight, it is losing muscle
  along with the fat and ending up weaker.
- **Protein is 1.6 g per kg of goal weight** — the highest-priority number in the app, and
  the reason the picker biases toward high-protein meals.
- **Fat is 35% of calories.** Olive oil, nuts and oily fish are the point of this way of
  eating, not a compromise to be trimmed.
- **Portions move in quarters.** The recipes are written as one sensible plate, which for a
  200 lb man comes to roughly 1,450 kcal a day against a target near 1,950. Rather than
  invent bigger recipes, the planner serves more of the same food and tells you so
  ("one and a half"). Without this the app would quietly under-feed you by 500 kcal a day.
- **Equipment is honored.** A recipe declares what it needs (`needs: ['oven']`) and is
  never planned into a kitchen that does not have it. Onboarding used to ask and then
  ignore the answer, which is how a household with no blender got handed a smoothie.
- **Standing food rules live in the recipe data, not in a filter.** No raw tomatoes
  anywhere (cooked and canned are fine), no pork loin, cottage cheese is snack-only and
  never paired with tomatoes. Tests fail if any of these come back.
- **Only normal groceries.** A regression test fails the build if a recipe sneaks in a
  British term (courgette, tinned, rocket) or a specialty item (farro, harissa, tahini).
  The bar is: could you buy this at H-E-B without asking anyone where it is.
- **A batch cook may reappear at most twice.** The supply-chain logic would happily route a
  six-serving braise across six consecutive nights, which is arithmetically perfect and
  completely inedible. Anything over the cap is flagged for the freezer.

## Tests

```bash
node test/plan.test.mjs                      # engine + planner, no dependencies

npm i -D playwright && npx playwright install webkit
python -m http.server 8777 --bind 127.0.0.1 &
node test/ui.test.mjs                        # full walkthrough in WebKit, screenshots to test/shots/
```

The planning tests assert the things that would quietly ruin the app: that no day drops
under the calorie floor, that no meal exceeds the effort its day allows, that a 12-hour
day never gets asked to cook, that nothing you dislike leaks into a plan, and that no dish
turns up more than three times in a week.

## Your data

Everything is in this browser's `localStorage`. Nothing is uploaded. The only bytes that
leave the phone are the messages you deliberately send to the coach.

The flip side: clearing Safari's website data wipes it. **Me → Backup and reset** copies
your whole record as JSON — do that occasionally and paste it somewhere safe.

---

## A note on the repo name

The repository and URL still say `mediterranean-coach` because the app is already installed
on a phone pointing at that address, and renaming it would break the home-screen icon. The
app itself is called Plate. If the URL ever needs to match, that is a rename plus
re-adding it to the home screen.

## Not medical advice

This is general nutrition guidance. It is not a substitute for a doctor or a dietitian.

If you take medication for blood pressure or diabetes, tell your doctor that you are
losing weight before you start. Those doses very often need adjusting as weight comes
off, and that needs supervision rather than guesswork.
