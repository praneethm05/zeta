import { SensorCalibrationEngine } from './engine';
import { PointerSample } from '../../capture/types';

const cond = {
  trialIndex: 0,
  condition: 'D0.5_W0.1',
  onset_ts: 1000,
  target: { x_norm: 0.8, y_norm: 0.5 },
  width_norm: 0.1,
  home: { x_norm: 0.3, y_norm: 0.5 },
};

test('computes RT, error, and Fitts ID from a synthetic stream', () => {
  const e = new SensorCalibrationEngine();
  e.configure(cond);
  const down: PointerSample = { pointerId: 1, phase: 'down', x_norm: 0.8, y_norm: 0.5, t_ms: 250, t_abs: 1250 };
  e.ingest(down);
  expect(e.isComplete()).toBe(true);
  const r = e.result();
  expect(r.rt_ms).toBe(250); // 1250 - 1000
  expect(r.correct).toBe(true); // dead-center hit
  expect(r.stimulus_meta.fitts_id).toBeCloseTo(Math.log2(0.5 / 0.1 + 1), 5);
  expect(e.samples()).toHaveLength(1);
});

test('off-target tap is incorrect', () => {
  const e = new SensorCalibrationEngine();
  e.configure(cond);
  e.ingest({ pointerId: 1, phase: 'down', x_norm: 0.2, y_norm: 0.5, t_ms: 300, t_abs: 1300 });
  expect(e.result().correct).toBe(false); // |0.2-0.8|=0.6 > width/2
});
