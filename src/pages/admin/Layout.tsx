import { Outlet } from 'react-router-dom';
import AdminSidebar from '../../components/AdminSidebar';
import { useState, useEffect } from 'react';
import { Sun, Moon, Menu } from 'lucide-react';
import { Breadcrumb } from '../../components/Breadcrumb';
import { NotificationsPanel } from '../../components/NotificationsPanel';

export default function AdminLayout() {
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [lastActivity, setLastActivity] = useState(Date.now());
  const SESSION_TIMEOUT = 30 * 60 * 1000; // 30 minutes

  useEffect(() => {
    const checkActivity = () => {
      if (Date.now() - lastActivity > SESSION_TIMEOUT) {
        // Implement your logout logic here
        alert('Sua sessão expirou. Por favor, faça login novamente.');
      }
    };

    const interval = setInterval(checkActivity, 60000); // Check every minute
    
    const updateActivity = () => setLastActivity(Date.now());
    window.addEventListener('mousemove', updateActivity);
    window.addEventListener('keypress', updateActivity);

    return () => {
      clearInterval(interval);
      window.removeEventListener('mousemove', updateActivity);
      window.removeEventListener('keypress', updateActivity);
    };
  }, [lastActivity]);

  return (
    <div className={`min-h-screen ${isDarkMode ? 'bg-dark text-white' : 'bg-gray-100 text-gray-900'}`}>
      <div className="flex">
        <AdminSidebar isOpen={isSidebarOpen} isDarkMode={isDarkMode} />
        
        <div className={`flex-1 transition-all ${isSidebarOpen ? 'ml-64' : 'ml-0'}`}>
          <header className={`fixed right-0 ${isSidebarOpen ? 'left-64' : 'left-0'} top-0 h-16 ${isDarkMode ? 'bg-dark-lighter' : 'bg-white'} border-b border-gray-700 px-4 flex items-center justify-between z-10`}>
            <div className="flex items-center gap-4">
              <button
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                className="p-2 rounded-lg hover:bg-gray-700 transition-colors"
              >
                <Menu className="w-5 h-5" />
              </button>
              <Breadcrumb />
            </div>
            
            <div className="flex items-center gap-4">
              <button
                onClick={() => setIsDarkMode(!isDarkMode)}
                className="p-2 rounded-lg hover:bg-gray-700 transition-colors"
              >
                {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </button>
              <NotificationsPanel />
            </div>
          </header>
          
          <main className="pt-24 px-8 pb-8">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
}
