import { useNotification } from '../../contexts/NotificationContext';
import { useAuth } from '../../contexts/AuthContext';

export function UnreadBadge() {
  const { unreadMessages, unreadAdminMessages } = useNotification();
  const { isAdmin } = useAuth();

  const count = isAdmin ? unreadMessages : unreadAdminMessages;

  if (count === 0) return null;

  return (
    <span className="inline-flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-red-500 rounded-full">
      {count}
    </span>
  );
}
