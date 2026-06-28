import { useState, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, Pressable, Modal,
  Alert, Share, Platform, ScrollView, useWindowDimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { useFonts, Syncopate_700Bold } from '@expo-google-fonts/syncopate';
import {
  SpaceGrotesk_400Regular,
  SpaceGrotesk_600SemiBold,
} from '@expo-google-fonts/space-grotesk';
import { SessionData, getAllSessions, getPlayerSessions, clearSessions } from '../utils/dataLogger';

interface Props {
  sessionData: SessionData;
  onPlayAgain: () => void;
  onNewPlayer: () => void;
  onHome: () => void;
}

function StatRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: 'rgba(26,22,64,0.10)' }}>
      <Text style={{ fontFamily: 'SpaceGrotesk_400Regular', fontSize: 14, color: '#2A4535' }}>{label}</Text>
      <Text style={{ fontFamily: 'SpaceGrotesk_600SemiBold', fontSize: 14, color: '#1A1640' }}>{value}</Text>
    </View>
  );
}

function formatTs(iso: string): string {
  const d = new Date(iso);
  const mon  = d.toLocaleString('default', { month: 'short' });
  const day  = d.getDate();
  const time = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  return `${mon} ${day}  ${time}`;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024)       return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export default function ResultsScreen({ sessionData, onPlayAgain, onNewPlayer, onHome }: Props) {
  const { height } = useWindowDimensions();
  const [fontsLoaded] = useFonts({ Syncopate_700Bold, SpaceGrotesk_400Regular, SpaceGrotesk_600SemiBold });

  const [exportVisible, setExportVisible] = useState(false);
  const [activeTab,     setActiveTab]     = useState<'session' | 'history'>('session');
  const [allSessions,   setAllSessions]   = useState<SessionData[]>([]);

  useEffect(() => {
    if (exportVisible) {
      getAllSessions().then(s => setAllSessions([...s].reverse())); // newest first
    }
  }, [exportVisible]);

  // Group all sessions by player (name+age key), preserving newest-first order per group
  const playerGroups: Array<{ key: string; name: string; age: number; sessions: SessionData[] }> =
    (() => {
      const map = new Map<string, { name: string; age: number; sessions: SessionData[] }>();
      allSessions.forEach(s => {
        const k = `${s.participant.name}__${s.participant.age}`;
        if (!map.has(k)) map.set(k, { name: s.participant.name, age: s.participant.age, sessions: [] });
        map.get(k)!.sessions.push(s);
      });
      return Array.from(map.entries()).map(([key, v]) => ({ key, ...v }));
    })();

  if (!fontsLoaded) return null;

  const handlePlayAgainPrompt = () => {
    Alert.alert(
      'Same player?',
      `Is ${sessionData.participant.name} continuing?`,
      [
        { text: 'Same Player', onPress: onPlayAgain },
        { text: 'New Player',  onPress: onNewPlayer },
      ],
    );
  };

  const shareJson = async (json: string, title: string) => {
    if (Platform.OS === 'web') {
      console.log(`[Zeta Export] ${title}`, json);
      Alert.alert('Exported', 'Data logged to browser console.');
      return;
    }
    try { await Share.share({ title, message: json }); }
    catch (e) { console.error('[Zeta] share failed:', e); }
  };

  const handleShareSession = () =>
    shareJson(JSON.stringify(sessionData, null, 2), `Zeta — ${sessionData.session_id}`);

  const handleShareOne = (s: SessionData) =>
    shareJson(JSON.stringify(s, null, 2), `Zeta — ${formatTs(s.session_ts)}`);

  const handleSharePlayerGroup = (name: string, age: number, sessions: SessionData[]) =>
    shareJson(JSON.stringify(sessions, null, 2), `Zeta — ${name} (${sessions.length})`);

  const handleShareAll = async () => {
    const sessions = await getAllSessions();
    shareJson(JSON.stringify(sessions, null, 2), `Zeta All Sessions (${sessions.length})`);
  };

  const handleClearAll = () => {
    Alert.alert(
      'Clear All Data',
      `Permanently delete all ${allSessions.length} session(s)? Cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear All', style: 'destructive',
          onPress: async () => {
            await clearSessions();
            setAllSessions([]);
            Alert.alert('Cleared', 'All session data deleted.');
          },
        },
      ],
    );
  };

  const phaseStats = [
    { phase: 1, rt: sessionData.phase1_avg_rt_ms },
    { phase: 2, rt: sessionData.phase2_avg_rt_ms },
    { phase: 3, rt: sessionData.phase3_avg_rt_ms },
  ].filter(p => p.rt > 0);

  const TAB_BTN = (label: string, tab: 'session' | 'history', count?: number) => (
    <TouchableOpacity
      onPress={() => setActiveTab(tab)}
      style={{
        flex: 1, paddingVertical: 9, alignItems: 'center',
        borderBottomWidth: 2,
        borderBottomColor: activeTab === tab ? '#1A1640' : 'transparent',
      }}
    >
      <Text style={{
        fontFamily: 'SpaceGrotesk_600SemiBold', fontSize: 12, letterSpacing: 1.5,
        color: activeTab === tab ? '#1A1640' : '#9CA3AF',
      }}>
        {label}{count != null ? ` (${count})` : ''}
      </Text>
    </TouchableOpacity>
  );

  return (
    <LinearGradient colors={['#5AB582', '#80C29C', '#B5E5C8']} style={{ flex: 1 }}>
      <StatusBar style="dark" />
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 }}>
        <Text style={{ fontFamily: 'Syncopate_700Bold', fontSize: 26, color: '#1A1640', letterSpacing: 8, marginBottom: 32 }}>
          ROUND OVER
        </Text>

        <Pressable onLongPress={() => setExportVisible(true)}>
          <Text style={{ fontFamily: 'SpaceGrotesk_400Regular', fontSize: 80, color: '#1A1640', lineHeight: 86 }}>
            {sessionData.score}
          </Text>
        </Pressable>
        <Text style={{ fontFamily: 'SpaceGrotesk_400Regular', fontSize: 16, color: '#2A4535', opacity: 0.8, marginBottom: 40, letterSpacing: 1 }}>
          planets destroyed
        </Text>

        <View style={{ width: '100%', marginBottom: 48 }}>
          <StatRow label="Avg Reaction Time" value={sessionData.avg_reaction_ms > 0 ? `${sessionData.avg_reaction_ms} ms` : '—'} />
          <StatRow label="Hit Rate"          value={`${sessionData.hit_rate_pct}%`} />
          <StatRow label="Avg Kill Gap"      value={sessionData.inter_kill_avg_ms > 0 ? `${sessionData.inter_kill_avg_ms} ms` : '—'} />
          <StatRow label="Missed Taps"       value={`${sessionData.missed_tap_count}`} />
          {phaseStats.map(p => (
            <StatRow key={p.phase} label={`Phase ${p.phase} Avg RT`} value={`${p.rt} ms`} />
          ))}
        </View>

        <TouchableOpacity onPress={handlePlayAgainPrompt} activeOpacity={0.8}
          style={{ width: '100%', borderRadius: 14, overflow: 'hidden', marginBottom: 16, shadowColor: '#6929D4', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.45, shadowRadius: 16, elevation: 10 }}
        >
          <LinearGradient colors={['#6929D4', '#9B5CF6']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={{ paddingVertical: 17, alignItems: 'center' }}>
            <Text style={{ fontFamily: 'SpaceGrotesk_600SemiBold', color: '#FFFFFF', fontSize: 16, letterSpacing: 4 }}>Play Again</Text>
          </LinearGradient>
        </TouchableOpacity>

        <TouchableOpacity onPress={onHome} activeOpacity={0.8}
          style={{ width: '100%', paddingVertical: 17, alignItems: 'center', borderRadius: 14, borderWidth: 1.5, borderColor: '#1A1640' }}
        >
          <Text style={{ fontFamily: 'SpaceGrotesk_600SemiBold', color: '#1A1640', fontSize: 16, letterSpacing: 4 }}>Home</Text>
        </TouchableOpacity>
      </View>

      {/* ── Export Modal ── */}
      <Modal visible={exportVisible} transparent animationType="slide" onRequestClose={() => setExportVisible(false)}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'flex-end' }}>
          <View style={{ backgroundColor: '#FFFFFF', borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: height * 0.88, paddingTop: 20 }}>

            {/* Drag handle */}
            <View style={{ width: 40, height: 4, backgroundColor: '#D1D5DB', borderRadius: 2, alignSelf: 'center', marginBottom: 16 }} />

            {/* Header */}
            <View style={{ paddingHorizontal: 24, marginBottom: 4 }}>
              <Text style={{ fontFamily: 'Syncopate_700Bold', fontSize: 13, color: '#1A1640', letterSpacing: 4 }}>
                SESSION DATA
              </Text>
              <Text style={{ fontFamily: 'SpaceGrotesk_400Regular', fontSize: 11, color: '#6B7280', marginTop: 2 }}>
                {sessionData.participant.name} · {sessionData.participant.age}y · {sessionData.participant.handedness} hand
              </Text>
            </View>

            {/* Tabs */}
            <View style={{ flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#F3F4F6', marginHorizontal: 24, marginTop: 12 }}>
              {TAB_BTN('THIS SESSION', 'session')}
              {TAB_BTN('HISTORY', 'history', allSessions.length)}
            </View>

            {/* Tab: THIS SESSION */}
            {activeTab === 'session' && (
              <ScrollView style={{ paddingHorizontal: 24, maxHeight: height * 0.42 }} showsVerticalScrollIndicator={false}>
                <View style={{ height: 8 }} />
                <StatRow label="Score"          value={`${sessionData.score}`} />
                <StatRow label="Spawned"        value={`${sessionData.planets_spawned}`} />
                <StatRow label="Destroyed"      value={`${sessionData.planets_destroyed}`} />
                <StatRow label="Expired"        value={`${sessionData.planets_expired}`} />
                <StatRow label="Hit Rate"       value={`${sessionData.hit_rate_pct}%`} />
                <StatRow label="Missed Taps"    value={`${sessionData.missed_tap_count}`} />
                <StatRow label="Avg RT"         value={`${sessionData.avg_reaction_ms} ms`} />
                <StatRow label="Min RT"         value={`${sessionData.min_reaction_ms} ms`} />
                <StatRow label="Max RT"         value={`${sessionData.max_reaction_ms} ms`} />
                <StatRow label="Avg Kill Gap"   value={`${sessionData.inter_kill_avg_ms} ms`} />
                <StatRow label="Avg Concurrent" value={`${sessionData.avg_concurrent_at_tap}`} />
                <StatRow label="Top Zone"       value={sessionData.preferred_zone != null ? `Zone ${sessionData.preferred_zone}` : '—'} />
                <StatRow label="Top Color"      value={sessionData.preferred_color ?? '—'} />
                <StatRow label="Phase 1 RT"     value={`${sessionData.phase1_avg_rt_ms} ms`} />
                <StatRow label="Phase 2 RT"     value={`${sessionData.phase2_avg_rt_ms} ms`} />
                <StatRow label="Phase 3 RT"     value={`${sessionData.phase3_avg_rt_ms} ms`} />
                <StatRow label="Trials"         value={`${sessionData.trials.length}`} />
                <StatRow label="Platform"       value={sessionData.platform} />
                <StatRow label="Screen"         value={`${sessionData.screen_w}×${sessionData.screen_h}`} />
                <View style={{ height: 12 }} />
              </ScrollView>
            )}

            {/* Tab: HISTORY — all players grouped */}
            {activeTab === 'history' && (
              <ScrollView style={{ paddingHorizontal: 24, maxHeight: height * 0.42 }} showsVerticalScrollIndicator={false}>
                <View style={{ height: 8 }} />
                {playerGroups.length === 0 ? (
                  <Text style={{ fontFamily: 'SpaceGrotesk_400Regular', color: '#9CA3AF', fontSize: 13, textAlign: 'center', marginTop: 24 }}>
                    No sessions yet.
                  </Text>
                ) : (
                  playerGroups.map(group => (
                    <View key={group.key} style={{ marginBottom: 20 }}>
                      {/* Player group header */}
                      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1.5, borderBottomColor: '#1A1640', marginBottom: 4 }}>
                        <View>
                          <Text style={{ fontFamily: 'SpaceGrotesk_600SemiBold', fontSize: 13, color: '#1A1640' }}>
                            {group.name}
                          </Text>
                          <Text style={{ fontFamily: 'SpaceGrotesk_400Regular', fontSize: 11, color: '#6B7280' }}>
                            {group.age}y · {group.sessions.length} session{group.sessions.length !== 1 ? 's' : ''}
                          </Text>
                        </View>
                        <TouchableOpacity
                          onPress={() => handleSharePlayerGroup(group.name, group.age, group.sessions)}
                          style={{ backgroundColor: '#1A1640', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6 }}
                        >
                          <Text style={{ fontFamily: 'SpaceGrotesk_600SemiBold', color: '#FFFFFF', fontSize: 11 }}>
                            Export {group.name}
                          </Text>
                        </TouchableOpacity>
                      </View>

                      {/* Sessions under this player */}
                      {group.sessions.map((s, i) => (
                        <View key={s.session_id}
                          style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: 'rgba(26,22,64,0.06)', paddingLeft: 8 }}
                        >
                          <View style={{ width: 24, height: 24, borderRadius: 12, backgroundColor: '#F3F4F6', alignItems: 'center', justifyContent: 'center', marginRight: 10 }}>
                            <Text style={{ fontFamily: 'SpaceGrotesk_600SemiBold', fontSize: 10, color: '#6B7280' }}>
                              {group.sessions.length - i}
                            </Text>
                          </View>
                          <View style={{ flex: 1 }}>
                            <Text style={{ fontFamily: 'SpaceGrotesk_600SemiBold', fontSize: 11, color: '#1A1640', marginBottom: 1 }}>
                              {formatTs(s.session_ts)}
                            </Text>
                            <Text style={{ fontFamily: 'SpaceGrotesk_400Regular', fontSize: 11, color: '#6B7280' }}>
                              {s.score} pts · {s.hit_rate_pct}% hit · {s.avg_reaction_ms}ms RT
                            </Text>
                          </View>
                          <TouchableOpacity onPress={() => handleShareOne(s)}
                            style={{ backgroundColor: '#F3F4F6', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6 }}
                          >
                            <Text style={{ fontFamily: 'SpaceGrotesk_600SemiBold', color: '#1A1640', fontSize: 11 }}>↗</Text>
                          </TouchableOpacity>
                        </View>
                      ))}
                    </View>
                  ))
                )}
                <View style={{ height: 12 }} />
              </ScrollView>
            )}

            {/* Action buttons */}
            <View style={{ paddingHorizontal: 24, paddingTop: 16, paddingBottom: 32, gap: 10 }}>
              <TouchableOpacity onPress={handleShareAll} style={{ backgroundColor: '#4D96FF', borderRadius: 10, paddingVertical: 14, alignItems: 'center' }}>
                <Text style={{ fontFamily: 'SpaceGrotesk_600SemiBold', color: '#FFFFFF', fontSize: 13, letterSpacing: 1 }}>
                  Export All Sessions ({allSessions.length})
                </Text>
              </TouchableOpacity>
              <View style={{ flexDirection: 'row', gap: 10 }}>
                <TouchableOpacity onPress={handleClearAll} style={{ flex: 1, borderRadius: 10, paddingVertical: 12, alignItems: 'center', borderWidth: 1.5, borderColor: '#FF4444' }}>
                  <Text style={{ fontFamily: 'SpaceGrotesk_600SemiBold', color: '#FF4444', fontSize: 12, letterSpacing: 1 }}>Clear All</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setExportVisible(false)} style={{ flex: 1, paddingVertical: 12, alignItems: 'center' }}>
                  <Text style={{ fontFamily: 'SpaceGrotesk_400Regular', color: '#6B7280', fontSize: 13 }}>Close</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </Modal>
    </LinearGradient>
  );
}
