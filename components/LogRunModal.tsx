import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, Modal, StyleSheet, TouchableOpacity } from 'react-native';
import Animated, { SlideInUp, FadeIn } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing } from '../app/theme';
import { saveRun } from '../app/utils/runStorage';
import { Run } from '../app/types/run';

interface LogRunModalProps {
  visible: boolean;
  shoeId: string;
  shoeName: string;
  onClose: () => void;
  onSaved: () => void;
}

export function LogRunModal({ visible, shoeId, shoeName, onClose, onSaved }: LogRunModalProps) {
  const [distance, setDistance] = useState('');
  const [notes, setNotes] = useState('');
  const [feel, setFeel] = useState<1 | 2 | 3 | undefined>(undefined);
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    if (!distance || Number(distance) <= 0) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }

    setIsSaving(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    const run: Run = {
      id: `run_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      shoeId,
      distanceKm: Number(distance),
      date: new Date().toISOString(),
      notes: notes.trim() || undefined,
      feel,
    };

    try {
      await saveRun(run);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      // Reset form
      setDistance('');
      setNotes('');
      setFeel(undefined);

      onSaved();
      onClose();
    } catch (error) {
      console.error('Error saving run:', error);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleFeelSelect = (selectedFeel: 1 | 2 | 3) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setFeel(feel === selectedFeel ? undefined : selectedFeel);
  };

  const feelOptions = [
    { value: 1 as const, emoji: '😵', label: 'Dead', color: Colors.danger },
    { value: 2 as const, emoji: '👍', label: 'Okay', color: Colors.warning },
    { value: 3 as const, emoji: '🔥', label: 'Fresh', color: Colors.success },
  ];

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable style={styles.overlay} onPress={onClose}>
        <Animated.View
          entering={SlideInUp.duration(300).springify()}
          style={styles.modalContainer}
        >
          <Pressable onPress={(e) => e.stopPropagation()}>
            {/* Header */}
            <View style={styles.header}>
              <View>
                <Text style={styles.title}>Log Run</Text>
                <Text style={styles.subtitle}>{shoeName}</Text>
              </View>
              <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                <Ionicons name="close" size={24} color={Colors.textSecondary} />
              </TouchableOpacity>
            </View>

            {/* Distance Input */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Distance (km)</Text>
              <TextInput
                placeholder="e.g., 5.2"
                keyboardType="decimal-pad"
                value={distance}
                onChangeText={setDistance}
                style={styles.input}
                placeholderTextColor={Colors.textTertiary}
              />
            </View>

            {/* How did it feel? */}
            <View style={styles.feelContainer}>
              <Text style={styles.label}>How did the shoes feel?</Text>
              <View style={styles.feelOptions}>
                {feelOptions.map((option) => (
                  <Pressable
                    key={option.value}
                    onPress={() => handleFeelSelect(option.value)}
                    style={[
                      styles.feelOption,
                      feel === option.value && {
                        backgroundColor: option.color + '20',
                        borderColor: option.color,
                        borderWidth: 2,
                      },
                    ]}
                  >
                    <Text style={styles.feelEmoji}>{option.emoji}</Text>
                    <Text style={[
                      styles.feelLabel,
                      feel === option.value && { color: option.color, fontWeight: '600' }
                    ]}>
                      {option.label}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>

            {/* Notes Input */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Notes (optional)</Text>
              <TextInput
                placeholder="How was the run?"
                value={notes}
                onChangeText={setNotes}
                style={[styles.input, styles.notesInput]}
                placeholderTextColor={Colors.textTertiary}
                multiline
                numberOfLines={2}
              />
            </View>

            {/* Save Button */}
            <Pressable
              onPress={handleSave}
              disabled={isSaving}
              style={[
                styles.saveButton,
                isSaving && styles.saveButtonDisabled,
              ]}
            >
              <Text style={styles.saveButtonText}>
                {isSaving ? 'Saving...' : 'Save Run'}
              </Text>
              <Ionicons name="checkmark-circle" size={20} color="white" />
            </Pressable>
          </Pressable>
        </Animated.View>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: Colors.card,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: Spacing.lg,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.lg,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  subtitle: {
    fontSize: 15,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  closeButton: {
    padding: 4,
  },
  inputContainer: {
    marginBottom: Spacing.md,
  },
  label: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
  },
  input: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 14,
    padding: 14,
    fontSize: 16,
    color: Colors.textPrimary,
    backgroundColor: Colors.background,
  },
  notesInput: {
    height: 80,
    textAlignVertical: 'top',
  },
  feelContainer: {
    marginBottom: Spacing.md,
  },
  feelOptions: {
    flexDirection: 'row',
    gap: 10,
  },
  feelOption: {
    flex: 1,
    alignItems: 'center',
    padding: 12,
    borderRadius: 14,
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  feelEmoji: {
    fontSize: 28,
    marginBottom: 4,
  },
  feelLabel: {
    fontSize: 13,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  saveButton: {
    backgroundColor: Colors.accent,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 16,
    marginTop: Spacing.sm,
    gap: 8,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});
