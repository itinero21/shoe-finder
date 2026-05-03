import { Run, ShoeStats } from '../types/run';

export function getMileageForShoe(shoeId: string, runs: Run[]): number {
  return runs
    .filter(r => r.shoeId === shoeId)
    .reduce((sum, r) => sum + r.distanceKm, 0);
}

export function getShoeStats(shoeId: string, runs: Run[]): ShoeStats {
  const shoeRuns = runs.filter(r => r.shoeId === shoeId);

  if (shoeRuns.length === 0) {
    return {
      shoeId,
      totalMileage: 0,
      runCount: 0,
      avgDistance: 0,
    };
  }

  const totalMileage = shoeRuns.reduce((sum, r) => sum + r.distanceKm, 0);
  const runsWithFeel = shoeRuns.filter(r => r.feel !== undefined);
  const averageFeel = runsWithFeel.length > 0
    ? runsWithFeel.reduce((sum, r) => sum + (r.feel || 0), 0) / runsWithFeel.length
    : undefined;

  // Sort by date descending to get last run
  const sortedRuns = [...shoeRuns].sort((a, b) =>
    new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  return {
    shoeId,
    totalMileage,
    runCount: shoeRuns.length,
    avgDistance: totalMileage / shoeRuns.length,
    lastRunDate: sortedRuns[0]?.date,
    averageFeel,
  };
}

export function shouldReplaceShoe(mileageKm: number): boolean {
  // Typical shoe lifespan: 500-800km (300-500 miles)
  return mileageKm >= 800;
}

export function getShoeHealthPercentage(mileageKm: number): number {
  // Assume 800km is end of life
  const maxMileage = 800;
  const remaining = Math.max(0, maxMileage - mileageKm);
  return Math.round((remaining / maxMileage) * 100);
}

export function getShoeHealthStatus(mileageKm: number): {
  status: 'fresh' | 'good' | 'warning' | 'replace';
  message: string;
  color: string;
} {
  if (mileageKm < 200) {
    return {
      status: 'fresh',
      message: 'Breaking in nicely',
      color: '#16A34A',
    };
  } else if (mileageKm < 500) {
    return {
      status: 'good',
      message: 'Prime condition',
      color: '#2563EB',
    };
  } else if (mileageKm < 700) {
    return {
      status: 'warning',
      message: 'Consider replacing soon',
      color: '#D97706',
    };
  } else {
    return {
      status: 'replace',
      message: 'Time for new shoes',
      color: '#DC2626',
    };
  }
}

export function formatDistance(km: number): string {
  return km.toFixed(1);
}

export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;

  return date.toLocaleDateString();
}
