import { PointerSample } from '../capture/types';
import { TrialResult } from '../modules/types';
import { newId } from './ids';

// SQLite has no boolean type; store 0/1 (null preserved).
const boolToInt = (b: boolean | null): number | null => (b === null ? null : b ? 1 : 0);

export interface TouchEventRow {
  id: string;
  trial_id: string;
  pointer_id: number;
  phase: string;
  x_norm: number;
  y_norm: number;
  t_ms: number;
  pressure: number | null;
}

export function touchEventToRow(trialId: string, s: PointerSample): TouchEventRow {
  return {
    id: newId(),
    trial_id: trialId,
    pointer_id: s.pointerId,
    phase: s.phase,
    x_norm: s.x_norm,
    y_norm: s.y_norm,
    t_ms: s.t_ms,
    pressure: s.pressure ?? null,
  };
}

export interface TrialRow {
  id: string;
  session_id: string;
  module: string;
  trial_index: number;
  condition: string;
  stimulus_meta: string; // JSON
  rt_ms: number | null;
  correct: number | null;
  abandoned: number;
  started_ts: number;
  ended_ts: number;
}

export function trialToRow(sessionId: string, r: TrialResult): TrialRow {
  return {
    id: newId(),
    session_id: sessionId,
    module: r.module,
    trial_index: r.trialIndex,
    condition: r.condition,
    stimulus_meta: JSON.stringify(r.stimulus_meta),
    rt_ms: r.rt_ms,
    correct: boolToInt(r.correct),
    abandoned: boolToInt(r.abandoned) ?? 0,
    started_ts: r.started_ts,
    ended_ts: r.ended_ts,
  };
}
