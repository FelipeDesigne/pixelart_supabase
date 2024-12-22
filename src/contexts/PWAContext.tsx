import React, { createContext, useContext, useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

interface PWAContextType {
  deferredPrompt: BeforeInstallPromptEvent | null;
  setDeferredPrompt: React.Dispatch<React.SetStateAction<BeforeInstallPromptEvent | null>>;
  isStandalone: boolean;
  isInstallable: boolean;
}

const PWAContext = createContext<PWAContextType | undefined>(undefined);

export function PWAProvider({ children }: { children: React.ReactNode }) {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isStandalone, setIsStandalone] = useState(false);
  const [isInstallable, setIsInstallable] = useState(false);

  useEffect(() => {
    // Verifica se já está instalado
    const checkStandalone = () => {
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches ||
                          (window.navigator as any).standalone ||
                          document.referrer.includes('android-app://');
      
      setIsStandalone(isStandalone);
      console.log('[PWA] Is Standalone:', isStandalone);
    };

    // Monitora mudanças no modo de exibição
    const displayModeQuery = window.matchMedia('(display-mode: standalone)');
    displayModeQuery.addListener(checkStandalone);
    
    // Captura o evento beforeinstallprompt
    const handleBeforeInstallPrompt = (e: Event) => {
      console.log('[PWA] Before Install Prompt Event triggered');
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setIsInstallable(true);
    };

    // Registra o service worker manualmente
    const registerServiceWorker = async () => {
      if ('serviceWorker' in navigator) {
        try {
          const registration = await navigator.serviceWorker.register('/sw.js', {
            scope: '/'
          });
          console.log('[PWA] Service Worker registered:', registration);
          
          // Monitora atualizações
          registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing;
            if (newWorker) {
              newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  toast.success('Nova versão disponível! Recarregue a página.', {
                    duration: 5000,
                    icon: '🔄'
                  });
                }
              });
            }
          });
        } catch (error) {
          console.error('[PWA] Service Worker registration failed:', error);
        }
      }
    };

    // Inicializa
    checkStandalone();
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', () => {
      console.log('[PWA] App installed');
      setIsStandalone(true);
      setDeferredPrompt(null);
    });

    // Registra o service worker
    registerServiceWorker();

    return () => {
      displayModeQuery.removeListener(checkStandalone);
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  return (
    <PWAContext.Provider value={{ deferredPrompt, setDeferredPrompt, isStandalone, isInstallable }}>
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
