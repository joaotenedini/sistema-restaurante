import React, { useState } from 'react';
import { MenuItem, OrderItem } from '../types';
import { NewOrder } from './NewOrder';
import { TableReservation } from './TableReservation';
import { LogOut, UtensilsCrossed, Calendar } from 'lucide-react';

interface WaiterDashboardProps {
  menuItems: MenuItem[];
  onCreateOrder: (tableNumber: string, items: OrderItem[]) => void;
  onLogout: () => void;
}

export function WaiterDashboard({ menuItems, onCreateOrder, onLogout }: WaiterDashboardProps) {
  const [showReservationModal, setShowReservationModal] = useState(false);

  const handleNewOrder = (tableNumber: string, items: OrderItem[]) => {
    // Calcular 10% do garçom
    const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const serviceFee = subtotal * 0.1; // 10% de taxa de serviço

    // Criar pedido com taxa de serviço
    onCreateOrder(tableNumber, items);
    // Show success message
    alert('Pedido criado com sucesso!');
  };

  return (
    <>
      <header className="bg-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <UtensilsCrossed className="h-8 w-8 text-blue-600" />
              <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                Painel do Garçom
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setShowReservationModal(true)}
                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
              >
                <Calendar className="h-5 w-5 mr-2" />
                Nova Reserva
              </button>
              <button
                onClick={onLogout}
                className="flex items-center px-4 py-2 text-gray-600 hover:text-gray-900 transition-colors duration-200"
              >
                <LogOut className="h-5 w-5 mr-2" />
                Sair
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="bg-white rounded-xl shadow-xl p-8">
          <NewOrder
            menuItems={menuItems}
            onSubmit={handleNewOrder}
          />
        </div>
      </main>

      {showReservationModal && (
        <TableReservation onClose={() => setShowReservationModal(false)} />
      )}
    </>
  );
}