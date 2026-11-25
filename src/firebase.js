import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCEEuShA8yB--4IFidwPGUTPwogrOpVtD8",
  authDomain: "weddingc218.firebaseapp.com",
  projectId: "weddingc218",
  storageBucket: "weddingc218.firebasestorage.app",
  messagingSenderId: "692487055754",
  appId: "1:692487055754:web:9bff9e29fd84f642980073",
  measurementId: "G-BHTKT9CP0N"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
