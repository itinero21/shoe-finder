import { Shoe } from '../data/shoes';

export interface QuizAnswers {
  activity: 'running' | 'walking';
  distance: 'short' | 'medium' | 'long';
  injuries: 'knee' | 'plantar' | 'shin' | 'none';
  flatFeet: boolean;
  terrain: 'road' | 'trail' | 'both';
}

export interface ScoredShoe extends Shoe {
  score: number;
  reasons: string[];
}

export const scoreShoe = (shoe: Shoe, answers: QuizAnswers): { score: number; reasons: string[] } => {
  let score = 0;
  const reasons: string[] = [];

  // Terrain matching (highest importance)
  if (answers.terrain === 'road') {
    if (shoe.terrain.toLowerCase() === 'road') {
      score += 3;
      reasons.push('Perfect for road running');
    } else if (shoe.terrain.toLowerCase() === 'trail') {
      score -= 2; // Penalty for trail shoes on road
    }
  } else if (answers.terrain === 'trail') {
    if (shoe.terrain.toLowerCase() === 'trail') {
      score += 3;
      reasons.push('Built for trail conditions');
    } else if (shoe.terrain.toLowerCase() === 'road') {
      score -= 1; // Small penalty for road shoes on trail
    }
  } else if (answers.terrain === 'both') {
    score += 2;
    reasons.push('Versatile for different terrains');
  }

  // Activity and distance matching
  if (answers.activity === 'running') {
    if (shoe.category.toLowerCase() === 'racing') {
      if (answers.distance === 'long') {
        score += 3;
        reasons.push('Elite performance for long distances');
      } else if (answers.distance === 'medium') {
        score += 2;
        reasons.push('Great for competitive running');
      } else {
        score += 1;
        reasons.push('Racing performance');
      }
    } else if (shoe.category.toLowerCase() === 'neutral') {
      score += 2;
      reasons.push('Excellent for regular running');
    } else if (shoe.category.toLowerCase() === 'stability') {
      score += 1;
      reasons.push('Supportive for consistent runs');
    }
  } else if (answers.activity === 'walking') {
    // For walking, prioritize comfort
    if (shoe.cushion.toLowerCase() === 'max') {
      score += 3;
      reasons.push('Maximum comfort for walking');
    } else if (shoe.cushion.toLowerCase() === 'high') {
      score += 2;
      reasons.push('Great cushioning for comfort');
    }
    
    // Racing shoes are not ideal for walking
    if (shoe.category.toLowerCase() === 'racing') {
      score -= 2;
    }
  }

  // Cushioning based on distance
  if (answers.distance === 'long') {
    if (shoe.cushion.toLowerCase() === 'max') {
      score += 3;
      reasons.push('Maximum cushioning for long distances');
    } else if (shoe.cushion.toLowerCase() === 'high') {
      score += 2;
      reasons.push('Great support for extended activity');
    }
  } else if (answers.distance === 'medium') {
    if (shoe.cushion.toLowerCase() === 'high' || shoe.cushion.toLowerCase() === 'moderate') {
      score += 2;
      reasons.push('Balanced cushioning');
    }
  } else if (answers.distance === 'short') {
    if (shoe.cushion.toLowerCase() === 'moderate') {
      score += 2;
      reasons.push('Responsive for shorter distances');
    } else if (shoe.cushion.toLowerCase() === 'high') {
      score += 1;
    }
  }

  // Injury considerations
  if (answers.injuries !== 'none') {
    if (shoe.cushion.toLowerCase() === 'max') {
      score += 2;
      
      switch (answers.injuries) {
        case 'knee':
          reasons.push('Extra cushioning helps with knee support');
          break;
        case 'plantar':
          reasons.push('Maximum cushioning for plantar comfort');
          break;
        case 'shin':
          reasons.push('Shock absorption for shin protection');
          break;
      }
    } else if (shoe.cushion.toLowerCase() === 'high') {
      score += 1;
      reasons.push('Good cushioning for injury protection');
    }
    
    // Racing shoes not recommended for injuries
    if (shoe.category.toLowerCase() === 'racing') {
      score -= 3;
    }
  }

  // Flat feet considerations
  if (answers.flatFeet) {
    if (shoe.category.toLowerCase() === 'stability') {
      score += 3;
      reasons.push('Stability support ideal for flat feet');
    } else if (shoe.category.toLowerCase() === 'neutral') {
      // Only slight penalty since some neutral shoes work for flat feet
      score -= 1;
    }
  } else {
    if (shoe.category.toLowerCase() === 'neutral') {
      score += 1;
      reasons.push('Neutral support for normal arches');
    }
  }

  // Category-specific bonuses
  if (shoe.category.toLowerCase() === 'trail' && answers.terrain === 'trail') {
    score += 1;
    reasons.push('Purpose-built for trails');
  }

  return { score: Math.max(0, score), reasons: reasons.slice(0, 3) };
};

export const getRecommendations = (answers: QuizAnswers, shoes: Shoe[]): ScoredShoe[] => {
  const scoredShoes = shoes.map(shoe => ({
    ...shoe,
    ...scoreShoe(shoe, answers)
  }));

  return scoredShoes
    .filter(shoe => shoe.score > 0) // Only include shoes with positive scores
    .sort((a, b) => b.score - a.score) // Sort by score descending
    .slice(0, 6); // Return top 6 recommendations
};