/**
 * BrandLogos — SVG brand marks drawn from scratch.
 * No image assets required. Each is a stylised representation
 * using the brand's official colours and a recognisable shape.
 *
 * We do NOT reproduce exact trademarked logo paths.
 * Each mark is an original geometric interpretation.
 */
import React from 'react';
import Svg, { Path, Rect, Circle, Polygon, G, Ellipse } from 'react-native-svg';

// ── Strava ────────────────────────────────────────────────────────────────────
// Orange rounded-square + white double-mountain chevron (Strava's iconic shape)
export function StravaLogo({ size = 44 }: { size?: number }) {
  const r = size * 0.2;
  return (
    <Svg width={size} height={size} viewBox="0 0 44 44">
      <Rect width="44" height="44" rx={r} fill="#FC4C02" />
      {/* Double-peak mountain chevron — Strava's mountain icon */}
      <Path
        d="M 8 34 L 17 14 L 22 24 L 27 14 L 36 34"
        stroke="white"
        strokeWidth="4"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </Svg>
  );
}

// ── Apple Health ──────────────────────────────────────────────────────────────
// Gradient pink/red square + white heart
export function AppleHealthLogo({ size = 44 }: { size?: number }) {
  const r = size * 0.2;
  return (
    <Svg width={size} height={size} viewBox="0 0 44 44">
      <Rect width="44" height="44" rx={r} fill="#FF2D55" />
      {/* Heart path */}
      <Path
        d="M 22 33
           C 22 33 8 23 8 15
           C 8 10 12 7 16 7
           C 19 7 22 10 22 10
           C 22 10 25 7 28 7
           C 32 7 36 10 36 15
           C 36 23 22 33 22 33 Z"
        fill="white"
      />
    </Svg>
  );
}

// ── Apple Watch ───────────────────────────────────────────────────────────────
// Near-black rounded rectangle + minimal watch face
export function AppleWatchLogo({ size = 44 }: { size?: number }) {
  const r = size * 0.2;
  return (
    <Svg width={size} height={size} viewBox="0 0 44 44">
      <Rect width="44" height="44" rx={r} fill="#1C1C1E" />
      {/* Watch body */}
      <Rect x="13" y="9" width="18" height="26" rx="6" fill="none" stroke="white" strokeWidth="2.5" />
      {/* Crown/button */}
      <Rect x="30" y="17" width="3" height="6" rx="1.5" fill="white" />
      {/* Watch face — digital crown + time indicators */}
      <Circle cx="22" cy="22" r="7" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="1" />
      {/* Hour hand */}
      <Path d="M 22 22 L 22 17" stroke="white" strokeWidth="2" strokeLinecap="round" />
      {/* Minute hand */}
      <Path d="M 22 22 L 25.5 22" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
    </Svg>
  );
}

// ── Garmin ────────────────────────────────────────────────────────────────────
// Garmin blue + bold G letterform
export function GarminLogo({ size = 44 }: { size?: number }) {
  const r = size * 0.2;
  return (
    <Svg width={size} height={size} viewBox="0 0 44 44">
      <Rect width="44" height="44" rx={r} fill="#007CC3" />
      {/* Bold G — Garmin-style */}
      <Path
        d="M 32 18
           C 30 11 24 8 18 10
           C 12 12 9 18 10 24
           C 11 30 17 35 24 34
           C 29 33 33 29 33 24
           L 24 24 L 24 29 L 27 29"
        stroke="white"
        strokeWidth="3.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </Svg>
  );
}

// ── Generic Integration placeholder (purple, for future use) ──────────────────
export function IntegrationLogo({
  size = 44,
  color = '#6D28D9',
  letter = '?',
}: {
  size?: number;
  color?: string;
  letter?: string;
}) {
  const r = size * 0.2;
  return (
    <Svg width={size} height={size} viewBox="0 0 44 44">
      <Rect width="44" height="44" rx={r} fill={color} />
    </Svg>
  );
}
