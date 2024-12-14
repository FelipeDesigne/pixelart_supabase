import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

interface PrivateRouteProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
}

export default function PrivateRoute({ children, requireAdmin = false }: PrivateRouteProps) {
  const { user, isAdmin, loading } = useAuth();

  console.log('PrivateRoute - User:', user?.email);
  console.log('PrivateRoute - Is Admin:', isAdmin);
  console.log('PrivateRoute - Loading:', loading);
  console.log('PrivateRoute - Require Admin:', requireAdmin);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!user) {
    console.log('PrivateRoute - No user, redirecting to login');
    return <Navigate to="/login" />;
  }

  if (requireAdmin && !isAdmin) {
    console.log('PrivateRoute - Admin required but not admin, redirecting to user area');
    return <Navigate to="/user" />;
  }

  console.log('PrivateRoute - Access granted');
  return <>{children}</>;
}
