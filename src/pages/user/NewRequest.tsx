import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { db } from '../../lib/firebase';
import { collection, addDoc, doc, getDoc } from 'firebase/firestore';
import { toast } from 'react-hot-toast';
import { Loader2 } from 'lucide-react';

export default function NewRequest() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    type: '',
    description: '',
    referenceImage: '',
    driveUrl: '' // Adicionado campo para URL do Google Drive
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkUserStatus = async () => {
      if (!user) return;

      try {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists() && userDoc.data().isActive === false) {
          toast.error('Sua conta está desativada. Você não pode fazer novas solicitações.');
          navigate('/user');
        }
      } catch (error) {
        console.error('Error checking user status:', error);
      } finally {
        setLoading(false);
      }
    };

    checkUserStatus();
  }, [user, navigate]);

  if (loading) {
    return <div>Loading...</div>;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Buscar dados do usuário no Firestore
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      const userData = userDoc.data();

      // Criar solicitação com nome do usuário
      await addDoc(collection(db, 'requests'), {
        ...formData,
        userId: user?.uid,
        userEmail: user?.email,
        userName: userData?.name || user?.displayName || user?.email,
        status: 'pending',
        createdAt: new Date()
      });

      toast.success('Solicitação enviada com sucesso!');
      navigate('/user');
    } catch (error) {
      console.error('Error creating request:', error);
      toast.error('Erro ao criar solicitação');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Nova Solicitação</h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium mb-2">
            Tipo de Arte
          </label>
          <select
            value={formData.type}
            onChange={(e) => setFormData({ ...formData, type: e.target.value })}
            className="w-full p-2 bg-dark-lighter rounded-lg border border-gray-700 focus:outline-none focus:border-primary"
            required
          >
            <option value="">Selecione o tipo</option>
            <option value="pixel-art">Pixel Art</option>
            <option value="illustration">Ilustração</option>
            <option value="animation">Animação</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">
            Descrição
          </label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            className="w-full p-2 bg-dark-lighter rounded-lg border border-gray-700 focus:outline-none focus:border-primary min-h-[100px]"
            placeholder="Descreva o que você precisa..."
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">
            Imagem de Referência
          </label>
          <input
            type="text"
            value={formData.referenceImage}
            onChange={(e) => setFormData({ ...formData, referenceImage: e.target.value })}
            className="w-full p-2 bg-dark-lighter rounded-lg border border-gray-700 focus:outline-none focus:border-primary"
            placeholder="URL da imagem de referência"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">
            URL do Google Drive
          </label>
          <input
            type="text"
            value={formData.driveUrl}
            onChange={(e) => setFormData({ ...formData, driveUrl: e.target.value })}
            className="w-full p-2 bg-dark-lighter rounded-lg border border-gray-700 focus:outline-none focus:border-primary"
            placeholder="Cole aqui o link da sua pasta no Google Drive"
          />
          <p className="mt-1 text-sm text-gray-400">
            Compartilhe uma pasta do Google Drive com seus arquivos e referências
          </p>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full btn-primary py-2 flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Enviando...
            </>
          ) : (
            'Enviar Solicitação'
          )}
        </button>
      </form>
    </div>
  );
}