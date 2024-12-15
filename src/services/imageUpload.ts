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

export async function uploadFinishedArt(file: File, userId: string, title: string, description: string) {
  try {
    // Garantir que temos um token válido
    const token = await auth.currentUser?.getIdToken();
    if (!token) {
      throw new Error('Usuário não autenticado');
    }

    // Preparar o nome do arquivo
    const fileExt = file.name.split('.').pop();
    const sanitizedTitle = title.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const fileName = `${sanitizedTitle}-${Date.now()}.${fileExt}`;
    const monthYear = getMonthYearPath();
    const filePath = `users/${userId}/artworks/${monthYear}/${fileName}`;

    // Upload do arquivo
    const { data, error } = await supabase.storage
      .from('PixelArt')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: true,
        contentType: file.type
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
      monthYear // Adicionando informação do mês/ano para facilitar filtros
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
    // Primeiro, listar todos os meses/anos disponíveis
    const { data: folders, error: foldersError } = await supabase.storage
      .from('PixelArt')
      .list(`users/${userId}/artworks`);

    if (foldersError) throw foldersError;

    // Para cada mês/ano, listar os arquivos
    const allArtworks = await Promise.all(
      folders.map(async (folder) => {
        const { data: files, error: filesError } = await supabase.storage
          .from('PixelArt')
          .list(`users/${userId}/artworks/${folder.name}`);

        if (filesError) throw filesError;

        // Para cada arquivo, gerar URL pública
        return Promise.all(files.map(async (file) => {
          const filePath = `users/${userId}/artworks/${folder.name}/${file.name}`;
          const { data: { publicUrl } } = supabase.storage
            .from('PixelArt')
            .getPublicUrl(filePath);

          return {
            ...file,
            monthYear: folder.name,
            publicUrl,
            filePath
          };
        }));
      })
    );

    // Flatten o array de arrays e ordenar por data (mais recente primeiro)
    const flattenedArtworks = allArtworks
      .flat()
      .sort((a, b) => {
        const dateA = new Date(a.created_at || 0);
        const dateB = new Date(b.created_at || 0);
        return dateB.getTime() - dateA.getTime();
      });

    return flattenedArtworks;
  } catch (error) {
    console.error('Erro ao listar artworks:', error);
    throw error;
  }
}
