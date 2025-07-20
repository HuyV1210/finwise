import { StyleSheet, Text, View, Alert, TouchableOpacity, ScrollView, FlatList } from 'react-native'
import React, { useEffect, useState } from 'react'
import Header from '../components/common/Header'
import { auth, firestore } from '../services/firebase';
import { collection, getDocs, onSnapshot, query, where } from 'firebase/firestore';
import Icon from 'react-native-vector-icons/MaterialIcons';
import LinearGradient from 'react-native-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { formatCurrencyShort } from '../utils/currencyFormatter';

export default function Home () {
  const [totalIncome, setTotalIncome] = useState(0);
  const [totalExpense, setTotalExpense] = useState(0);
  const [selectedPeriod, setSelectedPeriod] = useState('daily');
  const [filteredTransactions, setFilteredTransactions] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const navigation = useNavigation();

  const handlePeriodPress = (period: string) => {
    setSelectedPeriod(period);
    console.log(`Selected period: ${period}`);
    filterTransactionsByPeriod(period, transactions);
  };

  // Filter transactions based on selected period
  const filterTransactionsByPeriod = (period: string, allTransactions: any[]) => {
    const now = new Date();
    let filtered = [];

    switch (period) {
      case 'daily':
        filtered = allTransactions.filter(transaction => {
          const transactionDate = transaction.date.toDate();
          return (
            transactionDate.getDate() === now.getDate() &&
            transactionDate.getMonth() === now.getMonth() &&
            transactionDate.getFullYear() === now.getFullYear()
          );
        });
        break;

      case 'weekly':
        const startOfWeek = new Date(now);
        startOfWeek.setDate(now.getDate() - now.getDay());
        startOfWeek.setHours(0, 0, 0, 0);
        
        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 6);
        endOfWeek.setHours(23, 59, 59, 999);

        filtered = allTransactions.filter(transaction => {
          const transactionDate = transaction.date.toDate();
          return transactionDate >= startOfWeek && transactionDate <= endOfWeek;
        });
        break;

      case 'monthly':
        filtered = allTransactions.filter(transaction => {
          const transactionDate = transaction.date.toDate();
          return (
            transactionDate.getMonth() === now.getMonth() &&
            transactionDate.getFullYear() === now.getFullYear()
          );
        });
        break;

      default:
        filtered = allTransactions;
    }

    setFilteredTransactions(filtered);
  };

  // Render individual transaction item
  const renderTransactionItem = ({ item }: { item: any }) => {
    const price = typeof item.price === 'string'
      ? Number(item.price.replace(/,/g, ''))
      : Number(item.price) || 0;

    const isIncome = item.type === 'income';
    const transactionDate = item.date.toDate();

    return (
      <View style={styles.transactionItem}>
        <View style={styles.transactionLeft}>
          <View style={[styles.transactionIcon, { backgroundColor: isIncome ? '#E8F5E8' : '#FFE8E8' }]}>
            <Icon 
              name={isIncome ? 'trending-up' : 'trending-down'} 
              size={20} 
              color={isIncome ? '#00B88D' : '#FF5A5F'} 
            />
          </View>
          <View style={styles.transactionDetails}>
            <Text style={styles.transactionTitle}>{item.title}</Text>
            <Text style={styles.transactionCategory}>{item.category}</Text>
            <Text style={styles.transactionDate}>
              {transactionDate.toLocaleDateString('en-US', { 
                month: 'short', 
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </Text>
          </View>
        </View>
        <View style={styles.transactionRight}>
          <Text style={[styles.transactionAmount, { color: isIncome ? '#00B88D' : '#FF5A5F' }]}>
            {isIncome ? '+' : '-'}{formatCurrencyShort(price)}
          </Text>
          <Text style={styles.transactionCurrency}>VND</Text>
        </View>
      </View>
    );
  };

  const handleNotificationPress = () => {
    Alert.alert('Notifications', 'No new notifications');
  };

  const handleSearchPress = () => {
    Alert.alert('Search', 'Search functionality coming soon');
  };

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) {
      return;
    }
  
    const q = query(
      collection(firestore, 'transactions'),
      where('userId', '==', user.uid)
    );
  
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const transactionList: any[] = [];
      let income = 0;
      let expense = 0;
  
      snapshot.forEach((doc) => {
        const data = doc.data();
        const transactionData = {
          id: doc.id,
          ...data,
        };
        transactionList.push(transactionData);
      
        // Remove commas from the price string and convert to a number
        const price = typeof data.price === 'string'
        ? Number(data.price.replace(/,/g, ''))
        : Number(data.price) || 0;
      
        if (data.type === 'income') {
          income += price;
        } else if (data.type === 'expense') {
          expense += price;
        }
      });
  
      setTransactions(transactionList);
      setTotalIncome(income);
      setTotalExpense(expense);
      
      // Filter transactions for the current selected period
      filterTransactionsByPeriod(selectedPeriod, transactionList);
    });
  
    return () => {
      unsubscribe(); // Cleanup listener on unmount
    };
  }, []);

  return (
    <LinearGradient 
      colors={['#00D09E', '#FFFFFF']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.container}
    >
      <Header 
        onNotificationPress={handleNotificationPress}
        onSearchPress={handleSearchPress}
      />
      <View style={styles.content}>
        <View style={styles.summaryRow}>
          <View style={styles.summaryBox}>
            <View style={styles.summaryTitle}>
              <Icon name="pin-invoke" size={22} color="black" style={styles.icon} />
              <Text style={styles.summaryLabel}>Total Income</Text>
            </View>
            <Text style={styles.incomeValue}>+{formatCurrencyShort(totalIncome)}</Text>
            <Text style={styles.summaryCurrency}>VND</Text>
          </View>
          <View style={styles.verticalDivider} />
          <View style={styles.summaryBox}>
            <View style={styles.summaryTitle}>
              <Icon name="pin-end" size={22} color="black" style={styles.icon} />
              <Text style={styles.summaryLabel}>Total Expense</Text>
            </View>
            <Text style={styles.expenseValue}>-{formatCurrencyShort(totalExpense)}</Text>
            <Text style={styles.summaryCurrency}>VND</Text>
          </View>
        </View>
      </View>
      <View style={styles.subContainer}>
        <View style={styles.dateBox}>
          <TouchableOpacity
            style={[
              styles.summaryBox,
              selectedPeriod === 'daily' ? styles.activeBox : styles.inactiveBox,
            ]}
            onPress={() => handlePeriodPress('daily')}
          >
            <Text
              style={[
                styles.summaryLabel,
                selectedPeriod === 'daily' ? styles.activeLabel : styles.inactiveLabel,
              ]}
            >
              Daily
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.summaryBox,
              selectedPeriod === 'weekly' ? styles.activeBox : styles.inactiveBox,
            ]}
            onPress={() => handlePeriodPress('weekly')}
          >
            <Text
              style={[
                styles.summaryLabel,
                selectedPeriod === 'weekly' ? styles.activeLabel : styles.inactiveLabel,
              ]}
            >
              Weekly
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.summaryBox,
              selectedPeriod === 'monthly' ? styles.activeBox : styles.inactiveBox,
            ]}
            onPress={() => handlePeriodPress('monthly')}
          >
            <Text
              style={[
                styles.summaryLabel,
                selectedPeriod === 'monthly' ? styles.activeLabel : styles.inactiveLabel,
              ]}
            >
              Monthly
            </Text>
          </TouchableOpacity>
        </View>
        
        {/* Transactions List */}
        <View style={styles.transactionsContainer}>
          <Text style={styles.transactionsTitle}>
            {selectedPeriod.charAt(0).toUpperCase() + selectedPeriod.slice(1)} Transactions
          </Text>
          {filteredTransactions.length > 0 ? (
            <FlatList
              data={filteredTransactions}
              renderItem={renderTransactionItem}
              keyExtractor={(item) => item.id}
              showsVerticalScrollIndicator={false}
              style={styles.transactionsList}
            />
          ) : (
            <View style={styles.emptyState}>
              <Icon name="receipt-long" size={48} color="#999" />
              <Text style={styles.emptyStateText}>No transactions found</Text>
              <Text style={styles.emptyStateSubtext}>
                Add some transactions to see them here
              </Text>
            </View>
          )}
        </View>
      </View>
    </LinearGradient>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#00D09E',
  },
  content: {
    paddingHorizontal: 24,
    paddingTop: 20,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  summaryBox: {
    flex: 1,
    borderRadius: 16,
    padding: 10,
    marginHorizontal: 8,
    alignItems: 'center',
  },
  verticalDivider: {
    width: 1,
    height: 100,
    backgroundColor: '#E5E5EA',
  },
  summaryLabel: {
    fontSize: 16,
    color: 'black',
    marginBottom: 8,
    fontWeight: '600',
  },
  incomeValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#0068FF',
  },
  expenseValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FF5A5F',
  },
  icon: {
    marginBottom: 8,
  },
  summaryTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5
  },
  subContainer: {
    backgroundColor: '#F1FFF3',
    borderTopRightRadius: 60,
    borderTopLeftRadius: 60,
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 32,
  },
  title: {
    fontSize: 24,
    marginBottom: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    paddingHorizontal: 40,
  },
  summaryCurrency: {
    fontWeight: 700,
  },
  dateBox: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#DFF7E2',
    borderRadius: 20,
    alignItems: 'center',
    height: 70
  },
  activeBox: {
    backgroundColor: '#00D09E', // Active background color
    borderWidth: 2,
    borderColor: '#007B55', // Border for active state
  },
  inactiveBox: {
    backgroundColor: '#DFF7E2', // Inactive background color
  },
  activeLabel: {
    color: '#FFFFFF', // Active text color
  },
  inactiveLabel: {
    color: '#000000', // Inactive text color
  },
  // Transaction styles
  transactionsContainer: {
    flex: 1,
    paddingTop: 20,
  },
  transactionsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  transactionsList: {
    flex: 1,
  },
  transactionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 16,
    marginBottom: 8,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  transactionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  transactionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  transactionDetails: {
    flex: 1,
  },
  transactionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  transactionCategory: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  transactionDate: {
    fontSize: 12,
    color: '#999',
  },
  transactionRight: {
    alignItems: 'flex-end',
  },
  transactionAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  transactionCurrency: {
    fontSize: 12,
    color: '#666',
    fontWeight: '600',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#999',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
});