import React, { useState } from 'react';
import { UserRole } from '../types';
import { UserCircle2, DollarSign, UtensilsCrossed, ChefHat, Package } from 'lucide-react';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';

interface LoginProps {
  onLogin: (roles: string[]) => void;
}

export function Login({ onLogin }: LoginProps) {
  const [numericId, setNumericId] = useState('');
  const [pin, setPin] = useState('');
  const [loading, setLoading] = useState(false);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: userData, error } = await supabase
        .from('users')
        .select('*')
        .eq('numeric_id', parseInt(numericId))
        .single();

      if (error) throw error;

      if (!userData || userData.pin !== pin) {
        throw new Error('ID ou PIN inválidos');
      }

      // Split roles string into array
      const roles = userData.role.split(',');
      onLogin(roles);
    } catch (error) {
      toast.error(error.message);
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
          Sistema de Restaurante
        </h1>
        <p className="text-gray-600">Digite seu ID e PIN para continuar</p>
      </div>

      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8">
        <form onSubmit={handleAuth} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              ID Numérico
            </label>
            <input
              type="number"
              value={numericId}
              onChange={(e) => setNumericId(e.target.value)}
              className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-2xl tracking-widest text-center"
              required
              maxLength={6}
              placeholder="000000"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              PIN
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
            />
          </div>

          <button
            type="submit"
            disabled={loading || !numericId || pin.length !== 4}
            className="w-full py-3 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg font-medium transition-all duration-200 hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50"
          >
            {loading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>

        <div className="mt-8 grid grid-cols-5 gap-4">
          {[
            { role: 'cashier', icon: DollarSign, label: 'Caixa' },
            { role: 'waiter', icon: UserCircle2, label: 'Garçom' },
            { role: 'kitchen', icon: ChefHat, label: 'Cozinha' },
            { role: 'stock', icon: Package, label: 'Estoque' },
          ].map(({ icon: Icon, label }) => (
            <div
              key={label}
              className="flex flex-col items-center gap-1 text-gray-500"
            >
              <Icon className="h-6 w-6" />
              <span className="text-xs">{label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}