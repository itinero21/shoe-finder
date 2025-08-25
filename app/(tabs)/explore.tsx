import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  Switch,
  Alert,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

import { getUserPreferences, saveUserPreferences, UserPreferences } from '../utils/storage';

interface SettingItemProps {
  title: string;
  description: string;
  icon: string;
  value?: boolean;
  onToggle?: (value: boolean) => void;
  onPress?: () => void;
  showSwitch?: boolean;
}

const SettingItem: React.FC<SettingItemProps> = ({
  title,
  description,
  icon,
  value,
  onToggle,
  onPress,
  showSwitch = false,
}) => (
  <TouchableOpacity
    onPress={onPress}
    style={styles.settingItem}
    activeOpacity={showSwitch ? 1 : 0.7}
    disabled={showSwitch}
  >
    <View style={styles.settingContent}>
      <View style={styles.settingIcon}>
        <Ionicons name={icon as any} size={20} color="#667eea" />
      </View>
      <View style={styles.settingText}>
        <Text style={styles.settingTitle}>{title}</Text>
        <Text style={styles.settingDescription}>{description}</Text>
      </View>
      {showSwitch && value !== undefined && onToggle && (
        <Switch
          value={value}
          onValueChange={onToggle}
          trackColor={{ false: '#e9ecef', true: '#667eea' }}
          thumbColor={value ? '#ffffff' : '#ffffff'}
        />
      )}
      {!showSwitch && (
        <Ionicons name="chevron-forward" size={16} color="#adb5bd" />
      )}
    </View>
  </TouchableOpacity>
);

export default function SettingsScreen() {
  const [preferences, setPreferences] = useState<UserPreferences>({
    theme: 'auto',
    hapticFeedback: true,
    notifications: true,
  });

  useEffect(() => {
    loadPreferences();
  }, []);

  const loadPreferences = async () => {
    const prefs = await getUserPreferences();
    setPreferences(prefs);
  };

  const updatePreference = async <K extends keyof UserPreferences>(
    key: K,
    value: UserPreferences[K]
  ) => {
    const newPreferences = { ...preferences, [key]: value };
    setPreferences(newPreferences);
    await saveUserPreferences(newPreferences);
    
    if (preferences.hapticFeedback) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const handleAbout = () => {
    Alert.alert(
      'About Shoe Finder',
      'Shoe Finder helps you discover the perfect running or walking shoes based on your unique needs and preferences.\n\nVersion 1.0.0\nBuilt with ❤️ using React Native & Expo'
    );
  };

  const handleFeedback = () => {
    Alert.alert(
      'Send Feedback',
      'Thank you for using Shoe Finder! Your feedback helps us improve the app.'
    );
  };

  const handlePrivacy = () => {
    Alert.alert(
      'Privacy Policy',
      'Your privacy is important to us. All quiz data and preferences are stored locally on your device.'
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Settings</Text>
        <Text style={styles.subtitle}>Customize your Shoe Finder experience</Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Preferences Section */}
        <Animated.View
          entering={FadeInDown.delay(200).springify()}
          style={styles.section}
        >
          <Text style={styles.sectionTitle}>Preferences</Text>
          
          <View style={styles.sectionContent}>
            <SettingItem
              title="Haptic Feedback"
              description="Feel vibrations when interacting with the app"
              icon="phone-portrait-outline"
              value={preferences.hapticFeedback}
              onToggle={(value) => updatePreference('hapticFeedback', value)}
              showSwitch={true}
            />
            
            <SettingItem
              title="Notifications"
              description="Get tips and reminders about your shoes"
              icon="notifications-outline"
              value={preferences.notifications}
              onToggle={(value) => updatePreference('notifications', value)}
              showSwitch={true}
            />
          </View>
        </Animated.View>

        {/* App Info Section */}
        <Animated.View
          entering={FadeInDown.delay(400).springify()}
          style={styles.section}
        >
          <Text style={styles.sectionTitle}>App Info</Text>
          
          <View style={styles.sectionContent}>
            <SettingItem
              title="About"
              description="Learn more about Shoe Finder"
              icon="information-circle-outline"
              onPress={handleAbout}
            />
            
            <SettingItem
              title="Send Feedback"
              description="Help us improve the app"
              icon="chatbubble-outline"
              onPress={handleFeedback}
            />
            
            <SettingItem
              title="Privacy Policy"
              description="How we handle your data"
              icon="shield-checkmark-outline"
              onPress={handlePrivacy}
            />
          </View>
        </Animated.View>

        {/* Stats Card */}
        <Animated.View
          entering={FadeInDown.delay(600).springify()}
          style={styles.statsCard}
        >
          <LinearGradient
            colors={['#667eea', '#764ba2']}
            style={styles.statsGradient}
          >
            <View style={styles.statsContent}>
              <Ionicons name="trophy" size={32} color="white" />
              <Text style={styles.statsTitle}>Thanks for using Shoe Finder!</Text>
              <Text style={styles.statsDescription}>
                Find your perfect shoes and run with confidence
              </Text>
            </View>
          </LinearGradient>
        </Animated.View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Made with ❤️ for runners and walkers</Text>
          <Text style={styles.versionText}>Version 1.0.0</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    backgroundColor: 'white',
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#212529',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#6c757d',
  },
  content: {
    paddingVertical: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#212529',
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  sectionContent: {
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#e9ecef',
  },
  settingItem: {
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f3f4',
  },
  settingContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  settingIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#f8f9ff',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  settingText: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#212529',
    marginBottom: 2,
  },
  settingDescription: {
    fontSize: 14,
    color: '#6c757d',
  },
  statsCard: {
    marginHorizontal: 20,
    marginBottom: 24,
    borderRadius: 16,
    overflow: 'hidden',
  },
  statsGradient: {
    padding: 24,
  },
  statsContent: {
    alignItems: 'center',
  },
  statsTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
    marginTop: 12,
    marginBottom: 8,
    textAlign: 'center',
  },
  statsDescription: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
  },
  footer: {
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  footerText: {
    fontSize: 14,
    color: '#6c757d',
    marginBottom: 4,
  },
  versionText: {
    fontSize: 12,
    color: '#adb5bd',
  },
});
