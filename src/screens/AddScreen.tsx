import { Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View, ActivityIndicator } from 'react-native'
import React, { useState } from 'react'
import LinearGradient from 'react-native-linear-gradient'
import DateTimePicker from '@react-native-community/datetimepicker';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { useNavigation } from '@react-navigation/native';
import { addDoc, collection } from 'firebase/firestore';
import { auth, firestore } from '../services/firebase';
import { Picker } from '@react-native-picker/picker';
import CategoryPickerModal from '../components/CategoryPickerModal';

const categories = [
  { label: 'Food', value: 'Food' },
  { label: 'Salary', value: 'Salary' },
  { label: 'Transport', value: 'Transport' },
  { label: 'Shopping', value: 'Shopping' },
  { label: 'Health', value: 'Health' },
  { label: 'Entertainment', value: 'Entertainment' },
  { label: 'Other', value: 'Other' },
];

export default function AddScreen () {
  const [formData, setFormData] = useState({
    price: '',
    category: '',
    type: 'expense', // default to expense
    date: new Date(),
    title: '',
    note: '',
  });
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigation = useNavigation();

  const handleChange = (field: string, value: string | Date) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    // Validate price
    if (!formData.price || isNaN(Number(formData.price))) {
      return Alert.alert('Invalid price value. Please enter a valid number.');
    }
  
    // Sanitize price
    const sanitizedPrice = parseFloat(formData.price.toString().replace(/,/g, ''));
  
    // Validate other fields
    if (!formData.category) {
      return Alert.alert('Please enter a category.');
    }
    if (!formData.title) {
      return Alert.alert('Please enter a title.');
    }
    if (!auth.currentUser) {
      return Alert.alert('User not authenticated.');
    }
  
    setLoading(true);
    try {
      await addDoc(collection(firestore, 'transactions'), {
        type: formData.type,
        price: sanitizedPrice,
        category: formData.category,
        date: formData.date,
        title: formData.title,
        note: formData.note,
        userId: auth.currentUser.uid,
        createdAt: new Date(),
      });
      setLoading(false);
      Alert.alert('Success', 'Transaction added!');
      navigation.goBack();
    } catch (err) {
      console.error('Error adding transaction:', err);
      setLoading(false);
      Alert.alert('Error', 'Failed to add transaction.');
    }
  };

  function formatAmount(input: string) {
    // Remove non-digit and non-dot, then format with commas
    const cleaned = input.replace(/[^0-9.]/g, '');
    const parts = cleaned.split('.');
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    return parts.join('.');
  }

  return (
    <LinearGradient
      colors={['#00D09E', '#FFFFFF']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.container}
    >
      <Text style={styles.welcomeText}>Add Transaction</Text>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1, width: '100%' }}
      >
        <ScrollView
          style={styles.subContainer}
          contentContainerStyle={{ flexGrow: 1, paddingBottom: 120 }}
          keyboardShouldPersistTaps="handled"
        >
          {/* Transaction Type Selector */}
          <View style={styles.row}>
            <TouchableOpacity
              style={[
                styles.typeButton,
                formData.type === 'income' && styles.typeButtonActiveIncome,
              ]}
              onPress={() => handleChange('type', 'income')}
            >
              <Text
                style={[
                  styles.typeButtonText,
                  formData.type === 'income' && styles.typeButtonTextActive,
                ]}
              >
                Income
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.typeButton,
                formData.type === 'expense' && styles.typeButtonActiveExpense,
              ]}
              onPress={() => handleChange('type', 'expense')}
            >
              <Text
                style={[
                  styles.typeButtonText,
                  formData.type === 'expense' && styles.typeButtonTextActive,
                ]}
              >
                Expense
              </Text>
            </TouchableOpacity>
          </View>

          {/* Date Picker */}
          <Text style={styles.label}>Date</Text>
          <TouchableOpacity
            onPress={() => setShowDatePicker(true)}
            style={[styles.input, styles.row]}
          >
            <Text>{formData.date.toDateString()}</Text>
            <MaterialIcons name="calendar-today" size={20} color="#555" />
          </TouchableOpacity>
          {showDatePicker && (
            <DateTimePicker
              value={formData.date}
              mode="date"
              display={Platform.OS === 'ios' ? 'inline' : 'default'}
              onChange={(event, selectedDate) => {
                setShowDatePicker(false);
                if (selectedDate) {
                  setFormData((prev) => ({ ...prev, date: selectedDate }));
                }
              }}
            />
          )}

          {/* Amount */}
          <Text style={styles.label}>Amount</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter price"
            value={formData.price}
            onChangeText={(text) => handleChange('price', text)}
            keyboardType="numeric"
          />

          {/* Category */}
          <Text style={styles.label}>Category</Text>
          <TouchableOpacity
            style={[styles.input, { flexDirection: 'row', alignItems: 'center' }]}
            onPress={() => setShowCategoryPicker(true)}
          >
            <Text style={{ color: formData.category ? '#000' : '#999', flex: 1 }}>
              {formData.category || 'Choose a category'}
            </Text>
            <MaterialIcons name="arrow-drop-down" size={24} color="#999" />
          </TouchableOpacity>

          <CategoryPickerModal
            visible={showCategoryPicker}
            onClose={() => setShowCategoryPicker(false)}
            onSelect={(category) => handleChange('category', category)}
          />


          {/* Title */}
          <Text style={styles.label}>Title</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. Lunch, Paycheck"
            value={formData.title}
            onChangeText={(text) => handleChange('title', text)}
          />

          {/* Note */}
          <Text style={styles.label}>Note (optional)</Text>
          <TextInput
            style={styles.input}
            placeholder="Add a note"
            value={formData.note}
            onChangeText={(text) => handleChange('note', text)}
          />

          <TouchableOpacity
            style={[styles.addButton, loading && { opacity: 0.7 }]}
            onPress={handleSubmit}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.addButtonText}>Add Transaction</Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  )
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: '#00D09E',
  },
  subContainer: {
    backgroundColor: '#F1FFF3',
    borderTopRightRadius: 60,
    borderTopLeftRadius: 60,
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 32,
  },
  welcomeText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#222',
    fontFamily: 'Poppins-ExtraBold',
    paddingTop: 100,
    textAlign: 'center',
    paddingBottom: 60,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    marginTop: 16,
    color: '#333',
  },
  input: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#B6E2C8',
    fontSize: 16,
    color: '#222',
    marginBottom: 8,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 16,
    justifyContent: 'space-between'
  },
  typeButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#E5E5EA',
    alignItems: 'center',
  },
  typeButtonActiveIncome: {
    backgroundColor: '#00B88D',
  },
  typeButtonActiveExpense: {
    backgroundColor: '#FF5A5F',
  },
  typeButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  typeButtonTextActive: {
    color: '#fff',
  },
  addButton: {
    marginTop: 32,
    backgroundColor: '#00B88D',
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
    marginBottom: 24,
  },
  addButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '700',
  },
  pickerWrapper: {
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#B6E2C8',
    marginBottom: 8,
    overflow: 'hidden',
  },
  picker: {
    height: 50,
    width: '100%',
  },
});