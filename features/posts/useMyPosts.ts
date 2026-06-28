import { useCallback, useEffect, useState } from 'react';

import { emitPostsChanged, onPostsChanged } from '@/features/posts/refreshBus';
import { supabase } from '@/lib/supabase';

export type MyPost = {
  id: string;
  type: 'text' | 'photo' | 'video';
  body: string | null;
  media_path: string | null;
  like_count: number;
  created_at: string;
};

/** The signed-in user's own posts, newest first, with hard-delete (row + media). */
export function useMyPosts(userId: string | undefined) {
  const [posts, setPosts] = useState<MyPost[]>([]);
  const [loading, setLoading] = useState(false);

  const refetch = useCallback(async () => {
    if (!userId) {
      setPosts([]);
      return;
    }
    setLoading(true);
    const { data, error } = await supabase
      .from('posts')
      .select('id, type, body, media_path, like_count, created_at')
      .eq('author_id', userId)
      .order('created_at', { ascending: false });
    setLoading(false);
    if (!error) setPosts((data as MyPost[]) ?? []);
  }, [userId]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  // Stay in sync when a post is created/deleted elsewhere.
  useEffect(() => onPostsChanged(refetch), [refetch]);

  const remove = useCallback(
    async (post: MyPost) => {
      setPosts((prev) => prev.filter((p) => p.id !== post.id)); // optimistic
      if (post.media_path) {
        // Best-effort: orphaned media is harmless if this fails.
        await supabase.storage.from('post-media').remove([post.media_path]);
      }
      const { error } = await supabase.from('posts').delete().eq('id', post.id);
      if (error) {
        refetch(); // revert optimistic removal
        throw error;
      }
      emitPostsChanged(); // drop it from the AR feed too
    },
    [refetch],
  );

  return { posts, loading, refetch, remove };
}
