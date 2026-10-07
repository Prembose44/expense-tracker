import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCjnkZakAp32KOwEjSVu-XoyVXKn-j1Eu4",
  authDomain: "expense-tracker-c3e28.firebaseapp.com",
  projectId: "expense-tracker-c3e28",
  storageBucket: "expense-tracker-c3e28.firebasestorage.app",
  messagingSenderId: "20712017548",
  appId: "1:20712017548:web:49c92be0188482d610f5a9",
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
