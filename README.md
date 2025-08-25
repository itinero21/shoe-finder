# 👟 Shoe Finder

A modern React Native app built with Expo that helps users find the perfect running or walking shoes based on their individual needs and preferences.

## ✨ Features

- **🎯 Smart Quiz System** - Multi-step questionnaire with progress tracking
- **🔍 Advanced Search & Filter** - Find shoes by brand, category, stability, and more
- **❤️ Favorites Management** - Save and organize your preferred shoes
- **📱 Modern UI/UX** - Beautiful animations, gradients, and card-based design
- **📊 Personalized Recommendations** - AI-powered scoring algorithm
- **📜 Quiz History** - Track past quiz results and recommendations
- **💡 Daily Tips** - Rotating tips for injury prevention and shoe care
- **👥 Community Polls** - See what other runners prefer
- **⚙️ Settings & Preferences** - Customize your app experience

## 🚀 Quick Start

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Start the development server**
   ```bash
   npx expo start
   ```

3. **Open the app**
   - **Web**: Visit `http://localhost:8081` in your browser
   - **Mobile**: Scan the QR code with Expo Go app
   - **iOS Simulator**: Press `i` in the terminal
   - **Android Emulator**: Press `a` in the terminal

## 📱 App Structure

### Tabs Navigation
- **Quiz** - Take the smart shoe recommendation quiz
- **Search** - Browse and filter the complete shoe database
- **Favorites** - View saved shoes with persistent storage
- **History** - Review past quiz results and recommendations
- **Settings** - Customize app preferences and view information

### Core Components
- **Quiz Component** - Multi-step form with smooth animations
- **ShoeCard Component** - Detailed shoe cards with specs and actions
- **Search & Filter** - Advanced filtering with modal interface

### Data & Logic
- **Shoe Database** - 12+ shoes from major brands (Nike, Brooks, Hoka, etc.)
- **Scoring Algorithm** - Intelligent matching based on user preferences
- **AsyncStorage Integration** - Persistent favorites and settings

## 🛠 Technologies

- **React Native** & **Expo Router** for navigation
- **TypeScript** for type safety
- **React Native Reanimated** for smooth animations
- **AsyncStorage** for data persistence
- **Expo Haptics** for tactile feedback
- **Linear Gradients** for modern UI design

## 📂 Project Structure

```
shoe-finder/
├── app/
│   ├── (tabs)/              # Tab-based screens
│   │   ├── index.tsx        # Quiz screen
│   │   ├── search.tsx       # Search & filter
│   │   ├── favorites.tsx    # Saved shoes
│   │   ├── history.tsx      # Quiz history
│   │   └── explore.tsx      # Settings
│   ├── data/
│   │   └── shoes.ts         # Shoe database & tips
│   └── utils/
│       ├── scoring.ts       # Recommendation algorithm
│       └── storage.ts       # AsyncStorage utilities
├── components/
│   ├── Quiz.tsx             # Multi-step quiz component
│   ├── ShoeCard.tsx         # Shoe display cards
│   └── ui/                  # UI components
└── assets/                  # Images and fonts
```

## 🎨 Design Features

- **Modern gradient backgrounds** with glassmorphism effects
- **Smooth page transitions** using React Native Reanimated
- **Card-based UI** with shadows and rounded corners
- **Haptic feedback** for enhanced user experience
- **Progressive loading** with staggered animations
- **Responsive design** that works on all screen sizes

## 🔧 Development

### Linting & Type Checking
```bash
npm run lint          # ESLint check
npx tsc --noEmit      # TypeScript check
```

### Clear Cache
```bash
npx expo start --clear    # Clear Metro cache
```

Built with ❤️ using React Native & Expo
