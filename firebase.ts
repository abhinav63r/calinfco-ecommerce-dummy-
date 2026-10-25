// Import the functions you need from the SDKs you need
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyAJjPJaoOHue6lvUKzBrYVWNwece5jP5yY",
  authDomain: "calinfo007-1b35f.firebaseapp.com",
  projectId: "calinfo007-1b35f",
  storageBucket: "calinfo007-1b35f.firebasestorage.app",
  messagingSenderId: "138738333998",
  appId: "1:138738333998:web:548a98068ba2d2c1d8a2bf",
  measurementId: "G-7EX9R41V6Q"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
