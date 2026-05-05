import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyAC8xqc-WcjRf9u4ZLVZEQyFjsU570GN6M",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "am-log.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "am-log",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "am-log.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "542058806713",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:542058806713:web:a6d86c3b9b260d52a5ca68",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-MGBCV06BGZ"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
