import { Outlet } from 'react-router-dom';
import UserSidebar from '../components/UserSidebar';

export default function UserLayout() {
  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-dark">
      <UserSidebar />
      
      <div className="flex-1 ml-64">
        <main className="p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
