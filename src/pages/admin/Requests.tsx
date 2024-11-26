import { useState, useEffect } from 'react';
import { db } from '../../lib/firebase';
import { collection, query, orderBy, onSnapshot, doc, updateDoc, where } from 'firebase/firestore';
import { useAuth } from '../../contexts/AuthContext';
import { useNotification } from '../../contexts/NotificationContext';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { useNavigate, useSearchParams } from 'react-router-dom';

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

    const requestsRef = collection(db, 'requests');
    let q = query(requestsRef, orderBy('createdAt', 'desc'));

    // If a user is selected, only show their requests
    if (selectedUserId) {
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

      // Only mark requests as read if they're being viewed
      if (selectedUserId) {
        const unreadDocs = snapshot.docs.filter(doc => !doc.data().read);
        for (const unreadDoc of unreadDocs) {
          await updateDoc(doc(db, 'requests', unreadDoc.id), {
            read: true
          });
        }
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

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4 flex items-center gap-2">
        Requests
        {unreadRequests > 0 && (
          <Badge variant="destructive">{unreadRequests} new</Badge>
        )}
      </h1>

      <div className="grid gap-4">
        {requests.map((request) => (
          <div
            key={request.id}
            className={`bg-white dark:bg-gray-800 p-4 rounded-lg shadow flex flex-col gap-4 ${
              !request.read ? 'ring-2 ring-blue-500' : ''
            }`}
          >
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-semibold">{request.userName}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {request.createdAt?.toDate().toLocaleString()}
                </p>
              </div>
              <Badge className={getStatusColor(request.status)}>
                {request.status}
              </Badge>
            </div>

            <p className="text-gray-700 dark:text-gray-300">{request.description}</p>

            {request.imageUrl && (
              <img
                src={request.imageUrl}
                alt="Request reference"
                className="w-full max-w-md rounded-lg"
              />
            )}

            <div className="flex gap-2">
              {request.status === 'pending' && (
                <>
                  <Button
                    onClick={() => handleStatusChange(request.id, 'in_progress')}
                    variant="default"
                  >
                    Start Working
                  </Button>
                  <Button
                    onClick={() => handleStatusChange(request.id, 'rejected')}
                    variant="destructive"
                  >
                    Reject
                  </Button>
                </>
              )}
              {request.status === 'in_progress' && (
                <Button
                  onClick={() => handleStatusChange(request.id, 'completed')}
                  variant="default"
                >
                  Mark as Complete
                </Button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}