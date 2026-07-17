/**
 * ADAPTER — converts the STRIDE shoe database (app/data/shoes.ts) into the
 * universal ShoeProfile schema.
 *
 * v2.1: fully rewritten against the real database instead of neutral
 * defaults. Roles come from use_cases + category, surfaces from category,
 * plate type is detected from the tech list, softness from firmness,
 * durability from category class. dataConfidence rises to 0.75 because
 * every field is now genuinely populated.
 */
import { Shoe } from '../data/shoes';
import { PlateType, ShoeProfile, ShoeRole, StabilityClass, Surface, Width } from './types';

const MI_TO_KM = 1.60934;

function rolesFor(shoe: Shoe): ShoeRole[] {
  const roles = new Set<ShoeRole>();
  for (const u of shoe.use_cases ?? []) {
    if (u === 'daily_easy') { roles.add('daily'); roles.add('recovery'); }
    if (u === 'daily_versatile') roles.add('daily');
    if (u === 'long_run') roles.add('long_run');
    if (u === 'tempo') roles.add('tempo');
    if (u.startsWith('race')) roles.add('race');
    if (u.startsWith('trail')) roles.add('trail');
    if (u === 'walking') roles.add('walking');
  }
  if (shoe.category === 'carbon_racer' || shoe.category === 'trail_carbon_racer') roles.add('race');
  if (shoe.category === 'super_trainer') { roles.add('tempo'); roles.add('long_run'); }
  if (shoe.category.startsWith('max_cushion')) { roles.add('recovery'); roles.add('daily'); }
  if (shoe.category.startsWith('trail')) roles.add('trail');
  if (roles.size === 0) roles.add('daily');
  return [...roles];
}

function surfacesFor(shoe: Shoe): Surface[] {
  if (shoe.category.startsWith('trail')) {
    const s: Surface[] = ['groomed_trail'];
    if (shoe.category === 'trail_technical') s.push('technical_trail');
    if (shoe.category === 'trail_road_to_trail') s.push('road');
    if (shoe.category === 'trail_max_cushion' || shoe.category === 'trail_carbon_racer') s.push('technical_trail');
    return s;
  }
  return ['road', 'treadmill', 'track'];
}

function plateFor(shoe: Shoe): PlateType {
  const tech = (shoe.tech ?? []).join(' ').toLowerCase();
  if (/carbon|pwrplate|speedboard|fuelcell.*plate/.test(tech) && /plate|board/.test(tech)) return 'carbon';
  if (/carbon/.test(tech)) return 'carbon';
  if (/nylon.*plate|plate.*nylon|winged.*plate/.test(tech)) return 'nylon';
  if (/plate|wave plate|pebax plate|glass.*fiber/.test(tech)) return 'composite';
  return 'none';
}

function stabilityFor(level: string): StabilityClass {
  if (level === 'guidance') return 'stable_neutral';
  if (level === 'stability') return 'stability';
  if (level === 'max_stability' || level === 'motion_control') return 'motion_control';
  return 'neutral';
}

function durabilityKmFor(shoe: Shoe): number {
  const cat = shoe.category;
  if (cat === 'carbon_racer' || cat === 'trail_carbon_racer') return 400;
  if (cat === 'super_trainer' || cat === 'lightweight_daily' || cat === 'stability_lightweight') return 550;
  if (cat.startsWith('max_cushion') || cat === 'premium_neutral' || cat === 'stability_premium') return 800;
  if (cat.startsWith('trail')) return 700;
  if (cat === 'motion_control' || cat === 'max_stability') return 750;
  return 650;
}

function widthsFor(shoe: Shoe): Width[] {
  const map: Record<string, Width> = {
    narrow: 'narrow', regular: 'standard', wide: 'wide', extra_wide: 'extra_wide',
  };
  const out = (shoe.specs?.widths ?? ['regular']).map(w => map[w] ?? 'standard');
  return out.length ? [...new Set(out)] : ['standard'];
}

/**
 * v5 database ships audit metadata: data_confidence tells us how much of the
 * profile is verified vs carried forward, and market_status separates buyable
 * shoes from announced or legacy ones. Both flow into engine confidence.
 */
function confidenceFor(shoe: Shoe): number {
  const base: Record<string, number> = {
    official_specs: 0.85,
    official_model_provisional_specs: 0.7,
    carried_forward: 0.7,
    announced_provisional: 0.5,
    legacy_original: 0.65,
  };
  let c = base[shoe.data_confidence ?? ''] ?? 0.75;
  if (shoe.market_status === 'upcoming' || shoe.market_status === 'preorder') c = Math.min(c, 0.55);
  return c;
}

/** Convert a STRIDE database shoe into a universal ShoeProfile. */
export function adaptShoe(shoe: Shoe): ShoeProfile {
  const b = shoe.biomech;
  const x = shoe.specs;
  const isTrail = shoe.category.startsWith('trail');
  const isTechnical = shoe.category === 'trail_technical';

  return {
    id: shoe.id,
    brand: shoe.brand,
    model: shoe.model,
    roles: rolesFor(shoe),
    surfaces: surfacesFor(shoe),
    widths: widthsFor(shoe),
    mechanics: {
      dropMm: x?.drop_mm ?? 8,
      heelStackMm: x?.stack_heel_mm,
      forefootStackMm: x?.stack_forefoot_mm,
      cushioning: (b?.cushioning_level ?? 6) * 10,
      softness: (10 - (b?.cushioning_firmness ?? 5)) * 10,
      energyReturn: (b?.energy_return ?? 5) * 10,
      rocker: (b?.rocker ?? 5) * 10,
      longitudinalStiffness: (10 - (b?.midsole_flexibility ?? 5)) * 10,
      torsionalStability: (b?.torsional_rigidity ?? 5) * 10,
      heelCounter: (b?.heel_counter_rigidity ?? 5) * 10,
      platformWidth: b?.wide_base ? 78 : 55,
      toeBoxVolume: (b?.toe_box_width ?? 5) * 10,
      outsoleGrip: isTrail ? 85 : 65,
      wetGrip: isTrail ? 80 : 58,
      ...(isTrail ? { lugDepthMm: isTechnical ? 5 : 4 } : {}),
      plate: plateFor(shoe),
      stabilityClass: stabilityFor(shoe.biomech?.stability_level ?? 'neutral'),
      massGrams: Math.round((x?.weight_oz ?? 9.5) * 28.35),
    },
    durabilityBaselineKm: durabilityKmFor(shoe),
    price: shoe.price_usd,
    currency: 'USD',
    dataConfidence: confidenceFor(shoe),
    sourceTags: ['stride-db', shoe.market_status ?? 'available'],
  };
}

/** Adapt the full catalog once; cache by identity since SHOES is static. */
let cachedCatalog: ShoeProfile[] | null = null;
let cachedSource: Shoe[] | null = null;

export function adaptCatalog(shoes: Shoe[]): ShoeProfile[] {
  if (cachedCatalog && cachedSource === shoes) return cachedCatalog;
  cachedSource = shoes;
  cachedCatalog = shoes.map(adaptShoe);
  return cachedCatalog;
}

/** Convert lifespan/distance in miles to engine kilometers. */
export const milesToKm = (mi: number) => mi * MI_TO_KM;
