import { useState } from 'react';
import { Lock, Settings2, Upload, Palette } from 'lucide-react';
import { toast } from 'react-hot-toast';

interface SystemSettings {
  maxRequestSize: number;
  allowedFileTypes: string[];
  defaultPriority: string;
}

export default function Settings() {
  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const [systemSettings, setSystemSettings] = useState<SystemSettings>({
    maxRequestSize: 10,
    allowedFileTypes: ['.png', '.jpg', '.jpeg'],
    defaultPriority: 'normal'
  });

  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSystemSettingChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setSystemSettings(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFileTypesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const types = e.target.value.split(',').map(type => type.trim());
    setSystemSettings(prev => ({
      ...prev,
      allowedFileTypes: types
    }));
  };

  const handleChangePassword = async () => {
    if (formData.newPassword !== formData.confirmPassword) {
      toast.error('As senhas não coincidem');
      return;
    }

    try {
      toast.success('Senha alterada com sucesso!');
      setIsChangePasswordOpen(false);
      setFormData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
    } catch (error) {
      toast.error('Erro ao alterar a senha');
    }
  };

  const handleSaveSystemSettings = () => {
    try {
      // Aqui implementaria a lógica para salvar as configurações no backend
      toast.success('Configurações do sistema atualizadas com sucesso!');
    } catch (error) {
      toast.error('Erro ao salvar as configurações do sistema');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-white">Configurações</h1>
      </div>
      
      <div className="space-y-4">
        {/* Configurações do Sistema */}
        <div className="bg-[#16162a] p-6 rounded-lg border border-gray-700">
          <div className="flex items-center gap-2 mb-4">
            <Settings2 className="h-5 w-5 text-[#2563eb]" />
            <h2 className="text-xl font-semibold text-white">Configurações do Sistema</h2>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Tamanho Máximo de Arquivos (MB)
              </label>
              <input
                type="number"
                name="maxRequestSize"
                value={systemSettings.maxRequestSize}
                onChange={handleSystemSettingChange}
                className="w-full px-3 py-2 bg-[#1a1a2e] text-white border border-gray-700 rounded-lg focus:ring-2 focus:ring-[#2563eb] focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Tipos de Arquivo Permitidos
              </label>
              <input
                type="text"
                value={systemSettings.allowedFileTypes.join(', ')}
                onChange={handleFileTypesChange}
                placeholder=".png, .jpg, .jpeg"
                className="w-full px-3 py-2 bg-[#1a1a2e] text-white border border-gray-700 rounded-lg focus:ring-2 focus:ring-[#2563eb] focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Prioridade Padrão
              </label>
              <select
                name="defaultPriority"
                value={systemSettings.defaultPriority}
                onChange={handleSystemSettingChange}
                className="w-full px-3 py-2 bg-[#1a1a2e] text-white border border-gray-700 rounded-lg focus:ring-2 focus:ring-[#2563eb] focus:border-transparent"
              >
                <option value="low">Baixa</option>
                <option value="normal">Normal</option>
                <option value="high">Alta</option>
              </select>
            </div>
            <button
              onClick={handleSaveSystemSettings}
              className="w-full px-4 py-2 bg-[#2563eb] text-white rounded-lg hover:bg-[#3b82f6] transition-colors"
            >
              Salvar Configurações do Sistema
            </button>
          </div>
        </div>

        {/* Segurança */}
        <div className="bg-[#16162a] p-6 rounded-lg border border-gray-700">
          <div className="flex items-center gap-2 mb-4">
            <Lock className="h-5 w-5 text-[#2563eb]" />
            <h2 className="text-xl font-semibold text-white">Segurança</h2>
          </div>
          <div className="space-y-4">
            {isChangePasswordOpen ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300">Senha Atual</label>
                  <input
                    type="password"
                    name="currentPassword"
                    value={formData.currentPassword}
                    onChange={handleInputChange}
                    className="mt-1 block w-full px-3 py-2 bg-[#1a1a2e] text-white border border-gray-700 rounded-lg focus:ring-2 focus:ring-[#2563eb] focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300">Nova Senha</label>
                  <input
                    type="password"
                    name="newPassword"
                    value={formData.newPassword}
                    onChange={handleInputChange}
                    className="mt-1 block w-full px-3 py-2 bg-[#1a1a2e] text-white border border-gray-700 rounded-lg focus:ring-2 focus:ring-[#2563eb] focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300">Confirmar Nova Senha</label>
                  <input
                    type="password"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    className="mt-1 block w-full px-3 py-2 bg-[#1a1a2e] text-white border border-gray-700 rounded-lg focus:ring-2 focus:ring-[#2563eb] focus:border-transparent"
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handleChangePassword}
                    className="px-4 py-2 bg-[#2563eb] text-white rounded-lg hover:bg-[#3b82f6] transition-colors"
                  >
                    Alterar Senha
                  </button>
                  <button
                    onClick={() => {
                      setIsChangePasswordOpen(false);
                      setFormData({
                        currentPassword: '',
                        newPassword: '',
                        confirmPassword: ''
                      });
                    }}
                    className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setIsChangePasswordOpen(true)}
                className="px-4 py-2 bg-[#2563eb] text-white rounded-lg hover:bg-[#3b82f6] transition-colors"
              >
                Alterar Senha
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}