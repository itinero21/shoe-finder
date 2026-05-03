# AI Running Coach Setup Guide

## Overview

You now have a new **Coach** tab in your app powered by OpenAI's ChatGPT API. Users can ask questions about:
- Training plans and running advice
- Shoe recommendations based on their biomechanics
- Injury prevention and recovery
- Race preparation strategies
- Building balanced shoe rotations

The AI coach automatically knows about the user's foot profile (from the scan) and their current shoe rotation!

---

## Setup Instructions

### 1. Get Your OpenAI API Key

1. Go to [https://platform.openai.com/api-keys](https://platform.openai.com/api-keys)
2. Sign up or log in to your OpenAI account
3. Click **"Create new secret key"**
4. Copy the API key (starts with `sk-`)

### 2. Add API Key to Your App

1. Open your `.env` file (or create one from `.env.example`):
   ```bash
   cp .env.example .env
   ```

2. Add your OpenAI API key:
   ```
   EXPO_PUBLIC_OPENAI_API_KEY=sk-your-actual-api-key-here
   ```

3. Save the file

### 3. Restart Your App

```bash
# Stop the current Expo server (Ctrl+C)
# Then restart:
npx expo start
```

---

## Features

### Smart Context Awareness

The AI coach automatically has access to:
- **User's foot profile**: Arch type, pronation, width (from scan results)
- **Current shoe rotation**: All shoes in their rotation with mileage

This means users get personalized advice without having to repeat their info!

### Starter Questions

When the chat is empty, users see suggested questions like:
- "What's a good training plan for a 5K?"
- "How do I prevent shin splints?"
- "Should I add a stability shoe to my rotation?"
- "What's the difference between tempo and interval runs?"
- "How often should I replace my running shoes?"
- "What shoes are best for marathon training?"

### Beautiful UI

- Clean, modern chat interface
- User messages on the right (blue bubbles)
- AI responses on the left (white bubbles with running emoji)
- Smooth animations and auto-scrolling
- Loading indicator while AI is thinking

---

## Usage

### For Users:

1. Tap the **Coach** tab (4th tab with person icon)
2. Either:
   - Tap a suggested starter question, OR
   - Type your own question in the input field
3. Get instant AI-powered advice!

### Example Conversations:

**User**: "I just started running. What's a good beginner plan?"

**AI Coach**: "Great to hear you're starting your running journey! Here's a simple 4-week beginner plan:

Week 1-2: Run/Walk Method
- 3 days per week
- 20 minutes total (1 min run, 2 min walk, repeat)

Week 3-4: Build Endurance
- 3-4 days per week
- 25-30 minutes (2 min run, 1 min walk)

Tips:
- Always warm up with 5 min walking
- Rest days are crucial for recovery
- Listen to your body - don't push through pain

Based on your neutral arch and standard width, the Saucony Axon 3 in your rotation is perfect for these easy runs!"

---

## Configuration

### Model Used
- **GPT-4o** (GPT-4 Turbo) - Best quality for running advice
- You can change this in [app/services/openai.ts:41](app/services/openai.ts#L41)

### Cost Optimization
GPT-4o pricing (as of 2024):
- Input: $2.50 per 1M tokens
- Output: $10 per 1M tokens

A typical conversation costs ~$0.01-0.03. Very affordable!

To reduce costs, you can switch to GPT-3.5 Turbo:
```typescript
model: 'gpt-3.5-turbo', // Cheaper but less capable
```

### Customizing the AI Coach

Edit the system prompt in [app/services/openai.ts:67-79](app/services/openai.ts#L67-L79) to:
- Change the coach's personality
- Add specific expertise (e.g., marathon training, trail running)
- Include your own shoe database in the context
- Add training methodologies you prefer

---

## Files Added

1. **[app/services/openai.ts](app/services/openai.ts)** - OpenAI API integration
2. **[components/RunningCoachChat.tsx](components/RunningCoachChat.tsx)** - Chat UI component
3. **[app/(tabs)/coach.tsx](app/(tabs)/coach.tsx)** - Coach tab screen
4. **[.env.example](.env.example)** - Updated with OpenAI API key placeholder

## Files Modified

1. **[app/(tabs)/_layout.tsx](app/(tabs)/_layout.tsx)** - Added Coach tab to navigation

---

## Troubleshooting

### "API key is invalid or missing"
- Make sure your `.env` file exists and has the correct key
- Restart the Expo server after adding the key
- Check that the key starts with `sk-`

### "Failed to get response"
- Check your internet connection
- Verify you have OpenAI API credits
- Check the Expo console for detailed error logs

### Chat not loading context
- Make sure users have completed the foot scan
- Check that shoes are saved to rotation
- Context loads from AsyncStorage automatically

---

## Next Steps

### Enhance the Coach:
1. **Add voice input** - Use Expo's Audio API
2. **Add training plan exports** - Save plans to calendar
3. **Add progress tracking** - Track workouts and give feedback
4. **Add injury analysis** - Upload photos of pain areas
5. **Add race predictions** - Based on training data

### Monetization Ideas:
1. **Free tier**: 5 questions per day
2. **Premium tier**: Unlimited questions + advanced features
3. **In-app purchases**: Specific training plans ($4.99 each)

---

## Support

Need help? Check:
- [OpenAI API Documentation](https://platform.openai.com/docs)
- [Expo Documentation](https://docs.expo.dev)

Happy coaching! 🏃‍♂️
