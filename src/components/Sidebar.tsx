import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
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

export default function Sidebar() {
  const { signOut, isAdmin, user } = useAuth();
  const location = useLocation();
  const [driveUrl, setDriveUrl] = useState<string | null>(null);

  useEffect(() => {
    const fetchUserData = async () => {
      if (!user) return;
      try {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          setDriveUrl(userDoc.data().driveUrl || null);
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
      }
    };

    fetchUserData();
  }, [user]);

  const adminLinks = [
    { name: 'Dashboard', icon: LayoutDashboard, path: '/admin' },
    { name: 'Art Requests', icon: FileText, path: '/admin/requests' },
    { name: 'Users', icon: Users, path: '/admin/users' },
    { name: 'Settings', icon: Settings, path: '/admin/settings' },
  ];

  const userLinks = [
    { name: 'Dashboard', icon: Home, path: '/user' },
    { name: 'New Request', icon: PlusCircle, path: '/user/new-request' },
    { name: 'Chat', icon: MessageCircle, path: '/user/chat' },
    { name: 'Settings', icon: Settings, path: '/user/settings' },
    { name: 'Profile', icon: User, path: '/user/profile' },
  ];

  const links = isAdmin ? adminLinks : userLinks;

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  return (
    <div className="w-64 min-h-screen bg-dark-lighter p-4 flex flex-col fixed">
      <div className="flex items-center gap-2 mb-8 px-2">
        <div className="text-primary font-bold text-xl">Pixel Art</div>
      </div>

      <nav className="flex-1 space-y-2">
        {links.map((link) => (
          <Link
            key={link.path}
            to={link.path}
            className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
              isActive(link.path)
                ? 'bg-primary text-dark'
                : 'text-gray-300 hover:bg-dark-accent'
            }`}
          >
            <link.icon className="h-5 w-5" />
            <span>{link.name}</span>
          </Link>
        ))}

        {!isAdmin && driveUrl && (
          <div className="px-2 py-4">
            <a
              href={driveUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-3 px-4 py-3 rounded-lg transition-all
                bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700
                text-white font-medium shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
            >
              <FolderGit2 className="h-5 w-5" />
              <span>Acessar Google Drive</span>
            </a>
          </div>
        )}

        <div className="flex-1" />

        <button
          onClick={() => signOut()}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-gray-300 hover:bg-dark-accent transition-colors mt-8"
        >
          <LogOut className="h-5 w-5" />
          <span>Sign Out</span>
        </button>
      </nav>
    </div>
  );
}