# Zeta Z1 — Walking Skeleton Design Spec

**Date:** 2026-06-21
**Author:** Praneeth M
**Status:** Approved (design phase)
**Parent spec:** [`2026-06-21-zeta-design.md`](./2026-06-21-zeta-design.md)

## 1. Purpose & Position

Z1 is the first of four build slices decomposed from the approved Zeta master
spec:

| Slice | Contents |
|---|---|
| **Z1 — Walking skeleton** | Spine + Sensor Calibration module end-to-end, SQLite local-only |
| Z2 — Other four instruments | Signal Decoder, Command Console, Dual Core Reactor, Hyperdrive |
| Z3 — Backend + sync | Supabase schema mirror, round-robin RPC, background batch sync, idempotent upserts |
| Z4 — Analysis | Heatmap reconstruction / export (analysis-side, not in-app) |

Z1 exists to **de-risk the entire architecture vertically** at the smallest
surface: touch-capture fidelity, timing precision, coordinate normalization, the
two-zone enforcement, the module-engine interface, and the local-first data path.
Every later slice plugs into the contracts Z1 establishes.

**Z1 delivers:** a runnable Android app that takes a participant through
`consent → demographics → assignment (local stub) → Sensor Calibration trials →
debrief`, writing every pointer event and trial result to local SQLite with
normalized coordinates and native-event timestamps, with all pure logic covered
by headless tests.

## 2. Scope Boundaries

**In scope**
- Expo (TypeScript) app, Android-first, runnable in Expo Go.
- Capture layer: RNGH-based normalized pointer stream (single source of truth).
- Session orchestrator: pure state machine driving a hard-gated linear flow.
- One instrument: **Sensor Calibration** (Fitts's Law), end-to-end.
- Local data layer: `expo-sqlite`, schema = master §7 subset.
- Assignment: real counterbalancer (Latin-square order + round-robin condition),
  backed by a **local** SQLite counter (server-swap deferred to Z3).
- Theme layer: animated `SpaceBackground` (chrome only) — the two-zone enforcer.
- Headless test suite + timing harness.

**Out of scope (deferred)**
- Supabase, network sync, idempotent upserts → Z3.
- Signal Decoder, Command Console, Dual Core Reactor, Hyperdrive → Z2.
- Custom Expo dev-client build → only if §6 spike forces it.
- Heatmap rendering / export → Z4.
- User accounts, iOS — out of scope for the whole project (master §11).

## 3. Stack Decisions

| Decision | Choice | Rationale |
|---|---|---|
| Language | TypeScript | Typed data model, module interface, and tests are far safer |
| Runtime | Expo Go (Z1) | All native deps (gesture-handler, reanimated, expo-sqlite, expo-crypto) run in Expo Go → fastest iteration. Dev-client deferred to §6 spike outcome |
| Package manager | npm | No pnpm/yarn present; `npx expo` (no global CLI) |
| Touch capture | `react-native-gesture-handler` `Gesture.Manual()` touch events | Per-pointer IDs + multi-touch; `Pan` lacks per-pointer fidelity; `PanResponder` rejected (JS timestamps) |
| Local store | `expo-sqlite` | Offline-safe immediate writes (master §3) |
| IDs | `expo-crypto.randomUUID()` | UUIDs without an extra dependency |
| Animation | `react-native-reanimated` | Slow parallax drift on chrome screens |
| Test runner | `jest-expo` | Standard Expo/RN preset; pure logic runs in node |

App scaffolds at the **repo root**; the existing `docs/` directory coexists.

## 4. Architecture

Five layers from master §5, realized for Z1.

```
src/
  capture/
    types.ts              PointerSample, PointerPhase
    normalize.ts          pure: x/screenW, y/screenH (tested)
    useCaptureSurface.ts  RNGH Gesture.Manual → normalized PointerSample stream
  modules/
    types.ts              ModuleEngine interface, ModuleId, TrialResult
    sensorCalibration/
      fitts.ts            pure: Fitts ID = log2(D/W + 1) (tested)
      engine.ts           pure trial logic: target placement, scoring (tested)
      SensorCalibrationScreen.tsx   trial-zone UI (frozen), uses capture surface
  orchestrator/
    sessionMachine.ts     pure state machine (tested)
    assignment.ts         Latin-square order + round-robin condition (tested)
    SessionRoot.tsx       renders screen for current state; mounts theme per zone
  data/
    db.ts                 expo-sqlite open + migrations
    repo.ts               typed inserts/reads for the four tables
    ids.ts                UUID helper
  theme/
    SpaceBackground.tsx   animated planets (chrome only)
    tokens.ts             colors; fixed trial-zone contrast
  screens/                chrome screens (animated bg)
    ConsentScreen.tsx
    DemographicsScreen.tsx
    BriefingScreen.tsx
    EnteringSimulation.tsx
    ResultScreen.tsx
    DebriefScreen.tsx
App.tsx                   GestureHandlerRootView + SessionRoot
```

### Flow control (decision)
A **pure orchestrator state machine** drives the flow; `SessionRoot` conditionally
renders the screen for the current state. No navigation library.

- States: `consent → demographics → assigning → briefing → trial → result → debrief → done`.
- The consent → demographics edge is a **hard gate**: the machine exposes no
  transition that reaches `demographics` (or beyond) without a `consentGranted`
  event. There is no back-stack to bypass.
- Rejected: react-navigation (a real back-stack fights the hard gate) and
  expo-router (file-based routing is unneeded power — YAGNI).

## 5. Capture Layer Contract

The single source of truth for all touch data. Emits a normalized stream:

```ts
type PointerPhase = 'down' | 'move' | 'up';

interface PointerSample {
  pointerId: number;
  phase: PointerPhase;
  x_norm: number;   // x / screenW   ∈ [0,1]
  y_norm: number;   // y / screenH   ∈ [0,1]
  t_ms: number;     // native timestamp, relative to trial start
  t_abs: number;    // native timestamp, absolute
  pressure?: number;
}
```

- Normalization uses the live screen dimensions; screen `w`/`h` are stored on the
  participant row so any device's stream reconstructs into a comparable heatmap
  (master §7).
- Timestamps are derived from the **native event timestamp**, never JS
  `Date.now()` (master §3, timing-precision note). Both relative `t_ms` and
  absolute `t_abs` are stored.
- The module engine consumes only `PointerSample[]` — it never touches RNGH
  directly, which is what makes it headless-testable with synthetic streams.

## 6. Risk #1 — Native Timestamp Spike (build first)

The keystone risk. Before any module logic is built on the capture stream, a
spike must confirm that RNGH's `Gesture.Manual()` touch events on the target Expo
SDK expose a **usable native event timestamp** reachable from JS.

- **If yes:** the capture layer uses it directly; proceed in Expo Go.
- **If no (only JS-side time is reachable):** document the limitation, measure the
  bridge jitter, and decide between (a) a custom dev-client with a native timestamp
  shim or (b) accepting a documented JS-timestamp fallback with stated RT error
  bounds. This decision is recorded before module work continues.

The plan schedules this spike as the first implementation step.

## 7. Sensor Calibration — Trial Design

Construct isolated: spatial attention / Fitts's Law (master §6).

- **Stimulus:** a target circle appears at a controlled position with a controlled
  width. The participant taps it.
- **Measures per trial:**
  - **Reaction time** = target-onset native ts → first touch-down native ts.
  - **Touch error** = touch-down `(x_norm, y_norm)` distance from target center.
  - **Fitts ID** = `log2(D/W + 1)`, where `D` = distance from the previous target
    (the first trial uses a fixed home position) and `W` = target width.
- **Trial set:** ~9–12 trials over a small amplitude × width grid; `condition`
  encodes the `(D, W)` cell. Order is randomized within the module (the in-fiction
  randomization that the cover story justifies).
- **Trial zone is frozen:** static background, fixed contrast; only the target
  stimulus appears/moves. `SpaceBackground` is not mounted on this screen.
- **Result:** a vague chrome blip (e.g. "calibration 92%"). No raw RT is shown —
  preserves the cover story.
- Every `PointerSample` (down/move/up) for the trial is written to `touch_events`.

### Module engine interface

```ts
interface ModuleEngine {
  configure(condition: ConditionConfig): void;
  ingest(sample: PointerSample): void;   // fed by the capture surface
  // emits TrialResult when a trial completes; flushes touch_events for the trial
}

interface TrialResult {
  module: ModuleId;
  trialIndex: number;
  condition: string;
  rt_ms: number | null;
  correct: boolean | null;
  abandoned: boolean;
  stimulus_meta: Record<string, unknown>;  // includes D, W, target center, fitts_id
  started_ts: number;
  ended_ts: number;
}
```

Headless tests inject a synthetic `PointerSample[]` and assert the `TrialResult`.

## 8. Assignment (local stub)

Implements the **real** counterbalancing logic now, backed by local state so Z3
swaps only the storage:

- **Module order:** Latin-square over the module set (trivial at one module, but
  the full balancer is built and tested for Z2/Z3).
- **Hyperdrive condition:** assigned via a **round-robin counter persisted in a
  local SQLite row**. Same semantics as the master spec's server round-robin
  (master §6); Z3 replaces the local counter with a Supabase RPC. The condition is
  stored on the participant row (`hyperdrive_condition`) even though no Hyperdrive
  module runs in Z1, so the schema does not churn.

Both are pure functions over an injected counter/seed → fully testable.

## 9. Data Model (Z1 subset)

SQLite tables, columns exactly per master §7 (so Z3's Supabase mirror matches):

- **participants**: `id` (UUID), `age_band`, `gender`, `handedness`,
  `device_model`, `screen_w`, `screen_h`, `os_version`, `consent_ts`,
  `hyperdrive_condition`, `created_at`
- **sessions**: `id`, `participant_id`, `app_version`, `module_order`,
  `started_at`, `completed_at`, `abandoned`
- **trials**: `id`, `session_id`, `module`, `trial_index`, `condition`,
  `stimulus_meta` (json), `rt_ms`, `correct`, `abandoned`, `started_ts`,
  `ended_ts`
- **touch_events**: `id`, `trial_id`, `pointer_id`, `phase`, `x_norm`, `y_norm`,
  `t_ms`, `pressure` (nullable) — the heatmap source data

Writes happen immediately on every event (offline-safe). A `migrations` mechanism
in `db.ts` creates the schema on first launch.

## 10. Two-Zone Enforcement

Master §4's two-zone boundary is enforced in code:

- `SessionRoot` maps each machine state to a zone (`chrome` | `trial`).
- Only `chrome` states mount `<SpaceBackground>`; the `trial` state never does.
- A dev-time invariant asserts that every state mapped to `trial` is frozen
  (no animated background mounted), so the boundary can't silently regress.

## 11. Testing Strategy & Definition of Done

**Headless (jest-expo, node — runnable without a device):**
- `normalize`: coordinate normalization at boundaries.
- `fitts`: known `D`/`W` → expected ID.
- `sessionMachine`: all transitions; **consent hard-gate cannot be bypassed**;
  reaches `done`.
- `assignment`: round-robin distributes conditions evenly; Latin-square validity.
- `sensorCalibration/engine`: synthetic `PointerSample[]` → asserted `TrialResult`
  (RT, error, Fitts ID).
- **Timing harness:** replay known-interval synthetic touches → RT within tolerance.

**On-device (emulator/phone, this session):**
- Full flow runs end-to-end without crash.
- Real touches write `trials` + `touch_events` rows to local SQLite.
- Trial zone is visibly frozen vs. animated chrome.

**Definition of Done:** clean end-to-end run on device **and** all headless tests
green **and** rows present in the local DB after a session.

## 12. Reference

Parent: `docs/superpowers/specs/2026-06-21-zeta-design.md`. All section
references (§N) above point to that master spec.
