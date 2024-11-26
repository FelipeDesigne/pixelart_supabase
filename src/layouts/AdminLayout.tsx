import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import AdminSidebar from '../components/AdminSidebar';

export default function AdminLayout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const isDarkMode = false; // We'll add theme support later

  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-dark">
      <AdminSidebar isOpen={isSidebarOpen} isDarkMode={isDarkMode} />
      
      <div className={`flex-1 transition-all duration-300 ease-in-out ${isSidebarOpen ? 'ml-64' : 'ml-20'}`}>
        <header className="bg-white dark:bg-dark-lighter shadow h-16 fixed right-0 top-0 flex items-center px-6 z-10"
          style={{ width: `calc(100% - ${isSidebarOpen ? '16rem' : '5rem'})` }}
        >
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-dark"
          >
            <svg
              className="w-6 h-6 text-gray-600 dark:text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              {isSidebarOpen ? (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M11 19l-7-7 7-7m8 14l-7-7 7-7"
                />
              ) : (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 5l7 7-7 7M5 5l7 7-7 7"
                />
              )}
            </svg>
          </button>
        </header>

        <main className="p-6 mt-16">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
