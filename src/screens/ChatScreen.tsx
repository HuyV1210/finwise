import { StyleSheet, Text, View, TextInput, TouchableOpacity, FlatList, KeyboardAvoidingView, Platform, Alert, ActivityIndicator } from 'react-native'
import React, { useState, useEffect, useRef } from 'react'
import { useNavigation } from '@react-navigation/native';
import { auth } from '../services/firebase';
import { sendMessage, listenForMessages, getBotResponse } from '../services/chat';
import Icon from 'react-native-vector-icons/MaterialIcons';
import LinearGradient from 'react-native-linear-gradient';

import { ChatMessage } from '../services/chat';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  timestamp: Date;
}

export default function Chat() {
  const navigation = useNavigation();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showScrollToBottom, setShowScrollToBottom] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  // Fetch messages from Firestore
  useEffect(() => {
    const user = auth.currentUser;
    if (!user) return;

    setInitialLoading(true);
    const unsubscribe = listenForMessages(user.uid, (chatMessages: ChatMessage[]) => {
      let messages: Message[] = chatMessages.map(msg => ({
        id: msg.id || '',
        text: msg.text,
        sender: msg.sender,
        timestamp: msg.createdAt,
      }));
      // If no messages, show welcome
      if (messages.length === 0) {
        messages = [
          {
            id: 'welcome',
            text: "Hello! I'm your personal finance assistant. I can help you track expenses, analyze spending patterns, and provide financial advice. How can I help you today?",
            sender: 'bot',
            timestamp: new Date(),
          },
        ];
      }
      setMessages(messages);
      setInitialLoading(false);
      setRefreshing(false);
    });
    return unsubscribe;
  }, []);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages]);

  // Show scroll-to-bottom button if user scrolls up
  const handleScroll = (event: any) => {
    const { layoutMeasurement, contentOffset, contentSize } = event.nativeEvent;
    const isAtBottom = layoutMeasurement.height + contentOffset.y >= contentSize.height - 40;
    setShowScrollToBottom(!isAtBottom);
  };

  const handleRefresh = () => {
    setRefreshing(true);
    // The listener will update messages and set refreshing to false
  };

  const handleScrollToBottom = () => {
    flatListRef.current?.scrollToEnd({ animated: true });
  };

  const handleSendMessage = async () => {
    if (!inputText.trim()) return;
    const user = auth.currentUser;
    if (!user) {
      Alert.alert('Error', 'Please log in to send messages');
      return;
    }
    const userMessage = inputText.trim();
    setInputText('');
    setIsLoading(true);
    try {
      await sendMessage(user.uid, userMessage, 'user');
      const botResponse = await getBotResponse(userMessage);
      await sendMessage(user.uid, botResponse, 'bot');
    } catch (error) {
      console.error('Error sending message:', error);
      Alert.alert('Error', 'Failed to send message');
    } finally {
      setIsLoading(false);
    }
  };

  const renderMessage = ({ item }: { item: Message }) => {
    const isUser = item.sender === 'user';
    return (
      <View style={[
        styles.messageContainer,
        isUser ? styles.userMessageContainer : styles.botMessageContainer
      ]}>
        <View style={[
          styles.messageBubble,
          isUser ? styles.userMessageBubble : styles.botMessageBubble
        ]}>
          <Text
            style={[
              styles.messageText,
              isUser ? styles.userMessageText : styles.botMessageText
            ]}
            accessibilityLabel={isUser ? 'Your message' : 'Bot message'}
            testID={isUser ? 'user-message' : 'bot-message'}
          >
            {item.text}
          </Text>
          <Text style={[
            styles.messageTime,
            isUser ? styles.userMessageTime : styles.botMessageTime
          ]}>
            {item.timestamp.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <LinearGradient 
      colors={['#00D09E', '#FFFFFF']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.container}
    >
      <KeyboardAvoidingView 
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>FinWise Assistant</Text>
          <Text style={styles.headerSubtitle}>Your AI financial advisor</Text>
        </View>
        {/* Messages */}
        <View style={styles.messagesContainer}>
          {initialLoading ? (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
              <ActivityIndicator size="large" color="#00B88D" />
              <Text style={{ color: '#00B88D', marginTop: 12 }}>Loading chat...</Text>
            </View>
          ) : (
            <FlatList
              ref={flatListRef}
              data={messages}
              renderItem={renderMessage}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.messagesList}
              showsVerticalScrollIndicator={false}
              onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
              onScroll={handleScroll}
              scrollEventThrottle={16}
              refreshing={refreshing}
              onRefresh={handleRefresh}
              ListEmptyComponent={
                <View style={{ alignItems: 'center', marginTop: 40 }}>
                  <Icon name="chat-bubble-outline" size={64} color="#DDD" />
                  <Text style={{ color: '#999', fontSize: 16, marginTop: 12 }}>No messages yet. Start the conversation!</Text>
                </View>
              }
            />
          )}
          {showScrollToBottom && (
            <TouchableOpacity
              style={styles.scrollToBottomButton}
              onPress={handleScrollToBottom}
              accessibilityLabel="Scroll to bottom"
              testID="scroll-to-bottom"
            >
              <Icon name="arrow-downward" size={24} color="#fff" />
            </TouchableOpacity>
          )}
        </View>
        {/* Input */}
        <View style={styles.inputContainer}>
          <View style={styles.inputRow}>
            <TextInput
              style={styles.textInput}
              placeholder="Ask me about your finances..."
              placeholderTextColor="#999"
              value={inputText}
              onChangeText={setInputText}
              multiline
              maxLength={1000}
              editable={!isLoading}
              accessibilityLabel="Message input"
              testID="chat-input"
            />
            <TouchableOpacity
              style={[styles.sendButton, (!inputText.trim() || isLoading) && styles.sendButtonDisabled]}
              onPress={handleSendMessage}
              disabled={!inputText.trim() || isLoading}
              accessibilityLabel="Send message"
              testID="send-button"
            >
              {isLoading ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Icon name="send" size={20} color="#FFFFFF" />
              )}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFFFFF',
    fontFamily: 'Poppins-Bold',
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#FFFFFF',
    opacity: 0.9,
    fontFamily: 'Poppins-Regular',
  },
  messagesContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  messagesList: {
    padding: 16,
  },
  messageContainer: {
    marginBottom: 16,
  },
  userMessageContainer: {
    alignItems: 'flex-end',
  },
  botMessageContainer: {
    alignItems: 'flex-start',
  },
  messageBubble: {
    maxWidth: '80%',
    borderRadius: 16,
    padding: 12,
  },
  userMessageBubble: {
    backgroundColor: '#00B88D',
    borderBottomRightRadius: 4,
  },
  botMessageBubble: {
    backgroundColor: '#F0F0F0',
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 20,
    fontFamily: 'Poppins-Regular',
  },
  userMessageText: {
    color: '#FFFFFF',
  },
  botMessageText: {
    color: '#333',
  },
  messageTime: {
    fontSize: 12,
    marginTop: 4,
    fontFamily: 'Poppins-Regular',
  },
  userMessageTime: {
    color: '#FFFFFF',
    opacity: 0.8,
  },
  botMessageTime: {
    color: '#666',
  },
  inputContainer: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 12,
  },
  textInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    fontFamily: 'Poppins-Regular',
    maxHeight: 100,
  },
  sendButton: {
    backgroundColor: '#00B88D',
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#00B88D',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  sendButtonDisabled: {
    backgroundColor: '#CCC',
    shadowOpacity: 0,
    elevation: 0,
  },
  scrollToBottomButton: {
    position: 'absolute',
    right: 24,
    bottom: 32,
    backgroundColor: '#00B88D',
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#00B88D',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
    zIndex: 10,
  },
});