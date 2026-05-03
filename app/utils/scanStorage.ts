import AsyncStorage from '@react-native-async-storage/async-storage';
import { ScanResult } from '../types/footAnalysis';

const SCAN_STORAGE_KEY = '@shoe_finder_scan_results';

export async function saveScanResult(scanResult: ScanResult): Promise<void> {
  try {
    await AsyncStorage.setItem(SCAN_STORAGE_KEY, JSON.stringify(scanResult));
  } catch (error) {
    console.error('Error saving scan result:', error);
    throw error;
  }
}

export async function getScanResult(): Promise<ScanResult | null> {
  try {
    const data = await AsyncStorage.getItem(SCAN_STORAGE_KEY);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error('Error getting scan result:', error);
    return null;
  }
}

export async function clearScanResult(): Promise<void> {
  try {
    await AsyncStorage.removeItem(SCAN_STORAGE_KEY);
  } catch (error) {
    console.error('Error clearing scan result:', error);
    throw error;
  }
}
