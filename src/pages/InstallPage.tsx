import { useEffect, useState } from 'react';

export default function InstallPage() {
    const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
    const [isStandalone, setIsStandalone] = useState(false);

    useEffect(() => {
        // Verifica se já está instalado
        const checkStandalone = () => {
            const isStandalone = window.matchMedia('(display-mode: standalone)').matches
                || (window.navigator as any).standalone;
            setIsStandalone(isStandalone);
        };

        checkStandalone();

        // Captura evento de instalação
        const handler = (e: Event) => {
            console.log('beforeinstallprompt captured');
            e.preventDefault();
            setDeferredPrompt(e);
        };

        window.addEventListener('beforeinstallprompt', handler);

        return () => window.removeEventListener('beforeinstallprompt', handler);
    }, []);

    const handleInstall = async () => {
        try {
            if (deferredPrompt) {
                console.log('Using native prompt');
                await deferredPrompt.prompt();
                const { outcome } = await deferredPrompt.userChoice;
                console.log(`User choice: ${outcome}`);
                setDeferredPrompt(null);
                return;
            }

            // Fallback para diferentes plataformas
            const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
            const isAndroid = /Android/.test(navigator.userAgent);
            const isMobile = isIOS || isAndroid;

            if (isMobile) {
                if ('standalone' in window.navigator && !(window.navigator as any).standalone) {
                    alert('Para instalar no iOS:\n1. Toque no botão compartilhar\n2. Role para baixo e toque em "Adicionar à Tela Inicial"');
                    return;
                }

                if (isAndroid) {
                    // Força registro do service worker
                    if ('serviceWorker' in navigator) {
                        const registration = await navigator.serviceWorker.register('/sw.js');
                        console.log('Service Worker registered:', registration);
                    }
                }
            }

            // Instruções manuais
            const message = isIOS 
                ? 'Para instalar:\n1. Toque no botão compartilhar\n2. Role para baixo e toque em "Adicionar à Tela Inicial"'
                : 'Para instalar:\n1. Abra o menu do navegador (três pontos)\n2. Toque em "Instalar aplicativo"';
            
            alert(message);
        } catch (error) {
            console.error('Installation error:', error);
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

                {/* Espaço para QR Code */}
                <div className="flex justify-center p-4 bg-gray-100 rounded-xl">
                    <div className="text-gray-600">Espaço para QR Code</div>
                </div>

                {!isStandalone && (
                    <button
                        onClick={handleInstall}
                        className="w-full bg-primary hover:bg-primary/90 text-white py-4 px-6 rounded-xl flex items-center justify-center space-x-2 transition-colors"
                    >
                        <svg 
                            xmlns="http://www.w3.org/2000/svg" 
                            className="h-6 w-6" 
                            fill="none" 
                            viewBox="0 0 24 24" 
                            stroke="currentColor"
                        >
                            <path 
                                strokeLinecap="round" 
                                strokeLinejoin="round" 
                                strokeWidth={2} 
                                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" 
                            />
                        </svg>
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
