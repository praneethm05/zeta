import { fittsID } from './fitts';

test('Fitts index of difficulty', () => {
  expect(fittsID(3, 1)).toBeCloseTo(2, 5); // log2(4)=2
  expect(fittsID(0, 1)).toBeCloseTo(0, 5); // log2(1)=0
});

test('throws on non-positive width', () => {
  expect(() => fittsID(3, 0)).toThrow();
});
