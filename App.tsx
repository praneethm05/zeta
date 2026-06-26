import { useState } from 'react';
import { View } from 'react-native';
import WelcomeScreen from './WelcomeScreen';
import GameScreen from './screens/GameScreen';
import ResultsScreen from './screens/ResultsScreen';

type Screen = 'welcome' | 'game' | 'results';

export default function App() {
  const [screen, setScreen] = useState<Screen>('welcome');
  const [finalScore, setFinalScore] = useState(0);
  const [gameKey, setGameKey] = useState(0);

  const handleGameOver = (score: number) => {
    setFinalScore(score);
    setScreen('results');
  };

  const startGame = () => {
    setGameKey((k) => k + 1);
    setScreen('game');
  };

  return (
    <View style={{ flex: 1 }}>
      {screen === 'welcome' && <WelcomeScreen onBegin={startGame} />}
      {screen === 'game' && <GameScreen key={gameKey} onGameOver={handleGameOver} />}
      {screen === 'results' && (
        <ResultsScreen
          score={finalScore}
          onPlayAgain={startGame}
          onHome={() => setScreen('welcome')}
        />
      )}
    </View>
  );
}
