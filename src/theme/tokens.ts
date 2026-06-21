// Two palettes for the two zones (master spec §4).
// chrome = immersive space cadet UI (animation allowed, nothing measured).
// trial = frozen measurement surface: static, fixed high contrast.

export const chrome = {
  bg: '#05060f',
  bgGradientTop: '#0a0e24',
  text: '#e8ecff',
  textDim: '#8a93c4',
  accent: '#5b8cff',
  planetA: '#3b2f6b',
  planetB: '#1f4a6b',
  planetC: '#6b2f4f',
  glow: '#7aa2ff',
} as const;

export const trial = {
  // Fixed contrast — must not vary across trials so salience stays controlled.
  bg: '#101216',
  surface: '#15181d',
  target: '#f2f4f8',
  targetRing: '#ffffff',
  text: '#f2f4f8',
} as const;

export const spacing = { sm: 8, md: 16, lg: 24, xl: 40 } as const;
