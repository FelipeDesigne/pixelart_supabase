import React, { useState, useEffect, useRef } from 'react';
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
  const { isAdmin, user } = useAuth();
  const navigate = useNavigate();
  const formRef = useRef<HTMLFormElement>(null);
  const [loading, setLoading] = useState(false);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  useEffect(() => {
    // Verificar se o usuário está autenticado e é admin
    if (!user) {
      navigate('/login');
      return;
    }
    
    if (!isAdmin) {
      navigate('/');
      return;
    }
    
    fetchUsers();
  }, [isAdmin, navigate, user]);

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
      if (!selectedUser || !title || files.length === 0) {
        throw new Error('Por favor, preencha todos os campos obrigatórios');
      }

      // Validar tamanho e tipo de cada arquivo
      const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB em bytes
      const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'video/mp4', 'video/webm'];
      
      for (const file of files) {
        if (file.size > MAX_FILE_SIZE) {
          throw new Error(`O arquivo "${file.name}" é muito grande. O tamanho máximo é 50MB.`);
        }
        if (!allowedTypes.includes(file.type)) {
          throw new Error(`O arquivo "${file.name}" não é suportado. Use imagens (JPG, PNG, GIF, WebP) ou vídeos (MP4, WebM).`);
        }
      }

      // Upload de cada arquivo
      for (const file of files) {
        await uploadFinishedArt(
          file,
          selectedUser,
          title,
          description || '',
          users.find(u => u.id === selectedUser)?.name
        );
      }

      toast.success(`${files.length} ${files.length === 1 ? 'arte enviada' : 'artes enviadas'} com sucesso!`);
      
      // Limpar formulário
      setSelectedUser('');
      setTitle('');
      setDescription('');
      setFiles([]);
      formRef.current?.reset(); // Reseta o formulário, incluindo o input de arquivo
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
      <h1 className="text-2xl font-bold mb-6 text-white">Upload de Arte Finalizada</h1>

      <form ref={formRef} onSubmit={handleSubmit} className="space-y-6">
        {/* Seleção de usuário */}
        <div>
          <label className="block text-sm font-medium mb-2 text-gray-300">
            Cliente
          </label>
          <div className="relative">
            <button
              type="button"
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="w-full flex items-center justify-between bg-[#16162a] p-3 rounded-lg text-left hover:bg-[#1a1a2e] transition-colors border border-gray-700"
            >
              <span className="text-gray-300">
                {selectedUser ? users.find(u => u.id === selectedUser)?.email : 'Selecione um cliente'}
              </span>
              <ChevronDown className="w-5 h-5 text-gray-300" />
            </button>

            {dropdownOpen && (
              <div className="absolute z-10 w-full mt-1 bg-[#16162a] border border-gray-700 rounded-lg shadow-lg max-h-60 overflow-auto">
                {loadingUsers ? (
                  <div className="flex items-center justify-center p-4">
                    <Loader2 className="w-5 h-5 animate-spin text-[#2563eb]" />
                  </div>
                ) : (
                  <div className="py-1">
                    {users.map((user) => (
                      <button
                        key={user.id}
                        type="button"
                        className="w-full text-left px-4 py-2 text-gray-300 hover:bg-[#1a1a2e] transition-colors"
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
          <label className="block text-sm font-medium mb-2 text-gray-300">
            Título
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full bg-[#16162a] p-3 rounded-lg text-white placeholder-gray-400 border border-gray-700 focus:outline-none focus:ring-2 focus:ring-[#2563eb]"
            placeholder="Digite o título da arte..."
          />
        </div>

        {/* Descrição */}
        <div>
          <label className="block text-sm font-medium mb-2 text-gray-300">
            Descrição (opcional)
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full bg-[#16162a] p-3 rounded-lg text-white placeholder-gray-400 border border-gray-700 focus:outline-none focus:ring-2 focus:ring-[#2563eb] min-h-[100px]"
            placeholder="Digite uma descrição..."
          />
        </div>

        {/* Upload de arquivos */}
        <div>
          <label className="block text-sm font-medium mb-2 text-gray-300">
            Arquivos
          </label>
          <input
            type="file"
            multiple
            accept="image/*,video/*"
            onChange={(e) => setFiles(Array.from(e.target.files || []))}
            className="w-full bg-[#16162a] p-3 rounded-lg text-white border border-gray-700 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-[#2563eb] file:text-white hover:file:bg-[#3b82f6]"
          />
          <p className="mt-2 text-sm text-gray-400">
            Formatos suportados: JPG, PNG, GIF, WebP, MP4, WebM (máx. 50MB)
          </p>
        </div>

        {/* Lista de arquivos selecionados */}
        {files.length > 0 && (
          <div>
            <h3 className="text-sm font-medium mb-2 text-gray-300">
              Arquivos selecionados:
            </h3>
            <ul className="space-y-1 text-sm text-gray-400">
              {Array.from(files).map((file, index) => (
                <li key={index}>
                  {file.name} ({(file.size / 1024 / 1024).toFixed(2)}MB)
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Botão de envio */}
        <div>
          <button
            type="submit"
            disabled={loading || !selectedUser || !title || files.length === 0}
            className="w-full bg-[#2563eb] text-white p-3 rounded-lg font-medium hover:bg-[#3b82f6] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
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
        </div>
      </form>
    </div>
  );
}
