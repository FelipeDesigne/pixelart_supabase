import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { Loader2, Play } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface Art {
  id: string;
  title: string;
  fileUrl: string;
  createdAt: string;
  type: 'image' | 'video';
  filePath: string;
}

export default function Arts() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [arts, setArts] = useState<Art[]>([]);
  const [userName, setUserName] = useState('');

  useEffect(() => {
    const fetchUserAndArts = async () => {
      try {
        setLoading(true);

        if (user?.uid) {
          const userRef = doc(db, 'users', user.uid);
          const userSnap = await getDoc(userRef);
          
          if (userSnap.exists()) {
            const name = userSnap.data().name || userSnap.data().email;
            setUserName(name);

            // Primeiro, listar o diretório do usuário
            const { data: userDir, error: userDirError } = await supabase.storage
              .from('PixelArt')
              .list(`users/${user.uid}/artworks`);

            if (userDirError) {
              console.error('Erro ao buscar diretório do usuário:', userDirError);
              throw userDirError;
            }

            // Encontrar a pasta com o nome do usuário
            const userFolder = userDir?.find(dir => dir.name === name);
            
            if (!userFolder) {
              console.log('Pasta do usuário não encontrada');
              setArts([]);
              setLoading(false);
              return;
            }

            // Agora buscar os arquivos dentro da pasta do usuário
            const { data: files, error: filesError } = await supabase.storage
              .from('PixelArt')
              .list(`users/${user.uid}/artworks/${userFolder.name}`);

            console.log('Arquivos encontrados:', {
              path: `users/${user.uid}/artworks/${userFolder.name}`,
              files,
              error: filesError
            });

            if (filesError) {
              console.error('Erro ao buscar arquivos:', filesError);
              throw filesError;
            }

            if (!files || files.length === 0) {
              console.log('Nenhum arquivo encontrado para o usuário');
              setArts([]);
              setLoading(false);
              return;
            }

            const allArtworks: Art[] = [];

            // Processar arquivos
            for (const file of files) {
              const { data: { publicUrl } } = supabase.storage
                .from('PixelArt')
                .getPublicUrl(`users/${user.uid}/artworks/${userFolder.name}/${file.name}`);

              console.log('Processando arquivo:', {
                name: file.name,
                path: `users/${user.uid}/artworks/${userFolder.name}/${file.name}`,
                metadata: file.metadata,
                publicUrl
              });

              const isVideo = file.metadata?.mimetype?.startsWith('video/');

              allArtworks.push({
                id: file.name,
                title: file.name,
                fileUrl: publicUrl,
                createdAt: new Date(file.created_at || '').toLocaleString(),
                type: isVideo ? 'video' : 'image',
                filePath: `users/${user.uid}/artworks/${userFolder.name}/${file.name}`
              });
            }

            setArts(allArtworks);
          }
        }
      } catch (error) {
        console.error('Erro ao buscar artes:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserAndArts();
  }, [user]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  if (arts.length === 0) {
    return (
      <div className="text-center p-8">
        <p className="text-gray-500">Nenhuma arte encontrada.</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Minhas Artes</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {arts.map((art) => (
          <div key={art.id} className="bg-white rounded-lg shadow-md overflow-hidden">
            {art.type === 'video' ? (
              <div className="relative aspect-video bg-gray-100">
                <video src={art.fileUrl} className="w-full h-full object-cover" controls>
                  Seu navegador não suporta o elemento de vídeo.
                </video>
                <Play className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-12 h-12 text-white opacity-75" />
              </div>
            ) : (
              <div className="aspect-square bg-gray-100">
                <img src={art.fileUrl} alt={art.title} className="w-full h-full object-cover" />
              </div>
            )}
            <div className="p-4">
              <h3 className="font-semibold text-lg mb-1">{art.title}</h3>
              <p className="text-sm text-gray-500">{art.createdAt}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
