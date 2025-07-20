import { KeyboardAvoidingView, Platform, StyleSheet, Text, View, TouchableOpacity, Alert, FlatList, ActivityIndicator, TextInput, NativeSyntheticEvent, NativeScrollEvent } from 'react-native';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import LinearGradient from 'react-native-linear-gradient';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { auth } from '../../services/firebase';
import { getBotResponse, sendMessage, listenForMessages, ChatMessage, testFirebaseConnection } from './chat';
import Icon from 'react-native-vector-icons/Ionicons';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  timestamp: Date;
}

export default function ChatScreen () {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [expandedMessages, setExpandedMessages] = useState<{ [id: string]: boolean }>({});
  const [showScrollToBottom, setShowScrollToBottom] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const flatListRef = useRef<FlatList>(null);
  const unsubscribeRef = useRef<(() => void) | null>(null);
  
  // Get current date and time, formatted
  const now = useMemo(() => {
    const date = new Date();
    const options: Intl.DateTimeFormatOptions = {
      year: 'numeric', month: 'short', day: 'numeric',
      hour: '2-digit', minute: '2-digit',
    };
    return date.toLocaleString(undefined, options);
  }, []);

  // Load messages when component mounts
  useEffect(() => {
    const user = auth.currentUser;
    if (!user) {
      setInitialLoading(false);
      return;
    }
    // Listen for real-time message updates
    const unsubscribe = listenForMessages(user.uid, (chatMessages: ChatMessage[]) => {
      const formattedMessages: Message[] = chatMessages.map(msg => ({
        id: msg.id || '',
        text: msg.text,
        sender: msg.sender,
        timestamp: msg.createdAt,
      }));
      setMessages(formattedMessages);
      setInitialLoading(false);
      // Auto scroll to bottom when new messages arrive
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    });
    unsubscribeRef.current = unsubscribe;
    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }
    };
  }, []);

  // Handle scroll events
  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const { contentOffset, contentSize, layoutMeasurement } = event.nativeEvent;
    const isScrolledUp = contentOffset.y < contentSize.height - layoutMeasurement.height - 100;
    setShowScrollToBottom(isScrolledUp);
  };

  // Handle refresh
  const handleRefresh = () => {
    setRefreshing(true);
    // Simulate refresh delay
    setTimeout(() => {
      setRefreshing(false);
    }, 1000);
  };

  // Scroll to bottom
  const handleScrollToBottom = () => {
    flatListRef.current?.scrollToEnd({ animated: true });
    setShowScrollToBottom(false);
  };

  // Toggle message expansion
  const toggleMessageExpansion = (messageId: string) => {
    setExpandedMessages(prev => ({
      ...prev,
      [messageId]: !prev[messageId]
    }));
  };

  const handleSendMessage = async () => {
    if (!inputText.trim()) return;
    
    const user = auth.currentUser;
    if (!user) {
      Alert.alert('Error', 'Please log in to send messages');
      return;
    }
    
    const userMessage = inputText.trim();
    const tempMessageId = Date.now().toString();
    
    // Add user message immediately to UI
    const userMsg: Message = {
      id: tempMessageId,
      text: userMessage,
      sender: 'user',
      timestamp: new Date(),
    };
    
    setMessages(prev => [...prev, userMsg]);
    setInputText('');
    setIsLoading(true);
    
    // Scroll to bottom
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 100);
    
    try {
      // Send user message to Firebase
      await sendMessage(user.uid, userMessage, 'user');
      
      // Get bot response
      const botResponse = await getBotResponse(userMessage);
      
      // Send bot response to Firebase
      await sendMessage(user.uid, botResponse, 'bot');
      
    } catch (error) {
      //
      Alert.alert('Error', 'Failed to send message');
      
      // Remove the temporary message on error
      setMessages(prev => prev.filter(msg => msg.id !== tempMessageId));
    } finally {
      setIsLoading(false);
    }
  };

  const renderMessage = ({ item } : {item: Message}) => {
    const isUser = item.sender === 'user';
    const lines = item.text.split(/\n+/);
    const expanded = expandedMessages[item.id || ''] || false;
    const linesToShow = expanded ? lines : lines.slice(0, 8);
    const shouldShowExpand = lines.length > 8;

    return (
      <View style={[
        styles.messageBubbleContainer,
        isUser ? styles.userMessageContainer : styles.botMessageContainer,
      ]}>
        <View style={[
          styles.messageBubble,
          isUser ? styles.userMessageBubble : styles.botMessageBubble,
        ]}>
          {linesToShow.map((line, idx) => (
            <Text
              key={idx}
              style={[styles.messageText, isUser ? styles.userMessageText : styles.botMessageText]}
              numberOfLines={0}
            >
              {line}
            </Text>
          ))}
          {shouldShowExpand && (
            <TouchableOpacity 
              onPress={() => toggleMessageExpansion(item.id)}
              style={styles.expandButton}
            >
              <Text style={[styles.expandText, isUser ? styles.userExpandText : styles.botExpandText]}>
                {expanded ? 'Show less' : 'Show more'}
              </Text>
            </TouchableOpacity>
          )}
        </View>
        {isUser && (
          <Text style={styles.timestamp}>
            {item.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </Text>
        )}
      </View>
    );
  };

  // Handler for new chat button
  const handleNewChat = async () => {
    const user = auth.currentUser;
    if (!user) {
      Alert.alert('Error', 'Please log in to start a new chat');
      return;
    }
    Alert.alert(
      'New Chat',
      'Are you sure you want to start a new chat? This will clear the current conversation.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Start New Chat',
          style: 'destructive',
          onPress: async () => {
            try {
              // Dynamically import Firestore functions to avoid circular deps
              const { collection, query, where, getDocs, deleteDoc } = await import('firebase/firestore');
              const { firestore } = await import('../../services/firebase');
              // Query all chat docs for this user
              const q = query(collection(firestore, 'chats'), where('userId', '==', user.uid));
              const snapshot = await getDocs(q);
              const batchDeletes: Promise<void>[] = [];
              snapshot.forEach(docSnap => {
                batchDeletes.push(deleteDoc(docSnap.ref));
              });
              await Promise.all(batchDeletes);
            } catch (err) {
              Alert.alert('Error', 'Failed to clear chat history.');
            }
            setMessages([]);
            setExpandedMessages({});
            setInputText('');
          }
        }
      ]
    );
  };

  // Test Firebase connection
  const handleTestConnection = async () => {
    //
    await testFirebaseConnection();
  };

  return (
    <LinearGradient
      colors={['#00D09E', '#FFFFFF']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={{ flex: 1 }}
    >
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 80 : 0}
      >
        <View>
          <View style={styles.header}>
            <View style={styles.headerContent}>
              {/* Bot Avatar */}
              <View style={styles.avatarContainer}>
                <View style={styles.avatarCircle}>
                  <Text style={styles.avatarText}>🤖</Text>
                </View>
              </View>
              {/* Name and Status */}
              <View style={styles.headerTextContainer}>
                <Text style={styles.headerTitle}>FinWise Bot</Text>
                <Text style={styles.headerStatus}>Active now</Text>
              </View>
              {/* New Chat Icon */}
              <TouchableOpacity style={styles.newChatButton} onPress={handleNewChat}>
                <Ionicons name="chatbubble-ellipses-outline" size={28} color="#fff" />
              </TouchableOpacity>
            </View>
          </View>
        </View>
        {/* Date/Time below header */}
        <View style={styles.dateTimeContainer}>
          <Text style={styles.dateTimeText}>{now}</Text>
        </View>
        {/* Message Container */}
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
              onScroll={handleScroll}
              scrollEventThrottle={16}
              refreshing={refreshing}
              onRefresh={handleRefresh}
              keyboardShouldPersistTaps="handled"
              removeClippedSubviews={false}
              ListEmptyComponent={() => (
                <View style={styles.emptyContainer}>
                  <Text style={styles.placeholderText}>
                    👋 Hi! I'm FinWise Bot. Ask me anything about personal finance, budgeting, saving, or investing!
                  </Text>
                </View>
              )}
            />
          )}
          {showScrollToBottom && (
            <TouchableOpacity
              style={styles.scrollToBottomButton}
              onPress={handleScrollToBottom}
            >
              <Icon name="arrow-downward" size={24} color="#fff" />
            </TouchableOpacity>
          )}
        </View>

        {/* Input Container */}
        <View style={styles.inputContainer}>
          <View style={styles.inputWrapper}>
            <TextInput
              style={styles.textInput}
              value={inputText}
              onChangeText={setInputText}
              placeholder="Ask me about finances..."
              placeholderTextColor="#999"
              multiline
              maxLength={500}
              editable={!isLoading}
            />
            <TouchableOpacity 
              style={[styles.sendButton, (!inputText.trim() || isLoading) && styles.sendButtonDisabled]}
              onPress={handleSendMessage}
              disabled={!inputText.trim() || isLoading}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Ionicons name="send" size={20} color="#fff" />
              )}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.06)',
    backgroundColor: 'transparent',
  },
  messagesContainer: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.7)',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    marginHorizontal: 0,
    marginTop: 0,
    marginBottom: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingTop: 60,
  },
  placeholderText: {
    color: '#888',
    fontSize: 16,
    textAlign: 'center',
    fontFamily: 'Poppins-Medium',
    lineHeight: 24,
  },
  dateTimeContainer: {
    alignItems: 'center',
    marginTop: 4,
    marginBottom: 8,
  },
  dateTimeText: {
    fontSize: 13,
    color: '#00B88D',
    fontFamily: 'Poppins-Medium',
    letterSpacing: 0.2,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    justifyContent: 'flex-start',
  },
  avatarContainer: {
    marginRight: 8,
  },
  avatarCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#E6F0FF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#00B88D',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  avatarText: {
    fontSize: 28,
  },
  headerTextContainer: {
    flex: 1,
    flexDirection: 'column',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    fontFamily: 'Poppins-Bold',
  },
  headerStatus: {
    fontSize: 14,
    color: '#00ff6aff',
    fontFamily: 'Poppins-Medium',
    marginTop: 2,
    letterSpacing: 0.2,
  },
  newChatButton: {
    marginLeft: 12,
    padding: 6,
    borderRadius: 20,
    backgroundColor: 'rgba(0,184,141,0.08)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  testButton: {
    marginLeft: 8,
    padding: 6,
    borderRadius: 20,
    backgroundColor: 'rgba(255,0,0,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  messageBubbleContainer: {
    marginVertical: 4,
    paddingHorizontal: 16,
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
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  userMessageBubble: {
    backgroundColor: '#00D09E',
    borderRadius: 16,
    alignSelf: 'flex-end',
  },
  botMessageBubble: {
    backgroundColor: '#F0F0F0',
    alignSelf: 'flex-start',
  },
  messageText: {
    fontSize: 16,
    fontFamily: 'Poppins-Regular',
    color: '#222',
    lineHeight: 22,
  },
  userMessageText: {
    color: '#fff',
    textShadowColor: 'rgba(0,0,0,0.08)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  botMessageText: {
    color: '#1A237E',
  },
  expandButton: {
    marginTop: 8,
    paddingVertical: 4,
  },
  expandText: {
    fontSize: 14,
    fontFamily: 'Poppins-Medium',
  },
  userExpandText: {
    color: 'rgba(255,255,255,0.8)',
  },
  botExpandText: {
    color: '#00B88D',
  },
  timestamp: {
    fontSize: 12,
    color: '#999',
    fontFamily: 'Poppins-Regular',
    marginTop: 4,
    textAlign: 'right',
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
  messagesList: {
    paddingVertical: 16,
    paddingBottom: 16,
  },
  inputContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'rgba(255,255,255,0.7)',
    paddingBottom: 100, // Adjusted to ensure visibility without margin
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: '#fff',
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    fontFamily: 'Poppins-Regular',
    color: '#333',
    maxHeight: 100,
    paddingVertical: 8,
    paddingRight: 12,
  },
  sendButton: {
    backgroundColor: '#00B88D',
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  sendButtonDisabled: {
    backgroundColor: '#ccc',
  },
})