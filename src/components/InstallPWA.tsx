import { useState, useEffect } from 'react';
import { Download } from 'lucide-react';

export default function InstallPWA() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstallButton, setShowInstallButton] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // Verifica se já está instalado
    const checkStandalone = () => {
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches
        || (window.navigator as any).standalone
        || document.referrer.includes('android-app://');
      setIsStandalone(isStandalone);
      return isStandalone;
    };

    // Atualiza quando o status standalone muda
    const mediaQuery = window.matchMedia('(display-mode: standalone)');
    const handleChange = () => checkStandalone();
    mediaQuery.addListener(handleChange);

    // Captura o evento beforeinstallprompt
    const handler = (e: Event) => {
      console.log('beforeinstallprompt event captured');
      e.preventDefault();
      setDeferredPrompt(e);
      setShowInstallButton(true);
    };

    if (!checkStandalone()) {
      window.addEventListener('beforeinstallprompt', handler);
      // Força a exibição do botão em dispositivos móveis
      const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
      if (isMobile) {
        setShowInstallButton(true);
      }
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
      mediaQuery.removeListener(handleChange);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      console.log('Prompting install...');
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      console.log(`User choice: ${outcome}`);
      if (outcome === 'accepted') {
        setShowInstallButton(false);
      }
      setDeferredPrompt(null);
    } else {
      // Fallback para quando o deferredPrompt não está disponível
      console.log('No deferred prompt, showing manual instructions');
      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
      if (isIOS) {
        alert('Para instalar o app:\n1. Toque no botão compartilhar\n2. Role para baixo e toque em "Adicionar à Tela Inicial"');
      } else {
        alert('Para instalar o app:\n1. Abra o menu do navegador (três pontos)\n2. Toque em "Instalar aplicativo" ou "Adicionar à tela inicial"');
      }
    }
  };

  if (isStandalone || !showInstallButton) return null;

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
