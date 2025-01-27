import React, { useState } from 'react';
import { CashRegister } from '../types';
import { DollarSign, X } from 'lucide-react';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';

interface CashRegisterModalProps {
  isOpening: boolean;
  currentRegister?: CashRegister;
  onClose: () => void;
  onComplete: () => void;
}

export function CashRegisterModal({ isOpening, currentRegister, onClose, onComplete }: CashRegisterModalProps) {
  const [amount, setAmount] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isOpening) {
        // Abrir caixa
        const { error } = await supabase
          .from('cash_registers')
          .insert([{
            initial_amount: parseFloat(amount),
            status: 'open',
            notes,
          }]);

        if (error) throw error;
        toast.success('Caixa aberto com sucesso!');
      } else {
        // Fechar caixa
        if (!currentRegister) return;

        const finalAmount = parseFloat(amount);
        const difference = finalAmount - (
          (currentRegister.cash_sales || 0) + 
          currentRegister.initial_amount
        );

        const { error } = await supabase
          .from('cash_registers')
          .update({
            final_amount: finalAmount,
            difference,
            closed_at: new Date().toISOString(),
            status: 'closed',
            notes: notes || undefined,
          })
          .eq('id', currentRegister.id);

        if (error) throw error;
        toast.success('Caixa fechado com sucesso!');
      }

      onComplete();
      onClose();
    } catch (error) {
      console.error('Error:', error);
      toast.error(`Erro ao ${isOpening ? 'abrir' : 'fechar'} o caixa`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-semibold">
            {isOpening ? 'Abertura de Caixa' : 'Fechamento de Caixa'}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {!isOpening && currentRegister && (
            <div className="bg-gray-50 p-4 rounded-lg space-y-2">
              <div className="flex justify-between">
                <span>Valor Inicial:</span>
                <span className="font-medium">
                  R$ {currentRegister.initial_amount.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Vendas em Dinheiro:</span>
                <span className="font-medium">
                  R$ {(currentRegister.cash_sales || 0).toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Total Esperado:</span>
                <span className="font-medium">
                  R$ {(currentRegister.initial_amount + (currentRegister.cash_sales || 0)).toFixed(2)}
                </span>
              </div>
              <div className="pt-2 border-t border-gray-200">
                <div className="flex justify-between">
                  <span>Cartão:</span>
                  <span className="font-medium">
                    R$ {(currentRegister.card_sales || 0).toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>PIX:</span>
                  <span className="font-medium">
                    R$ {(currentRegister.pix_sales || 0).toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Vale Refeição:</span>
                  <span className="font-medium">
                    R$ {(currentRegister.meal_ticket_sales || 0).toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {isOpening ? 'Valor Inicial' : 'Valor em Caixa'}
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <DollarSign className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="number"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="pl-10 w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="0.00"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Observações
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              rows={3}
              placeholder="Adicione observações se necessário..."
            />
          </div>

          <button
            type="submit"
            disabled={loading || !amount}
            className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg font-medium transition-colors duration-200"
          >
            {loading ? 'Processando...' : isOpening ? 'Abrir Caixa' : 'Fechar Caixa'}
          </button>
        </form>
      </div>
    </div>
  );
}