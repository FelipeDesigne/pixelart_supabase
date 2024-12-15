import { useState, useEffect } from 'react';
import { db } from '../../lib/firebase';
import { collection, query, orderBy, onSnapshot, doc, updateDoc, where, writeBatch } from 'firebase/firestore';
import { useAuth } from '../../contexts/AuthContext';
import { useNotification } from '../../contexts/NotificationContext';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { useNavigate, useSearchParams } from 'react-router-dom';
import RequestDetailsModal from '../../components/RequestDetailsModal';
import { Card, CardHeader, CardContent } from '../../components/ui/card';

interface Request {
  id: string;
  userId: string;
  userName: string;
  imageUrl: string;
  description: string;
  status: string;
  createdAt: any;
  read: boolean;
}

export default function Requests() {
  const [requests, setRequests] = useState<Request[]>([]);
  const [selectedRequest, setSelectedRequest] = useState<Request | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { isAdmin } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { unreadRequests } = useNotification();
  const selectedUserId = searchParams.get('user');

  useEffect(() => {
    if (!isAdmin) {
      navigate('/');
      return;
    }

    console.log('Setting up requests listener');
    const requestsRef = collection(db, 'requests');
    let q = query(requestsRef, orderBy('createdAt', 'desc'));

    // If a user is selected, only show their requests
    if (selectedUserId) {
      console.log('Filtering requests for user:', selectedUserId);
      q = query(
        requestsRef,
        where('userId', '==', selectedUserId),
        orderBy('createdAt', 'desc')
      );
    }

    const unsubscribe = onSnapshot(q, async (snapshot) => {
      const requestsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Request[];

      setRequests(requestsData);

      // Marcar pedidos como lidos
      const batch = writeBatch(db);
      let hasUnread = false;
      snapshot.docs.forEach(doc => {
        if (!doc.data().read) {
          hasUnread = true;
          batch.update(doc.ref, { read: true });
        }
      });
      if (hasUnread) {
        await batch.commit();
      }
    });

    return () => unsubscribe();
  }, [isAdmin, navigate, selectedUserId]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-500';
      case 'in_progress':
        return 'bg-blue-500';
      case 'completed':
        return 'bg-green-500';
      case 'rejected':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  const handleStatusChange = async (requestId: string, newStatus: string) => {
    const requestRef = doc(db, 'requests', requestId);
    await updateDoc(requestRef, {
      status: newStatus
    });
  };

  const handleRequestUpdate = (requestId: string, newData: Partial<Request>) => {
    setRequests(prevRequests => 
      prevRequests.map(req => 
        req.id === requestId ? { ...req, ...newData } : req
      )
    );
  };

  const truncateDescription = (description: string, maxLength: number = 100) => {
    if (description.length <= maxLength) return description;
    return description.slice(0, maxLength) + '...';
  };

  return (
    <div className="container mx-auto p-4">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          Pedidos
          {unreadRequests > 0 && (
            <Badge variant="destructive">{unreadRequests} novos</Badge>
          )}
        </h1>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {requests.map((request) => (
          <Card
            key={request.id}
            className={`cursor-pointer transition-all hover:shadow-lg ${
              !request.read ? 'ring-2 ring-blue-500' : ''
            }`}
            onClick={() => {
              setSelectedRequest(request);
              setIsModalOpen(true);
            }}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className="flex flex-col">
                <h3 className="font-semibold">{request.userName}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {request.createdAt?.toDate().toLocaleString()}
                </p>
              </div>
              <Badge className={getStatusColor(request.status)}>
                {request.status}
              </Badge>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700 dark:text-gray-300">
                {truncateDescription(request.description)}
              </p>
              {request.imageUrl && (
                <div className="mt-2 aspect-video relative overflow-hidden rounded-md">
                  <img
                    src={request.imageUrl}
                    alt="Preview"
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {selectedRequest && (
        <RequestDetailsModal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedRequest(null);
          }}
          request={selectedRequest}
          onRequestUpdate={handleRequestUpdate}
          onStatusChange={handleStatusChange}
        />
      )}
    </div>
  );
}