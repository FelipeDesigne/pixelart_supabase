import { useState, useEffect } from 'react';
import { Bell } from 'lucide-react';
import { collection, query, orderBy, limit, onSnapshot, where, doc, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Popover } from '@headlessui/react';
import { useAuth } from '../contexts/AuthContext';
import { useNotification } from '../contexts/NotificationContext';

interface Notification {
  id: string;
  message: string;
  createdAt: any;
  read: boolean;
  userId: string;
  type: string;
}

export function NotificationsPanel() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const { user } = useAuth();
  const { unreadMessages, unreadByUser, unreadAdminMessages } = useNotification();
  const { isAdmin } = useAuth();

  useEffect(() => {
    if (!user) return;

    const notificationsRef = collection(db, 'notifications');
    const q = query(
      notificationsRef,
      where('userId', '==', user.uid),
      orderBy('createdAt', 'desc'),
      limit(5)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const newNotifications = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Notification[];
      
      setNotifications(newNotifications);
      setUnreadCount(newNotifications.filter(n => !n.read).length);
    });

    return () => unsubscribe();
  }, [user]);

  const markAsRead = async (notificationId: string) => {
    try {
      const notificationRef = doc(db, 'notifications', notificationId);
      await updateDoc(notificationRef, {
        read: true
      });
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const formatDate = (date: any) => {
    if (!date) return '';
    const d = date.toDate();
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    }).format(d);
  };

  return (
    <div className="relative">
      <Bell className="w-6 h-6 text-gray-400 hover:text-white cursor-pointer" />
      {((isAdmin && unreadMessages > 0) || (!isAdmin && unreadAdminMessages > 0) || unreadCount > 0) && (
        <span className="absolute -top-1 -right-1 inline-flex items-center justify-center w-4 h-4 text-xs font-bold text-white bg-red-500 rounded-full">
          {isAdmin ? unreadMessages : (unreadAdminMessages + unreadCount)}
        </span>
      )}
      
      <div className="absolute right-0 mt-2 w-72 bg-gray-800 rounded-lg shadow-lg p-4 hidden group-hover:block">
        <h3 className="text-white font-semibold mb-2">Notificações</h3>
        {isAdmin ? (
          unreadByUser.map((user) => (
            <div key={user.chatId} className="text-gray-300 text-sm mb-2">
              <span className="font-medium">{user.senderName}</span> tem{' '}
              {user.count} {user.count === 1 ? 'mensagem não lida' : 'mensagens não lidas'}
            </div>
          ))
        ) : (
          unreadAdminMessages > 0 && (
            <div className="text-gray-300 text-sm">
              Você tem {unreadAdminMessages}{' '}
              {unreadAdminMessages === 1 ? 'mensagem não lida' : 'mensagens não lidas'} do administrador
            </div>
          )
        )}
        {notifications.length > 0 && (
          <div className="mt-4">
            <h4 className="text-white font-semibold mb-2">Notificações do sistema</h4>
            {notifications.map((notification) => (
              <div
                key={notification.id}
                onClick={() => !notification.read && markAsRead(notification.id)}
                className={`p-3 rounded-lg cursor-pointer transition-colors ${
                  notification.read ? 'bg-gray-800' : 'bg-gray-700 hover:bg-gray-600'
                }`}
              >
                <p className="text-sm">{notification.message}</p>
                <span className="text-xs text-gray-400 mt-1 block">
                  {formatDate(notification.createdAt)}
                </span>
              </div>
            ))}
          </div>
        )}
        {((isAdmin && unreadMessages === 0) || (!isAdmin && unreadAdminMessages === 0) || notifications.length === 0) && (
          <div className="text-gray-400 text-sm">Nenhuma notificação nova</div>
        )}
      </div>
    </div>
  );
}
