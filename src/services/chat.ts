// Chat service for FinWise app
// This file provides functions to send and receive chat messages, and can be extended for AI/chatbot integration.

import { collection, addDoc, query, orderBy, onSnapshot, Timestamp } from 'firebase/firestore';
import { firestore, auth } from './firebase';
import { GEMINI_API_KEY } from '@env';

export type ChatMessage = {
  id?: string;
  text: string;
  createdAt: Date;
  userId: string;
  sender: 'user' | 'bot';
};

// Send a chat message (from user or bot)
export async function sendMessage(userId: string, text: string, sender: 'user' | 'bot' = 'user') {
  if (!auth.currentUser) throw new Error('User not authenticated');
  await addDoc(collection(firestore, 'chats'), {
    text,
    createdAt: Timestamp.now(),
    userId,
    sender,
  });
}

// Listen for chat messages (real-time updates)
export function listenForMessages(userId: string, onUpdate: (messages: ChatMessage[]) => void) {
  if (!auth.currentUser) return () => {};
  const q = query(
    collection(firestore, 'chats'),
    orderBy('createdAt', 'asc')
  );
  return onSnapshot(q, (snapshot) => {
    const messages: ChatMessage[] = [];
    snapshot.forEach(doc => {
      const data = doc.data();
      if (data.userId === userId) {
        messages.push({
          id: doc.id,
          text: data.text,
          createdAt: data.createdAt.toDate(),
          userId: data.userId,
          sender: data.sender || 'user',
        });
      }
    });
    onUpdate(messages);
  });
}

// Gemini-powered AI/bot response
export async function getBotResponse(userMessage: string): Promise<string> {
  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: userMessage }] }]
        }),
      }
    );
    const data = await response.json();
    return (
      data?.candidates?.[0]?.content?.parts?.[0]?.text ||
      "Sorry, I couldn't generate a response."
    );
  } catch (e) {
    return "Sorry, I couldn't connect to the AI service.";
  }
}
