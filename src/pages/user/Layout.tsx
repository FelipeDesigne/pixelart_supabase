import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import UserSidebar from '../../components/UserSidebar';
import InstallPWA from '../../components/InstallPWA';

export default function UserLayout() {
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) {
      navigate('/login');
    }
  }, [user, navigate]);

  if (!user) return null;

  return (
    <div className="flex flex-col md:flex-row min-h-screen">
      <UserSidebar />
      <main className="flex-1 p-4 md:p-6 overflow-x-hidden mt-16 md:mt-0">
        <Outlet />
      </main>
      <InstallPWA />
    </div>
  );
}
