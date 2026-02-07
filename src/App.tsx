
import React, { useState, useEffect, useRef } from 'react';
import type { User, Order, MenuItem } from './types';
import { UserRole, OrderStatus, PaymentMethod } from './types';
import useSupabase from './hooks/useSupabase';
import { api } from './services/api';
import PinEntry from './components/PinEntry';
import type { PinEntryRef } from './components/PinEntry';
import WaiterPage from './components/WaiterPage';
import { LogOut, UtensilsCrossed } from 'lucide-react';
import { lazy, Suspense } from 'react';

if (typeof window !== 'undefined') {
    const originalWarn = console.warn;
    console.warn = (...args: unknown[]) => {
        const msg = args[0];
        if (typeof msg === 'string' && msg.includes('width(-1) and height(-1) of chart')) {
            return;
        }
        originalWarn.apply(console, args);
    };
}

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [users, setUsers] = useState<User[]>([]);

  const pinEntryRef = useRef<PinEntryRef>(null);

  const AdminPageLazy = lazy(() => import('./components/AdminPage'));
  const OwnerPageLazy = lazy(() => import('./components/OwnerPage'));

  const { loading, error, data: supabaseData } = useSupabase();

  useEffect(() => {
    if (supabaseData) {
      setOrders(supabaseData.orders);
      setMenuItems(supabaseData.menuItems);
      setUsers(supabaseData.users);
    }
  }, [supabaseData]);

  const handleLogin = (pin: string) => {
    const user = users.find(u => u.pin === pin);
    if (user) {
      setCurrentUser(user);
    } else {
      if (pinEntryRef.current) {
        pinEntryRef.current.handleInvalidPin();
      }
    }
  };

  if (loading) return <div>Klinting Fuuullll ...</div>;
  if (error) return <div>Error: {error}</div>;

  const handleLogout = () => {
    setCurrentUser(null);
  };

  const addOrder = async (newOrder: Order) => {
    setOrders(prev => [newOrder, ...prev]);

    try {
      const realId = await api.orders.create(newOrder);
      if (realId) {
        setOrders(prev => prev.map(o => o.id === newOrder.id ? { ...o, id: realId } : o));
      }
    } catch (err: any) {
      console.error("Gagal simpan order:", err);
      alert("Gagal menyimpan order ke server: " + err.message);
      setOrders(prev => prev.filter(o => o.id !== newOrder.id));
    }
  };

  const updateOrderStatus = async (orderId: string, status: OrderStatus, paymentMethod?: PaymentMethod) => {
    setOrders(prev => prev.map(order => order.id === orderId ? { ...order, status, paymentMethod } : order));

    try {
      await api.orders.updateStatus(orderId, status, paymentMethod);
    } catch (err: any) {
      alert("Gagal update status: " + err.message);
    }
  };

  const toggleSoldOut = async (itemId: string) => {
    const item = menuItems.find(i => i.id === itemId);
    if (!item) return;

    const newStatus = !item.isSoldOut;
    setMenuItems(prev => prev.map(m => m.id === itemId ? { ...m, isSoldOut: newStatus } : m));

    try {
      await api.menu.toggleSoldOut(itemId, newStatus);
    } catch (err) {
      console.error(err);
    }
  };

  const cancelOrder = async (orderId: string) => {
    setOrders(prev => prev.filter(order => order.id !== orderId));

    try {
      await api.orders.delete(orderId);
    } catch (err: any) {
      console.error('Gagal membatalkan order:', err);
      alert('Gagal membatalkan order: ' + err.message);
    }
  };

  const updateOrder = async (orderId: string, updatedOrder: Order) => {
    setOrders(prev => prev.map(order => order.id === orderId ? updatedOrder : order));

    try {
      await api.orders.update(orderId, updatedOrder);
    } catch (err: any) {
      console.error('Gagal memperbarui order:', err);
      alert('Gagal memperbarui order: ' + err.message);
    }
  };

  if (!currentUser) {
    return <PinEntry onLogin={handleLogin} ref={pinEntryRef} />;
  }

  return (
    <div className="min-h-screen flex flex-col font-sans">
      <header className="bg-emerald-900 text-white shadow-md p-4 flex justify-between items-center sticky top-0 z-50 border-b border-emerald-800">
        <div className="flex items-center gap-3">
          <div className="bg-white p-1.5 rounded-lg">
            <UtensilsCrossed className="w-5 h-5 text-emerald-900" />
          </div>
          <div>
            <h1 className="text-lg font-black tracking-tighter uppercase leading-none">SELENDANG SUTRO</h1>
            <p className="text-[9px] font-bold text-emerald-300 uppercase tracking-widest">Klinting Full</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right hidden sm:block">
            <p className="text-xs font-black uppercase tracking-widest text-emerald-300 mb-0.5">{currentUser.role}</p>
            <p className="text-sm font-bold leading-none">{currentUser.name}</p>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center justify-center p-2.5 bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white rounded-xl transition-all border border-red-500/20"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      <main className="flex-1 overflow-hidden">
        {currentUser.role === UserRole.WAITER && (
          <WaiterPage
            currentUser={currentUser}
            onSendOrder={addOrder}
            menuItems={menuItems}
          />
        )}
        {currentUser.role === UserRole.ADMIN && (
          <Suspense fallback={<div>Loading Admin Page...</div>}>
            <AdminPageLazy
              orders={orders}
              onUpdateStatus={updateOrderStatus}
              menuItems={menuItems}
              onToggleSoldOut={toggleSoldOut}
              onCancelOrder={cancelOrder}
              onUpdateOrder={updateOrder}
            />
          </Suspense>
        )}
        {currentUser.role === UserRole.OWNER && (
          <Suspense fallback={<div>Loading Owner Page...</div>}>
            <OwnerPageLazy
              orders={orders}
              menuItems={menuItems}
              setMenuItems={setMenuItems}
              users={users}
              setUsers={setUsers}
            />
          </Suspense>
        )}
      </main>
    </div>
  );
};

export default App;
