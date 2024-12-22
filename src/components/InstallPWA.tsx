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
        
        // Verifica se o app é instalável no Chrome/Edge
        const isChrome = /Chrome|Edge/.test(navigator.userAgent);
        if (isChrome) {
          // Verifica se o manifesto está presente
          const manifestLink = document.querySelector('link[rel="manifest"]');
          if (manifestLink) {
            console.log('[PWA] Manifest found, app should be installable');
          }
        }
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

    // Monitora mudanças no modo de exibição
    const displayModeQuery = window.matchMedia('(display-mode: standalone)');
    const handleDisplayModeChange = () => {
      console.log('[PWA] Display mode changed');
      checkInstallable();
    };
    displayModeQuery.addListener(handleDisplayModeChange);

    return () => {
      clearTimeout(timer);
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      displayModeQuery.removeListener(handleDisplayModeChange);
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
    } else {
      console.log('[PWA] Using manual install instructions');
      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
      if (isIOS) {
        alert('Para instalar o app:\n1. Toque no botão compartilhar (ícone com quadrado e seta para cima)\n2. Role para baixo e toque em "Adicionar à Tela Inicial"');
      } else {
        alert('Para instalar o app:\n1. Abra o menu do navegador (três pontos)\n2. Toque em "Instalar aplicativo" ou "Adicionar à tela inicial"');
      }
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
      <span className="hidden md:inline">Instalar App</span>
    </button>
  );
}
