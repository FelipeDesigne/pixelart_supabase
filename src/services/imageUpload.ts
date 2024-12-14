import { supabase } from '../lib/supabase';

export async function uploadImage(file: File, userId: string) {
  try {
    const fileExt = file.name.split('.').pop();
    const fileName = `${userId}-${Date.now()}.${fileExt}`;
    const filePath = `${fileName}`;

    // Upload do arquivo para o Supabase Storage
    const { data, error } = await supabase.storage
      .from('PixelArt')
      .upload(filePath, file);

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

export async function deleteImage(path: string) {
  try {
    const fileName = path.split('/').pop();
    if (!fileName) throw new Error('Invalid file path');

    const { error } = await supabase.storage
      .from('PixelArt')
      .remove([fileName]);

    if (error) throw error;
  } catch (error) {
    console.error('Erro ao deletar imagem:', error);
    throw error;
  }
}
