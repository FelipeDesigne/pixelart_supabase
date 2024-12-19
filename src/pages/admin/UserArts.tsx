import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { Loader2, ArrowLeft, Play, Download } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { supabase } from '../../lib/supabase';
import { downloadAndDeleteArt } from '../../services/imageUpload';

interface Art {
  id: string;
  title: string;
  fileUrl: string;
  createdAt: string;
  type: 'image' | 'video';
  filePath: string;
}

export default function UserArts() {
  const { userId } = useParams();
  const [loading, setLoading] = useState(true);
  const [arts, setArts] = useState<Art[]>([]);
  const [userName, setUserName] = useState('');
  const [downloading, setDownloading] = useState<string | null>(null);

  const handleDownload = async (art: Art) => {
    try {
      setDownloading(art.id);
      
      // Extrair o nome do arquivo do caminho
      const fileName = art.filePath.split('/').pop() || 'download';
      
      await downloadAndDeleteArt(art.filePath, fileName);
      
      // Remover a arte da lista
      setArts(prevArts => prevArts.filter(a => a.id !== art.id));
      
      toast.success('Arquivo baixado com sucesso!');
    } catch (error) {
      console.error('Erro ao baixar arquivo:', error);
      toast.error('Erro ao baixar arquivo');
    } finally {
      setDownloading(null);
    }
  };

  useEffect(() => {
    const fetchUserAndArts = async () => {
      try {
        setLoading(true);

        // Buscar informações do usuário
        if (userId) {
          const userRef = doc(db, 'users', userId);
          const userSnap = await getDoc(userRef);
          
          if (userSnap.exists()) {
            const name = userSnap.data().name || userSnap.data().email;
            setUserName(name);

            // Buscar arquivos usando o nome do usuário no caminho
            const { data: files, error: filesError } = await supabase.storage
              .from('PixelArt')
              .list(`users/${userId}/artworks/${name}/2024/12`);

            console.log('Arquivos encontrados:', {
              path: `users/${userId}/artworks/${name}/2024/12`,
              files,
              error: filesError
            });

            if (filesError) throw filesError;

            const allArtworks: Art[] = [];

            // Processar arquivos
            for (const file of files || []) {
              const { data: { publicUrl } } = supabase.storage
                .from('PixelArt')
                .getPublicUrl(`users/${userId}/artworks/${name}/2024/12/${file.name}`);

              console.log('Processando arquivo:', {
                name: file.name,
                path: `users/${userId}/artworks/${name}/2024/12/${file.name}`,
                metadata: file.metadata,
                publicUrl
              });

              const isVideo = file.metadata?.mimetype?.startsWith('video/');

              allArtworks.push({
                id: file.name,
                title: file.name.split('.')[0].replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
                fileUrl: publicUrl,
                createdAt: file.created_at || new Date().toISOString(),
                type: isVideo ? 'video' : 'image',
                filePath: `users/${userId}/artworks/${name}/2024/12/${file.name}`
              });
            }

            console.log('Total de artes encontradas:', allArtworks.length);

            // Ordenar por data de criação
            allArtworks.sort((a, b) => 
              new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
            );

            console.log('Admin - Total de artes:', allArtworks.length);
            setArts(allArtworks);
          }
        }
      } catch (error) {
        console.error('Error fetching arts:', error);
        toast.error('Erro ao carregar artes');
      } finally {
        setLoading(false);
      }
    };

    fetchUserAndArts();
  }, [userId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link 
            to="/admin/users" 
            className="text-gray-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-6 h-6" />
          </Link>
          <h1 className="text-3xl font-bold">Artes de {userName}</h1>
        </div>
      </div>

      {arts.length === 0 ? (
        <div className="text-center py-12 bg-dark-lighter rounded-lg">
          <p className="text-gray-400">Este usuário ainda não possui artes.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {arts.map((art) => (
            <div 
              key={art.id} 
              className="bg-dark-lighter rounded-lg overflow-hidden hover:transform hover:scale-105 transition-transform duration-200"
            >
              {art.type === 'video' ? (
                <div className="relative w-full h-48">
                  <video 
                    src={art.fileUrl}
                    className="w-full h-48 object-cover"
                    controls
                    preload="metadata"
                    onError={(e) => {
                      console.error('Erro ao carregar vídeo:', art.fileUrl);
                      e.currentTarget.poster = '/placeholder-video.png';
                    }}
                  >
                    Seu navegador não suporta a tag de vídeo.
                  </video>
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <Play className="w-12 h-12 text-white opacity-75" />
                  </div>
                  <button
                    onClick={() => handleDownload(art)}
                    disabled={downloading === art.id}
                    className="absolute top-2 right-2 p-2 bg-primary text-white rounded-full hover:bg-primary/90 transition-colors disabled:opacity-50"
                  >
                    {downloading === art.id ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <Download className="w-5 h-5" />
                    )}
                  </button>
                </div>
              ) : (
                <div className="relative">
                  <img 
                    src={art.fileUrl} 
                    alt={art.title} 
                    className="w-full h-48 object-cover"
                    onError={(e) => {
                      console.error('Erro ao carregar imagem:', art.fileUrl);
                      e.currentTarget.src = '/placeholder-image.png';
                    }}
                  />
                  <button
                    onClick={() => handleDownload(art)}
                    disabled={downloading === art.id}
                    className="absolute top-2 right-2 p-2 bg-primary text-white rounded-full hover:bg-primary/90 transition-colors disabled:opacity-50"
                  >
                    {downloading === art.id ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <Download className="w-5 h-5" />
                    )}
                  </button>
                </div>
              )}
              <div className="p-4">
                <h3 className="font-medium text-lg mb-2">
                  {art.title || 'Sem título'}
                </h3>
                <p className="text-xs text-gray-500">
                  {new Date(art.createdAt).toLocaleDateString('pt-BR', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
