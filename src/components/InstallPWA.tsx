import { useState, useEffect } from 'react';
import { Download } from 'lucide-react';
import { usePWA } from '../contexts/PWAContext';
import { toast } from 'react-hot-toast';

export default function InstallPWA() {
  const { deferredPrompt, setDeferredPrompt, isStandalone, isInstallable } = usePWA();
  const [showButton, setShowButton] = useState(false);

  useEffect(() => {
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    setShowButton(isMobile && isInstallable && !isStandalone);
  }, [isInstallable, isStandalone]);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      try {
        console.log('[PWA] Prompting install...');
        await deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        console.log(`[PWA] User choice: ${outcome}`);
        
        if (outcome === 'accepted') {
          toast.success('App instalado com sucesso!', {
            icon: '✅',
            duration: 3000
          });
        }
        
        setDeferredPrompt(null);
      } catch (error) {
        console.error('[PWA] Installation error:', error);
        toast.error('Erro ao instalar o app. Tente novamente.', {
          icon: '❌',
          duration: 3000
        });
      }
    }
  };

  if (!showButton) return null;

  return (
    <button
      onClick={handleInstallClick}
      className="fixed bottom-4 right-4 bg-primary hover:bg-primary/90 text-white px-4 py-2 rounded-lg shadow-lg transition-colors flex items-center gap-2 z-50"
      aria-label="Instalar aplicativo"
    >
      <Download className="w-5 h-5" />
      <span>Instalar App</span>
    </button>
  );
}
