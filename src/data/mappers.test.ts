import { touchEventToRow } from './mappers';

test('maps a PointerSample to a touch_events row', () => {
  const row = touchEventToRow('trial-1', {
    pointerId: 2,
    phase: 'move',
    x_norm: 0.5,
    y_norm: 0.25,
    t_ms: 10,
    t_abs: 1010,
    pressure: 0.4,
  });
  expect(row).toMatchObject({
    trial_id: 'trial-1',
    pointer_id: 2,
    phase: 'move',
    x_norm: 0.5,
    y_norm: 0.25,
    t_ms: 10,
    pressure: 0.4,
  });
  expect(typeof row.id).toBe('string');
});
