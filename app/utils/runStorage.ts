import AsyncStorage from '@react-native-async-storage/async-storage';
import { Run } from '../types/run';

const RUNS_KEY = 'RUNS_V1';

// Lazy import to avoid circular deps
async function syncRunToCloud(run: Run) {
  try {
    const { pushRun } = await import('../services/cloudSync');
    await pushRun(run);
  } catch { /* offline — local write already done */ }
}

async function deleteRunFromCloud(runId: string) {
  try {
    const { deleteRunCloud } = await import('../services/cloudSync');
    await deleteRunCloud(runId);
  } catch { /* offline */ }
}

export async function getRuns(): Promise<Run[]> {
  try {
    const raw = await AsyncStorage.getItem(RUNS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (error) {
    console.error('Error loading runs:', error);
    return [];
  }
}

export async function saveRun(run: Run): Promise<void> {
  try {
    const runs = await getRuns();
    const updatedRuns = [run, ...runs];
    await AsyncStorage.setItem(RUNS_KEY, JSON.stringify(updatedRuns));
    syncRunToCloud(run); // fire-and-forget
  } catch (error) {
    console.error('Error saving run:', error);
    throw error;
  }
}

export async function getRunsForShoe(shoeId: string): Promise<Run[]> {
  const runs = await getRuns();
  return runs.filter(run => run.shoeId === shoeId);
}

export async function deleteRun(runId: string): Promise<void> {
  try {
    const runs = await getRuns();
    const updatedRuns = runs.filter(run => run.id !== runId);
    await AsyncStorage.setItem(RUNS_KEY, JSON.stringify(updatedRuns));
    deleteRunFromCloud(runId); // fire-and-forget
  } catch (error) {
    console.error('Error deleting run:', error);
    throw error;
  }
}

export async function clearAllRuns(): Promise<void> {
  try {
    await AsyncStorage.removeItem(RUNS_KEY);
  } catch (error) {
    console.error('Error clearing runs:', error);
    throw error;
  }
}
