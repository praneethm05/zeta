import { Phase } from './sessionMachine';

export type Zone = 'chrome' | 'trial';

// The two-zone boundary, declared as data so SessionRoot can mount the animated
// background iff the current phase is chrome, and so the rule is unit-testable
// (master spec §4 / §10). `trial` is the only frozen zone.
export const ZONE_OF: Record<Phase, Zone> = {
  consent: 'chrome',
  demographics: 'chrome',
  assigning: 'chrome',
  briefing: 'chrome',
  trial: 'trial',
  result: 'chrome',
  debrief: 'chrome',
  done: 'chrome',
};
