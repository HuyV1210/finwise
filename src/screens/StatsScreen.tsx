import { StyleSheet, Text, View, ScrollView, Dimensions, TouchableOpacity, ActivityIndicator } from 'react-native'
import React, { useState, useEffect } from 'react'
import { useNavigation } from '@react-navigation/native';
import { auth, firestore } from '../services/firebase';
import { collection, query, where, onSnapshot, orderBy, getDocs } from 'firebase/firestore';
import Icon from 'react-native-vector-icons/MaterialIcons';
import LinearGradient from 'react-native-linear-gradient';
import { formatCurrency, formatCurrencyShort } from '../utils/currencyFormatter';

const { width } = Dimensions.get('window');

interface Transaction {
  id: string;
  title: string;
  amount: number;
  type: 'income' | 'expense';
  category: string;
  date: Date;
}

interface CategoryData {
  name: string;
  amount: number;
  percentage: number;
  color: string;
}

export default function Stats() {
  const navigation = useNavigation();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<'week' | 'month' | 'year'>('month');
  const [categoryData, setCategoryData] = useState<CategoryData[]>([]);
  const [totalIncome, setTotalIncome] = useState(0);
  const [totalExpenses, setTotalExpenses] = useState(0);

  const categoryColors = [
    '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
    '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9'
  ];

  useEffect(() => {
    const unsubscribe = fetchTransactions();
    return unsubscribe;
  }, [period]);

  useEffect(() => {
    calculateCategoryData();
  }, [transactions]);

  const fetchTransactions = () => {
    const user = auth.currentUser;
    if (!user) return () => {};

    const now = new Date();
    let startDate = new Date();

    switch (period) {
      case 'week':
        startDate.setDate(now.getDate() - 7);
        break;
      case 'month':
        startDate.setMonth(now.getMonth() - 1);
        break;
      case 'year':
        startDate.setFullYear(now.getFullYear() - 1);
        break;
    }

    const q = query(
      collection(firestore, 'transactions'),
      where('userId', '==', user.uid),
      where('date', '>=', startDate),
      orderBy('date', 'desc')
    );

    return onSnapshot(q, (snapshot) => {
      const transactionData: Transaction[] = [];
      let income = 0;
      let expenses = 0;

      snapshot.forEach((doc) => {
        const data = doc.data();
        const transaction: Transaction = {
          id: doc.id,
          title: data.title,
          amount: data.amount,
          type: data.type,
          category: data.category,
          date: data.date.toDate(),
        };
        transactionData.push(transaction);

        if (transaction.type === 'income') {
          income += transaction.amount;
        } else {
          expenses += transaction.amount;
        }
      });

      setTransactions(transactionData);
      setTotalIncome(income);
      setTotalExpenses(expenses);
      setLoading(false);
    });
  };

  const calculateCategoryData = () => {
    const expenseTransactions = transactions.filter(t => t.type === 'expense');
    const categoryTotals: { [key: string]: number } = {};

    expenseTransactions.forEach(transaction => {
      categoryTotals[transaction.category] = (categoryTotals[transaction.category] || 0) + transaction.amount;
    });

    const totalExpenseAmount = Object.values(categoryTotals).reduce((sum, amount) => sum + amount, 0);

    const categoryDataArray: CategoryData[] = Object.entries(categoryTotals)
      .map(([name, amount], index) => ({
        name,
        amount,
        percentage: totalExpenseAmount > 0 ? (amount / totalExpenseAmount) * 100 : 0,
        color: categoryColors[index % categoryColors.length]
      }))
      .sort((a, b) => b.amount - a.amount);

    setCategoryData(categoryDataArray);
  };

  const PeriodButton = ({ label, value }: { label: string; value: 'week' | 'month' | 'year' }) => (
    <TouchableOpacity
      style={[styles.periodButton, period === value && styles.activePeriodButton]}
      onPress={() => setPeriod(value)}
    >
      <Text style={[styles.periodButtonText, period === value && styles.activePeriodButtonText]}>
        {label}
      </Text>
    </TouchableOpacity>
  );

  const StatCard = ({ title, value, icon, color }: { title: string; value: string; icon: string; color: string }) => (
    <View style={styles.statCard}>
      <View style={[styles.statIcon, { backgroundColor: color }]}>
        <Icon name={icon} size={24} color="#FFFFFF" />
      </View>
      <View style={styles.statContent}>
        <Text style={styles.statTitle}>{title}</Text>
        <Text style={styles.statValue}>{value}</Text>
      </View>
    </View>
  );

  const CategoryItem = ({ item }: { item: CategoryData }) => (
    <View style={styles.categoryItem}>
      <View style={styles.categoryInfo}>
        <View style={[styles.categoryDot, { backgroundColor: item.color }]} />
        <Text style={styles.categoryName}>{item.name}</Text>
      </View>
      <View style={styles.categoryAmount}>
        <Text style={styles.categoryValue}>{formatCurrencyShort(item.amount)}</Text>
        <Text style={styles.categoryPercentage}>{item.percentage.toFixed(1)}%</Text>
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#00B88D" />
        <Text style={styles.loadingText}>Loading statistics...</Text>
      </View>
    );
  }

  return (
    <LinearGradient 
      colors={['#00D09E', '#FFFFFF']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.container}
    >
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Statistics</Text>
          <Text style={styles.headerSubtitle}>Track your financial patterns</Text>
        </View>

        {/* Period Selector */}
        <View style={styles.periodSelector}>
          <PeriodButton label="Week" value="week" />
          <PeriodButton label="Month" value="month" />
          <PeriodButton label="Year" value="year" />
        </View>

        {/* Summary Cards */}
        <View style={styles.summaryContainer}>
          <StatCard
            title="Total Income"
            value={formatCurrencyShort(totalIncome)}
            icon="trending-up"
            color="#4CAF50"
          />
          <StatCard
            title="Total Expenses"
            value={formatCurrencyShort(totalExpenses)}
            icon="trending-down"
            color="#FF6B6B"
          />
          <StatCard
            title="Balance"
            value={formatCurrencyShort(totalIncome - totalExpenses)}
            icon="account-balance"
            color="#00B88D"
          />
        </View>

        {/* Expense Categories */}
        {categoryData.length > 0 && (
          <View style={styles.categorySection}>
            <Text style={styles.sectionTitle}>Expense Categories</Text>
            <View style={styles.categoryContainer}>
              {categoryData.map((item, index) => (
                <CategoryItem key={index} item={item} />
              ))}
            </View>
          </View>
        )}

        {/* Quick Stats */}
        <View style={styles.quickStats}>
          <Text style={styles.sectionTitle}>Quick Stats</Text>
          <View style={styles.quickStatsGrid}>
            <View style={styles.quickStatItem}>
              <Text style={styles.quickStatLabel}>Total Transactions</Text>
              <Text style={styles.quickStatValue}>{transactions.length}</Text>
            </View>
            <View style={styles.quickStatItem}>
              <Text style={styles.quickStatLabel}>Avg. Daily Expense</Text>
              <Text style={styles.quickStatValue}>
                {formatCurrencyShort(totalExpenses / (period === 'week' ? 7 : period === 'month' ? 30 : 365))}
              </Text>
            </View>
            <View style={styles.quickStatItem}>
              <Text style={styles.quickStatLabel}>Largest Expense</Text>
              <Text style={styles.quickStatValue}>
                {transactions.filter(t => t.type === 'expense').length > 0
                  ? formatCurrencyShort(Math.max(...transactions.filter(t => t.type === 'expense').map(t => t.amount)))
                  : formatCurrencyShort(0)}
              </Text>
            </View>
            <View style={styles.quickStatItem}>
              <Text style={styles.quickStatLabel}>Savings Rate</Text>
              <Text style={styles.quickStatValue}>
                {totalIncome > 0 ? `${(((totalIncome - totalExpenses) / totalIncome) * 100).toFixed(1)}%` : '0%'}
              </Text>
            </View>
          </View>
        </View>

        {/* Empty State */}
        {transactions.length === 0 && (
          <View style={styles.emptyState}>
            <Icon name="bar-chart" size={64} color="#DDD" />
            <Text style={styles.emptyStateTitle}>No Data Available</Text>
            <Text style={styles.emptyStateSubtitle}>
              Start adding transactions to see your financial statistics
            </Text>
          </View>
        )}
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
    marginTop: 10,
    fontFamily: 'Poppins-Regular',
  },
  scrollView: {
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
  periodSelector: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 12,
    padding: 4,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  periodButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 8,
  },
  activePeriodButton: {
    backgroundColor: '#00B88D',
  },
  periodButtonText: {
    fontSize: 14,
    color: '#666',
    fontFamily: 'Poppins-SemiBold',
  },
  activePeriodButtonText: {
    color: '#FFFFFF',
  },
  summaryContainer: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginBottom: 20,
    gap: 10,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  statIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  statContent: {
    alignItems: 'center',
  },
  statTitle: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    marginBottom: 4,
    fontFamily: 'Poppins-Regular',
  },
  statValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    fontFamily: 'Poppins-SemiBold',
  },
  categorySection: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 12,
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
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
    fontFamily: 'Poppins-SemiBold',
  },
  categoryContainer: {
    gap: 12,
  },
  categoryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  categoryInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  categoryDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 12,
  },
  categoryName: {
    fontSize: 14,
    color: '#333',
    fontFamily: 'Poppins-Regular',
    textTransform: 'capitalize',
  },
  categoryAmount: {
    alignItems: 'flex-end',
  },
  categoryValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    fontFamily: 'Poppins-SemiBold',
  },
  categoryPercentage: {
    fontSize: 12,
    color: '#666',
    fontFamily: 'Poppins-Regular',
  },
  quickStats: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 12,
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
  quickStatsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  quickStatItem: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#F8F9FA',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  quickStatLabel: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    marginBottom: 4,
    fontFamily: 'Poppins-Regular',
  },
  quickStatValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    fontFamily: 'Poppins-SemiBold',
  },
  emptyState: {
    alignItems: 'center',
    padding: 40,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 16,
    marginBottom: 8,
    fontFamily: 'Poppins-SemiBold',
  },
  emptyStateSubtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    fontFamily: 'Poppins-Regular',
  },
});