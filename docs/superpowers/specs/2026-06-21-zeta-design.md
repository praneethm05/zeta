# Zeta — Design Spec

**Date:** 2026-06-21
**Author:** Praneeth M
**Status:** Approved (design phase)

## 1. Purpose

Zeta is the research instrument for the study *"Behavioral Analysis of User
Interactions Influenced by Psychological UI/UX Cues in Mobile Applications"*
(Software Engineering → User Behavior Analytics; SDG 9).

Most UX research relies on self-reported data (surveys, interviews), which
captures *perceptions* rather than *behavior*. Zeta inverts this: the research
instrument is itself a mobile app that records real, objective behavioral data —
what participants actually do, not what they say influences them.

Zeta is framed as a space-themed "cadet training simulator." The narrative is
deliberate: it reduces self-consciousness and justifies randomized task
sequencing in-fiction, both of which protect data validity.

The headline deliverable for the paper is a **touch heatmap** reconstructed from
normalized coordinate data, comparable across devices.

## 2. Core Design Principles

1. **Measurement validity over aesthetics.** Where immersion and clean data
   conflict, data wins. The visual design is constrained by the science, not the
   reverse.
2. **The two-zone boundary is enforced in code.** Ambient motion exists only on
   screens where nothing is measured.
3. **Never lose a trial.** Local-first capture guarantees data survives offline
   use, crashes, and network loss.
4. **Anonymous by construction.** No PII is ever collected, keeping ethics
   approval simple.
5. **One construct per module.** Each module isolates a single psychological /
   UX variable so its measurement is interpretable.

## 3. Platform & Stack Decisions

| Decision | Choice | Rationale |
|---|---|---|
| Platform | Native mobile (Android-first) | Strongest "real mobile app" framing; best touch fidelity |
| Framework | React Native (Expo dev-client build) | Reuses author's JS/React background; Expo cuts solo-dev tooling pain while keeping native modules |
| Touch capture | `react-native-gesture-handler` raw pointer events | Per-pointer IDs, multi-touch, native event timestamps |
| Local store | SQLite (`expo-sqlite`) | Offline-safe immediate writes |
| Backend | Supabase (Postgres) | SQL rows query straight into heatmap/stats; server-side aggregation; round-robin condition assignment |
| Sync | Local-first + background batch sync, idempotent (UUID keys) | No lost trials; no duplicate rows on retry |

### Timing precision note (critical)

Reaction times MUST be derived from the native event timestamp
(`nativeEvent.timestamp` from gesture-handler), **never** JS `Date.now()`. The
JS/native bridge introduces variable latency that would contaminate RT data.
Store both a trial-relative `t_ms` and the absolute timestamp.

## 4. Two-Zone Visual Model

The app has exactly two visual zones, separated in code by which background
component is mounted.

**Chrome zone** — menu, module-select, mission briefings, results, transitions.
Full space-cadet immersion: dark space, floating gradient planets with slow
parallax drift, glow. Sells the cover story that reduces self-consciousness. No
data is captured here, so animation is unconstrained.

**Trial zone** — the actual measured task inside each module. Frozen: static
background, fixed contrast. The only thing that moves is the stimulus the
experiment controls. The animated planet background component is *not mounted*
on these screens.

The transition between zones ("entering simulation…") sells the fiction and
marks the methodological line. In the paper this is a defensible methods
sentence: *ambient motion is confined to non-measurement screens.*

## 5. Architecture — Five Layers

1. **Capture layer (shared).** Wraps `react-native-gesture-handler`. Emits a
   normalized pointer stream: per-pointer ID, phase (down/move/up), native
   timestamp, and coordinates normalized as `x_norm = x/screenW`,
   `y_norm = y/screenH`. Single source of truth for all modules → consistent,
   cross-device heatmaps.
2. **Module engine.** Each module is a self-contained trial-runner exposing the
   same interface: `configure(condition) → runTrials() → TrialResult[]`. Each
   can be tested headless by injecting synthetic pointer streams.
3. **Session orchestrator.** Drives the flow: consent → demographics → condition
   assignment → counterbalanced module order → debrief. Holds `participant_id`
   and session state.
4. **Data layer.** Writes every event to SQLite immediately (offline-safe). A
   background sync engine batches unsynced rows to Supabase when online.
   Idempotent upserts keyed by event UUID.
5. **Theme layer.** The animated planet background component. Mounted only on
   chrome screens, absent on trial screens — this is the code-level enforcement
   of the two-zone boundary.

## 6. The Five Instruments

| Module | Construct isolated | Key measures |
|---|---|---|
| **Sensor Calibration** | spatial attention / Fitts's Law | reaction time, touch error vs target center, Fitts ID (distance/width) |
| **Signal Decoder** | color salience | instructed vs uninstructed trials, color chosen, RT → separates task-compliance from genuine color attraction |
| **Command Console** | visual hierarchy / affordance | deliberately ambiguous prompt; first-touched control logged; no "correct" answer so behavior is unbiased |
| **Dual Core Reactor** | multi-touch adoption | whether 2-finger interaction is discovered/adopted, inter-touch gap |
| **Hyperdrive Sequence** | progress-indicator effect on persistence | **between-subjects**: one progress condition per participant; persistence (time, taps) vs abandonment |

### Hyperdrive between-subjects detail

Each participant sees exactly one Hyperdrive progress condition (e.g. none /
linear / accelerating / stalling). Assignment is **server-balanced via Supabase
round-robin counter**, not random — random assignment skews with small n.

## 7. Data Model

Tables mirrored between SQLite (local) and Supabase (remote).

**participants**: `id` (UUID), age_band, gender, handedness, device_model,
screen_w, screen_h, os_version, consent_ts, hyperdrive_condition, created_at

**sessions**: `id`, participant_id, app_version, module_order, started_at,
completed_at, abandoned

**trials**: `id`, session_id, module, trial_index, condition,
stimulus_meta (json), rt_ms, correct, abandoned, started_ts, ended_ts

**touch_events**: `id`, trial_id, pointer_id, phase (down/move/up), **x_norm**,
**y_norm**, t_ms (relative to trial start), pressure (nullable) — the heatmap
source data

Normalized coordinates plus stored screen dimensions allow reconstruction of
comparable heatmaps across any device.

## 8. Participant Flow

1. **Launch**
2. **Consent gate** — in-fiction ("cadet enlistment terms") with a
   plain-language data-use line underneath. Hard gate; no bypass. Required for
   the paper / ethics.
3. **Demographics** — three taps: age band, gender, handedness (handedness
   matters for touch/Fitts data). An anonymous `participant_id` (UUID) is
   generated. No name, no email, no PII.
4. **Assignment** — server round-robin assigns Hyperdrive condition; module
   order is set by **Latin-square counterbalancing** to control order/fatigue
   effects.
5. **Per module**: briefing (chrome) → *trial zone (frozen)* → result blip.
6. **Debrief / completion.**

Local writes happen throughout; sync runs in the background.

## 9. Error Handling

- **Offline**: everything works local-first; sync retries with backoff.
- **Crash mid-trial**: the trial is flagged `abandoned` on next launch so partial
  data never contaminates completed-trial statistics; raw `touch_events` are
  still retained.
- **Timing integrity**: monotonic native timestamps; store both relative and
  absolute.
- **Idempotent sync**: UUID keys → retries never create duplicate rows.
- **Consent**: hard gate, cannot proceed without it.

## 10. Testing Strategy

- **Unit**: coordinate normalization, Fitts ID calculation, condition-assignment
  balancer, sync idempotency.
- **Headless module tests**: inject synthetic pointer streams → assert
  `TrialResult`.
- **Timing harness**: replay known-interval synthetic touches → assert RT within
  tolerance.
- **Device matrix**: 2–3 Android screen sizes → verify heatmap normalization
  produces comparable output.

## 11. Out of Scope (YAGNI)

- User accounts / login — modules are one-shot and between-subjects; accounts add
  PII, friction, and ethics burden for no benefit.
- iOS-first (Android-first; iOS later if needed).
- In-app heatmap rendering for participants — heatmaps are an *analysis* artifact
  produced from exported data for the paper, not a participant-facing feature.

## 12. Reference

Closest-match prior work for Paper 1 in the literature review: *"User Interface
Factors of Mobile UX: A Study with an Incident Reporting Application."*
