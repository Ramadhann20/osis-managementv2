// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyAuZn0DqFOhJdhetxGWW-rXd1ImcZ8gibg",
  authDomain: "osis-management.firebaseapp.com",
  projectId: "osis-management",
  storageBucket: "osis-management.firebasestorage.app",
  messagingSenderId: "375730814474",
  appId: "1:375730814474:web:2f908de573f86673d969f3",
  measurementId: "G-0MMLVK387G"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app)
export const db = getFirestore(app);