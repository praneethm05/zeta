import React from 'react';
import { Text, StyleSheet } from 'react-native';
import { Body, ChromeScreen, PrimaryButton, Title } from './ui';
import { chrome } from '../theme/tokens';

export function ConsentScreen({ onAccept }: { onAccept: () => void }) {
  return (
    <ChromeScreen>
      <Title>Cadet Enlistment</Title>
      <Body>
        Welcome, recruit. Enlist to begin Starfleet aptitude calibration. Your
        simulator inputs are recorded to tune the training program.
      </Body>
      <Text style={styles.fine}>
        Data use: this study records anonymous touch interactions only. No name,
        email, or personal identifier is collected. Participation is voluntary.
      </Text>
      <PrimaryButton label="Enlist & Begin" onPress={onAccept} />
    </ChromeScreen>
  );
}

const styles = StyleSheet.create({
  fine: { color: chrome.textDim, fontSize: 12, lineHeight: 18, opacity: 0.8 },
});
