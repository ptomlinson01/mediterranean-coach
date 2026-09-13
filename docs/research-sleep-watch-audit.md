# Trim Path — Sleep, Apple Watch, and the men-in-their-50s stomach

*Research and strategy audit, 13 September 2026. Written to decide what goes into the next
version of Trim Path (the app in this repo, called "Plate" on the phone).*

The one-line conclusion: **the biggest lever Trim Path is not pulling is sleep, and the
Apple Watch already measures it.** Rise's core mechanic (sleep debt over 14 nights) is
worth building in-house. Its energy-schedule theatre and 16-habit nudge system are not.
Alongside sleep, the evidence for a man in his 50s points at four things the app does not
yet track: waist, alcohol, resistance training, and steps.

---

## 1. Rise (risescience.com), dissected

Rise is a $60/year iPhone app (7-day trial, then annual; lifetime option) built on the
**two-process model of sleep regulation**: Process S, homeostatic sleep pressure that rises
while awake and falls while asleep; Process C, the circadian pacemaker that gates it. The
founders (Kahn and Sasson) came out of an apprenticeship in sleep research and hold a US
patent (11,241,194) on predicting cognitive performance from sleep history.

### What it actually computes

| Piece | How Rise does it | Notes |
|---|---|---|
| **Sleep need** | Estimated per person from a long history of phone-use/sleep data; presented as a single number (e.g. 8h 10m). | This is the least transparent part. In practice most adults land 7.5–8.5h. For a 50s male a default of 7.5h with a manual override is defensible. |
| **Sleep debt** | Sum of (need − actual) over the **last 14 nights**, weighted: last night counts 15%, the previous 13 nights share 85% with more recent nights weighted higher. Displayed as hours owed. | This is the core asset. Rise recommends keeping debt **under 5 hours**. It is simple, explainable, and cheap to compute from Watch data. |
| **Energy schedule** | A predicted daily curve with named zones: *grogginess zone* (sleep inertia after waking), *morning peak*, *afternoon dip*, *evening peak*, *wind-down*, *melatonin window* (best time to fall asleep). | Derived from wake time + sleep need + circadian phase estimates. Useful as a "when to wind down / when is the kitchen closed" signal. As precise-looking hourly curves it is mostly theatre. |
| **16 habits** | Timed nudges (light exposure, caffeine cut-off, wind-down, etc.) delivered when the schedule says they matter. | Notification-heavy. Push works in iOS home-screen web apps but fatigue is real; do not copy wholesale. |
| **Inputs** | Apple Health (which is where Apple Watch sleep lands), Oura, Fitbit, Sleep Cycle, phone-motion fallback. Checks Apple Health each morning. | Confirms the pipeline we need is *Watch → Apple Health → app*. |
| **Smart alarm** | Wakes you in a light stage inside a window. | Not possible in a web app. Skip. |

### Rise's weight-loss positioning

Their blog ("How to lose belly fat overnight", "Sleep and weight loss", "Cortisol belly
myths") argues: sleep debt raises ghrelin and cortisol, lowers leptin, drives evening
cravings and fat storage around the middle; keep debt under 5h and eat in sync with your
circadian rhythm. The mechanism claims are broadly supported (section 2). The "melt belly
fat" framing is marketing.

### What to take, what to leave

**Take:** the 14-night weighted sleep debt number; the concept of a single "sleep need"
you are measured against; the wind-down / melatonin-window idea reframed as a *kitchen
closes* time; "last night counts most, but the fortnight is what matters".

**Leave:** the hourly energy curve, the habit-nudge engine, the smart alarm, any claim of
a personalised sleep need we cannot actually estimate.

---

## 2. Why sleep belongs in a weight-loss app for a man in his 50s

The strongest single piece of evidence is a randomised trial, not an association study:

- **Tasali et al., JAMA Internal Medicine 2022.** 80 overweight adults habitually sleeping
  under 6.5h. One sleep-hygiene counselling session extended sleep by ~1.2h/night. Over two
  weeks, objectively measured energy intake fell by **~270 kcal/day** versus controls, with
  no change in energy expenditure. Nobody was told to eat less. That deficit alone is
  roughly 0.5 lb a week — about half the deficit Trim Path already prescribes.
- **Spiegel et al., Annals of Internal Medicine 2004.** Two nights at 4h in bed versus 10h:
  leptin down ~18%, ghrelin up ~28%, hunger up ~24%, with a specific pull toward
  calorie-dense, high-carbohydrate food. Sleep loss also raises cortisol **the next
  evening** — which is exactly when Trim Path's users say they lose the day.
- **Visceral fat.** Cross-sectional work (large East Asian cohorts, MrOS in older men) links
  short sleep to visceral obesity. The effect in men is less consistent than in women, so
  treat it as supporting evidence, not the headline.
- **Timing.** In overweight older adults, later last-meal times and longer eating windows
  track with worse triglycerides and HDL; a 2025 RCT found *early* time-restricted eating
  plus calorie restriction beat *late* TRE for body fat. This is the evidence base for a
  "kitchen closes" time, without needing to sell fasting.

The practical reading for the app: **a short night predicts a bad evening.** The coach
should know about it before dinner, not find out at the weekly review.

---

## 3. What the Apple Watch already gives us

Everything below lands in Apple Health automatically if he sleeps with the watch on.

| Metric | Source | Use in Trim Path |
|---|---|---|
| Sleep duration, in-bed, stages (Core/Deep/REM/Awake) | Sleep app, watchOS 9+ | Sleep debt input. Duration is what matters; stages are noise for our purpose. |
| **Sleep Score** (0–100): duration 50 pts, bedtime consistency 30 pts (last 13 nights), interruptions 20 pts | watchOS 26 | Nice single number to show; but compute our own debt so the logic is ours. |
| Overnight vitals: heart rate, respiratory rate, wrist temperature, SpO₂ | Vitals app, watchOS 11+ (28-day baseline; flags when 2+ metrics are out of range and literally asks "did you drink alcohol?") | An out-of-range night is a strong "went heavy last night" signal. Use it to prompt an alcohol tick-box. |
| HRV, resting heart rate | Watch | Trend only. A rising resting HR over a week usually means alcohol, illness, or sleep debt. |
| Steps, active energy, workouts | Watch | Steps target; resistance-session detection (strength workouts show up as a workout type). |

### The hard constraint: a web app cannot read HealthKit

Trim Path is a home-screen web app. There is no HealthKit for the web, and iOS still does
not support the Web Share Target API, so the app cannot be a share destination either.
Home-screen web apps also have storage separate from Safari, so a Shortcut that "opens a
URL with the data in it" would land in Safari, not in the installed app.

Three realistic pipelines:

1. **Shortcut → clipboard → "Paste from Watch" button.** *(Recommended.)* A Shortcut uses
   *Find Health Samples* (Sleep Analysis, Step Count, Resting Heart Rate, last 14 days),
   formats a small JSON, copies it to the clipboard. A personal automation runs it in the
   morning. In the app, one button on Today reads the clipboard and merges the data. Two
   taps a day, no server, no account, consistent with the app's no-upload promise.
   Constraint: Health can only be read while the phone is unlocked, so the automation
   should fire on an unlock/alarm trigger rather than a fixed time.
2. **Health Auto Export app → REST / iCloud Drive.** Fully automatic, but needs somewhere
   to receive the data. Trim Path has no server, by design. Not now.
3. **Manual entry.** Sleep hours, steps, and drinks as three fields on the weigh-in card.
   Must exist anyway as the fallback for a night without the watch.

Suggested clipboard contract (the Shortcut produces this; the app accepts it):

```json
{
  "src": "trimpath-shortcut/1",
  "nights": [
    { "date": "2026-09-13", "asleepMin": 402, "inBedMin": 455, "bedtime": "23:41", "wake": "07:16", "score": 71 }
  ],
  "days": [
    { "date": "2026-09-12", "steps": 6210, "restingHR": 58, "hrv": 34, "activeKcal": 410, "strength": true }
  ]
}
```

---

## 4. Audit: who else is doing what

| Product | Core mechanic | Worth stealing | Skip |
|---|---|---|---|
| **Rise** ($60/yr) | Sleep need → 14-night sleep debt → energy schedule; timed habit nudges | Sleep debt number; "kitchen closes" derived from wind-down | Energy curve precision, nudge volume, smart alarm |
| **Whoop** (~$240/yr + band) | Strain vs Recovery (HRV, RHR, sleep), sleep debt, alcohol/behaviour journal with correlations | The **journal**: tick "alcohol", "late meal", "screen before bed" and it shows you what each does to *your* recovery. Cheap to build, very persuasive for a data-minded 50s man. | Strain scoring; another wearable |
| **Oura** (~$70/yr + ring) | Sleep, Readiness, temperature, HRV | Readiness as a "go easy today" flag | Ring; we have a watch |
| **Athlytic / Bevel / Gentler Streak** ($25–50/yr) | Read Apple Health and produce a Whoop-style recovery score from the Watch you already own | Proof the Watch data is enough; Bevel's one-dashboard layout | We are not a recovery app |
| **Apple Sleep Score + Vitals** (free) | Duration/consistency/interruptions score; overnight outlier alerts that ask about alcohol | Use as inputs; mirror the "was it alcohol?" question | Nothing — it is free and already on his wrist |
| **MacroFactor / Carbon** ($72/yr) | Adaptive TDEE: infer real expenditure from weight trend vs logged intake; re-target weekly | **Adaptive maintenance.** Trim Path uses a static Mifflin-St Jeor number. With trend weight and adherence already logged, a simple weekly correction ("you lost 0.4 lb/wk on 1,950, so maintenance is really ~2,250") is one function in engine.js. | Gram-level food logging — the app deliberately avoids it |
| **Noom** ($200+/yr) | CBT-flavoured psychology lessons, colour-coded foods, human coach | Naming the problem (Trim Path already does this in PROBLEMS) | Daily lessons; calorie-density colour coding |
| **ZOE** ($300+/yr) | Personalised gut/glucose/fat response testing → food scores | Nothing buildable; the science is oversold for weight loss | All of it |
| **Lumen** (~$250 device) | Breath acetone/CO₂ → "fat vs carb burning" → daily macro nudge | Nothing; validation is weak | All of it |
| **Fit Father Project / FF30X** | Men 40+: simple meal plan, 30-min workouts, sleep reset, mindset, community | The **positioning** — "busy men over 40/50", muscle-loss framing, sleep as a foundation. Confirms our audience and tone. | Coaching upsells |

Pattern across the field: the products that retain people either (a) make one number
honest and adaptive (MacroFactor's expenditure, Rise's debt, Whoop's recovery) or (b)
correlate a behaviour with a body signal the person can feel (Whoop journal, Apple Vitals).
Trim Path already has the honest-number DNA (capped deficit, protein floor, trend weight).
It is missing the behaviour ↔ signal loop entirely.

---

## 5. What actually moves the stomach for a man in his 50s

Ranked by strength of evidence, not by novelty. Spot reduction does not exist; the belly is
usually the last place fat leaves, and the job is total fat loss while keeping muscle.

1. **A moderate, sustained calorie deficit.** Already in the app. Nothing to change except
   making maintenance adaptive (section 4).
2. **Protein plus resistance training, 2–3 sessions a week.** Meta-analyses: resistance
   training reduces visceral fat (SMD −0.49 vs control) and roughly doubles the muscle
   preserved during a diet; men in RT groups lost ~9 cm of waist vs ~6 cm for non-exercisers
   in one review. Concurrent aerobic + resistance is best for total fat; resistance is what
   protects the muscle he cannot afford to lose at 55. **The app has a 1.6 g/kg protein
   floor but never asks whether he lifts.**
3. **Sleep: debt under ~5h, 7–8h a night.** −270 kcal/day intake in an RCT with no effort
   spent on food. Section 2.
4. **Alcohol.** More than ~20 g/day (about 1.5 drinks) is consistently associated with larger
   waists in men; a 2025 study links high intake to greater visceral fat accumulation. It
   also wrecks the sleep score, which makes it easy to show him the loop. "Wine adds up" is
   already a PROBLEMS entry — it is currently unmeasured.
5. **Steps.** 10–12k/day tracks with lower waist and body fat; an RCT found 12k steps alone
   was not enough without some intensity — which is the resistance-training point again.
6. **Earlier last meal / shorter eating window.** Modest evidence, but it maps directly onto
   the app's two biggest named problems (evenings, long days). Frame as "kitchen closes at
   8:30" not "fasting".
7. **Measure the waist, not just the scale.** Weekly tape at the navel, relaxed, after the
   morning weigh-in. Weight stalls while waist keeps dropping when he is lifting. For this
   audience the waist is the number they actually care about; make it the headline.

---

## 6. Recommendation: Trim Path v2 scope

### Priority 1 — build these

**A. Waist as the headline number.** Weekly tape entry on the weigh-in card, 4-week trend,
shown on Today next to trend weight. Add to the context file.

**B. Sleep debt engine.** In `engine.js`: `sleepNeed` (profile, default 7.5h for a male
50+; editable), `sleepDebt(log)` using the Rise weighting (last night 15%, prior 13 nights
85% recency-weighted), a "kitchen closes" time = target bedtime − 2.5h, where target
bedtime = usual wake time − sleep need. Fed by the Shortcut paste (section 3) or manual
hours.

**C. Sleep as a second axis on day type.** Today Trim Path picks a day archetype from hours
worked. Add sleep debt as a modifier: a **rough day** (debt > 5h or last night < 6h) gets
the long-day treatment regardless of hours — bigger lunch, planned afternoon protein snack,
assembly-only dinner, and an explicit note in the context so the coach expects cravings and
says so before they arrive.

**D. Context file additions.** Last night's sleep, 14-night debt, sleep score, steps
yesterday, resting-HR 7-day trend vs 28-day, drinks last night, waist trend, strength
sessions this week. This is what makes the coach feel like it already knows.

**E. New named problem and patterns.**
- PROBLEMS: `sleep` — "I run on six hours and eat my way through the afternoon."
- Patterns: **"I slept badly"** (what to eat and expect today), **"Wine tonight"** (how to
  fit two glasses without losing the day), **"Weekend rescue"**, **"Do I lift or walk today?"**

### Priority 2 — build next

**F. The behaviour journal.** Nightly tick-boxes: drinks (0/1/2/3+), ate after kitchen
closed, screen in bed, strength session. After 3–4 weeks, show one line per behaviour:
"Nights with 2+ drinks: sleep score 58 vs 76, next-day adherence 40% vs 80%." This is the
Whoop trick and it is the most persuasive screen the app could have.

**G. Adaptive maintenance.** Weekly: compare expected vs actual trend-weight change, nudge
the TDEE estimate, keep the 22% cap and the floor. Show the correction in "Explain my
numbers".

**H. Steps and lifting as accountability, not programming.** A weekly target (steps/day,
2 strength sessions) with ticks; the coach nags gently. Trim Path stays a food app.

### Priority 3 — maybe

**I.** Wind-down reminder as a push notification (works in iOS home-screen web apps).
**J.** A simplified energy-window display ("wind down from 21:30") — only if B is in.

### Do not build

The energy curve, habit nudge engine, smart alarm, food-photo logging, anything requiring
a server. The no-account / no-upload promise is a feature for this audience.

### Data model sketch

```js
// store.js  log['YYYY-MM-DD'] gains:
{ sleepMin, inBedMin, bedtime, wake, sleepScore,
  steps, restingHR, hrv, activeKcal,
  drinks, ateLate, strength, waist }

// profile gains:
{ sleepNeedMin: 450, stepTarget: 9000, liftTarget: 2 }
```

---

## Sources

Rise: [risescience.com](https://www.risescience.com/) · [sleep debt method](https://www.risescience.com/blog/best-sleep-debt-tracking-app) · [Apple Watch setup](https://help.risescience.com/hc/en-us/articles/4405263000471-How-do-I-set-up-RISE-on-my-Apple-Watch) · [energy schedule](https://help.risescience.com/hc/en-us/articles/6654243671191-What-is-my-Daily-Energy-Energy-Schedule) · [biological clock zones](https://www.risescience.com/blog/biological-clock) · [pricing](https://help.risescience.com/hc/en-us/articles/4405177615639-How-much-does-RISE-cost-and-what-are-the-subscription-options) · [belly-fat blog](https://www.risescience.com/blog/how-to-lose-belly-fat-overnight) · [cortisol belly](https://www.risescience.com/blog/how-to-stop-cortisol-weight-gain) · [Crunchbase / two-process model](https://news.crunchbase.com/health-wellness-biotech/get-out-of-sleep-debt-rise-science-secures-15-5m-for-app-to-boost-energy-levels/) · [US patent 11,241,194](https://image-ppubs.uspto.gov/dirsearch-public/print/downloadPdf/11241194) · [Mattress Clarity review](https://www.mattressclarity.com/accessories/rise-app-review/)

Sleep and weight: [Tasali 2022 RCT (PMC)](https://www.ncbi.nlm.nih.gov/pmc/articles/PMC8822469/) · [NIH summary](https://www.nih.gov/news-events/nih-research-matters/getting-sufficient-sleep-reduces-calorie-intake) · [Spiegel 2004, Annals](https://www.acpjournals.org/doi/10.7326/0003-4819-141-11-200412070-00008) · [Sleep debt and obesity review](https://www.tandfonline.com/doi/full/10.3109/07853890.2014.931103) · [sleep deprivation, hormones (Medscape)](https://www.medscape.org/viewarticle/502825) · [visceral obesity, gender-specific (PMC)](https://www.ncbi.nlm.nih.gov/pmc/articles/PMC9700701/) · [MrOS cortisol](https://www.ncbi.nlm.nih.gov/pmc/articles/PMC3815404/) · [meal timing in obese older adults](https://www.ncbi.nlm.nih.gov/pmc/articles/PMC8680089/) · [early vs late TRE RCT 2025](https://www.sciencedirect.com/science/article/pii/S0261561425000950) · [circadian nutrition review 2025](https://link.springer.com/article/10.1186/s41043-025-01102-y)

Belly fat in men: [Frontiers 2025, resistance training for high-quality weight loss](https://www.frontiersin.org/journals/endocrinology/articles/10.3389/fendo.2025.1725500/full) · [RT during dietary weight loss meta-analysis (PMC)](https://pmc.ncbi.nlm.nih.gov/articles/PMC12406911/) · [concurrent vs RT vs aerobic (PubMed)](https://pubmed.ncbi.nlm.nih.gov/40405489/) · [exercise and visceral fat meta-analysis 2025](https://www.sciencedirect.com/science/article/abs/pii/S1871403X25001188) · [Mayo Clinic, belly fat in men](https://www.mayoclinic.org/healthy-lifestyle/mens-health/in-depth/belly-fat/art-20045685) · [12,000 steps RCT](https://pmc.ncbi.nlm.nih.gov/articles/PMC6724241/) · [alcohol and visceral fat 2025](https://pmc.ncbi.nlm.nih.gov/articles/PMC13287011/) · [alcohol and waist, CARDIA](https://pmc.ncbi.nlm.nih.gov/articles/PMC9994756/) · [alcohol and abdominal obesity, Korea](https://www.ncbi.nlm.nih.gov/pmc/articles/PMC2984859/) · [9-year waist gain in 16,587 US men](https://pubmed.ncbi.nlm.nih.gov/14522729/)

Apple Watch: [Sleep Score (Apple)](https://support.apple.com/guide/watch/view-your-sleep-score-apded441a669/watchos) · [how Sleep Score works (AppleInsider)](https://appleinsider.com/articles/25/09/12/how-sleep-score-works-on-apple-watch-with-watchos-26) · [Vitals app (Apple)](https://support.apple.com/en-us/120142) · [Vitals guide (XDA)](https://www.xda-developers.com/guide-to-the-vitals-app-in-watchos-11/) · [Series 9/Ultra 2 HRV validity](https://www.ncbi.nlm.nih.gov/pmc/articles/PMC11478500/)

Getting data into a web app: [Health Auto Export](https://apps.apple.com/us/app/health-auto-export-json-csv/id1115567069) · [Shortcut to export sleep data](https://talk.automators.fm/t/shortcut-to-export-sleep-data/18100) · [Shortcuts + serverless health API](https://blog.maximeheckel.com/posts/build-personal-health-api-shortcuts-serverless/) · [Intervals.icu Shortcuts thread](https://forum.intervals.icu/t/getting-wellness-data-from-your-apple-watch-via-apple-shortcuts/86164) · [Apple Watch sleep via Shortcuts](https://prokopov.me/posts/apple-watch-sleep-openclaw-shortcuts/) · [PWA iOS limits 2026](https://www.magicbell.com/blog/pwa-ios-limitations-safari-support-complete-guide) · [what PWAs can do on iOS 2026](https://tips.ojapp.app/en/pwa-ios-2026-complete-guide/)

Other products: [MacroFactor algorithm accuracy](https://macrofactor.com/algorithm-accuracy/) · [MacroFactor vs Carbon 2026](https://caleye.fit/blog/carbon-vs-macrofactor-2026/) · [Athlytic vs Bevel vs Gentler Streak](https://healthgenieapp.com/blog/athlytic-vs-bevel-vs-gentler-streak.html) · [Whoop vs Oura vs Apple Watch 2026](https://askvora.com/blog/whoop-vs-oura-ring-2026) · [recovery apps compared](https://www.corahealth.app/blog/best-recovery-apps) · [Fit Father Project, men over 50](https://www.fitfatherproject.com/weight-loss-plan-for-men-over-50/)
