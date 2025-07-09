import { StyleSheet, Text, View } from 'react-native'
import React from 'react'
import { useNavigation } from '@react-navigation/native';

export default function Stats () {
    const navigation = useNavigation();

    return (
        <View style={styles.placeholderContainer}>
            <Text style={styles.placeholderText}>Statistics Screen</Text>
            <Text style={styles.placeholderSubText}>View your expense analytics here</Text>
        </View>
    );
}

const styles = StyleSheet.create({
  placeholderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
  },
  placeholderText: {
    fontSize: 18,
    color: '#333',
    fontWeight: '600',
    marginBottom: 8,
  },
  placeholderSubText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
  },
});