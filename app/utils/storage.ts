import AsyncStorage from '@react-native-async-storage/async-storage';
import { Shoe } from '../data/shoes';

export interface QuizResult {
  id: string;
  timestamp: number;
  answers: {
    terrain: 'road' | 'trail';
    archType: 'flat' | 'normal' | 'high';
    pronation: 'over' | 'neutral' | 'under';
    injury: 'knee' | 'plantar' | 'shin' | 'none';
    goal: 'daily' | 'speed' | 'race';
  };
  recommendations: Shoe[];
}

export interface UserPreferences {
  theme: 'light' | 'dark' | 'auto';
  hapticFeedback: boolean;
  notifications: boolean;
}

// Favorites
export const getFavorites = async (): Promise<string[]> => {
  try {
    const favorites = await AsyncStorage.getItem('favorites');
    return favorites ? JSON.parse(favorites) : [];
  } catch (error) {
    console.error('Error loading favorites:', error);
    return [];
  }
};

async function syncArsenalToCloud(ids: string[]) {
  try {
    const { pushArsenal } = await import('../services/cloudSync');
    await pushArsenal(ids);
  } catch { /* offline */ }
}

async function recordChoiceToCloud(shoeId: string) {
  try {
    const { recordShoeChoice } = await import('../services/cloudSync');
    await recordShoeChoice(shoeId);
  } catch { /* offline */ }
}

export const addToFavorites = async (shoeId: string): Promise<void> => {
  try {
    const favorites = await getFavorites();
    if (!favorites.includes(shoeId)) {
      const updatedFavorites = [...favorites, shoeId];
      await AsyncStorage.setItem('favorites', JSON.stringify(updatedFavorites));
      syncArsenalToCloud(updatedFavorites); // fire-and-forget
      recordChoiceToCloud(shoeId);          // leaderboard tracking — fire-and-forget
    }
  } catch (error) {
    console.error('Error adding to favorites:', error);
  }
};

export const removeFromFavorites = async (shoeId: string): Promise<void> => {
  try {
    const favorites = await getFavorites();
    const updatedFavorites = favorites.filter(id => id !== shoeId);
    await AsyncStorage.setItem('favorites', JSON.stringify(updatedFavorites));
    syncArsenalToCloud(updatedFavorites); // fire-and-forget
  } catch (error) {
    console.error('Error removing from favorites:', error);
  }
};

// Quiz History
export const getQuizHistory = async (): Promise<QuizResult[]> => {
  try {
    const history = await AsyncStorage.getItem('quizHistory');
    return history ? JSON.parse(history) : [];
  } catch (error) {
    console.error('Error loading quiz history:', error);
    return [];
  }
};

export const saveQuizResult = async (result: Omit<QuizResult, 'id' | 'timestamp'>): Promise<void> => {
  try {
    const history = await getQuizHistory();
    const newResult: QuizResult = {
      ...result,
      id: Date.now().toString(),
      timestamp: Date.now()
    };
    const updatedHistory = [newResult, ...history].slice(0, 10); // Keep last 10 results
    await AsyncStorage.setItem('quizHistory', JSON.stringify(updatedHistory));
  } catch (error) {
    console.error('Error saving quiz result:', error);
  }
};

// User Preferences
export const getUserPreferences = async (): Promise<UserPreferences> => {
  try {
    const prefs = await AsyncStorage.getItem('userPreferences');
    return prefs ? JSON.parse(prefs) : {
      theme: 'auto',
      hapticFeedback: true,
      notifications: true
    };
  } catch (error) {
    console.error('Error loading user preferences:', error);
    return {
      theme: 'auto',
      hapticFeedback: true,
      notifications: true
    };
  }
};

export const saveUserPreferences = async (preferences: UserPreferences): Promise<void> => {
  try {
    await AsyncStorage.setItem('userPreferences', JSON.stringify(preferences));
  } catch (error) {
    console.error('Error saving user preferences:', error);
  }
};