/**
 * OpenAI service — DISABLED for beta.
 * Coach tab uses static keyword-based responses instead.
 * This file exports stubs so RunningCoachChat.tsx doesn't break.
 */

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface RunningCoachContext {
  userRotation?: Array<{
    name: string;
    mileage: number;
    category: string;
  }>;
  userProfile?: {
    archType?: string;
    pronation?: string;
    width?: string;
  };
}

export async function sendRunningCoachMessage(
  messages: ChatMessage[],
  context?: RunningCoachContext
): Promise<string> {
  return 'AI coach is not available. Use the COACH tab for training plans and advice.';
}

export function getStarterQuestions(): string[] {
  return [
    "What's a good training plan for a 5K?",
    "How do I prevent shin splints?",
    "Should I add a stability shoe to my rotation?",
    "What's the difference between tempo and interval runs?",
    "How often should I replace my running shoes?",
    "What shoes are best for marathon training?",
  ];
}
