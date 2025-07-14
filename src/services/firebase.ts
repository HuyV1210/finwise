// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getReactNativePersistence, initializeAuth } from 'firebase/auth';
import ReactNativeAsyncStorage from '@react-native-async-storage/async-storage';

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyCgD7pLUY-kDdphIUc1bTuZjP5ZNTTk-kw",
  authDomain: "expense-tracker-bc0ad.firebaseapp.com",
  projectId: "expense-tracker-bc0ad",
  storageBucket: "expense-tracker-bc0ad.firebasestorage.app",
  messagingSenderId: "545194609086",
  appId: "1:545194609086:web:c94ef1effbafe0444fd1ef",
  measurementId: "G-ZMLB2S2577"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

export const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(ReactNativeAsyncStorage),
});
export const firestore = getFirestore(app);
