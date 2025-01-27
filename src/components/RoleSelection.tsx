import React from 'react';
import { UserRole } from '../types';
import { UserCircle2, DollarSign, UtensilsCrossed, ChefHat, Package } from 'lucide-react';

interface RoleSelectionProps {
  roles: string[];
  onSelectRole: (role: UserRole) => void;
  onLogout: () => void;
}

export function RoleSelection({ roles, onSelectRole, onLogout }: RoleSelectionProps) {
  const roleIcons = {
    admin: UtensilsCrossed,
    manager: UserCircle2,
    cashier: DollarSign,
    waiter: UserCircle2,
    kitchen: ChefHat,
    stock: Package,
  };

  const roleLabels = {
    admin: 'Administrador',
    manager: 'Gerente',
    cashier: 'Caixa',
    waiter: 'Garçom',
    kitchen: 'Cozinha',
    stock: 'Estoque',
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex flex-col items-center justify-center p-4">
      <div className="text-center mb-8">
        <div className="flex justify-center mb-4">
          <UtensilsCrossed className="h-16 w-16 text-blue-600" />
        </div>
        <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-2">
          Selecione sua Função
        </h1>
        <p className="text-gray-600">Escolha qual área você deseja acessar</p>
      </div>

      <div className="w-full max-w-2xl bg-white rounded-2xl shadow-xl p-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {roles.map((role) => {
            const Icon = roleIcons[role as keyof typeof roleIcons];
            const label = roleLabels[role as keyof typeof roleLabels] || role;
            
            return (
              <button
                key={role}
                onClick={() => onSelectRole(role as UserRole)}
                className="flex items-center p-6 bg-white border-2 border-gray-200 rounded-xl hover:border-blue-500 hover:bg-blue-50 transition-all duration-200"
              >
                {Icon && <Icon className="h-8 w-8 text-blue-600 mr-4" />}
                <div className="text-left">
                  <h3 className="text-lg font-semibold text-gray-900">
                    {label}
                  </h3>
                  <p className="text-sm text-gray-500">
                    Acessar painel de {label.toLowerCase()}
                  </p>
                </div>
              </button>
            );
          })}
        </div>

        <div className="mt-8 pt-6 border-t border-gray-200">
          <button
            onClick={onLogout}
            className="w-full py-3 px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition-colors duration-200"
          >
            Sair
          </button>
        </div>
      </div>
    </div>
  );
}