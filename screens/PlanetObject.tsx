import { useEffect, useRef } from 'react';
import { Animated, Easing, TouchableWithoutFeedback } from 'react-native';
import Svg, { Circle, Defs, RadialGradient, Stop } from 'react-native-svg';

interface Props {
  id: string;
  x: number;
  y: number;
  size: number;
  lifespan: number;
  tintColor: string;
  spinClockwise: boolean;
  sourceIndex: number;
  onExit: (id: string) => void;
  onDestroy: (id: string) => void;
}

function PlanetSVG({ id, size: s, tintColor }: { id: string; size: number; tintColor: string }) {
  const cx  = s / 2;
  const cy  = s / 2;
  const r  = s * 0.38;
  const gId = `g${id}`;

  return (
    <Svg width={s} height={s} viewBox={`0 0 ${s} ${s}`}>
      <Defs>
        <RadialGradient id={gId} cx="38%" cy="32%" r="65%" gradientUnits="objectBoundingBox">
          <Stop offset="0%"   stopColor="#ffffff" stopOpacity="0.75" />
          <Stop offset="55%"  stopColor={tintColor} stopOpacity="1" />
          <Stop offset="100%" stopColor={tintColor} stopOpacity="1" />
        </RadialGradient>
      </Defs>

      <Circle cx={cx} cy={cy} r={r} fill={`url(#${gId})`} />
    </Svg>
  );
}

export default function PlanetObject({
  id, x, y, size, lifespan, tintColor, spinClockwise, onExit, onDestroy,
}: Props) {
  const spawnScale   = useRef(new Animated.Value(0.1)).current;
  const spawnOpacity = useRef(new Animated.Value(0)).current;
  const destroyScale = useRef(new Animated.Value(1)).current;
  const bob          = useRef(new Animated.Value(0)).current;
  const spin         = useRef(new Animated.Value(0)).current;
  const destroyed    = useRef(false);

  const spinRotate = spin.interpolate({
    inputRange:  [0, 1],
    outputRange: spinClockwise ? ['0deg', '360deg'] : ['360deg', '0deg'],
  });

  useEffect(() => {
    Animated.parallel([
      Animated.spring(spawnScale, { toValue: 1, friction: 4, tension: 90, useNativeDriver: true }),
      Animated.timing(spawnOpacity, { toValue: 1, duration: 200, useNativeDriver: true }),
    ]).start(() => {
      Animated.loop(
        Animated.sequence([
          Animated.timing(bob, { toValue: -12, duration: 1600, useNativeDriver: true }),
          Animated.timing(bob, { toValue:  12, duration: 1600, useNativeDriver: true }),
        ]),
      ).start();

      Animated.loop(
        Animated.timing(spin, {
          toValue:  1,
          duration: 7000,
          easing:   Easing.linear,
          useNativeDriver: true,
        }),
      ).start();
    });

    const timer = setTimeout(() => {
      if (!destroyed.current) despawn();
    }, lifespan);

    return () => {
      clearTimeout(timer);
      bob.stopAnimation();
      spin.stopAnimation();
      spawnScale.stopAnimation();
      spawnOpacity.stopAnimation();
      destroyScale.stopAnimation();
    };
  }, []);

  const despawn = () => {
    destroyed.current = true;
    bob.stopAnimation();
    spin.stopAnimation();
    Animated.parallel([
      Animated.timing(spawnScale,   { toValue: 0.1, duration: 300, useNativeDriver: true }),
      Animated.timing(spawnOpacity, { toValue: 0,   duration: 300, useNativeDriver: true }),
    ]).start(() => onExit(id));
  };

  const handleTap = () => {
    if (destroyed.current) return;
    destroyed.current = true;
    bob.stopAnimation();
    spin.stopAnimation();
    Animated.parallel([
      Animated.timing(destroyScale, { toValue: 1.7, duration: 220, useNativeDriver: true }),
      Animated.timing(spawnOpacity, { toValue: 0,   duration: 220, useNativeDriver: true }),
    ]).start(() => onDestroy(id));
  };

  return (
    <TouchableWithoutFeedback onPress={handleTap}>
      <Animated.View
        style={{
          position: 'absolute',
          left:   x - size / 2,
          top:    y - size / 2,
          width:  size,
          height: size,
          opacity: spawnOpacity,
          transform: [
            { translateY: bob },
            { scale: spawnScale },
            { scale: destroyScale },
          ],
        }}
      >
        <Animated.View style={{ width: size, height: size, transform: [{ rotate: spinRotate }] }}>
          <PlanetSVG id={id} size={size} tintColor={tintColor} />
        </Animated.View>
      </Animated.View>
    </TouchableWithoutFeedback>
  );
}
