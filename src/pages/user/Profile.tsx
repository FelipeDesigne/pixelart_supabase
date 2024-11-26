import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { collection, doc, getDoc, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { User, Clock, CheckCircle, Image } from 'lucide-react';
import { toast } from 'react-hot-toast';

export default function Profile() {
  const { user } = useAuth();
  const [userData, setUserData] = useState<any>(null);
  const [stats, setStats] = useState({
    totalRequests: 0,
    completedRequests: 0,
    pendingRequests: 0,
    inProgressRequests: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserData = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        // Buscar dados do usuário
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        
        // Se não encontrar o documento do usuário, criar um objeto básico
        const userData = userDoc.exists() ? userDoc.data() : {
          name: user.email?.split('@')[0] || 'Usuário',
          email: user.email,
          createdAt: new Date()
        };
        
        setUserData(userData);

        // Buscar estatísticas das solicitações
        const requestsRef = collection(db, 'requests');
        const userRequestsQuery = query(requestsRef, where('userId', '==', user.uid));
        const requestsSnapshot = await getDocs(userRequestsQuery);
        
        let completed = 0;
        let pending = 0;
        let inProgress = 0;

        requestsSnapshot.forEach((doc) => {
          const request = doc.data();
          switch (request.status) {
            case 'completed':
              completed++;
              break;
            case 'pending':
              pending++;
              break;
            case 'in-progress':
              inProgress++;
              break;
          }
        });

        setStats({
          totalRequests: requestsSnapshot.size,
          completedRequests: completed,
          pendingRequests: pending,
          inProgressRequests: inProgress
        });

      } catch (error) {
        console.error('Error fetching user data:', error);
        toast.error('Erro ao carregar dados do perfil');
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [user]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <div className="text-primary">Carregando...</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <div className="text-red-500">Você precisa estar logado para ver esta página.</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Meu Perfil</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Informações do Perfil */}
        <div className="bg-dark-lighter p-6 rounded-lg">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center">
              <User className="w-10 h-10 text-primary" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">{userData?.name}</h2>
              <p className="text-gray-400">{user?.email}</p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <p className="text-sm text-gray-400">Membro desde</p>
              <p className="text-lg">
                {userData?.createdAt instanceof Date 
                  ? userData.createdAt.toLocaleDateString()
                  : userData?.createdAt?.toDate?.()?.toLocaleDateString() || 'Data não disponível'}
              </p>
            </div>
          </div>
        </div>

        {/* Estatísticas */}
        <div className="bg-dark-lighter p-6 rounded-lg">
          <h2 className="text-xl font-bold mb-6">Estatísticas</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-dark p-4 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Image className="w-5 h-5 text-primary" />
                <span className="text-gray-300">Total de Solicitações</span>
              </div>
              <p className="text-2xl font-bold">{stats.totalRequests}</p>
            </div>

            <div className="bg-dark p-4 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="w-5 h-5 text-green-500" />
                <span className="text-gray-300">Concluídas</span>
              </div>
              <p className="text-2xl font-bold">{stats.completedRequests}</p>
            </div>

            <div className="bg-dark p-4 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="w-5 h-5 text-yellow-500" />
                <span className="text-gray-300">Em Andamento</span>
              </div>
              <p className="text-2xl font-bold">{stats.inProgressRequests}</p>
            </div>

            <div className="bg-dark p-4 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="w-5 h-5 text-blue-500" />
                <span className="text-gray-300">Pendentes</span>
              </div>
              <p className="text-2xl font-bold">{stats.pendingRequests}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}