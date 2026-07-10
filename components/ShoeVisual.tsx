/**
 * SHOE VISUAL — Generative clay-3D shoe render.
 *
 * Every shoe in the database gets a unique, procedurally-generated side
 * profile built from its REAL specs:
 *   - heel / forefoot stack height  → midsole thickness
 *   - rocker                        → toe spring curve
 *   - cushioning level              → collar height
 *   - brand                         → color system
 *   - model id hash                 → per-model hue variation
 *
 * And it AGES. Pass `wearPct` (0–100) and the foam visibly compresses,
 * compression creases appear in the sidewall, the outsole tread wears
 * away at strike zones, the upper fades, and scuffs accumulate.
 *
 * The silhouette is traced from canonical running-shoe proportions
 * (heel counter → achilles notch → collar → tongue → vamp → toe wrap),
 * verified visually, with spec-driven scaling kept within safe bounds.
 */
import React, { useEffect, useRef } from 'react';
import { Animated, Easing, View } from 'react-native';
import Svg, {
  Path, Ellipse, Rect, Defs, LinearGradient, RadialGradient, Stop, Line,
} from 'react-native-svg';
import { Shoe } from '../app/data/shoes';

// ── Brand color systems (primary upper, accent, dark shade) ────────────────
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
  const hueNudge = ((seed % 7) - 3) * 0.03;
  const upperFresh = hueNudge >= 0 ? lighten(base.upper, hueNudge) : mix(base.upper, base.dark, -hueNudge * 2);
  const upperColor   = mix(upperFresh, WORN_UPPER, wear * 0.5);
  const upperDark    = mix(base.dark, WORN_UPPER, wear * 0.45);
  const accentColor  = mix(base.accent, WORN_UPPER, wear * 0.55);
  const midsoleFresh = seed % 3 === 0 ? '#F2EFE6' : seed % 3 === 1 ? '#F7F5EF' : '#EFEDE9';
  const midsoleColor = mix(midsoleFresh, WORN_MIDSOLE, wear * 0.6);
  const outsoleColor = mix('#2B2B2B', '#4A453C', wear * 0.5);

  // ── Geometry: canonical silhouette scaled by real specs ──────────────────
  const VB_W = 320;
  const VB_H = 190;
  const G = 158;

  const heelMm = shoe.specs?.stack_heel_mm ?? 34;
  const foreMm = shoe.specs?.stack_forefoot_mm ?? 26;
  const rocker = shoe.biomech?.rocker ?? 5;
  const cushion = shoe.biomech?.cushioning_level ?? 6;

  const hsF = Math.max(0.75, Math.min(1.35, heelMm / 36)) * (1 - 0.28 * wear);
  const toeSpring = 4 + rocker * 1.7;
  const heelBite = G - 38 * hsF;
  const midBite  = G - 30 * hsF + 2;
  const ballBite = G - toeSpring * 0.5 - 21 * Math.max(0.7, Math.min(1.3, foreMm / 26)) * (1 - 0.16 * wear);
  const toeBite  = ballBite + 6;
  const tipTopY  = G - toeSpring - 10;
  const tipBotY  = G - toeSpring;
  const collarH  = 52 + cushion * 1.6;
  const colY     = heelBite - collarH;
  const tongueY  = colY - 4;

  // Upper: heel counter → achilles notch → collar → tongue → vamp → toe wrap
  const upperPath = `M 54 ${heelBite}
    C 46 ${heelBite - collarH * 0.35}, 46 ${colY + 22}, 56 ${colY + 8}
    C 61 ${colY + 1}, 70 ${colY - 2}, 80 ${colY}
    C 88 ${colY + 1}, 94 ${colY + 5}, 99 ${colY + 11}
    C 103 ${colY + 16}, 106 ${colY + 14}, 110 ${tongueY + 6}
    C 115 ${tongueY + 1}, 124 ${tongueY}, 133 ${tongueY + 1}
    C 141 ${tongueY + 2}, 146 ${tongueY + 6}, 152 ${tongueY + 12}
    C 176 ${colY + collarH * 0.52}, 214 ${ballBite - 26}, 247 ${ballBite - 15}
    C 264 ${ballBite - 10}, 277 ${toeBite - 12}, 283 ${toeBite - 4}
    C 286 ${toeBite}, 284 ${toeBite + 1}, 281 ${toeBite + 1}
    C 220 ${ballBite + 2}, 130 ${midBite}, 54 ${heelBite} Z`;

  // Midsole: bite line → rounded nose → ground bottom → heel flare
  const midsolePath = `M 54 ${heelBite}
    C 130 ${midBite}, 220 ${ballBite + 2}, 281 ${toeBite + 1}
    C 287 ${toeBite + 2}, 290 ${tipTopY + 6}, 290 ${tipTopY + 10}
    C 290 ${tipBotY - 2}, 287 ${tipBotY + 1}, 281 ${tipBotY + 2}
    C 258 ${tipBotY + 4}, 238 ${tipBotY + 6}, 210 ${G - toeSpring * 0.42}
    C 165 ${G - toeSpring * 0.12}, 120 ${G + 1}, 66 ${G}
    C 54 ${G}, 46 ${G - 2}, 44 ${G - 7}
    C 41 ${G - 20}, 43 ${heelBite + 14}, 54 ${heelBite} Z`;

  // Outsole: dark strip along the bottom
  const outsolePath = `M 44 ${G - 7}
    C 46 ${G - 2}, 54 ${G}, 66 ${G}
    C 120 ${G + 1}, 165 ${G - toeSpring * 0.12}, 210 ${G - toeSpring * 0.42}
    C 238 ${tipBotY + 6}, 258 ${tipBotY + 4}, 281 ${tipBotY + 2}
    L 281 ${tipBotY + 5}
    C 258 ${tipBotY + 7}, 238 ${tipBotY + 9}, 210 ${G + 3 - toeSpring * 0.42}
    C 165 ${G + 3 - toeSpring * 0.12}, 120 ${G + 5}, 66 ${G + 4}
    C 52 ${G + 4}, 44 ${G + 1}, 44 ${G - 7} Z`;

  // Accent swoosh on the quarter panel
  const swooshPath = `M 96 ${heelBite - 8} C 130 ${heelBite - 20}, 168 ${ballBite - 34}, 212 ${ballBite - 22}
    C 176 ${ballBite - 22}, 132 ${heelBite - 8}, 100 ${heelBite - 1}`;

  // Midsole accent streak
  const streakPath = `M 58 ${heelBite + (G - heelBite) * 0.5} C 130 ${midBite + (G - midBite) * 0.55}, 210 ${ballBite + 8}, 268 ${toeBite + 5}`;

  // Heel logo dot
  const heelDotPath = `M 52 ${colY + 26} q -7 2 -6 9 q 1 6 8 5 q 6 -1 5 -8 q -1 -6 -7 -6`;

  // Laces along the vamp
  const laces = Array.from({ length: 4 }, (_, i) => {
    const t = i / 3;
    const lx = 158 + t * 60;
    const ly = (tongueY + 22) + t * ((ballBite - 12) - (tongueY + 22));
    return { x1: lx, y1: ly - 1, x2: lx + 12, y2: ly + 5 };
  });
  const laceColor = mix(lighten(base.upper, 0.6), WORN_UPPER, wear * 0.4);

  // Tread lugs — anchored to the outsole bottom, wear away at strike zones
  const soleBottomY = (x: number) => {
    if (x <= 66) return G + 4;
    if (x <= 210) { const t2 = (x - 66) / 144; return G + 4 - t2 * t2 * (toeSpring * 0.42 + 1); }
    const t3 = (x - 210) / 71;
    return (G + 3 - toeSpring * 0.42) + t3 * ((tipBotY + 5) - (G + 3 - toeSpring * 0.42));
  };
  const lugs = Array.from({ length: 10 }, (_, i) => {
    const t = i / 9;
    const x = 56 + t * 218;
    const strike = t < 0.28 || t > 0.62;   // heel + forefoot strike zones wear first
    const lugWear = strike ? wear * 1.35 : wear * 0.6;
    return {
      x,
      y: soleBottomY(x + 5) - 1.5,
      h: Math.max(0.6, 3.6 * (1 - Math.min(1, lugWear))),
      opacity: Math.max(0.25, 1 - lugWear * 0.7),
    };
  });

  // Compression creases — appear in the sidewall as foam breaks down
  const creaseCount = wear <= 0.2 ? 0 : Math.min(5, Math.floor((wear - 0.2) / 0.16) + 1);
  const creases = Array.from({ length: creaseCount }, (_, i) => {
    const cx = 66 + ((seed >> (i * 3)) % 30) + i * 34;
    const topY = heelBite + (midBite - heelBite) * Math.min(1, (cx - 54) / 160) + 3;
    const d = (G - topY) * (0.45 + 0.25 * wear);
    return `M ${cx} ${topY} Q ${cx - 4} ${topY + d * 0.5}, ${cx + 2} ${topY + d}`;
  });

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
      <Animated.View style={{ position: 'absolute', bottom: height * 0.04, transform: [{ scaleX: shadowScale }] }}>
        <Svg width={width * 0.8} height={height * 0.12} viewBox="0 0 100 20">
          <Defs>
            <RadialGradient id={`shadow_${gid}`} cx="50%" cy="50%" rx="50%" ry="50%">
              <Stop offset="0%" stopColor="#0A0A0A" stopOpacity={0.20 + wear * 0.06} />
              <Stop offset="100%" stopColor="#0A0A0A" stopOpacity="0" />
            </RadialGradient>
          </Defs>
          <Ellipse cx="50" cy="10" rx="48" ry="8" fill={`url(#shadow_${gid})`} />
        </Svg>
      </Animated.View>

      <Animated.View style={{ transform: [{ translateY }] }}>
        <Svg width={width} height={height} viewBox={`0 0 ${VB_W} ${VB_H}`}>
          <Defs>
            <LinearGradient id={`upper_${gid}`} x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0%" stopColor={lighten(upperColor, 0.28)} />
              <Stop offset="50%" stopColor={upperColor} />
              <Stop offset="100%" stopColor={mix(upperColor, upperDark, 0.55)} />
            </LinearGradient>
            <LinearGradient id={`mid_${gid}`} x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0%" stopColor={lighten(midsoleColor, 0.4)} />
              <Stop offset="60%" stopColor={midsoleColor} />
              <Stop offset="100%" stopColor={mix(midsoleColor, '#9A937F', 0.35 + wear * 0.3)} />
            </LinearGradient>
            <RadialGradient id={`sheen_${gid}`} cx="30%" cy="20%" rx="60%" ry="55%">
              <Stop offset="0%" stopColor="#FFFFFF" stopOpacity={Math.max(0, 0.32 - wear * 0.2)} />
              <Stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
            </RadialGradient>
          </Defs>

          {/* MIDSOLE */}
          <Path d={midsolePath} fill={`url(#mid_${gid})`} />

          {/* Accent streak along the midsole sidewall */}
          <Path
            d={streakPath}
            stroke={accentColor}
            strokeWidth={3.4 - wear * 1.4}
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
              strokeWidth={1.3}
              strokeLinecap="round"
              fill="none"
              opacity={0.3 + wear * 0.4}
            />
          ))}

          {/* OUTSOLE + tread lugs */}
          <Path d={outsolePath} fill={outsoleColor} />
          {lugs.map((l, i) => (
            <Rect
              key={`lug_${i}`}
              x={l.x} y={l.y} width={10} height={l.h}
              rx={1.4}
              fill={outsoleColor}
              opacity={l.opacity}
            />
          ))}

          {/* UPPER */}
          <Path d={upperPath} fill={`url(#upper_${gid})`} />

          {/* Accent swoosh on the quarter panel */}
          <Path d={swooshPath} fill={accentColor} opacity={0.9 - wear * 0.3} />

          {/* Collar opening */}
          <Ellipse
            cx={76} cy={colY + 7} rx={14} ry={5}
            fill="rgba(10,10,20,0.75)"
            transform={`rotate(6 76 ${colY + 7})`}
          />

          {/* Heel logo dot */}
          <Path d={heelDotPath} fill={accentColor} opacity={0.9 - wear * 0.3} />

          {/* Laces */}
          {laces.map((l, i) => (
            <Line
              key={`lace_${i}`}
              x1={l.x1} y1={l.y1} x2={l.x2} y2={l.y2}
              stroke={laceColor}
              strokeWidth={3}
              strokeLinecap="round"
            />
          ))}

          {/* Scuffs */}
          {toeScuffOpacity > 0 && (
            <Ellipse
              cx={262} cy={toeBite - 8} rx={13} ry={5}
              fill="#57503F"
              opacity={toeScuffOpacity}
              transform={`rotate(14 262 ${toeBite - 8})`}
            />
          )}
          {heelScuffOpacity > 0 && (
            <Ellipse cx={49} cy={heelBite + 16} rx={6} ry={10} fill="#57503F" opacity={heelScuffOpacity} />
          )}

          {/* Dirt line along the bottom edge */}
          {dirtOpacity > 0.02 && (
            <Path
              d={`M 60 ${G - 3} C 130 ${G - 2}, 200 ${G - toeSpring * 0.35 - 2}, 270 ${tipBotY + 1}`}
              stroke="#5E5647"
              strokeWidth={4}
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
