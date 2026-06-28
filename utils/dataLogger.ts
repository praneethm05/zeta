import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY  = 'zeta_sessions_v1';
const SETTINGS_KEY = 'zeta_settings_v1';

export interface AppSettings {
  animateSpawn:   boolean;
  animateDestroy: boolean;
}

export const DEFAULT_SETTINGS: AppSettings = { animateSpawn: true, animateDestroy: true };

export async function getSettings(): Promise<AppSettings> {
  try {
    const raw = await AsyncStorage.getItem(SETTINGS_KEY);
    return raw ? { ...DEFAULT_SETTINGS, ...JSON.parse(raw) } : DEFAULT_SETTINGS;
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export async function saveSettings(settings: AppSettings): Promise<void> {
  try {
    await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch (e) {
    console.error('[Zeta] saveSettings failed:', e);
  }
}

export async function getStorageSizeBytes(): Promise<number> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    return raw ? raw.length : 0;
  } catch {
    return 0;
  }
}

export interface ParticipantInfo {
  name: string;
  age: number;
  handedness: 'left' | 'right';
  gender: 'male' | 'female' | 'non-binary' | 'prefer_not';
  gaming_frequency: 'casual' | 'moderate' | 'heavy';
}

export interface ConcurrentPlanet {
  color: string;
  size: number;
  x_pct: number;
  y_pct: number;
  x_px: number;
  y_px: number;
  spawn_zone: number;
}

export interface PlanetTrial {
  planet_id: string;
  color: string;
  size: number;
  spawn_x_pct: number;
  spawn_y_pct: number;
  spawn_x_px: number;
  spawn_y_px: number;
  spawn_zone: number;
  lifespan_ms: number;
  spawn_ts: number;
  difficulty_phase: 1 | 2 | 3;
  concurrent_count: number;
  concurrent_at_tap: ConcurrentPlanet[];
  hit: boolean;
  tap_x_pct?: number;
  tap_y_pct?: number;
  tap_x_px?: number;
  tap_y_px?: number;
  reaction_ms?: number;
  offset_px?: number;
  inter_kill_ms?: number;
}

export interface MissedTap {
  x_pct: number;
  y_pct: number;
  x_px: number;
  y_px: number;
  ts: number;
  difficulty_phase: 1 | 2 | 3;
}

export interface SessionData {
  session_id: string;
  session_ts: string;
  game_duration_s: number;
  participant: ParticipantInfo;
  score: number;
  planets_spawned: number;
  planets_destroyed: number;
  planets_expired: number;
  hit_rate_pct: number;
  missed_tap_count: number;
  avg_reaction_ms: number;
  min_reaction_ms: number;
  max_reaction_ms: number;
  inter_kill_avg_ms: number;
  avg_concurrent_at_tap: number;
  color_tap_frequency: Record<string, number>;
  zone_hit_frequency: Record<number, number>;
  preferred_zone: number | null;
  preferred_color: string | null;
  phase1_avg_rt_ms: number;
  phase2_avg_rt_ms: number;
  phase3_avg_rt_ms: number;
  screen_w: number;
  screen_h: number;
  platform: string;
  trials: PlanetTrial[];
  missed_taps: MissedTap[];
}

function mean(arr: number[]): number {
  return arr.length ? Math.round(arr.reduce((a, b) => a + b, 0) / arr.length) : 0;
}

function phaseAvgRt(trials: PlanetTrial[], phase: 1 | 2 | 3): number {
  const rts = trials
    .filter(t => t.hit && t.difficulty_phase === phase && t.reaction_ms != null)
    .map(t => t.reaction_ms!);
  return mean(rts);
}

function topKey<T extends string | number>(freq: Record<T, number>): T | null {
  const keys = Object.keys(freq) as T[];
  if (!keys.length) return null;
  return keys.reduce((a, b) => (freq[a] >= freq[b] ? a : b));
}

export function buildSessionData(params: {
  trials: PlanetTrial[];
  missedTaps: MissedTap[];
  participant: ParticipantInfo;
  score: number;
  screenW: number;
  screenH: number;
  platform: string;
}): SessionData {
  const { trials, missedTaps, participant, score, screenW, screenH, platform } = params;
  const hits           = trials.filter(t => t.hit);
  const expired        = trials.filter(t => !t.hit);
  const allRts         = hits.map(t => t.reaction_ms!).filter(n => n > 0);
  const interKillTimes = hits.filter(t => t.inter_kill_ms != null).map(t => t.inter_kill_ms!);
  const concurrents    = hits.map(t => t.concurrent_count);

  const colorFreq: Record<string, number> = {};
  hits.forEach(t => { colorFreq[t.color] = (colorFreq[t.color] || 0) + 1; });

  const zoneFreq: Record<number, number> = {};
  hits.forEach(t => { zoneFreq[t.spawn_zone] = (zoneFreq[t.spawn_zone] || 0) + 1; });

  return {
    session_id:             `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
    session_ts:             new Date().toISOString(),
    game_duration_s:        60,
    participant,
    score,
    planets_spawned:        trials.length,
    planets_destroyed:      hits.length,
    planets_expired:        expired.length,
    hit_rate_pct:           trials.length > 0 ? Math.round((hits.length / trials.length) * 1000) / 10 : 0,
    missed_tap_count:       missedTaps.length,
    avg_reaction_ms:        mean(allRts),
    min_reaction_ms:        allRts.length ? Math.min(...allRts) : 0,
    max_reaction_ms:        allRts.length ? Math.max(...allRts) : 0,
    inter_kill_avg_ms:      mean(interKillTimes),
    avg_concurrent_at_tap:  mean(concurrents),
    color_tap_frequency:    colorFreq,
    zone_hit_frequency:     zoneFreq,
    preferred_zone:         topKey(zoneFreq) != null ? Number(topKey(zoneFreq)) : null,
    preferred_color:        topKey(colorFreq),
    phase1_avg_rt_ms:       phaseAvgRt(trials, 1),
    phase2_avg_rt_ms:       phaseAvgRt(trials, 2),
    phase3_avg_rt_ms:       phaseAvgRt(trials, 3),
    screen_w:               screenW,
    screen_h:               screenH,
    platform,
    trials,
    missed_taps:            missedTaps,
  };
}

export async function getPlayerSessions(name: string, age: number): Promise<SessionData[]> {
  const all = await getAllSessions();
  return all.filter(s => s.participant.name === name && s.participant.age === age);
}

export async function appendSession(session: SessionData): Promise<void> {
  try {
    const raw      = await AsyncStorage.getItem(STORAGE_KEY);
    const sessions: SessionData[] = raw ? JSON.parse(raw) : [];
    sessions.push(session);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
  } catch (e) {
    console.error('[Zeta] appendSession failed:', e);
  }
}

export async function getAllSessions(): Promise<SessionData[]> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export async function clearSessions(): Promise<void> {
  await AsyncStorage.removeItem(STORAGE_KEY);
}
