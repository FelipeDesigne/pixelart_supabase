import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  User,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged
} from 'firebase/auth';
import { auth, db } from '../lib/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';

interface AuthContextType {
  user: User | null;
  isAdmin: boolean;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<boolean>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const checkAdminStatus = async (user: User) => {
    console.log('Checking admin status for:', user.email);
    
    // Se o email for o admin principal, retorna true direto
    if (user.email === 'felipebdias98@gmail.com') {
      console.log('Main admin email detected');
      return true;
    }

    // Caso contrário, verifica no Firestore
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('uid', '==', user.uid));
    const snapshot = await getDocs(q);
    
    if (!snapshot.empty) {
      const userData = snapshot.docs[0].data();
      console.log('User data from Firestore:', userData);
      return userData.role === 'admin';
    }

    console.log('No user data found in Firestore');
    return false;
  };

  useEffect(() => {
    console.log('Setting up auth listener');
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      console.log('Auth state changed. User:', user?.email);
      
      if (user) {
        setUser(user);
        const adminStatus = await checkAdminStatus(user);
        console.log('Admin status determined:', adminStatus);
        setIsAdmin(adminStatus);
      } else {
        console.log('No user logged in');
        setUser(null);
        setIsAdmin(false);
      }
      
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      console.log('Attempting sign in for:', email);
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      setUser(userCredential.user);
      const adminStatus = await checkAdminStatus(userCredential.user);
      console.log('Sign in successful. Admin status:', adminStatus);
      setIsAdmin(adminStatus);
      return adminStatus;
    } catch (error: any) {
      console.error('Sign in error:', error);
      setUser(null);
      setIsAdmin(false);
      
      // Traduzindo mensagens de erro do Firebase
      switch (error.code) {
        case 'auth/invalid-email':
          throw new Error('Email inválido');
        case 'auth/user-disabled':
          throw new Error('Esta conta foi desativada');
        case 'auth/user-not-found':
          throw new Error('Usuário não encontrado');
        case 'auth/wrong-password':
          throw new Error('Senha incorreta');
        case 'auth/too-many-requests':
          throw new Error('Muitas tentativas de login. Tente novamente mais tarde');
        case 'auth/network-request-failed':
          throw new Error('Erro de conexão. Verifique sua internet');
        default:
          throw new Error('Erro ao fazer login. Tente novamente');
      }
    }
  };

  async function signOut() {
    try {
      await firebaseSignOut(auth);
      navigate('/login');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const value = {
    user,
    isAdmin,
    loading,
    signIn,
    signOut
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}