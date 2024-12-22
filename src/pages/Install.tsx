import { useState, useEffect } from 'react';
import { Download } from 'lucide-react';

declare global {
  interface Window {
    deferredPrompt: any;
  }
}

export default function Install() {
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // Verifica se já está instalado
    const checkStandalone = () => {
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches
        || (window.navigator as any).standalone;
      setIsStandalone(isStandalone);
    };

    checkStandalone();

    // Força a exibição do prompt de instalação
    if ('getInstalledRelatedApps' in navigator) {
      (navigator as any).getInstalledRelatedApps()
        .then((apps: any[]) => {
          if (apps.length === 0) {
            console.log('App não está instalado');
          }
        });
    }
  }, []);

  const handleInstall = async () => {
    try {
      if (window.deferredPrompt) {
        console.log('Usando prompt nativo');
        await window.deferredPrompt.prompt();
        const { outcome } = await window.deferredPrompt.userChoice;
        console.log(`User choice: ${outcome}`);
        window.deferredPrompt = null;
        return;
      }

      // Se não tiver o prompt, tenta outras abordagens
      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
      const isAndroid = /Android/.test(navigator.userAgent);
      const isMobile = isIOS || isAndroid;

      if (isMobile) {
        if ('standalone' in window.navigator && !(window.navigator as any).standalone) {
          // iOS usando Add to Home Screen
          const manifestLink = document.createElement('link');
          manifestLink.rel = 'manifest';
          manifestLink.href = '/manifest.json';
          document.head.appendChild(manifestLink);
          
          alert('Para instalar no iOS:\n1. Toque no botão compartilhar\n2. Role para baixo e toque em "Adicionar à Tela Inicial"');
          return;
        }

        if (isAndroid) {
          // Android usando TWA
          const manifestLink = document.createElement('link');
          manifestLink.rel = 'manifest';
          manifestLink.href = '/manifest.json';
          document.head.appendChild(manifestLink);

          // Força a atualização do service worker
          if ('serviceWorker' in navigator) {
            const registration = await navigator.serviceWorker.register('/sw.js');
            console.log('Service Worker registrado:', registration);
          }
        }
      }

      // Se chegou aqui, mostra instruções manuais
      const message = isIOS 
        ? 'Para instalar:\n1. Toque no botão compartilhar\n2. Role para baixo e toque em "Adicionar à Tela Inicial"'
        : 'Para instalar:\n1. Abra o menu do navegador (três pontos)\n2. Toque em "Instalar aplicativo"';
      
      alert(message);
    } catch (error) {
      console.error('Erro ao instalar:', error);
      alert('Não foi possível instalar automaticamente. Por favor, use as opções do navegador para instalar o app.');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary/20 to-background flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-6 space-y-8">
        <div className="text-center space-y-4">
          <h1 className="text-3xl font-bold text-primary">Pixel Art</h1>
          <p className="text-gray-600">
            Instale nosso app para uma melhor experiência
          </p>
        </div>

        {/* Espaço para seu QR Code */}
        <div className="flex justify-center p-4">
          {/* Adicione seu QR Code aqui */}
        </div>

        {!isStandalone && (
          <button
            onClick={handleInstall}
            className="w-full bg-primary hover:bg-primary/90 text-white py-4 px-6 rounded-xl flex items-center justify-center space-x-2 transition-colors"
          >
            <Download className="w-6 h-6" />
            <span className="text-lg font-semibold">Instalar App</span>
          </button>
        )}

        {isStandalone && (
          <div className="text-center text-green-600 font-medium">
            App já está instalado! ✨
          </div>
        )}
      </div>
    </div>
  );
}
