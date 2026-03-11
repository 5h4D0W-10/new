
import AsyncStorage from '@react-native-async-storage/async-storage';
import { initializeApp } from "firebase/app";
// @ts-ignore
import { getReactNativePersistence, initializeAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyB2GSA90aI3NTAIvDokLXR5qFmr2i57ctM",
    authDomain: "diary-app-73567.firebaseapp.com",
    projectId: "diary-app-73567",
    storageBucket: "diary-app-73567.firebasestorage.app",
    messagingSenderId: "715758279587",
    appId: "1:715758279587:web:54d7035c822e606e3b1816",
    measurementId: "G-LFGM9ND5JD"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Auth with Persistence for React Native
const auth = initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage)
});

// Initialize Firestore
const db = getFirestore(app);

export { auth, db };
