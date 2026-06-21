import { SensorCondition } from './engine';

// Fixed "home" the cadet returns to between targets (a bottom-center origin).
const HOME = { x_norm: 0.5, y_norm: 0.85 };

// A small amplitude x width Fitts grid: 3 widths over targets at varied
// distances/angles. onset_ts is filled in at runtime when the target paints;
// `home` is the previous target so D reflects the actual reaching movement.
const TARGETS: { x_norm: number; y_norm: number; width_norm: number }[] = [
  { x_norm: 0.5, y_norm: 0.2, width_norm: 0.16 },
  { x_norm: 0.2, y_norm: 0.45, width_norm: 0.1 },
  { x_norm: 0.8, y_norm: 0.45, width_norm: 0.06 },
  { x_norm: 0.25, y_norm: 0.7, width_norm: 0.06 },
  { x_norm: 0.75, y_norm: 0.7, width_norm: 0.16 },
  { x_norm: 0.5, y_norm: 0.35, width_norm: 0.1 },
  { x_norm: 0.15, y_norm: 0.25, width_norm: 0.06 },
  { x_norm: 0.85, y_norm: 0.25, width_norm: 0.1 },
  { x_norm: 0.5, y_norm: 0.55, width_norm: 0.16 },
];

const round2 = (n: number) => Math.round(n * 100) / 100;

export const SENSOR_TRIALS: SensorCondition[] = TARGETS.map((t, i) => {
  const home = i === 0 ? HOME : { x_norm: TARGETS[i - 1].x_norm, y_norm: TARGETS[i - 1].y_norm };
  const target = { x_norm: t.x_norm, y_norm: t.y_norm };
  const D = Math.hypot(target.x_norm - home.x_norm, target.y_norm - home.y_norm);
  return {
    trialIndex: i,
    condition: `D${round2(D)}_W${t.width_norm}`,
    onset_ts: 0,
    target,
    width_norm: t.width_norm,
    home,
  };
});
