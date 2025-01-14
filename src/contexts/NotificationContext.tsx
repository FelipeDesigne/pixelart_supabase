import { createContext, useContext, useState, useEffect } from 'react';
import { db } from '../lib/firebase';
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';
import { useAuth } from './AuthContext';

interface NotificationContextType {
  unreadMessages: number;
  unreadByUser: Array<{
    chatId: string;
    senderName: string;
    count: number;
  }>;
  unreadRequests: number;
  unreadRequestsByUser: Array<{
    userId: string;
    userName: string;
    count: number;
    status: string;
  }>;
  unreadAdminMessages: number;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [unreadByUser, setUnreadByUser] = useState<NotificationContextType['unreadByUser']>([]);
  const [unreadRequests, setUnreadRequests] = useState(0);
  const [unreadRequestsByUser, setUnreadRequestsByUser] = useState<NotificationContextType['unreadRequestsByUser']>([]);
  const [unreadAdminMessages, setUnreadAdminMessages] = useState(0);
  const { isAdmin, user } = useAuth();

  // Track unread messages for admin
  useEffect(() => {
    if (!isAdmin || !user) return;

    const messagesRef = collection(db, 'messages');
    const q = query(
      messagesRef,
      where('isAdmin', '==', false),
      where('read', '==', false),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      setUnreadMessages(snapshot.size);

      const userMessages = new Map<string, {
        senderName: string;
        count: number;
        chatId: string;
      }>();

      snapshot.docs.forEach(doc => {
        const data = doc.data();
        const chatId = data.chatId;
        
        if (!userMessages.has(chatId)) {
          userMessages.set(chatId, {
            senderName: data.senderName || 'Usuário',
            count: 1,
            chatId: chatId
          });
        } else {
          const current = userMessages.get(chatId)!;
          current.count++;
          userMessages.set(chatId, current);
        }
      });

      const unreadByUserArray = Array.from(userMessages.values());
      setUnreadByUser(unreadByUserArray);
    });

    return () => unsubscribe();
  }, [isAdmin, user]);

  // Track unread messages for users
  useEffect(() => {
    if (isAdmin || !user) return;

    const messagesRef = collection(db, 'messages');
    const q = query(
      messagesRef,
      where('chatId', '==', user.uid),
      where('isAdmin', '==', true),
      where('read', '==', false)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      console.log('User unread messages:', snapshot.size);
      setUnreadAdminMessages(snapshot.size);
    });

    return () => unsubscribe();
  }, [isAdmin, user]);

  // Track unread requests for admin
  useEffect(() => {
    if (!isAdmin || !user) return;

    const requestsRef = collection(db, 'requests');
    const q = query(
      requestsRef,
      where('read', '==', false),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      setUnreadRequests(snapshot.size);
    });

    return () => unsubscribe();
  }, [isAdmin, user]);

  return (
    <NotificationContext.Provider
      value={{
        unreadMessages,
        unreadByUser,
        unreadRequests,
        unreadRequestsByUser,
        unreadAdminMessages,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotification() {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
}
