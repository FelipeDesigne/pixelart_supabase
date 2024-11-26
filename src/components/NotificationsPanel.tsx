import { useState, useEffect } from 'react';
import { Bell } from 'lucide-react';
import { collection, query, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Popover } from '@headlessui/react';

interface Notification {
  id: string;
  message: string;
  createdAt: any;
  read: boolean;
}

export function NotificationsPanel() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const notificationsRef = collection(db, 'notifications');
    const q = query(notificationsRef, orderBy('createdAt', 'desc'), limit(5));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const newNotifications = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Notification[];
      
      setNotifications(newNotifications);
      setUnreadCount(newNotifications.filter(n => !n.read).length);
    });

    return () => unsubscribe();
  }, []);

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
    <Popover className="relative">
      <Popover.Button className="p-2 rounded-lg hover:bg-gray-700 transition-colors relative">
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
            {unreadCount}
          </span>
        )}
      </Popover.Button>

      <Popover.Panel className="absolute right-0 mt-2 w-80 bg-dark-lighter rounded-lg shadow-lg ring-1 ring-black ring-opacity-5 z-50">
        <div className="p-4">
          <h3 className="text-lg font-semibold mb-4">Notificações</h3>
          <div className="space-y-4">
            {notifications.length > 0 ? (
              notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-3 rounded-lg ${
                    notification.read ? 'bg-gray-800' : 'bg-gray-700'
                  }`}
                >
                  <p className="text-sm">{notification.message}</p>
                  <span className="text-xs text-gray-400 mt-1 block">
                    {formatDate(notification.createdAt)}
                  </span>
                </div>
              ))
            ) : (
              <p className="text-gray-400 text-center">Nenhuma notificação</p>
            )}
          </div>
        </div>
      </Popover.Panel>
    </Popover>
  );
}
