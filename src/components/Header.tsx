import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { auth, firestore } from '../services/firebase';
import { doc, getDoc } from 'firebase/firestore';

interface HeaderProps {
  onNotificationPress?: () => void;
  onSearchPress?: () => void;
}

const Header: React.FC<HeaderProps> = ({ 
  onNotificationPress = () => {}, 
  onSearchPress = () => {} 
}) => {
  const [userName, setUserName] = useState<string>('User');

  useEffect(() => {
    const fetchUserName = async () => {
      const user = auth.currentUser;
      if (user) {
        try {
          const userDoc = await getDoc(doc(firestore, 'users', user.uid));
          if (userDoc.exists()) {
            const userData = userDoc.data();
            setUserName(userData?.username || userData?.email?.split('@')[0] || 'User');
          } else {
            // Fallback to email if no document exists
            setUserName(user.email?.split('@')[0] || 'User');
          }
        } catch (error) {
          console.log('Error fetching user data:', error);
          // Fallback to email
          setUserName(user.email?.split('@')[0] || 'User');
        }
      }
    };

    fetchUserName();
  }, []);

  return (
    <View style={styles.container}>
      <View style={styles.leftSection}>
        <Text style={styles.greeting}>Hello,</Text>
        <Text style={styles.userName}>{userName}</Text>
      </View>
      
      <View style={styles.rightSection}>
        <TouchableOpacity 
          style={styles.iconButton} 
          onPress={onSearchPress}
          accessibilityLabel="Search"
        >
          <Icon name="search" size={24} color="#333" />
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.iconButton} 
          onPress={onNotificationPress}
          accessibilityLabel="Notifications"
        >
          <Icon name="notifications" size={24} color="#333" />
          {/* Notification badge - uncomment if you want to show notification count */}
          {/* <View style={styles.notificationBadge}>
            <Text style={styles.badgeText}>3</Text>
          </View> */}
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 20,
    backgroundColor: 'transparent',
  },
  leftSection: {
    flex: 1,
  },
  greeting: {
    fontSize: 16,
    color: '#666',
    fontWeight: '400',
  },
  userName: {
    fontSize: 24,
    color: '#333',
    fontWeight: 'bold',
    marginTop: 2,
  },
  rightSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#DFF7E2',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  notificationBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    backgroundColor: '#FF6B6B',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
});

export default Header;
