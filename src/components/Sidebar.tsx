import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useNotification } from '../contexts/NotificationContext';
import { useState, useEffect } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { 
  LayoutDashboard, 
  Users, 
  Settings, 
  FileText, 
  LogOut,
  PlusCircle,
  User,
  MessageCircle,
  Home,
  FolderGit2
} from 'lucide-react';
import ConfirmDialog from './ConfirmDialog';

export default function Sidebar() {
  const { signOut, isAdmin, user } = useAuth();
  const { unreadAdminMessages } = useNotification();
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const location = useLocation();
  const [userName, setUserName] = useState('');

  useEffect(() => {
    const fetchUserName = async () => {
      if (user?.uid) {
        const userRef = doc(db, 'users', user.uid);
        const userDoc = await getDoc(userRef);
        if (userDoc.exists()) {
          setUserName(userDoc.data().name);
        }
      }
    };

    fetchUserName();
  }, [user]);

  const handleLogout = () => {
    setShowConfirmDialog(true);
  };

  const confirmLogout = async () => {
    await signOut();
    setShowConfirmDialog(false);
  };

  const adminLinks = [
    { name: 'Dashboard', icon: LayoutDashboard, path: '/admin' },
    { name: 'Usuários', icon: Users, path: '/admin/users' },
  ];

  const userLinks = [
    { name: 'Início', icon: Home, path: '/user' },
    { name: 'Perfil', icon: User, path: '/user/profile' },
    { name: 'Nova Solicitação', icon: PlusCircle, path: '/user/new-request' },
    { name: 'Solicitações', icon: FileText, path: '/user/requests' },
    { 
      name: 'Chat', 
      icon: MessageCircle, 
      path: '/user/chat',
      badge: unreadAdminMessages > 0 ? unreadAdminMessages : undefined
    },
    { name: 'Configurações', icon: Settings, path: '/user/settings' },
  ];

  const links = isAdmin ? adminLinks : userLinks;

  return (
    <>
      <aside className="fixed left-0 top-0 h-screen w-64 bg-[#16162a] border-r border-gray-700 p-4">
        <div className="flex items-center gap-2 mb-8">
          <FolderGit2 className="w-8 h-8 text-[#2563eb]" />
          <span className="text-xl font-bold text-white">PixelArt</span>
        </div>

        <nav className="space-y-2">
          {links.map((link) => {
            const Icon = link.icon;
            const isActive = location.pathname === link.path;
            
            return (
              <Link
                key={link.path}
                to={link.path}
                className={`flex items-center justify-between px-4 py-2 rounded-lg transition-colors
                  ${isActive 
                    ? 'bg-[#2563eb] text-white' 
                    : 'text-gray-300 hover:text-white hover:bg-[#2563eb]/80'
                  }`}
              >
                <div className="flex items-center gap-2">
                  <Icon className="w-5 h-5" />
                  <span>{link.name}</span>
                </div>
                {link.badge && (
                  <span className="px-2 py-1 text-xs font-semibold text-white bg-red-500 rounded-full">
                    {link.badge}
                  </span>
                )}
              </Link>
            );
          })}

          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-4 py-2 rounded-lg transition-colors text-gray-300 hover:text-white hover:bg-[#2563eb]/80 w-full"
          >
            <LogOut className="w-5 h-5" />
            <span>Sair</span>
          </button>
        </nav>

        <div className="absolute bottom-4 left-4 right-4">
          <div className="bg-[#1a1a2e] p-4 rounded-lg border border-gray-700">
            <div className="text-sm text-gray-400">Logado como</div>
            <div className="font-medium text-white truncate">{userName}</div>
          </div>
        </div>
      </aside>

      <ConfirmDialog
        isOpen={showConfirmDialog}
        onClose={() => setShowConfirmDialog(false)}
        onConfirm={confirmLogout}
        title="Confirmar Logout"
        message="Tem certeza que deseja sair?"
      />
    </>
  );
}