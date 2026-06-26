import { useEffect, useRef } from 'react';
import {
  Animated,
  Dimensions,
  Platform,
  StatusBar as RNStatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Image,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useFonts, Syncopate_700Bold } from '@expo-google-fonts/syncopate';
import { SpaceGrotesk_400Regular, SpaceGrotesk_600SemiBold } from '@expo-google-fonts/space-grotesk';
import { LinearGradient } from 'expo-linear-gradient';

const { width, height } = Dimensions.get('window');

// 8pt grid base
const SP = 8;

// Status bar offset (safe area approximation)
const STATUS_H = Platform.OS === 'ios' ? 54 : (RNStatusBar.currentHeight ?? 24);

// Planet diameter: 70% of screen width (no clip needed, image is truly transparent)
const PLANET_D = Math.round(width * 0.70);

// Bottom rocks: 26% of screen height
const ROCKS_H = Math.round(height * 0.26);

// Usable height for content (between status bar and rocks)
const CONTENT_H = height - STATUS_H - ROCKS_H;

const C = {
  bgTop:     '#5AB582',
  bgMid:     '#80C29C',
  bgBot:     '#B5E5C8',
  navy:      '#1A1640',
  purple:    '#6929D4',
  purpleEnd: '#9B5CF6',
  subText:   '#2A4535',
  white:     '#FFFFFF',
  star:      'rgba(255,255,255,0.80)',
};

const SPARKLES: Array<{ left: `${number}%`; top: `${number}%`; s: number }> = [
  { left: '7%',  top: '4%',  s: 4   },
  { left: '83%', top: '5%',  s: 3   },
  { left: '17%', top: '15%', s: 2.5 },
  { left: '74%', top: '19%', s: 3.5 },
  { left: '91%', top: '11%', s: 2   },
  { left: '4%',  top: '23%', s: 2.5 },
  { left: '61%', top: '8%',  s: 2   },
];

interface Props {
  onBegin?: () => void;
}

export default function WelcomeScreen({ onBegin }: Props) {
  const [fontsLoaded] = useFonts({
    Syncopate_700Bold,
    SpaceGrotesk_400Regular,
    SpaceGrotesk_600SemiBold,
  });

  const fadeAnim   = useRef(new Animated.Value(0)).current;
  const slideAnim  = useRef(new Animated.Value(SP * 5)).current;
  const buttonFade = useRef(new Animated.Value(0)).current;
  const planetBob  = useRef(new Animated.Value(0)).current;
  const twinkle    = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.delay(300),
      Animated.parallel([
        Animated.timing(fadeAnim,  { toValue: 1, duration: 900, useNativeDriver: true }),
        Animated.timing(slideAnim, { toValue: 0, duration: 900, useNativeDriver: true }),
      ]),
      Animated.delay(200),
      Animated.timing(buttonFade, { toValue: 1, duration: 700, useNativeDriver: true }),
    ]).start(() => {
      Animated.loop(
        Animated.sequence([
          Animated.timing(planetBob, { toValue: -SP * 1.25, duration: 2600, useNativeDriver: true }),
          Animated.timing(planetBob, { toValue: 0,          duration: 2600, useNativeDriver: true }),
        ])
      ).start();

      Animated.loop(
        Animated.sequence([
          Animated.timing(twinkle, { toValue: 0.15, duration: 1800, useNativeDriver: true }),
          Animated.timing(twinkle, { toValue: 1.0,  duration: 1800, useNativeDriver: true }),
        ])
      ).start();
    });
  }, []);

  if (!fontsLoaded) {
    return <View style={{ flex: 1, backgroundColor: C.bgBot }} />;
  }

  return (
    <LinearGradient colors={[C.bgTop, C.bgMid, C.bgBot]} style={s.root}>
      <StatusBar style="dark" />

      {SPARKLES.map((sp, i) => (
        <Animated.View
          key={i}
          style={[
            s.sparkle,
            {
              left:         sp.left,
              top:          sp.top,
              width:        sp.s,
              height:       sp.s,
              borderRadius: sp.s / 2,
              opacity:      twinkle,
            },
          ]}
        />
      ))}

      {/* Content fills space above rocks, starts below status bar */}
      <Animated.View
        style={[
          s.content,
          { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
        ]}
      >
        {/* Top label */}
        <Text style={s.eyebrow}>Welcome To</Text>

        {/* Planet portal */}
        <Animated.View style={[s.planetWrap, { transform: [{ translateY: planetBob }] }]}>
          <Image
            source={require('./assets/LandingScreen/transparent.png')}
            style={s.planetImg}
            resizeMode="contain"
          />
        </Animated.View>

        {/* Brand */}
        <Text style={s.title}>ZETA</Text>
        <View style={s.titleBar} />

        {/* Descriptor */}
        <Text style={s.subtitle}>
          An interactive game designed to test{'\n'}perception and reaction speed.
        </Text>

        {/* CTA */}
        <Animated.View style={[s.btnWrapper, { opacity: buttonFade }]}>
          <TouchableOpacity style={s.btn} activeOpacity={0.8} onPress={onBegin}>
            <LinearGradient
              colors={[C.purple, C.purpleEnd]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={s.btnGrad}
            >
              <Text style={s.btnText}>Begin</Text>
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>
      </Animated.View>

      <Image
        source={require('./assets/LandingScreen/bottom_rocks.png')}
        style={s.rocks}
        resizeMode="cover"
      />
    </LinearGradient>
  );
}

const s = StyleSheet.create({
  root: {
    flex: 1,
  },

  sparkle: {
    position:        'absolute',
    backgroundColor: C.star,
  },

  content: {
    height:            CONTENT_H,
    marginTop:         STATUS_H,
    alignItems:        'center',
    justifyContent:    'center',
    paddingHorizontal: SP * 4,   // 32
  },

  eyebrow: {
    fontFamily:    'SpaceGrotesk_400Regular',
    fontSize:      20,
    color:         C.navy,
    letterSpacing: 5,
    opacity:       0.80,
    marginBottom:  SP,           // 8 — tight to planet
  },

  planetWrap: {
    alignItems:     'center',
    justifyContent: 'center',
    marginBottom:   SP,          // 8 — planet close to title
  },
  planetImg: {
    width:  PLANET_D,
    height: PLANET_D,
  },

  title: {
    fontFamily:    'Syncopate_700Bold',
    fontSize:      44,
    color:         C.navy,
    letterSpacing: 10,
    marginBottom:  SP * 0.5,     // 4 — title hugs its underline
  },
  titleBar: {
    width:           SP * 7,     // 56
    height:          2,
    backgroundColor: C.navy,
    borderRadius:    1,
    opacity:         0.70,
    marginBottom:    SP * 1.5,   // 12 — slight breath before subtitle
  },

  subtitle: {
    fontFamily:    'SpaceGrotesk_400Regular',
    fontSize:      15,
    color:         C.subText,
    textAlign:     'center',
    lineHeight:    SP * 3,       // 24
    letterSpacing: 0.3,
    opacity:       0.80,
    paddingHorizontal: SP * 2,
    marginBottom:  SP * 2.5,     // 20 — CTA needs clear separation
  },

  btnWrapper: {
    width:     width * 0.82,
  },
  btn: {
    borderRadius:  SP * 1.75,    // 14
    overflow:      'hidden',
    shadowColor:   C.purple,
    shadowOffset:  { width: 0, height: SP * 0.75 },
    shadowOpacity: 0.45,
    shadowRadius:  SP * 2,
    elevation:     10,
  },
  btnGrad: {
    paddingVertical: SP * 2.125, // 17
    alignItems:      'center',
    justifyContent:  'center',
  },
  btnText: {
    fontFamily:    'SpaceGrotesk_600SemiBold',
    color:         C.white,
    fontSize:      16,
    letterSpacing: SP * 0.5,     // 4
  },

  rocks: {
    width,
    height: ROCKS_H,
  },
});
