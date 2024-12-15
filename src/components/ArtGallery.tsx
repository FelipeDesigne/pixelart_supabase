import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Loader2, Download, Play, Pause, ChevronDown, ChevronUp } from 'lucide-react';
import { toast } from 'react-hot-toast';

interface ArtWork {
  id: string;
  title: string;
  description: string;
  fileUrl: string;
  thumbnailUrl?: string;
  type: 'image' | 'video';
  createdAt: string;
  monthYear: string;
}

interface ArtworksByMonth {
  [key: string]: ArtWork[];
}

interface ArtGalleryProps {
  userId: string;
}

export default function ArtGallery({ userId }: ArtGalleryProps) {
  const [artworksByMonth, setArtworksByMonth] = useState<ArtworksByMonth>({});
  const [loading, setLoading] = useState(true);
  const [selectedArt, setSelectedArt] = useState<ArtWork | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [expandedMonths, setExpandedMonths] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchArtworks();
  }, [userId]);

  const fetchArtworks = async () => {
    try {
      setLoading(true);
      
      // Primeiro, listar todos os anos
      const { data: years, error: yearsError } = await supabase.storage
        .from('PixelArt')
        .list(`users/${userId}/artworks`);

      if (yearsError) throw yearsError;

      const artworksByMonth: ArtworksByMonth = {};

      if (years && years.length > 0) {
        // Para cada ano, listar os meses
        for (const year of years) {
          const { data: months, error: monthsError } = await supabase.storage
            .from('PixelArt')
            .list(`users/${userId}/artworks/${year.name}`);

          if (monthsError) throw monthsError;

          if (months && months.length > 0) {
            // Para cada mês, listar os arquivos
            for (const month of months) {
              const monthYear = `${year.name}/${month.name}`;
              
              const { data: files, error: filesError } = await supabase.storage
                .from('PixelArt')
                .list(`users/${userId}/artworks/${monthYear}`);

              if (filesError) throw filesError;

              if (files && files.length > 0) {
                const artworks = await Promise.all(files.map(async (file) => {
                  const { data: { publicUrl } } = supabase.storage
                    .from('PixelArt')
                    .getPublicUrl(`users/${userId}/artworks/${monthYear}/${file.name}`);

                  const isVideo = file.metadata?.mimetype?.startsWith('video/');

                  return {
                    id: file.id,
                    title: file.name.split('.')[0],
                    description: file.metadata?.description || '',
                    fileUrl: publicUrl,
                    type: isVideo ? 'video' : 'image',
                    createdAt: file.created_at,
                    monthYear
                  };
                }));

                // Ordenar artworks por data (mais recente primeiro)
                artworks.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
                
                artworksByMonth[monthYear] = artworks;
              }
            }
          }
        }
      }

      // Ordenar as chaves (meses) em ordem decrescente
      const sortedArtworksByMonth: ArtworksByMonth = {};
      Object.keys(artworksByMonth)
        .sort((a, b) => b.localeCompare(a))
        .forEach(key => {
          sortedArtworksByMonth[key] = artworksByMonth[key];
          // Expandir o mês mais recente por padrão
          if (Object.keys(sortedArtworksByMonth).length === 1) {
            setExpandedMonths(new Set([key]));
          }
        });

      setArtworksByMonth(sortedArtworksByMonth);
    } catch (error) {
      console.error('Error fetching artworks:', error);
      toast.error('Erro ao carregar as artes');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (artwork: ArtWork) => {
    try {
      const response = await fetch(artwork.fileUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${artwork.title}.${artwork.type === 'video' ? 'mp4' : 'png'}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      
      toast.success('Download iniciado!');
    } catch (error) {
      console.error('Error downloading file:', error);
      toast.error('Erro ao fazer download');
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

  const formatMonthYear = (monthYear: string) => {
    const [year, month] = monthYear.split('/');
    const date = new Date(parseInt(year), parseInt(month) - 1);
    return date.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
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
                <span>{formatMonthYear(monthYear)}</span>
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
                        {artwork.type === 'image' ? (
                          <img
                            src={artwork.fileUrl}
                            alt={artwork.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <video
                            src={artwork.fileUrl}
                            className="w-full h-full object-cover"
                            controls={selectedArt?.id === artwork.id}
                            onClick={() => setSelectedArt(artwork)}
                          />
                        )}
                        <button
                          onClick={() => handleDownload(artwork)}
                          className="absolute bottom-2 right-2 p-2 bg-primary text-white rounded-full hover:bg-primary/90 transition-colors"
                          title="Download"
                        >
                          <Download className="w-5 h-5" />
                        </button>
                        {artwork.type === 'video' && (
                          <button
                            onClick={() => {
                              setSelectedArt(artwork);
                              setIsPlaying(!isPlaying);
                            }}
                            className="absolute bottom-2 left-2 p-2 bg-primary text-white rounded-full hover:bg-primary/90 transition-colors"
                          >
                            {selectedArt?.id === artwork.id && isPlaying ? (
                              <Pause className="w-5 h-5" />
                            ) : (
                              <Play className="w-5 h-5" />
                            )}
                          </button>
                        )}
                      </div>
                      <div className="p-4">
                        <h3 className="font-semibold mb-1">{artwork.title}</h3>
                        {artwork.description && (
                          <p className="text-sm text-gray-400">
                            {artwork.description}
                          </p>
                        )}
                        <p className="text-xs text-gray-500 mt-1">
                          {new Date(artwork.createdAt).toLocaleDateString('pt-BR')}
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
