import ReactNativeAsyncStorage from '@react-native-async-storage/async-storage';
import { getAnalytics, isSupported } from "firebase/analytics";
import { initializeApp } from "firebase/app";
import { browserLocalPersistence, getReactNativePersistence, initializeAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getFunctions } from "firebase/functions";
import { Platform } from 'react-native';

const firebaseConfig = {
    apiKey: "AIzaSyBpRisMY83GkC8NH5_KiL0phTWCT8rV4rc",
    authDomain: "earnrewards-b118b.firebaseapp.com",
    projectId: "earnrewards-b118b",
    storageBucket: "earnrewards-b118b.firebasestorage.app",
    messagingSenderId: "371661126898",
    appId: "1:371661126898:web:3e2cae16d0c95be40f246b",
    measurementId: "G-2KJG5GQJNV"
};

const app = initializeApp(firebaseConfig);

// Initialize Auth with platform-specific persistence
export const auth = initializeAuth(app, {
    persistence: Platform.OS === 'web'
        ? browserLocalPersistence
        : getReactNativePersistence(ReactNativeAsyncStorage)
});

export const db = getFirestore(app);
export const functions = getFunctions(app, 'us-central1');

// Analytics initialization (safely for mobile/web)
export const analytics = isSupported().then(yes => yes ? getAnalytics(app) : null);

export default app;
