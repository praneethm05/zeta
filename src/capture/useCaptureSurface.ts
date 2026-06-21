import { useCallback } from 'react';
import { GestureResponderEvent, useWindowDimensions } from 'react-native';
import { nativeEventTime } from './nativeTime';
import { normalizePoint } from './normalize';
import { PointerPhase, PointerSample } from './types';

export interface CaptureSurfaceProps {
  onStartShouldSetResponder: () => boolean;
  onMoveShouldSetResponder: () => boolean;
  onResponderGrant: (e: GestureResponderEvent) => void;
  onResponderMove: (e: GestureResponderEvent) => void;
  onResponderRelease: (e: GestureResponderEvent) => void;
}

/**
 * Single source of truth for touch capture. Returns the responder props to spread
 * onto a full-screen View. Every pointer (down/move/up) is normalized against the
 * live screen size and stamped with the native event timestamp; `t_ms` is relative
 * to `trialStartTs`. The module engine consumes only the emitted PointerSamples.
 */
export function useCaptureSurface(
  onSample: (s: PointerSample) => void,
  trialStartTs: number
): CaptureSurfaceProps {
  const { width, height } = useWindowDimensions();

  const emit = useCallback(
    (phase: PointerPhase, e: GestureResponderEvent) => {
      const t_abs = nativeEventTime(e);
      const ne = e.nativeEvent;
      const touches = ne.changedTouches && ne.changedTouches.length > 0 ? ne.changedTouches : [ne];
      for (const t of touches) {
        const { x_norm, y_norm } = normalizePoint(t.locationX, t.locationY, width, height);
        onSample({
          pointerId: Number(t.identifier),
          phase,
          x_norm,
          y_norm,
          t_abs,
          t_ms: t_abs - trialStartTs,
          pressure: typeof t.force === 'number' ? t.force : undefined,
        });
      }
    },
    [onSample, trialStartTs, width, height]
  );

  return {
    onStartShouldSetResponder: () => true,
    onMoveShouldSetResponder: () => true,
    onResponderGrant: (e) => emit('down', e),
    onResponderMove: (e) => emit('move', e),
    onResponderRelease: (e) => emit('up', e),
  };
}
