import { Shoe } from '../data/shoes';

function getCategoryRoles(category: string) {
  switch (category) {
    case 'carbon_plate_racing': return { easy: 1, long: 5, speed: 9, race: 10 };
    case 'lightweight_speed':   return { easy: 4, long: 5, speed: 9, race: 7 };
    case 'max_cushion':         return { easy: 9, long: 10, speed: 3, race: 2 };
    case 'stability':           return { easy: 8, long: 8, speed: 4, race: 2 };
    case 'motion_control':      return { easy: 7, long: 7, speed: 2, race: 1 };
    case 'trail':               return { easy: 7, long: 7, speed: 5, race: 5 };
    case 'neutral':
    default:                    return { easy: 8, long: 8, speed: 5, race: 3 };
  }
}

export function getRotationProfile(shoes: Shoe[]) {
  const profile = { easy: 0, long: 0, speed: 0, race: 0 };

  shoes.forEach(shoe => {
    const roles = getCategoryRoles(shoe.category);
    profile.easy  += roles.easy;
    profile.long  += roles.long;
    profile.speed += roles.speed;
    profile.race  += roles.race;
  });

  return profile;
}

export function getRotationInsights(profile: Record<string, number>) {
  const insights: string[] = [];

  if (profile.speed < 5)  insights.push('Consider adding a speed/tempo shoe');
  if (profile.race < 5)   insights.push('Add a race day shoe for PRs');
  if (profile.easy > 25)  insights.push('You may have too many easy-day shoes');
  if (profile.long < 6)   insights.push('Need a dedicated long-run shoe');
  if (profile.easy < 8)   insights.push('Add more easy/recovery shoes to your rotation');

  if (insights.length === 0) {
    insights.push('Well-balanced rotation for all run types!');
  }

  return insights;
}

export function getRotationHealthScore(profile: Record<string, number>): number {
  let score = 100;

  if (profile.easy  < 7)  score -= 20;
  if (profile.long  < 6)  score -= 15;
  if (profile.speed < 5)  score -= 15;
  if (profile.race  < 4)  score -= 10;
  if (profile.easy  > 25) score -= 10;

  return Math.max(0, score);
}
