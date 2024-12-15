import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { db } from '../../lib/firebase';
import { collection, addDoc, doc, getDoc, serverTimestamp } from 'firebase/firestore';
import { toast } from 'react-hot-toast';
import { Loader2 } from 'lucide-react';
import { uploadImage } from '../../services/imageUpload';

export default function NewRequest() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    type: '',
    description: '',
    referenceUrls: [''], // Array para múltiplas URLs
    driveUrl: '' // Adicionado campo para URL do Google Drive
  });
  const [loading, setLoading] = useState(true);
  const [selectedFile, setSelectedFile] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  const addReferenceUrl = () => {
    setFormData(prev => ({
      ...prev,
      referenceUrls: [...prev.referenceUrls, '']
    }));
  };

  const updateReferenceUrl = (index: number, value: string) => {
    setFormData(prev => {
      const newUrls = [...prev.referenceUrls];
      newUrls[index] = value;
      return {
        ...prev,
        referenceUrls: newUrls
      };
    });
  };

  const removeReferenceUrl = (index: number) => {
    setFormData(prev => ({
      ...prev,
      referenceUrls: prev.referenceUrls.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.description.trim()) {
      toast.error('Por favor, adicione uma descrição');
      return;
    }

    setIsSubmitting(true);

    try {
      let imageUrl = null;
      if (selectedFile) {
        // Upload da imagem para o Supabase apenas se uma imagem foi selecionada
        imageUrl = await uploadImage(selectedFile, user!.uid);
      }

      // Criar o pedido no Firestore
      const docRef = await addDoc(collection(db, 'requests'), {
        userId: user!.uid,
        userName: user!.email,
        imageUrl,
        description: formData.description.trim(),
        status: 'pending',
        createdAt: serverTimestamp(),
        read: false
      });

      toast.success('Pedido enviado com sucesso!');
      navigate('/user/requests');
    } catch (error) {
      console.error('Erro ao enviar pedido:', error);
      toast.error('Erro ao enviar pedido. Tente novamente.');
    } finally {
      setIsSubmitting(false);
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
            <option value="feed">Arte para Feed (Instagram/Facebook)</option>
            <option value="stories">Arte para Stories (Instagram/Facebook)</option>
            <option value="feed-stories">Arte para Feed + Stories (Instagram/Facebook)</option>
            <option value="motion">Motion Design (Arte Animada)</option>
          </select>
          <p className="mt-2 text-sm text-gray-400">
            {formData.type === 'feed' && 
              "Arte estática para publicações no feed do Instagram e Facebook. Ideal para posts informativos, promocionais ou conteúdo que ficará permanente nos seus perfis."}
            {formData.type === 'stories' && 
              "Arte vertical otimizada para stories do Instagram e Facebook. Perfeita para conteúdo temporário, promoções rápidas ou interações com seus seguidores."}
            {formData.type === 'feed-stories' && 
              "Pacote completo com arte para feed e stories do Instagram e Facebook. Ideal para campanhas que precisam de presença em todos os formatos das redes sociais."}
            {formData.type === 'motion' && 
              "Artes animadas que dão vida ao seu conteúdo. Ótimo para chamar atenção e aumentar o engajamento em todas as redes sociais (Instagram e Facebook)."}
          </p>
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
            Imagens de Referência
          </label>
          {formData.referenceUrls.map((url, index) => (
            <div key={index} className="flex gap-2 mb-2">
              <input
                type="text"
                value={url}
                onChange={(e) => updateReferenceUrl(index, e.target.value)}
                className="flex-1 p-2 bg-dark-lighter rounded-lg border border-gray-700 focus:outline-none focus:border-primary"
                placeholder="URL da imagem de referência"
              />
              {formData.referenceUrls.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeReferenceUrl(index)}
                  className="p-2 text-red-500 hover:text-red-400"
                  title="Remover URL"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              )}
            </div>
          ))}
          <button
            type="button"
            onClick={addReferenceUrl}
            className="mt-2 text-primary hover:text-primary-light flex items-center gap-1 text-sm"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
            </svg>
            Adicionar outra URL
          </button>
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

        <div>
          <label className="block text-sm font-medium mb-2">
            Imagem
          </label>
          <input
            type="file"
            onChange={(e) => setSelectedFile(e.target.files[0])}
            className="w-full p-2 bg-dark-lighter rounded-lg border border-gray-700 focus:outline-none focus:border-primary"
          />
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full btn-primary py-2 flex items-center justify-center gap-2"
        >
          {isSubmitting ? (
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