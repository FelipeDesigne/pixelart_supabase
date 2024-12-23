import { useEffect, useState } from 'react';
import { Download } from 'lucide-react';

export default function InstallPage() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  useEffect(() => {
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    });
  }, []);

  const handleInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setDeferredPrompt(null);
      }
    }
  };

  if (!deferredPrompt) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <button
        onClick={handleInstall}
        className="flex items-center px-4 py-2 bg-[#2563eb] text-white rounded-lg hover:bg-[#3b82f6] transition-colors shadow-lg"
      >
        <Download className="w-5 h-5 mr-2" />
        Instalar App
      </button>
    </div>
  );
}
