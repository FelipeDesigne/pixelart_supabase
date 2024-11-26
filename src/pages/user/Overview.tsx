import { useState, useEffect } from 'react';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { Link } from 'react-router-dom';
import { Eye, X, Clock, CheckCircle, Image, AlertTriangle, Calendar, Loader2, FolderGit2 } from 'lucide-react';
import { toast } from 'react-hot-toast';

export default function Overview() {
  const { user } = useAuth();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [userData, setUserData] = useState(null);
  const [stats, setStats] = useState({
    total: 0,
    completed: 0,
    inProgress: 0,
    pending: 0
  });
  const [recentActivity, setRecentActivity] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;

      try {
        // Fetch user data
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          setUserData(userDoc.data());
        }

        // Fetch requests
        const requestsRef = collection(db, 'requests');
        const q = query(
          requestsRef,
          where('userId', '==', user.uid)
        );
        const querySnapshot = await getDocs(q);
        const requestsData = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }))
        .sort((a, b) => b.createdAt?.toDate?.() - a.createdAt?.toDate?.() || 0);
        
        setRequests(requestsData);

        // Calcular estatísticas
        const completed = requestsData.filter(r => r.status === 'completed').length;
        const inProgress = requestsData.filter(r => r.status === 'in-progress').length;
        const pending = requestsData.filter(r => r.status === 'pending').length;

        setStats({
          total: requestsData.length,
          completed,
          inProgress,
          pending
        });

        // Pegar as 5 atividades mais recentes
        setRecentActivity(requestsData.slice(0, 5));
      } catch (error) {
        console.error('Error fetching data:', error);
        toast.error('Erro ao carregar dados');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user]);

  const openDetailsModal = (request) => {
    setSelectedRequest(request);
    setShowDetailsModal(true);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'in-progress':
        return 'bg-yellow-100 text-yellow-800';
      case 'pending':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'completed':
        return 'Concluído';
      case 'in-progress':
        return 'Em Andamento';
      case 'pending':
        return 'Pendente';
      default:
        return status;
    }
  };

  const formatRequestType = (type) => {
    switch (type) {
      case 'social_media':
        return 'Arte para Redes Sociais';
      case 'logo':
        return 'Identidade Visual e Logo';
      case 'video_edit':
        return 'Edição de Vídeo';
      case 'video_ads':
        return 'Vídeos para Anúncios';
      default:
        return type;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <div className="flex gap-3">
          {userData?.driveUrl && (
            <a
              href={userData.driveUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg transition-all
                bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700
                text-white font-medium shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
            >
              <FolderGit2 className="w-4 h-4" />
              <span>Acessar Google Drive</span>
            </a>
          )}
          {userData?.isActive !== false ? (
            <Link to="/user/new-request" className="btn-primary">
              Nova Solicitação
            </Link>
          ) : (
            <div className="relative group">
              <button
                disabled
                className="btn-primary opacity-50 cursor-not-allowed"
              >
                Nova Solicitação
              </button>
              <div className="absolute bottom-full mb-2 right-0 w-64 bg-dark-lighter text-sm p-2 rounded-lg shadow-lg hidden group-hover:block">
                <p className="text-red-400">Sua conta está desativada. Motivo: {userData.deactivationReason}</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Cards de Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-dark-lighter p-6 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <Image className="w-5 h-5 text-primary" />
            <span className="text-gray-400">Total de Solicitações</span>
          </div>
          <p className="text-2xl font-bold">{stats.total}</p>
        </div>

        <div className="bg-dark-lighter p-6 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle className="w-5 h-5 text-green-500" />
            <span className="text-gray-400">Concluídas</span>
          </div>
          <p className="text-2xl font-bold text-green-500">{stats.completed}</p>
        </div>

        <div className="bg-dark-lighter p-6 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="w-5 h-5 text-yellow-500" />
            <span className="text-gray-400">Em Andamento</span>
          </div>
          <p className="text-2xl font-bold text-yellow-500">{stats.inProgress}</p>
        </div>

        <div className="bg-dark-lighter p-6 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="w-5 h-5 text-blue-500" />
            <span className="text-gray-400">Pendentes</span>
          </div>
          <p className="text-2xl font-bold text-blue-500">{stats.pending}</p>
        </div>
      </div>

      {/* Atividade Recente */}
      <div className="bg-dark-lighter rounded-lg p-6">
        <h2 className="text-xl font-bold mb-4">Atividade Recente</h2>
        <div className="space-y-4">
          {recentActivity.map((activity) => (
            <div key={activity.id} className="flex items-center justify-between p-4 bg-dark rounded-lg">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <Image className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-medium">{formatRequestType(activity.type)}</h3>
                  <p className="text-sm text-gray-400">
                    {new Date(activity.createdAt?.toDate()).toLocaleDateString()}
                  </p>
                </div>
              </div>
              <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(activity.status)}`}>
                {getStatusText(activity.status)}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Tabela de Solicitações */}
      <div className="bg-dark-lighter rounded-lg overflow-hidden">
        <div className="p-4 border-b border-gray-700">
          <h2 className="text-xl font-bold">Todas as Solicitações</h2>
        </div>
        <table className="min-w-full divide-y divide-gray-700">
          <thead className="bg-dark-accent">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                Tipo
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                Data
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                Prazo
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                Ações
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-700">
            {requests.map((request) => (
              <tr key={request.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-200">
                  {formatRequestType(request.type)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(request.status)}`}>
                    {getStatusText(request.status)}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-200">
                  {new Date(request.createdAt?.toDate()).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-200">
                  {request.deadline}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-200">
                  <button
                    onClick={() => openDetailsModal(request)}
                    className="text-primary hover:text-secondary flex items-center gap-1"
                  >
                    <Eye className="h-4 w-4" />
                    Ver Detalhes
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal de Detalhes */}
      {showDetailsModal && selectedRequest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-dark-lighter rounded-lg p-6 max-w-2xl w-full my-8 relative">
            <div className="flex justify-between items-start sticky top-0 bg-dark-lighter pb-4 mb-4 border-b border-gray-700 z-10">
              <h2 className="text-xl font-bold">Detalhes da Solicitação</h2>
              <button
                onClick={() => setShowDetailsModal(false)}
                className="text-gray-400 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-6 mt-2">
              <div>
                <h3 className="text-sm font-medium text-gray-400">Tipo de Serviço</h3>
                <p className="mt-1">{formatRequestType(selectedRequest.type)}</p>
              </div>

              <div>
                <h3 className="text-sm font-medium text-gray-400">Descrição do Projeto</h3>
                <div className="mt-1 bg-dark p-4 rounded-lg max-h-60 overflow-y-auto">
                  <p className="whitespace-pre-wrap">{selectedRequest.description}</p>
                </div>
              </div>

              {selectedRequest.reference && (
                <div>
                  <h3 className="text-sm font-medium text-gray-400">Referência</h3>
                  <a
                    href={selectedRequest.reference}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-1 text-primary hover:text-secondary block"
                  >
                    Ver Referência
                  </a>
                </div>
              )}

              <div>
                <h3 className="text-sm font-medium text-gray-400">Data de Entrega Desejada</h3>
                <p className="mt-1">{selectedRequest.deadline}</p>
              </div>

              <div>
                <h3 className="text-sm font-medium text-gray-400">Status</h3>
                <span className={`mt-1 px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(selectedRequest.status)}`}>
                  {getStatusText(selectedRequest.status)}
                </span>
              </div>

              <div>
                <h3 className="text-sm font-medium text-gray-400">Data da Solicitação</h3>
                <p className="mt-1">
                  {new Date(selectedRequest.createdAt?.toDate()).toLocaleDateString()}
                </p>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-gray-700 flex justify-end">
              <button
                onClick={() => setShowDetailsModal(false)}
                className="px-4 py-2 text-gray-300 hover:text-white"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}