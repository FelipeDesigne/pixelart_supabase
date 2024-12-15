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

    console.log('[Admin Messages] Setting up listener');
    const messagesRef = collection(db, 'messages');
    const q = query(
      messagesRef,
      where('isAdmin', '==', false),
      where('read', '==', false),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      console.log('[Admin Messages] Got update:', {
        size: snapshot.size,
        docs: snapshot.docs.map(doc => ({
          id: doc.id,
          read: doc.data().read,
          isAdmin: doc.data().isAdmin,
          chatId: doc.data().chatId
        }))
      });
      
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
      console.log('[Admin Messages] Grouped messages:', unreadByUserArray);
      setUnreadByUser(unreadByUserArray);
    }, (error) => {
      console.error('[Admin Messages] Error:', error);
    });

    return () => {
      console.log('[Admin Messages] Cleaning up listener');
      unsubscribe();
    };
  }, [isAdmin, user]);

  // Track unread messages from admin for user
  useEffect(() => {
    if (isAdmin || !user) return;

    console.log('[User Messages] Setting up listener for user:', user.uid);
    const messagesRef = collection(db, 'messages');
    const q = query(
      messagesRef,
      where('chatId', '==', user.uid),
      where('isAdmin', '==', true),
      where('read', '==', false),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      console.log('[User Messages] Got update:', {
        size: snapshot.size,
        docs: snapshot.docs.map(doc => ({
          id: doc.id,
          read: doc.data().read,
          isAdmin: doc.data().isAdmin,
          chatId: doc.data().chatId
        }))
      });
      setUnreadAdminMessages(snapshot.size);
    }, (error) => {
      console.error('[User Messages] Error:', error);
    });

    return () => {
      console.log('[User Messages] Cleaning up listener');
      unsubscribe();
    };
  }, [isAdmin, user]);

  // Track unread requests
  useEffect(() => {
    if (!user) return;

    console.log('[Requests] Setting up listener');
    const requestsRef = collection(db, 'requests');
    const q = query(
      requestsRef,
      where('read', '==', false),
      where(isAdmin ? 'userId' : 'adminRead', '==', isAdmin ? user.uid : false),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      console.log('[Requests] Got update:', {
        size: snapshot.size,
        docs: snapshot.docs.map(doc => ({
          id: doc.id,
          read: doc.data().read,
          userId: doc.data().userId,
          adminRead: doc.data().adminRead
        }))
      });
      
      setUnreadRequests(snapshot.size);

      if (isAdmin) {
        const userRequests = new Map<string, {
          userName: string;
          count: number;
          userId: string;
          status: string;
        }>();

        snapshot.docs.forEach(doc => {
          const data = doc.data();
          const userId = data.userId;
          
          if (!userRequests.has(userId)) {
            userRequests.set(userId, {
              userName: data.userName || 'Usuário',
              count: 1,
              userId: userId,
              status: data.status
            });
          } else {
            const current = userRequests.get(userId)!;
            current.count++;
            userRequests.set(userId, current);
          }
        });

        const unreadRequestsArray = Array.from(userRequests.values());
        console.log('[Requests] Grouped requests:', unreadRequestsArray);
        setUnreadRequestsByUser(unreadRequestsArray);
      }
    }, (error) => {
      console.error('[Requests] Error:', error);
    });

    return () => {
      console.log('[Requests] Cleaning up listener');
      unsubscribe();
    };
  }, [isAdmin, user]);

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
