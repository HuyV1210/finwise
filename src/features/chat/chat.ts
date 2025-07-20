// Chat service for FinWise app
// This file provides functions to send and receive chat messages, and can be extended for AI/chatbot integration.

import { collection, addDoc, query, orderBy, onSnapshot, Timestamp, where, getDocs } from 'firebase/firestore';
import { firestore, auth } from '../../services/firebase';
import { GEMINI_API_KEY } from '@env';


// Test function to check Firebase connectivity
export async function testFirebaseConnection(): Promise<void> {
  try {
    if (!auth.currentUser) {
      return;
    }
    
    // Try to add a test document
    const testDoc = await addDoc(collection(firestore, 'chats'), {
      text: 'Test message from testFirebaseConnection',
      createdAt: Timestamp.now(),
      userId: auth.currentUser.uid,
      sender: 'user',
    });
    
    // Try to read the document back
    
  } catch (error) {
    // Error handling removed for production
  }
}

export type ChatMessage = {
  id?: string;
  text: string;
  createdAt: Date;
  userId: string;
  sender: 'user' | 'bot';
};

// Transaction type for analysis
interface Transaction {
  id: string;
  title: string;
  amount: number;
  type: 'income' | 'expense';
  category: string;
  date: Date;
  userId: string;
}

// Function to get transactions for current user
export async function getUserTransactions(userId: string, periodDays?: number): Promise<Transaction[]> {
  try {
    //
    
    let q;
    if (periodDays) {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - periodDays);
      
      q = query(
        collection(firestore, 'transactions'),
        where('userId', '==', userId),
        where('date', '>=', startDate),
        orderBy('date', 'desc')
      );
    } else {
      q = query(
        collection(firestore, 'transactions'),
        where('userId', '==', userId),
        orderBy('date', 'desc')
      );
    }

    const snapshot = await getDocs(q);
    const transactions: Transaction[] = [];

    snapshot.forEach((doc) => {
      const data = doc.data();
      const price = typeof data.price === 'string'
        ? Number(data.price.replace(/,/g, ''))
        : Number(data.price) || 0;
      
      transactions.push({
        id: doc.id,
        title: data.title || 'Untitled',
        amount: price,
        type: data.type,
        category: data.category || 'Other',
        date: data.date.toDate(),
        userId: data.userId,
      });
    });

    //
    return transactions;
  } catch (error) {
    //
    return [];
  }
}

// Function to analyze spending for today
export async function getTodaysSpending(userId: string): Promise<{ totalSpending: number, transactions: Transaction[] }> {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    const q = query(
      collection(firestore, 'transactions'),
      where('userId', '==', userId),
      where('type', '==', 'expense'),
      where('date', '>=', today),
      where('date', '<', tomorrow),
      orderBy('date', 'desc')
    );

    const snapshot = await getDocs(q);
    const transactions: Transaction[] = [];
    let totalSpending = 0;

    snapshot.forEach((doc) => {
      const data = doc.data();
      const amount = typeof data.price === 'string'
        ? Number(data.price.replace(/,/g, ''))
        : Number(data.price) || 0;
      
      const transaction: Transaction = {
        id: doc.id,
        title: data.title || 'Untitled',
        amount,
        type: data.type,
        category: data.category || 'Other',
        date: data.date.toDate(),
        userId: data.userId,
      };
      
      transactions.push(transaction);
      totalSpending += amount;
    });

    return { totalSpending, transactions };
  } catch (error) {
    console.error('Error getting today\'s spending:', error);
    return { totalSpending: 0, transactions: [] };
  }
}

// Function to get spending analysis for different periods
export async function getSpendingAnalysis(userId: string, period: 'week' | 'month' | 'year'): Promise<{
  totalIncome: number;
  totalExpenses: number;
  balance: number;
  transactions: Transaction[];
  categories: { [key: string]: number };
}> {
  try {
    const days = period === 'week' ? 7 : period === 'month' ? 30 : 365;
    const transactions = await getUserTransactions(userId, days);
    
    let totalIncome = 0;
    let totalExpenses = 0;
    const categories: { [key: string]: number } = {};

    transactions.forEach(transaction => {
      if (transaction.type === 'income') {
        totalIncome += transaction.amount;
      } else {
        totalExpenses += transaction.amount;
        categories[transaction.category] = (categories[transaction.category] || 0) + transaction.amount;
      }
    });

    return {
      totalIncome,
      totalExpenses,
      balance: totalIncome - totalExpenses,
      transactions,
      categories,
    };
  } catch (error) {
    console.error('Error getting spending analysis:', error);
    return {
      totalIncome: 0,
      totalExpenses: 0,
      balance: 0,
      transactions: [],
      categories: {},
    };
  }
}

// Send a chat message (from user or bot)
export async function sendMessage(userId: string, text: string, sender: 'user' | 'bot' = 'user') {
  try {
    if (!auth.currentUser) {
      throw new Error('User not authenticated');
    }
    
    const docRef = await addDoc(collection(firestore, 'chats'), {
      text,
      createdAt: Timestamp.now(),
      userId,
      sender,
    });
    
    //
  } catch (error) {
    //
    throw error;
  }
}

// Listen for chat messages (real-time updates)
export function listenForMessages(userId: string, onUpdate: (messages: ChatMessage[]) => void) {
  try {
    //
    
    // FIXED: Query with user filter to match security rules
    // Note: Using where + orderBy may require a composite index
    const q = query(
      collection(firestore, 'chats'),
      where('userId', '==', userId),
      orderBy('createdAt', 'asc')
    );
    
    //
    
    return onSnapshot(q, (snapshot) => {
      //
      const messages: ChatMessage[] = [];
      snapshot.forEach(doc => {
        const data = doc.data();
        //
        // No need to filter again since query already filters by userId
        messages.push({
          id: doc.id,
          text: data.text,
          createdAt: data.createdAt.toDate(),
          userId: data.userId,
          sender: data.sender || 'user',
        });
      });
      //
      onUpdate(messages);
    }, (error) => {
    //
      // Call onUpdate with empty array so loading stops
      onUpdate([]);
    });
  } catch (error) {
    //
    // Call onUpdate with empty array so loading stops
    onUpdate([]);
    throw error;
  }
}

// Simple fallback responses for when Gemini API is not available
function getFallbackResponse(userMessage: string): string {
  const message = userMessage.toLowerCase();
  
  if (message.includes('budget') || message.includes('spending')) {
    return "Here are some budgeting tips: 1) Track your expenses for a month, 2) Use the 50/30/20 rule (50% needs, 30% wants, 20% savings), 3) Set specific savings goals, 4) Review and adjust monthly.";
  }
  
  if (message.includes('save') || message.includes('saving')) {
    return "Great question about saving! Try these strategies: 1) Start with an emergency fund (3-6 months expenses), 2) Automate your savings, 3) Cut unnecessary subscriptions, 4) Consider high-yield savings accounts.";
  }
  
  if (message.includes('invest') || message.includes('investment')) {
    return "Investment basics: 1) Start early to benefit from compound interest, 2) Diversify your portfolio, 3) Consider index funds for beginners, 4) Only invest money you won't need for 5+ years. Always do your research!";
  }
  
  if (message.includes('debt') || message.includes('loan')) {
    return "For debt management: 1) List all debts with interest rates, 2) Pay minimums on all, extra on highest rate debt, 3) Consider debt consolidation if beneficial, 4) Avoid taking on new debt.";
  }
  
  return "I'm here to help with your finances! You can ask me about budgeting, saving, investing, debt management, or any other financial topics. What specific area would you like guidance on?";
}

// Gemini-powered AI/bot response with access to user's financial data
export async function getBotResponse(userMessage: string): Promise<string> {
  try {
    if (!GEMINI_API_KEY) return getFallbackResponse(userMessage);
    const user = auth.currentUser;
    if (!user) return getFallbackResponse(userMessage);

    // 1. Enhanced: Check for add transaction command (supports K/M/B and more flexible phrasing)
    // Examples: 'add 30M to my income as salary', 'add $1000 for groceries as expense', 'add 500k to my expense as rent'
    const addPatterns = [
      /add\s+\$?(\d+[.,]?\d*)([kmbKMB]?)\s*(?:to|for)?\s*(?:my)?\s*(income|expense)\s*(?:as|for)?\s*([\w\s]*)/i,
      /add\s+(income|expense)\s+\$?(\d+[.,]?\d*)([kmbKMB]?)\s*(?:as|for)?\s*([\w\s]*)/i
    ];
    let addMatch = null;
    let typeLower: 'income' | 'expense' = 'income';
    let amount = 0;
    let categoryOrTitle = '';
    for (const pattern of addPatterns) {
      const m = userMessage.match(pattern);
      if (m) {
        if (pattern === addPatterns[0]) {
          // e.g. add 30M to my income as salary
          const [, amountStr, suffix, type, cat] = m;
          typeLower = type.toLowerCase() as 'income' | 'expense';
          categoryOrTitle = cat?.trim() || (typeLower === 'income' ? 'Income' : 'Expense');
          amount = parseFloat(amountStr.replace(/,/g, ''));
          if (suffix) {
            if (suffix.toLowerCase() === 'k') amount *= 1e3;
            if (suffix.toLowerCase() === 'm') amount *= 1e6;
            if (suffix.toLowerCase() === 'b') amount *= 1e9;
          }
        } else {
          // e.g. add income 30M as salary
          const [, type, amountStr, suffix, cat] = m;
          typeLower = type.toLowerCase() as 'income' | 'expense';
          categoryOrTitle = cat?.trim() || (typeLower === 'income' ? 'Income' : 'Expense');
          amount = parseFloat(amountStr.replace(/,/g, ''));
          if (suffix) {
            if (suffix.toLowerCase() === 'k') amount *= 1e3;
            if (suffix.toLowerCase() === 'm') amount *= 1e6;
            if (suffix.toLowerCase() === 'b') amount *= 1e9;
          }
        }
        addMatch = true;
        break;
      }
    }
    if (addMatch && amount > 0) {
      const now = new Date();
      const title = categoryOrTitle || (typeLower === 'income' ? 'Income' : 'Expense');
      const category = categoryOrTitle || (typeLower === 'income' ? 'General Income' : 'General Expense');
      try {
        await addDoc(collection(firestore, 'transactions'), {
          type: typeLower,
          price: amount,
          category,
          date: now,
          title,
          note: '',
          userId: user.uid,
          createdAt: now,
        });
        return `✅ ${typeLower.charAt(0).toUpperCase() + typeLower.slice(1)} of $${amount.toLocaleString()} for "${category}" added successfully!`;
      } catch (err) {
        return `❌ Failed to add ${typeLower}. Please try again.`;
      }
    }

    // 2. Personal finance queries (existing logic)
    const isPersonalFinanceQuery = /\b(my|total|spending|spent|income|balance|expense|transaction|today|week|month|year|category|budget)\b/i.test(userMessage);
    let financialContext = '';
    if (isPersonalFinanceQuery) {
      try {
        if (/\b(today|today's)\b/i.test(userMessage)) {
          const todaysData = await getTodaysSpending(user.uid);
          financialContext = `\n\nUser's actual financial data for TODAY:\n- Total spending today: $${todaysData.totalSpending.toFixed(2)}\n- Number of transactions: ${todaysData.transactions.length}\n`;
          if (todaysData.transactions.length > 0) {
            financialContext += '- Today\'s expenses breakdown:\n';
            todaysData.transactions.forEach(t => {
              financialContext += `  • ${t.title}: $${t.amount.toFixed(2)} (${t.category})\n`;
            });
          }
        } else if (/\b(week|weekly)\b/i.test(userMessage)) {
          const weekData = await getSpendingAnalysis(user.uid, 'week');
          financialContext = `\n\nUser's actual financial data for this WEEK:\n- Total income: $${weekData.totalIncome.toFixed(2)}\n- Total expenses: $${weekData.totalExpenses.toFixed(2)}\n- Balance: $${weekData.balance.toFixed(2)}\n- Number of transactions: ${weekData.transactions.length}\n`;
          const topCategories = Object.entries(weekData.categories)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 3);
          if (topCategories.length > 0) {
            financialContext += '- Top spending categories:\n';
            topCategories.forEach(([category, amount]) => {
              financialContext += `  • ${category}: $${amount.toFixed(2)}\n`;
            });
          }
        } else if (/\b(month|monthly)\b/i.test(userMessage)) {
          const monthData = await getSpendingAnalysis(user.uid, 'month');
          financialContext = `\n\nUser's actual financial data for this MONTH:\n- Total income: $${monthData.totalIncome.toFixed(2)}\n- Total expenses: $${monthData.totalExpenses.toFixed(2)}\n- Balance: $${monthData.balance.toFixed(2)}\n- Number of transactions: ${monthData.transactions.length}\n`;
          const topCategories = Object.entries(monthData.categories)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 5);
          if (topCategories.length > 0) {
            financialContext += '- Top spending categories:\n';
            topCategories.forEach(([category, amount]) => {
              financialContext += `  • ${category}: $${amount.toFixed(2)}\n`;
            });
          }
        } else {
          const recentData = await getSpendingAnalysis(user.uid, 'month');
          financialContext = `\n\nUser's recent financial data (last 30 days):\n- Total income: $${recentData.totalIncome.toFixed(2)}\n- Total expenses: $${recentData.totalExpenses.toFixed(2)}\n- Balance: $${recentData.balance.toFixed(2)}\n- Number of transactions: ${recentData.transactions.length}\n`;
        }
      } catch (error) {
        financialContext = '\n\nNote: Unable to fetch your current financial data.';
      }
    }

    // 3. Default: AI response
    const systemPrompt = `You are FinWise Bot, a helpful financial assistant for the FinWise app. You help users with personal finance questions, budgeting advice, and analyzing their spending patterns.

IMPORTANT: When users ask about "my spending", "my income", "my transactions", or similar personal finance questions, use the actual financial data provided below to give specific, accurate answers.

Key guidelines:
1. Always use the actual financial data when available to answer questions about the user's finances
2. Be specific with amounts and provide actionable insights
3. If asking about spending/income for specific periods, reference the exact amounts
4. Suggest practical tips based on their actual spending patterns
5. Be encouraging and supportive about their financial goals
6. Keep responses concise but informative (2-3 sentences max)
7. Use currency formatting for amounts (e.g., $123.45)
8. If no financial data is available for the requested period, explain that clearly

User's question: "${userMessage}"${financialContext}

Provide a helpful, specific response based on the user's actual financial data when available.`;
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: systemPrompt
            }]
          }],
          generationConfig: {
            temperature: 0.7,
            topK: 1,
            topP: 1,
            maxOutputTokens: 2048,
          },
          safetySettings: [
            {
              category: "HARM_CATEGORY_HARASSMENT",
              threshold: "BLOCK_MEDIUM_AND_ABOVE"
            },
            {
              category: "HARM_CATEGORY_HATE_SPEECH",
              threshold: "BLOCK_MEDIUM_AND_ABOVE"
            },
            {
              category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
              threshold: "BLOCK_MEDIUM_AND_ABOVE"
            },
            {
              category: "HARM_CATEGORY_DANGEROUS_CONTENT",
              threshold: "BLOCK_MEDIUM_AND_ABOVE"
            }
          ]
        }),
      }
    );
    if (!response.ok) {
      const errorText = await response.text();
      return getFallbackResponse(userMessage);
    }
    const data = await response.json();
    const botResponse = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!botResponse) {
      return getFallbackResponse(userMessage);
    }
    return botResponse.trim();
  } catch (error) {
    return getFallbackResponse(userMessage);
  }
}
