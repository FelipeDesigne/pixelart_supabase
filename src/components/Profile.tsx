import { useAuth } from '../contexts/AuthContext';

export default function Profile() {
  const { user } = useAuth();

  return (
    <div className="p-2 md:p-4">
      <h1 className="text-xl md:text-2xl font-bold mb-4">Perfil</h1>
      <div className="bg-white rounded-lg shadow p-4 md:p-6">
        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2">
            Nome
          </label>
          <p className="text-gray-900 break-words">{user?.displayName || 'Não informado'}</p>
        </div>
        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2">
            Email
          </label>
          <p className="text-gray-900 break-words">{user?.email || 'Não informado'}</p>
        </div>
      </div>
    </div>
  );
}
