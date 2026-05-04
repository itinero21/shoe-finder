/** Stub type for foot scanner results (camera-based analysis — future feature) */
export interface ScanResult {
  arch_type: 'flat' | 'normal' | 'high';
  width: 'narrow' | 'regular' | 'wide';
  pressure_map?: number[][];
  scanned_at: string;
}
