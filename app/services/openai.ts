import OpenAI from 'openai';

const OPENAI_API_KEY = process.env.EXPO_PUBLIC_OPENAI_API_KEY;

if (!OPENAI_API_KEY) {
  console.warn('OpenAI API key not found. Please add EXPO_PUBLIC_OPENAI_API_KEY to your .env file');
}

const openai = new OpenAI({
  apiKey: OPENAI_API_KEY,
  dangerouslyAllowBrowser: true, // Required for Expo/React Native
});

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

/**
 * Send a message to the running coach AI
 * @param messages - Array of chat messages (conversation history)
 * @param context - Optional context about user's shoes and foot profile
 * @returns AI response message
 */
export async function sendRunningCoachMessage(
  messages: ChatMessage[],
  context?: RunningCoachContext
): Promise<string> {
  try {
    // Build system prompt with context
    const systemPrompt = buildSystemPrompt(context);

    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo', // Using GPT-3.5 for better rate limits (change to 'gpt-4o' for better quality)
      messages: [
        { role: 'system', content: systemPrompt },
        ...messages,
      ],
      temperature: 0.7,
      max_tokens: 800,
    });

    return completion.choices[0]?.message?.content || 'Sorry, I could not generate a response.';
  } catch (error: any) {
    console.error('OpenAI API Error:', error);

    // Handle rate limit / quota errors
    if (error?.status === 429) {
      throw new Error('OpenAI quota exceeded. Please add credits to your OpenAI account at platform.openai.com/account/billing');
    }

    // Handle invalid API key
    if (error?.status === 401) {
      throw new Error('Invalid OpenAI API key. Please check your .env file.');
    }

    // Handle other errors
    if (error instanceof Error) {
      if (error.message.includes('API key')) {
        throw new Error('OpenAI API key is invalid or missing. Please check your .env file.');
      }
      throw new Error(`Failed to get response: ${error.message}`);
    }

    throw new Error('An unexpected error occurred while contacting the AI coach.');
  }
}

/**
 * Build the system prompt with user context
 */
function buildSystemPrompt(context?: RunningCoachContext): string {
  let prompt = `You are an expert running coach and shoe specialist. You help runners with:
- Training plans and running advice
- Shoe recommendations based on their biomechanics
- Injury prevention and recovery
- Race preparation strategies
- Building balanced shoe rotations

Be friendly, concise, and actionable. Use runner-friendly language.`;

  if (context?.userProfile) {
    const { archType, pronation, width } = context.userProfile;
    prompt += `\n\nUser's Foot Profile:
- Arch Type: ${archType || 'Unknown'}
- Pronation: ${pronation || 'Unknown'}
- Width: ${width || 'Unknown'}`;
  }

  if (context?.userRotation && context.userRotation.length > 0) {
    prompt += `\n\nUser's Current Shoe Rotation:`;
    context.userRotation.forEach(shoe => {
      prompt += `\n- ${shoe.name} (${shoe.category}) - ${shoe.mileage}km`;
    });
  }

  return prompt;
}

/**
 * Get suggested starter questions for the chat
 */
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
