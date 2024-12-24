import { BrowserRouter as Router, Routes as ReactRoutes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { NotificationProvider } from './contexts/NotificationContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { PWAProvider } from './contexts/PWAContext';
import { Toaster } from 'react-hot-toast';
import Login from './pages/Login';
import UserLayout from './pages/user/Layout';
import AdminLayout from './pages/admin/Layout';
import Overview from './pages/user/Overview';
import Chat from './pages/user/Chat';
import NewRequest from './pages/user/NewRequest';
import Requests from './pages/user/Requests';
import Settings from './pages/user/Settings';
import AdminDashboard from './pages/admin/Dashboard';
import AdminMessages from './pages/admin/Messages';
import AdminUsers from './pages/admin/Users';
import AdminSettings from './pages/admin/Settings';
import UserArts from './pages/admin/UserArts';
import Arts from './pages/user/Arts';
import PrivateRoute from './components/PrivateRoute';
import InstallPWA from './components/InstallPWA';
import { useAuth } from './contexts/AuthContext';
import InstallPage from './pages/InstallPage';
import UploadArt from './pages/admin/UploadArt';
import AdminRequests from './pages/admin/Requests';
import { useEffect } from 'react';

function HomeRedirect() {
  const { isAdmin } = useAuth();
  return <Navigate to={isAdmin ? "/admin" : "/user"} />;
}

function AppRoutes() {
  const { user, isAdmin, loading, setLastRoute } = useAuth();
  const location = useLocation();

  // Salvar a rota atual quando ela mudar
  useEffect(() => {
    if (user && location.pathname !== '/login') {
      setLastRoute(location.pathname);
    }
  }, [location, user, setLastRoute]);

  return (
    <>
      <Toaster position="top-right" />
      <InstallPWA />
      <ReactRoutes>
        <Route path="/" element={
          loading ? (
            <div>Loading...</div>
          ) : user ? (
            <Navigate to={localStorage.getItem('lastRoute') || (isAdmin ? '/admin' : '/user')} replace />
          ) : (
            <Navigate to="/login" replace />
          )
        } />
        <Route path="/login" element={<Login />} />
        <Route path="/install" element={<InstallPage />} />
        
        {/* Rotas do admin */}
        <Route
          path="/admin"
          element={
            <PrivateRoute requireAdmin>
              <AdminLayout />
            </PrivateRoute>
          }
        >
          <Route index element={<AdminDashboard />} />
          <Route path="messages" element={<AdminMessages />} />
          <Route path="users" element={<AdminUsers />} />
          <Route path="settings" element={<AdminSettings />} />
          <Route path="user-arts/:userId" element={<UserArts />} />
          <Route path="requests" element={<AdminRequests />} />
          <Route path="upload-art" element={<UploadArt />} />
        </Route>

        {/* Rotas do usuário */}
        <Route
          path="/user"
          element={
            <PrivateRoute>
              <UserLayout />
            </PrivateRoute>
          }
        >
          <Route index element={<Overview />} />
          <Route path="chat" element={<Chat />} />
          <Route path="new-request" element={<NewRequest />} />
          <Route path="requests" element={<Requests />} />
          <Route path="arts" element={<Arts />} />
          <Route path="settings" element={<Settings />} />
        </Route>

        <Route path="*" element={<HomeRedirect />} />
      </ReactRoutes>
    </>
  );
}

export default function App() {
  return (
    <PWAProvider>
      <ThemeProvider>
        <Router>
          <AuthProvider>
            <NotificationProvider>
              <AppRoutes />
            </NotificationProvider>
          </AuthProvider>
        </Router>
      </ThemeProvider>
    </PWAProvider>
  );
}