export function fittsID(distance: number, width: number): number {
  if (width <= 0) throw new Error('width must be > 0');
  return Math.log2(distance / width + 1);
}
