import { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { Loader2 } from 'lucide-react';

export default function GoogleDrive() {
  const { user } = useAuth();
  const [driveUrl, setDriveUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDriveUrl = async () => {
      if (!user) return;
      try {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          setDriveUrl(userDoc.data().driveUrl || null);
        }
      } catch (error) {
        console.error('Error fetching drive URL:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDriveUrl();
  }, [user]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!driveUrl) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-gray-400">Google Drive não configurado</p>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-2rem)] -mt-4 -mx-4">
      <iframe
        src={driveUrl}
        className="w-full h-full border-none"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
      />
    </div>
  );
}
