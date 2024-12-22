import { useEffect } from 'react';
import { Download, ArrowLeft, Share2, MoreVertical } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { usePWA } from '../contexts/PWAContext';
import { toast } from 'react-hot-toast';

export default function InstallApp() {
  const navigate = useNavigate();
  const { deferredPrompt, setDeferredPrompt, isStandalone } = usePWA();

  // Detecta o navegador
  const getBrowser = () => {
    const userAgent = navigator.userAgent.toLowerCase();
    if (userAgent.includes('chrome')) return 'chrome';
    if (userAgent.includes('firefox')) return 'firefox';
    if (userAgent.includes('safari') && !userAgent.includes('chrome')) return 'safari';
    if (userAgent.includes('edge')) return 'edge';
    if (userAgent.includes('opera')) return 'opera';
    return 'other';
  };

  useEffect(() => {
    // Se já estiver instalado, redireciona
    if (isStandalone) {
      toast.success('App já está instalado!');
      navigate('/login');
    }
  }, [isStandalone, navigate]);

  const showBrowserInstructions = () => {
    const browser = getBrowser();
    const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent.toLowerCase());

    switch (browser) {
      case 'chrome':
        if (isIOS) {
          toast.success('No Chrome iOS:\n1. Toque no menu (⋮)\n2. Toque em "Adicionar à tela inicial"', { duration: 6000 });
        } else {
          toast.success('No Chrome:\n1. Clique no menu (⋮)\n2. Clique em "Instalar Pixel Art..."', { duration: 6000 });
        }
        break;
      case 'safari':
        toast.success('No Safari:\n1. Toque no botão compartilhar (□↑)\n2. Role para baixo\n3. Toque em "Adicionar à Tela Inicial"', { duration: 6000 });
        break;
      case 'firefox':
        toast.success('No Firefox:\n1. Clique no menu (≡)\n2. Clique em "Instalar aplicativo"', { duration: 6000 });
        break;
      case 'edge':
        toast.success('No Edge:\n1. Clique no menu (...)\n2. Clique em "Aplicativos"\n3. Clique em "Instalar este site como aplicativo"', { duration: 6000 });
        break;
      case 'opera':
        toast.success('No Opera:\n1. Clique no menu\n2. Clique em "Ir para página do aplicativo"\n3. Clique em "Instalar"', { duration: 6000 });
        break;
      default:
        toast.success('Procure a opção "Adicionar à tela inicial" ou "Instalar" no menu do seu navegador', { duration: 6000 });
    }
  };

  const handleInstall = async () => {
    // Para Android (Chrome) com prompt disponível
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
        showBrowserInstructions();
      }
      return;
    }

    // Para outros casos, mostra instruções específicas
    showBrowserInstructions();
  };

  const browser = getBrowser();
  const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent.toLowerCase());

  return (
    <div className="min-h-screen gradient-bg flex items-center justify-center p-4">
      <div className="max-w-md w-full space-y-8 bg-[#142830] p-10 rounded-xl shadow-lg">
        <div className="text-center">
          <div className="flex justify-center">
            {browser === 'safari' ? (
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
            {browser === 'safari' ? (
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
