import React, { useEffect, useReducer, useRef, useState } from 'react';
import { GestureResponderEvent, Platform, StyleSheet, useWindowDimensions, View } from 'react-native';
import { calibrateClock } from '../capture/clock';
import { nativeEventTime } from '../capture/nativeTime';
import { ModuleId, TrialResult } from '../modules/types';
import { CapturedTrial, SensorCalibrationScreen } from '../modules/sensorCalibration/SensorCalibrationScreen';
import { newId, repo } from '../data/repo';
import { BriefingScreen } from '../screens/BriefingScreen';
import { ConsentScreen } from '../screens/ConsentScreen';
import { DebriefScreen } from '../screens/DebriefScreen';
import { DemographicsScreen } from '../screens/DemographicsScreen';
import { EnteringSimulation } from '../screens/EnteringSimulation';
import { ResultScreen } from '../screens/ResultScreen';
import { SpaceBackground } from '../theme/SpaceBackground';
import { chrome, trial as trialTheme } from '../theme/tokens';
import { roundRobinCondition, latinSquareOrder } from './assignment';
import { Demographics, initialState, reduce } from './sessionMachine';
import { ZONE_OF } from './zoneMap';

const APP_VERSION = '0.1.0-z1';

interface SessionData {
  participantId: string;
  sessionId: string;
  counter: number;
  condition: string;
  moduleOrder: ModuleId[];
}

export function SessionRoot() {
  const [state, dispatch] = useReducer(reduce, undefined, initialState);
  const { width, height } = useWindowDimensions();
  const data = useRef<SessionData | null>(null);
  const lastResults = useRef<TrialResult[]>([]);
  const [entering, setEntering] = useState(false);

  const deviceModel =
    Platform.OS === 'android' ? (Platform.constants as any)?.Model ?? 'android' : Platform.OS;
  const osVersion = String(Platform.Version);

  function onConsent() {
    const counter = repo.nextAssignmentCounter();
    const condition = roundRobinCondition(counter);
    const participantId = newId();
    const now = Date.now();
    repo.insertParticipant({
      id: participantId,
      deviceModel,
      screenW: Math.round(width),
      screenH: Math.round(height),
      osVersion,
      consentTs: now,
      hyperdriveCondition: condition,
      createdAt: now,
    });
    data.current = {
      participantId,
      sessionId: '',
      counter,
      condition,
      moduleOrder: latinSquareOrder(['sensor_calibration'], counter),
    };
    dispatch({ type: 'GRANT_CONSENT' });
  }

  function onDemographics(demo: Demographics) {
    const d = data.current!;
    repo.updateParticipantDemographics(d.participantId, demo);
    const sessionId = newId();
    repo.insertSession({
      id: sessionId,
      participantId: d.participantId,
      appVersion: APP_VERSION,
      moduleOrder: d.moduleOrder,
      startedAt: Date.now(),
    });
    data.current = { ...d, sessionId };
    dispatch({ type: 'SUBMIT_DEMOGRAPHICS', demographics: demo, participantId: d.participantId });
  }

  // Assignment is computed at consent; emit it on entering the assigning phase.
  useEffect(() => {
    if (state.phase === 'assigning' && data.current) {
      dispatch({ type: 'ASSIGNED', moduleOrder: data.current.moduleOrder, hyperdriveCondition: data.current.condition });
    }
  }, [state.phase]);

  // Close out the session row when the participant reaches the debrief.
  useEffect(() => {
    if (state.phase === 'debrief' && data.current) {
      repo.completeSession(data.current.sessionId, Date.now());
    }
  }, [state.phase]);

  function onBegin(e: GestureResponderEvent) {
    // One-time clock calibration from a real touch, so trial onsets land on the
    // native touch clock (see capture/clock.ts).
    calibrateClock(nativeEventTime(e), Date.now());
    setEntering(true);
    setTimeout(() => {
      setEntering(false);
      dispatch({ type: 'BEGIN_TRIAL' });
    }, 1200);
  }

  function onTrialComplete(trials: CapturedTrial[]) {
    const d = data.current!;
    for (const { result, samples } of trials) {
      const trialId = repo.insertTrial(d.sessionId, result);
      repo.insertTouchEvents(trialId, samples);
    }
    lastResults.current = trials.map((t) => t.result);
    dispatch({ type: 'TRIAL_DONE' });
  }

  function accuracyPct(): number {
    const rs = lastResults.current;
    if (rs.length === 0) return 100;
    const hits = rs.filter((r) => r.correct).length;
    return Math.round((hits / rs.length) * 100);
  }

  const zone = ZONE_OF[state.phase];

  function renderScreen() {
    switch (state.phase) {
      case 'consent':
        return <ConsentScreen onAccept={onConsent} />;
      case 'demographics':
        return <DemographicsScreen onSubmit={onDemographics} />;
      case 'assigning':
        return <EnteringSimulation />;
      case 'briefing':
        return entering ? <EnteringSimulation /> : <BriefingScreen onBegin={onBegin} />;
      case 'trial':
        return <SensorCalibrationScreen onComplete={onTrialComplete} />;
      case 'result':
        return <ResultScreen accuracyPct={accuracyPct()} onContinue={() => dispatch({ type: 'CONTINUE' })} />;
      case 'debrief':
        return <DebriefScreen onFinish={() => dispatch({ type: 'CONTINUE' })} />;
      case 'done':
        return <DebriefScreen onFinish={() => dispatch({ type: 'CONTINUE' })} />;
    }
  }

  return (
    <View style={[styles.root, { backgroundColor: zone === 'trial' ? trialTheme.bg : chrome.bg }]}>
      {zone === 'chrome' && <SpaceBackground />}
      {renderScreen()}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
});
