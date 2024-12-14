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
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [unreadByUser, setUnreadByUser] = useState<NotificationContextType['unreadByUser']>([]);
  const [unreadRequests, setUnreadRequests] = useState(0);
  const [unreadRequestsByUser, setUnreadRequestsByUser] = useState<NotificationContextType['unreadRequestsByUser']>([]);
  const { isAdmin } = useAuth();

  // Track unread messages
  useEffect(() => {
    if (!isAdmin) return;

    const messagesRef = collection(db, 'messages');
    const q = query(
      messagesRef,
      where('read', '==', false),
      where('isAdmin', '==', false),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      // Count total unread messages
      setUnreadMessages(snapshot.size);

      // Group unread messages by user
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
            senderName: data.senderName,
            count: 1,
            chatId: chatId
          });
        } else {
          const current = userMessages.get(chatId)!;
          current.count++;
        }
      });

      setUnreadByUser(Array.from(userMessages.values()));
    });

    return () => unsubscribe();
  }, [isAdmin]);

  // Track unread requests
  useEffect(() => {
    if (!isAdmin) return;

    const requestsRef = collection(db, 'requests');
    const q = query(
      requestsRef,
      where('read', '==', false),
      where('status', 'in', ['pending', 'in_progress']),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      // Count total unread requests
      setUnreadRequests(snapshot.size);

      // Group unread requests by user
      const userRequests = new Map<string, {
        userName: string;
        userId: string;
        count: number;
        status: string;
      }>();

      snapshot.docs.forEach(doc => {
        const data = doc.data();
        const userId = data.userId;
        
        if (!userRequests.has(userId)) {
          userRequests.set(userId, {
            userName: data.userName,
            userId: userId,
            count: 1,
            status: data.status
          });
        } else {
          const current = userRequests.get(userId)!;
          current.count++;
        }
      });

      setUnreadRequestsByUser(Array.from(userRequests.values()));
    });

    return () => unsubscribe();
  }, [isAdmin]);

  return (
    <NotificationContext.Provider
      value={{
        unreadMessages,
        unreadByUser,
        unreadRequests,
        unreadRequestsByUser
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
