import React from 'react';
import { GestureResponderEvent, Pressable, StyleSheet, Text, View } from 'react-native';
import { chrome, spacing } from '../theme/tokens';

export function ChromeScreen({ children }: { children: React.ReactNode }) {
  return <View style={styles.screen}>{children}</View>;
}

export function Title({ children }: { children: React.ReactNode }) {
  return <Text style={styles.title}>{children}</Text>;
}

export function Body({ children }: { children: React.ReactNode }) {
  return <Text style={styles.body}>{children}</Text>;
}

export function PrimaryButton({
  label,
  onPress,
}: {
  label: string;
  onPress: (e: GestureResponderEvent) => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.btn, pressed && styles.btnPressed]}
      accessibilityRole="button"
    >
      <Text style={styles.btnLabel}>{label}</Text>
    </Pressable>
  );
}

export function ChoiceRow<T extends string>({
  options,
  value,
  onChange,
}: {
  options: readonly T[];
  value: T | null;
  onChange: (v: T) => void;
}) {
  return (
    <View style={styles.row}>
      {options.map((o) => (
        <Pressable
          key={o}
          onPress={() => onChange(o)}
          style={[styles.chip, value === o && styles.chipActive]}
        >
          <Text style={[styles.chipLabel, value === o && styles.chipLabelActive]}>{o}</Text>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, padding: spacing.xl, justifyContent: 'center', gap: spacing.lg },
  title: { color: chrome.text, fontSize: 28, fontWeight: '700', letterSpacing: 0.5 },
  body: { color: chrome.textDim, fontSize: 16, lineHeight: 24 },
  btn: {
    backgroundColor: chrome.accent,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: 14,
    alignItems: 'center',
  },
  btnPressed: { opacity: 0.7 },
  btnLabel: { color: '#fff', fontSize: 17, fontWeight: '600' },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  chip: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: chrome.textDim,
  },
  chipActive: { backgroundColor: chrome.accent, borderColor: chrome.accent },
  chipLabel: { color: chrome.textDim, fontSize: 15 },
  chipLabelActive: { color: '#fff', fontWeight: '600' },
});
