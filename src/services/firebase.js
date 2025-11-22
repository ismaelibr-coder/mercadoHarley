import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getAnalytics } from "firebase/analytics";

// Firebase configuration from Firebase Console
const firebaseConfig = {
  apiKey: "AIzaSyDeUYh2zgw0xg8bZ4FVBKXv5tcS4cINKuM",
  authDomain: "mercado-harely.firebaseapp.com",
  projectId: "mercado-harely",
  storageBucket: "mercado-harely.firebasestorage.app",
  messagingSenderId: "1028753545704",
  appId: "1:1028753545704:web:44f236bf302f6e28e22c5d",
  measurementId: "G-T87PCR3BCY"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Export services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const analytics = getAnalytics(app);

export default app;
