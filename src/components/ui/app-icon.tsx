import { SymbolView } from 'expo-symbols';
import type { ComponentProps } from 'react';

type SymbolName = ComponentProps<typeof SymbolView>['name'];

const symbols = {
  album: { ios: 'music.note.list', android: 'album', web: 'album' },
  back: { ios: 'arrow.left', android: 'arrow_back', web: 'arrow_back' },
  chevronDown: { ios: 'chevron.down', android: 'keyboard_arrow_down', web: 'keyboard_arrow_down' },
  chevronRight: { ios: 'chevron.right', android: 'chevron_right', web: 'chevron_right' },
  favorite: { ios: 'heart.fill', android: 'favorite', web: 'favorite' },
  favoriteOutline: { ios: 'heart', android: 'favorite_border', web: 'favorite_border' },
  library: { ios: 'music.note.list', android: 'library_music', web: 'library_music' },
  more: { ios: 'ellipsis', android: 'more_vert', web: 'more_vert' },
  music: { ios: 'music.note', android: 'music_note', web: 'music_note' },
  next: { ios: 'forward.fill', android: 'skip_next', web: 'skip_next' },
  pause: { ios: 'pause.fill', android: 'pause', web: 'pause' },
  play: { ios: 'play.fill', android: 'play_arrow', web: 'play_arrow' },
  previous: { ios: 'backward.fill', android: 'skip_previous', web: 'skip_previous' },
  refresh: { ios: 'arrow.clockwise', android: 'refresh', web: 'refresh' },
  repeat: { ios: 'repeat', android: 'repeat', web: 'repeat' },
  repeatOne: { ios: 'repeat.1', android: 'repeat_one', web: 'repeat_one' },
  search: { ios: 'magnifyingglass', android: 'search', web: 'search' },
  settings: { ios: 'gearshape', android: 'settings', web: 'settings' },
  shuffle: { ios: 'shuffle', android: 'shuffle', web: 'shuffle' },
} as const satisfies Record<string, SymbolName>;

export type AppIconName = keyof typeof symbols;

type AppIconProps = {
  name: AppIconName;
  size?: number;
  color: string;
};

/** Cross-platform native icon with an SF Symbol on iOS and Material Symbol elsewhere. */
export function AppIcon({ name, size = 24, color }: AppIconProps) {
  return <SymbolView accessible={false} name={symbols[name]} size={size} tintColor={color} />;
}
