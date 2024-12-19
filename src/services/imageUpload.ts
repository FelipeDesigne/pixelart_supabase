import { supabase } from '../lib/supabase';
import { auth } from '../lib/firebase';

function getMonthYearPath() {
  const date = new Date();
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0'); // Janeiro é 0, então somamos 1
  return `${year}/${month}`;
}

export async function uploadImage(file: File, userId: string) {
  try {
    // Garantir que temos um token válido
    const token = await auth.currentUser?.getIdToken();
    if (!token) {
      throw new Error('Usuário não autenticado');
    }

    const fileExt = file.name.split('.').pop();
    const fileName = `${userId}-${Date.now()}.${fileExt}`;
    const monthYear = getMonthYearPath();
    const filePath = `requests/${monthYear}/${fileName}`;

    // Upload do arquivo para o Supabase Storage
    const { data, error } = await supabase.storage
      .from('PixelArt')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: true,
        contentType: file.type
      });

    if (error) throw error;

    // Gerar URL pública
    const { data: { publicUrl } } = supabase.storage
      .from('PixelArt')
      .getPublicUrl(filePath);

    return publicUrl;
  } catch (error) {
    console.error('Erro ao fazer upload:', error);
    throw error;
  }
}

export async function uploadFinishedArt(file: File, userId: string, title: string, description: string, userName: string) {
  try {
    // Garantir que temos um token válido
    const token = await auth.currentUser?.getIdToken();
    if (!token) {
      throw new Error('Usuário não autenticado');
    }

    // Preparar o nome do arquivo
    const fileExt = file.name.split('.').pop()?.toLowerCase();
    const sanitizedTitle = title.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const fileName = `${sanitizedTitle}.${fileExt}`;
    
    // Criar caminho do arquivo incluindo ano e mês
    const now = new Date();
    const year = now.getFullYear().toString();
    const month = (now.getMonth() + 1).toString().padStart(2, '0');
    const filePath = `users/${userId}/artworks/${userName}/${year}/${month}/${fileName}`;

    console.log('Fazendo upload:', {
      title,
      sanitizedTitle,
      fileName,
      filePath,
      fileType: file.type,
      size: file.size,
      year,
      month,
      userName
    });

    // Upload do arquivo
    const { data, error } = await supabase.storage
      .from('PixelArt')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: true,
        contentType: file.type,
        duplex: 'half',
        metadata: {
          title,
          description,
          userId,
          uploadedAt: new Date().toISOString(),
          fileType: file.type,
          fileSize: file.size
        }
      });

    if (error) {
      console.error('Erro detalhado:', error);
      throw error;
    }

    // Gerar URL pública
    const { data: { publicUrl } } = supabase.storage
      .from('PixelArt')
      .getPublicUrl(filePath);

    // Criar registro com os metadados
    const metadata = {
      title,
      description,
      userId,
      filePath,
      publicUrl,
      uploadedAt: new Date().toISOString(),
      fileType: file.type,
      fileSize: file.size,
      originalTitle: title
    };

    return {
      url: publicUrl,
      path: filePath,
      metadata
    };
  } catch (error) {
    console.error('Erro ao fazer upload da arte:', error);
    throw error;
  }
}

export async function deleteImage(path: string) {
  try {
    const { data, error } = await supabase.storage
      .from('PixelArt')
      .remove([path]);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Erro ao deletar imagem:', error);
    throw error;
  }
}

export async function listUserArtworks(userId: string) {
  try {
    console.log('Buscando artes para usuário:', userId);

    // Listar todos os arquivos na pasta artworks
    const { data: files, error } = await supabase.storage
      .from('PixelArt')
      .list(`users/${userId}/artworks`);

    if (error) {
      console.error('Erro ao listar arquivos:', error);
      throw error;
    }

    console.log('Arquivos encontrados:', files);

    if (!files) return [];

    // Para cada arquivo, gerar URL pública e determinar o tipo
    const artworks = await Promise.all(
      files.map(async (file) => {
        console.log('Processando arquivo:', file);

        const filePath = `users/${userId}/artworks/${file.name}`;
        const fileExt = file.name.split('.').pop()?.toLowerCase() || '';
        const isVideo = ['mp4', 'webm', 'mov', 'avi'].includes(fileExt);
        
        const { data: { publicUrl } } = supabase.storage
          .from('PixelArt')
          .getPublicUrl(filePath);

        // Extrair título do nome do arquivo
        const title = file.name
          .split('.')
          .slice(0, -1)
          .join('.')
          .replace(/^\d+-/, '') // remove timestamp do início
          .replace(/-/g, ' ')
          .replace(/\b\w/g, l => l.toUpperCase());

        console.log('Arte processada:', {
          name: file.name,
          title,
          type: isVideo ? 'video' : 'image',
          url: publicUrl
        });

        return {
          id: file.name,
          title,
          fileUrl: publicUrl,
          createdAt: file.created_at || new Date().toISOString(),
          type: isVideo ? 'video' : 'image'
        };
      })
    );

    // Ordenar por data de criação (mais recente primeiro)
    const sortedArtworks = artworks.sort((a, b) => {
      const dateA = new Date(a.createdAt);
      const dateB = new Date(b.createdAt);
      return dateB.getTime() - dateA.getTime();
    });

    console.log('Artes ordenadas:', sortedArtworks);

    return sortedArtworks;
  } catch (error) {
    console.error('Erro ao listar artworks:', error);
    throw error;
  }
}

export async function downloadAndDeleteArt(filePath: string, fileName: string) {
  try {
    // Download do arquivo
    const { data, error: downloadError } = await supabase.storage
      .from('PixelArt')
      .download(filePath);

    if (downloadError) {
      console.error('Erro ao baixar arquivo:', downloadError);
      throw downloadError;
    }

    if (!data) {
      throw new Error('Arquivo não encontrado');
    }

    // Criar URL para download
    const url = URL.createObjectURL(data);
    
    // Criar elemento <a> para download
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName; // Nome do arquivo para download
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // Limpar URL
    URL.revokeObjectURL(url);

    // Deletar arquivo do Supabase
    const { error: deleteError } = await supabase.storage
      .from('PixelArt')
      .remove([filePath]);

    if (deleteError) {
      console.error('Erro ao deletar arquivo:', deleteError);
      throw deleteError;
    }

    return true;
  } catch (error) {
    console.error('Erro ao fazer download e deletar:', error);
    throw error;
  }
}
