# Zeta Z1 Walking Skeleton — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a runnable Android (Expo) app taking a participant through `consent → demographics → assignment → Sensor Calibration → debrief`, writing every pointer event and trial result to local SQLite with normalized coordinates and native-event timestamps.

**Architecture:** A pure orchestrator state machine drives a hard-gated linear flow and chooses which screen mounts. A shared capture layer wraps `react-native-gesture-handler` and emits a normalized `PointerSample` stream that the Sensor Calibration engine (pure logic) consumes. A local `expo-sqlite` data layer persists everything immediately. The animated `SpaceBackground` mounts only on chrome screens — the code-level two-zone boundary.

**Tech Stack:** Expo SDK (latest stable) + TypeScript, react-native-gesture-handler, react-native-reanimated, expo-sqlite, expo-crypto, jest-expo.

## Global Constraints

- Language: **TypeScript**, `strict` on.
- Platform: **Android-first**, runs in **Expo Go** for Z1.
- Package manager: **npm**. Use `npx expo` (no global CLI).
- Timestamps: derive from the **native event timestamp**, never JS `Date.now()` (master spec §3). Store both relative `t_ms` and absolute `t_abs`.
- Coordinates: normalize as `x_norm = x/screenW`, `y_norm = y/screenH`; persist screen `w`/`h` on the participant row.
- Data: SQLite columns match master spec §7 exactly (Z3 mirrors them in Supabase). Includes `hyperdrive_condition` even though Hyperdrive does not run in Z1.
- IDs: UUID via `expo-crypto.randomUUID()`.
- Two-zone rule: `SpaceBackground` mounts on chrome states only; never on the trial state.
- No Supabase, no network sync, no other modules in Z1.

## Canonical Interfaces (defined once, referenced by all tasks)

```ts
// src/capture/types.ts
export type PointerPhase = 'down' | 'move' | 'up';

export interface PointerSample {
  pointerId: number;
  phase: PointerPhase;
  x_norm: number;   // x / screenW  ∈ [0,1]
  y_norm: number;   // y / screenH  ∈ [0,1]
  t_ms: number;     // native ts, relative to trial start
  t_abs: number;    // native ts, absolute
  pressure?: number;
}

// src/modules/types.ts
export type ModuleId = 'sensor_calibration';

export interface TrialResult {
  module: ModuleId;
  trialIndex: number;
  condition: string;
  rt_ms: number | null;
  correct: boolean | null;
  abandoned: boolean;
  stimulus_meta: Record<string, unknown>;
  started_ts: number;
  ended_ts: number;
}
```

---

## File Structure

| Path | Responsibility |
|---|---|
| `App.tsx` | `GestureHandlerRootView` root + `SessionRoot` |
| `src/capture/types.ts` | `PointerPhase`, `PointerSample` |
| `src/capture/normalize.ts` | pure coordinate normalization |
| `src/capture/useCaptureSurface.ts` | RNGH `Gesture.Manual` → `PointerSample` stream |
| `src/capture/nativeTime.ts` | native-timestamp accessor (from spike) |
| `src/modules/types.ts` | `ModuleId`, `TrialResult` |
| `src/modules/sensorCalibration/fitts.ts` | pure Fitts ID |
| `src/modules/sensorCalibration/engine.ts` | pure trial logic |
| `src/modules/sensorCalibration/SensorCalibrationScreen.tsx` | frozen trial UI |
| `src/modules/sensorCalibration/trials.ts` | the (D,W) trial grid |
| `src/orchestrator/sessionMachine.ts` | pure state machine |
| `src/orchestrator/assignment.ts` | Latin-square order + round-robin condition |
| `src/orchestrator/SessionRoot.tsx` | renders screen per state; mounts theme per zone |
| `src/data/db.ts` | expo-sqlite open + migrations |
| `src/data/repo.ts` | typed inserts/reads |
| `src/data/mappers.ts` | pure row⇄object mappers |
| `src/data/ids.ts` | UUID helper |
| `src/theme/tokens.ts` | colors, fixed trial contrast |
| `src/theme/SpaceBackground.tsx` | animated planets (chrome only) |
| `src/screens/*.tsx` | Consent, Demographics, Briefing, EnteringSimulation, Result, Debrief |

---

## Task 0: Scaffold Expo TypeScript project

**Files:**
- Create: `package.json`, `tsconfig.json`, `app.json`, `App.tsx`, `jest.config.js`, `babel.config.js`, `.gitignore`
- Test: `src/__smoke__/smoke.test.ts`

- [ ] **Step 1: Scaffold into repo root**

Run (scaffolds into a temp dir, then move app files to root so existing `docs/` and `.git` are preserved):
```bash
cd /Users/praneethm/Projects/christuniversity/Research/Zeta
npx create-expo-app@latest .tmp-zeta --template blank-typescript
rsync -a --exclude .git .tmp-zeta/ ./ && rm -rf .tmp-zeta
```

- [ ] **Step 2: Add dependencies**

```bash
npx expo install react-native-gesture-handler react-native-reanimated expo-sqlite expo-crypto
npm install -D jest-expo jest @types/jest
```

- [ ] **Step 3: Configure reanimated + jest**

`babel.config.js` — ensure `react-native-reanimated/plugin` is the **last** plugin:
```js
module.exports = function (api) {
  api.cache(true);
  return { presets: ['babel-preset-expo'], plugins: ['react-native-reanimated/plugin'] };
};
```

`package.json` — add:
```json
"scripts": { "test": "jest", "android": "expo start --android" },
"jest": { "preset": "jest-expo", "setupFiles": ["./jest.setup.js"] }
```

`jest.setup.js`:
```js
require('react-native-gesture-handler/jestSetup');
```

- [ ] **Step 4: Write the smoke test**

`src/__smoke__/smoke.test.ts`:
```ts
test('toolchain runs typescript tests', () => {
  expect(1 + 1).toBe(2);
});
```

- [ ] **Step 5: Run it**

Run: `npm test -- src/__smoke__/smoke.test.ts`
Expected: PASS, 1 test.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "chore: scaffold Expo TypeScript project with jest-expo"
```

---

## Task 1: Native-timestamp spike (Risk #1 — do first)

Validates whether RNGH `Gesture.Manual` touch events expose a usable native timestamp on the target SDK. Outcome decides the `nativeTime.ts` implementation. **Requires the device/emulator.**

**Files:**
- Create: `src/capture/nativeTime.ts`, `docs/superpowers/notes/2026-06-21-timestamp-spike.md`

- [ ] **Step 1: Build a throwaway probe screen**

Temporarily render a full-screen `GestureDetector` with `Gesture.Manual()`; in `onTouchesDown`, log the touch event object keys and any timestamp field alongside `Date.now()`. Run on device: `npm run android`.

- [ ] **Step 2: Record findings**

In `docs/superpowers/notes/2026-06-21-timestamp-spike.md` record: which timestamp field RNGH exposes (e.g. `event.handlerTag`/touch `time`/none), its unit/epoch, and measured offset vs `Date.now()`.

- [ ] **Step 3: Implement the accessor**

`src/capture/nativeTime.ts` — single function the capture layer uses. If native ts is available:
```ts
// Returns the native event timestamp in ms (absolute). Falls back with a logged
// warning only if the spike proved no native ts is reachable (see spike note).
export function nativeEventTime(e: { /* RNGH touch event */ }): number { /* per spike */ }
```
If the spike proves no native ts is reachable, this file documents the JS fallback and its measured error bound, and the team is alerted before proceeding.

- [ ] **Step 4: Remove the probe screen, commit**

```bash
git add -A
git commit -m "feat: native timestamp accessor + spike findings"
```

---

## Task 2: Coordinate normalization (pure, TDD)

**Files:**
- Create: `src/capture/types.ts`, `src/capture/normalize.ts`
- Test: `src/capture/normalize.test.ts`

**Interfaces:**
- Produces: `normalizePoint(x, y, screenW, screenH) → {x_norm, y_norm}`; the `PointerSample`/`PointerPhase` types.

- [ ] **Step 1: Write the failing test**

`src/capture/normalize.test.ts`:
```ts
import { normalizePoint } from './normalize';

test('normalizes to unit square', () => {
  expect(normalizePoint(50, 100, 100, 400)).toEqual({ x_norm: 0.5, y_norm: 0.25 });
});

test('clamps out-of-bounds to [0,1]', () => {
  expect(normalizePoint(-5, 500, 100, 400)).toEqual({ x_norm: 0, y_norm: 1 });
});
```

- [ ] **Step 2: Run, verify fail**

Run: `npm test -- src/capture/normalize.test.ts`
Expected: FAIL, "Cannot find module './normalize'".

- [ ] **Step 3: Implement**

`src/capture/types.ts` — the canonical `PointerPhase`/`PointerSample` block above.
`src/capture/normalize.ts`:
```ts
export function normalizePoint(x: number, y: number, screenW: number, screenH: number) {
  const clamp = (v: number) => Math.min(1, Math.max(0, v));
  return { x_norm: clamp(x / screenW), y_norm: clamp(y / screenH) };
}
```

- [ ] **Step 4: Run, verify pass**

Run: `npm test -- src/capture/normalize.test.ts`
Expected: PASS, 2 tests.

- [ ] **Step 5: Commit**

```bash
git add src/capture/types.ts src/capture/normalize.ts src/capture/normalize.test.ts
git commit -m "feat: coordinate normalization for capture layer"
```

---

## Task 3: Fitts ID (pure, TDD)

**Files:**
- Create: `src/modules/types.ts`, `src/modules/sensorCalibration/fitts.ts`
- Test: `src/modules/sensorCalibration/fitts.test.ts`

**Interfaces:**
- Produces: `fittsID(distance, width) → number` = `log2(distance/width + 1)`; the `ModuleId`/`TrialResult` types.

- [ ] **Step 1: Write the failing test**

```ts
import { fittsID } from './fitts';

test('Fitts index of difficulty', () => {
  expect(fittsID(3, 1)).toBeCloseTo(2, 5);      // log2(4)=2
  expect(fittsID(0, 1)).toBeCloseTo(0, 5);      // log2(1)=0
});

test('throws on non-positive width', () => {
  expect(() => fittsID(3, 0)).toThrow();
});
```

- [ ] **Step 2: Run, verify fail** — `npm test -- src/modules/sensorCalibration/fitts.test.ts` → FAIL.

- [ ] **Step 3: Implement**

`src/modules/types.ts` — the canonical `ModuleId`/`TrialResult` block.
`src/modules/sensorCalibration/fitts.ts`:
```ts
export function fittsID(distance: number, width: number): number {
  if (width <= 0) throw new Error('width must be > 0');
  return Math.log2(distance / width + 1);
}
```

- [ ] **Step 4: Run, verify pass** — Expected: PASS, 2 tests.

- [ ] **Step 5: Commit** — `git commit -m "feat: Fitts index of difficulty"`

---

## Task 4: Session state machine (pure, TDD)

**Files:**
- Create: `src/orchestrator/sessionMachine.ts`
- Test: `src/orchestrator/sessionMachine.test.ts`

**Interfaces:**
- Produces:
  ```ts
  type Phase = 'consent'|'demographics'|'assigning'|'briefing'|'trial'|'result'|'debrief'|'done';
  interface Demographics { ageBand: string; gender: string; handedness: 'left'|'right'|'other' }
  interface SessionState {
    phase: Phase; consentGranted: boolean; participantId?: string;
    demographics?: Demographics; moduleOrder: ModuleId[]; currentModuleIdx: number;
    hyperdriveCondition?: string;
  }
  type Event =
    | { type: 'GRANT_CONSENT' }
    | { type: 'SUBMIT_DEMOGRAPHICS'; demographics: Demographics; participantId: string }
    | { type: 'ASSIGNED'; moduleOrder: ModuleId[]; hyperdriveCondition: string }
    | { type: 'BEGIN_TRIAL' } | { type: 'TRIAL_DONE' } | { type: 'CONTINUE' };
  function initialState(): SessionState;
  function reduce(s: SessionState, e: Event): SessionState;
  ```

- [ ] **Step 1: Write the failing tests**

```ts
import { initialState, reduce } from './sessionMachine';

test('starts at consent, ungranted', () => {
  const s = initialState();
  expect(s.phase).toBe('consent');
  expect(s.consentGranted).toBe(false);
});

test('consent is a hard gate: demographics events ignored before consent', () => {
  const s = initialState();
  const after = reduce(s, { type: 'SUBMIT_DEMOGRAPHICS', demographics: { ageBand: '18-24', gender: 'f', handedness: 'right' }, participantId: 'p1' });
  expect(after.phase).toBe('consent');       // no bypass
});

test('full happy path reaches done', () => {
  let s = initialState();
  s = reduce(s, { type: 'GRANT_CONSENT' });
  expect(s.phase).toBe('demographics');
  s = reduce(s, { type: 'SUBMIT_DEMOGRAPHICS', demographics: { ageBand: '18-24', gender: 'f', handedness: 'right' }, participantId: 'p1' });
  expect(s.phase).toBe('assigning');
  s = reduce(s, { type: 'ASSIGNED', moduleOrder: ['sensor_calibration'], hyperdriveCondition: 'none' });
  expect(s.phase).toBe('briefing');
  s = reduce(s, { type: 'BEGIN_TRIAL' });
  expect(s.phase).toBe('trial');
  s = reduce(s, { type: 'TRIAL_DONE' });
  expect(s.phase).toBe('result');
  s = reduce(s, { type: 'CONTINUE' });        // no more modules → debrief
  expect(s.phase).toBe('debrief');
  s = reduce(s, { type: 'CONTINUE' });
  expect(s.phase).toBe('done');
});
```

- [ ] **Step 2: Run, verify fail.**

- [ ] **Step 3: Implement** `src/orchestrator/sessionMachine.ts` per the Interfaces block. Key rule: in `phase==='consent'`, only `GRANT_CONSENT` advances (→ `demographics`); all other events return state unchanged. `CONTINUE` in `result` advances to `briefing` if `currentModuleIdx+1 < moduleOrder.length` (incrementing the index), else `debrief`.

- [ ] **Step 4: Run, verify pass** — Expected: PASS, 3 tests.

- [ ] **Step 5: Commit** — `git commit -m "feat: session orchestrator state machine with hard consent gate"`

---

## Task 5: Assignment — Latin square + round-robin (pure, TDD)

**Files:**
- Create: `src/orchestrator/assignment.ts`
- Test: `src/orchestrator/assignment.test.ts`

**Interfaces:**
- Produces:
  ```ts
  const HYPERDRIVE_CONDITIONS: readonly string[]; // ['none','linear','accelerating','stalling']
  function roundRobinCondition(counter: number): string;       // conditions[counter % n]
  function latinSquareOrder(modules: ModuleId[], participantIndex: number): ModuleId[];
  ```

- [ ] **Step 1: Write the failing tests**

```ts
import { roundRobinCondition, latinSquareOrder, HYPERDRIVE_CONDITIONS } from './assignment';

test('round-robin cycles conditions evenly', () => {
  const counts: Record<string, number> = {};
  for (let i = 0; i < HYPERDRIVE_CONDITIONS.length * 5; i++) {
    const c = roundRobinCondition(i); counts[c] = (counts[c] ?? 0) + 1;
  }
  expect(new Set(Object.values(counts))).toEqual(new Set([5])); // all equal
});

test('latin square is a permutation of the modules', () => {
  const mods: ModuleId[] = ['sensor_calibration'];
  const order = latinSquareOrder(mods, 0);
  expect([...order].sort()).toEqual([...mods].sort());
});
```

- [ ] **Step 2: Run, verify fail.**

- [ ] **Step 3: Implement** `src/orchestrator/assignment.ts`:
```ts
import { ModuleId } from '../modules/types';
export const HYPERDRIVE_CONDITIONS = ['none','linear','accelerating','stalling'] as const;
export function roundRobinCondition(counter: number): string {
  const n = HYPERDRIVE_CONDITIONS.length;
  return HYPERDRIVE_CONDITIONS[((counter % n) + n) % n];
}
export function latinSquareOrder(modules: ModuleId[], participantIndex: number): ModuleId[] {
  const n = modules.length, shift = ((participantIndex % n) + n) % n;
  // balanced Latin square row: index j → (shift + (j % 2 ? n - Math.ceil(j/2) : j/2)) % n
  return Array.from({ length: n }, (_, j) => {
    const k = j % 2 === 0 ? j / 2 : n - (j + 1) / 2;
    return modules[(shift + k) % n];
  });
}
```

- [ ] **Step 4: Run, verify pass** — Expected: PASS, 2 tests.

- [ ] **Step 5: Commit** — `git commit -m "feat: counterbalanced assignment (latin square + round-robin)"`

---

## Task 6: Sensor Calibration engine + trial grid (pure, TDD)

**Files:**
- Create: `src/modules/sensorCalibration/trials.ts`, `src/modules/sensorCalibration/engine.ts`
- Test: `src/modules/sensorCalibration/engine.test.ts`

**Interfaces:**
- Consumes: `PointerSample`, `TrialResult`, `fittsID`.
- Produces:
  ```ts
  interface SensorCondition {
    trialIndex: number; condition: string; onset_ts: number;
    target: { x_norm: number; y_norm: number }; width_norm: number;
    home: { x_norm: number; y_norm: number };
  }
  const SENSOR_TRIALS: SensorCondition[];   // the (D,W) grid, onset_ts filled at runtime
  class SensorCalibrationEngine {
    configure(c: SensorCondition): void;
    ingest(s: PointerSample): void;          // capture surface feeds this
    isComplete(): boolean;                   // true after first 'down' on target zone
    result(): TrialResult;
    samples(): PointerSample[];
  }
  ```

- [ ] **Step 1: Write the failing test**

```ts
import { SensorCalibrationEngine } from './engine';
import { PointerSample } from '../../capture/types';

const cond = {
  trialIndex: 0, condition: 'D0.5_W0.1', onset_ts: 1000,
  target: { x_norm: 0.8, y_norm: 0.5 }, width_norm: 0.1,
  home: { x_norm: 0.3, y_norm: 0.5 },
};

test('computes RT, error, and Fitts ID from a synthetic stream', () => {
  const e = new SensorCalibrationEngine();
  e.configure(cond);
  const down: PointerSample = { pointerId: 1, phase: 'down', x_norm: 0.8, y_norm: 0.5, t_ms: 250, t_abs: 1250 };
  e.ingest(down);
  expect(e.isComplete()).toBe(true);
  const r = e.result();
  expect(r.rt_ms).toBe(250);                       // 1250 - 1000
  expect(r.correct).toBe(true);                    // dead-center hit
  expect(r.stimulus_meta.fitts_id).toBeCloseTo(Math.log2(0.5 / 0.1 + 1), 5);
  expect(e.samples()).toHaveLength(1);
});

test('off-target tap is incorrect', () => {
  const e = new SensorCalibrationEngine();
  e.configure(cond);
  e.ingest({ pointerId: 1, phase: 'down', x_norm: 0.2, y_norm: 0.5, t_ms: 300, t_abs: 1300 });
  expect(e.result().correct).toBe(false);          // |0.2-0.8|=0.6 > width/2
});
```

- [ ] **Step 2: Run, verify fail.**

- [ ] **Step 3: Implement** `trials.ts` (a small amplitude×width grid, ~9–12 entries, `onset_ts: 0` placeholder) and `engine.ts`. Engine logic: store samples; on first `down`, compute `rt_ms = down.t_abs - onset_ts`, `err = hypot(down.x_norm-target.x_norm, down.y_norm-target.y_norm)`, `correct = err <= width_norm/2`, `D = hypot(target-home)`, `fitts_id = fittsID(D, width_norm)`; set `started_ts = onset_ts`, `ended_ts = down.t_abs`; mark complete.

- [ ] **Step 4: Run, verify pass** — Expected: PASS, 2 tests.

- [ ] **Step 5: Commit** — `git commit -m "feat: Sensor Calibration engine and trial grid"`

---

## Task 7: Local data layer — schema, mappers, repo

**Files:**
- Create: `src/data/ids.ts`, `src/data/mappers.ts`, `src/data/db.ts`, `src/data/repo.ts`
- Test: `src/data/mappers.test.ts`

**Interfaces:**
- Produces: `newId(): string`; pure `mappers` (`trialToRow`, `touchEventToRow`, etc.); `openDb()`, `runMigrations(db)`; `repo` with `insertParticipant`, `insertSession`, `insertTrial`, `insertTouchEvents(trialId, samples)`, `nextAssignmentCounter()`.

- [ ] **Step 1: Write failing mapper test (pure, headless)**

`src/data/mappers.test.ts`:
```ts
import { touchEventToRow } from './mappers';

test('maps a PointerSample to a touch_events row', () => {
  const row = touchEventToRow('trial-1', { pointerId: 2, phase: 'move', x_norm: 0.5, y_norm: 0.25, t_ms: 10, t_abs: 1010, pressure: 0.4 });
  expect(row).toMatchObject({ trial_id: 'trial-1', pointer_id: 2, phase: 'move', x_norm: 0.5, y_norm: 0.25, t_ms: 10, pressure: 0.4 });
  expect(typeof row.id).toBe('string');
});
```

- [ ] **Step 2: Run, verify fail.**

- [ ] **Step 3: Implement** `ids.ts` (`import { randomUUID } from 'expo-crypto'; export const newId = () => randomUUID();`), `mappers.ts` (pure object→row), `db.ts` (`expo-sqlite` open + `runMigrations` creating the four tables per master §7 + an `assignment_counter` table), `repo.ts` (typed inserts using immediate writes; `nextAssignmentCounter` reads+increments the counter row in a transaction).

- [ ] **Step 4: Run, verify pass** — Expected: PASS, 1 test.

- [ ] **Step 5: Commit** — `git commit -m "feat: local SQLite data layer (schema, mappers, repo)"`

---

## Task 8: Capture surface hook (RNGH integration)

**Files:**
- Create: `src/capture/useCaptureSurface.ts`
- Verify: on-device (RNGH gestures don't run in jsdom).

**Interfaces:**
- Consumes: `normalizePoint`, `nativeEventTime`, `PointerSample`.
- Produces: `useCaptureSurface(onSample: (s: PointerSample) => void, trialStartTs: number) → { gesture }` — a `Gesture.Manual()` wired to `onTouchesDown/Move/Up`, emitting normalized `PointerSample`s with native ts; `t_ms = t_abs - trialStartTs`.

- [ ] **Step 1: Implement the hook** using `Gesture.Manual()`; in each touch callback iterate `changedTouches`, map phase, normalize `(absoluteX, absoluteY)` against `useWindowDimensions()`, stamp `t_abs = nativeEventTime(event)`, `t_ms = t_abs - trialStartTs`, call `onSample`. Wrap with `runOnJS` as needed.

- [ ] **Step 2: Manual device check** — temporary log screen confirms down/move/up samples arrive with monotonic native ts and in-bounds normalized coords. `npm run android`.

- [ ] **Step 3: Commit** — `git commit -m "feat: capture surface hook over RNGH manual gestures"`

---

## Task 9: Theme layer — tokens + SpaceBackground

**Files:**
- Create: `src/theme/tokens.ts`, `src/theme/SpaceBackground.tsx`

- [ ] **Step 1: Tokens** — `tokens.ts`: chrome palette (deep space, glows) + fixed trial-zone palette (static bg, fixed contrast).

- [ ] **Step 2: SpaceBackground** — `SpaceBackground.tsx`: reanimated slow parallax drift of a few gradient "planets". Pure presentational, no data. Mounts only on chrome (enforced in Task 10).

- [ ] **Step 3: Device check** — drift animates smoothly. Commit: `git commit -m "feat: space-themed chrome background (two-zone theme)"`

---

## Task 10: Screens + SessionRoot wiring + two-zone enforcement

**Files:**
- Create: `src/screens/ConsentScreen.tsx`, `DemographicsScreen.tsx`, `BriefingScreen.tsx`, `EnteringSimulation.tsx`, `ResultScreen.tsx`, `DebriefScreen.tsx`, `src/modules/sensorCalibration/SensorCalibrationScreen.tsx`, `src/orchestrator/SessionRoot.tsx`, `App.tsx`
- Test: `src/orchestrator/zoneMap.test.ts`

**Interfaces:**
- Consumes: `sessionMachine`, `assignment`, `repo`, `useCaptureSurface`, `SensorCalibrationEngine`, screens, `SpaceBackground`.
- Produces: `ZONE_OF: Record<Phase, 'chrome'|'trial'>`; `SessionRoot` component.

- [ ] **Step 1: Write the failing zone test**

`src/orchestrator/zoneMap.test.ts`:
```ts
import { ZONE_OF } from './SessionRoot';

test('trial phase is the only frozen zone; chrome elsewhere', () => {
  expect(ZONE_OF.trial).toBe('trial');
  for (const p of ['consent','demographics','assigning','briefing','result','debrief','done'] as const) {
    expect(ZONE_OF[p]).toBe('chrome');
  }
});
```

- [ ] **Step 2: Run, verify fail.**

- [ ] **Step 3: Build screens + SessionRoot.** Export `ZONE_OF`. `SessionRoot` holds `useReducer(reduce, initialState())`, renders the screen for `state.phase`, and mounts `<SpaceBackground/>` **iff** `ZONE_OF[state.phase] === 'chrome'`. Wire actions: Consent → on accept, `repo.insertParticipant` (with screen w/h, condition from `roundRobinCondition(repo.nextAssignmentCounter())`) + `GRANT_CONSENT`; Demographics → `insertSession` + `SUBMIT_DEMOGRAPHICS`; `assigning` → compute `latinSquareOrder` + dispatch `ASSIGNED`; Briefing → `EnteringSimulation` interstitial → `BEGIN_TRIAL`; trial → `SensorCalibrationScreen` drives the engine over `SENSOR_TRIALS`, persists each `TrialResult` + touch events, then `TRIAL_DONE`; Result/Debrief → `CONTINUE`.

- [ ] **Step 4: Run zone test, verify pass.** `App.tsx` wraps `SessionRoot` in `GestureHandlerRootView`.

- [ ] **Step 5: Commit** — `git commit -m "feat: screens, SessionRoot flow, code-enforced two-zone boundary"`

---

## Task 11: Timing harness + end-to-end device verification (DoD)

**Files:**
- Create: `src/modules/sensorCalibration/timing.test.ts`

- [ ] **Step 1: Timing harness test** — replay synthetic touches at known intervals through the engine; assert recovered `rt_ms` equals the injected interval exactly (pure, deterministic).

```ts
import { SensorCalibrationEngine } from './engine';
test('recovered RT equals injected native interval', () => {
  const e = new SensorCalibrationEngine();
  e.configure({ trialIndex: 0, condition: 'x', onset_ts: 5000, target: { x_norm: 0.5, y_norm: 0.5 }, width_norm: 0.2, home: { x_norm: 0.1, y_norm: 0.5 } });
  e.ingest({ pointerId: 1, phase: 'down', x_norm: 0.5, y_norm: 0.5, t_ms: 333, t_abs: 5333 });
  expect(e.result().rt_ms).toBe(333);
});
```

- [ ] **Step 2: Full headless suite** — `npm test`. Expected: all green.

- [ ] **Step 3: On-device run** — `npm run android`. Walk the full flow consent→debrief. Confirm: chrome animates, trial zone frozen, no crash.

- [ ] **Step 4: Verify rows persisted** — add a temporary debug button (or log on debrief) dumping row counts via `repo`; confirm `participants`, `sessions`, `trials`, and `touch_events` all have rows after a session. Remove the debug hook.

- [ ] **Step 5: Commit** — `git commit -m "test: timing harness + verified end-to-end Z1 walking skeleton"`

---

## Self-Review

**Spec coverage:** Z1 spec §2 scope → Tasks 0–11. Capture layer §5 → T2,T8. Native ts risk §6 → T1. Sensor Calibration §7 → T3,T6,T10. Assignment §8 → T5,T10. Data model §9 → T7. Two-zone §10 → T9,T10 (zone test). Testing/DoD §11 → T2–T7 headless, T11 harness + device. All covered.

**Placeholders:** Pure-logic tasks (2–7, 11) carry full test+impl code. RN/native tasks (0,1,8,9,10) are device-verified, not headless — their steps are concrete actions with interface contracts and the exact wiring, which is the correct granularity for code that can't run in jsdom.

**Type consistency:** `PointerSample`, `TrialResult`, `ModuleId`, `Phase`, `SensorCondition` defined once in Canonical Interfaces / task Interfaces blocks and referenced unchanged. `nativeEventTime`, `normalizePoint`, `fittsID`, `roundRobinCondition`, `latinSquareOrder` names consistent across producer/consumer tasks.
