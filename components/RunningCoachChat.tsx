import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { sendRunningCoachMessage, getStarterQuestions, ChatMessage, RunningCoachContext } from '../app/services/openai';

interface RunningCoachChatProps {
  context?: RunningCoachContext;
}

export default function RunningCoachChat({ context }: RunningCoachChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);
  const starterQuestions = getStarterQuestions();

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    scrollViewRef.current?.scrollToEnd({ animated: true });
  }, [messages]);

  const handleSend = async (messageText?: string) => {
    const textToSend = messageText || inputText.trim();
    if (!textToSend || isLoading) return;

    // Add user message
    const userMessage: ChatMessage = { role: 'user', content: textToSend };
    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setIsLoading(true);

    try {
      // Get AI response
      const response = await sendRunningCoachMessage(
        [...messages, userMessage],
        context
      );

      // Add assistant message
      const assistantMessage: ChatMessage = { role: 'assistant', content: response };
      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      // Add error message
      const errorMessage: ChatMessage = {
        role: 'assistant',
        content: error instanceof Error ? error.message : 'Sorry, something went wrong. Please try again.',
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStarterQuestion = (question: string) => {
    handleSend(question);
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={100}
    >
      <ScrollView
        ref={scrollViewRef}
        style={styles.messagesContainer}
        contentContainerStyle={styles.messagesContent}
      >
        {messages.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>AI COACH.</Text>
            <Text style={styles.emptySubtitle}>
              Ask about training plans, shoe selection, injury prevention, or race prep.
            </Text>

            <View style={styles.starterQuestions}>
              <Text style={styles.starterTitle}>// SUGGESTED QUERIES</Text>
              {starterQuestions.slice(0, 3).map((question, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.starterButton}
                  onPress={() => handleStarterQuestion(question)}
                >
                  <Text style={styles.starterText}>{question}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {messages.map((message, index) => (
          <View
            key={index}
            style={[
              styles.messageBubble,
              message.role === 'user' ? styles.userBubble : styles.assistantBubble,
            ]}
          >
            {message.role === 'assistant' && (
              <Text style={styles.assistantIcon}>→</Text>
            )}
            <View style={styles.messageContent}>
              <Text
                style={[
                  styles.messageText,
                  message.role === 'user' ? styles.userText : styles.assistantText,
                ]}
              >
                {message.content}
              </Text>
            </View>
          </View>
        ))}

        {isLoading && (
          <View style={[styles.messageBubble, styles.assistantBubble]}>
            <Text style={styles.assistantIcon}>→</Text>
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color="#FF3D00" />
              <Text style={styles.loadingText}>PROCESSING...</Text>
            </View>
          </View>
        )}
      </ScrollView>

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          value={inputText}
          onChangeText={setInputText}
          placeholder="Ask about training, shoes, or running..."
          placeholderTextColor="#94a3b8"
          multiline
          maxLength={500}
          editable={!isLoading}
        />
        <TouchableOpacity
          style={[styles.sendButton, (!inputText.trim() || isLoading) && styles.sendButtonDisabled]}
          onPress={() => handleSend()}
          disabled={!inputText.trim() || isLoading}
        >
          <Text style={styles.sendButtonText}>Send</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F4F1EA',
  },
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    padding: 16,
    paddingBottom: 8,
  },
  emptyState: {
    alignItems: 'flex-start',
    paddingTop: 40,
    paddingHorizontal: 4,
  },
  emptyIcon: {
    fontSize: 40,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 26,
    fontWeight: '900',
    color: '#0A0A0A',
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  emptySubtitle: {
    fontFamily: 'SpaceMono',
    fontSize: 11,
    color: 'rgba(10,10,10,0.5)',
    marginBottom: 32,
    lineHeight: 18,
    letterSpacing: 0.2,
  },
  starterQuestions: {
    width: '100%',
  },
  starterTitle: {
    fontFamily: 'SpaceMono',
    fontSize: 10,
    color: 'rgba(10,10,10,0.4)',
    marginBottom: 12,
    letterSpacing: 2,
  },
  starterButton: {
    backgroundColor: '#F4F1EA',
    padding: 14,
    borderRadius: 2,
    marginBottom: 10,
    borderWidth: 2,
    borderColor: '#0A0A0A',
  },
  starterText: {
    fontFamily: 'SpaceMono',
    fontSize: 12,
    color: '#0A0A0A',
    lineHeight: 18,
    letterSpacing: 0.2,
  },
  messageBubble: {
    flexDirection: 'row',
    marginBottom: 16,
    maxWidth: '85%',
  },
  userBubble: {
    alignSelf: 'flex-end',
    flexDirection: 'row-reverse',
  },
  assistantBubble: {
    alignSelf: 'flex-start',
  },
  assistantIcon: {
    fontSize: 18,
    marginRight: 8,
    marginTop: 6,
  },
  messageContent: {
    flex: 1,
  },
  messageText: {
    fontSize: 14,
    lineHeight: 21,
  },
  userText: {
    backgroundColor: '#0A0A0A',
    color: '#F4F1EA',
    padding: 12,
    borderRadius: 2,
    overflow: 'hidden',
    fontFamily: 'SpaceMono',
    fontSize: 12,
    lineHeight: 18,
  },
  assistantText: {
    backgroundColor: '#F4F1EA',
    color: '#0A0A0A',
    padding: 12,
    borderRadius: 2,
    borderWidth: 2,
    borderColor: '#0A0A0A',
    overflow: 'hidden',
    fontSize: 14,
    lineHeight: 21,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F4F1EA',
    padding: 12,
    borderRadius: 2,
    borderWidth: 2,
    borderColor: '#0A0A0A',
  },
  loadingText: {
    marginLeft: 8,
    fontFamily: 'SpaceMono',
    fontSize: 11,
    color: 'rgba(10,10,10,0.5)',
    letterSpacing: 1,
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#F4F1EA',
    borderTopWidth: 2,
    borderTopColor: '#0A0A0A',
    alignItems: 'flex-end',
    gap: 10,
  },
  input: {
    flex: 1,
    backgroundColor: 'rgba(10,10,10,0.05)',
    borderRadius: 2,
    borderWidth: 2,
    borderColor: '#0A0A0A',
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 13,
    maxHeight: 100,
    color: '#0A0A0A',
    fontFamily: 'SpaceMono',
  },
  sendButton: {
    backgroundColor: '#0A0A0A',
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 2,
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#0A0A0A',
  },
  sendButtonDisabled: {
    backgroundColor: 'rgba(10,10,10,0.15)',
    borderColor: 'rgba(10,10,10,0.15)',
  },
  sendButtonText: {
    fontFamily: 'SpaceMono',
    color: '#F4F1EA',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
  },
});
