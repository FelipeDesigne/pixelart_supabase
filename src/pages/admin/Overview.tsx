import { useState, useEffect } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function Overview() {
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    inProgress: 0,
    completed: 0
  });

  useEffect(() => {
    const fetchStats = async () => {
      const requestsRef = collection(db, 'requests');
      const snapshot = await getDocs(requestsRef);
      
      const newStats = {
        total: snapshot.size,
        pending: 0,
        inProgress: 0,
        completed: 0
      };

      snapshot.forEach(doc => {
        const status = doc.data().status;
        if (status === 'pending') newStats.pending++;
        if (status === 'in-progress') newStats.inProgress++;
        if (status === 'completed') newStats.completed++;
      });

      setStats(newStats);
    };

    fetchStats();
  }, []);

  const chartData = [
    { name: 'Pending', value: stats.pending },
    { name: 'In Progress', value: stats.inProgress },
    { name: 'Completed', value: stats.completed }
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Dashboard Overview</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-dark-lighter p-6 rounded-lg">
          <h3 className="text-gray-400 text-sm">Total Requests</h3>
          <p className="text-2xl font-bold mt-2">{stats.total}</p>
        </div>
        <div className="bg-dark-lighter p-6 rounded-lg">
          <h3 className="text-gray-400 text-sm">Pending</h3>
          <p className="text-2xl font-bold mt-2 text-yellow-500">{stats.pending}</p>
        </div>
        <div className="bg-dark-lighter p-6 rounded-lg">
          <h3 className="text-gray-400 text-sm">In Progress</h3>
          <p className="text-2xl font-bold mt-2 text-blue-500">{stats.inProgress}</p>
        </div>
        <div className="bg-dark-lighter p-6 rounded-lg">
          <h3 className="text-gray-400 text-sm">Completed</h3>
          <p className="text-2xl font-bold mt-2 text-green-500">{stats.completed}</p>
        </div>
      </div>

      <div className="bg-dark-lighter p-6 rounded-lg">
        <h2 className="text-xl font-bold mb-4">Request Status Overview</h2>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="value" fill="#A4FF43" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}