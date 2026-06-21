import React, { useCallback, useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { toNative } from '../../capture/clock';
import { useCaptureSurface } from '../../capture/useCaptureSurface';
import { PointerSample } from '../../capture/types';
import { trial as trialTheme } from '../../theme/tokens';
import { TrialResult } from '../types';
import { SensorCalibrationEngine } from './engine';
import { SENSOR_TRIALS } from './trials';

export interface CapturedTrial {
  result: TrialResult;
  samples: PointerSample[];
}

/**
 * Frozen trial zone (master spec §4): static background, fixed contrast, only the
 * target stimulus appears. Runs the SENSOR_TRIALS sequence, records the native
 * onset per target, and feeds the capture stream into the pure engine.
 */
export function SensorCalibrationScreen({ onComplete }: { onComplete: (trials: CapturedTrial[]) => void }) {
  const { width, height } = useWindowDimensions();
  const [idx, setIdx] = useState(0);
  const [onsetTs, setOnsetTs] = useState(0);
  const engineRef = useRef(new SensorCalibrationEngine());
  const advancingRef = useRef(false);
  const collected = useRef<CapturedTrial[]>([]);

  const cond = SENSOR_TRIALS[idx];

  // New target paints: stamp its onset on the native clock and arm the engine.
  useEffect(() => {
    const onset = toNative(Date.now());
    setOnsetTs(onset);
    advancingRef.current = false;
    engineRef.current = new SensorCalibrationEngine();
    engineRef.current.configure({ ...cond, onset_ts: onset });
  }, [idx, cond]);

  const onSample = useCallback(
    (s: PointerSample) => {
      const e = engineRef.current;
      e.ingest(s);
      if (e.isComplete() && !advancingRef.current) {
        advancingRef.current = true;
        collected.current.push({ result: e.result(), samples: e.samples() });
        const last = idx + 1 >= SENSOR_TRIALS.length;
        setTimeout(() => {
          if (last) onComplete(collected.current);
          else setIdx((i) => i + 1);
        }, 220);
      }
    },
    [idx, onComplete]
  );

  const surface = useCaptureSurface(onSample, onsetTs);

  const r = (cond.width_norm * width) / 2;
  const cx = cond.target.x_norm * width;
  const cy = cond.target.y_norm * height;

  return (
    <View style={[styles.zone, { backgroundColor: trialTheme.bg }]} {...surface}>
      <Text style={styles.counter}>
        {idx + 1}/{SENSOR_TRIALS.length}
      </Text>
      <View
        pointerEvents="none"
        style={[
          styles.target,
          {
            left: cx - r,
            top: cy - r,
            width: r * 2,
            height: r * 2,
            borderRadius: r,
            backgroundColor: trialTheme.target,
            borderColor: trialTheme.targetRing,
          },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  zone: { flex: 1 },
  counter: { position: 'absolute', top: 24, left: 20, color: trialTheme.text, opacity: 0.5, fontSize: 13 },
  target: { position: 'absolute', borderWidth: 2 },
});
