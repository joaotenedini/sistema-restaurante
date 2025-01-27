import React, { useState } from 'react';
import { UtensilsCrossed } from 'lucide-react';
import toast from 'react-hot-toast';
import { checkAdminPin } from '../lib/supabase';

interface AdminLoginProps {
  onLogin: () => void;
}

export function AdminLogin({ onLogin }: AdminLoginProps) {
  const [pin, setPin] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const isValid = await checkAdminPin(pin);
      
      if (isValid) {
        onLogin();
      } else {
        toast.error('PIN de administrador inválido');
        setPin('');
      }
    } catch (error) {
      toast.error('Erro ao validar PIN');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex flex-col items-center justify-center p-4">
      <div className="text-center mb-8">
        <div className="flex justify-center mb-4">
          <UtensilsCrossed className="h-16 w-16 text-blue-600" />
        </div>
        <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-2">
          Acesso Administrativo
        </h1>
        <p className="text-gray-600">Digite o PIN de administrador para continuar</p>
      </div>

      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              PIN Administrativo
            </label>
            <input
              type="password"
              value={pin}
              onChange={(e) => {
                if (e.target.value.length <= 4 && /^\d*$/.test(e.target.value)) {
                  setPin(e.target.value);
                }
              }}
              className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-2xl tracking-widest text-center"
              required
              maxLength={4}
              placeholder="****"
              disabled={loading}
            />
          </div>

          <button
            type="submit"
            disabled={pin.length !== 4 || loading}
            className="w-full py-3 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg font-medium transition-all duration-200 hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50"
          >
            {loading ? 'Verificando...' : 'Entrar'}
          </button>
        </form>
      </div>
    </div>
  );
}