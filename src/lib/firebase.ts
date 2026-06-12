import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyASwjQq-DtF7zl-TWTq3qQ_2e4oqb49pbI",
  authDomain: "aurora-health-77aed.firebaseapp.com",
  projectId: "aurora-health-77aed",
  storageBucket: "aurora-health-77aed.firebasestorage.app",
  messagingSenderId: "1041986470832",
  appId: "1:1041986470832:web:a6f4aee90fb67230d8cc75",
};
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
