# Zeta

A React Native mobile app built with Expo for cognitive research at Christ University. Players tap spawning planets in a timed mini-game; the session data will feed into reaction-time and attention studies.

## What It Does

1. **Welcome screen** — branded landing with an animated space background and a Begin button
2. **Game screen** — 30-second round where SVG planets spawn in place across the screen; tap to destroy them before they despawn
3. **Results screen** — post-round summary showing score, reaction time, and accuracy (currently dummy data)

## Tech Stack

| Layer | Choice |
|-------|--------|
| Framework | Expo SDK 54 (Expo Go compatible) |
| Language | TypeScript |
| React Native | 0.81.5 / React 19 |
| Animations | RN `Animated` API (`useNativeDriver: true`) |
| Vector graphics | `react-native-svg` — SVG planet spheres with radial gradients |
| UI extras | `expo-linear-gradient`, `expo-blur`, `expo-font` |
| Fonts | Syncopate 700, Space Grotesk 400/600, Orbitron |

## Project Structure

```
App.tsx                  # State machine: welcome → game → results
WelcomeScreen.tsx        # Landing / branding
screens/
  GameScreen.tsx         # 30s timer, planet spawner, score HUD
  PlanetObject.tsx       # Animated SVG planet (spawn, bob, spin, tap-destroy)
  ResultsScreen.tsx      # Post-round results display
assets/
  LandingScreen/         # Planet PNG assets
docs/superpowers/specs/  # Design specs
```

## Game Mechanics

- Planets spawn in random visible positions with an elastic spring animation
- Each planet has a random size (80–150 px), tint color, spin direction, and lifespan (3.5–5.5 s)
- Max 10 planets on screen at once; new planet spawns every second
- Tapping a planet triggers a burst animation and increments score
- Timer pulses red at ≤ 5 seconds remaining
- Round ends at 0 → results screen

## Running Locally

```bash
npm install
npx expo start
```

Scan the QR code with **Expo Go** (SDK 54) on iOS or Android.

## Research Context

This app is part of an ongoing study at Christ University. The game screen is designed to measure tap response latency and target-acquisition accuracy under time pressure. Results screen will be connected to a data backend in a future iteration.
