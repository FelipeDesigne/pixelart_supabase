import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { 
  Home,
  Settings,
  UserCircle,
  FileText,
  MessageCircle,
  LogOut
} from 'lucide-react';

export default function UserSidebar() {
  const { signOut } = useAuth();
  const location = useLocation();

  const links = [
    { name: 'Início', icon: Home, path: '/user' },
    { name: 'Perfil', icon: UserCircle, path: '/user/profile' },
    { name: 'Nova Solicitação', icon: FileText, path: '/user/new-request' },
    { name: 'Chat', icon: MessageCircle, path: '/user/chat' },
    { name: 'Configurações', icon: Settings, path: '/user/settings' }
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

  return (
    <div className="w-64 min-h-screen p-4 fixed bg-white dark:bg-dark-lighter border-r border-gray-200 dark:border-gray-700">
      <div className="flex items-center gap-2 mb-8 px-2">
        <div className="text-xl font-bold text-primary">
          Pixel Art
        </div>
      </div>

      <nav className="flex-1">
        <ul className="space-y-2">
          {links.map((link) => {
            const Icon = link.icon;
            return (
              <li key={link.path}>
                <Link
                  to={link.path}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors
                    ${isActive(link.path)
                      ? 'bg-primary text-white'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-dark'
                    }`}
                >
                  <Icon className="w-5 h-5" />
                  <span>{link.name}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <button
        onClick={handleSignOut}
        className="flex items-center gap-2 px-4 py-2 mt-4 w-full rounded-lg transition-colors text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-dark"
      >
        <LogOut className="w-5 h-5" />
        Sair
      </button>
    </div>
  );
}
