import React, { useState, useEffect } from 'react';
import { Order } from '../types';
import { supabase } from '../lib/supabase';
import { BarChart, DollarSign, Calendar, TrendingUp, Users } from 'lucide-react';
import toast from 'react-hot-toast';

interface SalesReportProps {
  onClose: () => void;
}

interface DailySales {
  date: string;
  total: number;
  orders: number;
  serviceFees: number;
}

export function SalesReport({ onClose }: SalesReportProps) {
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState(
    new Date(new Date().setDate(new Date().getDate() - 7)).toISOString().split('T')[0]
  );
  const [endDate, setEndDate] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [salesData, setSalesData] = useState<DailySales[]>([]);
  const [totalStats, setTotalStats] = useState({
    revenue: 0,
    orders: 0,
    averageTicket: 0,
    serviceFees: 0
  });

  useEffect(() => {
    loadSalesData();
  }, [startDate, endDate]);

  const loadSalesData = async () => {
    try {
      setLoading(true);

      const { data: orders, error } = await supabase
        .from('orders')
        .select('*')
        .gte('created_at', startDate)
        .lte('created_at', endDate + 'T23:59:59')
        .eq('status', 'paid');

      if (error) throw error;

      // Agrupar vendas por dia
      const dailySales = orders.reduce((acc: { [key: string]: DailySales }, order) => {
        const date = new Date(order.created_at).toISOString().split('T')[0];
        
        if (!acc[date]) {
          acc[date] = {
            date,
            total: 0,
            orders: 0,
            serviceFees: 0
          };
        }

        acc[date].total += order.total;
        acc[date].orders += 1;
        acc[date].serviceFees += order.service_fee || 0;

        return acc;
      }, {});

      // Converter para array e ordenar por data
      const salesArray = Object.values(dailySales).sort((a, b) => 
        new Date(a.date).getTime() - new Date(b.date).getTime()
      );

      // Calcular estatísticas totais
      const stats = {
        revenue: salesArray.reduce((sum, day) => sum + day.total, 0),
        orders: salesArray.reduce((sum, day) => sum + day.orders, 0),
        serviceFees: salesArray.reduce((sum, day) => sum + day.serviceFees, 0),
        averageTicket: 0
      };
      
      stats.averageTicket = stats.orders > 0 ? stats.revenue / stats.orders : 0;

      setSalesData(salesArray);
      setTotalStats(stats);
    } catch (error) {
      console.error('Error loading sales data:', error);
      toast.error('Erro ao carregar dados de vendas');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center space-x-3">
            <BarChart className="h-6 w-6 text-blue-600" />
            <h3 className="text-xl font-semibold">Relatório de Vendas</h3>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500"
          >
            ✕
          </button>
        </div>

        {/* Filtros de data */}
        <div className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Data Inicial
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full p-2 border rounded-lg"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Data Final
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full p-2 border rounded-lg"
            />
          </div>
        </div>

        {/* Cards de estatísticas */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-4 text-white">
            <div className="flex items-center space-x-2 mb-2">
              <DollarSign className="h-5 w-5" />
              <span className="font-medium">Receita Total</span>
            </div>
            <div className="text-2xl font-bold">
              {formatCurrency(totalStats.revenue)}
            </div>
          </div>

          <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-4 text-white">
            <div className="flex items-center space-x-2 mb-2">
              <Users className="h-5 w-5" />
              <span className="font-medium">Total de Pedidos</span>
            </div>
            <div className="text-2xl font-bold">
              {totalStats.orders}
            </div>
          </div>

          <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-4 text-white">
            <div className="flex items-center space-x-2 mb-2">
              <TrendingUp className="h-5 w-5" />
              <span className="font-medium">Ticket Médio</span>
            </div>
            <div className="text-2xl font-bold">
              {formatCurrency(totalStats.averageTicket)}
            </div>
          </div>

          <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl p-4 text-white">
            <div className="flex items-center space-x-2 mb-2">
              <DollarSign className="h-5 w-5" />
              <span className="font-medium">Taxa de Serviço</span>
            </div>
            <div className="text-2xl font-bold">
              {formatCurrency(totalStats.serviceFees)}
            </div>
          </div>
        </div>

        {/* Tabela de vendas diárias */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Data
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Pedidos
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Receita
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Taxa de Serviço
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ticket Médio
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {salesData.map((day) => (
                <tr key={day.date} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {formatDate(day.date)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {day.orders}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatCurrency(day.total)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatCurrency(day.serviceFees)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatCurrency(day.total / day.orders)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}