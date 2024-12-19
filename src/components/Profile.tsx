import { useAuth } from '../contexts/AuthContext';

export default function Profile() {
  const { user } = useAuth();

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Perfil</h1>
      <div className="bg-white rounded-lg shadow p-6">
        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2">
            Nome
          </label>
          <p className="text-gray-900">{user?.displayName || 'Não informado'}</p>
        </div>
        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2">
            Email
          </label>
          <p className="text-gray-900">{user?.email || 'Não informado'}</p>
        </div>
      </div>
    </div>
  );
}
