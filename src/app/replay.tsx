import { useFocusEffect, useLocalSearchParams, useRouter, type Href } from 'expo-router';
import * as Sharing from 'expo-sharing';
import { useSQLiteContext } from 'expo-sqlite';
import { useCallback, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { captureRef } from 'react-native-view-shot';

import { ThemedText } from '@/components/themed-text';
import { AppGradient } from '@/components/ui/app-gradient';
import { AppIcon } from '@/components/ui/app-icon';
import { BottomTabInset, MaxContentWidth, MiniPlayerInset, Spacing } from '@/constants/theme';
import {
  formatDateKeyLabel,
  formatListeningDuration,
  periodRange,
  summarizeListening,
  todayDateKey,
} from '@/features/analytics/listening-model';
import { listListeningEvents } from '@/features/analytics/repository';
import {
  REPLAY_ELIGIBILITY_DESCRIPTION,
  buildReplayStory,
  evaluateReplayEligibility,
  type ReplayEligibility,
  type ReplayStory,
} from '@/features/replay/replay-model';
import { useTheme } from '@/hooks/use-theme';

type LoadState =
  | { status: 'loading' }
  | { status: 'error' }
  | { status: 'ready'; story: ReplayStory | null; eligibility: ReplayEligibility };

function yearFromParam(value: string | undefined): number {
  const n = Number(value);
  const now = Number(todayDateKey().slice(0, 4));
  return Number.isInteger(n) && n >= 2000 && n <= now ? n : now;
}

export default function ReplayScreen() {
  const theme = useTheme();
  const db = useSQLiteContext();
  const router = useRouter();
  const cardRef = useRef<View>(null);
  const { from, year: yearParam } = useLocalSearchParams<{ from?: string; year?: string }>();
  const [state, setState] = useState<LoadState>({ status: 'loading' });
  const [sharing, setSharing] = useState(false);
  const year = useMemo(() => yearFromParam(yearParam), [yearParam]);

  const load = useCallback(async () => {
    setState({ status: 'loading' });
    try {
      const range = periodRange('year', `${year}-06-15`);
      const events = await listListeningEvents(db, range);
      const summary = summarizeListening(events, range);
      setState({ status: 'ready', story: buildReplayStory(summary, year), eligibility: evaluateReplayEligibility(summary, year) });
    } catch {
      setState({ status: 'error' });
    }
  }, [db, year]);

  useFocusEffect(useCallback(() => { void load(); }, [load]));

  const goBack = () => router.replace((from === 'home' ? '/' : from === 'settings' ? '/settings' : '/listening') as Href);

  const share = async () => {
    if (sharing || state.status !== 'ready' || !state.story) return;
    setSharing(true);
    try {
      const available = await Sharing.isAvailableAsync();
      if (!available) {
        Alert.alert('Sharing unavailable', 'Sharing is not available on this device.');
        return;
      }
      const uri = await captureRef(cardRef, { format: 'png', quality: 1, result: 'tmpfile' });
      await Sharing.shareAsync(uri, { mimeType: 'image/png', dialogTitle: `${state.story.label}` });
    } catch {
      Alert.alert('Could not share', 'The recap card could not be created.');
    } finally {
      setSharing(false);
    }
  };

  return (
    <AppGradient>
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <Pressable accessibilityRole="button" accessibilityLabel="Go back" hitSlop={12} onPress={goBack} style={({ pressed }) => pressed && styles.pressed}>
              <AppIcon name="back" size={24} color="#FFFFFF" />
            </Pressable>
            <ThemedText style={styles.title}>{year} Replay</ThemedText>
          </View>

          {state.status === 'loading' ? (
            <View style={styles.center}><ActivityIndicator color={theme.accent} /><ThemedText themeColor="textMuted" style={styles.muted}>Building your recap…</ThemedText></View>
          ) : state.status === 'error' ? (
            <View accessibilityRole="summary" style={[styles.notice, { backgroundColor: theme.surfaceRaised }]}>
              <ThemedText style={styles.noticeTitle}>Replay unavailable</ThemedText>
              <ThemedText style={styles.noticeBody}>Listening history could not be read on this device.</ThemedText>
              <Pressable accessibilityRole="button" accessibilityLabel="Try again" onPress={() => { void load(); }} style={({ pressed }) => [styles.action, { backgroundColor: theme.accent }, pressed && styles.pressed]}><ThemedText style={styles.actionText}>Try again</ThemedText></Pressable>
            </View>
          ) : !state.story ? (
            <Insufficient eligibility={state.eligibility} />
          ) : (
            <>
              <View ref={cardRef} collapsable={false} style={[styles.card, { backgroundColor: '#121212', borderColor: theme.surfaceRaised }]}>
                <View style={styles.cardBadge}><AppIcon name="music" size={18} color={theme.accent} /><ThemedText style={[styles.cardBadgeText, { color: theme.accent }]}>SOUNDSHELF</ThemedText></View>
                <ThemedText style={styles.cardYear}>{state.story.year}</ThemedText>
                <ThemedText style={styles.cardHeadline}>Your year in music</ThemedText>
                <View style={styles.stats}>
                  <Stat label="Time listened" value={formatListeningDuration(state.story.totalListenedMs)} />
                  <Stat label="Qualified plays" value={String(state.story.qualifiedPlays)} />
                  <Stat label="Tracks" value={String(state.story.uniqueTracks)} />
                  <Stat label="Active days" value={String(state.story.activeDays)} />
                </View>
                {state.story.topTrack ? <Highlight icon="play" label="Top track" value={state.story.topTrack.title} sub={state.story.topTrack.artist ?? 'Unknown artist'} /> : null}
                {state.story.topArtist ? <Highlight icon="music" label="Top artist" value={state.story.topArtist.artist ?? 'Unknown artist'} sub={`${state.story.topArtist.plays} qualified play${state.story.topArtist.plays === 1 ? '' : 's'}`} /> : null}
                {state.story.biggestDay ? <Highlight icon="chart" label="Biggest day" value={formatDateKeyLabel(state.story.biggestDay.date)} sub={`${formatListeningDuration(state.story.biggestDay.listenedMs)} listened`} /> : null}
                <ThemedText style={styles.cardFoot}>Private recap · generated from listening on this device</ThemedText>
              </View>

              <Pressable accessibilityRole="button" accessibilityLabel={sharing ? 'Creating recap image' : 'Share Replay card'} disabled={sharing} onPress={() => { void share(); }} style={({ pressed }) => [styles.share, { backgroundColor: theme.accent }, (pressed || sharing) && styles.pressed]}>
                <AppIcon name="share" size={20} color="#000000" />
                <ThemedText style={styles.shareText}>{sharing ? 'Creating image…' : 'Share recap card'}</ThemedText>
              </Pressable>
              <ThemedText style={styles.muted}>The shared image contains only the recap on this card. Your listening history stays on this device.</ThemedText>
            </>
          )}
        </ScrollView>
      </SafeAreaView>
    </AppGradient>
  );
}

function Insufficient({ eligibility }: { eligibility: ReplayEligibility }) {
  const theme = useTheme();
  return (
    <View accessibilityRole="summary" style={[styles.notice, { backgroundColor: theme.surfaceRaised }]}>
      <ThemedText style={styles.noticeTitle}>Not enough listening history yet</ThemedText>
      <ThemedText style={styles.noticeBody}>SoundShelf only creates a Replay when there is enough real listening to be honest. {REPLAY_ELIGIBILITY_DESCRIPTION}</ThemedText>
      {eligibility.reasons.length > 0 ? (
        <View style={styles.reasons}>{eligibility.reasons.map((r) => <ThemedText key={r} style={styles.reason}>• {r}</ThemedText>)}</View>
      ) : null}
      <ThemedText style={[styles.noticeBody, { color: theme.textMuted }]}>Keep listening with this device; plays count only after the listening rule is met.</ThemedText>
    </View>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  const theme = useTheme();
  return (
    <View style={[styles.stat, { backgroundColor: theme.surfaceRaised }]}>
      <ThemedText style={[styles.statLabel, { color: theme.textMuted }]}>{label.toUpperCase()}</ThemedText>
      <ThemedText style={styles.statValue}>{value}</ThemedText>
    </View>
  );
}

function Highlight({ icon, label, value, sub }: { icon: 'play' | 'music' | 'chart'; label: string; value: string; sub: string }) {
  const theme = useTheme();
  return (
    <View style={[styles.highlight, { backgroundColor: theme.surfaceRaised }]}>
      <AppIcon name={icon} size={20} color={theme.accent} />
      <View style={styles.highlightCopy}>
        <ThemedText style={[styles.highlightLabel, { color: theme.textMuted }]}>{label.toUpperCase()}</ThemedText>
        <ThemedText numberOfLines={1} style={styles.highlightValue}>{value}</ThemedText>
        <ThemedText numberOfLines={1} style={[styles.highlightSub, { color: theme.textMuted }]}>{sub}</ThemedText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  content: { width: '100%', maxWidth: MaxContentWidth, alignSelf: 'center', padding: Spacing.three, paddingBottom: BottomTabInset + MiniPlayerInset + Spacing.four, gap: Spacing.three },
  header: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two, paddingTop: Spacing.one },
  title: { color: '#FFFFFF', fontSize: 30, fontWeight: '700', letterSpacing: -0.4 },
  center: { alignItems: 'center', gap: Spacing.two, paddingVertical: Spacing.five },
  muted: { color: '#B3B3B3', fontSize: 13, lineHeight: 19, textAlign: 'center' },
  notice: { borderRadius: 12, padding: Spacing.three, gap: Spacing.two },
  noticeTitle: { color: '#FFFFFF', fontSize: 18, fontWeight: '800' },
  noticeBody: { color: '#B3B3B3', fontSize: 13, lineHeight: 19 },
  reasons: { gap: 4 },
  reason: { color: '#FFFFFF', fontSize: 13, lineHeight: 19 },
  action: { alignSelf: 'flex-start', borderRadius: 20, paddingHorizontal: Spacing.three, paddingVertical: 9 },
  actionText: { color: '#000000', fontSize: 13, fontWeight: '800' },
  card: { borderRadius: 16, borderWidth: 1, padding: Spacing.three, gap: Spacing.two },
  cardBadge: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  cardBadgeText: { fontSize: 11, fontWeight: '800', letterSpacing: 1.4 },
  cardYear: { color: '#FFFFFF', fontSize: 48, fontWeight: '900', letterSpacing: -1 },
  cardHeadline: { color: '#B3B3B3', fontSize: 15, fontWeight: '600', marginTop: -6 },
  stats: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two, marginTop: Spacing.one },
  stat: { flexGrow: 1, flexBasis: '46%', borderRadius: 10, padding: Spacing.two, gap: 2 },
  statLabel: { fontSize: 10, fontWeight: '800', letterSpacing: 1 },
  statValue: { color: '#FFFFFF', fontSize: 20, fontWeight: '800' },
  highlight: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two, borderRadius: 10, padding: Spacing.two },
  highlightCopy: { flex: 1, gap: 1 },
  highlightLabel: { fontSize: 10, fontWeight: '800', letterSpacing: 1 },
  highlightValue: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' },
  highlightSub: { fontSize: 12 },
  cardFoot: { color: '#7A7A7A', fontSize: 10, lineHeight: 14, marginTop: Spacing.one },
  share: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.two, borderRadius: 24, minHeight: 48 },
  shareText: { color: '#000000', fontSize: 15, fontWeight: '800' },
  pressed: { opacity: 0.68 },
});
