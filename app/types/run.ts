export type Run = {
  id: string;
  shoeId: string;
  distanceKm: number;
  date: string;
  notes?: string;
  feel?: 1 | 2 | 3; // 1 = dead, 2 = okay, 3 = fresh
};

export type ShoeStats = {
  shoeId: string;
  totalMileage: number;
  runCount: number;
  avgDistance: number;
  lastRunDate?: string;
  averageFeel?: number;
};
