import { useState, useEffect } from 'react';
import { collection, query, where, orderBy, getDocs, Timestamp, doc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from 'react-hot-toast';
import { Search, Filter, Eye, X } from 'lucide-react';
import { format, subDays, startOfDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface Request {
  id: string;
  status: 'pending' | 'in_progress' | 'completed' | 'rejected';
  createdAt: Timestamp;
  description: string;
  imageUrl?: string;
  reference?: string;
  comments?: string[];
}

interface ChartData {
  date: string;
  requests: number;
}

export default function UserRequests() {
  const { user } = useAuth();
  const [requests, setRequests] = useState<Request[]>([]);
  const [loading, setLoading] = useState(true);
  const [chartData, setChartData] = useState<ChartData[]>([]);
  const [dateFilter, setDateFilter] = useState('7');
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRequest, setSelectedRequest] = useState<Request | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    if (user) {
      fetchRequests();
    }
  }, [user, dateFilter, statusFilter]);

  const fetchRequests = async () => {
    try {
      const requestsRef = collection(db, 'requests');
      const startDate = startOfDay(subDays(new Date(), parseInt(dateFilter)));
      
      let q = query(
        requestsRef,
        where('userId', '==', user?.uid),
        where('createdAt', '>=', startDate),
        orderBy('createdAt', 'desc')
      );

      if (statusFilter !== 'all') {
        q = query(
          requestsRef,
          where('userId', '==', user?.uid),
          where('status', '==', statusFilter),
          orderBy('createdAt', 'desc')
        );
      }

      const querySnapshot = await getDocs(q);
      const requestsData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Request[];

      setRequests(requestsData);
      
      // Prepare chart data
      const chartData: { [key: string]: number } = {};
      for (let i = 0; i < parseInt(dateFilter); i++) {
        const date = format(subDays(new Date(), i), 'dd/MM', { locale: ptBR });
        chartData[date] = 0;
      }

      requestsData.forEach(request => {
        const date = format(request.createdAt.toDate(), 'dd/MM', { locale: ptBR });
        if (chartData[date] !== undefined) {
          chartData[date]++;
        }
      });

      const formattedChartData = Object.entries(chartData)
        .map(([date, requests]) => ({ date, requests }))
        .reverse();

      setChartData(formattedChartData);
    } catch (error) {
      console.error('Error fetching requests:', error);
      toast.error('Erro ao carregar solicitações');
    } finally {
      setLoading(false);
    }
  };

  const filteredRequests = requests.filter(request => 
    request.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const stats = {
    total: requests.length,
    pending: requests.filter(r => r.status === 'pending').length,
    in_progress: requests.filter(r => r.status === 'in_progress').length,
    completed: requests.filter(r => r.status === 'completed').length,
    rejected: requests.filter(r => r.status === 'rejected').length,
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton height={40} />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Skeleton height={100} count={4} />
        </div>
        <Skeleton height={300} />
        <Skeleton height={400} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Minhas Solicitações</h1>
      </div>
      
      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="bg-dark-lighter p-6 rounded-lg">
          <h3 className="text-lg font-semibold mb-2">Total de Solicitações</h3>
          <p className="text-2xl font-bold">{stats.total}</p>
        </div>
        <div className="bg-dark-lighter p-6 rounded-lg">
          <h3 className="text-lg font-semibold mb-2">Pendentes</h3>
          <p className="text-2xl font-bold text-yellow-500">{stats.pending}</p>
        </div>
        <div className="bg-dark-lighter p-6 rounded-lg">
          <h3 className="text-lg font-semibold mb-2">Em Andamento</h3>
          <p className="text-2xl font-bold text-blue-500">{stats.in_progress}</p>
        </div>
        <div className="bg-dark-lighter p-6 rounded-lg">
          <h3 className="text-lg font-semibold mb-2">Concluídas</h3>
          <p className="text-2xl font-bold text-green-500">{stats.completed}</p>
        </div>
        <div className="bg-dark-lighter p-6 rounded-lg">
          <h3 className="text-lg font-semibold mb-2">Rejeitadas</h3>
          <p className="text-2xl font-bold text-red-500">{stats.rejected}</p>
        </div>
      </div>

      {/* Gráfico */}
      <div className="bg-dark-lighter p-6 rounded-lg">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold">Solicitações por Dia</h2>
          <select
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="bg-dark text-white px-3 py-2 rounded-lg"
          >
            <option value="7">Últimos 7 dias</option>
            <option value="15">Últimos 15 dias</option>
            <option value="30">Últimos 30 dias</option>
          </select>
        </div>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="requests" stroke="#8884d8" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Lista de Solicitações */}
      <div className="bg-dark-lighter p-6 rounded-lg">
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between mb-6">
          <h2 className="text-xl font-semibold">Histórico de Solicitações</h2>
          <div className="flex gap-4">
            <div className="relative">
              <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar solicitação..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 bg-dark rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-dark text-white px-3 py-2 rounded-lg"
            >
              <option value="all">Todos os status</option>
              <option value="pending">Pendentes</option>
              <option value="in_progress">Em Andamento</option>
              <option value="completed">Concluídas</option>
              <option value="rejected">Rejeitadas</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-left border-b border-gray-700">
                <th className="pb-3">Status</th>
                <th className="pb-3">Data</th>
                <th className="pb-3">Descrição</th>
                <th className="pb-3">Imagem</th>
                <th className="pb-3">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {filteredRequests.map((request) => (
                <tr key={request.id} className="hover:bg-dark">
                  <td className="py-3">
                    <span className={`px-2 py-1 rounded-full text-xs
                      ${request.status === 'pending' ? 'bg-yellow-500/20 text-yellow-500' :
                        request.status === 'in_progress' ? 'bg-blue-500/20 text-blue-500' :
                        request.status === 'completed' ? 'bg-green-500/20 text-green-500' :
                        'bg-red-500/20 text-red-500'
                      }`}
                    >
                      {request.status === 'pending' ? 'Pendente' :
                       request.status === 'in_progress' ? 'Em Andamento' :
                       request.status === 'completed' ? 'Concluída' : 'Rejeitada'}
                    </span>
                  </td>
                  <td className="py-3">
                    {format(request.createdAt.toDate(), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                  </td>
                  <td className="py-3">{request.description}</td>
                  <td className="py-3">
                    {request.imageUrl && (
                      <img 
                        src={request.imageUrl} 
                        alt="Preview" 
                        className="w-16 h-16 object-cover rounded-lg cursor-pointer hover:opacity-75 transition-opacity"
                        onClick={() => window.open(request.imageUrl, '_blank')}
                      />
                    )}
                  </td>
                  <td className="py-3">
                    <button
                      onClick={() => {
                        setSelectedRequest(request);
                        setIsModalOpen(true);
                      }}
                      className="flex items-center gap-2 px-3 py-1 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
                    >
                      <Eye className="w-4 h-4" />
                      <span>Detalhes</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal de Detalhes */}
      {isModalOpen && selectedRequest && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4">
            <div className="fixed inset-0 bg-black bg-opacity-30" onClick={() => setIsModalOpen(false)} />
            
            <div className="relative bg-dark-lighter p-6 rounded-lg max-w-2xl w-full">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold">Detalhes da Solicitação</h2>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="p-1 hover:bg-dark rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <h3 className="text-sm text-gray-400">Status</h3>
                  <span className={`inline-block mt-1 px-2 py-1 rounded-full text-xs
                    ${selectedRequest.status === 'pending' ? 'bg-yellow-500/20 text-yellow-500' :
                      selectedRequest.status === 'in_progress' ? 'bg-blue-500/20 text-blue-500' :
                      selectedRequest.status === 'completed' ? 'bg-green-500/20 text-green-500' :
                      'bg-red-500/20 text-red-500'
                    }`}
                  >
                    {selectedRequest.status === 'pending' ? 'Pendente' :
                     selectedRequest.status === 'in_progress' ? 'Em Andamento' :
                     selectedRequest.status === 'completed' ? 'Concluída' : 'Rejeitada'}
                  </span>
                </div>

                <div>
                  <h3 className="text-sm text-gray-400">Data da Solicitação</h3>
                  <p className="mt-1">
                    {format(selectedRequest.createdAt.toDate(), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                  </p>
                </div>

                <div>
                  <h3 className="text-sm text-gray-400">Descrição</h3>
                  <p className="mt-1">{selectedRequest.description}</p>
                </div>

                {selectedRequest.reference && (
                  <div>
                    <h3 className="text-sm text-gray-400">Referência</h3>
                    <p className="mt-1">{selectedRequest.reference}</p>
                  </div>
                )}

                {selectedRequest.imageUrl && (
                  <div>
                    <h3 className="text-sm text-gray-400">Imagem</h3>
                    <img 
                      src={selectedRequest.imageUrl} 
                      alt="Preview" 
                      className="mt-2 max-w-full h-auto rounded-lg cursor-pointer hover:opacity-75 transition-opacity"
                      onClick={() => window.open(selectedRequest.imageUrl, '_blank')}
                    />
                  </div>
                )}

                {selectedRequest.comments && selectedRequest.comments.length > 0 && (
                  <div>
                    <h3 className="text-sm text-gray-400">Comentários</h3>
                    <div className="mt-2 space-y-2">
                      {selectedRequest.comments.map((comment, index) => (
                        <div key={index} className="bg-dark p-3 rounded-lg">
                          {comment}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-lg bg-dark text-white hover:bg-dark-accent transition-colors"
                >
                  Fechar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
