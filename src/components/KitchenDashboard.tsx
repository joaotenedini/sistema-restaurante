import React, { useState, useEffect } from 'react';
import { Order } from '../types';
import { LogOut, ChefHat, Clock, Timer, Bell, Volume2, VolumeX } from 'lucide-react';

interface KitchenDashboardProps {
  orders: Order[];
  onStatusChange: (orderId: string, status: Order['status']) => void;
  onLogout: () => void;
}

export function KitchenDashboard({ orders, onStatusChange, onLogout }: KitchenDashboardProps) {
  const [soundEnabled, setSoundEnabled] = useState(true);
  const pendingOrders = orders.filter(order => order.status === 'pending');
  const preparingOrders = orders.filter(order => order.status === 'preparing');

  const getOrderTime = (date: Date) => {
    const minutes = Math.floor((Date.now() - new Date(date).getTime()) / 60000);
    return minutes < 1 ? 'Agora' : `${minutes}min`;
  };

  const getUrgencyColor = (minutes: number) => {
    if (minutes < 5) return 'text-green-600';
    if (minutes < 10) return 'text-yellow-600';
    return 'text-red-600';
  };

  // Auto-sort orders by creation time
  const sortedPendingOrders = [...pendingOrders].sort((a, b) => 
    new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  );

  const sortedPreparingOrders = [...preparingOrders].sort((a, b) =>
    new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  );

  // Play sound when new orders arrive
  useEffect(() => {
    if (soundEnabled && pendingOrders.length > 0) {
      const audio = new Audio('/kitchen-notification.mp3');
      audio.play();
    }
  }, [pendingOrders.length, soundEnabled]);

  return (
    <>
      <header className="bg-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <ChefHat className="h-8 w-8 text-orange-600" />
              <h1 className="text-3xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
                Cozinha
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setSoundEnabled(!soundEnabled)}
                className="flex items-center px-4 py-2 text-gray-600 hover:text-gray-900 transition-colors duration-200"
              >
                {soundEnabled ? (
                  <Volume2 className="h-5 w-5" />
                ) : (
                  <VolumeX className="h-5 w-5" />
                )}
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
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Pedidos Pendentes */}
          <div>
            <div className="flex items-center space-x-2 mb-4">
              <Timer className="h-6 w-6 text-yellow-600" />
              <h2 className="text-2xl font-semibold text-gray-900">Pedidos Pendentes</h2>
              <span className="bg-yellow-100 text-yellow-800 text-sm font-medium px-2.5 py-0.5 rounded-full">
                {pendingOrders.length}
              </span>
            </div>
            <div className="space-y-4">
              {sortedPendingOrders.map(order => {
                const minutes = Math.floor((Date.now() - new Date(order.createdAt).getTime()) / 60000);
                return (
                  <div key={order.id} className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-yellow-400">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-xl font-bold text-gray-900">Mesa #{order.tableNumber}</h3>
                      <div className="flex items-center space-x-2">
                        <Clock size={16} className={getUrgencyColor(minutes)} />
                        <span className={`${getUrgencyColor(minutes)} font-medium`}>
                          {getOrderTime(order.createdAt)}
                        </span>
                      </div>
                    </div>
                    <div className="space-y-3">
                      {order.items.map((item) => (
                        <div key={`${item.id}-${item.notes}`} className="flex items-start">
                          <span className="font-bold text-lg text-gray-900 mr-2">{item.quantity}x</span>
                          <div>
                            <div className="font-medium text-gray-900">{item.name}</div>
                            {(item.notes || (item.removedItems && item.removedItems.length > 0) || item.meatPoint) && (
                              <div className="text-sm text-gray-600 mt-1">
                                {item.removedItems && item.removedItems.length > 0 && (
                                  <div className="text-red-600">Remover: {item.removedItems.join(', ')}</div>
                                )}
                                {item.meatPoint && (
                                  <div className="font-medium">Ponto: {item.meatPoint}</div>
                                )}
                                {item.notes && <div className="italic">Obs: {item.notes}</div>}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                    {order.estimatedTime && (
                      <div className="mt-4 flex items-center text-sm text-gray-600">
                        <Bell className="h-4 w-4 mr-1" />
                        <span>Tempo estimado: {order.estimatedTime} minutos</span>
                      </div>
                    )}
                    <div className="mt-4 pt-4 border-t border-gray-100">
                      <button
                        onClick={() => onStatusChange(order.id, 'preparing')}
                        className="w-full py-2 px-4 bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg font-medium transition-colors duration-200 flex items-center justify-center space-x-2"
                      >
                        <ChefHat size={20} />
                        <span>Iniciar Preparo</span>
                      </button>
                    </div>
                  </div>
                );
              })}
              {pendingOrders.length === 0 && (
                <div className="text-center py-12 bg-white rounded-xl shadow-lg">
                  <div className="text-gray-400 mb-4">
                    <Timer className="h-12 w-12 mx-auto" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900">Nenhum pedido pendente</h3>
                  <p className="mt-1 text-gray-500">Os novos pedidos aparecerão aqui</p>
                </div>
              )}
            </div>
          </div>

          {/* Pedidos em Preparo */}
          <div>
            <div className="flex items-center space-x-2 mb-4">
              <ChefHat className="h-6 w-6 text-blue-600" />
              <h2 className="text-2xl font-semibold text-gray-900">Em Preparo</h2>
              <span className="bg-blue-100 text-blue-800 text-sm font-medium px-2.5 py-0.5 rounded-full">
                {preparingOrders.length}
              </span>
            </div>
            <div className="space-y-4">
              {sortedPreparingOrders.map(order => {
                const minutes = Math.floor((Date.now() - new Date(order.createdAt).getTime()) / 60000);
                return (
                  <div key={order.id} className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-blue-400">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-xl font-bold text-gray-900">Mesa #{order.tableNumber}</h3>
                      <div className="flex items-center space-x-2">
                        <Clock size={16} className={getUrgencyColor(minutes)} />
                        <span className={`${getUrgencyColor(minutes)} font-medium`}>
                          {getOrderTime(order.createdAt)}
                        </span>
                      </div>
                    </div>
                    <div className="space-y-3">
                      {order.items.map((item) => (
                        <div key={`${item.id}-${item.notes}`} className="flex items-start">
                          <span className="font-bold text-lg text-gray-900 mr-2">{item.quantity}x</span>
                          <div>
                            <div className="font-medium text-gray-900">{item.name}</div>
                            {(item.notes || (item.removedItems && item.removedItems.length > 0) || item.meatPoint) && (
                              <div className="text-sm text-gray-600 mt-1">
                                {item.removedItems && item.removedItems.length > 0 && (
                                  <div className="text-red-600">Remover: {item.removedItems.join(', ')}</div>
                                )}
                                {item.meatPoint && (
                                  <div className="font-medium">Ponto: {item.meatPoint}</div>
                                )}
                                {item.notes && <div className="italic">Obs: {item.notes}</div>}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                    {order.estimatedTime && (
                      <div className="mt-4 flex items-center text-sm text-gray-600">
                        <Bell className="h-4 w-4 mr-1" />
                        <span>Tempo estimado: {order.estimatedTime} minutos</span>
                      </div>
                    )}
                    <div className="mt-4 pt-4 border-t border-gray-100">
                      <button
                        onClick={() => onStatusChange(order.id, 'ready')}
                        className="w-full py-2 px-4 bg-green-500 hover:bg-green-600 text-white rounded-lg font-medium transition-colors duration-200 flex items-center justify-center space-x-2"
                      >
                        <Bell size={20} />
                        <span>Marcar como Pronto</span>
                      </button>
                    </div>
                  </div>
                );
              })}
              {preparingOrders.length === 0 && (
                <div className="text-center py-12 bg-white rounded-xl shadow-lg">
                  <div className="text-gray-400 mb-4">
                    <ChefHat className="h-12 w-12 mx-auto" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900">Nenhum pedido em preparo</h3>
                  <p className="mt-1 text-gray-500">Os pedidos em preparo aparecerão aqui</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </>
  );
}