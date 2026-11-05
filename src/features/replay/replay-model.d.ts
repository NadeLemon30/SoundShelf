import type { ArtistListening, DailyListening, ListeningSummary, TrackListening } from '@/features/analytics/listening-model';

export const REPLAY_PERIOD: 'year';
export const REPLAY_MIN_QUALIFIED_PLAYS: number;
export const REPLAY_MIN_ACTIVE_DAYS: number;
export const REPLAY_MIN_LISTENED_MS: number;
export const REPLAY_ELIGIBILITY_DESCRIPTION: string;

export type ReplayEligibility = {
  eligible: boolean;
  year: number;
  qualifiedPlays: number;
  activeDays: number;
  totalListenedMs: number;
  reasons: string[];
};

export type ReplayStory = {
  eligible: true;
  year: number;
  label: string;
  qualifiedPlays: number;
  playbackStarts: number;
  totalListenedMs: number;
  uniqueTracks: number;
  activeDays: number;
  biggestDay: DailyListening | null;
  topTrack: TrackListening | null;
  topArtist: ArtistListening | null;
  topTracks: TrackListening[];
  topArtists: ArtistListening[];
};

export function evaluateReplayEligibility(summary: ListeningSummary, year: number): ReplayEligibility;
export function buildReplayStory(summary: ListeningSummary, year: number): ReplayStory | null;
