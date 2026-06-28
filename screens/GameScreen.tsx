import { useState, useEffect, useCallback, useRef } from 'react';
import { View, Text, Animated, Platform, Pressable, useWindowDimensions } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import PlanetObject from './PlanetObject';
import {
  PlanetTrial,
  MissedTap,
  SessionData,
  ParticipantInfo,
  buildSessionData,
  appendSession,
  getSettings,
} from '../utils/dataLogger';

const TINT_COLORS   = ['#FF6B6B', '#FFD93D', '#6BCB77', '#4D96FF', '#C77DFF', '#FF9F1C'];
const GAME_DURATION = 60;

function shuffleColors(): string[] {
  const c = [...TINT_COLORS];
  for (let i = c.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [c[i], c[j]] = [c[j], c[i]];
  }
  return c;
}

// 3x3 zone grid — anchored at fractional screen positions
// Zone index: 0=top-left … 8=bottom-right (row-major)
const ZONE_X_PCT = [0.18, 0.50, 0.82];
const ZONE_Y_PCT = [0.22, 0.50, 0.76];

const SPARKLES = [
  { left: '7%',  top: '4%',  sz: 4   },
  { left: '83%', top: '5%',  sz: 3   },
  { left: '17%', top: '15%', sz: 2.5 },
  { left: '74%', top: '19%', sz: 3.5 },
  { left: '91%', top: '11%', sz: 2   },
  { left: '4%',  top: '23%', sz: 2.5 },
  { left: '61%', top: '8%',  sz: 2   },
];

/*
  Research-phase design (cognitive load, NOT difficulty):
  ─────────────────────────────────────────────────────
  Phase 1 — ISOLATION (0-20s)
    Max 2 planets on screen. Captures baseline RT and zone preference
    with no selection confound (user has at most 2 choices).
    Size varied to test if size draws attention even without competition.

  Phase 2 — SELECTION SET (20-40s)
    3-5 planets on screen. Core research condition: which planet does
    the user choose when multiple options are visible? Captures color
    salience, size affordance, and position bias simultaneously.

  Phase 3 — HIGH LOAD (40-60s)
    5-8 planets on screen. Tests whether selection strategy changes
    under higher cognitive load / more options. Does the user's
    color/size/position preference hold or shift?

  All phases use comfortable lifespans and tap targets so that users
  can successfully interact — failed taps = missing data.
*/
interface ResearchPhase {
  phase:           1 | 2 | 3;
  spawnIntervalMs: number;
  minLifespanMs:   number;
  maxLifespanMs:   number;
  maxPlanets:      number;
  minSize:         number;
  maxSize:         number;
}

function getResearchPhase(elapsed: number): ResearchPhase {
  if (elapsed < 20) {
    return { phase: 1, spawnIntervalMs: 1500, minLifespanMs: 4500, maxLifespanMs: 7000, maxPlanets: 2,  minSize: 80,  maxSize: 150 };
  }
  if (elapsed < 40) {
    return { phase: 2, spawnIntervalMs: 1200, minLifespanMs: 3500, maxLifespanMs: 5500, maxPlanets: 5,  minSize: 65,  maxSize: 135 };
  }
  return   { phase: 3, spawnIntervalMs: 900,  minLifespanMs: 2500, maxLifespanMs: 4000, maxPlanets: 8,  minSize: 55,  maxSize: 115 };
}

interface PlanetData {
  id:            string;
  x:             number;
  y:             number;
  size:          number;
  lifespan:      number;
  tintColor:     string;
  spinClockwise: boolean;
  sourceIndex:   number;
  spawnTs:       number;
  phase:         1 | 2 | 3;
  zone:          number;
}

interface Props {
  participantInfo: ParticipantInfo;
  onGameOver: (sessionData: SessionData) => void;
}

function shuffleZones(): number[] {
  const z = [0, 1, 2, 3, 4, 5, 6, 7, 8];
  for (let i = z.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [z[i], z[j]] = [z[j], z[i]];
  }
  return z;
}

export default function GameScreen({ participantInfo, onGameOver }: Props) {
  const { width, height } = useWindowDimensions();
  const [planets,      setPlanets]      = useState<PlanetData[]>([]);
  const [score,        setScore]        = useState(0);
  const [timeLeft,     setTimeLeft]     = useState(GAME_DURATION);
  const [animateSpawn,   setAnimateSpawn]   = useState(true);
  const [animateDestroy, setAnimateDestroy] = useState(true);

  useEffect(() => {
    getSettings().then(s => {
      setAnimateSpawn(s.animateSpawn);
      setAnimateDestroy(s.animateDestroy);
    });
  }, []);

  const idCounter        = useRef(0);
  const scoreRef         = useRef(0);
  const timeLeftRef      = useRef(GAME_DURATION);
  const gameActiveRef    = useRef(true);
  const gameOverFiredRef = useRef(false);
  const pulsingRef       = useRef(false);
  const lastKillTs       = useRef(0);
  const zoneQueue        = useRef<number[]>([]);
  const colorQueue       = useRef<string[]>([]);

  const trialsRef     = useRef<PlanetTrial[]>([]);
  const missedTapsRef = useRef<MissedTap[]>([]);

  const timerOpacity = useRef(new Animated.Value(1)).current;
  const timerScale   = useRef(new Animated.Value(1)).current;

  // Returns screen coords for next zone, with small jitter so spawns look natural
  const nextZonePosition = (sz: number): { x: number; y: number; zone: number } => {
    if (zoneQueue.current.length === 0) {
      zoneQueue.current = shuffleZones();
    }
    const zone    = zoneQueue.current.pop()!;
    const baseX   = ZONE_X_PCT[zone % 3] * width;
    const baseY   = ZONE_Y_PCT[Math.floor(zone / 3)] * height;
    const jitterX = (Math.random() - 0.5) * width  * 0.12;
    const jitterY = (Math.random() - 0.5) * height * 0.10;
    const margin  = sz / 2 + 16;
    const x       = Math.max(margin, Math.min(width  - margin, baseX + jitterX));
    const y       = Math.max(120 + sz / 2, Math.min(height * 0.85 - sz / 2, baseY + jitterY));
    return { x, y, zone };
  };

  // Countdown
  useEffect(() => {
    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          gameActiveRef.current = false;
          timeLeftRef.current   = 0;
          return 0;
        }
        const next = prev - 1;
        timeLeftRef.current = next;
        return next;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Game-over
  useEffect(() => {
    if (timeLeft === 0 && !gameOverFiredRef.current) {
      gameOverFiredRef.current = true;
      timerOpacity.stopAnimation();
      timerScale.stopAnimation();

      const sessionData = buildSessionData({
        trials:      trialsRef.current,
        missedTaps:  missedTapsRef.current,
        participant: participantInfo,
        score:       scoreRef.current,
        screenW:     width,
        screenH:     height,
        platform:    Platform.OS,
      });
      appendSession(sessionData);

      const t = setTimeout(() => onGameOver(sessionData), 700);
      return () => clearTimeout(t);
    }
  }, [timeLeft]);

  // Critical pulse
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

  // Spawner — one planet per tick, zone-balanced
  useEffect(() => {
    const lastSpawn = { ts: 0 };

    const interval = setInterval(() => {
      if (!gameActiveRef.current) return;

      const elapsed = GAME_DURATION - timeLeftRef.current;
      const phase   = getResearchPhase(elapsed);
      const now     = Date.now();

      if (now - lastSpawn.ts < phase.spawnIntervalMs) return;
      lastSpawn.ts = now;

      const sz       = Math.round(phase.minSize + Math.random() * (phase.maxSize - phase.minSize));
      const { x, y, zone } = nextZonePosition(sz);
      const lifeMs   = phase.minLifespanMs + Math.random() * (phase.maxLifespanMs - phase.minLifespanMs);

      // Color queue ensures all 6 colors appear before any repeats — eliminates clustering bias
      if (colorQueue.current.length === 0) colorQueue.current = shuffleColors();
      const tintColor = colorQueue.current.pop()!;

      const candidate: PlanetData = {
        id:            `p-${idCounter.current++}`,
        x, y,
        size:          sz,
        lifespan:      lifeMs,
        tintColor,
        spinClockwise: Math.random() > 0.5,
        sourceIndex:   Math.floor(Math.random() * 2),
        spawnTs:       now,
        phase:         phase.phase,
        zone,
      };

      setPlanets((prev) => {
        if (prev.length >= phase.maxPlanets) return prev;
        return [...prev, candidate];
      });
    }, 100);

    return () => clearInterval(interval);
  }, [width, height]);

  const removePlanet = useCallback((id: string) => {
    setPlanets((prev) => {
      const planet = prev.find(p => p.id === id);
      if (planet) {
        trialsRef.current.push({
          planet_id:        planet.id,
          color:            planet.tintColor,
          size:             planet.size,
          spawn_x_pct:      planet.x / width,
          spawn_y_pct:      planet.y / height,
          spawn_x_px:       planet.x,
          spawn_y_px:       planet.y,
          spawn_zone:       planet.zone,
          lifespan_ms:      planet.lifespan,
          spawn_ts:         planet.spawnTs,
          difficulty_phase: planet.phase,
          concurrent_count: prev.length - 1,
          concurrent_at_tap: [],
          hit:              false,
        });
      }
      return prev.filter((p) => p.id !== id);
    });
  }, [width, height]);

  const destroyPlanet = useCallback((id: string, tapX: number, tapY: number, reactionMs: number) => {
    const now         = Date.now();
    const interKillMs = lastKillTs.current > 0 ? now - lastKillTs.current : undefined;
    lastKillTs.current = now;

    setScore((prev) => {
      const next = prev + 1;
      scoreRef.current = next;
      return next;
    });

    setPlanets((prev) => {
      const planet = prev.find(p => p.id === id);
      if (planet) {
        // All other visible planets at the exact moment of this tap — core research data
        const concurrent = prev
          .filter(p => p.id !== id)
          .map(p => ({
            color:    p.tintColor,
            size:     p.size,
            x_pct:    p.x / width,
            y_pct:    p.y / height,
            x_px:     p.x,
            y_px:     p.y,
            spawn_zone: p.zone,
          }));

        const dx       = tapX - planet.x;
        const dy       = tapY - planet.y;
        const offsetPx = Math.round(Math.sqrt(dx * dx + dy * dy));

        trialsRef.current.push({
          planet_id:         planet.id,
          color:             planet.tintColor,
          size:              planet.size,
          spawn_x_pct:       planet.x / width,
          spawn_y_pct:       planet.y / height,
          spawn_x_px:        planet.x,
          spawn_y_px:        planet.y,
          spawn_zone:        planet.zone,
          lifespan_ms:       planet.lifespan,
          spawn_ts:          planet.spawnTs,
          difficulty_phase:  planet.phase,
          concurrent_count:  concurrent.length,
          concurrent_at_tap: concurrent,
          hit:               true,
          tap_x_pct:         tapX / width,
          tap_y_pct:         tapY / height,
          tap_x_px:          tapX,
          tap_y_px:          tapY,
          reaction_ms:       reactionMs,
          offset_px:         offsetPx,
          inter_kill_ms:     interKillMs,
        });
      }
      return prev.filter((p) => p.id !== id);
    });
  }, [width, height]);

  const handleMissTap = useCallback((tapX: number, tapY: number) => {
    if (!gameActiveRef.current) return;
    const elapsed = GAME_DURATION - timeLeftRef.current;
    const phase   = getResearchPhase(elapsed);
    missedTapsRef.current.push({
      x_pct:            tapX / width,
      y_pct:            tapY / height,
      x_px:             tapX,
      y_px:             tapY,
      ts:               Date.now(),
      difficulty_phase: phase.phase,
    });
  }, [width, height]);

  const isCritical = timeLeft > 0 && timeLeft <= 5;

  return (
    <View style={{ flex: 1, backgroundColor: '#1A1640' }}>
      <StatusBar style="light" />

      <Pressable
        style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
        onPress={(e) => handleMissTap(e.nativeEvent.pageX, e.nativeEvent.pageY)}
      />

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

      <View
        style={{
          position:       'absolute',
          top:             60,
          left:            24,
          right:           24,
          flexDirection:  'row',
          justifyContent: 'space-between',
          alignItems:     'center',
          zIndex:          10,
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

      {planets.map((planet) => (
        <PlanetObject
          key={planet.id}
          id={planet.id}
          x={planet.x}
          y={planet.y}
          size={planet.size}
          lifespan={planet.lifespan}
          tintColor={planet.tintColor}
          spinClockwise={planet.spinClockwise}
          sourceIndex={planet.sourceIndex}
          animateSpawn={animateSpawn}
          animateDestroy={animateDestroy}
          onExit={removePlanet}
          onDestroy={destroyPlanet}
        />
      ))}

      {timeLeft === 0 && (
        <View
          style={{
            position:       'absolute',
            top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.55)',
            alignItems:     'center',
            justifyContent: 'center',
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
