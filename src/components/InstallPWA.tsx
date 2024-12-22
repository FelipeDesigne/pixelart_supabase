import { useState, useEffect } from 'react';
import { Download } from 'lucide-react';
import { usePWA } from '../contexts/PWAContext';

export default function InstallPWA() {
  const { deferredPrompt, setDeferredPrompt, isStandalone } = usePWA();
  const [showButton, setShowButton] = useState(false);

  useEffect(() => {
    const checkInstallable = () => {
      // Verifica se é um dispositivo móvel
      const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
      
      // Verifica se já está instalado
      const isInstalled = window.matchMedia('(display-mode: standalone)').matches ||
                         (window.navigator as any).standalone ||
                         document.referrer.includes('android-app://');

      // Se for móvel e não estiver instalado, mostra o botão
      if (isMobile && !isInstalled) {
        console.log('[PWA] Mobile device detected, showing install button');
        setShowButton(true);
      }
    };

    // Verifica imediatamente e após um pequeno delay
    checkInstallable();
    const timer = setTimeout(checkInstallable, 2000);

    // Captura o evento beforeinstallprompt
    const handleBeforeInstallPrompt = (e: Event) => {
      console.log('[PWA] beforeinstallprompt event captured');
      e.preventDefault();
      setDeferredPrompt(e as any);
      setShowButton(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      clearTimeout(timer);
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, [setDeferredPrompt]);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      console.log('[PWA] Using native install prompt');
      try {
        await deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        console.log(`[PWA] User choice: ${outcome}`);
        if (outcome === 'accepted') {
          setShowButton(false);
        }
      } catch (error) {
        console.error('[PWA] Error prompting install:', error);
      }
      setDeferredPrompt(null);
    }
  };

  if (isStandalone || !showButton) return null;

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
