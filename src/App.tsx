import React, { useState, useEffect } from 'react';
import { Order, OrderItem, MenuItem, UserRole } from './types';
import { OrderList } from './components/OrderList';
import { NewOrder } from './components/NewOrder';
import { Login } from './components/Login';
import { AdminLogin } from './components/AdminLogin';
import { AdminDashboard } from './components/AdminDashboard';
import { ManagerDashboard } from './components/ManagerDashboard';
import { CashierDashboard } from './components/CashierDashboard';
import { WaiterDashboard } from './components/WaiterDashboard';
import { KitchenDashboard } from './components/KitchenDashboard';
import { InventoryDashboard } from './components/InventoryDashboard';
import { RoleSelection } from './components/RoleSelection';
import { supabase } from './lib/supabase';
import toast from 'react-hot-toast';

// Menu items with expanded options and categories
const menuItems: MenuItem[] = [
  {
    id: '1',
    name: 'Picanha',
    description: 'Picanha grelhada com arroz, farofa e vinagrete',
    price: 89.90,
    category: 'Carnes',
    image: 'https://images.unsplash.com/photo-1594041680534-e8c8cdebd659',
    prepTime: 25,
    allergens: [],
    hasMeatPoint: true,
    customizableItems: ['Farofa', 'Vinagrete', 'Arroz']
  },
  {
    id: '2',
    name: 'Salmão Grelhado',
    description: 'Salmão grelhado com legumes e purê de batatas',
    price: 79.90,
    category: 'Peixes',
    image: 'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2',
    prepTime: 20,
    allergens: ['Peixe'],
    customizableItems: ['Legumes', 'Purê']
  },
  {
    id: '3',
    name: 'Massa à Carbonara',
    description: 'Espaguete com molho carbonara tradicional',
    price: 59.90,
    category: 'Massas',
    image: 'https://images.unsplash.com/photo-1612874742237-6526221588e3',
    prepTime: 15,
    allergens: ['Glúten', 'Ovo'],
    customizableItems: ['Bacon', 'Queijo']
  }
];

function App() {
  const [orders, setOrders] = useState<Order[]>(() => {
    const savedOrders = localStorage.getItem('restaurant_orders');
    return savedOrders ? JSON.parse(savedOrders) : [];
  });
  const [userRole, setUserRole] = useState<UserRole | null>(() => {
    const savedRole = localStorage.getItem('restaurant_user_role');
    return savedRole as UserRole | null;
  });
  const [isAdmin, setIsAdmin] = useState(false);
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const [userRoles, setUserRoles] = useState<string[]>([]);

  const handleLogout = () => {
    setUserRole(null);
    setIsAdmin(false);
    setUserRoles([]);
    setShowAdminLogin(false);
    localStorage.removeItem('restaurant_user_role');
  };

  const handleNewOrder = async (tableNumber: string, items: OrderItem[]) => {
    const newOrder: Order = {
      id: crypto.randomUUID(),
      tableNumber,
      items,
      status: 'pending',
      total: items.reduce((sum, item) => sum + item.price * item.quantity, 0),
      createdAt: new Date(),
    };

    setOrders(prevOrders => {
      const updatedOrders = [...prevOrders, newOrder];
      localStorage.setItem('restaurant_orders', JSON.stringify(updatedOrders));
      return updatedOrders;
    });
  };

  const handleStatusChange = async (orderId: string, status: Order['status']) => {
    setOrders(prevOrders => {
      const updatedOrders = prevOrders.map(order =>
        order.id === orderId ? { ...order, status } : order
      );
      localStorage.setItem('restaurant_orders', JSON.stringify(updatedOrders));
      return updatedOrders;
    });
  };

  const handlePayment = async (orderId: string, paymentMethod: Order['paymentMethod'], paidAmount?: number) => {
    setOrders(prevOrders => {
      const updatedOrders = prevOrders.map(order =>
        order.id === orderId
          ? {
              ...order,
              status: 'paid',
              paymentMethod,
              paidAmount,
              change: paidAmount ? paidAmount - order.total : undefined
            }
          : order
      );
      localStorage.setItem('restaurant_orders', JSON.stringify(updatedOrders));
      return updatedOrders;
    });
  };

  const handleLogin = (roles: string[]) => {
    setUserRoles(roles);
    if (roles.includes('admin')) {
      setIsAdmin(true);
      setUserRoles(['admin', 'manager', 'cashier', 'waiter', 'kitchen', 'stock']);
    }
    setUserRole(null);
  };

  const handleRoleSelect = (role: UserRole) => {
    setUserRole(role);
    localStorage.setItem('restaurant_user_role', role);
  };

  const handleAdminLogin = () => {
    setIsAdmin(true);
    setUserRoles(['admin', 'manager', 'cashier', 'waiter', 'kitchen', 'stock']);
    setShowAdminLogin(false);
  };

  if (showAdminLogin) {
    return <AdminLogin onLogin={handleAdminLogin} />;
  }

  if (!userRole && !userRoles.length) {
    return (
      <div>
        <Login onLogin={handleLogin} />
        <div className="fixed bottom-4 right-4">
          <button
            onClick={() => setShowAdminLogin(true)}
            className="px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-colors duration-200"
          >
            Acesso Admin
          </button>
        </div>
      </div>
    );
  }

  if (!userRole && userRoles.length > 0) {
    return (
      <RoleSelection
        roles={userRoles}
        onSelectRole={handleRoleSelect}
        onLogout={handleLogout}
      />
    );
  }

  return (
    <>
      {userRole === 'admin' && (
        <AdminDashboard onLogout={handleLogout} />
      )}
      
      {userRole === 'manager' && (
        <ManagerDashboard onLogout={handleLogout} />
      )}
      
      {userRole === 'cashier' && (
        <CashierDashboard
          orders={orders}
          onStatusChange={handleStatusChange}
          onPayment={handlePayment}
          onLogout={handleLogout}
        />
      )}
      
      {userRole === 'kitchen' && (
        <KitchenDashboard
          orders={orders}
          onStatusChange={handleStatusChange}
          onLogout={handleLogout}
        />
      )}
      
      {userRole === 'stock' && (
        <InventoryDashboard
          onLogout={handleLogout}
        />
      )}
      
      {userRole === 'waiter' && (
        <WaiterDashboard
          menuItems={menuItems}
          onCreateOrder={handleNewOrder}
          onLogout={handleLogout}
        />
      )}
    </>
  );
}

export default App;