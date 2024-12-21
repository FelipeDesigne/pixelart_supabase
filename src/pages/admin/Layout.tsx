import { Outlet } from 'react-router-dom';
import AdminSidebar from '../../components/AdminSidebar';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';

export default function AdminLayout() {
  const { isAdmin } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isAdmin) {
      navigate('/');
    }
  }, [isAdmin, navigate]);

  if (!isAdmin) return null;

  return (
    <div className="flex flex-col md:flex-row min-h-screen">
      <AdminSidebar />
      <main className="flex-1 p-4 md:p-6 overflow-x-hidden mt-16 md:mt-0">
        <Outlet />
      </main>
    </div>
  );
}
