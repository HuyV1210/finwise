// src/screens/SplashScreen.tsx
import React, { useEffect } from 'react';
import { Text, StyleSheet, ActivityIndicator, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { StackNavigationProp } from '@react-navigation/stack';
import LinearGradient from 'react-native-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { auth } from '../services/firebase';

type RootStackParamList = {
  Splash: undefined;
  Welcome: undefined;
  Home: undefined;
};

type SplashScreenProps = {
  navigation: StackNavigationProp<RootStackParamList, 'Splash'>;
};

export default function SplashScreen({ navigation }: SplashScreenProps) {
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      const rememberedEmail = await AsyncStorage.getItem('rememberedEmail');
      if (user && rememberedEmail) {
        navigation.replace('Home');
      } else {
        setTimeout(() => {
          navigation.replace('Welcome');
        }, 2000);
      }
    });
    return unsubscribe;
  }, [navigation]);

  return (
    <>
      <StatusBar barStyle="light-content" backgroundColor="#00D09E" />
        <LinearGradient 
            colors={['#00D09E', '#FFFFFF']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.container}
        >
        <SafeAreaView style={styles.safeArea}>
          <Text 
            style={styles.logo}
            accessibilityLabel="FinWise App Logo"
            accessibilityRole="text"
          >
            FinWise
          </Text>
        </SafeAreaView>
      </LinearGradient>
    </>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    justifyContent: 'center'
  },
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    fontSize: 48,
    fontWeight: '800',
    fontFamily: 'Poppins-ExtraBold',
    color: 'black',
    marginBottom: 20,
    letterSpacing: 1,
    textAlign: 'center',
  },
});
