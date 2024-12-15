import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useNotification } from '../contexts/NotificationContext';
import {
  LayoutDashboard,
  Users,
  FileText,
  MessageCircle,
  Settings,
  Upload,
  LogOut
} from 'lucide-react';

export default function AdminSidebar() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const { unreadMessages, unreadRequests } = useNotification();

  const menuItems = [
    { name: 'Dashboard', icon: LayoutDashboard, path: '/admin' },
    { name: 'Usuários', icon: Users, path: '/admin/users' },
    { 
      name: 'Solicitações', 
      icon: FileText, 
      path: '/admin/requests',
      badge: unreadRequests > 0 ? unreadRequests : undefined
    },
    { 
      name: 'Mensagens', 
      icon: MessageCircle, 
      path: '/admin/messages',
      badge: unreadMessages > 0 ? unreadMessages : undefined
    },
    { name: 'Upload de Artes', icon: Upload, path: '/admin/upload-art' },
    { name: 'Configurações', icon: Settings, path: '/admin/settings' }
  ];

  const handleSignOut = async () => {
    const confirmed = window.confirm('Tem certeza que deseja sair?');
    if (confirmed) {
      await signOut();
      navigate('/');
    }
  };

  return (
    <aside className="w-64 min-h-screen bg-dark-lighter border-r border-gray-700 flex flex-col">
      <div className="p-6">
        <h1 className="text-xl font-bold">Admin Panel</h1>
        <p className="text-sm text-gray-400">{user?.email}</p>
      </div>

      <nav className="mt-6 flex-1">
        {menuItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `flex items-center gap-3 px-6 py-3 text-gray-300 hover:bg-dark hover:text-white transition-colors ${
                isActive ? 'bg-dark text-white border-l-4 border-primary' : ''
              }`
            }
          >
            <div className="flex items-center gap-3 flex-1">
              <item.icon className="w-5 h-5" />
              <span>{item.name}</span>
            </div>
            {item.badge && (
              <span className="bg-primary text-white text-xs font-semibold px-2 py-1 rounded-full">
                {item.badge}
              </span>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="p-4 border-t border-gray-700">
        <button
          onClick={handleSignOut}
          className="flex items-center gap-3 px-6 py-3 text-gray-300 hover:bg-dark hover:text-white transition-colors w-full rounded-lg"
        >
          <LogOut className="w-5 h-5" />
          <span>Sair</span>
        </button>
      </div>
    </aside>
  );
}
