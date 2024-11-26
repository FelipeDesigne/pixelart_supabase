import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'react-hot-toast';
import { Loader2, Palette, Lock, MessageCircle } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showRecoveryModal, setShowRecoveryModal] = useState(false);
  const { signIn } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const isAdmin = await signIn(email, password);
      navigate(isAdmin ? '/admin' : '/user', { replace: true });
    } catch (error: any) {
      console.error('Error signing in:', error);
      toast.error(error.message || 'Erro ao fazer login');
    } finally {
      setLoading(false);
    }
  };

  const handleWhatsAppClick = () => {
    // Add your WhatsApp click handler logic here
  };

  return (
    <div className="min-h-screen gradient-bg flex items-center justify-center p-4">
      <div className="max-w-md w-full space-y-8 bg-[#142830] p-10 rounded-xl shadow-lg">
        <div className="text-center">
          <div className="flex justify-center">
            <Palette className="h-12 w-12 text-[#A4FF43]" />
          </div>
          <h2 className="mt-6 text-3xl font-bold text-white">Gerenciamento de Pixel Art</h2>
          <p className="mt-2 text-sm text-gray-400">Entre na sua conta</p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-300">
                Endereço de Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 block w-full px-3 py-2 bg-[#0E1A23] border border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-[#A4FF43] focus:border-[#A4FF43] text-white"
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-300">
                Senha
              </label>
              <div className="mt-1 relative">
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full px-3 py-2 bg-[#0E1A23] border border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-[#A4FF43] focus:border-[#A4FF43] text-white"
                />
                <Lock className="h-5 w-5 text-gray-400 absolute right-3 top-2.5" />
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="text-sm">
              <button
                type="button"
                onClick={() => setShowRecoveryModal(true)}
                className="font-medium text-[#A4FF43] hover:text-[#8BD030]"
              >
                Esqueceu sua senha?
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full flex justify-center"
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              'Entrar'
            )}
          </button>
        </form>

        <div className="mt-6 flex justify-center space-x-4 text-sm text-gray-400">
          <a href="#" className="hover:text-[#A4FF43]">Termos de Serviço</a>
          <span>•</span>
          <a href="#" className="hover:text-[#A4FF43]">Política de Privacidade</a>
        </div>
      </div>

      {showRecoveryModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-[#142830] rounded-lg p-6 max-w-md w-full">
            <h2 className="text-xl font-bold mb-4">Recuperação de Senha</h2>
            <div className="space-y-4">
              <p className="text-gray-300">
                Para recuperar sua senha, entre em contato com o administrador através do WhatsApp.
                O administrador irá verificar sua identidade e ajudar você a redefinir sua senha.
              </p>
              
              <button
                onClick={handleWhatsAppClick}
                className="w-full btn-primary flex items-center justify-center gap-2"
              >
                <MessageCircle className="h-5 w-5" />
                Contatar via WhatsApp
              </button>

              <div className="flex justify-end">
                <button
                  onClick={() => setShowRecoveryModal(false)}
                  className="text-gray-300 hover:text-white"
                >
                  Fechar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}