import { initializeApp, getApps } from 'firebase/app';
import { 
  getAuth, 
  signInWithPopup, 
  GoogleAuthProvider, 
  onAuthStateChanged, 
  signOut,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendEmailVerification,
  sendPasswordResetEmail, // Added for Forgot Password
  verifyBeforeUpdateEmail // Added for Change Email
} from 'firebase/auth';
import { 
  getFirestore, 
  collection, 
  addDoc, 
  onSnapshot, 
  updateDoc, 
  doc,
  deleteDoc,
  query,
  where,
  orderBy,
  serverTimestamp
} from 'firebase/firestore';
export const ADMIN_EMAIL = "ramoshowardkingsley58@gmail.com";
export const appId = "swifftnet-remote-v3";
export const base = ['artifacts', appId, 'public', 'data'];
export const firebaseConfig = {
  apiKey: "AIzaSyD7KSnje8RL_y6p2YVJB1C449Sudvhv6Ek",
  authDomain: "swifftnet-remote.firebaseapp.com",
  projectId: "swifftnet-remote",
  storageBucket: "swifftnet-remote.firebasestorage.app",
  messagingSenderId: "75832411435",
  appId: "1:75832411435:web:6b718c4d9b89db533d316e",
  measurementId: "G-EQ7VZ079W9"
};
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();

//email JS Config
const EJS_SERVICE_ID = "service_7s9tg36"; 
const EJS_TEMPLATE_ID = "template_9pjx12n"; 
const EJS_PUBLIC_KEY = "gULI8936r5B6AVPx1"; 