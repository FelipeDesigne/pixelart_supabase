import React, { createContext, useContext, useState, useEffect } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

interface PWAContextType {
  deferredPrompt: BeforeInstallPromptEvent | null;
  setDeferredPrompt: (prompt: BeforeInstallPromptEvent | null) => void;
  isInstallable: boolean;
  isStandalone: boolean;
}

const PWAContext = createContext<PWAContextType | undefined>(undefined);

declare global {
  interface WindowEventMap {
    beforeinstallprompt: BeforeInstallPromptEvent;
  }
}

export function PWAProvider({ children }: { children: React.ReactNode }) {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // Verifica se já está instalado
    const checkStandalone = () => {
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches ||
                          (window.navigator as any).standalone ||
                          document.referrer.includes('android-app://');
      setIsStandalone(isStandalone);
      console.log('App está instalado:', isStandalone);
    };

    // Verifica se pode ser instalado
    const checkInstallable = () => {
      const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent.toLowerCase());
      const isSafari = /safari/i.test(navigator.userAgent) && !/chrome|android/i.test(navigator.userAgent);
      const canInstall = !isStandalone && (deferredPrompt !== null || (isIOS && isSafari));
      setIsInstallable(canInstall);
      console.log('App pode ser instalado:', canInstall);
    };

    // Captura o evento de instalação
    const handler = (e: BeforeInstallPromptEvent) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsInstallable(true);
      console.log('Evento beforeinstallprompt capturado');
    };

    // Monitora mudanças no modo de exibição
    const mediaQuery = window.matchMedia('(display-mode: standalone)');
    const handleDisplayModeChange = (e: MediaQueryListEvent) => {
      setIsStandalone(e.matches);
      console.log('Modo de exibição mudou para:', e.matches ? 'standalone' : 'browser');
    };

    // Registra os listeners
    window.addEventListener('beforeinstallprompt', handler);
    mediaQuery.addEventListener('change', handleDisplayModeChange);
    window.addEventListener('appinstalled', () => {
      setDeferredPrompt(null);
      setIsInstallable(false);
      setIsStandalone(true);
      console.log('App instalado com sucesso!');
    });

    // Faz as verificações iniciais
    checkStandalone();
    checkInstallable();

    // Limpa os listeners
    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
      mediaQuery.removeEventListener('change', handleDisplayModeChange);
    };
  }, [deferredPrompt]);

  return (
    <PWAContext.Provider value={{ deferredPrompt, setDeferredPrompt, isInstallable, isStandalone }}>
      {children}
    </PWAContext.Provider>
  );
}

export function usePWA() {
  const context = useContext(PWAContext);
  if (context === undefined) {
    throw new Error('usePWA must be used within a PWAProvider');
  }
  return context;
}
