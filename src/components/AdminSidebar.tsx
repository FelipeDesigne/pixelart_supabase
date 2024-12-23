import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useNotification } from '../contexts/NotificationContext';
import { toast } from 'react-hot-toast';
import {
  LayoutDashboard,
  Users,
  MessageSquare,
  Settings,
  LogOut,
  Menu,
  X,
  Upload,
  ClipboardList
} from 'lucide-react';

export default function AdminSidebar() {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { signOut } = useAuth();
  const { unreadMessages, unreadRequests } = useNotification();

  const menuItems = [
    { path: '/admin', name: 'Dashboard', icon: <LayoutDashboard className="w-6 h-6" /> },
    { path: '/admin/users', name: 'Usuários', icon: <Users className="w-6 h-6" /> },
    { path: '/admin/upload-art', name: 'Upload de Artes', icon: <Upload className="w-6 h-6" /> },
    { 
      path: '/admin/messages', 
      name: 'Mensagens', 
      icon: <MessageSquare className="w-6 h-6" />,
      badge: unreadMessages > 0 ? unreadMessages : undefined 
    },
    { 
      path: '/admin/requests', 
      name: 'Solicitações', 
      icon: <ClipboardList className="w-6 h-6" />,
      badge: unreadRequests > 0 ? unreadRequests : undefined 
    },
    { path: '/admin/settings', name: 'Configurações', icon: <Settings className="w-6 h-6" /> },
  ];

  const handleLogout = async () => {
    try {
      await signOut();
      toast.success('Logout realizado com sucesso!');
      navigate('/login');
    } catch (error) {
      console.error('Erro no logout:', error);
      toast.error('Erro ao fazer logout. Tente novamente.');
    }
  };

  return (
    <>
      {/* Mobile menu button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed top-4 left-4 z-50 md:hidden text-white hover:text-[#3b82f6]"
      >
        {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
      </button>

      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
          onClick={() => setIsOpen(false)}
        ></div>
      )}

      {/* Sidebar */}
      <aside
        className={`${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        } fixed md:translate-x-0 w-64 h-full bg-[#16162a] border-r border-gray-700 z-50 transition-transform duration-200 ease-in-out`}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-center h-16 border-b border-gray-700">
            <h1 className="text-xl font-bold text-white">Admin Panel</h1>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-4 space-y-2 overflow-y-auto">
            {menuItems.map((item) => (
              <button
                key={item.path}
                onClick={() => {
                  navigate(item.path);
                  setIsOpen(false);
                }}
                className={`${
                  location.pathname === item.path
                    ? 'bg-[#2563eb] text-white'
                    : 'text-gray-300 hover:bg-[#2563eb]/80 hover:text-white'
                } flex items-center justify-between w-full px-4 py-2 text-sm font-medium rounded-lg transition-colors`}
              >
                <div className="flex items-center">
                  {item.icon}
                  <span className="ml-3">{item.name}</span>
                </div>
                {item.badge && (
                  <span className="px-2 py-1 text-xs font-semibold text-white bg-red-500 rounded-full">
                    {item.badge}
                  </span>
                )}
              </button>
            ))}
          </nav>

          {/* Logout button */}
          <div className="p-4 border-t border-gray-700">
            <button
              onClick={handleLogout}
              className="flex items-center w-full px-4 py-2 text-sm font-medium text-gray-300 rounded-lg hover:bg-[#2563eb]/80 hover:text-white transition-colors"
            >
              <LogOut className="w-6 h-6" />
              <span className="ml-3">Logout</span>
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
