import { normalizePoint } from './normalize';

test('normalizes to unit square', () => {
  expect(normalizePoint(50, 100, 100, 400)).toEqual({ x_norm: 0.5, y_norm: 0.25 });
});

test('clamps out-of-bounds to [0,1]', () => {
  expect(normalizePoint(-5, 500, 100, 400)).toEqual({ x_norm: 0, y_norm: 1 });
});
