# Legacy Chat Context
### Zeta — Behavioral Analytics Research Project
*Conversation summary for continuity across sessions*

---

## 1. Who is This

**Praneeth** — student researcher and builder, currently pursuing Data Engineering coursework while conducting academic research. Has a builder/researcher mindset, prefers directness and technical depth. Comfortable with systems-level thinking, React Native, and LLM tooling.

---

## 2. The Research Project

### Working Title
**"Behavioral Analysis of User Interactions Influenced by Psychological UI/UX Cues in Mobile Applications"**

### Domain
User Behavior Analytics in Mobile Applications → broad area: **Software Engineering**

### SDG
**SDG 9 — Industry, Innovation and Infrastructure**
(Technology innovation, software design, digital infrastructure research)

### Keywords
Psychological UI/UX Cues · User Behavior Analysis · Behavioral Analytics · Mobile Applications

---

## 3. How the Project Started

**Day 1 concept:** Broad interest in how psychological design choices (color psychology, button placement, visual hierarchy, progress indicators, notifications, gamification) influence user decisions in mobile apps.

**Guide's input:** Praneeth's guide cited the Amazon button-placement example — a simple repositioning of a purchase button can shift behavior and sales. The core takeaway: *small UI changes produce measurable behavioral changes.*

**Pivot:** Instead of surveying people about what they *think* influences them, the guide proposed building a mobile app that measures what users *actually do*. The app itself becomes the research instrument.

---

## 4. Research Methodology

**Approach:** Behavioral analytics through a custom-built mobile experimental platform.

**Why this is stronger than surveys:**
- Captures real behavior, not perceived/reported behavior
- Objective, timestamped, coordinate-level data
- Eliminates social-desirability bias and recall error
- Produces visual data artifacts (heatmaps) suitable for publication

**Five experimental variables tested:**
1. Button/target position (spatial attention, Fitts's Law)
2. Color salience (instructed vs. unguided)
3. Visual hierarchy and affordance strength
4. Multi-touch adoption behavior
5. Progress indicator effects on task persistence

**Data collected:**
- Touch coordinates (stored as % of screen dimensions for cross-device normalization)
- Reaction time (stimulus onset → response timestamp)
- Accuracy and miss distance from target center
- Multi-touch simultaneity gap (ms between touch events)
- Task completion vs. abandonment (and at what %)
- One self-report item in Module 5 (subjective time perception slider, triangulated against real elapsed time)

---

## 5. The App — Zeta

### Name
**Zeta**

### Theme
Space / sci-fi — specifically styled after a ringed planet logo (deep navy background, blue–cyan–violet–magenta gradient, glowing ring accents, faint starfield). The theme is cosmetic, not load-bearing — it exists to reduce self-consciousness in participants and justify randomized task sequencing in-fiction ("ship diagnostics").

### Narrative Frame
User is a space cadet completing "ship diagnostics" before a mission. Each module is framed as a diagnostic calibration task. This reduces the "I know I'm being tested" effect that can distort natural behavior.

### Logo Description
Ringed planet (Saturn-style), electric blue → purple/magenta swirl with glowing ring, dark navy background, "Z E T A" wordmark in spaced geometric sans-serif with cyan dot and violet dot as accent flanks.

### Tech Stack
**React Native** (cross-platform, good touch event API access via gesture handlers)

---

## 6. The Five Modules — Full Spec

### Module 1 — Sensor Calibration (Position Task)
**Construct:** Spatial attention bias / Fitts's Law / screen-zone preference

**Design:**
- 12–15 trials per session
- Circular target (size randomized: 38/50/62px) appears at one of 9 grid positions (3×3) after a randomized delay (800–2000ms)
- Participant taps target as soon as it appears
- No wrong-answer feedback — brief pulse/fade on tap

**Data logged:** target position (grid + exact x/y %), target size, stimulus-onset timestamp, tap timestamp (→ RT), tap coordinates (→ accuracy/offset), miss boolean

**Research angle:** Correlates position preference with handedness (collected at onboarding). Validates classic attention/RT paradigms.

---

### Module 2 — Signal Decoder (Color Salience Task)
**Construct:** Color salience / pop-out effect / instructed search vs. natural attraction

**Design:**
- 4–6 colored circles of identical size/shape appear per trial
- **Instructed trials:** target swatch shown at top, user taps matching color (measures accuracy + RT for color identification)
- **Uninstructed trials:** no swatch shown, user taps "whichever signal feels strongest" (measures genuine color attraction)
- Colors used: red, blue, green, neutral gray, cyan, magenta/purple

**Data logged:** trial type (instructed/uninstructed), color→position mapping, which color was tapped, RT, tap coordinates

**Research angle:** Separates instructed color-following accuracy from psychological color attraction. Directly addresses the "is red salient?" question with behavioral rather than survey data.

---

### Module 3 — Command Console (Visual Hierarchy Task)
**Construct:** Visual hierarchy / affordance strength / which visual property draws first tap under ambiguity

**Design:**
- Instruction is deliberately vague: "Stabilize the ship."
- Screen shows 3–5 buttons with varied: size, position, visual weight (filled gradient vs outline), label (all plausible: "Engage thrusters," "Stabilizers," "Aux power," "Comms array")
- No wrong-answer feedback — any tap is accepted and narrative proceeds
- 4–5 layout variants per session; button visual properties reshuffled per variant to decouple position effects from prominence effects

**Data logged:** layout configuration ID, (size, position, visual weight, label) → button mapping, which was tapped first, time to first tap

**Research angle:** Tests HCI heuristics — "primary actions should be large, centered, high-contrast" — with behavioral evidence rather than expert opinion.

---

### Module 4 — Dual Core Reactor (Multi-Touch Task)
**Construct:** Multi-touch adoption / sequential vs. simultaneous touch behavior / effect of spatial separation on input strategy

**Design:**
- Two circular targets appear simultaneously at varied distances (close / opposite corners / same side / split sides)
- Instruction: "Both reactor cores must be activated together."
- No penalty for sequential single-finger approach — measure what naturally occurs
- 8–10 trials per session varying target distance and placement

**Data logged:** target positions (both), number of simultaneous touch points, timestamps of each touch-down, gap between touches (ms), which target touched first if sequential

**Research angle:** Multi-touch adoption is understudied. Does spatial separation of targets predict two-finger use? Does handedness interact with which side is tapped first?

---

### Module 5 — Hyperdrive Sequence (Progress Indicator Task)
**Construct:** Progress indicator presence/type → effect on persistence, perceived wait time, and abandonment rate

**Design:**
- Hold/tap interaction that takes a fixed real duration (8–12s)
- **Between-subjects design** (one condition per participant, assigned at session start):
  - Condition A: Accurate animated progress bar
  - Condition B: Artificially stalled bar (stalls at 80–95%, then completes) — tests near-completion frustration
  - Condition C: No progress indicator, static "charging…" label
  - Condition D: Indeterminate spinner (no completion estimate)
- One self-report item post-task: "How long did that feel?" (slider: very fast → very slow)

**Data logged:** assigned condition, actual elapsed time, completed vs. abandoned, abandonment % point (if early release), number of re-press events, subjective time-estimate slider value

**Research angle:** Between-subjects design (gold standard for carryover avoidance). Connects to "Labor Illusion" literature. Slider triangulates against objective RT — a well-justified use of one self-report item in an otherwise behavioral study.

---

## 7. Screen Flow

```
Splash → Consent → Onboarding (demographics) → Home Hub
→ Module 1 → Module 2 → Module 3 → Module 4 → Module 5
→ Results / Debrief
(+ Hidden admin screen: heatmap viewer + CSV/JSON export)
```

**Unlock logic:** Modules unlock sequentially on first session (controls order effects for clean baseline dataset). Returning users get "free diagnostic" mode (all unlocked, user picks order) — this becomes a *second* dataset measuring preference/attention order.

---

## 8. Visual / Design System

| Element | Value |
|---|---|
| Background | `#0A0A14` → `#10101C` |
| Card surfaces | `#12121E` – `#14141F` |
| Primary gradient | Blue → cyan → violet → magenta |
| Accent cyan | `#4FD1FF` |
| Accent magenta | `#C46BFF` |
| Text primary | `#E8E8F0` |
| Text secondary | `#8A8AA0` / `#9090AC` |
| Typography | Geometric sans-serif, generous letter-spacing on headers |
| Motion rule | **No decorative animation on test screens.** Only the stimulus target pulses. Decorative animation confined to splash, loading, transitions. |

---

## 9. Data Schema (Conceptual)

```json
{
  "participant_id": "uuid",
  "session_id": "uuid",
  "module": "sensor_calibration",
  "trial_index": 3,
  "condition": {
    "target_position": "top_left",
    "target_size": 48
  },
  "timestamps": {
    "stimulus_onset": 1234567890,
    "response": 1234568120
  },
  "response": {
    "x_pct": 0.18,
    "y_pct": 0.12,
    "hit": true
  },
  "device": {
    "screen_w": 390,
    "screen_h": 844,
    "platform": "ios"
  }
}
```

**Key rule:** coordinates stored as % of screen dimensions, not raw pixels — essential for cross-device heatmap aggregation.

---

## 10. Artifacts Produced in This Chat

| Artifact | Description |
|---|---|
| `Zeta_App_Design_Spec.md` | Full design + behavior specification, all 10 screens, data schema, build order |
| `zeta_app_prototype.html` | Fully themed dark-space HTML prototype, all 5 modules interactive with simulated logging |
| `legacy_chat_context.md` | This file |

---

## 11. Key Methodological Decisions Made

- **No decorative animation during test screens** — prevents confounding visual attention data
- **No wrong-answer feedback on ambiguous tasks** (Module 3) — prevents anchoring on "safe" choices in subsequent trials
- **Instructed vs. uninstructed split in Module 2** — decouples task-following accuracy from genuine color salience
- **Between-subjects for Module 5** — prevents carryover/expectation effects across progress-indicator conditions
- **Coordinates as screen %** — normalizes across device sizes for heatmap aggregation
- **One justified self-report item** (Module 5 time perception) — shows methodological awareness, directly triangulates against objective data

---

## 12. Reference Paper (Paper 1)

**Title:** User Interface Factors of Mobile UX: A Study with an Incident Reporting Application
**Relevance:** Studies mobile interface factors through actual user interaction experiments — closest match to Zeta's methodology in the literature.

---

## 13. Next Steps (Open)

- [ ] Literature review / additional reference papers
- [ ] Finalize abstract (dummy version requested by guide — write as if research is complete)
- [ ] React Native project scaffold (component structure, gesture-handler setup, AsyncStorage/SQLite logging pipeline)
- [ ] Backend data sync (Firebase recommended for student project scope)
- [ ] Admin heatmap dashboard (can be separate lightweight web app reading exported JSON)
- [ ] Ethics/IRB form referencing debrief screen and consent flow
- [ ] Guide review of between-subjects randomization plan for Module 5
