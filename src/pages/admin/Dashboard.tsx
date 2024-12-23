import { useState, useEffect } from 'react';
import { collection, query, orderBy, getDocs, where, Timestamp, doc, getDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { toast } from 'react-hot-toast';
import { Loader2, Download, Search, Filter } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { CSVLink } from 'react-csv';
import { format, subDays, startOfDay, endOfDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';

interface Request {
  id: string;
  status: 'pending' | 'in_progress' | 'completed' | 'rejected';
  createdAt: Timestamp;
  userId: string;
  userName: string;
  description: string;
}

interface ChartData {
  date: string;
  requests: number;
}

export default function AdminDashboard() {
  const [requests, setRequests] = useState<Request[]>([]);
  const [loading, setLoading] = useState(true);
  const [chartData, setChartData] = useState<ChartData[]>([]);
  const [dateFilter, setDateFilter] = useState('7'); // dias
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchRequests();
  }, [dateFilter, statusFilter]);

  const fetchRequests = async () => {
    try {
      const requestsRef = collection(db, 'requests');
      const startDate = startOfDay(subDays(new Date(), parseInt(dateFilter)));
      
      let q = query(
        requestsRef,
        where('createdAt', '>=', startDate),
        orderBy('createdAt', 'desc')
      );

      if (statusFilter !== 'all') {
        q = query(q, where('status', '==', statusFilter));
      }

      const querySnapshot = await getDocs(q);
      const requestsData = await Promise.all(querySnapshot.docs.map(async docSnapshot => {
        const data = docSnapshot.data();
        // Buscar dados do usuário
        const userRef = doc(db, 'users', data.userId);
        const userDoc = await getDoc(userRef);
        const userName = userDoc.exists() ? userDoc.data().name : 'Usuário não encontrado';
        
        return {
          id: docSnapshot.id,
          ...data,
          userName
        };
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

  const csvData = filteredRequests.map(request => ({
    Usuário: request.userName,
    Status: request.status,
    'Data de Criação': format(request.createdAt.toDate(), 'dd/MM/yyyy HH:mm', { locale: ptBR }),
    Descrição: request.description,
  }));

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
        <h1 className="text-3xl font-bold text-white">Dashboard Administrativo</h1>
        <CSVLink
          data={csvData}
          filename={`relatorio-${format(new Date(), 'dd-MM-yyyy')}.csv`}
          className="flex items-center gap-2 px-4 py-2 bg-[#2563eb] text-white rounded-lg hover:bg-[#3b82f6] transition-colors"
        >
          <Download className="w-4 h-4" />
          Exportar CSV
        </CSVLink>
      </div>
      
      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="bg-[#16162a] p-6 rounded-lg border border-gray-700">
          <h3 className="text-lg font-semibold mb-2 text-gray-300">Total de Solicitações</h3>
          <p className="text-2xl font-bold text-white">{stats.total}</p>
        </div>
        <div className="bg-[#16162a] p-6 rounded-lg border border-gray-700">
          <h3 className="text-lg font-semibold mb-2 text-gray-300">Pendentes</h3>
          <p className="text-2xl font-bold text-yellow-500">{stats.pending}</p>
        </div>
        <div className="bg-[#16162a] p-6 rounded-lg border border-gray-700">
          <h3 className="text-lg font-semibold mb-2 text-gray-300">Em Andamento</h3>
          <p className="text-2xl font-bold text-[#2563eb]">{stats.in_progress}</p>
        </div>
        <div className="bg-[#16162a] p-6 rounded-lg border border-gray-700">
          <h3 className="text-lg font-semibold mb-2 text-gray-300">Concluídas</h3>
          <p className="text-2xl font-bold text-green-500">{stats.completed}</p>
        </div>
        <div className="bg-[#16162a] p-6 rounded-lg border border-gray-700">
          <h3 className="text-lg font-semibold mb-2 text-gray-300">Rejeitadas</h3>
          <p className="text-2xl font-bold text-red-500">{stats.rejected}</p>
        </div>
      </div>

      {/* Gráfico */}
      <div className="bg-[#16162a] p-6 rounded-lg border border-gray-700">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-white">Solicitações por Dia</h2>
          <select
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="bg-[#1a1a2e] text-white px-3 py-2 rounded-lg border border-gray-700 focus:outline-none focus:ring-2 focus:ring-[#2563eb]"
          >
            <option value="7">Últimos 7 dias</option>
            <option value="15">Últimos 15 dias</option>
            <option value="30">Últimos 30 dias</option>
          </select>
        </div>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="date" stroke="#9CA3AF" />
              <YAxis stroke="#9CA3AF" />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#1a1a2e',
                  border: '1px solid #374151',
                  borderRadius: '8px',
                  color: '#fff'
                }}
              />
              <Line type="monotone" dataKey="requests" stroke="#2563eb" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Lista de Solicitações */}
      <div className="bg-[#16162a] p-6 rounded-lg border border-gray-700">
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-white">Últimas Solicitações</h2>
          <div className="flex gap-4">
            <div className="relative">
              <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar solicitações..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 bg-[#1a1a2e] text-white rounded-lg border border-gray-700 focus:outline-none focus:ring-2 focus:ring-[#2563eb] w-full md:w-64"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 bg-[#1a1a2e] text-white rounded-lg border border-gray-700 focus:outline-none focus:ring-2 focus:ring-[#2563eb]"
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
                <th className="pb-3">Usuário</th>
                <th className="pb-3">Status</th>
                <th className="pb-3">Data</th>
                <th className="pb-3">Descrição</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {filteredRequests.map((request) => (
                <tr key={request.id} className="hover:bg-dark">
                  <td className="py-3">{request.userName}</td>
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
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}