// Maps wall-clock (Date.now) onto the native touch clock (nativeEvent.timestamp,
// Android uptimeMillis), so a target's paint time (which has no touch event) can
// be expressed on the SAME clock as the tap that ends the trial.
//
// Calibrated once per session from a real touch (the "Begin" tap): offset =
// wall - native. The RT *stop* time stays pure-native (no per-trial bridge
// jitter); only the onset carries a single small calibration bias. A native
// onset timestamp (custom module) can replace this later. See the spike note.

let offset: number | null = null; // Date.now() - nativeUptime

export function calibrateClock(nativeTs: number, wallMs: number): void {
  if (offset === null) offset = wallMs - nativeTs;
}

export function isCalibrated(): boolean {
  return offset !== null;
}

// Convert a wall-clock instant to the native-uptime clock.
export function toNative(wallMs: number): number {
  return offset === null ? wallMs : wallMs - offset;
}

export function resetClock(): void {
  offset = null;
}
