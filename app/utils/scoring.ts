import { Shoe } from '../data/shoes';

export interface QuizAnswers {
  terrain: 'road' | 'trail';
  archType: 'flat' | 'normal' | 'high';
  pronation: 'over' | 'neutral' | 'under';
  injury: 'knee' | 'plantar' | 'shin' | 'none';
  goal: 'daily' | 'speed' | 'race';
}

export interface ScoredShoe extends Shoe {
  score: number;
  reasons: string[];
}

// Map quiz answers to condition strings used in the shoes database
function getTargetConditions(answers: QuizAnswers): string[] {
  const conditions: string[] = [];

  // Arch type
  if (answers.archType === 'flat') {
    conditions.push('flat_feet', 'overpronation');
  } else if (answers.archType === 'normal') {
    conditions.push('neutral_pronation');
  } else if (answers.archType === 'high') {
    conditions.push('high_arches', 'underpronation_supination');
  }

  // Pronation (overrides/supplements arch type)
  if (answers.pronation === 'over') {
    if (!conditions.includes('overpronation')) conditions.push('overpronation');
    if (!conditions.includes('flat_feet')) conditions.push('flat_feet');
  } else if (answers.pronation === 'neutral') {
    if (!conditions.includes('neutral_pronation')) conditions.push('neutral_pronation');
  } else if (answers.pronation === 'under') {
    if (!conditions.includes('underpronation_supination')) conditions.push('underpronation_supination');
    if (!conditions.includes('high_arches')) conditions.push('high_arches');
  }

  // Injury
  if (answers.injury === 'knee') conditions.push('knee_pain');
  if (answers.injury === 'plantar') conditions.push('plantar_fasciitis');
  if (answers.injury === 'shin') conditions.push('shin_splints');

  // Terrain
  if (answers.terrain === 'trail') conditions.push('trail_running');

  // Goal
  if (answers.goal === 'race') conditions.push('racing');
  if (answers.goal === 'speed') conditions.push('tempo_runs');

  return conditions;
}

export const scoreShoe = (shoe: Shoe, answers: QuizAnswers): { score: number; reasons: string[] } => {
  let score = 0;
  const reasons: string[] = [];

  const targetConditions = getTargetConditions(answers);

  // Score based on condition matches
  const matchedConditions = shoe.conditions.filter(c => targetConditions.includes(c));
  score += matchedConditions.length * 4;

  // Terrain matching
  const isTrailShoe = shoe.terrain === 'Trail';
  if (answers.terrain === 'trail' && isTrailShoe) {
    score += 3;
    reasons.push('Purpose-built for trail running');
  } else if (answers.terrain === 'road' && !isTrailShoe) {
    score += 2;
  } else if (answers.terrain === 'trail' && !isTrailShoe) {
    score -= 3; // Road shoe on trails
  } else if (answers.terrain === 'road' && isTrailShoe) {
    score -= 3; // Trail shoe on roads
  }

  // Goal alignment
  if (answers.goal === 'race') {
    if (shoe.category === 'carbon_plate_racing') {
      score += 5;
      reasons.push('Carbon-plated race day shoe');
    } else if (shoe.category === 'lightweight_speed') {
      score += 3;
      reasons.push('Fast and lightweight for racing');
    } else if (['neutral', 'stability', 'max_cushion', 'motion_control'].includes(shoe.category)) {
      score -= 2; // Heavy trainers penalised for race goal
    }
  } else if (answers.goal === 'speed') {
    if (shoe.category === 'lightweight_speed') {
      score += 4;
      reasons.push('Designed for speed and tempo runs');
    } else if (shoe.category === 'carbon_plate_racing') {
      score += 2;
    } else if (shoe.category === 'neutral') {
      score += 1;
    }
    if (shoe.category === 'motion_control') score -= 2;
  } else if (answers.goal === 'daily') {
    if (['neutral', 'stability', 'max_cushion', 'motion_control'].includes(shoe.category)) {
      score += 3;
      reasons.push('Great everyday trainer');
    }
    if (shoe.category === 'carbon_plate_racing') {
      score -= 4; // Carbon racers not for daily use
    }
  }

  // Arch-specific bonuses
  if (answers.archType === 'flat') {
    if (shoe.category === 'motion_control') {
      score += 4;
      reasons.push('Motion control ideal for flat feet');
    } else if (shoe.category === 'stability') {
      score += 3;
      reasons.push('Stability support for flat feet');
    } else if (shoe.category === 'neutral') {
      score -= 1;
    }
  } else if (answers.archType === 'high') {
    if (shoe.category === 'max_cushion') {
      score += 3;
      reasons.push('Maximum cushioning for high arches');
    } else if (shoe.category === 'neutral') {
      score += 2;
      reasons.push('Flexible neutral shoe for high arches');
    }
    if (['stability', 'motion_control'].includes(shoe.category)) {
      score -= 2; // Stability/motion control not recommended for high arches
    }
  } else if (answers.archType === 'normal' && answers.pronation === 'over') {
    if (shoe.category === 'stability') {
      score += 3;
      reasons.push('Stability support for overpronation');
    }
  }

  // Injury bonuses
  if (answers.injury !== 'none') {
    if (shoe.conditions.includes('plantar_fasciitis') && answers.injury === 'plantar') {
      score += 4;
      reasons.push('Recommended for plantar fasciitis relief');
    }
    if (shoe.conditions.includes('knee_pain') && answers.injury === 'knee') {
      score += 4;
      reasons.push('Extra cushioning helps reduce knee stress');
    }
    if (shoe.category === 'max_cushion' && answers.injury !== 'none') {
      score += 2;
      if (reasons.length < 3) reasons.push('Maximum cushioning protects from impact');
    }
    // Carbon racers penalised during injury recovery
    if (shoe.category === 'carbon_plate_racing') score -= 4;
  }

  return { score: Math.max(0, score), reasons: reasons.slice(0, 3) };
};

export const getRecommendations = (answers: QuizAnswers, shoes: Shoe[]): ScoredShoe[] => {
  const scoredShoes = shoes.map(shoe => ({
    ...shoe,
    ...scoreShoe(shoe, answers),
  }));

  return scoredShoes
    .filter(shoe => shoe.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 8);
};
