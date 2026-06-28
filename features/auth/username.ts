import { supabase } from '@/lib/supabase';

/** Letters, numbers, and underscore; 3–12 chars. Mirrors the DB CHECK constraint. */
export const USERNAME_REGEX = /^[A-Za-z0-9_]+$/;
export const USERNAME_MIN = 3;
export const USERNAME_MAX = 12;

/** Returns an error message for an invalid username, or null if it's valid. */
export function validateUsername(raw: string): string | null {
  const username = raw.trim();
  if (username.length < USERNAME_MIN) return `At least ${USERNAME_MIN} characters`;
  if (username.length > USERNAME_MAX) return `At most ${USERNAME_MAX} characters`;
  if (!USERNAME_REGEX.test(username)) return 'Letters, numbers, and _ only';
  return null;
}

/**
 * Checks whether a username is free. The DB unique index is the source of truth
 * (handled on insert); this is just for live UI feedback. `profiles.username` is
 * citext, so the equality match is case-insensitive.
 */
export async function isUsernameAvailable(username: string): Promise<boolean> {
  const { data, error } = await supabase
    .from('profiles')
    .select('id')
    .eq('username', username.trim())
    .maybeSingle();
  if (error) throw error;
  return data == null;
}
