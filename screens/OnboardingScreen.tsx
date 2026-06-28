import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  KeyboardAvoidingView, Platform, Keyboard, TouchableWithoutFeedback,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { useFonts, Syncopate_700Bold } from '@expo-google-fonts/syncopate';
import {
  SpaceGrotesk_400Regular,
  SpaceGrotesk_600SemiBold,
} from '@expo-google-fonts/space-grotesk';
import { ParticipantInfo } from '../utils/dataLogger';

interface Props {
  onComplete: (info: ParticipantInfo) => void;
}

type Gender        = ParticipantInfo['gender'];
type GamingFreq    = ParticipantInfo['gaming_frequency'];
type Handedness    = ParticipantInfo['handedness'];

const GENDERS: { label: string; value: Gender }[] = [
  { label: 'Male',       value: 'male' },
  { label: 'Female',     value: 'female' },
  { label: 'Non-binary', value: 'non-binary' },
  { label: 'Prefer not', value: 'prefer_not' },
];

const FREQ_OPTIONS: { label: string; value: GamingFreq }[] = [
  { label: 'Casual',   value: 'casual' },
  { label: 'Moderate', value: 'moderate' },
  { label: 'Heavy',    value: 'heavy' },
];

const BG      = '#0D0D1A';
const CARD    = '#13132A';
const BORDER  = '#252545';
const SEL_BG  = 'rgba(79,209,255,0.10)';
const SEL_BOR = '#4FD1FF';
const TEXT    = '#E8E8F0';
const MUTED   = '#7A7A9A';
const ACCENT  = '#4FD1FF';
const ERROR   = '#FF6B6B';

function Label({ children }: { children: string }) {
  return (
    <Text style={{ fontFamily: 'SpaceGrotesk_600SemiBold', fontSize: 12, color: MUTED, letterSpacing: 2, marginBottom: 8, marginTop: 20 }}>
      {children}
    </Text>
  );
}

function OptionButton({
  label, selected, onPress, flex,
}: { label: string; selected: boolean; onPress: () => void; flex?: number }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      style={{
        flex:            flex ?? 1,
        paddingVertical: 11,
        borderRadius:    10,
        borderWidth:     1.5,
        borderColor:     selected ? SEL_BOR : BORDER,
        backgroundColor: selected ? SEL_BG  : CARD,
        alignItems:      'center',
      }}
    >
      <Text style={{
        fontFamily: 'SpaceGrotesk_600SemiBold',
        fontSize:   13,
        color:      selected ? ACCENT : MUTED,
        letterSpacing: 1,
      }}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

export default function OnboardingScreen({ onComplete }: Props) {
  const [fontsLoaded] = useFonts({ Syncopate_700Bold, SpaceGrotesk_400Regular, SpaceGrotesk_600SemiBold });

  const [name,       setName]       = useState('');
  const [age,        setAge]        = useState('');
  const [handedness, setHandedness] = useState<Handedness | null>(null);
  const [gender,     setGender]     = useState<Gender | null>(null);
  const [gaming,     setGaming]     = useState<GamingFreq | null>(null);
  const [error,      setError]      = useState('');

  if (!fontsLoaded) return null;

  const handleLaunch = () => {
    const trimmedName = name.trim();
    const parsedAge   = parseInt(age, 10);

    if (!trimmedName)                          { setError('Enter name or initials.'); return; }
    if (!age || isNaN(parsedAge) || parsedAge < 5 || parsedAge > 99)
                                               { setError('Enter valid age (5–99).'); return; }
    if (!handedness)                           { setError('Select dominant hand.'); return; }
    if (!gender)                               { setError('Select gender.'); return; }
    if (!gaming)                               { setError('Select gaming frequency.'); return; }

    setError('');
    onComplete({
      name:             trimmedName,
      age:              parsedAge,
      handedness,
      gender,
      gaming_frequency: gaming,
    });
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <View style={{ flex: 1, backgroundColor: BG }}>
        <StatusBar style="light" />
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <ScrollView
            contentContainerStyle={{ paddingHorizontal: 28, paddingTop: 80, paddingBottom: 48 }}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* Header */}
            <Text style={{
              fontFamily:    'Syncopate_700Bold',
              fontSize:      22,
              color:         TEXT,
              letterSpacing: 6,
              marginBottom:  6,
            }}>
              CADET PROFILE
            </Text>
            <Text style={{
              fontFamily: 'SpaceGrotesk_400Regular',
              fontSize:   14,
              color:      MUTED,
              marginBottom: 8,
            }}>
              Complete before mission briefing
            </Text>

            {/* Name */}
            <Label>NAME / INITIALS</Label>
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder="e.g. Alex or A.K."
              placeholderTextColor={MUTED}
              style={{
                backgroundColor:  CARD,
                borderRadius:     12,
                borderWidth:      1,
                borderColor:      BORDER,
                color:            TEXT,
                fontSize:         16,
                paddingHorizontal: 16,
                paddingVertical:   13,
              }}
              autoCapitalize="words"
              returnKeyType="next"
            />

            {/* Age */}
            <Label>AGE</Label>
            <TextInput
              value={age}
              onChangeText={t => setAge(t.replace(/[^0-9]/g, ''))}
              placeholder="e.g. 21"
              placeholderTextColor={MUTED}
              keyboardType="numeric"
              maxLength={2}
              style={{
                backgroundColor:  CARD,
                borderRadius:     12,
                borderWidth:      1,
                borderColor:      BORDER,
                color:            TEXT,
                fontSize:         16,
                paddingHorizontal: 16,
                paddingVertical:   13,
              }}
              returnKeyType="done"
            />

            {/* Handedness */}
            <Label>DOMINANT HAND</Label>
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <OptionButton label="Left"  selected={handedness === 'left'}  onPress={() => setHandedness('left')} />
              <OptionButton label="Right" selected={handedness === 'right'} onPress={() => setHandedness('right')} />
            </View>

            {/* Gender */}
            <Label>GENDER</Label>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
              {GENDERS.map(g => (
                <View key={g.value} style={{ width: '47%' }}>
                  <OptionButton
                    label={g.label}
                    selected={gender === g.value}
                    onPress={() => setGender(g.value)}
                  />
                </View>
              ))}
            </View>

            {/* Gaming Frequency */}
            <Label>GAMING FREQUENCY</Label>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              {FREQ_OPTIONS.map(f => (
                <OptionButton
                  key={f.value}
                  label={f.label}
                  selected={gaming === f.value}
                  onPress={() => setGaming(f.value)}
                />
              ))}
            </View>

            {/* Error */}
            {error ? (
              <Text style={{
                fontFamily: 'SpaceGrotesk_400Regular',
                fontSize:   13,
                color:      ERROR,
                marginTop:  20,
                textAlign:  'center',
              }}>
                {error}
              </Text>
            ) : null}

            {/* Launch Button */}
            <TouchableOpacity
              onPress={handleLaunch}
              activeOpacity={0.85}
              style={{
                marginTop:    28,
                borderRadius: 14,
                overflow:     'hidden',
                shadowColor:  '#4FD1FF',
                shadowOffset: { width: 0, height: 6 },
                shadowOpacity: 0.35,
                shadowRadius: 14,
                elevation:    8,
              }}
            >
              <LinearGradient
                colors={['#1A6EFF', '#4FD1FF']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={{ paddingVertical: 18, alignItems: 'center' }}
              >
                <Text style={{
                  fontFamily:    'Syncopate_700Bold',
                  color:         '#FFFFFF',
                  fontSize:      14,
                  letterSpacing: 5,
                }}>
                  LAUNCH MISSION
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          </ScrollView>
        </KeyboardAvoidingView>
      </View>
    </TouchableWithoutFeedback>
  );
}
