import React, { useState, useMemo } from 'react';
import { MenuItem, OrderItem, MeatPoint } from '../types';
import { Plus, Minus, X, Receipt, Clock, AlertTriangle } from 'lucide-react';

interface NewOrderProps {
  menuItems: MenuItem[];
  onSubmit: (tableNumber: string, items: OrderItem[]) => void;
}

export function NewOrder({ menuItems, onSubmit }: NewOrderProps) {
  const [tableNumber, setTableNumber] = useState('');
  const [selectedItems, setSelectedItems] = useState<OrderItem[]>([]);
  const [customizationItem, setCustomizationItem] = useState<OrderItem | null>(null);
  const [customizationModal, setCustomizationModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const menuCategories = useMemo(() => {
    const categories = Array.from(new Set(menuItems.map(item => item.category)));
    return ['all', ...categories];
  }, [menuItems]);

  const filteredMenuItems = useMemo(() => {
    return menuItems.filter(item => {
      const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          item.description.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [menuItems, searchTerm, selectedCategory]);

  const meatPoints: MeatPoint[] = [
    'Mal passado',
    'Ao ponto para mal',
    'Ao ponto',
    'Ao ponto para bem',
    'Bem passado'
  ];

  const addItem = (menuItem: MenuItem) => {
    const newItem: OrderItem = {
      ...menuItem,
      quantity: 1,
      notes: '',
      removedItems: []
    };
    setCustomizationItem(newItem);
    setCustomizationModal(true);
  };

  const saveCustomization = (item: OrderItem) => {
    const existingItemIndex = selectedItems.findIndex(i => 
      i.id === item.id && 
      i.notes === item.notes && 
      i.meatPoint === item.meatPoint &&
      JSON.stringify(i.removedItems) === JSON.stringify(item.removedItems)
    );

    if (existingItemIndex >= 0) {
      setSelectedItems(items =>
        items.map((i, index) =>
          index === existingItemIndex
            ? { ...i, quantity: i.quantity + 1 }
            : i
        )
      );
    } else {
      setSelectedItems(items => [...items, item]);
    }
    setCustomizationModal(false);
    setCustomizationItem(null);
  };

  const removeItem = (itemId: string, notes?: string, meatPoint?: string, removedItems?: string[]) => {
    setSelectedItems(items =>
      items.filter(item => 
        !(item.id === itemId && 
          item.notes === notes && 
          item.meatPoint === meatPoint &&
          JSON.stringify(item.removedItems) === JSON.stringify(removedItems))
      )
    );
  };

  const updateQuantity = (itemId: string, delta: number, notes?: string, meatPoint?: string, removedItems?: string[]) => {
    setSelectedItems(items =>
      items.map(item => {
        if (item.id === itemId && 
            item.notes === notes && 
            item.meatPoint === meatPoint &&
            JSON.stringify(item.removedItems) === JSON.stringify(removedItems)) {
          const newQuantity = item.quantity + delta;
          return newQuantity > 0 ? { ...item, quantity: newQuantity } : item;
        }
        return item;
      }).filter(item => item.quantity > 0)
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (tableNumber && selectedItems.length > 0) {
      onSubmit(tableNumber, selectedItems);
      setTableNumber('');
      setSelectedItems([]);
      setSearchTerm('');
      setSelectedCategory('all');
    }
  };

  const total = selectedItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const estimatedTime = selectedItems.reduce((max, item) => {
    const menuItem = menuItems.find(m => m.id === item.id);
    return Math.max(max, menuItem?.prepTime || 0);
  }, 0);

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Número da Mesa
          </label>
          <input
            type="text"
            value={tableNumber}
            onChange={(e) => setTableNumber(e.target.value)}
            className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-lg p-3"
            placeholder="Digite o número da mesa"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Buscar no Cardápio
          </label>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-lg p-3"
            placeholder="Buscar por nome ou descrição"
          />
        </div>
      </div>

      <div className="flex overflow-x-auto py-2 gap-2">
        {menuCategories.map(category => (
          <button
            key={category}
            type="button"
            onClick={() => setSelectedCategory(category)}
            className={`px-4 py-2 rounded-full whitespace-nowrap transition-colors duration-200
              ${selectedCategory === category
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-100'}`}
          >
            {category === 'all' ? 'Todos' : category}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredMenuItems.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => addItem(item)}
            className="group relative overflow-hidden rounded-xl bg-white shadow-md hover:shadow-lg transition-all duration-200"
          >
            <div className="aspect-w-16 aspect-h-9 overflow-hidden">
              <img
                src={item.image}
                alt={item.name}
                className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-200"
              />
            </div>
            <div className="p-4">
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-semibold text-lg">{item.name}</h3>
                <span className="text-blue-600 font-medium">
                  R$ {item.price.toFixed(2)}
                </span>
              </div>
              <p className="text-sm text-gray-600 mb-3">{item.description}</p>
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <Clock size={16} />
                <span>{item.prepTime}min</span>
                {item.allergens.length > 0 && (
                  <div className="flex items-center gap-1 ml-3">
                    <AlertTriangle size={16} className="text-amber-500" />
                    <span>{item.allergens.join(', ')}</span>
                  </div>
                )}
              </div>
            </div>
          </button>
        ))}
      </div>

      {selectedItems.length > 0 && (
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">Itens Selecionados</h3>
          <div className="space-y-3">
            {selectedItems.map((item) => (
              <div key={`${item.id}-${item.notes}-${item.meatPoint}-${item.removedItems?.join()}`} 
                   className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex-1">
                  <div className="flex items-center">
                    <span className="font-medium text-lg">{item.name}</span>
                  </div>
                  {(item.notes || item.meatPoint || (item.removedItems && item.removedItems.length > 0)) && (
                    <div className="text-sm text-gray-600 mt-1">
                      {item.removedItems && item.removedItems.length > 0 && (
                        <div className="text-red-600">Remover: {item.removedItems.join(', ')}</div>
                      )}
                      {item.meatPoint && (
                        <div>Ponto: {item.meatPoint}</div>
                      )}
                      {item.notes && <div>Obs: {item.notes}</div>}
                    </div>
                  )}
                  <div className="text-blue-600 font-medium mt-1">
                    R$ {(item.price * item.quantity).toFixed(2)}
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <button
                    type="button"
                    onClick={() => updateQuantity(item.id, -1, item.notes, item.meatPoint, item.removedItems)}
                    className="p-2 rounded-full hover:bg-gray-200 text-gray-600 transition-colors duration-200"
                  >
                    <Minus size={18} />
                  </button>
                  <span className="w-8 text-center font-medium text-lg">{item.quantity}</span>
                  <button
                    type="button"
                    onClick={() => updateQuantity(item.id, 1, item.notes, item.meatPoint, item.removedItems)}
                    className="p-2 rounded-full hover:bg-gray-200 text-gray-600 transition-colors duration-200"
                  >
                    <Plus size={18} />
                  </button>
                  <button
                    type="button"
                    onClick={() => removeItem(item.id, item.notes, item.meatPoint, item.removedItems)}
                    className="p-2 rounded-full hover:bg-red-100 text-red-500 transition-colors duration-200"
                  >
                    <X size={18} />
                  </button>
                </div>
              </div>
            ))}
            
            <div className="mt-6 pt-4 border-t border-gray-200">
              <div className="flex flex-col gap-2">
                <div className="flex justify-between items-center text-lg">
                  <span className="font-medium">Tempo Estimado</span>
                  <span className="flex items-center gap-2">
                    <Clock size={20} className="text-amber-500" />
                    {estimatedTime} minutos
                  </span>
                </div>
                <div className="flex justify-between items-center text-xl font-semibold">
                  <span>Total</span>
                  <span className="text-blue-600">R$ {total.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {customizationModal && customizationItem && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold">{customizationItem.name}</h3>
              <button
                type="button"
                onClick={() => setCustomizationModal(false)}
                className="text-gray-400 hover:text-gray-500"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4">
              {menuItems.find(item => item.id === customizationItem.id)?.hasMeatPoint && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Ponto da Carne
                  </label>
                  <select
                    value={customizationItem.meatPoint || ''}
                    onChange={(e) => setCustomizationItem({
                      ...customizationItem,
                      meatPoint: e.target.value as MeatPoint
                    })}
                    className="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  >
                    <option value="">Selecione o ponto</option>
                    {meatPoints.map(point => (
                      <option key={point} value={point}>{point}</option>
                    ))}
                  </select>
                </div>
              )}

              {menuItems.find(item => item.id === customizationItem.id)?.customizableItems && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Remover Ingredientes
                  </label>
                  <div className="space-y-2">
                    {menuItems.find(item => item.id === customizationItem.id)?.customizableItems.map((item) => (
                      <label key={item} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={customizationItem.removedItems?.includes(item)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setCustomizationItem({
                                ...customizationItem,
                                removedItems: [...(customizationItem.removedItems || []), item]
                              });
                            } else {
                              setCustomizationItem({
                                ...customizationItem,
                                removedItems: customizationItem.removedItems?.filter(i => i !== item) || []
                              });
                            }
                          }}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-gray-700">{item}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Observações Adicionais
                </label>
                <textarea
                  value={customizationItem.notes}
                  onChange={(e) => setCustomizationItem({
                    ...customizationItem,
                    notes: e.target.value
                  })}
                  className="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  rows={3}
                  placeholder="Ex: Ponto da carne, temperos especiais, etc."
                />
              </div>

              <button
                type="button"
                onClick={() => saveCustomization(customizationItem)}
                className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors duration-200"
              >
                Adicionar ao Pedido
              </button>
            </div>
          </div>
        </div>
      )}

      <button
        type="submit"
        disabled={!tableNumber || selectedItems.length === 0}
        className="w-full py-4 px-6 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo- 700 text-white rounded-lg font-medium transition-all duration-200 flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
      >
        <Receipt size={24} />
        <span>Criar Pedido</span>
      </button>
    </form>
  );
}