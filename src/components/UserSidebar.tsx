import { NavLink } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useNotification } from '../contexts/NotificationContext';
import { useState } from 'react';
import {
  Home,
  FileText,
  User,
  Settings,
  MessageCircle,
  Image,
  LogOut,
  Menu,
  X
} from 'lucide-react';

export default function UserSidebar() {
  const { user, signOut } = useAuth();
  const { unreadAdminMessages } = useNotification();
  const [isOpen, setIsOpen] = useState(false);

  const menuItems = [
    { name: 'Início', icon: Home, path: '/user' },
    { name: 'Nova Solicitação', icon: Image, path: '/user/new-request' },
    { name: 'Minhas Solicitações', icon: FileText, path: '/user/requests' },
    { name: 'Minhas Artes', icon: Image, path: '/user/arts' },
    { 
      name: 'Chat', 
      icon: MessageCircle, 
      path: '/user/chat',
      badge: unreadAdminMessages > 0 ? unreadAdminMessages : undefined
    },
    { name: 'Configurações', icon: Settings, path: '/user/settings' }
  ];

  const handleSignOut = async () => {
    const confirmed = window.confirm('Tem certeza que deseja sair?');
    if (confirmed) {
      await signOut();
    }
  };

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  return (
    <>
      <button
        onClick={toggleMenu}
        className="md:hidden fixed top-4 left-4 z-50 p-2 bg-[#16162a] text-white rounded-lg shadow-lg hover:bg-[#1a1a2e] border border-gray-700"
      >
        {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
      </button>

      <div
        onClick={() => setIsOpen(false)}
        className={`
          fixed inset-0 bg-black bg-opacity-50
          md:hidden
          transition-opacity duration-300
          ${isOpen ? 'opacity-100 visible' : 'opacity-0 invisible'}
          z-30
        `}
      />

      <aside className={`
        fixed md:static
        w-64 h-screen
        bg-[#16162a] border-r border-gray-700
        flex flex-col
        transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        z-40
      `}>
        <div className="p-6 border-b border-gray-700">
          <h1 className="text-xl font-bold text-white">Pixel Art</h1>
          <p className="text-sm text-gray-400">{user?.email}</p>
        </div>

        <nav className="mt-6 flex-1">
          {menuItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={() => setIsOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 px-6 py-3 text-gray-300 hover:bg-[#2563eb]/80 hover:text-white transition-colors ${
                  isActive ? 'bg-[#2563eb] text-white' : ''
                }`
              }
            >
              <div className="flex items-center gap-3 flex-1">
                <item.icon className="w-5 h-5" />
                <span>{item.name}</span>
              </div>
              {item.badge && (
                <span className="bg-red-500 text-white text-xs font-semibold px-2 py-1 rounded-full">
                  {item.badge}
                </span>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="p-4 border-t border-gray-700">
          <button
            onClick={handleSignOut}
            className="flex items-center gap-3 px-6 py-3 text-gray-300 hover:bg-[#2563eb]/80 hover:text-white transition-colors w-full rounded-lg"
          >
            <LogOut className="w-5 h-5" />
            <span>Sair</span>
          </button>
        </div>
      </aside>
    </>
  );
}
