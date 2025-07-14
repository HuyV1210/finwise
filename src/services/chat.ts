// Chat service for FinWise app
// This file provides functions to send and receive chat messages, and can be extended for AI/chatbot integration.

import { collection, addDoc, query, orderBy, onSnapshot, Timestamp } from 'firebase/firestore';
import { firestore, auth } from './firebase';

export type ChatMessage = {
  id?: string;
  text: string;
  createdAt: Date;
  userId: string;
  sender: 'user' | 'bot';
};

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

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

// Example: AI/bot response (stub)
export async function getBotResponse(userMessage: string): Promise<string> {
  // Simple rule-based responses for finance-related queries
  const message = userMessage.toLowerCase();
  
  if (message.includes('budget') || message.includes('budgeting')) {
    return "Creating a budget is essential for financial health! Start by tracking your income and expenses for a month, then categorize your spending. The 50/30/20 rule is a good starting point: 50% for needs, 30% for wants, and 20% for savings and debt repayment.";
  }
  
  if (message.includes('save') || message.includes('saving')) {
    return "Great question about saving! Here are some tips: 1) Pay yourself first by automatically transferring money to savings, 2) Start small with even $25/month, 3) Use the envelope method for categories, 4) Consider a high-yield savings account. What's your savings goal?";
  }
  
  if (message.includes('expense') || message.includes('spending')) {
    return "Tracking expenses is smart! Based on your transaction history, I can see patterns in your spending. Would you like me to analyze your top spending categories or suggest ways to reduce unnecessary expenses?";
  }
  
  if (message.includes('debt') || message.includes('loan')) {
    return "Managing debt is crucial for financial freedom. Consider the debt snowball (pay minimums on all debts, extra on smallest) or debt avalanche (pay minimums on all debts, extra on highest interest rate) methods. Which debts are you currently managing?";
  }
  
  if (message.includes('invest') || message.includes('investment')) {
    return "Investing is a great way to build wealth! Start with an emergency fund (3-6 months expenses), then consider low-cost index funds or ETFs. Remember: invest for the long term, diversify, and only invest what you can afford to lose in the short term.";
  }
  
  if (message.includes('hello') || message.includes('hi') || message.includes('hey')) {
    return "Hello! I'm here to help you with your personal finances. I can assist with budgeting, saving strategies, expense tracking, debt management, and investment basics. What would you like to know?";
  }
  
  if (message.includes('help') || message.includes('what can you do')) {
    return "I can help you with:\n• Budgeting and expense tracking\n• Saving strategies and goals\n• Debt management techniques\n• Basic investment advice\n• Analyzing your spending patterns\n• Financial planning tips\n\nWhat specific area would you like to explore?";
  }
  
  // Default response
  return "That's an interesting question about your finances! While I can provide general guidance on budgeting, saving, investing, and expense management, I'd recommend consulting with a financial advisor for personalized advice. Is there a specific financial topic you'd like to discuss?";
}
