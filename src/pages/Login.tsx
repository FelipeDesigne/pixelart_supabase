import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2, MessageCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'react-hot-toast';
import LogoImage from '/Logo.png';

// Estilo para a animação do fundo
const gradientAnimation = `
  @keyframes gradientBG {
    0% {
      background-position: 0% 50%;
    }
    50% {
      background-position: 100% 50%;
    }
    100% {
      background-position: 0% 50%;
    }
  }
`;

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
      
      // Verificar se é o primeiro login
      const isFirstLogin = !localStorage.getItem('hasLoggedInBefore');
      if (isFirstLogin) {
        localStorage.setItem('hasLoggedInBefore', 'true');
        toast.success('Instale nosso app para uma melhor experiência!', {
          duration: 5000,
          icon: '📱'
        });
      }
      
      // Navegar para a última rota ou rota padrão
      const lastRoute = localStorage.getItem('lastRoute');
      navigate(lastRoute || (isAdmin ? '/admin' : '/user'), { replace: true });
    } catch (error: any) {
      console.error('Error signing in:', error);
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleWhatsAppClick = () => {
    window.open('https://wa.me/5514981181568', '_blank');
  };

  return (
    <>
      <style>{gradientAnimation}</style>
      <div className="min-h-screen flex flex-col md:flex-row">
        {/* Left side - Login Form */}
        <div className="w-full md:w-1/3 bg-[#1a1a2e] p-6 md:p-8 flex flex-col justify-center order-2 md:order-1">
          <div className="max-w-md w-full mx-auto">
            <div className="flex flex-col items-center mb-8">
              <div className="w-32 h-32 flex items-center justify-center mb-4">
                <img 
                  src={LogoImage}
                  alt="Logo" 
                  className="w-full h-full object-contain"
                />
              </div>
              <h1 className="text-2xl font-bold text-white">Pixel Art</h1>
            </div>
            <h2 className="text-3xl font-bold text-white mb-2">Login</h2>
            <p className="text-gray-300 mb-8">Bem-vindo de volta! Por favor, faça login na sua conta.</p>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-200">
                  Email
                </label>
                <div className="mt-1">
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="appearance-none block w-full px-3 py-2 border border-gray-600 rounded-md shadow-sm bg-[#16162a] text-white placeholder-gray-400 focus:outline-none focus:ring-[#2563eb] focus:border-[#2563eb]"
                    placeholder="seu@email.com"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-200">
                  Senha
                </label>
                <div className="mt-1">
                  <input
                    id="password"
                    name="password"
                    type="password"
                    autoComplete="current-password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="appearance-none block w-full px-3 py-2 border border-gray-600 rounded-md shadow-sm bg-[#16162a] text-white placeholder-gray-400 focus:outline-none focus:ring-[#2563eb] focus:border-[#2563eb]"
                    placeholder="********"
                  />
                </div>
              </div>

              <div className="text-right">
                <button
                  type="button"
                  onClick={() => setShowRecoveryModal(true)}
                  className="text-[#3b82f6] text-sm hover:text-[#60a5fa] hover:underline"
                >
                  Esqueceu sua senha?
                </button>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#2563eb] text-white p-3 rounded-lg hover:bg-[#3b82f6] transition-colors flex items-center justify-center"
              >
                {loading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  'Entrar'
                )}
              </button>
            </form>
          </div>
        </div>

        {/* Right side - Welcome Message */}
        <div 
          className="w-full md:w-2/3 p-8 flex flex-col justify-center items-center order-1 md:order-2 text-white relative overflow-hidden"
          style={{
            background: 'linear-gradient(-45deg, #0f2b63, #1e3c72, #2563eb, #3b82f6)',
            backgroundSize: '400% 400%',
            animation: 'gradientBG 15s ease infinite'
          }}
        >
          <div className="relative z-10">
            <h1 className="text-4xl md:text-5xl font-bold mb-4 drop-shadow-lg">Bem Vindo</h1>
            <p className="text-xl md:text-2xl drop-shadow-lg">
              Gerencie seus pedidos de forma simples e eficiente.
            </p>
          </div>
          
          {/* Overlay para adicionar mais profundidade */}
          <div 
            className="absolute inset-0 bg-gradient-to-br from-transparent to-black/30"
            style={{ mixBlendMode: 'multiply' }}
          ></div>
          
          {/* Padrão de fundo para adicionar textura */}
          <div 
            className="absolute inset-0" 
            style={{ 
              backgroundImage: 'radial-gradient(circle at 25px 25px, rgba(255,255,255,0.2) 2%, transparent 0%)',
              backgroundSize: '50px 50px'
            }}
          ></div>
        </div>

        {/* Modal de Recuperação de Senha */}
        {showRecoveryModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-[#1a1a2e] rounded-lg p-6 max-w-md w-full mx-4">
              <h2 className="text-xl font-bold mb-4 text-white">Recuperação de Senha</h2>
              <div className="space-y-4">
                <p className="text-gray-300">
                  Para recuperar sua senha, por favor, entre em contato com o administrador via WhatsApp.
                  O administrador verificará sua identidade e ajudará a redefinir sua senha.
                </p>
                
                <button
                  onClick={handleWhatsAppClick}
                  className="w-full bg-[#2563eb] text-white p-3 rounded hover:bg-[#3b82f6] transition-colors flex items-center justify-center gap-2"
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
    </>
  );
}