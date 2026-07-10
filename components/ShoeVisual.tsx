/**
 * SHOE VISUAL — Generative clay-3D shoe render.
 *
 * Every shoe in the database gets a unique, procedurally-generated side
 * profile built from its REAL specs:
 *   - heel / forefoot stack height  → midsole geometry
 *   - drop                          → heel-to-toe slope
 *   - rocker                        → toe spring curve
 *   - cushioning level              → sidewall bulge
 *   - brand                         → color system
 *   - model id hash                 → per-model hue variation
 *
 * And it AGES. Pass `wearPct` (0–100) and the foam visibly compresses,
 * compression creases appear in the sidewall, the outsole tread wears
 * away at strike zones, the upper fades, and scuffs accumulate.
 *
 * Style: soft clay / Spline-3D — radial highlights, soft ground shadow,
 * no hard outlines.
 */
import React, { useEffect, useRef } from 'react';
import { Animated, Easing, View } from 'react-native';
import Svg, {
  Path, Ellipse, Rect, Defs, LinearGradient, RadialGradient, Stop, G, Line,
} from 'react-native-svg';
import { Shoe } from '../app/data/shoes';

// ── Brand color systems (primary upper, accent, laces) ─────────────────────
interface BrandPalette { upper: string; accent: string; dark: string }

const BRAND_PALETTES: Record<string, BrandPalette> = {
  'Brooks':      { upper: '#2E5FDB', accent: '#8FD14F', dark: '#1B3B8F' },
  'HOKA':        { upper: '#F26B3A', accent: '#57C4E5', dark: '#B3441E' },
  'ASICS':       { upper: '#2B4FA8', accent: '#E8474B', dark: '#1A3272' },
  'Saucony':     { upper: '#1E8A6E', accent: '#F5A623', dark: '#125844' },
  'New Balance': { upper: '#6E7480', accent: '#D93A3A', dark: '#454A54' },
  'On':          { upper: '#E8E5DE', accent: '#111111', dark: '#B9B5AC' },
  'Mizuno':      { upper: '#1C6FB8', accent: '#57D0C6', dark: '#124878' },
  'Altra':       { upper: '#0F8B8D', accent: '#EC5B39', dark: '#0A5C5E' },
  'Topo':        { upper: '#77803C', accent: '#F08A3C', dark: '#4C5226' },
  'PUMA':        { upper: '#1A1A1A', accent: '#F0DB2E', dark: '#000000' },
  'Salomon':     { upper: '#232830', accent: '#E23636', dark: '#101318' },
};
const DEFAULT_PALETTE: BrandPalette = { upper: '#3A3F4A', accent: '#FF3D00', dark: '#22252C' };

/** Primary brand color — used by RunnerLoop and other visuals */
export function getBrandColor(brand: string): string {
  return (BRAND_PALETTES[brand] ?? DEFAULT_PALETTE).upper;
}

// ── Helpers ─────────────────────────────────────────────────────────────────
function hashId(id: string): number {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = ((h << 5) - h + id.charCodeAt(i)) | 0;
  return Math.abs(h);
}

function hexToRgb(hex: string): [number, number, number] {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function rgbToHex(r: number, g: number, b: number): string {
  const c = (v: number) => Math.round(Math.max(0, Math.min(255, v))).toString(16).padStart(2, '0');
  return `#${c(r)}${c(g)}${c(b)}`;
}

/** Mix two hex colors. t=0 → a, t=1 → b */
function mix(a: string, b: string, t: number): string {
  const [r1, g1, b1] = hexToRgb(a);
  const [r2, g2, b2] = hexToRgb(b);
  return rgbToHex(r1 + (r2 - r1) * t, g1 + (g2 - g1) * t, b1 + (b2 - b1) * t);
}

/** Lighten a hex color */
function lighten(hex: string, t: number): string { return mix(hex, '#FFFFFF', t); }

// Worn-out target tones
const WORN_UPPER   = '#8A8578';
const WORN_MIDSOLE = '#B9B2A0';

export interface ShoeVisualProps {
  shoe: Shoe;
  /** 0 = brand new, 100 = fully spent */
  wearPct?: number;
  width?: number;
  /** subtle idle float animation */
  animated?: boolean;
}

export function ShoeVisual({ shoe, wearPct = 0, width = 280, animated = true }: ShoeVisualProps) {
  const wear = Math.max(0, Math.min(100, wearPct)) / 100;
  const seed = hashId(shoe.id);

  // ── Palette (per-model hue nudge via seed) ────────────────────────────────
  const base = BRAND_PALETTES[shoe.brand] ?? DEFAULT_PALETTE;
  const hueNudge = ((seed % 7) - 3) * 0.03; // -0.09 .. +0.09
  const upperFresh = hueNudge >= 0 ? lighten(base.upper, hueNudge) : mix(base.upper, base.dark, -hueNudge * 2);
  const upperColor   = mix(upperFresh, WORN_UPPER, wear * 0.5);
  const upperDark    = mix(base.dark, WORN_UPPER, wear * 0.45);
  const accentColor  = mix(base.accent, WORN_UPPER, wear * 0.55);
  const midsoleFresh = seed % 3 === 0 ? '#F2EFE6' : seed % 3 === 1 ? '#F7F5EF' : '#EFEDE9';
  const midsoleColor = mix(midsoleFresh, WORN_MIDSOLE, wear * 0.6);
  const outsoleColor = mix('#2B2B2B', '#4A453C', wear * 0.5);

  // ── Geometry from real specs ──────────────────────────────────────────────
  const VB_W = 320;
  const VB_H = 190;
  const GROUND = 158;

  const heelMm = shoe.specs?.stack_heel_mm ?? 34;
  const foreMm = shoe.specs?.stack_forefoot_mm ?? 26;
  const rocker = shoe.biomech?.rocker ?? 5;
  const cushion = shoe.biomech?.cushioning_level ?? 6;

  // Foam compresses as it wears — heel takes the most load
  const heelCompress = 1 - 0.30 * wear;
  const foreCompress = 1 - 0.18 * wear;
  const k = 1.35; // mm → px
  const hs = Math.max(18, Math.min(70, heelMm * k)) * heelCompress;   // heel stack px
  const fs = Math.max(12, Math.min(52, foreMm * k)) * foreCompress;   // forefoot stack px

  // Rocker → toe spring
  const toeLift = 4 + rocker * 2.0;
  // Cushion → sidewall bulge
  const bulge = 2 + cushion * 1.1;

  // Key X positions
  const heelBackX = 34;
  const toeTipX = 292;
  const midX = 160;

  // Midsole outline (organic clay blob)
  const heelTopY = GROUND - hs;
  const foreTopY = GROUND - toeLift - fs;
  const toeBottomY = GROUND - toeLift;

  const midsolePath = `
    M ${heelBackX + 8} ${GROUND}
    C ${heelBackX - bulge} ${GROUND - hs * 0.25}, ${heelBackX - bulge * 0.5} ${heelTopY + hs * 0.25}, ${heelBackX + 14} ${heelTopY}
    C ${midX - 30} ${heelTopY - 3}, ${midX + 20} ${foreTopY + (heelTopY - foreTopY) * 0.35}, ${toeTipX - 60} ${foreTopY}
    C ${toeTipX - 24} ${foreTopY + 2}, ${toeTipX - 4} ${toeBottomY - fs * 0.55}, ${toeTipX} ${toeBottomY - 4}
    C ${toeTipX} ${toeBottomY + 2}, ${toeTipX - 16} ${toeBottomY + 6}, ${toeTipX - 34} ${toeBottomY + 6}
    C ${midX + 40} ${GROUND - 2 + toeLift * 0.12}, ${midX - 10} ${GROUND + 1}, ${heelBackX + 8} ${GROUND}
    Z
  `;

  // Upper outline — sits on the midsole top line
  const collarH = 34 + cushion * 1.2;
  const collarTopY = heelTopY - collarH;
  const upperPath = `
    M ${heelBackX + 14} ${heelTopY + 2}
    C ${heelBackX + 8} ${heelTopY - collarH * 0.55}, ${heelBackX + 18} ${collarTopY + 4}, ${heelBackX + 42} ${collarTopY}
    C ${heelBackX + 66} ${collarTopY - 2}, ${heelBackX + 76} ${collarTopY + 10}, ${heelBackX + 88} ${collarTopY + 20}
    C ${midX + 10} ${collarTopY + 44}, ${midX + 42} ${foreTopY - 26}, ${toeTipX - 66} ${foreTopY - 14}
    C ${toeTipX - 40} ${foreTopY - 8}, ${toeTipX - 26} ${foreTopY - 4}, ${toeTipX - 60} ${foreTopY}
    C ${midX + 20} ${foreTopY + (heelTopY - foreTopY) * 0.35}, ${midX - 30} ${heelTopY - 3}, ${heelBackX + 14} ${heelTopY + 2}
    Z
  `;

  // Collar opening (ankle hole)
  const collarCx = heelBackX + 52;
  const collarCy = collarTopY + 7;

  // Lace crossings over the instep
  const laceCount = 4;
  const laces = Array.from({ length: laceCount }, (_, i) => {
    const t = i / (laceCount - 1);
    const x1 = heelBackX + 92 + t * 62;
    const y1 = collarTopY + 24 + t * ((foreTopY - 18) - (collarTopY + 24)) - 4;
    return { x1, y1: y1 - 3, x2: x1 + 18, y2: y1 + 9 };
  });

  // Outsole tread lugs — wear away at heel + forefoot strike zones first
  const lugs = Array.from({ length: 11 }, (_, i) => {
    const t = i / 10;
    const x = heelBackX + 16 + t * (toeTipX - 60 - heelBackX);
    const y = GROUND - 1 + (x > midX ? -((x - midX) / (toeTipX - midX)) * toeLift * 0.85 : 0);
    // strike zones: heel (t<0.25) and forefoot (t>0.6) wear first
    const strikeZone = t < 0.25 || t > 0.6;
    const lugWear = strikeZone ? wear * 1.35 : wear * 0.6;
    const h = Math.max(0.5, 4.5 * (1 - Math.min(1, lugWear)));
    return { x, y, h, opacity: Math.max(0.15, 1 - lugWear * 0.8) };
  });

  // Compression creases — appear in the sidewall as foam breaks down
  const creaseCount = wear <= 0.2 ? 0 : Math.min(5, Math.floor((wear - 0.2) / 0.16) + 1);
  const creases = Array.from({ length: creaseCount }, (_, i) => {
    const cx = heelBackX + 30 + ((seed >> (i * 3)) % 40) + i * 26;
    const topY = heelTopY + (foreTopY - heelTopY) * ((cx - heelBackX) / (toeTipX - heelBackX)) * 0.5;
    const depth = hs * (0.35 + 0.3 * wear);
    return `M ${cx} ${topY + 4} Q ${cx - 4} ${topY + depth * 0.5}, ${cx + 2} ${topY + depth}`;
  });

  // Scuffs
  const toeScuffOpacity = wear > 0.4 ? (wear - 0.4) * 0.5 : 0;
  const heelScuffOpacity = wear > 0.6 ? (wear - 0.6) * 0.6 : 0;
  const dirtOpacity = wear * 0.30;

  // ── Idle float animation ──────────────────────────────────────────────────
  const float = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (!animated) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(float, { toValue: 1, duration: 2600, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(float, { toValue: 0, duration: 2600, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [animated, float]);

  // Worn shoes sit heavier — less float
  const floatRange = 4 * (1 - wear * 0.75);
  const translateY = float.interpolate({ inputRange: [0, 1], outputRange: [0, -floatRange] });
  const shadowScale = float.interpolate({ inputRange: [0, 1], outputRange: [1, 0.94] });

  const height = width * (VB_H / VB_W);
  const gid = shoe.id.replace(/[^a-zA-Z0-9]/g, '');

  return (
    <View style={{ width, height, alignItems: 'center', justifyContent: 'center' }}>
      {/* Ground shadow */}
      <Animated.View style={{ position: 'absolute', bottom: height * 0.055, transform: [{ scaleX: shadowScale }] }}>
        <Svg width={width * 0.8} height={height * 0.14} viewBox="0 0 100 20">
          <Defs>
            <RadialGradient id={`shadow_${gid}`} cx="50%" cy="50%" rx="50%" ry="50%">
              <Stop offset="0%" stopColor="#0A0A0A" stopOpacity={0.22 + wear * 0.06} />
              <Stop offset="100%" stopColor="#0A0A0A" stopOpacity="0" />
            </RadialGradient>
          </Defs>
          <Ellipse cx="50" cy="10" rx="48" ry="8" fill={`url(#shadow_${gid})`} />
        </Svg>
      </Animated.View>

      <Animated.View style={{ transform: [{ translateY }] }}>
        <Svg width={width} height={height} viewBox={`0 0 ${VB_W} ${VB_H}`}>
          <Defs>
            {/* Clay sheen on the upper */}
            <LinearGradient id={`upper_${gid}`} x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0%" stopColor={lighten(upperColor, 0.30)} />
              <Stop offset="45%" stopColor={upperColor} />
              <Stop offset="100%" stopColor={mix(upperColor, upperDark, 0.5)} />
            </LinearGradient>
            {/* Soft midsole gradient */}
            <LinearGradient id={`mid_${gid}`} x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0%" stopColor={lighten(midsoleColor, 0.35)} />
              <Stop offset="60%" stopColor={midsoleColor} />
              <Stop offset="100%" stopColor={mix(midsoleColor, '#9A937F', 0.35 + wear * 0.3)} />
            </LinearGradient>
            {/* Top-light highlight for the clay look */}
            <RadialGradient id={`sheen_${gid}`} cx="35%" cy="18%" rx="55%" ry="45%">
              <Stop offset="0%" stopColor="#FFFFFF" stopOpacity={0.34 - wear * 0.2} />
              <Stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
            </RadialGradient>
          </Defs>

          {/* MIDSOLE */}
          <Path d={midsolePath} fill={`url(#mid_${gid})`} />

          {/* Accent streak along the midsole sidewall */}
          <Path
            d={`M ${heelBackX + 18} ${heelTopY + hs * 0.45}
                C ${midX - 20} ${heelTopY + hs * 0.4}, ${midX + 40} ${foreTopY + fs * 0.55}, ${toeTipX - 44} ${foreTopY + fs * 0.5}`}
            stroke={accentColor}
            strokeWidth={3.5 - wear * 1.5}
            strokeLinecap="round"
            fill="none"
            opacity={0.85 - wear * 0.35}
          />

          {/* Compression creases */}
          {creases.map((d, i) => (
            <Path
              key={`crease_${i}`}
              d={d}
              stroke={mix('#8A8272', '#5E594D', wear)}
              strokeWidth={1.2}
              strokeLinecap="round"
              fill="none"
              opacity={0.25 + wear * 0.4}
            />
          ))}

          {/* OUTSOLE */}
          <Path
            d={`M ${heelBackX + 8} ${GROUND}
                C ${midX - 10} ${GROUND + 1}, ${midX + 40} ${GROUND - 2 + toeLift * 0.12}, ${toeTipX - 34} ${toeBottomY + 6}
                L ${toeTipX - 34} ${toeBottomY + 9}
                C ${midX + 40} ${GROUND + 2 + toeLift * 0.12}, ${midX - 10} ${GROUND + 5}, ${heelBackX + 8} ${GROUND + 4}
                Z`}
            fill={outsoleColor}
          />
          {/* Tread lugs — wear away at strike zones */}
          {lugs.map((l, i) => (
            <Rect
              key={`lug_${i}`}
              x={l.x} y={l.y + 3} width={9} height={l.h}
              rx={1.5}
              fill={outsoleColor}
              opacity={l.opacity}
            />
          ))}

          {/* UPPER */}
          <Path d={upperPath} fill={`url(#upper_${gid})`} />

          {/* Collar opening */}
          <Ellipse cx={collarCx} cy={collarCy} rx={22} ry={8} fill={mix(upperDark, '#0A0A0A', 0.4)} opacity={0.9} />
          <Ellipse cx={collarCx} cy={collarCy - 1.5} rx={22} ry={8} fill="none" stroke={lighten(upperColor, 0.25)} strokeWidth={2} opacity={0.6} />

          {/* Heel tab */}
          <Path
            d={`M ${heelBackX + 26} ${collarTopY + 3} q -7 -8 -1 -14 q 7 -4 11 3 q 3 6 -4 11`}
            fill={accentColor}
            opacity={0.9 - wear * 0.3}
          />

          {/* Eyestay panel + laces */}
          <Path
            d={`M ${heelBackX + 86} ${collarTopY + 18}
                C ${midX + 8} ${collarTopY + 42}, ${midX + 36} ${foreTopY - 24}, ${toeTipX - 72} ${foreTopY - 13}
                L ${toeTipX - 78} ${foreTopY - 6}
                C ${midX + 26} ${foreTopY - 14}, ${midX - 2} ${collarTopY + 52}, ${heelBackX + 80} ${collarTopY + 28}
                Z`}
            fill={mix(upperDark, upperColor, 0.3)}
            opacity={0.8}
          />
          {laces.map((l, i) => (
            <Line
              key={`lace_${i}`}
              x1={l.x1} y1={l.y1} x2={l.x2} y2={l.y2}
              stroke={mix(lighten(upperColor, 0.55), WORN_UPPER, wear * 0.4)}
              strokeWidth={3.4}
              strokeLinecap="round"
            />
          ))}

          {/* Brand accent dot (logo mark) */}
          <Ellipse
            cx={heelBackX + 52} cy={heelTopY - collarH * 0.42}
            rx={6} ry={6}
            fill={accentColor}
            opacity={0.95 - wear * 0.3}
          />

          {/* Toe cap shading */}
          <Path
            d={`M ${toeTipX - 66} ${foreTopY - 14}
                C ${toeTipX - 40} ${foreTopY - 8}, ${toeTipX - 26} ${foreTopY - 4}, ${toeTipX - 60} ${foreTopY}
                C ${toeTipX - 72} ${foreTopY - 2}, ${toeTipX - 74} ${foreTopY - 8}, ${toeTipX - 66} ${foreTopY - 14} Z`}
            fill={upperDark}
            opacity={0.35}
          />

          {/* Scuffs */}
          {toeScuffOpacity > 0 && (
            <G opacity={toeScuffOpacity}>
              <Ellipse cx={toeTipX - 52} cy={foreTopY - 4} rx={14} ry={5} fill="#57503F" transform={`rotate(-12 ${toeTipX - 52} ${foreTopY - 4})`} />
              <Ellipse cx={toeTipX - 40} cy={foreTopY - 1} rx={8} ry={3} fill="#3E382B" />
            </G>
          )}
          {heelScuffOpacity > 0 && (
            <Ellipse cx={heelBackX + 16} cy={heelTopY + hs * 0.55} rx={7} ry={11} fill="#57503F" opacity={heelScuffOpacity} />
          )}

          {/* Dirt line along the bottom edge */}
          {dirtOpacity > 0.02 && (
            <Path
              d={`M ${heelBackX + 10} ${GROUND - 4}
                  C ${midX - 10} ${GROUND - 3}, ${midX + 40} ${GROUND - 6 + toeLift * 0.12}, ${toeTipX - 36} ${toeBottomY + 2}`}
              stroke="#5E5647"
              strokeWidth={5}
              strokeLinecap="round"
              fill="none"
              opacity={dirtOpacity}
            />
          )}

          {/* Clay sheen overlay */}
          <Path d={upperPath} fill={`url(#sheen_${gid})`} />
        </Svg>
      </Animated.View>
    </View>
  );
}

export default ShoeVisual;
