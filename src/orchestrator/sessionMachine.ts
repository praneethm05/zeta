import { ModuleId } from '../modules/types';

export type Phase =
  | 'consent'
  | 'demographics'
  | 'assigning'
  | 'briefing'
  | 'trial'
  | 'result'
  | 'debrief'
  | 'done';

export interface Demographics {
  ageBand: string;
  gender: string;
  handedness: 'left' | 'right' | 'other';
}

export interface SessionState {
  phase: Phase;
  consentGranted: boolean;
  participantId?: string;
  demographics?: Demographics;
  moduleOrder: ModuleId[];
  currentModuleIdx: number;
  hyperdriveCondition?: string;
}

export type Event =
  | { type: 'GRANT_CONSENT' }
  | { type: 'SUBMIT_DEMOGRAPHICS'; demographics: Demographics; participantId: string }
  | { type: 'ASSIGNED'; moduleOrder: ModuleId[]; hyperdriveCondition: string }
  | { type: 'BEGIN_TRIAL' }
  | { type: 'TRIAL_DONE' }
  | { type: 'CONTINUE' };

export function initialState(): SessionState {
  return {
    phase: 'consent',
    consentGranted: false,
    moduleOrder: [],
    currentModuleIdx: 0,
  };
}

export function reduce(s: SessionState, e: Event): SessionState {
  switch (s.phase) {
    // Hard gate: nothing but explicit consent advances past this screen.
    case 'consent':
      if (e.type === 'GRANT_CONSENT') {
        return { ...s, consentGranted: true, phase: 'demographics' };
      }
      return s;

    case 'demographics':
      if (e.type === 'SUBMIT_DEMOGRAPHICS') {
        return {
          ...s,
          demographics: e.demographics,
          participantId: e.participantId,
          phase: 'assigning',
        };
      }
      return s;

    case 'assigning':
      if (e.type === 'ASSIGNED') {
        return {
          ...s,
          moduleOrder: e.moduleOrder,
          hyperdriveCondition: e.hyperdriveCondition,
          currentModuleIdx: 0,
          phase: 'briefing',
        };
      }
      return s;

    case 'briefing':
      if (e.type === 'BEGIN_TRIAL') return { ...s, phase: 'trial' };
      return s;

    case 'trial':
      if (e.type === 'TRIAL_DONE') return { ...s, phase: 'result' };
      return s;

    case 'result':
      if (e.type === 'CONTINUE') {
        const next = s.currentModuleIdx + 1;
        if (next < s.moduleOrder.length) {
          return { ...s, currentModuleIdx: next, phase: 'briefing' };
        }
        return { ...s, phase: 'debrief' };
      }
      return s;

    case 'debrief':
      if (e.type === 'CONTINUE') return { ...s, phase: 'done' };
      return s;

    case 'done':
      return s;
  }
}
