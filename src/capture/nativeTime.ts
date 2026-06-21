import { GestureResponderEvent } from 'react-native';

// RN core touch events carry the native MotionEvent time on `nativeEvent.timestamp`
// (Android: getEventTime / uptimeMillis) — a monotonic native clock, NOT JS
// Date.now(). See docs/superpowers/notes/2026-06-21-timestamp-spike.md.
export function nativeEventTime(e: GestureResponderEvent): number {
  return e.nativeEvent.timestamp;
}
