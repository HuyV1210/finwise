import { StyleSheet, Text, View, Alert } from 'react-native'
import React, { useEffect, useState } from 'react'
import Header from '../components/Header'
import { auth, firestore } from '../services/firebase';
import { collection, getDocs, query, where } from 'firebase/firestore';
import Icon from 'react-native-vector-icons/MaterialIcons';
import LinearGradient from 'react-native-linear-gradient';

const HomeScreen = () => {
  const [totalIncome, setTotalIncome] = useState(0);
  const [totalExpense, setTotalExpense] = useState(0);

  const handleNotificationPress = () => {
    Alert.alert('Notifications', 'No new notifications');
  };

  const handleSearchPress = () => {
    Alert.alert('Search', 'Search functionality coming soon');
  };

  useEffect(() => {
    const fetchTotals = async () => {
      try {
        const user = auth.currentUser;
        if(!user) return;

        const q = query(
          collection(firestore, 'transactions'),
          where('userId', '==', user.uid)
        );
        const snapshot = await getDocs(q);

        let income = 0;
        let expense = 0;

        snapshot.forEach(doc => {
          const data = doc.data();
          if(data.type === 'income') {
            income += Number(data.price) || 0;
          } else if (data.type === 'expense') {
            expense += Number(data.price) || 0;
          }
        });

        setTotalIncome(income);
        setTotalExpense(expense);
      } catch (err) {
        Alert.alert('Error', 'Failed to fetch transactions');
      }
    };

    fetchTotals();
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
            <Text style={styles.incomeValue}>${totalIncome}</Text>
          </View>
          <View style={styles.verticalDivider} />
          <View style={styles.summaryBox}>
            <View style={styles.summaryTitle}>
              <Icon name="pin-end" size={22} color="black" style={styles.icon} />
              <Text style={styles.summaryLabel}>Total Expense</Text>
            </View>
            <Text style={styles.expenseValue}>${totalExpense}</Text>
          </View>
        </View>
      </View>
      <View style={styles.subContainer}>
        <Text style={styles.title}>Welcome to FinWise!</Text>
        <Text style={styles.subtitle}>Track your expenses and manage your finances</Text>
      </View>
    </LinearGradient>
  )
}

export default HomeScreen

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
    padding: 20,
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
});