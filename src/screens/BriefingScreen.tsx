import React from 'react';
import { GestureResponderEvent } from 'react-native';
import { Body, ChromeScreen, PrimaryButton, Title } from './ui';

export function BriefingScreen({ onBegin }: { onBegin: (e: GestureResponderEvent) => void }) {
  return (
    <ChromeScreen>
      <Title>Sensor Calibration</Title>
      <Body>
        Targets will flash across the viewport. Tap each one as fast and as
        accurately as you can to calibrate your console sensors.
      </Body>
      <PrimaryButton label="Enter Simulation" onPress={onBegin} />
    </ChromeScreen>
  );
}
