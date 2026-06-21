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
