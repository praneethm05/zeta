import React from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { chrome, spacing } from '../theme/tokens';
import { Title } from './ui';

// The transition that sells the fiction and marks the methodological line:
// ambient motion (chrome) ends, the frozen measurement zone begins.
export function EnteringSimulation() {
  return (
    <View style={styles.center}>
      <Title>Entering simulation…</Title>
      <ActivityIndicator color={chrome.accent} size="large" style={{ marginTop: spacing.lg }} />
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.md },
});
