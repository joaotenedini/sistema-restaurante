import React, { useState, useEffect } from 'react';
import { Building2, Plus, Edit2, Trash2, Search, MapPin, Phone, Layers } from 'lucide-react';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';

interface Establishment {
  id: string;
  name: string;
  address: string;
  phone: string;
  logo_url: string;
  modules: string[];
  created_at: string;
}

interface Module {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
}

const AVAILABLE_MODULES: Module[] = [
  {
    id: 'kitchen',
    name: 'Cozinha',
    description: 'Gestão de pedidos e preparação de alimentos',
    icon: <Layers className="h-5 w-5" />
  },
  {
    id: 'cashier',
    name: 'Caixa',
    description: 'Controle de pagamentos e fechamento de caixa',
    icon: <Layers className="h-5 w-5" />
  },
  {
    id: 'waiter',
    name: 'Garçom',
    description: 'Atendimento e gestão de mesas',
    icon: <Layers className="h-5 w-5" />
  },
  {
    id: 'stock',
    name: 'Estoque',
    description: 'Controle de inventário e fornecedores',
    icon: <Layers className="h-5 w-5" />
  },
  {
    id: 'reports',
    name: 'Relatórios',
    description: 'Análise de vendas e desempenho',
    icon: <Layers className="h-5 w-5" />
  },
  {
    id: 'reservations',
    name: 'Reservas',
    description: 'Gestão de reservas e eventos',
    icon: <Layers className="h-5 w-5" />
  }
];

export function EstablishmentManagement() {
  const [establishments, setEstablishments] = useState<Establishment[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    phone: '',
    logo_url: '',
    modules: [] as string[]
  });
  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => {
    loadEstablishments();
  }, []);

  const loadEstablishments = async () => {
    try {
      const { data, error } = await supabase
        .from('establishments')
        .select('*')
        .order('name');

      if (error) throw error;
      setEstablishments(data || []);
    } catch (error) {
      console.error('Error loading establishments:', error);
      toast.error('Erro ao carregar estabelecimentos');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (editingId) {
        const { error } = await supabase
          .from('establishments')
          .update(formData)
          .eq('id', editingId);

        if (error) throw error;
        toast.success('Estabelecimento atualizado com sucesso');
      } else {
        const { error } = await supabase
          .from('establishments')
          .insert([formData]);

        if (error) throw error;
        toast.success('Estabelecimento criado com sucesso');
      }

      setShowModal(false);
      resetForm();
      loadEstablishments();
    } catch (error) {
      console.error('Error saving establishment:', error);
      toast.error('Erro ao salvar estabelecimento');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (establishment: Establishment) => {
    setFormData({
      name: establishment.name,
      address: establishment.address,
      phone: establishment.phone,
      logo_url: establishment.logo_url,
      modules: establishment.modules || []
    });
    setEditingId(establishment.id);
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este estabelecimento?')) return;

    try {
      const { error } = await supabase
        .from('establishments')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast.success('Estabelecimento excluído com sucesso');
      loadEstablishments();
    } catch (error) {
      console.error('Error deleting establishment:', error);
      toast.error('Erro ao excluir estabelecimento');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      address: '',
      phone: '',
      logo_url: '',
      modules: []
    });
    setEditingId(null);
  };

  const filteredEstablishments = establishments.filter(establishment =>
    establishment.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    establishment.address.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <>
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="bg-white rounded-xl shadow-xl p-8">
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center space-x-3">
              <Building2 className="h-8 w-8 text-blue-600" />
              <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                Gestão de Estabelecimentos
              </h1>
            </div>
            <button
              onClick={() => {
                resetForm();
                setShowModal(true);
              }}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
            >
              <Plus className="h-5 w-5 mr-2" />
              Novo Estabelecimento
            </button>
          </div>

          <div className="mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Buscar estabelecimentos..."
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredEstablishments.map((establishment) => (
              <div
                key={establishment.id}
                className="bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-200"
              >
                <div className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="text-xl font-semibold text-gray-900">
                      {establishment.name}
                    </h3>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleEdit(establishment)}
                        className="p-1 text-blue-600 hover:text-blue-800"
                      >
                        <Edit2 className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => handleDelete(establishment.id)}
                        className="p-1 text-red-600 hover:text-red-800"
                      >
                        <Trash2 className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                  
                  <div className="space-y-2 text-gray-600">
                    <div className="flex items-center">
                      <MapPin className="h-4 w-4 mr-2" />
                      <span>{establishment.address}</span>
                    </div>
                    <div className="flex items-center">
                      <Phone className="h-4 w-4 mr-2" />
                      <span>{establishment.phone}</span>
                    </div>
                  </div>

                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Módulos Ativos</h4>
                    <div className="flex flex-wrap gap-2">
                      {establishment.modules?.map(moduleId => {
                        const module = AVAILABLE_MODULES.find(m => m.id === moduleId);
                        return module ? (
                          <span
                            key={moduleId}
                            className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                          >
                            {module.name}
                          </span>
                        ) : null;
                      })}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-2xl w-full mx-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold">
                {editingId ? 'Editar Estabelecimento' : 'Novo Estabelecimento'}
              </h3>
              <button
                onClick={() => {
                  setShowModal(false);
                  resetForm();
                }}
                className="text-gray-400 hover:text-gray-500"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nome
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full p-2 border rounded-lg"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Telefone
                  </label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full p-2 border rounded-lg"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Endereço
                  </label>
                  <input
                    type="text"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    className="w-full p-2 border rounded-lg"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    URL do Logo
                  </label>
                  <input
                    type="url"
                    value={formData.logo_url}
                    onChange={(e) => setFormData({ ...formData, logo_url: e.target.value })}
                    className="w-full p-2 border rounded-lg"
                    placeholder="https://..."
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-4">
                  Módulos Disponíveis
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {AVAILABLE_MODULES.map((module) => (
                    <label
                      key={module.id}
                      className={`relative flex items-start p-4 cursor-pointer rounded-lg border-2 transition-colors duration-200 ${
                        formData.modules.includes(module.id)
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <input
                        type="checkbox"
                        className="sr-only"
                        checked={formData.modules.includes(module.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setFormData({
                              ...formData,
                              modules: [...formData.modules, module.id]
                            });
                          } else {
                            setFormData({
                              ...formData,
                              modules: formData.modules.filter(id => id !== module.id)
                            });
                          }
                        }}
                      />
                      <div className="flex-1">
                        <div className="flex items-center mb-1">
                          {module.icon}
                          <span className="ml-2 font-medium">{module.name}</span>
                        </div>
                        <p className="text-sm text-gray-500">{module.description}</p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    resetForm();
                  }}
                  className="px-4 py-2 border rounded-lg hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
                >
                  {loading ? 'Salvando...' : editingId ? 'Salvar Alterações' : 'Criar Estabelecimento'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}