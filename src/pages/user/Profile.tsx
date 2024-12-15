import { useAuth } from '../../contexts/AuthContext';
import ArtGallery from '../../components/ArtGallery';

export default function Profile() {
  const { user } = useAuth();

  if (!user) return null;

  return (
    <div className="space-y-8">
      <div className="bg-dark p-6 rounded-lg">
        <h1 className="text-2xl font-bold mb-6">Meu Perfil</h1>
        
        <div className="space-y-4">
          <div>
            <label className="text-sm text-gray-400">Email</label>
            <p className="text-lg">{user.email}</p>
          </div>
          
          <div>
            <label className="text-sm text-gray-400">Nome</label>
            <p className="text-lg">{user.displayName || 'Nome não definido'}</p>
          </div>
        </div>
      </div>

      <div className="bg-dark p-6 rounded-lg">
        <ArtGallery userId={user.uid} />
      </div>
    </div>
  );
}