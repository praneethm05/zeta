import { ModuleId } from '../modules/types';

export const HYPERDRIVE_CONDITIONS = ['none', 'linear', 'accelerating', 'stalling'] as const;

export function roundRobinCondition(counter: number): string {
  const n = HYPERDRIVE_CONDITIONS.length;
  return HYPERDRIVE_CONDITIONS[((counter % n) + n) % n];
}

// Balanced Latin square row for the given participant index. Each participant
// index yields a permutation; across participants the column balance controls
// order/fatigue effects (master spec §8). Trivial at one module, built whole
// for Z2/Z3.
export function latinSquareOrder(modules: ModuleId[], participantIndex: number): ModuleId[] {
  const n = modules.length;
  if (n === 0) return [];
  const shift = ((participantIndex % n) + n) % n;
  return Array.from({ length: n }, (_, j) => {
    const k = j % 2 === 0 ? j / 2 : n - (j + 1) / 2;
    return modules[(shift + k) % n];
  });
}
