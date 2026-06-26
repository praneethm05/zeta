import { useState, useEffect, useCallback, useRef } from 'react';
import { View, Text, Animated, useWindowDimensions } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import PlanetObject from './PlanetObject';

const TINT_COLORS = ['#FF6B6B', '#FFD93D', '#6BCB77', '#4D96FF', '#C77DFF', '#FF9F1C'];
const GAME_DURATION   = 30;
const SPAWN_INTERVAL  = 1000;
const MAX_PLANETS     = 10;

const SPARKLES = [
  { left: '7%',  top: '4%',  sz: 4   },
  { left: '83%', top: '5%',  sz: 3   },
  { left: '17%', top: '15%', sz: 2.5 },
  { left: '74%', top: '19%', sz: 3.5 },
  { left: '91%', top: '11%', sz: 2   },
  { left: '4%',  top: '23%', sz: 2.5 },
  { left: '61%', top: '8%',  sz: 2   },
];

interface PlanetData {
  id:            string;
  x:             number;
  y:             number;
  size:          number;
  lifespan:      number;
  tintColor:     string;
  spinClockwise: boolean;
  sourceIndex:   number;
}

interface Props {
  onGameOver: (score: number) => void;
}

export default function GameScreen({ onGameOver }: Props) {
  const { width, height } = useWindowDimensions();
  const [planets,  setPlanets]  = useState<PlanetData[]>([]);
  const [score,    setScore]    = useState(0);
  const [timeLeft, setTimeLeft] = useState(GAME_DURATION);

  const idCounter        = useRef(0);
  const scoreRef         = useRef(0);
  const gameActiveRef    = useRef(true);
  const gameOverFiredRef = useRef(false);
  const pulsingRef       = useRef(false);

  const timerOpacity = useRef(new Animated.Value(1)).current;
  const timerScale   = useRef(new Animated.Value(1)).current;

  // Countdown
  useEffect(() => {
    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          gameActiveRef.current = false;
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Game-over trigger
  useEffect(() => {
    if (timeLeft === 0 && !gameOverFiredRef.current) {
      gameOverFiredRef.current = true;
      timerOpacity.stopAnimation();
      timerScale.stopAnimation();
      const t = setTimeout(() => onGameOver(scoreRef.current), 700);
      return () => clearTimeout(t);
    }
  }, [timeLeft]);

  // Critical pulse at ≤5s
  useEffect(() => {
    if (timeLeft === 5 && !pulsingRef.current) {
      pulsingRef.current = true;
      Animated.loop(
        Animated.parallel([
          Animated.sequence([
            Animated.timing(timerOpacity, { toValue: 0.2, duration: 300, useNativeDriver: true }),
            Animated.timing(timerOpacity, { toValue: 1,   duration: 300, useNativeDriver: true }),
          ]),
          Animated.sequence([
            Animated.timing(timerScale, { toValue: 1.4, duration: 300, useNativeDriver: true }),
            Animated.timing(timerScale, { toValue: 1,   duration: 300, useNativeDriver: true }),
          ]),
        ]),
      ).start();
    }
  }, [timeLeft]);

  // Planet spawner
  useEffect(() => {
    const interval = setInterval(() => {
      if (!gameActiveRef.current) return;

      setPlanets((prev) => {
        if (prev.length >= MAX_PLANETS) return prev;

        const sz      = Math.round(80 + Math.random() * 70);
        const margin  = sz / 2 + 20;
        const yMin    = 130;
        const yMax    = height * 0.82 - sz / 2;

        const planet: PlanetData = {
          id:            `p-${idCounter.current++}`,
          x:             margin + Math.random() * (width  - margin * 2),
          y:             yMin   + Math.random() * (yMax   - yMin),
          size:          sz,
          lifespan:      3500 + Math.random() * 2000,
          tintColor:     TINT_COLORS[Math.floor(Math.random() * TINT_COLORS.length)],
          spinClockwise: Math.random() > 0.5,
          sourceIndex:   Math.floor(Math.random() * 2),
        };

        return [...prev, planet];
      });
    }, SPAWN_INTERVAL);

    return () => clearInterval(interval);
  }, [width, height]);

  const removePlanet = useCallback((id: string) => {
    setPlanets((prev) => prev.filter((p) => p.id !== id));
  }, []);

  const destroyPlanet = useCallback((id: string) => {
    setScore((prev) => {
      const next = prev + 1;
      scoreRef.current = next;
      return next;
    });
    setPlanets((prev) => prev.filter((p) => p.id !== id));
  }, []);

  const isCritical = timeLeft > 0 && timeLeft <= 5;

  return (
    <View style={{ flex: 1, backgroundColor: '#1A1640' }}>
      <StatusBar style="light" />

      {SPARKLES.map((sp, i) => (
        <View
          key={i}
          style={{
            position:        'absolute',
            left:            sp.left as `${number}%`,
            top:             sp.top  as `${number}%`,
            width:           sp.sz,
            height:          sp.sz,
            borderRadius:    sp.sz / 2,
            backgroundColor: 'rgba(255,255,255,0.55)',
          }}
        />
      ))}

      {/* HUD */}
      <View
        style={{
          position:        'absolute',
          top:              60,
          left:             24,
          right:            24,
          flexDirection:   'row',
          justifyContent:  'space-between',
          alignItems:      'center',
          zIndex:           10,
        }}
      >
        <Animated.View style={{ opacity: timerOpacity, transform: [{ scale: timerScale }] }}>
          <Text
            style={{
              color:       isCritical ? '#FF4444' : '#FFFFFF',
              fontSize:    32,
              fontWeight:  '700',
              fontVariant: ['tabular-nums'],
            }}
          >
            {String(timeLeft).padStart(2, '0')}
          </Text>
        </Animated.View>

        <Text style={{ color: '#FFD93D', fontSize: 22, fontWeight: '700' }}>
          ✦ {score}
        </Text>
      </View>

      {/* Planets */}
      {planets.map((planet) => (
        <PlanetObject
          key={planet.id}
          {...planet}
          onExit={removePlanet}
          onDestroy={destroyPlanet}
        />
      ))}

      {/* Time's up overlay */}
      {timeLeft === 0 && (
        <View
          style={{
            position:        'absolute',
            top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.55)',
            alignItems:      'center',
            justifyContent:  'center',
          }}
        >
          <Text style={{ color: '#FFFFFF', fontSize: 36, fontWeight: '800', letterSpacing: 4 }}>
            TIME'S UP!
          </Text>
        </View>
      )}
    </View>
  );
}
