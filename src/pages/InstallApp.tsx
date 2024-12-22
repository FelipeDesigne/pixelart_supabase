import { useEffect } from 'react';
import { Download, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { usePWA } from '../contexts/PWAContext';
import { toast } from 'react-hot-toast';

export default function InstallApp() {
  const navigate = useNavigate();
  const { deferredPrompt, setDeferredPrompt } = usePWA();

  useEffect(() => {
    // Se não tiver o prompt depois de 2 segundos, volta para o login
    const timer = setTimeout(() => {
      if (!deferredPrompt) {
        toast.error('App não está disponível para instalação no momento');
        navigate('/login');
      }
    }, 2000);

    return () => clearTimeout(timer);
  }, [deferredPrompt, navigate]);

  const handleInstall = async () => {
    if (!deferredPrompt) {
      toast.error('App não está disponível para instalação');
      return;
    }

    try {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      setDeferredPrompt(null);
      
      if (outcome === 'accepted') {
        toast.success('App instalado com sucesso!');
        navigate('/login');
      } else {
        toast.error('Instalação cancelada');
      }
    } catch (error) {
      console.error('Erro ao instalar:', error);
      toast.error('Erro ao instalar o app');
    }
  };

  return (
    <div className="min-h-screen gradient-bg flex items-center justify-center p-4">
      <div className="max-w-md w-full space-y-8 bg-[#142830] p-10 rounded-xl shadow-lg">
        <div className="text-center">
          <div className="flex justify-center">
            <Download className="h-12 w-12 text-[#A4FF43]" />
          </div>
          <h2 className="mt-6 text-3xl font-bold text-white">Instalar App</h2>
          <p className="mt-2 text-sm text-gray-400">
            Instale nosso app para uma melhor experiência
          </p>
        </div>

        <div className="space-y-4">
          <div className="bg-[#0E1A23] p-4 rounded-lg">
            <h3 className="text-lg font-medium text-white mb-2">Por que instalar?</h3>
            <ul className="space-y-2 text-gray-300 text-sm">
              <li>• Acesso rápido direto da sua tela inicial</li>
              <li>• Melhor desempenho e experiência</li>
              <li>• Funciona mesmo offline</li>
              <li>• Receba notificações importantes</li>
            </ul>
          </div>

          <button
            onClick={handleInstall}
            className="w-full btn-primary flex items-center justify-center gap-2"
          >
            <Download className="h-5 w-5" />
            <span>Instalar Agora</span>
          </button>

          <button
            onClick={() => navigate('/login')}
            className="w-full flex items-center justify-center gap-2 text-gray-400 hover:text-white"
          >
            <ArrowLeft className="h-5 w-5" />
            <span>Voltar para o Login</span>
          </button>
        </div>
      </div>
    </div>
  );
}
