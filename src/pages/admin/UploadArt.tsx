import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from 'react-hot-toast';
import { Loader2, ChevronDown } from 'lucide-react';
import { uploadFinishedArt } from '../../services/imageUpload';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../lib/firebase';

interface User {
  id: string;
  email: string;
  name?: string;
}

export default function UploadArt() {
  const { isAdmin } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  useEffect(() => {
    if (!isAdmin) {
      navigate('/');
      return;
    }
    fetchUsers();
  }, [isAdmin, navigate]);

  const fetchUsers = async () => {
    try {
      const usersRef = collection(db, 'users');
      const snapshot = await getDocs(usersRef);
      const usersData = snapshot.docs
        .map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as User[];

      // Ordenar usuários por email
      usersData.sort((a, b) => a.email.localeCompare(b.email));
      
      setUsers(usersData);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('Erro ao carregar usuários');
    } finally {
      setLoadingUsers(false);
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);

    try {
      if (!selectedUser || !title || !file) {
        throw new Error('Por favor, preencha todos os campos obrigatórios');
      }

      // Validar tamanho do arquivo (máximo 50MB)
      const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB em bytes
      if (file.size > MAX_FILE_SIZE) {
        throw new Error('O arquivo é muito grande. O tamanho máximo é 50MB.');
      }

      // Validar tipo do arquivo
      const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'video/mp4', 'video/webm'];
      if (!allowedTypes.includes(file.type)) {
        throw new Error('Tipo de arquivo não suportado. Use imagens (JPG, PNG, GIF, WebP) ou vídeos (MP4, WebM).');
      }

      const result = await uploadFinishedArt(
        file,
        selectedUser,
        title,
        description || ''
      );

      console.log('Upload successful:', result);
      toast.success('Arte enviada com sucesso!');
      
      // Limpar formulário
      setSelectedUser('');
      setTitle('');
      setDescription('');
      setFile(null);
    } catch (error: any) {
      console.error('Error uploading art:', error);
      let errorMessage = 'Erro ao enviar arte. ';
      
      if (error.message) {
        errorMessage += error.message;
      } else if (error.error?.message) {
        errorMessage += error.error.message;
      }
      
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Upload de Arte Finalizada</h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Seleção de usuário */}
        <div>
          <label className="block text-sm font-medium mb-2">
            Cliente
          </label>
          <div className="relative">
            <button
              type="button"
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="w-full flex items-center justify-between bg-dark-lighter p-3 rounded-lg text-left hover:bg-dark transition-colors"
            >
              <span className="text-gray-300">
                {selectedUser ? users.find(u => u.id === selectedUser)?.email : 'Selecione um cliente'}
              </span>
              <ChevronDown className="w-5 h-5" />
            </button>

            {dropdownOpen && (
              <div className="absolute z-10 w-full mt-1 bg-dark-lighter border border-gray-700 rounded-lg shadow-lg max-h-60 overflow-auto">
                {loadingUsers ? (
                  <div className="flex items-center justify-center p-4">
                    <Loader2 className="w-5 h-5 animate-spin text-primary" />
                  </div>
                ) : (
                  <div className="py-1">
                    {users.map((user) => (
                      <button
                        key={user.id}
                        type="button"
                        className="w-full text-left px-4 py-2 hover:bg-dark transition-colors"
                        onClick={() => {
                          setSelectedUser(user.id);
                          setDropdownOpen(false);
                        }}
                      >
                        {user.email}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Título */}
        <div>
          <label className="block text-sm font-medium mb-2">
            Título
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full bg-dark-lighter p-3 rounded-lg"
            placeholder="Digite o título da arte..."
          />
        </div>

        {/* Descrição */}
        <div>
          <label className="block text-sm font-medium mb-2">
            Descrição (opcional)
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full bg-dark-lighter p-3 rounded-lg min-h-[100px]"
            placeholder="Digite uma descrição..."
          />
        </div>

        {/* Upload de arquivo */}
        <div>
          <label className="block text-sm font-medium mb-2">
            Arquivo
          </label>
          <input
            type="file"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
            accept="image/*,video/*"
            className="w-full bg-dark-lighter p-3 rounded-lg"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-primary hover:bg-primary-dark text-white font-medium py-3 px-4 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
        >
          {loading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin mr-2" />
              Enviando...
            </>
          ) : (
            'Enviar Arte'
          )}
        </button>
      </form>
    </div>
  );
}
