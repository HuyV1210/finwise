import { StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import React from 'react'
import { CommonActions, useNavigation } from '@react-navigation/native';
import { auth } from '../services/firebase';

export default function Profile () {
    const navigation = useNavigation();

    const handleLogout = async () => {
        await auth.signOut();
        // Reset navigation stack and go to Splash
        navigation.dispatch(
          CommonActions.reset({
            index: 0,
            routes: [{ name: 'Splash' }],
          })
        );
      };
    return (
        <View style={styles.placeholderContainer}>
        <Text style={styles.placeholderText}>Profile</Text>
        <Text style={styles.placeholderSubText}>Manage your account settings</Text>
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Text style={styles.logoutText}>Log Out</Text>
        </TouchableOpacity>
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
  logoutButton: {
    backgroundColor: '#FF6B6B',
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 8,
    marginTop: 20,
  },
  logoutText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});