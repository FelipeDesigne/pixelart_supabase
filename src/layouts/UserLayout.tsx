import { useEffect, useState } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { Menu, X, LogOut, Home, Image, Download } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'react-hot-toast';

export default function UserLayout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [location, setLocation] = useState(null);
  const [menuItems, setMenuItems] = useState([
    { path: '/home', name: 'Home', icon: <Home className="h-6 w-6 mr-2" /> },
    { path: '/images', name: 'Imagens', icon: <Image className="h-6 w-6 mr-2" /> },
    { path: '/downloads', name: 'Downloads', icon: <Download className="h-6 w-6 mr-2" /> },
  ]);

  const navigate = useNavigate();
  const { signOut } = useAuth();

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const handleLogout = async () => {
    try {
      await signOut();
      toast.success('Você saiu com sucesso!');
      navigate('/login');
    } catch (error) {
      console.error('Erro no logout:', error);
      toast.error('Erro ao fazer logout. Tente novamente.');
    }
  };

  useEffect(() => {
    setLocation(window.location);
  }, []);

  return (
    <div className="min-h-screen bg-[#1a1a2e]">
      {/* Header */}
      <header className="bg-[#16162a] shadow-lg">
        <div className="mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <button
                onClick={toggleSidebar}
                className="px-4 inline-flex items-center md:hidden text-white hover:text-[#3b82f6]"
              >
                {isSidebarOpen ? (
                  <X className="h-6 w-6" />
                ) : (
                  <Menu className="h-6 w-6" />
                )}
              </button>
            </div>
            <div className="flex items-center">
              <button
                onClick={handleLogout}
                className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-[#2563eb] hover:bg-[#3b82f6] focus:outline-none transition-colors"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Sair
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="flex h-[calc(100vh-4rem)]">
        {/* Sidebar */}
        <aside
          className={`${
            isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
          } fixed md:relative md:translate-x-0 z-30 w-64 h-full transition-transform duration-300 ease-in-out bg-[#16162a] border-r border-gray-700`}
        >
          <nav className="mt-5 px-2">
            <div className="space-y-1">
              {menuItems.map((item) => (
                <button
                  key={item.path}
                  onClick={() => navigate(item.path)}
                  className={`${
                    location.pathname === item.path
                      ? 'bg-[#2563eb] text-white'
                      : 'text-gray-300 hover:bg-[#2563eb]/80 hover:text-white'
                  } group flex items-center px-2 py-2 text-base font-medium rounded-md w-full transition-colors`}
                >
                  {item.icon}
                  {item.name}
                </button>
              ))}
            </div>
          </nav>
        </aside>

        {/* Overlay */}
        {isSidebarOpen && (
          <div
            className="fixed inset-0 z-20 bg-black bg-opacity-50 md:hidden"
            onClick={toggleSidebar}
          ></div>
        )}

        {/* Main content */}
        <main className="flex-1 overflow-auto bg-[#1a1a2e] p-4">
          <div className="mx-auto max-w-7xl">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
