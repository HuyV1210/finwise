import {
  ScrollView,
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import React, { useState } from 'react';
import { StackNavigationProp } from '@react-navigation/stack';
import LinearGradient from 'react-native-linear-gradient';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { auth, firestore } from '../../services/firebase';
import { collection, doc, getDocs, query, setDoc, where } from 'firebase/firestore';

type RootStackParamList = {
  Login: undefined;
  Register: undefined;
  Forgot: undefined;
  Home: undefined;
};

type LoginScreenProps = {
  navigation: StackNavigationProp<RootStackParamList, 'Login'>;
};

export default function Register({ navigation }: LoginScreenProps) {
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const checkUsernameExists = async (username: string): Promise<boolean> => {
    const q = query(collection(firestore, 'users'), where('username', '==', username));
    const snapshot = await getDocs(q);
    return !snapshot.empty;
  };

  const validateEmail = (email: string) => {
    // Simple email regex
    return /\S+@\S+\.\S+/.test(email);
  };

  const handleRegister = async() => {
    const trimmedEmail = email.trim();
    const trimmedUsername = username.trim();

    if (!trimmedUsername) {
      return Alert.alert('Username is required!');
    }
    if (!validateEmail(trimmedEmail)) {
      return Alert.alert('Please enter a valid email address!');
    }
    if (password.length < 6) {
      return Alert.alert('Password must be at least 6 characters!');
    }
    if (password !== confirmPassword) {
      return Alert.alert('Passwords do not match!');
    }
    setLoading(true);

    try {
      if (await checkUsernameExists(trimmedUsername)) {
        setLoading(false);
        return Alert.alert('Username already exists!');
      }
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const uid = userCredential.user.uid;

      await setDoc(doc(firestore, 'users', uid), {
        email,
        username,
        createdAt: new Date()
      });
      Alert.alert('Account created sucessfully');
      navigation.replace('Login');
    } catch(error: any) {
      let msg = error.message;
      Alert.alert('Registration Error', msg)
    }
  }

  return (
    <LinearGradient
      colors={['#00D09E', '#FFFFFF']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.container}
    >
      <Text style={styles.welcomeText}>Register</Text>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1, width: '100%' }}
      >
        <ScrollView
          style={styles.subContainer}
          contentContainerStyle={styles.contentContainer}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={styles.label}>Username</Text>
          <TextInput
            style={styles.input}
            placeholder="you"
            value={username}
            onChangeText={setUsername}
            keyboardType="default"
            autoCapitalize="none"
          />

          <Text style={styles.label}>Email</Text>
          <TextInput
            style={styles.input}
            placeholder="you@example.com"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />

          <Text style={styles.label}>Password</Text>
          <TextInput
            style={styles.input}
            placeholder="********"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />

          <Text style={styles.label}>Confirm Password</Text>
          <TextInput
            style={styles.input}
            placeholder="********"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry
          />

          <TouchableOpacity style={styles.loginButton} onPress={handleRegister}>
            <Text style={styles.loginText}>Register</Text>
          </TouchableOpacity>

          <View style={styles.registerRow}>
            <Text style={styles.smallText}>Already have an account?</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
              <Text style={[styles.linkText]}>Login</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#00D09E',
    flex: 1,
    justifyContent: 'center',
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
  subContainer: {
    backgroundColor: '#F1FFF3',
    borderTopRightRadius: 60,
    borderTopLeftRadius: 60,
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 32,
  },
  contentContainer: {
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
  },
  loginButton: {
    marginTop: 32,
    backgroundColor: '#00B88D',
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
    marginBottom: 24,
  },
  loginText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '700',
  },
  linkText: {
    color: '#00B88D',
    textAlign: 'center',
    fontWeight: '600',
  },
  registerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 24,
    gap: 10
  },
  smallText: {
    fontSize: 14,
    color: '#222',
  },
});
