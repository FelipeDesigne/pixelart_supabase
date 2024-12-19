import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Loader2, Download, Play, Pause, ChevronDown, ChevronUp } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { downloadAndDeleteArt } from '../services/imageUpload';

interface ArtWork {
  id: string;
  title: string;
  description: string;
  fileUrl: string;
  thumbnailUrl?: string;
  type: 'image' | 'video';
  createdAt: string;
  monthYear: string;
  filePath: string;
}

interface ArtworksByMonth {
  [key: string]: ArtWork[];
}

interface ArtGalleryProps {
  userId: string;
  userName: string;
}

export default function ArtGallery({ userId, userName }: ArtGalleryProps) {
  const [artworksByMonth, setArtworksByMonth] = useState<ArtworksByMonth>({});
  const [loading, setLoading] = useState(true);
  const [expandedMonths, setExpandedMonths] = useState<Set<string>>(new Set());
  const [downloading, setDownloading] = useState<string | null>(null);

  useEffect(() => {
    fetchArtworks();
  }, []);

  const fetchArtworks = async () => {
    try {
      setLoading(true);

      // Buscar anos
      const { data: years, error: yearsError } = await supabase.storage
        .from('PixelArt')
        .list(`users/${userId}/artworks`);

      console.log('Anos encontrados:', {
        path: `users/${userId}/artworks`,
        years,
        error: yearsError
      });

      if (yearsError) throw yearsError;

      const artworks: ArtWork[] = [];

      // Processar cada ano
      for (const year of years || []) {
        // Buscar meses
        const { data: months, error: monthsError } = await supabase.storage
          .from('PixelArt')
          .list(`users/${userId}/artworks/${year.name}`);

        console.log(`Meses encontrados para ${year.name}:`, {
          path: `users/${userId}/artworks/${year.name}`,
          months,
          error: monthsError
        });

        if (monthsError) {
          console.error(`Erro ao buscar meses do ano ${year.name}:`, monthsError);
          continue;
        }

        // Processar cada mês
        for (const month of months || []) {
          // Buscar arquivos
          const { data: files, error: filesError } = await supabase.storage
            .from('PixelArt')
            .list(`users/${userId}/artworks/${year.name}/${month.name}`);

          console.log(`Arquivos encontrados em ${month.name}/${year.name}:`, {
            path: `users/${userId}/artworks/${year.name}/${month.name}`,
            files,
            error: filesError
          });

          if (filesError) {
            console.error(`Erro ao buscar arquivos de ${month.name}/${year.name}:`, filesError);
            continue;
          }

          // Processar arquivos
          for (const file of files || []) {
            const { data: { publicUrl } } = supabase.storage
              .from('PixelArt')
              .getPublicUrl(`users/${userId}/artworks/${year.name}/${month.name}/${file.name}`);

            console.log('Processando arquivo:', {
              name: file.name,
              path: `users/${userId}/artworks/${year.name}/${month.name}/${file.name}`,
              metadata: file.metadata,
              publicUrl
            });

            const isVideo = file.metadata?.mimetype?.startsWith('video/');
            const monthYear = 'dezembro de 2024';  

            artworks.push({
              id: file.id,
              title: file.name.split('.')[0].replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
              description: '',
              fileUrl: publicUrl,
              type: isVideo ? 'video' : 'image',
              createdAt: file.created_at || new Date().toISOString(),
              monthYear,
              filePath: `users/${userId}/artworks/${year.name}/${month.name}/${file.name}`
            });
          }
        }
      }

      console.log('Total de artes encontradas:', artworks.length);

      // Agrupar todas as artes em dezembro de 2024
      const grouped: ArtworksByMonth = {
        'dezembro de 2024': artworks
      };

      setArtworksByMonth(grouped);
    } catch (error) {
      console.error('Error fetching artworks:', error);
      toast.error('Erro ao carregar artes');
    } finally {
      setLoading(false);
    }
  };

  const toggleMonth = (monthYear: string) => {
    const newExpandedMonths = new Set(expandedMonths);
    if (expandedMonths.has(monthYear)) {
      newExpandedMonths.delete(monthYear);
    } else {
      newExpandedMonths.add(monthYear);
    }
    setExpandedMonths(newExpandedMonths);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Minhas Artes</h2>
      
      {Object.keys(artworksByMonth).length === 0 ? (
        <div className="bg-dark p-6 rounded-lg text-center">
          <p className="text-gray-400 mb-2">
            Nenhuma arte disponível ainda.
          </p>
          <p className="text-sm text-gray-500">
            Suas artes aparecerão aqui quando estiverem prontas.
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          {Object.entries(artworksByMonth).map(([monthYear, artworks]) => (
            <div key={monthYear} className="space-y-4">
              <button
                onClick={() => toggleMonth(monthYear)}
                className="flex items-center space-x-2 text-xl font-semibold hover:text-primary transition-colors"
              >
                <span>{monthYear}</span>
                {expandedMonths.has(monthYear) ? (
                  <ChevronUp className="w-5 h-5" />
                ) : (
                  <ChevronDown className="w-5 h-5" />
                )}
              </button>

              {expandedMonths.has(monthYear) && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {artworks.map((artwork) => (
                    <div
                      key={artwork.id}
                      className="bg-dark rounded-lg overflow-hidden shadow-lg"
                    >
                      <div className="aspect-video relative">
                        {artwork.type === 'video' ? (
                          <div className="relative w-full h-48">
                            <video 
                              src={artwork.fileUrl}
                              className="w-full h-48 object-cover"
                              controls
                              preload="metadata"
                              onError={(e) => {
                                console.error('Erro ao carregar vídeo:', artwork.fileUrl);
                                const target = e.target as HTMLVideoElement;
                                target.poster = '/placeholder-video.png';
                              }}
                            >
                              Seu navegador não suporta a tag de vídeo.
                            </video>
                            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                              <Play className="w-12 h-12 text-white opacity-75" />
                            </div>
                            <button
                              onClick={async () => {
                                try {
                                  setDownloading(artwork.id);
                                  const fileName = artwork.filePath.split('/').pop() || 'download';
                                  await downloadAndDeleteArt(artwork.filePath, fileName);
                                  setArtworksByMonth(prev => {
                                    const newArtworksByMonth = { ...prev };
                                    newArtworksByMonth[monthYear] = newArtworksByMonth[monthYear].filter(a => a.id !== artwork.id);
                                    return newArtworksByMonth;
                                  });
                                  toast.success('Arquivo baixado com sucesso!');
                                } catch (error) {
                                  console.error('Erro ao baixar arquivo:', error);
                                  toast.error('Erro ao baixar arquivo');
                                } finally {
                                  setDownloading(null);
                                }
                              }}
                              disabled={downloading === artwork.id}
                              className="absolute top-2 right-2 p-2 bg-primary text-white rounded-full hover:bg-primary/90 transition-colors disabled:opacity-50"
                            >
                              {downloading === artwork.id ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
                              ) : (
                                <Download className="w-5 h-5" />
                              )}
                            </button>
                          </div>
                        ) : (
                          <div className="relative">
                            <img 
                              src={artwork.fileUrl} 
                              alt={artwork.title}
                              className="w-full h-48 object-cover"
                              onError={(e) => {
                                console.error('Erro ao carregar imagem:', artwork.fileUrl);
                                e.currentTarget.src = '/placeholder-image.png';
                              }}
                            />
                            <button
                              onClick={async () => {
                                try {
                                  setDownloading(artwork.id);
                                  const fileName = artwork.filePath.split('/').pop() || 'download';
                                  await downloadAndDeleteArt(artwork.filePath, fileName);
                                  setArtworksByMonth(prev => {
                                    const newArtworksByMonth = { ...prev };
                                    newArtworksByMonth[monthYear] = newArtworksByMonth[monthYear].filter(a => a.id !== artwork.id);
                                    return newArtworksByMonth;
                                  });
                                  toast.success('Arquivo baixado com sucesso!');
                                } catch (error) {
                                  console.error('Erro ao baixar arquivo:', error);
                                  toast.error('Erro ao baixar arquivo');
                                } finally {
                                  setDownloading(null);
                                }
                              }}
                              disabled={downloading === artwork.id}
                              className="absolute top-2 right-2 p-2 bg-primary text-white rounded-full hover:bg-primary/90 transition-colors disabled:opacity-50"
                            >
                              {downloading === artwork.id ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
                              ) : (
                                <Download className="w-5 h-5" />
                              )}
                            </button>
                          </div>
                        )}
                        {/* Removendo o botão antigo de download */}
                      </div>
                      <div className="p-4">
                        <h3 className="font-semibold mb-1">{artwork.title}</h3>
                        <p className="text-xs text-gray-500">
                          {new Date(artwork.createdAt).toLocaleDateString('pt-BR', {
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
          ))}
        </div>
      )}
    </div>
  );
}
