import type { Session } from '@supabase/supabase-js';
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

import { supabase } from '@/lib/supabase';

export type Profile = {
  id: string;
  username: string;
  created_at: string;
};

type AuthContextValue = {
  /** True until the initial session + profile load resolves. */
  initializing: boolean;
  session: Session | null;
  /** The user's profile row, or null if they haven't onboarded yet. */
  profile: Profile | null;
  signOut: () => Promise<void>;
  /** Set the profile locally (e.g. right after the onboarding insert). */
  setLocalProfile: (profile: Profile) => void;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [sessionReady, setSessionReady] = useState(false);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [profileReady, setProfileReady] = useState(false);

  // Track the auth session. We only set state inside onAuthStateChange (no other
  // Supabase calls there — doing so can deadlock the client) and react to id
  // changes in a separate effect below.
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setSessionReady(true);
    });
    const { data } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
    });
    return () => data.subscription.unsubscribe();
  }, []);

  // Load the profile row whenever the signed-in user changes.
  const userId = session?.user?.id;
  useEffect(() => {
    if (!userId) {
      setProfile(null);
      setProfileReady(true);
      return;
    }
    let active = true;
    setProfileReady(false);
    (async () => {
      try {
        const { data } = await supabase
          .from('profiles')
          .select('id, username, created_at')
          .eq('id', userId)
          .maybeSingle();
        if (active) setProfile((data as Profile | null) ?? null);
      } catch {
        if (active) setProfile(null);
      } finally {
        if (active) setProfileReady(true);
      }
    })();
    return () => {
      active = false;
    };
  }, [userId]);

  const value = useMemo<AuthContextValue>(
    () => ({
      initializing: !sessionReady || !profileReady,
      session,
      profile,
      signOut: async () => {
        await supabase.auth.signOut();
      },
      setLocalProfile: setProfile,
    }),
    [sessionReady, profileReady, session, profile],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
