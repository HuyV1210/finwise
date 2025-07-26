import { 
  StyleSheet, 
  Text, 
  View, 
  Alert, 
  TouchableOpacity, 
  ScrollView, 
  FlatList, 
  Platform, 
  UIManager, 
  LayoutAnimation 
} from 'react-native';
import React, { useEffect, useState, useCallback, useRef } from 'react';
import Header from '../components/common/Header';
import { auth, firestore } from '../services/firebase';
import { collection, getDocs, onSnapshot, query, where, Timestamp } from 'firebase/firestore';
import Icon from 'react-native-vector-icons/MaterialIcons';
import LinearGradient from 'react-native-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { filterTransactionsByPeriod } from '../utils/transactionUtils';
import { formatCurrencyShort } from '../utils/currencyFormatter';
import type { Transaction } from '../types/transaction';

// Define your navigation param types
 type RootStackParamList = {
   Search: { transactions: Transaction[] };
   // ...other screens
 };

export const PERIODS = {
  DAILY: 'daily',
  WEEKLY: 'weekly',
  MONTHLY: 'monthly',
};

export default function Home () {
  const [selectedPeriod, setSelectedPeriod] = useState(PERIODS.DAILY);
  const [filteredTransactions, setFilteredTransactions] = useState<any[]>([]);
  const [showAll, setShowAll] = useState(false);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const filterTimeout = useRef<NodeJS.Timeout | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const handlePeriodPress = (period: string) => {
    setSelectedPeriod(period);
    throttledFilterTransactions(period, transactions);
  };

  // Throttled filterTransactionsByPeriod
  const throttledFilterTransactions = useCallback((period: string, allTransactions: Transaction[]) => {
    if (filterTimeout.current) {
      clearTimeout(filterTimeout.current);
    }
    filterTimeout.current = setTimeout(() => {
      // Map PERIODS to utils period values
      let utilsPeriod: 'day' | 'week' | 'month' = 'day';
      if (period === PERIODS.DAILY) utilsPeriod = 'day';
      else if (period === PERIODS.WEEKLY) utilsPeriod = 'week';
      else if (period === PERIODS.MONTHLY) utilsPeriod = 'month';
      const filtered = filterTransactionsByPeriod(transactions, utilsPeriod);
      setFilteredTransactions(filtered);
    }, 200); // 200ms throttle
  }, [transactions]);

  // Render individual transaction item
  const renderTransactionItem = useCallback(({ item }: { item: any }) => {
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
  }, []);

  const handleNotificationPress = () => {
    Alert.alert('Notifications', 'No new notifications');
  };

  const handleSearchPress = () => {
    navigation.navigate('Search', { transactions });
  };

  // Memoized totalIncome and totalExpense
  const totalIncome = React.useMemo(() => {
    return transactions.reduce((sum, t) => {
      if (t.type === 'income') {
        const price = typeof t.price === 'string' ? Number(t.price.replace(/,/g, '')) : Number(t.price) || 0;
        return sum + price;
      }
      return sum;
    }, 0);
  }, [transactions]);

  const totalExpense = React.useMemo(() => {
    return transactions.reduce((sum, t) => {
      if (t.type === 'expense') {
        const price = typeof t.price === 'string' ? Number(t.price.replace(/,/g, '')) : Number(t.price) || 0;
        return sum + price;
      }
      return sum;
    }, 0);
  }, [transactions]);

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) {
      return;
    }

    if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
      UIManager.setLayoutAnimationEnabledExperimental(true);
    }

    const q = query(
      collection(firestore, 'transactions'),
      where('userId', '==', user.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const transactionList: Transaction[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        const transactionData: Transaction = {
          id: doc.id,
          type: data.type ?? 'expense',
          title: data.title ?? '',
          category: data.category ?? '',
          date: data.date ?? Timestamp.now(),
          price: data.price ?? 0,
        };
        transactionList.push(transactionData);
      });
      setTransactions(transactionList);
      // Throttled filter for large data
      throttledFilterTransactions(selectedPeriod, transactionList);
    });

    return () => {
      unsubscribe(); // Cleanup listener on unmount
      if (filterTimeout.current) {
        clearTimeout(filterTimeout.current);
      }
    };
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    const user = auth.currentUser;
    if (!user) {
      setRefreshing(false);
      return;
    }

    const q = query(
      collection(firestore, 'transactions'),
      where('userId', '==', user.uid)
    );

    getDocs(q)
      .then((snapshot) => {
        const transactionList: Transaction[] = [];
        snapshot.forEach((doc) => {
          const data = doc.data();
          transactionList.push({
            id: doc.id,
            type: data.type ?? 'expense',
            title: data.title ?? '',
            category: data.category ?? '',
            date: data.date ?? Timestamp.now(),
            price: data.price ?? 0,
          });
        });
        setTransactions(transactionList);
        throttledFilterTransactions(selectedPeriod, transactionList);
      })
      .catch((error) => {
        console.error("Error refreshing transactions:", error);
      })
      .finally(() => {
        setRefreshing(false);
      });
  };

  // Pagination state
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 20;
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  // Paginated transactions for FlatList
  const paginatedTransactions = React.useMemo(() => {
    if (showAll) {
      return filteredTransactions.slice(0, page * PAGE_SIZE);
    }
    return filteredTransactions.slice(0, 4);
  }, [filteredTransactions, showAll, page]);

  // Load more handler for FlatList
  const handleLoadMore = () => {
    if (!showAll || loadingMore || !hasMore) return;
    setLoadingMore(true);
    // Simulate async fetch, but just increase page for now
    setTimeout(() => {
      const nextPage = page + 1;
      setPage(nextPage);
      setLoadingMore(false);
      if (filteredTransactions.length <= nextPage * PAGE_SIZE) {
        setHasMore(false);
      }
    }, 300);
  };

  // Reset pagination when filteredTransactions or showAll changes
  React.useEffect(() => {
    setPage(1);
    setHasMore(true);
  }, [filteredTransactions, showAll]);

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
              styles.dateButton,
              selectedPeriod === PERIODS.DAILY ? styles.activeBox : styles.inactiveBox,
            ]}
            onPress={() => handlePeriodPress(PERIODS.DAILY)}
          >
            <Text
              style={[
                styles.summaryLabel,
                selectedPeriod === PERIODS.DAILY ? styles.activeLabel : styles.inactiveLabel,
              ]}
            >
              Daily
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.dateButton,
              selectedPeriod === PERIODS.WEEKLY ? styles.activeBox : styles.inactiveBox,
            ]}
            onPress={() => handlePeriodPress(PERIODS.WEEKLY)}
          >
            <Text
              style={[
                styles.summaryLabel,
                selectedPeriod === PERIODS.WEEKLY ? styles.activeLabel : styles.inactiveLabel,
              ]}
            >
              Weekly
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.dateButton,
              selectedPeriod === PERIODS.MONTHLY ? styles.activeBox : styles.inactiveBox,
            ]}
            onPress={() => handlePeriodPress(PERIODS.MONTHLY)}
          >
            <Text
              style={[
                styles.summaryLabel,
                selectedPeriod === PERIODS.MONTHLY ? styles.activeLabel : styles.inactiveLabel,
              ]}
            >
              Monthly
            </Text>
          </TouchableOpacity>
        </View>
        
        {/* Transactions List */}
        <View style={styles.transactionsContainer}>
          <View style={styles.transactionsHeaderRow}>
            <Text style={styles.transactionsTitle}>
              {selectedPeriod.charAt(0).toUpperCase() + selectedPeriod.slice(1)} Transactions
            </Text>
            {filteredTransactions.length > 4 && (
              <TouchableOpacity 
                onPress={() => {
                  LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                  setShowAll(!showAll);
                  }} 
                style={styles.viewAllInlineButton}
              >
                <Text style={styles.viewAllInlineText}>{showAll ? 'Show Less' : 'View All'}</Text>
              </TouchableOpacity>
            )}
          </View>
          {filteredTransactions.length > 0 ? (
            <FlatList
              data={paginatedTransactions}
              renderItem={renderTransactionItem}
              keyExtractor={(item) => item.id}
              showsVerticalScrollIndicator={false}
              style={styles.transactionsList}
              onEndReached={handleLoadMore}
              onEndReachedThreshold={0.5}
              ListFooterComponent={loadingMore ? <Text style={{textAlign:'center',padding:8}}>Loading...</Text> : null}
              refreshing={refreshing}
              onRefresh={handleRefresh}
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
  transactionsHeaderRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  viewAllInlineButton: {
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 6, 
  },
  viewAllInlineText: {
    color: '#000',
    fontWeight: '600',
    fontSize: 16,
  },
  icon: {
    marginRight: 6,
  },
  container: {
    flex: 1,
    backgroundColor: '#00D09E',
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    gap: 16,
    marginBottom: 24,
  },
  summaryBox: {
    flex: 1,
    borderRadius: 20,
    paddingVertical: 16,
    paddingHorizontal: 10,
    alignItems: 'center',
    backgroundColor: '#fff',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
  },
  dateButton: {
    paddingHorizontal: 10,
  },
  verticalDivider: {
    width: 0.5,
    backgroundColor: '#ccc',
  },
  summaryTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  summaryLabel: {
    fontSize: 16,
    color: '#333',
    fontWeight: '600',
  },
  incomeValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#00B88D',
  },
  expenseValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FF5A5F',
  },
  summaryCurrency: {
    fontSize: 12,
    color: '#999',
    fontWeight: '600',
    marginTop: 2,
  },
  subContainer: {
    backgroundColor: '#F1FFF3',
    borderTopLeftRadius: 60,
    borderTopRightRadius: 60,
    flex: 1,
    paddingTop: 28,
    paddingHorizontal: 20,
  },
  dateBox: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#E6F9EC',
    borderRadius: 20,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  activeBox: {
    backgroundColor: '#00D09E',
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 14,
  },
  inactiveBox: {
    borderWidth: 0,
  },
  activeLabel: {
    color: '#fff',
    fontWeight: '700',
    paddingHorizontal: 14,
  },
  inactiveLabel: {
    color: '#333',
    fontWeight: '700',
    paddingHorizontal: 10,
  },
  transactionsContainer: {
    flex: 1,
  },
  transactionsTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333',
    marginBottom: 0, // Remove extra margin
  },
  transactionsList: {
    flex: 1,
  },
  transactionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.07,
    shadowRadius: 3,
    elevation: 2,
  },
  transactionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  transactionIcon: {
    width: 42,
    height: 42,
    borderRadius: 21,
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
    color: '#222',
  },
  transactionCategory: {
    fontSize: 13,
    color: '#777',
    marginBottom: 2,
  },
  transactionDate: {
    fontSize: 12,
    color: '#aaa',
  },
  transactionRight: {
    alignItems: 'flex-end',
  },
  transactionAmount: {
    fontSize: 16,
    fontWeight: '700',
  },
  transactionCurrency: {
    fontSize: 12,
    color: '#666',
    fontWeight: '600',
  },
  emptyState: {
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 50,
    paddingHorizontal: 24,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#888',
    marginTop: 12,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#aaa',
    textAlign: 'center',
    marginTop: 4,
  },
});