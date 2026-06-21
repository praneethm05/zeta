import React from 'react';
import { Body, ChromeScreen, PrimaryButton, Title } from './ui';

// Deliberately vague (preserves the cover story): a calibration percentage,
// never raw reaction times.
export function ResultScreen({
  accuracyPct,
  onContinue,
}: {
  accuracyPct: number;
  onContinue: () => void;
}) {
  return (
    <ChromeScreen>
      <Title>Calibration {accuracyPct}%</Title>
      <Body>Sensors aligned. Good work, cadet.</Body>
      <PrimaryButton label="Continue" onPress={onContinue} />
    </ChromeScreen>
  );
}
