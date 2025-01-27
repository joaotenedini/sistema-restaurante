import React, { useState, useEffect } from 'react';
import { Order, PaymentMethod } from '../types';
import { OrderList } from './OrderList';
import { Receipt } from './Receipt';
import { SalesReport } from './SalesReport';
import { SplitBillModal } from './SplitBillModal';
import { CashRegisterModal } from './CashRegisterModal';
import { LogOut, UtensilsCrossed, BarChart, ClipboardList, CheckSquare, DollarSign } from 'lucide-react';
import toast from 'react-hot-toast';
import { supabase } from '../lib/supabase';

interface CashierDashboardProps {
  orders: Order[];
  onStatusChange: (orderId: string, status: Order['status']) => void;
  onPayment: (orderId: string, paymentMethod: PaymentMethod, paidAmount?: number) => void;
  onLogout: () => void;
}

type TabType = 'pending' | 'completed';

interface CashRegister {
  id: string;
  opened_at: string;
  initial_amount: number;
  status: 'open' | 'closed';
  cash_sales: number;
  card_sales: number;
  pix_sales: number;
  meal_ticket_sales: number;
}

export function CashierDashboard({ orders, onStatusChange, onPayment, onLogout }: CashierDashboardProps) {
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showReceipt, setShowReceipt] = useState(false);
  const [showSalesReport, setShowSalesReport] = useState(false);
  const [showSplitBill, setShowSplitBill] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('pending');
  const [currentRegister, setCurrentRegister] = useState<CashRegister | null>(null);
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [isOpeningRegister, setIsOpeningRegister] = useState(true);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkCurrentRegister();
  }, []);

  const checkCurrentRegister = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('cash_registers')
        .select('*')
        .eq('status', 'open')
        .maybeSingle(); // Use maybeSingle instead of single

      // Only throw error if it's not a "no rows returned" error
      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      setCurrentRegister(data);
    } catch (error) {
      console.error('Error checking current register:', error);
      toast.error('Erro ao verificar caixa atual');
    } finally {
      setLoading(false);
    }
  };

  const handleSplitBill = (splits: Order[]) => {
    toast.success('Conta dividida com sucesso!');
    setShowSplitBill(false);
    setSelectedOrder(null);
  };

  const handlePaymentClick = (order: Order) => {
    if (!currentRegister) {
      toast.error('É necessário abrir o caixa primeiro!');
      return;
    }
    setSelectedOrder(order);
    setShowSplitBill(false);
    setShowReceipt(false);
  };

  const handleDeleteOrder = async (orderId: string) => {
    try {
      onStatusChange(orderId, 'cancelled');
      toast.success('Pedido excluído com sucesso');
    } catch (error) {
      console.error('Error deleting order:', error);
      toast.error('Erro ao excluir pedido');
    }
  };

  const handleRegisterComplete = () => {
    checkCurrentRegister();
    setShowRegisterModal(false);
  };

  const pendingOrders = orders.filter(order => 
    order.status !== 'cancelled' && 
    order.status !== 'paid'
  );

  const completedOrders = orders.filter(order => 
    order.status === 'paid'
  );

  const totalRevenue = completedOrders.reduce((sum, order) => sum + order.total, 0);
  const pendingPayments = pendingOrders.filter(order => order.status === 'delivered')
    .reduce((sum, order) => sum + order.total, 0);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <header className="bg-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <UtensilsCrossed className="h-8 w-8 text-blue-600" />
              <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                Painel do Caixa
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              {currentRegister ? (
                <button
                  onClick={() => {
                    setIsOpeningRegister(false);
                    setShowRegisterModal(true);
                  }}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors duration-200 flex items-center"
                >
                  <DollarSign className="h-5 w-5 mr-2" />
                  Fechar Caixa
                </button>
              ) : (
                <button
                  onClick={() => {
                    setIsOpeningRegister(true);
                    setShowRegisterModal(true);
                  }}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors duration-200 flex items-center"
                >
                  <DollarSign className="h-5 w-5 mr-2" />
                  Abrir Caixa
                </button>
              )}
              <button
                onClick={() => setShowSalesReport(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 flex items-center"
              >
                <BarChart className="h-5 w-5 mr-2" />
                Relatório de Vendas
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-2">Total Recebido</h3>
            <p className="text-3xl font-bold text-green-600">
              R$ {totalRevenue.toFixed(2)}
            </p>
          </div>
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-2">Pagamentos Pendentes</h3>
            <p className="text-3xl font-bold text-yellow-600">
              R$ {pendingPayments.toFixed(2)}
            </p>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-xl p-8">
          <div className="flex space-x-4 mb-6">
            <button
              onClick={() => setActiveTab('pending')}
              className={`flex items-center px-4 py-2 rounded-lg transition-colors duration-200 ${
                activeTab === 'pending'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <ClipboardList className="h-5 w-5 mr-2" />
              Pedidos Pendentes ({pendingOrders.length})
            </button>
            <button
              onClick={() => setActiveTab('completed')}
              className={`flex items-center px-4 py-2 rounded-lg transition-colors duration-200 ${
                activeTab === 'completed'
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <CheckSquare className="h-5 w-5 mr-2" />
              Pedidos Concluídos ({completedOrders.length})
            </button>
          </div>

          <OrderList
            orders={activeTab === 'pending' ? pendingOrders : completedOrders}
            onStatusChange={onStatusChange}
            showPaymentControls={activeTab === 'pending'}
            onPaymentClick={handlePaymentClick}
            onPrintReceipt={(order) => {
              setSelectedOrder(order);
              setShowReceipt(true);
            }}
            onSplitBill={(order) => {
              setSelectedOrder(order);
              setShowSplitBill(true);
            }}
          />
        </div>
      </main>

      {selectedOrder && !showReceipt && !showSplitBill && (
        <PaymentModal
          order={selectedOrder}
          onClose={() => setSelectedOrder(null)}
          onPayment={onPayment}
        />
      )}

      {selectedOrder && showReceipt && (
        <Receipt
          order={selectedOrder}
          onClose={() => {
            setSelectedOrder(null);
            setShowReceipt(false);
          }}
        />
      )}

      {selectedOrder && showSplitBill && (
        <SplitBillModal
          order={selectedOrder}
          onClose={() => {
            setSelectedOrder(null);
            setShowSplitBill(false);
          }}
          onSplit={handleSplitBill}
        />
      )}

      {showSalesReport && (
        <SalesReport onClose={() => setShowSalesReport(false)} />
      )}

      {showRegisterModal && (
        <CashRegisterModal
          isOpening={isOpeningRegister}
          currentRegister={currentRegister || undefined}
          onClose={() => setShowRegisterModal(false)}
          onComplete={handleRegisterComplete}
        />
      )}
    </>
  );
}