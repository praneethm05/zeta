export function normalizePoint(x: number, y: number, screenW: number, screenH: number) {
  const clamp = (v: number) => Math.min(1, Math.max(0, v));
  return { x_norm: clamp(x / screenW), y_norm: clamp(y / screenH) };
}
