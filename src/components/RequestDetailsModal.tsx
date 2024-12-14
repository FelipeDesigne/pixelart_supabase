import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { db } from '../lib/firebase';
import { doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { toast } from 'react-hot-toast';
import { useState, useEffect } from 'react';
import { deleteImage } from '../services/imageUpload';

interface Request {
  id: string;
  userId: string;
  userName: string;
  referenceUrls: string[];
  driveUrl: string;
  description: string;
  status: string;
  createdAt: any;
  read: boolean;
  imageUrl?: string;
}

interface RequestDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  request: Request;
  onRequestUpdate?: (requestId: string, newData: Partial<Request>) => void;
}

export default function RequestDetailsModal({ isOpen, onClose, request: initialRequest, onRequestUpdate }: RequestDetailsModalProps) {
  const [request, setRequest] = useState<Request>(initialRequest);

  // Atualiza o estado local quando o request inicial muda
  useEffect(() => {
    setRequest(initialRequest);
  }, [initialRequest]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-500';
      case 'in_progress':
        return 'bg-blue-500';
      case 'completed':
        return 'bg-green-500';
      case 'rejected':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  const handleDeleteRequest = async () => {
    if (request.status !== 'completed') {
      toast.error('Apenas pedidos concluídos podem ser excluídos');
      return;
    }

    const confirmed = window.confirm(
      'Tem certeza que deseja excluir este pedido? Esta ação não pode ser desfeita.'
    );

    if (confirmed) {
      try {
        // Deletar a imagem do Supabase
        if (request.imageUrl) {
          await deleteImage(request.imageUrl);
        }

        // Deletar o documento do Firestore
        await deleteDoc(doc(db, 'requests', request.id));
        toast.success('Pedido excluído com sucesso!');
        onClose();
      } catch (error) {
        console.error('Error deleting request:', error);
        toast.error('Erro ao excluir pedido');
      }
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    try {
      await updateDoc(doc(db, 'requests', request.id), {
        status: newStatus
      });
      
      // Atualiza o estado local
      setRequest(prev => ({
        ...prev,
        status: newStatus
      }));

      // Notifica o componente pai sobre a atualização
      if (onRequestUpdate) {
        onRequestUpdate(request.id, { status: newStatus });
      }

      toast.success('Status atualizado com sucesso!');
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Erro ao atualizar status');
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Detalhes do Pedido</span>
            <Badge className={getStatusColor(request.status)}>
              {request.status}
            </Badge>
            {request.status === 'completed' && (
              <button
                onClick={handleDeleteRequest}
                className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded-lg flex items-center gap-1"
                title="Excluir pedido"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                Excluir
              </button>
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Informações do Cliente */}
          <div>
            <h3 className="font-semibold mb-2">Cliente</h3>
            <p>{request.userName}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {request.createdAt?.toDate().toLocaleString()}
            </p>
          </div>

          {/* Descrição */}
          <div>
            <h3 className="font-semibold mb-2">Descrição</h3>
            <p className="whitespace-pre-wrap text-gray-700 dark:text-gray-300">
              {request.description}
            </p>
          </div>

          {/* Imagens de Referência */}
          {request.referenceUrls && request.referenceUrls.length > 0 && (
            <div className="mt-4">
              <h3 className="font-medium mb-2">Imagens de Referência:</h3>
              <div className="space-y-2">
                {request.referenceUrls.map((url, index) => (
                  url && (
                    <div key={index} className="flex flex-col">
                      <a 
                        href={url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-primary hover:text-primary-light break-all"
                      >
                        {url}
                      </a>
                      {/* Preview da imagem */}
                      <img 
                        src={url} 
                        alt={`Referência ${index + 1}`}
                        className="mt-2 max-w-full h-auto rounded-lg"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                        }}
                      />
                    </div>
                  )
                ))}
              </div>
            </div>
          )}

          {/* URL do Google Drive */}
          {request.driveUrl && (
            <div className="mt-4">
              <h3 className="font-medium mb-2">Pasta do Google Drive:</h3>
              <a 
                href={request.driveUrl} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-primary hover:text-primary-light break-all"
              >
                {request.driveUrl}
              </a>
            </div>
          )}

          {/* Ações */}
          <div className="flex gap-2 pt-4">
            {request.status === 'pending' && (
              <>
                <Button
                  onClick={() => handleStatusChange('in_progress')}
                  variant="default"
                >
                  Começar a Trabalhar
                </Button>
                <Button
                  onClick={() => handleStatusChange('rejected')}
                  variant="destructive"
                >
                  Rejeitar
                </Button>
              </>
            )}
            {request.status === 'in_progress' && (
              <Button
                onClick={() => handleStatusChange('completed')}
                variant="default"
              >
                Marcar como Concluído
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
