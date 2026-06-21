# Native Timestamp Spike — findings (Risk #1)

**Date:** 2026-06-21
**Task:** Z1 plan Task 1.
**Question:** Does our touch API expose a usable *native* event timestamp (not JS `Date.now()`), per master spec §3?

## Decision

Capture is built on **React Native's core touch responder** (`onResponderGrant/Move/Release`), not RNGH `Gesture.Manual()`.

Rationale:
- RN core touch events expose `nativeEvent.timestamp`, which on Android is the
  `MotionEvent` event-time (`uptimeMillis`) — a native, monotonic clock, **not**
  `Date.now()`. This is exactly the timestamp the spec mandates.
- `nativeEvent.changedTouches[]` provides per-pointer `identifier` (multi-touch)
  plus `locationX/Y` and `force` (pressure) — covering the remaining spec
  requirements (per-pointer IDs, multi-touch).
- RNGH v2's worklet touch callbacks do not cleanly surface a native event
  timestamp from JS, so building capture on them would have risked exactly the
  contamination the spec forbids. RNGH remains in the app (`GestureHandlerRootView`
  root) and is available for later modules that need gesture composition.

## Validation (on-device, folded into Task 11)

The trial screen logs, for the first touch of a session:
- `nativeEvent.timestamp` vs `Date.now()` — the former is uptime-based and far
  smaller than the wall-clock epoch (~1.7e12), confirming it is **not** `Date.now()`.
- successive `timestamp` values are monotonically increasing.

If a future device shows `timestamp` tracking wall-clock epoch instead of uptime,
revisit: it would still be native (set by the platform), but document the clock.
