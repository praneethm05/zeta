import { useState } from 'react';
import { View } from 'react-native';
import WelcomeScreen from './WelcomeScreen';
import OnboardingScreen from './screens/OnboardingScreen';
import GameScreen from './screens/GameScreen';
import ResultsScreen from './screens/ResultsScreen';
import { SessionData, ParticipantInfo } from './utils/dataLogger';

type Screen = 'welcome' | 'onboarding' | 'game' | 'results';

export default function App() {
  const [screen,          setScreen]          = useState<Screen>('welcome');
  const [participantInfo, setParticipantInfo] = useState<ParticipantInfo | null>(null);
  const [sessionData,     setSessionData]     = useState<SessionData | null>(null);
  const [gameKey,         setGameKey]         = useState(0);

  const handleGameOver = (data: SessionData) => {
    setSessionData(data);
    setScreen('results');
  };

  const startGame = () => {
    setGameKey((k) => k + 1);
    setScreen('game');
  };

  const handleOnboardingComplete = (info: ParticipantInfo) => {
    setParticipantInfo(info);
    startGame();
  };

  return (
    <View style={{ flex: 1 }}>
      {screen === 'welcome'    && <WelcomeScreen onBegin={() => setScreen('onboarding')} />}
      {screen === 'onboarding' && <OnboardingScreen onComplete={handleOnboardingComplete} />}
      {screen === 'game'       && participantInfo && (
        <GameScreen key={gameKey} participantInfo={participantInfo} onGameOver={handleGameOver} />
      )}
      {screen === 'results'    && sessionData && (
        <ResultsScreen
          sessionData={sessionData}
          onPlayAgain={startGame}
          onNewPlayer={() => setScreen('onboarding')}
          onHome={() => setScreen('welcome')}
        />
      )}
    </View>
  );
}
