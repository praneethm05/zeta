import { PointerSample } from '../../capture/types';
import { TrialResult } from '../types';
import { fittsID } from './fitts';

export interface SensorCondition {
  trialIndex: number;
  condition: string;
  onset_ts: number; // native ts when the target appeared
  target: { x_norm: number; y_norm: number };
  width_norm: number;
  home: { x_norm: number; y_norm: number };
}

const dist = (a: { x_norm: number; y_norm: number }, b: { x_norm: number; y_norm: number }) =>
  Math.hypot(a.x_norm - b.x_norm, a.y_norm - b.y_norm);

export class SensorCalibrationEngine {
  private cond!: SensorCondition;
  private _samples: PointerSample[] = [];
  private _result: TrialResult | null = null;

  configure(c: SensorCondition): void {
    this.cond = c;
    this._samples = [];
    this._result = null;
  }

  ingest(s: PointerSample): void {
    this._samples.push(s);
    // First touch-down on the target screen ends the trial (the tap).
    if (s.phase === 'down' && this._result === null) {
      const err = dist({ x_norm: s.x_norm, y_norm: s.y_norm }, this.cond.target);
      const D = dist(this.cond.target, this.cond.home);
      this._result = {
        module: 'sensor_calibration',
        trialIndex: this.cond.trialIndex,
        condition: this.cond.condition,
        rt_ms: s.t_abs - this.cond.onset_ts,
        correct: err <= this.cond.width_norm / 2,
        abandoned: false,
        stimulus_meta: {
          target: this.cond.target,
          width_norm: this.cond.width_norm,
          home: this.cond.home,
          distance: D,
          error_norm: err,
          fitts_id: fittsID(D, this.cond.width_norm),
        },
        started_ts: this.cond.onset_ts,
        ended_ts: s.t_abs,
      };
    }
  }

  isComplete(): boolean {
    return this._result !== null;
  }

  result(): TrialResult {
    if (this._result === null) throw new Error('trial not complete');
    return this._result;
  }

  samples(): PointerSample[] {
    return this._samples;
  }
}
