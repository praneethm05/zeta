import React from 'react';
import { Body, ChromeScreen, PrimaryButton, Title } from './ui';

export function DebriefScreen({ onFinish }: { onFinish: () => void }) {
  return (
    <ChromeScreen>
      <Title>Debrief</Title>
      <Body>
        Calibration complete, cadet. Thank you for your service. This simulator
        recorded only anonymous interaction data for research.
      </Body>
      <PrimaryButton label="Finish" onPress={onFinish} />
    </ChromeScreen>
  );
}
