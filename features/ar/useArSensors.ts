import * as Location from 'expo-location';
import { DeviceMotion } from 'expo-sensors';
import { useEffect, useRef, useState } from 'react';

import { lowPass, lowPassAngle } from '@/lib/geo';

export type Pose = {
  /** Compass heading the camera points at (deg from true north). */
  heading: number;
  /** Phone pitch (deg; 0 = upright facing the horizon, + = tilted up). */
  pitch: number;
};

/**
 * Fuses the compass (heading) and device motion (pitch) into a smoothed pose for
 * placing pins. Low-pass filtered to cut jitter. Only runs while `active`.
 * NOTE: pitch/heading need on-device tuning — the simulator has no real sensors.
 */
export function useArSensors(active: boolean): Pose {
  const [pose, setPose] = useState<Pose>({ heading: 0, pitch: 0 });
  const headingRef = useRef(0);
  const pitchRef = useRef(0);

  useEffect(() => {
    if (!active) return;
    let headingSub: Location.LocationSubscription | undefined;
    let motionSub: { remove: () => void } | undefined;
    let cancelled = false;

    (async () => {
      try {
        headingSub = await Location.watchHeadingAsync((h) => {
          if (cancelled) return;
          // trueHeading needs location services; fall back to magnetic heading.
          const deg = h.trueHeading >= 0 ? h.trueHeading : h.magHeading;
          headingRef.current = lowPassAngle(headingRef.current, deg, 0.15);
          setPose((p) => ({ ...p, heading: headingRef.current }));
        });
      } catch {
        // Compass unavailable (e.g. the simulator) — heading stays at 0.
      }
    })();

    DeviceMotion.setUpdateInterval(100);
    motionSub = DeviceMotion.addListener((data) => {
      if (cancelled || !data.rotation) return;
      // rotation.beta (rad): ~π/2 when the phone is held upright. Normalize so
      // upright-facing-horizon = 0°.
      const pitchDeg = (data.rotation.beta * 180) / Math.PI - 90;
      pitchRef.current = lowPass(pitchRef.current, pitchDeg, 0.2);
      setPose((p) => ({ ...p, pitch: pitchRef.current }));
    });

    return () => {
      cancelled = true;
      headingSub?.remove();
      motionSub?.remove();
    };
  }, [active]);

  return pose;
}
