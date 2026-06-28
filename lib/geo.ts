// Sensor-overlay AR math. No ARKit world anchoring — pins are placed purely from
// GPS distance + bearing and the phone's compass heading / pitch.

export type LatLng = { lat: number; lng: number };

const EARTH_R = 6371000; // meters
const toRad = (d: number) => (d * Math.PI) / 180;
const toDeg = (r: number) => (r * 180) / Math.PI;

/** Great-circle distance in meters (haversine). */
export function distanceMeters(a: LatLng, b: LatLng): number {
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_R * Math.asin(Math.min(1, Math.sqrt(h)));
}

/** Initial bearing from `a` to `b`, degrees clockwise from true north, [0,360). */
export function bearingDegrees(a: LatLng, b: LatLng): number {
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const dLng = toRad(b.lng - a.lng);
  const y = Math.sin(dLng) * Math.cos(lat2);
  const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLng);
  return (toDeg(Math.atan2(y, x)) + 360) % 360;
}

/** Smallest signed difference `a - b` in degrees, in (-180, 180]. */
export function angleDelta(a: number, b: number): number {
  return ((a - b + 540) % 360) - 180;
}

/** Low-pass filter for a scalar. `alpha` in [0,1] = weight of the new sample. */
export function lowPass(prev: number, next: number, alpha: number): number {
  return prev + alpha * (next - prev);
}

/** Low-pass for an angle in degrees, handling the 0/360 wraparound. */
export function lowPassAngle(prev: number, next: number, alpha: number): number {
  return (prev + alpha * angleDelta(next, prev) + 360) % 360;
}

export type Projection = {
  /** x,y in overlay pixels (may be off-screen). */
  x: number;
  y: number;
  /** Whether the post falls within the horizontal field of view. */
  onScreen: boolean;
  /** When off-screen, which edge to show an arrow on. */
  edge: 'left' | 'right' | null;
};

/**
 * Project a post onto the camera overlay from its bearing and the device pose.
 * Ground-level posts are treated as sitting on the horizon, whose on-screen Y
 * shifts with the phone's pitch. Tunable against real sensor data in wiring.
 *
 * @param postBearing bearing user→post (deg from true north)
 * @param heading     device heading (deg from true north; where the camera points)
 * @param pitchDeg    device pitch (deg; 0 = upright facing horizon, + = tilted up)
 * @param size        overlay {width,height} in px
 * @param hFov        horizontal field of view (deg)
 * @param vFov        vertical field of view (deg)
 */
export function projectPost(
  postBearing: number,
  heading: number,
  pitchDeg: number,
  size: { width: number; height: number },
  hFov = 60,
  vFov = 90,
): Projection {
  const dx = angleDelta(postBearing, heading); // 0 = dead ahead, + = to the right
  const halfH = hFov / 2;
  const onScreen = Math.abs(dx) <= halfH;
  const x = size.width / 2 + (dx / halfH) * (size.width / 2);
  // Horizon Y tracks pitch: looking up (pitch+) pushes the horizon down-screen.
  const halfV = vFov / 2;
  const y = size.height / 2 + (pitchDeg / halfV) * (size.height / 2);
  const edge = onScreen ? null : dx < 0 ? 'left' : 'right';
  return { x, y, onScreen, edge };
}

/** Map distance (m) to a pin scale in [min,1], nearer = bigger. */
export function distanceScale(distanceM: number, radiusM = 30, min = 0.55): number {
  const t = Math.min(1, Math.max(0, distanceM / radiusM));
  return 1 - (1 - min) * t;
}
