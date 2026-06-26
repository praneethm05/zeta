import { View, Text, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { useFonts, Syncopate_700Bold } from '@expo-google-fonts/syncopate';
import {
  SpaceGrotesk_400Regular,
  SpaceGrotesk_600SemiBold,
} from '@expo-google-fonts/space-grotesk';

interface Props {
  score: number;
  onPlayAgain: () => void;
  onHome: () => void;
}

function StatRow({ label, value }: { label: string; value: string }) {
  return (
    <View
      style={{
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 14,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(26,22,64,0.12)',
      }}
    >
      <Text
        style={{
          fontFamily: 'SpaceGrotesk_400Regular',
          fontSize: 15,
          color: '#2A4535',
        }}
      >
        {label}
      </Text>
      <Text
        style={{
          fontFamily: 'SpaceGrotesk_600SemiBold',
          fontSize: 15,
          color: '#1A1640',
        }}
      >
        {value}
      </Text>
    </View>
  );
}

export default function ResultsScreen({ score, onPlayAgain, onHome }: Props) {
  const [fontsLoaded] = useFonts({
    Syncopate_700Bold,
    SpaceGrotesk_400Regular,
    SpaceGrotesk_600SemiBold,
  });

  if (!fontsLoaded) return null;

  return (
    <LinearGradient
      colors={['#5AB582', '#80C29C', '#B5E5C8']}
      style={{ flex: 1 }}
    >
      <StatusBar style="dark" />
      <View
        style={{
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          paddingHorizontal: 32,
        }}
      >
        <Text
          style={{
            fontFamily: 'Syncopate_700Bold',
            fontSize: 26,
            color: '#1A1640',
            letterSpacing: 8,
            marginBottom: 32,
          }}
        >
          ROUND OVER
        </Text>

        <Text
          style={{
            fontFamily: 'SpaceGrotesk_400Regular',
            fontSize: 80,
            color: '#1A1640',
            lineHeight: 86,
          }}
        >
          {score}
        </Text>
        <Text
          style={{
            fontFamily: 'SpaceGrotesk_400Regular',
            fontSize: 16,
            color: '#2A4535',
            opacity: 0.8,
            marginBottom: 40,
            letterSpacing: 1,
          }}
        >
          planets destroyed
        </Text>

        <View style={{ width: '100%', marginBottom: 48 }}>
          <StatRow label="Reaction Time" value="-- ms" />
          <StatRow label="Accuracy" value="-- %" />
        </View>

        <TouchableOpacity
          onPress={onPlayAgain}
          activeOpacity={0.8}
          style={{
            width: '100%',
            borderRadius: 14,
            overflow: 'hidden',
            marginBottom: 16,
            shadowColor: '#6929D4',
            shadowOffset: { width: 0, height: 6 },
            shadowOpacity: 0.45,
            shadowRadius: 16,
            elevation: 10,
          }}
        >
          <LinearGradient
            colors={['#6929D4', '#9B5CF6']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={{ paddingVertical: 17, alignItems: 'center' }}
          >
            <Text
              style={{
                fontFamily: 'SpaceGrotesk_600SemiBold',
                color: '#FFFFFF',
                fontSize: 16,
                letterSpacing: 4,
              }}
            >
              Play Again
            </Text>
          </LinearGradient>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={onHome}
          activeOpacity={0.8}
          style={{
            width: '100%',
            paddingVertical: 17,
            alignItems: 'center',
            borderRadius: 14,
            borderWidth: 1.5,
            borderColor: '#1A1640',
          }}
        >
          <Text
            style={{
              fontFamily: 'SpaceGrotesk_600SemiBold',
              color: '#1A1640',
              fontSize: 16,
              letterSpacing: 4,
            }}
          >
            Home
          </Text>
        </TouchableOpacity>
      </View>
    </LinearGradient>
  );
}
