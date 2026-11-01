import { useFocusEffect, useLocalSearchParams, useRouter, type Href } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { AppGradient } from '@/components/ui/app-gradient';
import { AppIcon } from '@/components/ui/app-icon';
import { BottomTabInset, MaxContentWidth, MiniPlayerInset, Spacing } from '@/constants/theme';
import {
  addDaysToDateKey,
  formatDateKeyLabel,
  formatListeningDuration,
  LISTEN_RULE_DESCRIPTION,
  periodRange,
  periodRangeLabel,
  previousPeriodRange,
  summarizeListening,
  todayDateKey,
  type DateRange,
  type ListeningEvent,
  type ListeningPeriod,
} from '@/features/analytics/listening-model';
import {
  countListeningEvents,
  earliestListeningDate,
  listListeningEvents,
} from '@/features/analytics/repository';
import { useTheme } from '@/hooks/use-theme';

const PERIODS: { key: ListeningPeriod; label: string }[] = [
  { key: 'day', label: 'Day' },
  { key: 'week', label: 'Week' },
  { key: 'month', label: 'Month' },
  { key: 'year', label: 'Year' },
];

/** Start date of the period after the given one, used by the "next" arrow. */
function nextPeriodStart(period: ListeningPeriod, range: DateRange): string {
  if (period === 'day') {
    return addDaysToDateKey(range.startDate, 1);
  }
  if (period === 'week') {
    return addDaysToDateKey(range.startDate, 7);
  }
  return periodRange(period, addDaysToDateKey(range.endDate, 1)).startDate;
}

function daysInRange(range: DateRange): number {
  const start = Date.parse(`${range.startDate}T00:00:00Z`);
  const end = Date.parse(`${range.endDate}T00:00:00Z`);
  return Math.round((end - start) / 86_400_000) + 1;
}

type HistoryState = {
  loading: boolean;
  error: string | null;
  /** Every attempt in the visible period, qualified or not. */
  events: ListeningEvent[];
  /** Total attempts ever stored, so an empty period can be described honestly. */
  totalEvents: number;
  /** Earliest stored local date, when any history exists. */
  earliestDate: string | null;
};

const EMPTY_STATE: HistoryState = { loading: true, error: null, events: [], totalEvents: 0, earliestDate: null };

export default function ListeningScreen() {
  const theme = useTheme();
  const db = useSQLiteContext();
  const router = useRouter();
  const { from } = useLocalSearchParams<{ from?: string }>();

  const [period, setPeriod] = useState<ListeningPeriod>('week');
  const [anchorDate, setAnchorDate] = useState(() => todayDateKey());
  const [history, setHistory] = useState<HistoryState>(EMPTY_STATE);

  // Both are plain strings, so the callback stays stable unless the visible period changes.
  const range = useMemo(() => periodRange(period, anchorDate), [anchorDate, period]);
  const { startDate, endDate } = range;

  const load = useCallback(async () => {
    setHistory((current) => ({ ...current, loading: true, error: null }));
    try {
      const [events, totalEvents, earliestDate] = await Promise.all([
        listListeningEvents(db, { startDate, endDate }),
        countListeningEvents(db),
        earliestListeningDate(db),
      ]);
      setHistory({ loading: false, error: null, events, totalEvents, earliestDate });
    } catch {
      setHistory((current) => ({
        ...current,
        loading: false,
        error: 'Listening history could not be read on this device.',
      }));
    }
  }, [db, endDate, startDate]);

  // Reload whenever the screen regains focus, so stats include what was just played.
  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  const summary = useMemo(
    () => summarizeListening(history.events, { startDate, endDate }),
    [endDate, history.events, startDate],
  );
  const dayCount = useMemo(() => daysInRange(range), [range]);
  const maxDailyListenedMs = useMemo(
    () => summary.daily.reduce((max, day) => Math.max(max, day.listenedMs), 0),
    [summary.daily],
  );

  const today = todayDateKey();
  const isCurrentPeriod = endDate >= today;
  const canGoNext = !isCurrentPeriod;
  const rangeLabel = periodRangeLabel(period, { startDate, endDate });

  const goBack = () => {
    // The screen is opened from Home or Settings with a `from` param. Replacing (rather than
    // popping) keeps the destination predictable across both entry points and the tab bar.
    router.replace((from === 'home' ? '/' : '/settings') as Href);
  };

  const goPrevious = () => {
    setAnchorDate(previousPeriodRange(period, { startDate, endDate }).startDate);
  };

  const goNext = () => {
    if (!canGoNext) {
      return;
    }
    setAnchorDate(nextPeriodStart(period, { startDate, endDate }));
  };

  return (
    <AppGradient>
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Go back"
              hitSlop={12}
              onPress={goBack}
              style={({ pressed }) => pressed && styles.pressed}>
              <AppIcon name="back" size={24} color="#FFFFFF" />
            </Pressable>
            <ThemedText style={styles.title}>Listening</ThemedText>
          </View>

          <View style={styles.pills}>
            {PERIODS.map((option) => {
              const active = option.key === period;
              return (
                <Pressable
                  key={option.key}
                  accessibilityRole="button"
                  accessibilityLabel={`Show ${option.label.toLowerCase()} listening`}
                  accessibilityState={{ selected: active }}
                  onPress={() => setPeriod(option.key)}
                  style={({ pressed }) => [
                    styles.pill,
                    { backgroundColor: active ? theme.accent : theme.surfaceRaised },
                    pressed && styles.pressed,
                  ]}>
                  <ThemedText style={[styles.pillText, active && styles.pillTextActive]}>{option.label}</ThemedText>
                </Pressable>
              );
            })}
          </View>

          <View style={[styles.rangeCard, { backgroundColor: theme.surfaceRaised }]}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Previous period"
              hitSlop={10}
              onPress={goPrevious}
              style={({ pressed }) => [styles.rangeArrow, pressed && styles.pressed]}>
              <AppIcon name="chevronLeft" size={22} color={theme.textMuted} />
            </Pressable>
            <View style={styles.rangeCopy}>
              <ThemedText style={styles.rangeLabel}>{rangeLabel}</ThemedText>
              {period !== 'day' && (
                <ThemedText style={styles.rangeSub}>
                  {formatDateKeyLabel(startDate)} – {formatDateKeyLabel(endDate)}
                </ThemedText>
              )}
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Next period"
              accessibilityState={{ disabled: !canGoNext }}
              disabled={!canGoNext}
              hitSlop={10}
              onPress={goNext}
              style={({ pressed }) => [styles.rangeArrow, pressed && styles.pressed]}>
              <AppIcon name="chevronRight" size={22} color={canGoNext ? theme.textMuted : '#4D4D4D'} />
            </Pressable>
          </View>

          {history.loading ? (
            <View style={styles.loadingBlock}>
              <ActivityIndicator color={theme.accent} />
              <ThemedText themeColor="textMuted" style={styles.loadingText}>Reading listening history…</ThemedText>
            </View>
          ) : history.error ? (
            <Notice title="Stats unavailable" description={history.error}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Try loading listening history again"
                onPress={() => { void load(); }}
                style={({ pressed }) => [styles.retryButton, { backgroundColor: theme.accent }, pressed && styles.pressed]}>
                <ThemedText style={styles.retryText}>Try again</ThemedText>
              </Pressable>
            </Notice>
          ) : history.events.length === 0 ? (
            <Notice
              title={history.totalEvents === 0 ? 'No listening recorded yet' : 'No listening in this period'}
              description={
                history.totalEvents === 0
                  ? 'Play a track and let it run. Only audible time counts, and everything stays on this device.'
                  : history.earliestDate
                    ? `Your listening history starts on ${formatDateKeyLabel(history.earliestDate)}. Try another period.`
                    : 'Try another period.'
              }
            />
          ) : (
            <>
              {summary.hasQualifiedListening ? (
                <View style={styles.tiles}>
                  <SummaryTile label="Time listened" value={formatListeningDuration(summary.totalListenedMs)} detail="Audible time, partial plays included" />
                  <SummaryTile label="Plays" value={summary.qualifiedPlays.toString()} detail={`${summary.playbackStarts} playback start${summary.playbackStarts === 1 ? '' : 's'}`} />
                  <SummaryTile label="Tracks" value={summary.uniqueTracks.toString()} detail="Distinct qualified tracks" />
                  <SummaryTile label="Active days" value={summary.activeDays.toString()} detail={`of ${dayCount} day${dayCount === 1 ? '' : 's'}`} />
                </View>
              ) : (
                <View style={styles.tiles}>
                  <SummaryTile label="Time listened" value={formatListeningDuration(summary.totalListenedMs)} detail="Audible time, partial plays included" />
                  <SummaryTile label="Playback starts" value={summary.playbackStarts.toString()} detail="No qualified listens yet" />
                </View>
              )}

              {!summary.hasQualifiedListening ? (
                <Notice
                  title="No qualified listens in this period"
                  description={`${summary.playbackStarts} playback start${summary.playbackStarts === 1 ? '' : 's'} did not reach the listen rule. ${LISTEN_RULE_DESCRIPTION}`}
                />
              ) : (
                <>
                  <Section title="Top tracks" subtitle="By qualified plays">
                    {summary.topTracks.map((track, index) => (
                      <View key={track.trackId} style={[styles.rankRow, { backgroundColor: theme.surfaceRaised }]}>
                        <ThemedText style={[styles.rank, { color: theme.textMuted }]}>{index + 1}</ThemedText>
                        <View style={styles.rankCopy}>
                          <ThemedText numberOfLines={1} style={styles.rankTitle}>{track.title}</ThemedText>
                          <ThemedText numberOfLines={1} style={styles.rankSub}>{track.artist ?? 'Unknown artist'}</ThemedText>
                        </View>
                        <View style={styles.rankStats}>
                          <ThemedText style={styles.rankValue}>{track.plays} play{track.plays === 1 ? '' : 's'}</ThemedText>
                          <ThemedText style={[styles.rankDetail, { color: theme.textMuted }]}>{formatListeningDuration(track.listenedMs)}</ThemedText>
                        </View>
                      </View>
                    ))}
                  </Section>

                  {summary.topArtists.length > 0 && (
                    <Section title="Top artists" subtitle="By qualified plays">
                      {summary.topArtists.map((artist, index) => (
                        <View key={`${artist.artist ?? 'unknown'}-${index}`} style={[styles.rankRow, { backgroundColor: theme.surfaceRaised }]}>
                          <ThemedText style={[styles.rank, { color: theme.textMuted }]}>{index + 1}</ThemedText>
                          <ThemedText numberOfLines={1} style={[styles.rankTitle, styles.rankCopy]}>{artist.artist ?? 'Unknown artist'}</ThemedText>
                          <ThemedText style={styles.rankValue}>{artist.plays} play{artist.plays === 1 ? '' : 's'}</ThemedText>
                        </View>
                      ))}
                    </Section>
                  )}

                  <Section title="Daily listening" subtitle="Days with playback in this period">
                    {summary.daily.map((day) => {
                      const percent = maxDailyListenedMs > 0
                        ? Math.max(2, Math.round((day.listenedMs / maxDailyListenedMs) * 100))
                        : 0;
                      return (
                        <View
                          key={day.date}
                          accessibilityLabel={`${formatDateKeyLabel(day.date)}: ${formatListeningDuration(day.listenedMs)}, ${day.qualifiedPlays} qualified play${day.qualifiedPlays === 1 ? '' : 's'}`}
                          style={styles.dayRow}>
                          <ThemedText style={styles.dayLabel}>{formatDateKeyLabel(day.date)}</ThemedText>
                          <View style={[styles.dayTrack, { backgroundColor: theme.backgroundElement }]}>
                            <View style={[styles.dayBar, { width: `${percent}%` as `${number}%`, backgroundColor: theme.accent }]} />
                          </View>
                          <View style={styles.dayStats}>
                            <ThemedText style={styles.dayValue}>{formatListeningDuration(day.listenedMs)}</ThemedText>
                            <ThemedText style={[styles.dayDetail, { color: theme.textMuted }]}>{day.qualifiedPlays} play{day.qualifiedPlays === 1 ? '' : 's'}</ThemedText>
                          </View>
                        </View>
                      );
                    })}
                  </Section>
                </>
              )}
            </>
          )}

          <View style={[styles.ruleCard, { backgroundColor: theme.surfaceRaised }]}>
            <AppIcon name="chart" size={20} color={theme.accent} />
            <ThemedText style={styles.ruleText}>
              {LISTEN_RULE_DESCRIPTION} Only audible time counts, and days follow your device time zone at the moment you listened.
            </ThemedText>
          </View>
        </ScrollView>
      </SafeAreaView>
    </AppGradient>
  );
}

function Section({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <View>
        <ThemedText style={styles.sectionTitle}>{title}</ThemedText>
        <ThemedText style={styles.sectionSubtitle}>{subtitle}</ThemedText>
      </View>
      <View style={styles.rows}>{children}</View>
    </View>
  );
}

function SummaryTile({ label, value, detail }: { label: string; value: string; detail: string }) {
  const theme = useTheme();
  return (
    <View style={[styles.tile, { backgroundColor: theme.surfaceRaised }]}>
      <ThemedText style={[styles.tileLabel, { color: theme.textMuted }]}>{label.toUpperCase()}</ThemedText>
      <ThemedText style={styles.tileValue}>{value}</ThemedText>
      <ThemedText style={[styles.tileDetail, { color: theme.textMuted }]}>{detail}</ThemedText>
    </View>
  );
}

function Notice({ title, description, children }: { title: string; description: string; children?: React.ReactNode }) {
  const theme = useTheme();
  return (
    <View accessibilityRole="summary" style={[styles.notice, { backgroundColor: theme.surfaceRaised }]}>
      <ThemedText style={styles.noticeTitle}>{title}</ThemedText>
      <ThemedText style={[styles.noticeBody, { color: theme.textMuted }]}>{description}</ThemedText>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  content: { width: '100%', maxWidth: MaxContentWidth, alignSelf: 'center', padding: Spacing.three, paddingBottom: BottomTabInset + MiniPlayerInset + Spacing.four, gap: Spacing.three },
  header: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two, paddingTop: Spacing.one },
  title: { color: '#FFFFFF', fontSize: 30, fontWeight: '700', letterSpacing: -0.4 },
  pills: { flexDirection: 'row', gap: Spacing.one },
  pill: { flex: 1, minHeight: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },
  pillText: { fontSize: 13, fontWeight: '700' },
  pillTextActive: { color: '#000000' },
  rangeCard: { flexDirection: 'row', alignItems: 'center', borderRadius: 12, paddingHorizontal: Spacing.two, minHeight: 64 },
  rangeArrow: { width: 40, height: 44, alignItems: 'center', justifyContent: 'center' },
  rangeCopy: { flex: 1, alignItems: 'center', gap: 2 },
  rangeLabel: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' },
  rangeSub: { color: '#B3B3B3', fontSize: 11, lineHeight: 15 },
  loadingBlock: { alignItems: 'center', gap: Spacing.two, paddingVertical: Spacing.five },
  loadingText: { fontSize: 13 },
  tiles: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two },
  tile: { flexGrow: 1, flexBasis: '47%', borderRadius: 12, padding: Spacing.three, gap: 2 },
  tileLabel: { fontSize: 10, fontWeight: '800', letterSpacing: 1.1 },
  tileValue: { color: '#FFFFFF', fontSize: 26, fontWeight: '800', letterSpacing: -0.5 },
  tileDetail: { fontSize: 11, lineHeight: 15 },
  section: { gap: Spacing.two },
  sectionTitle: { color: '#FFFFFF', fontSize: 19, fontWeight: '800' },
  sectionSubtitle: { color: '#B3B3B3', fontSize: 12, lineHeight: 17 },
  rows: { gap: 1, overflow: 'hidden', borderRadius: 12 },
  rankRow: { minHeight: 56, flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.three, gap: Spacing.two },
  rank: { width: 18, fontSize: 13, fontWeight: '700' },
  rankCopy: { flex: 1, gap: 1 },
  rankTitle: { color: '#FFFFFF', fontSize: 14, fontWeight: '600' },
  rankSub: { color: '#B3B3B3', fontSize: 12 },
  rankStats: { alignItems: 'flex-end', gap: 1 },
  rankValue: { color: '#FFFFFF', fontSize: 12, fontWeight: '700' },
  rankDetail: { fontSize: 11 },
  dayRow: { minHeight: 46, flexDirection: 'row', alignItems: 'center', gap: Spacing.two, paddingHorizontal: Spacing.two },
  dayLabel: { width: 96, color: '#FFFFFF', fontSize: 12 },
  dayTrack: { flex: 1, height: 6, borderRadius: 3, overflow: 'hidden' },
  dayBar: { height: 6, borderRadius: 3 },
  dayStats: { width: 88, alignItems: 'flex-end', gap: 1 },
  dayValue: { color: '#FFFFFF', fontSize: 12, fontWeight: '600' },
  dayDetail: { fontSize: 10 },
  notice: { borderRadius: 12, padding: Spacing.three, gap: Spacing.two },
  noticeTitle: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
  noticeBody: { fontSize: 13, lineHeight: 19 },
  retryButton: { alignSelf: 'flex-start', borderRadius: 20, paddingHorizontal: Spacing.three, paddingVertical: 8 },
  retryText: { color: '#000000', fontSize: 13, fontWeight: '800' },
  ruleCard: { flexDirection: 'row', gap: Spacing.two, borderRadius: 12, padding: Spacing.three, alignItems: 'flex-start' },
  ruleText: { flex: 1, color: '#B3B3B3', fontSize: 12, lineHeight: 18 },
  pressed: { opacity: 0.68 },
});
