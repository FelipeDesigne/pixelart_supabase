import { useEffect } from 'react';
import { Download, ArrowLeft, Share2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { usePWA } from '../contexts/PWAContext';
import { toast } from 'react-hot-toast';

export default function InstallApp() {
  const navigate = useNavigate();
  const { deferredPrompt, setDeferredPrompt, isStandalone } = usePWA();

  useEffect(() => {
    // Se já estiver instalado, redireciona
    if (isStandalone) {
      toast.success('App já está instalado!');
      navigate('/login');
    }
  }, [isStandalone, navigate]);

  const handleInstall = async () => {
    // Para Android (Chrome)
    if (deferredPrompt) {
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
      return;
    }

    // Para iOS (Safari)
    const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent.toLowerCase());
    const isSafari = /safari/i.test(navigator.userAgent) && !/chrome|android/i.test(navigator.userAgent);

    if (isIOS && isSafari) {
      toast.success('Para instalar no iOS:\n1. Toque no botão compartilhar\n2. Role para baixo\n3. Toque em "Adicionar à Tela Inicial"', {
        duration: 6000,
        style: {
          maxWidth: '500px'
        }
      });
      return;
    }

    // Tenta forçar o prompt de instalação
    try {
      // @ts-ignore
      window.location.href = window.location.href + '?mode=standalone';
      setTimeout(() => {
        toast.success('Verifique o menu do seu navegador para instalar o app', {
          duration: 4000
        });
      }, 1000);
    } catch (error) {
      console.error('Erro ao tentar instalar:', error);
      toast.error('Não foi possível iniciar a instalação');
    }
  };

  const isIOSSafari = /iphone|ipad|ipod/i.test(navigator.userAgent.toLowerCase()) && 
                     /safari/i.test(navigator.userAgent) && 
                     !/chrome|android/i.test(navigator.userAgent);

  return (
    <div className="min-h-screen gradient-bg flex items-center justify-center p-4">
      <div className="max-w-md w-full space-y-8 bg-[#142830] p-10 rounded-xl shadow-lg">
        <div className="text-center">
          <div className="flex justify-center">
            {isIOSSafari ? (
              <Share2 className="h-12 w-12 text-[#A4FF43]" />
            ) : (
              <Download className="h-12 w-12 text-[#A4FF43]" />
            )}
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
            {isIOSSafari ? (
              <>
                <Share2 className="h-5 w-5" />
                <span>Compartilhar para Instalar</span>
              </>
            ) : (
              <>
                <Download className="h-5 w-5" />
                <span>Instalar Agora</span>
              </>
            )}
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
