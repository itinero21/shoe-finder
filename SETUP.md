# 🚀 Quick Setup Guide

## Step 1: Install Dependencies

```bash
cd ShoeAI
npm install
```

## Step 2: Start the Development Server

```bash
npm start
```

This will open Expo DevTools in your browser.

## Step 3: Run on Device/Emulator

### For iOS (Mac only):
```bash
# Press 'i' in the terminal
# OR
npm run ios
```

### For Android:
```bash
# Press 'a' in the terminal  
# OR
npm run android
```

### For Physical Device:
1. Install "Expo Go" app on your phone
2. Scan the QR code from the terminal

## Step 4: Test the AI Scanner

**Important**: The AI camera scanner requires:
- A **physical device** (won't work in simulator)
- **Camera permissions** (app will request on first use)
- **Internet connection** (for Claude API)

### Without a physical device?
Use the **Quick Quiz** option instead - it works in simulators!

## 🎯 First Run Checklist

1. ✅ You'll see an onboarding screen (3 slides)
2. ✅ Choose "AI Scan" or "Quick Quiz"
3. ✅ Get shoe recommendations
4. ✅ Add shoes to your rotation
5. ✅ Log your first run

## 🐛 Troubleshooting

### "Camera not working"
- Make sure you're on a physical device
- Check camera permissions in Settings
- Restart the app

### "AI analysis failed"
- Check internet connection
- Use Quick Quiz as backup
- AI takes 3-5 seconds - be patient!

### "Module not found"
```bash
# Clear cache and reinstall
rm -rf node_modules
npm install
npm start --clear
```

### "Expo version mismatch"
```bash
# Update Expo CLI
npm install -g expo-cli@latest
```

## 📱 Device Requirements

- **iOS**: iPhone 8 or newer, iOS 13+
- **Android**: Android 6.0+
- **Camera**: Required for AI scanning
- **Internet**: Required for AI features

## 🔑 API Configuration

The app uses Claude API for AI features. The API calls are made directly from the device to:
```
https://api.anthropic.com/v1/messages
```

**No API key configuration needed** - the service handles authentication.

## 🎨 Customization

### Change Primary Color
Edit `/src/theme/colors.js`:
```javascript
primary: '#YOUR_COLOR_HERE'
```

### Add More Shoes
Edit `/src/data/shoeDatabase.js` and add new shoe objects.

### Modify AI Prompts
Edit `/src/services/aiService.js` to customize what the AI analyzes.

## 📚 Key Files to Know

- `App.js` - Main app entry point
- `src/screens/ScanScreen.js` - AI camera + quiz
- `src/screens/RotationScreen.js` - My shoes + tracking
- `src/services/aiService.js` - Claude AI integration
- `src/data/shoeDatabase.js` - Shoe catalog

## 🎉 You're Ready!

Start the app and explore:
1. Scan your feet with AI
2. Build your rotation
3. Track your miles
4. Get smart insights

Happy running! 🏃‍♂️💨
