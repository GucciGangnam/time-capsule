import { useRef, useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  View,
  useWindowDimensions,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ArCameraPane } from '@/features/ar/ArCameraPane';
import { MyPostsPane } from '@/features/posts/MyPostsPane';
import { SettingsPane } from '@/features/settings/SettingsPane';
import { ModeStrip } from '@/features/shell/ModeStrip';
import { colors } from '@/lib/theme';

const CENTER = 1; // AR camera is the default, centered pane

/** The 3-pane horizontal swipe shell: My Posts ⟷ AR Camera ⟷ Settings,
 *  mirroring the iOS-Camera mode switch. A plain paging ScrollView keeps this
 *  pure-JS (no native pager dep). */
export function AppShell() {
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const scrollRef = useRef<ScrollView>(null);
  const [index, setIndex] = useState(CENTER);

  function goTo(i: number) {
    scrollRef.current?.scrollTo({ x: i * width, animated: true });
    setIndex(i);
  }

  function onScroll(e: NativeSyntheticEvent<NativeScrollEvent>) {
    const i = Math.round(e.nativeEvent.contentOffset.x / width);
    if (i !== index) setIndex(i);
  }

  return (
    <View style={styles.root}>
      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        contentOffset={{ x: CENTER * width, y: 0 }}
        onScroll={onScroll}
        scrollEventThrottle={16}>
        <View style={{ width }}>
          <MyPostsPane active={index === 0} />
        </View>
        <View style={{ width }}>
          <ArCameraPane active={index === 1} />
        </View>
        <View style={{ width }}>
          <SettingsPane active={index === 2} />
        </View>
      </ScrollView>

      <View style={[styles.strip, { paddingBottom: insets.bottom + 10 }]} pointerEvents="box-none">
        <ModeStrip index={index} onSelect={goTo} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  strip: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
});
