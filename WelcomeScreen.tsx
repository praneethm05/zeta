import { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  Modal,
  Platform,
  Pressable,
  StatusBar as RNStatusBar,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Image,
  Alert,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useFonts, Syncopate_700Bold } from '@expo-google-fonts/syncopate';
import { SpaceGrotesk_400Regular, SpaceGrotesk_600SemiBold } from '@expo-google-fonts/space-grotesk';
import { LinearGradient } from 'expo-linear-gradient';
import {
  getSettings, saveSettings, getStorageSizeBytes, clearSessions, AppSettings,
} from './utils/dataLogger';

const { width, height } = Dimensions.get('window');
const SP       = 8;
const STATUS_H = Platform.OS === 'ios' ? 54 : (RNStatusBar.currentHeight ?? 24);
const PLANET_D = Math.round(width * 0.70);
const ROCKS_H  = Math.round(height * 0.26);
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

function formatBytes(bytes: number): string {
  if (bytes < 1024)        return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

interface Props {
  onBegin?: () => void;
}

export default function WelcomeScreen({ onBegin }: Props) {
  const [fontsLoaded] = useFonts({ Syncopate_700Bold, SpaceGrotesk_400Regular, SpaceGrotesk_600SemiBold });

  const fadeAnim   = useRef(new Animated.Value(0)).current;
  const slideAnim  = useRef(new Animated.Value(SP * 5)).current;
  const buttonFade = useRef(new Animated.Value(0)).current;
  const planetBob  = useRef(new Animated.Value(0)).current;
  const twinkle    = useRef(new Animated.Value(1)).current;

  // Settings panel
  const [settingsVisible,  setSettingsVisible]  = useState(false);
  const [settings,         setSettings]         = useState<AppSettings>({ animateSpawn: true, animateDestroy: true });
  const [dataSize,         setDataSize]         = useState(0);
  const [deleteVisible,    setDeleteVisible]    = useState(false);
  const [confirmText,      setConfirmText]      = useState('');

  const CONFIRM_PHRASE = 'I confirm this is not a mistake';

  useEffect(() => {
    getSettings().then(setSettings);
  }, []);

  useEffect(() => {
    if (settingsVisible) {
      getSettings().then(setSettings);
      getStorageSizeBytes().then(setDataSize);
    }
  }, [settingsVisible]);

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
          style={[s.sparkle, { left: sp.left, top: sp.top, width: sp.s, height: sp.s, borderRadius: sp.s / 2, opacity: twinkle }]}
        />
      ))}

      <Animated.View style={[s.content, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
        <Text style={s.eyebrow}>Welcome To</Text>

        {/* Long press planet → hidden settings panel */}
        <Pressable onLongPress={() => setSettingsVisible(true)} delayLongPress={700}>
          <Animated.View style={[s.planetWrap, { transform: [{ translateY: planetBob }] }]}>
            <Image
              source={require('./assets/LandingScreen/transparent.png')}
              style={s.planetImg}
              resizeMode="contain"
            />
          </Animated.View>
        </Pressable>

        <Text style={s.title}>ZETA</Text>
        <View style={s.titleBar} />

        <Text style={s.subtitle}>
          An interactive game designed to test{'\n'}perception and reaction speed.
        </Text>

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

      <Image source={require('./assets/LandingScreen/bottom_rocks.png')} style={s.rocks} resizeMode="cover" />

      {/* ── Single modal: settings OR delete confirm ── */}
      <Modal
        visible={settingsVisible}
        transparent
        animationType="slide"
        onRequestClose={() => { setDeleteVisible(false); setSettingsVisible(false); }}
      >
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.50)', justifyContent: 'flex-end' }}>
          <View style={{ backgroundColor: '#0D0D1A', borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingTop: 20, paddingHorizontal: 28, paddingBottom: 48 }}>

            <View style={{ width: 40, height: 4, backgroundColor: '#2A2A50', borderRadius: 2, alignSelf: 'center', marginBottom: 24 }} />

            {!deleteVisible ? (
              <>
                <Text style={{ fontFamily: 'Syncopate_700Bold', fontSize: 14, color: '#E8E8F0', letterSpacing: 5, marginBottom: 6 }}>
                  MISSION CONTROL
                </Text>
                <Text style={{ fontFamily: 'SpaceGrotesk_400Regular', fontSize: 12, color: '#7A7A9A', marginBottom: 28 }}>
                  Researcher settings
                </Text>

                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#13132A', borderRadius: 14, paddingHorizontal: 18, paddingVertical: 16, marginBottom: 10 }}>
                  <View style={{ flex: 1, marginRight: 16 }}>
                    <Text style={{ fontFamily: 'SpaceGrotesk_600SemiBold', fontSize: 15, color: '#E8E8F0', marginBottom: 3 }}>Spawn Animation</Text>
                    <Text style={{ fontFamily: 'SpaceGrotesk_400Regular', fontSize: 12, color: '#7A7A9A' }}>
                      {settings.animateSpawn ? 'Planets fade in (~220ms RT bias)' : 'Planets appear instantly — RT from frame 0'}
                    </Text>
                  </View>
                  <Switch
                    value={settings.animateSpawn}
                    onValueChange={async (v) => { const u = { ...settings, animateSpawn: v }; setSettings(u); await saveSettings(u); }}
                    trackColor={{ false: '#252545', true: '#4FD1FF' }}
                    thumbColor={settings.animateSpawn ? '#FFFFFF' : '#7A7A9A'}
                  />
                </View>

                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#13132A', borderRadius: 14, paddingHorizontal: 18, paddingVertical: 16, marginBottom: 14 }}>
                  <View style={{ flex: 1, marginRight: 16 }}>
                    <Text style={{ fontFamily: 'SpaceGrotesk_600SemiBold', fontSize: 15, color: '#E8E8F0', marginBottom: 3 }}>Destroy Animation</Text>
                    <Text style={{ fontFamily: 'SpaceGrotesk_400Regular', fontSize: 12, color: '#7A7A9A' }}>
                      {settings.animateDestroy ? 'Burst on tap (~220ms delay)' : 'Planet vanishes instantly on tap'}
                    </Text>
                  </View>
                  <Switch
                    value={settings.animateDestroy}
                    onValueChange={async (v) => { const u = { ...settings, animateDestroy: v }; setSettings(u); await saveSettings(u); }}
                    trackColor={{ false: '#252545', true: '#4FD1FF' }}
                    thumbColor={settings.animateDestroy ? '#FFFFFF' : '#7A7A9A'}
                  />
                </View>

                <TouchableOpacity
                  onLongPress={() => { setConfirmText(''); setDeleteVisible(true); }}
                  delayLongPress={600}
                  activeOpacity={0.7}
                  style={{ backgroundColor: '#13132A', borderRadius: 14, paddingHorizontal: 18, paddingVertical: 16, marginBottom: 28 }}
                >
                  <Text style={{ fontFamily: 'SpaceGrotesk_600SemiBold', fontSize: 15, color: '#E8E8F0', marginBottom: 3 }}>Stored Data</Text>
                  <Text style={{ fontFamily: 'SpaceGrotesk_400Regular', fontSize: 22, color: '#4FD1FF', marginTop: 4 }}>{formatBytes(dataSize)}</Text>
                  <Text style={{ fontFamily: 'SpaceGrotesk_400Regular', fontSize: 12, color: '#7A7A9A', marginTop: 4 }}>
                    All sessions on-device · long press to delete
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => setSettingsVisible(false)}
                  style={{ backgroundColor: '#13132A', borderRadius: 12, paddingVertical: 15, alignItems: 'center' }}
                >
                  <Text style={{ fontFamily: 'SpaceGrotesk_600SemiBold', color: '#E8E8F0', fontSize: 14, letterSpacing: 2 }}>Close</Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <Text style={{ fontFamily: 'Syncopate_700Bold', fontSize: 13, color: '#FF4444', letterSpacing: 4, marginBottom: 10 }}>
                  DANGER ZONE
                </Text>
                <Text style={{ fontFamily: 'SpaceGrotesk_400Regular', fontSize: 13, color: '#E8E8F0', marginBottom: 20, lineHeight: 20 }}>
                  Permanently erases all session data from every participant. Type the phrase below to confirm:
                </Text>

                <Text style={{ fontFamily: 'SpaceGrotesk_600SemiBold', fontSize: 12, color: '#FF4444', marginBottom: 10, letterSpacing: 0.5 }}>
                  {CONFIRM_PHRASE}
                </Text>

                <TextInput
                  value={confirmText}
                  onChangeText={setConfirmText}
                  placeholder="Type confirmation phrase"
                  placeholderTextColor="#3A3A5A"
                  autoCapitalize="none"
                  autoCorrect={false}
                  style={{
                    backgroundColor: '#13132A',
                    borderRadius: 10,
                    paddingHorizontal: 14,
                    paddingVertical: 12,
                    color: '#E8E8F0',
                    fontFamily: 'SpaceGrotesk_400Regular',
                    fontSize: 13,
                    borderWidth: 1,
                    borderColor: confirmText === CONFIRM_PHRASE ? '#FF4444' : '#252545',
                    marginBottom: 20,
                  }}
                />

                <TouchableOpacity
                  disabled={confirmText !== CONFIRM_PHRASE}
                  onPress={async () => {
                    await clearSessions();
                    setDataSize(0);
                    setDeleteVisible(false);
                    setConfirmText('');
                    Alert.alert('Deleted', 'All session data has been erased.');
                  }}
                  style={{
                    backgroundColor: confirmText === CONFIRM_PHRASE ? '#FF4444' : '#1A0A0A',
                    borderRadius: 10,
                    paddingVertical: 14,
                    alignItems: 'center',
                    marginBottom: 10,
                    borderWidth: 1,
                    borderColor: '#FF4444',
                  }}
                >
                  <Text style={{ fontFamily: 'SpaceGrotesk_600SemiBold', color: confirmText === CONFIRM_PHRASE ? '#FFFFFF' : '#FF4444', fontSize: 13, letterSpacing: 1 }}>
                    Delete All Data
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => { setDeleteVisible(false); setConfirmText(''); }}
                  style={{ paddingVertical: 12, alignItems: 'center' }}
                >
                  <Text style={{ fontFamily: 'SpaceGrotesk_400Regular', color: '#7A7A9A', fontSize: 13 }}>Cancel</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </Modal>
    </LinearGradient>
  );
}

const s = StyleSheet.create({
  root:    { flex: 1 },
  sparkle: { position: 'absolute', backgroundColor: C.star },
  content: {
    height:            CONTENT_H,
    marginTop:         STATUS_H,
    alignItems:        'center',
    justifyContent:    'center',
    paddingHorizontal: SP * 4,
  },
  eyebrow: {
    fontFamily:    'SpaceGrotesk_400Regular',
    fontSize:      20,
    color:         C.navy,
    letterSpacing: 5,
    opacity:       0.80,
    marginBottom:  SP,
  },
  planetWrap: { alignItems: 'center', justifyContent: 'center', marginBottom: SP },
  planetImg:  { width: PLANET_D, height: PLANET_D },
  title: {
    fontFamily:    'Syncopate_700Bold',
    fontSize:      44,
    color:         C.navy,
    letterSpacing: 10,
    marginBottom:  SP * 0.5,
  },
  titleBar: {
    width:           SP * 7,
    height:          2,
    backgroundColor: C.navy,
    borderRadius:    1,
    opacity:         0.70,
    marginBottom:    SP * 1.5,
  },
  subtitle: {
    fontFamily:        'SpaceGrotesk_400Regular',
    fontSize:          15,
    color:             C.subText,
    textAlign:         'center',
    lineHeight:        SP * 3,
    letterSpacing:     0.3,
    opacity:           0.80,
    paddingHorizontal: SP * 2,
    marginBottom:      SP * 2.5,
  },
  btnWrapper: { width: width * 0.82 },
  btn: {
    borderRadius:  SP * 1.75,
    overflow:      'hidden',
    shadowColor:   C.purple,
    shadowOffset:  { width: 0, height: SP * 0.75 },
    shadowOpacity: 0.45,
    shadowRadius:  SP * 2,
    elevation:     10,
  },
  btnGrad: { paddingVertical: SP * 2.125, alignItems: 'center', justifyContent: 'center' },
  btnText: {
    fontFamily:    'SpaceGrotesk_600SemiBold',
    color:         C.white,
    fontSize:      16,
    letterSpacing: SP * 0.5,
  },
  rocks: { width, height: ROCKS_H },
});
