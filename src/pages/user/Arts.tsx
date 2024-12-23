import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { Loader2, Play, Download } from 'lucide-react';
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

export default function Arts() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [arts, setArts] = useState<Art[]>([]);
  const [userName, setUserName] = useState('');
  const [selectedItem, setSelectedItem] = useState<Art | null>(null);
  const [downloading, setDownloading] = useState<string | null>(null);

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

            // Buscar arquivos usando o nome do usuário no caminho
            const { data: files, error: filesError } = await supabase.storage
              .from('PixelArt')
              .list(`users/${user.uid}/artworks/${name}`);

            console.log('Arquivos encontrados:', {
              path: `users/${user.uid}/artworks/${name}`,
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
                .getPublicUrl(`users/${user.uid}/artworks/${name}/${file.name}`);

              console.log('Processando arquivo:', {
                name: file.name,
                path: `users/${user.uid}/artworks/${name}/${file.name}`,
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
                filePath: `users/${user.uid}/artworks/${name}/${file.name}`
              });
            }

            console.log('Artes encontradas:', allArtworks);
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
    <div className="container mx-auto p-4 bg-[#16162a] text-white">
      <h1 className="text-2xl font-bold mb-6">Minhas Artes</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {arts.map((art) => (
          <div key={art.id} className="bg-[#1a1a2e] rounded-lg shadow-md overflow-hidden hover:transform hover:scale-105 transition-transform duration-200">
            {art.type === 'video' ? (
              <div className="relative aspect-video bg-gray-100 cursor-pointer" onClick={() => setSelectedItem(art)}>
                <video 
                  src={art.fileUrl} 
                  className="w-full h-full object-cover"
                >
                  Seu navegador não suporta o elemento de vídeo.
                </video>
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <Play className="w-12 h-12 text-white opacity-75" />
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDownload(art);
                  }}
                  disabled={downloading === art.id}
                  className="absolute top-2 right-2 p-2 bg-[#2563eb] text-white rounded-full hover:bg-[#3b82f6] transition-colors disabled:opacity-50"
                >
                  {downloading === art.id ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Download className="w-5 h-5" />
                  )}
                </button>
              </div>
            ) : (
              <div className="aspect-square bg-gray-100 cursor-pointer relative" onClick={() => setSelectedItem(art)}>
                <img src={art.fileUrl} alt={art.title} className="w-full h-full object-cover" />
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDownload(art);
                  }}
                  disabled={downloading === art.id}
                  className="absolute top-2 right-2 p-2 bg-[#2563eb] text-white rounded-full hover:bg-[#3b82f6] transition-colors disabled:opacity-50"
                >
                  {downloading === art.id ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Download className="w-5 h-5" />
                  )}
                </button>
              </div>
            )}
            <div className="p-4 bg-[#1a1a2e]">
              <h3 className="font-medium text-lg mb-2 text-white">
                {art.title || 'Sem título'}
              </h3>
              <p className="text-xs text-gray-400">
                {art.createdAt ? new Date(art.createdAt).toLocaleString('pt-BR', {
                  day: '2-digit',
                  month: '2-digit',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                }) : 'Data não disponível'}
              </p>
            </div>
          </div>
        ))}
      </div>

      {selectedItem && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50" onClick={() => setSelectedItem(null)}>
          <div 
            className="w-full h-full md:w-auto md:h-auto max-w-[90vw] max-h-[90vh] bg-[#1a1a2e] rounded-lg p-4 relative flex items-center justify-center" 
            onClick={e => e.stopPropagation()}
          >
            {selectedItem.type === 'video' ? (
              <div className="w-full h-full flex items-center justify-center">
                <video 
                  src={selectedItem.fileUrl} 
                  className="max-w-full max-h-[80vh] w-auto h-auto"
                  controls 
                  autoPlay
                >
                  Seu navegador não suporta o elemento de vídeo.
                </video>
              </div>
            ) : (
              <img 
                src={selectedItem.fileUrl} 
                alt={selectedItem.title} 
                className="max-w-full max-h-[80vh] w-auto h-auto object-contain" 
              />
            )}
            <button
              onClick={() => handleDownload(selectedItem)}
              disabled={downloading === selectedItem.id}
              className="absolute top-2 right-2 p-2 bg-[#2563eb] text-white rounded-full hover:bg-[#3b82f6] transition-colors disabled:opacity-50 z-10"
            >
              {downloading === selectedItem.id ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Download className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
