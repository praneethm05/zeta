# Begin Game Screen — Design Spec

**Date:** 2026-06-26  
**Status:** Approved

---

## Overview

New screen triggered when user taps "Begin" on WelcomeScreen. Planets fly across screen in Fruit Ninja-style arcs for 30 seconds. Tapping a planet destroys it (burst animation + score increment). After 30s, transitions to a dummy ResultsScreen.

---

## Screen Architecture

```
WelcomeScreen
  └─[tap Begin]→ GameScreen (30s fruit-ninja planet mini-game)
                   └─[timer ends]→ ResultsScreen (dummy placeholder)
```

App.tsx manages a simple state machine: `'welcome' | 'game' | 'results'`.  
No navigation library required — plain React state switch.

### New Files

| File | Purpose |
|------|---------|
| `screens/GameScreen.tsx` | Main 30s game loop, planet spawner, timer, score |
| `screens/PlanetObject.tsx` | Single animated planet (arc + spin + tint + tap-to-destroy) |
| `screens/ResultsScreen.tsx` | Dummy results placeholder |

---

## Dependencies

Install via `npx expo install`:
- `react-native-reanimated` — UI-thread animations for buttery arcs
- `react-native-gesture-handler` — tap detection on moving planets

`app.json` needs `"react-native-reanimated/plugin"` added to `plugins`.  
`App.tsx` root wraps in `<GestureHandlerRootView>`.

---

## Planet Physics

Each planet is an instance of `PlanetObject` with these props:

| Prop | Detail |
|------|--------|
| `source` | `transparent_planet.png` (transparent PNG) |
| `tintColor` | Random from 6 presets: `#FF6B6B`, `#FFD93D`, `#6BCB77`, `#4D96FF`, `#C77DFF`, `#FF9F1C` |
| `size` | Random between `80–140px` |
| `rotation` | Random start `0–360°`, spins `+180–360°` during flight |
| `spawnEdge` | Random: left, right, or bottom edge of screen |
| `trajectory` | Entry angle gives parabolic arc — `translateX` linear, `translateY` eased (gravity bow) |
| `duration` | `1800–2400ms` per planet flight |

**Spawn rate:** New planet every `800ms`.  
**Max active planets:** 12 (oldest auto-removed on limit).  
**Exit:** Planet that clears screen boundary is removed silently.

---

## Tap / Destroy Mechanic

- Each planet wrapped in `GestureDetector` (Tap gesture)
- On tap:
  1. Scale `1.0 → 1.4` + opacity `1.0 → 0` over `200ms` (`withTiming`)
  2. Planet removed from active list
  3. Score counter increments by 1
- No penalty for missed planets

---

## HUD

| Element | Position | Detail |
|---------|----------|--------|
| Score | Top-right | `"Score: X"` in SpaceGrotesk bold |
| Countdown | Top-left | `30 → 0` seconds; pulses red when ≤5s |
| Background | Full screen | Dark navy `#1A1640` + static sparkle dots (reuse WelcomeScreen pattern) |

---

## Results Screen (Dummy)

Shown after 30s timer fires.

- Title: `"Round Over"`  
- Score line: `"You destroyed X planets"`  
- Dummy stat rows (placeholder values):
  - `"Reaction Time: -- ms"`
  - `"Accuracy: -- %"`
- Buttons:
  - `"Play Again"` → resets GameScreen (state back to `'game'`)
  - `"Home"` → back to WelcomeScreen (state back to `'welcome'`)
- Style: LinearGradient matching existing app palette (`#5AB582 → #B5E5C8`)

---

## Non-Goals (deferred)

- Swipe/slash gesture (tap only for now)
- Sound effects
- Persistent score storage
- Actual reaction time / accuracy calculation
- Navigation library (React Navigation)
