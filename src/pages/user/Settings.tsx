import { useState, useEffect } from 'react';
import { Settings as SettingsIcon, Bell, Lock, User, Shield } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { doc, updateDoc, getDoc } from 'firebase/firestore';
import { updatePassword, EmailAuthProvider, reauthenticateWithCredential } from 'firebase/auth';
import { db } from '../../lib/firebase';
import { toast } from 'react-hot-toast';

export default function Settings() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [userData, setUserData] = useState({
    name: '',
    email: ''
  });
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  useEffect(() => {
    const fetchUserData = async () => {
      if (!user) return;

      try {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          const data = userDoc.data();
          setUserData({
            name: data.name || '',
            email: user.email || ''
          });
        } else {
          // Se não existir documento do usuário, apenas usar o email
          setUserData({
            name: user.displayName || '',
            email: user.email || ''
          });
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
        toast.error('Erro ao carregar dados do usuário');
      }
    };

    fetchUserData();
  }, [user]);

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    try {
      const userRef = doc(db, 'users', user.uid);
      const userDoc = await getDoc(userRef);

      if (userDoc.exists()) {
        // Atualizar documento existente
        await updateDoc(userRef, {
          name: userData.name
        });
      } else {
        // Criar novo documento se não existir
        await setDoc(userRef, {
          name: userData.name,
          email: user.email,
          createdAt: new Date()
        });
      }

      toast.success('Perfil atualizado com sucesso!');
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Erro ao atualizar perfil');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('As senhas não coincidem');
      return;
    }

    if (passwordData.newPassword.length < 6) {
      toast.error('A nova senha deve ter pelo menos 6 caracteres');
      return;
    }

    setLoading(true);
    try {
      // Reautenticar o usuário
      const credential = EmailAuthProvider.credential(
        user.email!,
        passwordData.currentPassword
      );
      await reauthenticateWithCredential(user, credential);

      // Atualizar a senha
      await updatePassword(user, passwordData.newPassword);

      toast.success('Senha alterada com sucesso!');
      setShowPasswordModal(false);
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
    } catch (error: any) {
      console.error('Error changing password:', error);
      if (error.code === 'auth/wrong-password') {
        toast.error('Senha atual incorreta');
      } else {
        toast.error('Erro ao alterar senha');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Configurações</h1>
      
      <div className="space-y-4">
        <form onSubmit={handleProfileUpdate} className="bg-dark-lighter p-6 rounded-lg">
          <div className="flex items-center gap-2 mb-4">
            <User className="h-5 w-5 text-primary" />
            <h2 className="text-xl font-semibold">Configurações do Perfil</h2>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300">Nome de Exibição</label>
              <input
                type="text"
                value={userData.name}
                onChange={(e) => setUserData({ ...userData, name: e.target.value })}
                className="mt-1 block w-full px-3 py-2 bg-dark border border-gray-600 rounded-md"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300">Email</label>
              <input
                type="email"
                value={userData.email}
                disabled
                className="mt-1 block w-full px-3 py-2 bg-dark border border-gray-600 rounded-md opacity-60 cursor-not-allowed"
              />
              <p className="mt-1 text-sm text-gray-400">O email não pode ser alterado</p>
            </div>
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={loading}
                className="btn-primary"
              >
                {loading ? 'Salvando...' : 'Salvar Alterações'}
              </button>
            </div>
          </div>
        </form>

        <div className="bg-dark-lighter p-6 rounded-lg">
          <div className="flex items-center gap-2 mb-4">
            <Lock className="h-5 w-5 text-primary" />
            <h2 className="text-xl font-semibold">Segurança</h2>
          </div>
          <div className="space-y-4">
            <button
              onClick={() => setShowPasswordModal(true)}
              className="btn-outline w-full"
            >
              Alterar Senha
            </button>
          </div>
        </div>
      </div>

      {showPasswordModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-dark-lighter rounded-lg p-6 max-w-md w-full">
            <h2 className="text-xl font-bold mb-4">Alterar Senha</h2>
            <form onSubmit={handlePasswordChange} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300">Senha Atual</label>
                <input
                  type="password"
                  value={passwordData.currentPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                  className="mt-1 block w-full px-3 py-2 bg-dark border border-gray-600 rounded-md"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300">Nova Senha</label>
                <input
                  type="password"
                  value={passwordData.newPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                  className="mt-1 block w-full px-3 py-2 bg-dark border border-gray-600 rounded-md"
                  required
                  minLength={6}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300">Confirmar Nova Senha</label>
                <input
                  type="password"
                  value={passwordData.confirmPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                  className="mt-1 block w-full px-3 py-2 bg-dark border border-gray-600 rounded-md"
                  required
                  minLength={6}
                />
              </div>

              <div className="flex justify-end gap-4 mt-6">
                <button
                  type="button"
                  onClick={() => setShowPasswordModal(false)}
                  className="px-4 py-2 text-gray-300 hover:text-white"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="btn-primary"
                >
                  {loading ? 'Alterando...' : 'Alterar Senha'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}