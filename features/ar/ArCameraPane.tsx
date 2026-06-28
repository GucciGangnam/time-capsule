import { CameraView, useCameraPermissions } from 'expo-camera';
import { router, useFocusEffect } from 'expo-router';
import * as Location from 'expo-location';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Linking,
  Pressable,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Surface } from '@/components/Surface';
import { useAuth } from '@/features/auth/AuthProvider';
import { Pin } from '@/features/ar/Pin';
import { PostDetailSheet } from '@/features/ar/PostDetailSheet';
import { useArSensors } from '@/features/ar/useArSensors';
import { onPostsChanged } from '@/features/posts/refreshBus';
import { usePostsWithinRadius } from '@/features/posts/usePostsWithinRadius';
import { projectPost } from '@/lib/geo';
import { colors, radius } from '@/lib/theme';

type Coords = { lat: number; lng: number; accuracy: number | null };

export function ArCameraPane({ active }: { active: boolean }) {
  const [camPerm, requestCam] = useCameraPermissions();
  const [locPerm, requestLoc] = Location.useForegroundPermissions();

  // Ask for permissions the first time the camera pane is focused.
  useEffect(() => {
    if (!active) return;
    if (camPerm && !camPerm.granted && camPerm.canAskAgain) requestCam();
    if (locPerm && !locPerm.granted && locPerm.canAskAgain) requestLoc();
  }, [active, camPerm, locPerm, requestCam, requestLoc]);

  if (!camPerm || !locPerm) return <View style={styles.root} />;

  if (!locPerm.granted) {
    return (
      <Gate
        title="Location needed"
        body="Time Capsule pins capsules to your exact spot. Allow location to start discovering them."
        cta={locPerm.canAskAgain ? 'Allow location' : 'Open Settings'}
        onPress={() => (locPerm.canAskAgain ? requestLoc() : Linking.openSettings())}
      />
    );
  }
  if (!camPerm.granted) {
    return (
      <Gate
        title="Camera needed"
        body="The AR view uses your camera to show capsules floating in the world around you."
        cta={camPerm.canAskAgain ? 'Allow camera' : 'Open Settings'}
        onPress={() => (camPerm.canAskAgain ? requestCam() : Linking.openSettings())}
      />
    );
  }

  return <ArView active={active} />;
}

/** Rendered only once both permissions are granted, so the AR hooks below run
 *  unconditionally (Rules of Hooks). */
function ArView({ active }: { active: boolean }) {
  const { session } = useAuth();
  const uid = session?.user?.id;
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const pose = useArSensors(active);
  const [coords, setCoords] = useState<Coords | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // Watch position while focused (refetch happens as the user moves >10 m).
  useEffect(() => {
    if (!active) return;
    let sub: Location.LocationSubscription | undefined;
    (async () => {
      sub = await Location.watchPositionAsync(
        { accuracy: Location.Accuracy.High, distanceInterval: 10 },
        (pos) =>
          setCoords({
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
            accuracy: pos.coords.accuracy,
          }),
      );
    })();
    return () => sub?.remove();
  }, [active]);

  const userLoc = useMemo(
    () => (coords ? { lat: coords.lat, lng: coords.lng } : null),
    [coords?.lat, coords?.lng],
  );
  const { posts, toggleLike, refetch } = usePostsWithinRadius(userLoc);

  // Refetch when the screen regains focus (e.g. after creating a post).
  useFocusEffect(
    useCallback(() => {
      refetch();
    }, [refetch]),
  );

  // Reliable refresh after creating a post (modal focus effects don't re-fire).
  useEffect(() => onPostsChanged(refetch), [refetch]);

  const selected = posts.find((p) => p.id === selectedId) ?? null;
  const size = { width, height };

  return (
    <View style={styles.root}>
      {active ? <CameraView style={StyleSheet.absoluteFill} facing="back" /> : null}

      {/* Projected pins */}
      {posts.map((post) => {
        // null bearing = post is at the exact same spot → treat as dead-ahead.
        const bearing = post.bearing_deg ?? pose.heading;
        const projection = projectPost(bearing, pose.heading, pose.pitch, size);
        return (
          <Pin
            key={post.id}
            post={post}
            projection={projection}
            onPress={() => setSelectedId(post.id)}
          />
        );
      })}

      <View style={[styles.fabWrap, { bottom: insets.bottom + 80 }]} pointerEvents="box-none">
        {coords ? (
          <Pressable
            style={({ pressed }) => [styles.fab, pressed && { opacity: 0.85 }]}
            onPress={() =>
              router.push({
                pathname: '/(app)/create',
                params: { lat: coords.lat, lng: coords.lng },
              })
            }>
            <Text style={styles.fabPlus}>+</Text>
          </Pressable>
        ) : null}
      </View>

      <Hud coords={coords} count={posts.length} />

      {selected ? (
        <PostDetailSheet
          post={selected}
          onClose={() => setSelectedId(null)}
          onToggleLike={() => uid && toggleLike(selected, uid)}
        />
      ) : null}
    </View>
  );
}

function Hud({ coords, count }: { coords: Coords | null; count: number }) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.hudTop, { paddingTop: insets.top + 10 }]} pointerEvents="box-none">
      <Surface rounded="pill" style={styles.hudPill}>
        <Text style={styles.hudText}>
          {coords
            ? `\u{1F4CD} ${coords.lat.toFixed(5)}, ${coords.lng.toFixed(5)}` +
              (coords.accuracy != null ? `  ±${Math.round(coords.accuracy)}m` : '')
            : 'Locating…'}
        </Text>
      </Surface>
      <Surface rounded="pill" style={styles.countPill}>
        <Text style={styles.hudText}>
          {count > 0 ? `${count} nearby` : 'No capsules within 30 m'}
        </Text>
      </Surface>
    </View>
  );
}

function Gate({
  title,
  body,
  cta,
  onPress,
}: {
  title: string;
  body: string;
  cta: string;
  onPress: () => void;
}) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.root, styles.gate, { paddingTop: insets.top }]}>
      <View style={styles.reticle}>
        <View style={styles.reticleDot} />
      </View>
      <Text style={styles.gateTitle}>{title}</Text>
      <Text style={styles.gateBody}>{body}</Text>
      <Pressable
        style={({ pressed }) => [styles.gateBtn, pressed && { opacity: 0.85 }]}
        onPress={onPress}>
        <Text style={styles.gateBtnText}>{cta}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  hudTop: { position: 'absolute', top: 0, left: 0, right: 0, alignItems: 'center', gap: 8 },
  hudPill: { paddingHorizontal: 16, paddingVertical: 8 },
  countPill: { paddingHorizontal: 12, paddingVertical: 5 },
  hudText: { color: colors.text, fontSize: 13, fontWeight: '600' },

  fabWrap: { position: 'absolute', left: 0, right: 0, alignItems: 'center' },
  fab: {
    width: 62,
    height: 62,
    borderRadius: 31,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
  },
  fabPlus: { color: colors.bg, fontSize: 34, fontWeight: '300', lineHeight: 38, marginTop: -2 },

  gate: { alignItems: 'center', justifyContent: 'center', paddingHorizontal: 36, gap: 12 },
  reticle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  reticleDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.accent },
  gateTitle: { color: colors.text, fontSize: 24, fontWeight: '800', letterSpacing: -0.4 },
  gateBody: { color: colors.textDim, fontSize: 15, textAlign: 'center', lineHeight: 21 },
  gateBtn: {
    marginTop: 14,
    backgroundColor: colors.white,
    paddingHorizontal: 24,
    height: 50,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gateBtnText: { color: colors.bg, fontSize: 16, fontWeight: '700' },
});
