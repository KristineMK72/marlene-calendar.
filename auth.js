// ===== FINAL CORRECTED auth.js SCRIPT =====

// 1. Import all necessary Firebase modules using the external CDN links
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup // CRITICAL FOR GOOGLE SIGN-IN
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

// Import Firestore modules (for the database)
import {
  getFirestore,
  collection,
  addDoc,
  query,
  where,
  getDocs,
  deleteDoc,
  doc
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// Your live Firebase configuration (Copied from your Console)
const firebaseConfig = {
  apiKey: "AIzaSyAQPGLsHeBe4V5drTqgNmXQtcNGR8t1P-c",
  authDomain: "marlene-calendar-e9146.firebaseapp.com",
  projectId: "marlene-calendar-e9146",
  storageBucket: "marlene-calendar-e9146.firebasestorage.app",
  messagingSenderId: "532816579589",
  appId: "1:532816579589:web:a6eec356844a6d45c9206c"
};

// 2. Initialize Firebase services
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// ===== 3. Authentication Functions (Exported for use in HTML files) =====

export function registerUser(email, password) {
  return createUserWithEmailAndPassword(auth, email, password);
}

export function loginUser(email, password) {
  return signInWithEmailAndPassword(auth, email, password);
}

export function logoutUser() {
  return signOut(auth);
}

export function signInWithGoogle() {
  const provider = new GoogleAuthProvider();
  return signInWithPopup(auth, provider);
}

export function subscribeToAuthChanges(callback) {
  onAuthStateChanged(auth, callback);
}

// Export the service objects for use in script.js database calls
export { db, auth, app };