import { initialState, reduce } from './sessionMachine';

test('starts at consent, ungranted', () => {
  const s = initialState();
  expect(s.phase).toBe('consent');
  expect(s.consentGranted).toBe(false);
});

test('consent is a hard gate: demographics events ignored before consent', () => {
  const s = initialState();
  const after = reduce(s, {
    type: 'SUBMIT_DEMOGRAPHICS',
    demographics: { ageBand: '18-24', gender: 'f', handedness: 'right' },
    participantId: 'p1',
  });
  expect(after.phase).toBe('consent'); // no bypass
});

test('full happy path reaches done', () => {
  let s = initialState();
  s = reduce(s, { type: 'GRANT_CONSENT' });
  expect(s.phase).toBe('demographics');
  s = reduce(s, {
    type: 'SUBMIT_DEMOGRAPHICS',
    demographics: { ageBand: '18-24', gender: 'f', handedness: 'right' },
    participantId: 'p1',
  });
  expect(s.phase).toBe('assigning');
  s = reduce(s, { type: 'ASSIGNED', moduleOrder: ['sensor_calibration'], hyperdriveCondition: 'none' });
  expect(s.phase).toBe('briefing');
  s = reduce(s, { type: 'BEGIN_TRIAL' });
  expect(s.phase).toBe('trial');
  s = reduce(s, { type: 'TRIAL_DONE' });
  expect(s.phase).toBe('result');
  s = reduce(s, { type: 'CONTINUE' }); // no more modules -> debrief
  expect(s.phase).toBe('debrief');
  s = reduce(s, { type: 'CONTINUE' });
  expect(s.phase).toBe('done');
});
