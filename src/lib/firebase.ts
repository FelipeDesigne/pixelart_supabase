import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyBYSW8hld83rMuUp2QGrbNzghVtZn4C-4U",
  authDomain: "novopixel-21feb.firebaseapp.com",
  projectId: "novopixel-21feb",
  storageBucket: "novopixel-21feb.firebasestorage.app",
  messagingSenderId: "54425792702",
  appId: "1:54425792702:web:96091c37e1294f8206eeef"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);