import React, { useState } from 'react';
import { Demographics } from '../orchestrator/sessionMachine';
import { Body, ChoiceRow, ChromeScreen, PrimaryButton, Title } from './ui';

const AGE_BANDS = ['18-24', '25-34', '35-44', '45-54', '55+'] as const;
const GENDERS = ['female', 'male', 'other', 'prefer not'] as const;
const HANDS = ['left', 'right', 'other'] as const;

export function DemographicsScreen({ onSubmit }: { onSubmit: (d: Demographics) => void }) {
  const [ageBand, setAgeBand] = useState<string | null>(null);
  const [gender, setGender] = useState<string | null>(null);
  const [handedness, setHandedness] = useState<'left' | 'right' | 'other' | null>(null);

  const ready = ageBand !== null && gender !== null && handedness !== null;

  return (
    <ChromeScreen>
      <Title>Cadet Profile</Title>
      <Body>Age band</Body>
      <ChoiceRow options={AGE_BANDS} value={ageBand} onChange={setAgeBand} />
      <Body>Gender</Body>
      <ChoiceRow options={GENDERS} value={gender} onChange={setGender} />
      <Body>Dominant hand</Body>
      <ChoiceRow options={HANDS} value={handedness} onChange={setHandedness} />
      {ready && (
        <PrimaryButton
          label="Continue"
          onPress={() => onSubmit({ ageBand: ageBand!, gender: gender!, handedness: handedness! })}
        />
      )}
    </ChromeScreen>
  );
}
