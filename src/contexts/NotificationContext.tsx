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
    if (!isAdmin) return;

    console.log('Setting up unread messages listener');
    const messagesRef = collection(db, 'messages');
    const q = query(
      messagesRef,
      where('read', '==', false),
      where('isAdmin', '==', false)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      console.log('Unread messages snapshot:', snapshot.size, 'messages');
      
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
        console.log('Message data:', data);
        
        if (!userMessages.has(chatId)) {
          userMessages.set(chatId, {
            senderName: data.senderName || 'Usuário',
            count: 1,
            chatId: chatId
          });
        } else {
          const current = userMessages.get(chatId)!;
          current.count++;
        }
      });

      const unreadByUserArray = Array.from(userMessages.values());
      console.log('Unread messages by user:', unreadByUserArray);
      setUnreadByUser(unreadByUserArray);
    }, (error) => {
      console.error('Error in messages listener:', error);
    });

    return () => {
      console.log('Cleaning up unread messages listener');
      unsubscribe();
    };
  }, [isAdmin]);

  // Track unread messages from admin for user
  useEffect(() => {
    if (isAdmin || !user) return;

    console.log('Setting up unread admin messages listener for user:', user.uid);
    const messagesRef = collection(db, 'messages');
    const q = query(
      messagesRef,
      where('chatId', '==', user.uid),
      where('read', '==', false),
      where('isAdmin', '==', true)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      console.log('Unread admin messages:', snapshot.size);
      setUnreadAdminMessages(snapshot.size);
    }, (error) => {
      console.error('Error in admin messages listener:', error);
    });

    return () => {
      console.log('Cleaning up unread admin messages listener');
      unsubscribe();
    };
  }, [isAdmin, user]);

  // Track unread requests
  useEffect(() => {
    if (!isAdmin) return;

    console.log('Setting up unread requests listener');
    const requestsRef = collection(db, 'requests');
    const q = query(
      requestsRef,
      where('read', '==', false)
    );

    const unsubscribe = onSnapshot(q, async (snapshot) => {
      console.log('Unread requests snapshot:', snapshot.size, 'requests');
      
      // Count total unread requests
      const unreadRequestsCount = snapshot.docs.filter(doc => {
        const data = doc.data();
        return data.status === 'pending' || data.status === 'in_progress';
      }).length;

      console.log('Unread requests count:', unreadRequestsCount);
      setUnreadRequests(unreadRequestsCount);

      // Group unread requests by user
      const userRequests = new Map<string, {
        userName: string;
        userId: string;
        count: number;
        status: string;
      }>();

      snapshot.docs
        .filter(doc => {
          const data = doc.data();
          return data.status === 'pending' || data.status === 'in_progress';
        })
        .forEach(doc => {
          const data = doc.data();
          const userId = data.userId;
          console.log('Request data:', data);
          
          if (!userRequests.has(userId)) {
            userRequests.set(userId, {
              userName: data.userName || 'Usuário',
              userId: userId,
              count: 1,
              status: data.status
            });
          } else {
            const current = userRequests.get(userId)!;
            current.count++;
          }
        });

      const unreadRequestsByUserArray = Array.from(userRequests.values());
      console.log('Unread requests by user:', unreadRequestsByUserArray);
      setUnreadRequestsByUser(unreadRequestsByUserArray);
    }, (error) => {
      console.error('Error in requests listener:', error);
    });

    return () => {
      console.log('Cleaning up unread requests listener');
      unsubscribe();
    };
  }, [isAdmin]);

  return (
    <NotificationContext.Provider
      value={{
        unreadMessages,
        unreadByUser,
        unreadRequests,
        unreadRequestsByUser,
        unreadAdminMessages
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
