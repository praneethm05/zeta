import { ZONE_OF } from './zoneMap';

test('trial phase is the only frozen zone; chrome elsewhere', () => {
  expect(ZONE_OF.trial).toBe('trial');
  for (const p of ['consent', 'demographics', 'assigning', 'briefing', 'result', 'debrief', 'done'] as const) {
    expect(ZONE_OF[p]).toBe('chrome');
  }
});
