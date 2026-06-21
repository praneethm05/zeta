import { PointerSample } from '../capture/types';
import { TrialResult, ModuleId } from '../modules/types';
import { Demographics } from '../orchestrator/sessionMachine';
import { openDb } from './db';
import { newId } from './ids';
import { touchEventToRow, trialToRow } from './mappers';

export interface ParticipantInit {
  id: string;
  deviceModel: string;
  screenW: number;
  screenH: number;
  osVersion: string;
  consentTs: number;
  hyperdriveCondition: string;
  createdAt: number;
}

export interface SessionInit {
  id: string;
  participantId: string;
  appVersion: string;
  moduleOrder: ModuleId[];
  startedAt: number;
}

export const repo = {
  // Atomically read-then-increment the local round-robin counter, returning the
  // value to assign (pre-increment). Z3 swaps this for a Supabase RPC.
  nextAssignmentCounter(): number {
    const d = openDb();
    let value = 0;
    d.withTransactionSync(() => {
      const row = d.getFirstSync<{ counter: number }>('SELECT counter FROM assignment_counter WHERE id = 1');
      value = row?.counter ?? 0;
      d.runSync('UPDATE assignment_counter SET counter = ? WHERE id = 1', value + 1);
    });
    return value;
  },

  insertParticipant(p: ParticipantInit): void {
    openDb().runSync(
      `INSERT INTO participants
         (id, age_band, gender, handedness, device_model, screen_w, screen_h, os_version, consent_ts, hyperdrive_condition, created_at)
       VALUES (?, NULL, NULL, NULL, ?, ?, ?, ?, ?, ?, ?)`,
      p.id, p.deviceModel, p.screenW, p.screenH, p.osVersion, p.consentTs, p.hyperdriveCondition, p.createdAt
    );
  },

  updateParticipantDemographics(id: string, d: Demographics): void {
    openDb().runSync(
      'UPDATE participants SET age_band = ?, gender = ?, handedness = ? WHERE id = ?',
      d.ageBand, d.gender, d.handedness, id
    );
  },

  insertSession(s: SessionInit): void {
    openDb().runSync(
      `INSERT INTO sessions
         (id, participant_id, app_version, module_order, started_at, completed_at, abandoned)
       VALUES (?, ?, ?, ?, ?, NULL, 0)`,
      s.id, s.participantId, s.appVersion, s.moduleOrder.join(','), s.startedAt
    );
  },

  completeSession(id: string, completedAt: number): void {
    openDb().runSync('UPDATE sessions SET completed_at = ? WHERE id = ?', completedAt, id);
  },

  insertTrial(sessionId: string, r: TrialResult): string {
    const row = trialToRow(sessionId, r);
    openDb().runSync(
      `INSERT INTO trials
         (id, session_id, module, trial_index, condition, stimulus_meta, rt_ms, correct, abandoned, started_ts, ended_ts)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      row.id, row.session_id, row.module, row.trial_index, row.condition, row.stimulus_meta,
      row.rt_ms, row.correct, row.abandoned, row.started_ts, row.ended_ts
    );
    return row.id;
  },

  insertTouchEvents(trialId: string, samples: PointerSample[]): void {
    const d = openDb();
    d.withTransactionSync(() => {
      for (const s of samples) {
        const row = touchEventToRow(trialId, s);
        d.runSync(
          `INSERT INTO touch_events (id, trial_id, pointer_id, phase, x_norm, y_norm, t_ms, pressure)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          row.id, row.trial_id, row.pointer_id, row.phase, row.x_norm, row.y_norm, row.t_ms, row.pressure
        );
      }
    });
  },

  countRows(table: 'participants' | 'sessions' | 'trials' | 'touch_events'): number {
    const row = openDb().getFirstSync<{ n: number }>(`SELECT COUNT(*) AS n FROM ${table}`);
    return row?.n ?? 0;
  },
};

export { newId };
