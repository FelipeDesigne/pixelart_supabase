import { useLocation, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useNotification } from '../contexts/NotificationContext';
import { useState } from 'react';
import { 
  LayoutDashboard, 
  Users, 
  FileText,
  MessageCircle,
  LogOut,
  Settings,
  ChevronDown,
  Clock,
  PlayCircle
} from 'lucide-react';

interface AdminSidebarProps {
  isOpen: boolean;
  isDarkMode: boolean;
}

export default function AdminSidebar({ isOpen, isDarkMode }: AdminSidebarProps) {
  const { signOut } = useAuth();
  const location = useLocation();
  const { unreadMessages, unreadByUser, unreadRequests, unreadRequestsByUser } = useNotification();
  const [showRequestNotifications, setShowRequestNotifications] = useState(false);

  console.log('AdminSidebar - unreadMessages:', unreadMessages);
  console.log('AdminSidebar - unreadByUser:', unreadByUser);

  const links = [
    { name: 'Dashboard', icon: LayoutDashboard, path: '/admin' },
    { name: 'Usuários', icon: Users, path: '/admin/users' },
    { name: 'Solicitações', icon: FileText, path: '/admin/requests', badge: unreadRequests },
    { name: 'Mensagens', icon: MessageCircle, path: '/admin/messages', badge: unreadMessages },
    { name: 'Configurações', icon: Settings, path: '/admin/settings' }
  ];

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  const handleSignOut = async () => {
    const confirmed = window.confirm('Tem certeza que deseja sair?');
    if (confirmed) {
      await signOut();
    }
  };

  const sidebarClasses = `
    ${isOpen ? 'w-64' : 'w-20'} 
    bg-dark-lighter
    min-h-screen p-4 flex flex-col fixed transition-all duration-300 ease-in-out
    border-r border-gray-700
  `;

  return (
    <div className={sidebarClasses}>
      <div className={`flex items-center gap-2 mb-8 px-2 ${!isOpen && 'justify-center'}`}>
        <div className={`text-primary font-bold ${isOpen ? 'text-xl' : 'text-sm'}`}>
          {isOpen ? 'Pixel Art' : 'PA'}
        </div>
      </div>

      <nav className="flex-1">
        <ul className="space-y-2">
          {links.map((link) => {
            const Icon = link.icon;
            const isRequests = link.path === '/admin/requests';
            
            return (
              <li key={link.path} className="relative">
                <Link
                  to={link.path}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors
                    ${isActive(link.path)
                      ? 'bg-primary text-white'
                      : 'text-gray-300 hover:text-white hover:bg-dark'
                    }`}
                  title={!isOpen ? link.name : undefined}
                  onClick={(e) => {
                    if (isRequests && link.badge && link.badge > 0) {
                      e.preventDefault();
                      setShowRequestNotifications(!showRequestNotifications);
                    }
                  }}
                >
                  <Icon className="w-5 h-5" />
                  {isOpen && (
                    <span className="flex-1">{link.name}</span>
                  )}
                  {link.badge && link.badge > 0 && (
                    <span className="flex items-center">
                      <span className="relative inline-flex rounded-full h-5 w-5 bg-red-500 items-center justify-center text-white text-xs">
                        {link.badge}
                      </span>
                      {isOpen && isRequests && (
                        <ChevronDown 
                          className={`w-4 h-4 ml-1 transform transition-transform ${
                            showRequestNotifications ? 'rotate-180' : ''
                          }`} 
                        />
                      )}
                    </span>
                  )}
                </Link>

                {/* Dropdown de notificações de solicitações */}
                {isRequests && showRequestNotifications && link.badge && link.badge > 0 && isOpen && (
                  <div className="absolute left-0 right-0 mt-1 bg-white dark:bg-dark-lighter rounded-lg shadow-lg overflow-hidden z-50">
                    {unreadRequestsByUser.map((notification) => (
                      <Link
                        key={notification.userId}
                        to={`/admin/requests?user=${notification.userId}`}
                        className="flex items-center justify-between px-4 py-2 hover:bg-gray-100 dark:hover:bg-dark"
                        onClick={() => setShowRequestNotifications(false)}
                      >
                        <div className="flex flex-col">
                          <span className="text-sm truncate">
                            {notification.userName}
                          </span>
                          <span className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                            {notification.status === 'pending' ? (
                              <>
                                <Clock className="w-3 h-3" />
                                Pendente
                              </>
                            ) : (
                              <>
                                <PlayCircle className="w-3 h-3" />
                                Em progresso
                              </>
                            )}
                          </span>
                        </div>
                        <span className="inline-flex items-center justify-center h-5 w-5 rounded-full bg-red-500 text-white text-xs">
                          {notification.count}
                        </span>
                      </Link>
                    ))}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      </nav>

      <button
        onClick={handleSignOut}
        className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors mt-4
          text-gray-300 hover:text-white hover:bg-dark`}
        title={!isOpen ? 'Sair' : undefined}
      >
        <LogOut className="w-5 h-5" />
        {isOpen && 'Sair'}
      </button>
    </div>
  );
}
