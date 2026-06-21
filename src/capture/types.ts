export type PointerPhase = 'down' | 'move' | 'up';

export interface PointerSample {
  pointerId: number;
  phase: PointerPhase;
  x_norm: number; // x / screenW  ∈ [0,1]
  y_norm: number; // y / screenH  ∈ [0,1]
  t_ms: number; // native timestamp, relative to trial start
  t_abs: number; // native timestamp, absolute
  pressure?: number;
}
