import { Outlet } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import AdminSidebar from '../../components/AdminSidebar';

export default function AdminLayout() {
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user || !isAdmin) {
      navigate('/login');
    }
  }, [user, isAdmin, navigate]);

  if (!isAdmin) return null;

  return (
    <div className="flex min-h-screen bg-[#1a1a2e]">
      <AdminSidebar />
      <div className="flex-1 ml-64">
        <main className="p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
