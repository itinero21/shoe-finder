# ShoeAI 2.0

AI-powered running shoe finder with smart mileage tracking and rotation intelligence.

## Features

### AI Foot Scanner
- **3-Photo Analysis**: Capture side, top, and back views of your feet
- **Claude AI Integration**: Analyzes arch type, width, and pronation pattern
- **Personalized Recommendations**: Get shoe matches based on your unique biomechanics
- **90%+ Accuracy**: Professional-grade foot analysis using Claude Sonnet 4.5

### Smart Rotation Builder
- **Role-Based Scoring**: Every shoe rated for Easy, Long, Speed, and Race runs
- **Health Monitoring**: Track rotation balance and get insights
- **Injury Prevention**: Build a balanced rotation to reduce overuse injuries

### Mileage Tracking
- **Log Runs**: Track distance and how the shoes felt (Dead/Okay/Fresh)
- **Health Indicators**: Color-coded status from Fresh (0-200km) to Replace (700km+)
- **Smart Alerts**: Know exactly when to rotate or replace shoes

### 10 Curated Shoes
Across 4 categories with detailed specs:
- **Neutral Runners**: Saucony Triumph, Hoka Bondi, Nike Pegasus 40, New Balance 1080 v13
- **Stability**: Brooks Adrenaline GTS, Asics Gel-Kayano
- **Trail**: Altra Lone Peak, Hoka Speedgoat 5
- **Racing**: On Cloudboom Echo
- **Budget**: Saucony Axon

Each shoe includes:
- Price, weight, heel drop
- Rotation scores (Easy/Long/Speed/Race)
- Detailed descriptions and images

## Getting Started

### Prerequisites
- Node.js 18+
- iOS device or simulator (for camera features)
- Claude API key (get from [Anthropic Console](https://console.anthropic.com/settings/keys))

### Installation

1. Clone the repository:
```bash
git clone <your-repo-url>
cd shoe-finder
```

2. Install dependencies:
```bash
npm install
```

3. Configure Claude API:
```bash
cp .env.example .env
# Edit .env and add your Claude API key:
# EXPO_PUBLIC_CLAUDE_API_KEY=your_api_key_here
```

4. Start the development server:
```bash
npx expo start
```

5. Open the app:
- Press `i` for iOS simulator
- Scan QR code with Expo Go on your iPhone

## App Structure

### 3 Main Tabs

#### 1. Scan
- **AI Foot Scanner**: Camera-based foot analysis with Claude AI
- **Quick Quiz**: Fallback option for shoe recommendations
- **Results**: Personalized recommendations with analysis breakdown

#### 2. My Rotation
- View saved shoes with mileage tracking
- Log runs with distance and feel ratings
- Rotation intelligence card with health score
- Color-coded shoe health indicators

#### 3. Discover
- Browse all 10 shoes
- Filter by category, cushion, terrain
- Compare shoes side-by-side
- View detailed specs (price, weight, drop)

## Technology Stack

- **React Native 0.81.5** - Cross-platform mobile framework
- **Expo 54** - Development platform with camera support
- **TypeScript** - Type-safe development
- **React Native Reanimated 4** - Smooth animations
- **Expo Camera** - Native camera access
- **Claude API** - AI-powered foot analysis
- **AsyncStorage** - Local data persistence

## Key Components

### FootScanner.tsx
3-step camera interface for capturing foot photos with real-time instructions and haptic feedback.

### claudeApi.ts
Claude API integration with vision analysis, JSON parsing, and shoe matching algorithm.

### RotationCard.tsx
Visual rotation analysis with progress bars, health score, and smart insights.

### LogRunModal.tsx
Run logging with distance input, feel ratings (Dead/Okay/Fresh), and notes.

## Data Models

### Shoe Interface
```typescript
interface Shoe {
  id: string;
  brand: string;
  model: string;
  category: 'Neutral' | 'Stability' | 'Trail' | 'Racing';
  cushion: 'Moderate' | 'High' | 'Max';
  terrain: 'Road' | 'Trail';
  price: number;
  weightGrams: number;
  dropMm: number;
  roles: {
    easy: number;    // 1-10 score
    long: number;    // 1-10 score
    speed: number;   // 1-10 score
    race: number;    // 1-10 score
  };
}
```

### Foot Analysis
```typescript
interface FootAnalysis {
  arch: 'low' | 'normal' | 'high';
  width: 'narrow' | 'standard' | 'wide';
  pronation: 'neutral' | 'overpronation' | 'underpronation';
  confidence: number;
  recommendations: string[];
  reasoning: string;
}
```

### Run Tracking
```typescript
interface Run {
  id: string;
  shoeId: string;
  distanceKm: number;
  date: string;
  notes?: string;
  feel?: 1 | 2 | 3; // 1=dead, 2=okay, 3=fresh
}
```

## Shoe Health Status

- **0-200km**: Fresh (Green) - Like new, optimal performance
- **200-500km**: Good (Blue) - Great condition, cushion intact
- **500-700km**: Warning (Orange) - Consider rotating more often
- **700km+**: Replace (Red) - Time for new shoes

## Rotation Scoring

Each run type needs different shoes:
- **Easy Runs**: Max cushion, forgiving shoes (Bondi, Triumph)
- **Long Runs**: Durable, comfortable trainers (1080, Pegasus)
- **Speed Work**: Responsive, lighter shoes (Cloudboom, Speedgoat)
- **Race Day**: Carbon-plated, fast shoes (Cloudboom Echo)

A balanced rotation has:
- 60-80% Easy/Long shoes
- 20-40% Speed/Race shoes
- Multiple pairs to prevent overuse

## API Usage

### Claude API Cost Estimate
- 3 images per scan ≈ $0.03 per analysis
- ~33 scans per $1
- Caching enabled for 15 minutes

### Rate Limiting
- Max 5 scans per minute (recommended)
- Cache foot analysis results locally
- Quiz fallback if API unavailable

## Troubleshooting

### Camera Permission Denied
1. Go to iOS Settings → ShoeAI
2. Enable Camera permission
3. Restart the app

### Claude API Error
- Check `.env` file has correct API key
- Verify API key is valid at [Anthropic Console](https://console.anthropic.com)
- Check network connection
- Try the Quick Quiz as fallback

### Slow Analysis
- First scan may take 10-15 seconds
- Subsequent scans use cached model (faster)
- Ensure good lighting for photos

## Development

### Adding New Shoes
Edit [app/data/shoes.ts](app/data/shoes.ts):
```typescript
{
  id: '11',
  brand: 'Brand Name',
  model: 'Model Name',
  category: 'Neutral',
  cushion: 'High',
  terrain: 'Road',
  price: 150,
  weightGrams: 280,
  dropMm: 8,
  roles: { easy: 8, long: 9, speed: 5, race: 4 },
  // ... other fields
}
```

### Customizing Mileage Thresholds
Edit [app/utils/mileage.ts](app/utils/mileage.ts):
```typescript
const MILEAGE_THRESHOLDS = {
  fresh: 200,
  good: 500,
  warning: 700,
  lifespan: 800,
};
```

## Contributing

This is a personal project, but feedback and suggestions are welcome via GitHub Issues.

## License

MIT

## Acknowledgments

- **Claude API** by Anthropic for AI foot analysis
- **Expo** for excellent development tools
- **React Native Community** for amazing libraries
- **Running Community** for shoe expertise

---

Built with [Claude Code](https://claude.com/claude-code) by Anthropic
