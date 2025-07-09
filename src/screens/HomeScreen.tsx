import { StyleSheet, Text, View, Alert, TouchableOpacity } from 'react-native'
import React, { useEffect, useState } from 'react'
import Header from '../components/Header'
import { auth, firestore } from '../services/firebase';
import { collection, getDocs, onSnapshot, query, where } from 'firebase/firestore';
import Icon from 'react-native-vector-icons/MaterialIcons';
import LinearGradient from 'react-native-linear-gradient';
import { useNavigation } from '@react-navigation/native';

export default function Home () {
  const [totalIncome, setTotalIncome] = useState(0);
  const [totalExpense, setTotalExpense] = useState(0);
  const [selectedPeriod, setSelectedPeriod] = useState('daily');
  const [filteredTransactions, setFilteredTransactions] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const navigation = useNavigation();

  const handlePeriodPress = (period: string) => {
    setSelectedPeriod(period);
    console.log(`Selected period: ${period}`);
    // Add logic to filter transactions based on the selected period
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
  
      let income = 0;
      let expense = 0;
  
      snapshot.forEach((doc) => {
        const data = doc.data();
      
        // Remove commas from the price string and convert to a number
        const price = Number(data.price.replace(/,/g, '')) || 0;
      
        if (data.type === 'income') {
          income += price;
        } else if (data.type === 'expense') {
          expense += price;
        }
      });
  
      setTotalIncome(income);
      setTotalExpense(expense);
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
            <Text style={styles.incomeValue}>+{new Intl.NumberFormat('en-US').format(totalIncome)}</Text>
            <Text style={styles.summaryCurrency}>VND</Text>
          </View>
          <View style={styles.verticalDivider} />
          <View style={styles.summaryBox}>
            <View style={styles.summaryTitle}>
              <Icon name="pin-end" size={22} color="black" style={styles.icon} />
              <Text style={styles.summaryLabel}>Total Expense</Text>
            </View>
            <Text style={styles.expenseValue}>-{new Intl.NumberFormat('en-US').format(totalExpense)}</Text>
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
});