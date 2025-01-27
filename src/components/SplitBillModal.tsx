import React, { useState } from 'react';
import { Order, OrderItem } from '../types';
import { 
  DollarSign, Users, X, Plus, Minus, ArrowUpCircle, 
  ArrowDownCircle, History, Filter
} from 'lucide-react';
import toast from 'react-hot-toast';

interface SplitBillModalProps {
  order: Order;
  onClose: () => void;
  onSplit: (splits: Order[]) => void;
}

export function SplitBillModal({ order, onClose, onSplit }: SplitBillModalProps) {
  const [numberOfPeople, setNumberOfPeople] = useState(2);
  const [splits, setSplits] = useState<{ items: OrderItem[]; total: number }[]>(() => {
    // Inicializar arrays vazios para cada pessoa
    return Array(2).fill(null).map(() => ({ items: [], total: 0 }));
  });

  const unassignedItems = order.items.filter(orderItem => {
    const assignedQuantity = splits.reduce((total, split) => {
      const splitItem = split.items.find(item => 
        item.id === orderItem.id && 
        item.notes === orderItem.notes && 
        item.meatPoint === orderItem.meatPoint
      );
      return total + (splitItem?.quantity || 0);
    }, 0);
    return assignedQuantity < orderItem.quantity;
  });

  const handleNumberOfPeopleChange = (delta: number) => {
    const newNumber = numberOfPeople + delta;
    if (newNumber >= 2 && newNumber <= 10) {
      setNumberOfPeople(newNumber);
      setSplits(prev => {
        if (delta > 0) {
          // Adicionar novas divisões vazias
          return [...prev, ...Array(delta).fill(null).map(() => ({ items: [], total: 0 }))];
        } else {
          // Remover últimas divisões
          return prev.slice(0, newNumber);
        }
      });
    }
  };

  const addItemToSplit = (splitIndex: number, item: OrderItem) => {
    setSplits(prev => {
      const newSplits = [...prev];
      const existingItem = newSplits[splitIndex].items.find(i => 
        i.id === item.id && 
        i.notes === item.notes && 
        i.meatPoint === item.meatPoint
      );

      if (existingItem) {
        existingItem.quantity++;
      } else {
        newSplits[splitIndex].items.push({ ...item, quantity: 1 });
      }

      // Recalcular total
      newSplits[splitIndex].total = newSplits[splitIndex].items.reduce(
        (sum, i) => sum + (i.price * i.quantity), 
        0
      );

      return newSplits;
    });
  };

  const removeItemFromSplit = (splitIndex: number, itemIndex: number) => {
    setSplits(prev => {
      const newSplits = [...prev];
      const item = newSplits[splitIndex].items[itemIndex];

      if (item.quantity > 1) {
        item.quantity--;
      } else {
        newSplits[splitIndex].items.splice(itemIndex, 1);
      }

      // Recalcular total
      newSplits[splitIndex].total = newSplits[splitIndex].items.reduce(
        (sum, i) => sum + (i.price * i.quantity), 
        0
      );

      return newSplits;
    });
  };

  const handleSplit = () => {
    // Verificar se todos os itens foram distribuídos
    const totalAssigned = splits.reduce((total, split) => {
      return total + split.items.reduce((sum, item) => sum + item.quantity, 0);
    }, 0);

    const totalOriginal = order.items.reduce((sum, item) => sum + item.quantity, 0);

    if (totalAssigned !== totalOriginal) {
      toast.error('Distribua todos os itens antes de dividir a conta');
      return;
    }

    // Criar novas orders para cada divisão
    const newOrders = splits.map(split => ({
      ...order,
      id: crypto.randomUUID(),
      items: split.items,
      total: split.total,
      serviceFee: split.total * 0.1, // 10% de taxa de serviço
      parentOrderId: order.id,
      splitWith: splits.map(() => crypto.randomUUID())
    }));

    onSplit(newOrders);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-semibold">Dividir Conta - Mesa #{order.tableNumber}</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-4">
              <Users className="h-6 w-6 text-blue-600" />
              <span className="text-lg font-medium">Número de Pessoas</span>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={() => handleNumberOfPeopleChange(-1)}
                className="p-2 rounded-full hover:bg-gray-100"
                disabled={numberOfPeople <= 2}
              >
                <Minus className="h-5 w-5" />
              </button>
              <span className="text-xl font-semibold w-8 text-center">{numberOfPeople}</span>
              <button
                onClick={() => handleNumberOfPeopleChange(1)}
                className="p-2 rounded-full hover:bg-gray-100"
                disabled={numberOfPeople >= 10}
              >
                <Plus className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Itens não distribuídos */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="text-lg font-medium mb-4">Itens Disponíveis</h4>
            <div className="space-y-3">
              {unassignedItems.map((item, index) => (
                <div key={`${item.id}-${item.notes}-${index}`} className="flex justify-between items-center p-3 bg-white rounded-lg shadow-sm">
                  <div>
                    <div className="font-medium">{item.name}</div>
                    <div className="text-sm text-gray-500">
                      R$ {item.price.toFixed(2)} x {item.quantity}
                    </div>
                    {item.notes && <div className="text-sm text-gray-500">Obs: {item.notes}</div>}
                  </div>
                  <div className="flex space-x-2">
                    {splits.map((_, splitIndex) => (
                      <button
                        key={splitIndex}
                        onClick={() => addItemToSplit(splitIndex, item)}
                        className="px-2 py-1 bg-blue-100 text-blue-600 rounded hover:bg-blue-200"
                      >
                        P{splitIndex + 1}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Divisões */}
          <div className="space-y-6">
            {splits.map((split, splitIndex) => (
              <div key={splitIndex} className="bg-white p-4 rounded-lg border">
                <h4 className="text-lg font-medium mb-3">Pessoa {splitIndex + 1}</h4>
                <div className="space-y-3">
                  {split.items.map((item, itemIndex) => (
                    <div key={`${item.id}-${item.notes}-${itemIndex}`} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                      <div>
                        <div className="font-medium">{item.name}</div>
                        <div className="text-sm text-gray-500">
                          R$ {item.price.toFixed(2)} x {item.quantity}
                        </div>
                        {item.notes && <div className="text-sm text-gray-500">Obs: {item.notes}</div>}
                      </div>
                      <button
                        onClick={() => removeItemFromSplit(splitIndex, itemIndex)}
                        className="p-1 text-red-500 hover:bg-red-50 rounded"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
                <div className="mt-4 pt-3 border-t border-gray-200">
                  <div className="flex justify-between items-center text-lg font-semibold">
                    <span>Total</span>
                    <span className="text-green-600">R$ {split.total.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm text-gray-600 mt-1">
                    <span>Taxa de Serviço (10%)</span>
                    <span>R$ {(split.total * 0.1).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center text-lg font-bold mt-2 pt-2 border-t border-gray-200">
                    <span>Total com Taxa</span>
                    <span className="text-green-600">R$ {(split.total * 1.1).toFixed(2)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-6 pt-6 border-t border-gray-200 flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 border rounded-lg hover:bg-gray-50"
          >
            Cancelar
          </button>
          <button
            onClick={handleSplit}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center"
          >
            <DollarSign className="h-5 w-5 mr-2" />
            Dividir Conta
          </button>
        </div>
      </div>
    </div>
  );
}