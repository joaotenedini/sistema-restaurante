import React, { useState } from 'react';
import { Order } from '../types';
import { Clock, DollarSign, CheckCircle, CreditCard, Printer, Trash2, Split, AlertTriangle } from 'lucide-react';

interface OrderListProps {
  orders: Order[];
  onStatusChange: (orderId: string, status: Order['status']) => void;
  showPaymentControls?: boolean;
  onPaymentClick?: (order: Order) => void;
  onPrintReceipt?: (order: Order) => void;
  onSplitBill?: (order: Order) => void;
}

interface DeleteConfirmationProps {
  order: Order;
  onConfirm: () => void;
  onCancel: () => void;
}

function DeleteConfirmation({ order, onConfirm, onCancel }: DeleteConfirmationProps) {
  const [confirmText, setConfirmText] = useState('');
  const confirmationPhrase = `DELETAR ${order.tableNumber}`;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
        <div className="flex items-center space-x-2 text-red-600 mb-4">
          <AlertTriangle className="h-6 w-6" />
          <h3 className="text-xl font-semibold">Confirmar Exclusão</h3>
        </div>
        
        <p className="text-gray-600 mb-4">
          Esta ação é irreversível. O pedido da mesa #{order.tableNumber} será permanentemente excluído.
        </p>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Digite {confirmationPhrase} para confirmar:
          </label>
          <input
            type="text"
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            className="w-full p-2 border rounded-lg"
            placeholder={confirmationPhrase}
          />
        </div>

        <div className="flex justify-end space-x-3">
          <button
            onClick={onCancel}
            className="px-4 py-2 border rounded-lg hover:bg-gray-50"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            disabled={confirmText !== confirmationPhrase}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Confirmar Exclusão
          </button>
        </div>
      </div>
    </div>
  );
}

export function OrderList({
  orders,
  onStatusChange,
  showPaymentControls = false,
  onPaymentClick,
  onPrintReceipt,
  onSplitBill
}: OrderListProps) {
  const [deleteOrder, setDeleteOrder] = useState<Order | null>(null);

  const statusColors = {
    pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    preparing: 'bg-blue-100 text-blue-800 border-blue-200',
    ready: 'bg-green-100 text-green-800 border-green-200',
    delivered: 'bg-purple-100 text-purple-800 border-purple-200',
    paid: 'bg-gray-100 text-gray-800 border-gray-200',
    cancelled: 'bg-red-100 text-red-800 border-red-200',
  };

  const statusLabels = {
    pending: 'Pendente',
    preparing: 'Preparando',
    ready: 'Pronto',
    delivered: 'Entregue',
    paid: 'Pago',
    cancelled: 'Cancelado',
  };

  const handleDeleteOrder = (order: Order) => {
    setDeleteOrder(order);
  };

  const confirmDelete = () => {
    if (deleteOrder) {
      onStatusChange(deleteOrder.id, 'cancelled');
      setDeleteOrder(null);
    }
  };

  return (
    <div className="space-y-6">
      {orders.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-gray-400 mb-4">
            <CheckCircle className="h-12 w-12 mx-auto" />
          </div>
          <h3 className="text-lg font-medium text-gray-900">Nenhum pedido ainda</h3>
          <p className="mt-1 text-gray-500">Os pedidos aparecerão aqui quando forem criados.</p>
        </div>
      ) : (
        orders.map((order) => (
          <div key={order.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden transition-all duration-200 hover:shadow-md">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold text-gray-900">
                  Mesa #{order.tableNumber}
                </h3>
                <div className="flex items-center space-x-3">
                  {order.paymentMethod && (
                    <span className="text-sm text-gray-600">
                      {order.paymentMethod === 'credit' && 'Cartão de Crédito'}
                      {order.paymentMethod === 'debit' && 'Cartão de Débito'}
                      {order.paymentMethod === 'pix' && 'PIX'}
                      {order.paymentMethod === 'cash' && 'Dinheiro'}
                      {order.paymentMethod === 'meal-ticket' && 'Vale Refeição'}
                    </span>
                  )}
                  <span className={`status-badge border ${statusColors[order.status]}`}>
                    {statusLabels[order.status]}
                  </span>
                </div>
              </div>
              
              <div className="space-y-2">
                {order.items.map((item) => (
                  <div key={`${item.id}-${item.notes}-${item.meatPoint}`} className="flex justify-between items-start py-2">
                    <div className="flex-1">
                      <div className="flex items-center">
                        <span className="font-medium">{item.quantity}x</span>
                        <span className="ml-2">{item.name}</span>
                      </div>
                      {(item.notes || item.meatPoint || (item.removedItems && item.removedItems.length > 0)) && (
                        <div className="text-sm text-gray-500 mt-1 ml-6">
                          {item.removedItems && item.removedItems.length > 0 && (
                            <div>Remover: {item.removedItems.join(', ')}</div>
                          )}
                          {item.meatPoint && (
                            <div>Ponto: {item.meatPoint}</div>
                          )}
                          {item.notes && <div>Obs: {item.notes}</div>}
                        </div>
                      )}
                    </div>
                    <span className="text-gray-600">R$ {(item.price * item.quantity).toFixed(2)}</span>
                  </div>
                ))}
              </div>
              
              <div className="mt-6 pt-4 border-t border-gray-100">
                <div className="flex flex-wrap gap-4 justify-between items-center">
                  <div className="flex items-center text-gray-600">
                    <Clock size={16} className="mr-1" />
                    <span>{new Date(order.createdAt).toLocaleTimeString()}</span>
                  </div>
                  <div className="flex items-center text-lg font-semibold text-gray-900">
                    <DollarSign size={20} className="text-green-600" />
                    <span>R$ {order.total.toFixed(2)}</span>
                  </div>
                </div>
                {order.change !== undefined && (
                  <div className="mt-2 text-sm text-gray-600">
                    Troco: R$ {order.change.toFixed(2)}
                  </div>
                )}
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                {showPaymentControls && order.status === 'delivered' && (
                  <>
                    <button
                      onClick={() => onPaymentClick?.(order)}
                      className="flex-1 flex items-center justify-center gap-2 py-2 px-4 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors duration-200"
                    >
                      <CreditCard size={20} />
                      Pagamento
                    </button>
                    <button
                      onClick={() => onSplitBill?.(order)}
                      className="flex items-center justify-center gap-2 py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors duration-200"
                    >
                      <Split size={20} />
                      Dividir
                    </button>
                  </>
                )}
                {showPaymentControls && order.status === 'paid' && (
                  <button
                    onClick={() => onPrintReceipt?.(order)}
                    className="flex-1 flex items-center justify-center gap-2 py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors duration-200"
                  >
                    <Printer size={20} />
                    Imprimir Nota
                  </button>
                )}
                {/* Botão de excluir sempre visível */}
                <button
                  onClick={() => handleDeleteOrder(order)}
                  className="flex items-center justify-center gap-2 py-2 px-4 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors duration-200"
                >
                  <Trash2 size={20} />
                  Excluir
                </button>
              </div>
            </div>
          </div>
        ))
      )}

      {deleteOrder && (
        <DeleteConfirmation
          order={deleteOrder}
          onConfirm={confirmDelete}
          onCancel={() => setDeleteOrder(null)}
        />
      )}
    </div>
  );
}