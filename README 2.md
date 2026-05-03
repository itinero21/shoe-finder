# 🏃 ShoeAI - AI-Powered Running Shoe Intelligence

> **Version 2.0** - Complete redesign with AI foot scanning, smart rotation analysis, and intelligent tracking.

## 🎯 What's New in 2.0

### ✨ Major Features

1. **AI Foot Scanner** 🦶
   - Camera-based foot analysis using Claude API
   - Detects arch type (flat/normal/high)
   - Measures foot width
   - Analyzes pronation pattern
   - Instant personalized recommendations

2. **Smart Rotation Builder** 🎯
   - AI-powered rotation health score
   - Coverage analysis (Easy/Speed/Racing/Trail)
   - Intelligent insights and recommendations
   - Automatic shoe matching based on foot analysis

3. **Mileage Tracking** 📊
   - Visual mileage bars with color-coded status
   - Breaking In → Prime → Warning → Replace
   - Run logging with distance and feel ratings
   - Predictive replacement alerts

4. **Beautiful Modern UI** ✨
   - Clean 3-tab navigation
   - Smooth animations
   - Professional color palette
   - Onboarding flow for new users

## 📱 App Structure

### Tab 1: Scan (AI Scanner)
- **Camera foot scanner** with 3-photo process
- **Quick quiz** as fallback option
- Real-time AI analysis
- Instant recommendations

### Tab 2: My Rotation
- **Rotation health score** with insights
- **Coverage grid** showing gaps
- **Shoe cards** with mileage tracking
- **Log run** functionality
- Recent run history

### Tab 3: Discover
- Browse all 10 shoes in database
- Search by brand/model
- Filter by category (Neutral/Stability/Trail/Racing)
- Add to rotation with one tap

## 🚀 Getting Started

### Prerequisites
- Node.js 16+
- Expo CLI
- iOS Simulator (Mac) or Android emulator
- **Anthropic API access** (Claude)

### Installation

```bash
cd ShoeAI

# Install dependencies
npm install

# Start the app
npm start
```

### Running the App

```bash
# iOS Simulator
npm run ios

# Android Emulator
npm run android

# Web (limited functionality)
npm run web
```

## 🤖 AI Integration Setup

The app uses Claude API for foot analysis. The API is called from the device (no API key needed to be hardcoded).

### How AI Foot Scanning Works

1. **User takes 3 photos**: Side, Top, Back view of foot
2. **Images sent to Claude API** with analysis prompt
3. **Claude analyzes** and returns JSON with:
   - Arch type
   - Foot width
   - Pronation pattern
   - Recommendations
4. **App uses results** to filter and recommend shoes

### AI Service Location
`/src/services/aiService.js`

The service includes:
- `analyzeFootWithAI()` - Main foot scanner
- `analyzeWearPattern()` - Analyze old shoe wear (future)
- `analyzeGaitVideo()` - Video gait analysis (future)

## 👟 Shoe Database

**10 Premium Running Shoes** across 4 categories:

### Neutral Runners
- Saucony Triumph 21
- Saucony Axon 3
- Hoka Bondi 8
- Nike Pegasus 40
- New Balance 1080 v13

### Stability Shoes
- Brooks Adrenaline GTS 23
- Asics Gel-Kayano 30

### Trail Shoes
- Altra Lone Peak 7
- Hoka Speedgoat 5

### Racing Shoes
- On Cloudboom Echo

Each shoe includes:
- Price, weight, drop, cushion level
- Rotation scores (Easy/Long/Speed/Race)
- Arch support compatibility
- Width options
- Best use cases

## 📂 Project Structure

```
ShoeAI/
├── App.js                          # Main app with navigation
├── src/
│   ├── screens/
│   │   ├── ScanScreen.js          # AI camera + quick quiz
│   │   ├── RotationScreen.js      # My shoes + mileage tracking
│   │   ├── DiscoverScreen.js      # Browse/search all shoes
│   │   └── OnboardingScreen.js    # First-time user flow
│   ├── components/
│   │   ├── QuickQuiz.js           # 5-question fallback
│   │   ├── RotationAnalysis.js    # Smart rotation scoring
│   │   └── LogRunModal.js         # Run logging interface
│   ├── services/
│   │   └── aiService.js           # Claude API integration
│   ├── data/
│   │   └── shoeDatabase.js        # 10 shoe catalog
│   └── theme/
│       └── colors.js              # Design system
├── package.json
└── README.md
```

## 🎨 Design System

### Color Palette
- **Primary**: Indigo (#6366F1)
- **Success**: Green (#10B981)
- **Warning**: Orange (#F59E0B)
- **Danger**: Red (#EF4444)
- **Info**: Blue (#3B82F6)

### Status Colors (Mileage)
- 🟢 Breaking In (0-200km)
- 🔵 Prime (200-500km)
- 🟠 Worn (500-700km)
- 🔴 Replace (700+km)

## 💾 Data Storage

Uses AsyncStorage for local persistence:

- `myShoes` - User's shoe rotation
- `runHistory` - All logged runs
- `footAnalysis` - Latest AI scan results
- `hasLaunched` - Onboarding flag

## 🔮 Future Features

### Phase 3: Advanced AI
- [ ] Wear pattern analysis from shoe photos
- [ ] Video gait analysis
- [ ] Predictive injury prevention
- [ ] Training plan integration

### Phase 4: Social & Community
- [ ] Share rotations with friends
- [ ] Community shoe reviews
- [ ] Running club integration
- [ ] Strava/Garmin sync

### Phase 5: Monetization
- [ ] Affiliate links to buy shoes
- [ ] Premium AI coach subscription
- [ ] Brand partnerships
- [ ] Advanced analytics

## 🐛 Known Issues

- Camera requires physical device (doesn't work in simulator)
- AI analysis requires internet connection
- Initial load may be slow (fetching AI response)

## 📝 Development Notes

### Testing AI Scanner
1. Use real device (camera required)
2. Take photos in good lighting
3. Follow on-screen instructions carefully
4. AI takes 3-5 seconds to analyze

### Testing Without Camera
- Use "Take Quick Quiz" option
- Works in simulator/emulator
- Less accurate than camera scan

## 🤝 Contributing

Want to improve ShoeAI? Here's how:

1. Add more shoes to database
2. Improve AI prompts for better accuracy
3. Add new features (Strava sync, etc.)
4. Enhance UI/UX
5. Fix bugs

## 📄 License

MIT License - feel free to use and modify!

## 🙏 Credits

- **AI**: Powered by Anthropic's Claude
- **Icons**: Ionicons
- **Navigation**: React Navigation
- **Shoe Data**: Curated from manufacturer specs

---

**Built with ❤️ for runners who care about their feet**

Need help? Found a bug? Want a feature? Open an issue!
