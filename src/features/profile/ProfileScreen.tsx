import { StyleSheet, Text, TouchableOpacity, View, ScrollView, Alert, ActivityIndicator } from 'react-native'
import React, { useState, useEffect, useMemo } from 'react'
import { CommonActions, useNavigation } from '@react-navigation/native';
import { auth, firestore } from '../../services/firebase';
import { doc, getDoc } from 'firebase/firestore';
import Icon from 'react-native-vector-icons/MaterialIcons';
import LinearGradient from 'react-native-linear-gradient';

const MenuItem = ({ icon, title, subtitle, onPress }: { icon: string; title: string; subtitle: string; onPress: () => void }) => (
  <TouchableOpacity
    style={styles.menuItem}
    onPress={onPress}
  >
    <View style={styles.menuIconContainer}>
      <Icon name={icon} size={24} color="#00B88D" />
    </View>
    <View style={styles.menuContent}>
      <Text style={styles.menuTitle}>{title}</Text>
      <Text style={styles.menuSubtitle}>{subtitle}</Text>
    </View>
    <Icon name="chevron-right" size={20} color="#999" />
  </TouchableOpacity>
);

export default function Profile () {
    const navigation = useNavigation();
    const [userInfo, setUserInfo] = useState<{
      username: string;
      email: string;
      joinDate: string;
    } | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
      fetchUserInfo();
    }, []);

    const fetchUserInfo = async () => {
      try {
        const user = auth.currentUser;
        if (user) {
          const userDoc = await getDoc(doc(firestore, 'users', user.uid));
          if (userDoc.exists()) {
            const userData = userDoc.data();
            setUserInfo({
              username: userData.username || 'User',
              email: userData.email || user.email || '',
              joinDate: userData.createdAt?.toDate().toLocaleDateString() || 'Unknown',
            });
          } else {
            setUserInfo({
              username: user.email?.split('@')[0] || 'User',
              email: user.email || '',
              joinDate: user.metadata.creationTime 
                ? new Date(user.metadata.creationTime).toLocaleDateString()
                : 'Unknown',
            });
          }
        }
      } catch (error: unknown) {
        let msg = 'Failed to load user information';
        if (error instanceof Error) msg = error.message;
        console.error('Error fetching user info:', error);
        Alert.alert('Error', msg);
      } finally {
        setLoading(false);
      }
    };

    const handleLogout = async () => {
      Alert.alert(
        'Logout',
        'Are you sure you want to logout?',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Logout',
            style: 'destructive',
            onPress: async () => {
              try {
                await auth.signOut();
                navigation.dispatch(
                  CommonActions.reset({
                    index: 0,
                    routes: [{ name: 'Splash' }],
                  })
                );
              } catch (error: unknown) {
                let msg = 'Failed to logout';
                if (error instanceof Error) msg = error.message;
                Alert.alert('Error', msg);
              }
            },
          },
        ]
      );
    };

    const menuItems = useMemo(() => [
      {
        icon: 'person-outline',
        title: 'Edit Profile',
        subtitle: 'Update your personal information',
        onPress: () => Alert.alert('Coming Soon', 'Edit profile feature is coming soon!'),
      },
      {
        icon: 'security',
        title: 'Privacy & Security',
        subtitle: 'Manage your account security',
        onPress: () => Alert.alert('Coming Soon', 'Privacy settings coming soon!'),
      },
      {
        icon: 'notifications-outline',
        title: 'Notifications',
        subtitle: 'Configure notification preferences',
        onPress: () => Alert.alert('Coming Soon', 'Notification settings coming soon!'),
      },
      {
        icon: 'help-outline',
        title: 'Help & Support',
        subtitle: 'Get help and contact support',
        onPress: () => Alert.alert('Coming Soon', 'Help center coming soon!'),
      },
      {
        icon: 'info-outline',
        title: 'About FinWise',
        subtitle: 'App version and information',
        onPress: () => Alert.alert('FinWise', 'Version 1.0.0\nYour personal finance assistant'),
      },
    ], []);

    if (loading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#00B88D" />
          <Text style={styles.loadingText}>Loading profile...</Text>
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
              <Text style={styles.headerTitle}>Profile</Text>
            </View>

            {/* User Info Card */}
            <View style={styles.userCard}>
              <View style={styles.avatarContainer}>
                <LinearGradient
                  colors={['#00B88D', '#00D09E']}
                  style={styles.avatar}
                >
                  <Icon name="person" size={40} color="#FFFFFF" />
                </LinearGradient>
              </View>
              <View style={styles.userInfo}>
                <Text style={styles.userName}>{userInfo?.username}</Text>
                <Text style={styles.userEmail}>{userInfo?.email}</Text>
                <Text style={styles.joinDate}>Member since {userInfo?.joinDate}</Text>
              </View>
            </View>

            {/* Menu Items */}
            <View style={styles.menuContainer}>
              {menuItems.map((item, index) => (
                <View key={index} style={index === menuItems.length - 1 ? styles.lastMenuItem : undefined}>
                  <MenuItem {...item} />
                </View>
              ))}
            </View>

            {/* Logout Button */}
            <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
              <Icon name="logout" size={20} color="#fff" />
              <Text style={styles.logoutText}>Logout</Text>
            </TouchableOpacity>

            {/* App Info */}
            <View style={styles.appInfo}>
              <Text style={styles.appInfoText}>FinWise - Personal Finance Assistant</Text>
              <Text style={styles.versionText}>Version 1.0.0</Text>
            </View>
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
  userCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 16,
    padding: 20,
    flexDirection: 'row',
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
  avatarContainer: {
    marginRight: 16,
  },
  avatar: {
    width: 70,
    height: 70,
    borderRadius: 35,
    justifyContent: 'center',
    alignItems: 'center',
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
    fontFamily: 'Poppins-SemiBold',
  },
  userEmail: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
    fontFamily: 'Poppins-Regular',
  },
  joinDate: {
    fontSize: 12,
    color: '#999',
    fontFamily: 'Poppins-Regular',
  },
  menuContainer: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  lastMenuItem: {
    borderBottomWidth: 0,
  },
  menuIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F0F9F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  menuContent: {
    flex: 1,
  },
  menuTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
    fontFamily: 'Poppins-SemiBold',
  },
  menuSubtitle: {
    fontSize: 12,
    color: '#666',
    fontFamily: 'Poppins-Regular',
  },
  logoutButton: {
    backgroundColor: '#FF6B6B',
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#FF6B6B',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  logoutText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
    fontFamily: 'Poppins-SemiBold',
  },
  appInfo: {
    alignItems: 'center',
    paddingVertical: 20,
    paddingHorizontal: 20,
  },
  appInfoText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 4,
    fontFamily: 'Poppins-Regular',
  },
  versionText: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
    fontFamily: 'Poppins-Regular',
  },
});