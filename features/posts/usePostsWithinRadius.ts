import { useCallback, useEffect, useState } from 'react';

import type { Database } from '@/lib/database.types';
import { supabase } from '@/lib/supabase';

export type NearbyPost =
  Database['public']['Functions']['posts_within_radius']['Returns'][number];

/**
 * Fetches posts within `radiusM` of the given location via the RPC. Refetches
 * whenever the location changes — the caller's watch only emits every >10 m, so
 * this matches the plan's "refetch on focus and on >10 m move".
 */
export function usePostsWithinRadius(
  coords: { lat: number; lng: number } | null,
  radiusM = 30,
) {
  const [posts, setPosts] = useState<NearbyPost[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchNow = useCallback(
    async (lat: number, lng: number) => {
      setLoading(true);
      const { data, error } = await supabase.rpc('posts_within_radius', {
        lat,
        lng,
        radius_m: radiusM,
      });
      setLoading(false);
      if (error) {
        setError(error.message);
        return;
      }
      setError(null);
      setPosts(data ?? []);
    },
    [radiusM],
  );

  useEffect(() => {
    if (!coords) return;
    fetchNow(coords.lat, coords.lng);
  }, [coords?.lat, coords?.lng, fetchNow]);

  const refetch = useCallback(() => {
    if (coords) fetchNow(coords.lat, coords.lng);
  }, [coords, fetchNow]);

  /** Optimistically toggle a like, reverting if the write fails. */
  const toggleLike = useCallback(async (post: NearbyPost, userId: string) => {
    const liked = post.liked_by_me;
    const apply = (on: boolean) =>
      setPosts((prev) =>
        prev.map((p) =>
          p.id === post.id
            ? { ...p, liked_by_me: on, like_count: p.like_count + (on ? 1 : -1) }
            : p,
        ),
      );
    apply(!liked);
    const { error } = liked
      ? await supabase.from('post_likes').delete().eq('post_id', post.id).eq('user_id', userId)
      : await supabase.from('post_likes').insert({ post_id: post.id, user_id: userId });
    if (error) apply(liked); // revert
  }, []);

  return { posts, loading, error, refetch, toggleLike };
}
