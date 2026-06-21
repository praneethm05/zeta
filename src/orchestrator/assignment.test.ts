import { roundRobinCondition, latinSquareOrder, HYPERDRIVE_CONDITIONS } from './assignment';
import { ModuleId } from '../modules/types';

test('round-robin cycles conditions evenly', () => {
  const counts: Record<string, number> = {};
  for (let i = 0; i < HYPERDRIVE_CONDITIONS.length * 5; i++) {
    const c = roundRobinCondition(i);
    counts[c] = (counts[c] ?? 0) + 1;
  }
  expect(new Set(Object.values(counts))).toEqual(new Set([5])); // all equal
});

test('latin square is a permutation of the modules', () => {
  const mods: ModuleId[] = ['sensor_calibration'];
  const order = latinSquareOrder(mods, 0);
  expect([...order].sort()).toEqual([...mods].sort());
});
