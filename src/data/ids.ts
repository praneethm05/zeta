import { randomUUID } from 'expo-crypto';

// On device, expo-crypto provides a secure UUID. Under the jest-expo mock it
// returns undefined, so fall back to an RFC4122-v4 generator for headless tests.
export const newId = (): string => {
  const id = randomUUID?.();
  if (typeof id === 'string') return id;
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};
