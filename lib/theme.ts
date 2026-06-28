// Dark, camera-first palette for the app shell. The auth flow uses its own
// light palette (features/auth/ui.tsx); this is the post-login experience.
export const colors = {
  bg: '#0b0b0f', // near-black app background (the camera lives here in P4)
  surface: 'rgba(30,30,38,0.72)', // translucent surface — blur swaps in at P4
  surfaceSolid: '#16161c',
  elevated: 'rgba(255,255,255,0.06)',
  border: 'rgba(255,255,255,0.10)',
  text: '#f5f5f7',
  textDim: 'rgba(245,245,247,0.62)',
  textFaint: 'rgba(245,245,247,0.38)',
  accent: '#fcd34d', // warm yellow — active highlight (iOS-Camera vibe)
  danger: '#ff453a',
  white: '#ffffff',
} as const;

export const radius = { sm: 12, md: 16, lg: 20, pill: 999 } as const;
