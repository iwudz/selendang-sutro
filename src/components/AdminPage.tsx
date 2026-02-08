
import React, { useState, useEffect, useRef } from 'react';
import type { Order, MenuItem } from '../types';
import { OrderStatus, PaymentMethod } from '../types';
import { usePagination } from '../hooks/usePagination';
import {
  CookingPot, HandPlatter, Banknote, QrCode, X,
  Bell, AlertTriangle, Check, PackageSearch,
  Edit3, Trash2, ChevronLeft, ChevronRight
} from 'lucide-react';

const CATEGORY_GROUPS_ADMIN = [
  { id: 'makanan', label: 'MAKANAN', categories: ['Menu Utama', 'Camilan'], color: 'amber' },
  { id: 'minuman', label: 'MINUMAN', categories: ['Minuman Dingin', 'Minuman Panas'], color: 'blue' }
];

interface AdminPageProps {
  orders: Order[];
  onUpdateStatus: (orderId: string, status: OrderStatus, paymentMethod?: PaymentMethod) => void;
  menuItems: MenuItem[];
  onToggleSoldOut: (itemId: string) => void;
  onCancelOrder: (orderId: string) => void;
  onUpdateOrder: (orderId: string, updatedOrder: Order) => void;
}

const AdminPage: React.FC<AdminPageProps> = ({ orders, onUpdateStatus, menuItems, onToggleSoldOut, onCancelOrder, onUpdateOrder }) => {
  const [selectedOrderForPayment, setSelectedOrderForPayment] = useState<Order | null>(null);
  const [showQrisFullScreen, setShowQrisFullScreen] = useState(false);
  const [showReceipt, setShowReceipt] = useState<Order | null>(null);
  const [showStockManager, setShowStockManager] = useState(false);
  const [newOrderAlert, setNewOrderAlert] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState(() => Date.now());
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);
  const lastOrderCount = useRef(orders.length);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    audioRef.current = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
    const timer = setInterval(() => setCurrentTime(Date.now()), 10000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (orders.length > lastOrderCount.current) {
      const latest = orders.find(o => o.status === OrderStatus.NEW_ORDER);
      if (latest) {
        setNewOrderAlert(`Pesanan baru: ${latest.tableNumber}!`);
        audioRef.current?.play().catch(() => { });
        setTimeout(() => setNewOrderAlert(null), 5000);
      }
    }
    lastOrderCount.current = orders.length;
  }, [orders]);

  const finalizePayment = (method: PaymentMethod) => {
    if (selectedOrderForPayment) {
      const paidOrder = { ...selectedOrderForPayment, status: OrderStatus.PAID, paymentMethod: method };
      onUpdateStatus(selectedOrderForPayment.id, OrderStatus.PAID, method);
      setShowReceipt(paidOrder);
      setSelectedOrderForPayment(null);
      setShowQrisFullScreen(false);
    }
  };

  const handleCancelOrder = (orderId: string) => {
    if (window.confirm('Apakah Anda yakin ingin membatalkan pesanan ini?')) {
      onCancelOrder(orderId);
    }
  };

  const handleEditOrder = (order: Order) => {
    setEditingOrder(order);
  };

  // FIFO Sorting: Oldest NEW_ORDER at the top, followed by other active orders
  const sortedOrders = [...orders]
    .filter(o => o.status !== OrderStatus.PAID)
    .sort((a, b) => {
      if (a.status === OrderStatus.NEW_ORDER && b.status !== OrderStatus.NEW_ORDER) return -1;
      if (a.status !== OrderStatus.NEW_ORDER && b.status === OrderStatus.NEW_ORDER) return 1;
      // Within same status group, oldest first (FIFO)
      return a.createdAt - b.createdAt;
    });

  const {
    currentPage,
    totalPages,
    totalItems,
    pageSize,
    currentItems: paginatedOrders,
    nextPage,
    prevPage,
    setPageSize
  } = usePagination(sortedOrders, { initialPageSize: 12 });

  return (
    <div className="p-4 h-full bg-slate-50 flex flex-col gap-6 overflow-y-auto pb-24 lg:pb-4 relative text-slate-900">
      <style>{`
        @keyframes blink { 0%, 100% { opacity: 1; } 50% { opacity: 0.3; } }
        .animate-blink { animation: blink 1s infinite; }
        @keyframes pulse-red { 0%, 100% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.4); } 50% { box-shadow: 0 0 0 10px rgba(239, 68, 68, 0); } }
        .pulse-urgent { animation: pulse-red 2s infinite; border-color: #ef4444 !important; }
      `}</style>

      {newOrderAlert && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-60 bg-emerald-600 text-white px-6 py-3 rounded-full shadow-2xl flex items-center gap-3 animate-in fade-in slide-in-from-top-4">
          <Bell className="w-5 h-5 animate-bounce" />
          <span className="font-bold text-sm">{newOrderAlert}</span>
        </div>
      )}

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h2 className="text-xl font-black text-slate-800 uppercase tracking-tight text-center md:text-left">Daftar Order</h2>
        <div className="flex flex-wrap justify-center items-center gap-4">
          <button onClick={() => setShowStockManager(true)} className="flex items-center gap-2 bg-white px-4 py-2 rounded-xl border border-slate-200 text-xs font-black uppercase text-slate-500 hover:text-emerald-600 shadow-sm transition-all">
            <PackageSearch className="w-4 h-4" /> Stok
          </button>
          <div className="flex gap-2">
            <span className="text-[10px] font-black px-2.5 py-1.5 bg-amber-100 text-amber-800 rounded-xl border border-amber-200 uppercase tracking-tighter">New: {orders.filter(o => o.status === OrderStatus.NEW_ORDER).length}</span>
            <span className="text-[10px] font-black px-2.5 py-1.5 bg-blue-100 text-blue-800 rounded-xl border border-blue-200 uppercase tracking-tighter">Cook: {orders.filter(o => o.status === OrderStatus.COOKING).length}</span>
            <span className="text-[10px] font-black px-2.5 py-1.5 bg-emerald-100 text-emerald-800 rounded-xl border border-emerald-200 uppercase tracking-tighter">Served: {orders.filter(o => o.status === OrderStatus.SERVED).length}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {paginatedOrders.map(order => {
          const waitTime = (currentTime - order.createdAt) / 60000;
          const isUrgent = order.status === OrderStatus.NEW_ORDER && waitTime >= 3;

          return (
            <div key={order.id} className={`bg-white rounded-[2.5rem] shadow-sm border transition-all p-6 flex flex-col ${isUrgent ? 'pulse-urgent' : 'border-slate-100'}`}>
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h3 className="text-2xl font-black text-slate-800 tracking-tighter leading-none">{order.tableNumber}</h3>
                  <p className="text-[10px] text-slate-400 font-mono mt-1 uppercase">Order: {new Date(order.createdAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB</p>
                </div>
                <div className={`px-3 py-1 rounded-full text-[9px] font-black uppercase border flex items-center gap-1.5 ${order.status === OrderStatus.NEW_ORDER ? 'bg-amber-100 text-amber-800 border-amber-200 animate-blink' :
                  order.status === OrderStatus.COOKING ? 'bg-blue-100 text-blue-800 border-blue-200' :
                    'bg-emerald-100 text-emerald-800 border-emerald-200'
                  }`}>
                  {order.status === OrderStatus.NEW_ORDER && <div className="w-1.5 h-1.5 bg-amber-600 rounded-full animate-ping" />}
                  {order.status.replace('_', ' ')}
                </div>
              </div>

              <div className="flex-1 space-y-2 mb-6 bg-slate-50 p-4 rounded-3xl">
                {order.items.map(item => (
                  <div key={item.id} className="flex justify-between text-xs items-center">
                    <span className="text-slate-700 font-bold"><span className="text-emerald-600">{item.quantity}x</span> {item.menuItem.name}</span>
                  </div>
                ))}
                {order.notes && (
                  <div className="mt-3 p-3 bg-white border border-slate-100 rounded-2xl text-[10px] text-slate-500 italic leading-relaxed">
                    "{order.notes}"
                  </div>
                )}
              </div>

              <div className="pt-4 border-t border-slate-100 space-y-4">
                <div className="flex justify-between items-center px-1">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Tagihan</span>
                  <span className="text-xl font-black text-emerald-800 tracking-tighter">Rp {order.totalPrice.toLocaleString('id-ID')}</span>
                </div>

                {order.status === OrderStatus.NEW_ORDER && (
                  <div className="space-y-2">
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEditOrder(order)}
                        className="flex-1 py-3 bg-slate-100 text-slate-600 rounded-2xl text-xs font-black flex items-center justify-center gap-2 shadow-sm active:scale-95 transition-all hover:bg-slate-200"
                      >
                        <Edit3 className="w-4 h-4" /> EDIT
                      </button>
                      <button
                        onClick={() => handleCancelOrder(order.id)}
                        className="flex-1 py-3 bg-slate-100 text-slate-600 rounded-2xl text-xs font-black flex items-center justify-center gap-2 shadow-sm active:scale-95 transition-all hover:bg-slate-200"
                      >
                        <Trash2 className="w-4 h-4" /> BATAL
                      </button>
                    </div>
                    <button
                      onClick={() => onUpdateStatus(order.id, OrderStatus.COOKING)}
                      className={`w-full py-3 text-white rounded-2xl text-xs font-black flex items-center justify-center gap-2 shadow-lg active:scale-95 transition-all ${isUrgent ? 'bg-red-600 animate-pulse' : 'bg-blue-600'}`}
                    >
                      {isUrgent ? <AlertTriangle className="w-4 h-4" /> : <CookingPot className="w-4 h-4" />}
                      {isUrgent ? 'SEGERA TERIMA & MASAK!' : 'TERIMA & MASAK'}
                    </button>
                  </div>
                )}
                {order.status === OrderStatus.COOKING && (
                  <div className="space-y-2">
                    <button onClick={() => handleEditOrder(order)} className="flex-1 py-2 bg-slate-100 text-slate-600 rounded-xl text-xs font-black flex items-center justify-center gap-2 shadow-sm active:scale-95 transition-all hover:bg-slate-200">
                      <Edit3 className="w-4 h-4" /> EDIT
                    </button>
                    <button onClick={() => onUpdateStatus(order.id, OrderStatus.SERVED)} className="w-full py-4 bg-emerald-600 text-white rounded-2xl text-xs font-black flex items-center justify-center gap-2 shadow-lg active:scale-95 transition-all">
                      <HandPlatter className="w-4 h-4" /> SELESAI MASAK
                    </button>
                  </div>
                )}
                {order.status === OrderStatus.SERVED && (
                  <div className="space-y-2">
                    <button onClick={() => handleEditOrder(order)} className="flex-1 py-2 bg-slate-100 text-slate-600 rounded-xl text-xs font-black flex items-center justify-center gap-2 shadow-sm active:scale-95 transition-all hover:bg-slate-200">
                      <Edit3 className="w-4 h-4" /> EDIT
                    </button>
                    <button onClick={() => setSelectedOrderForPayment(order)} className="w-full py-4 bg-slate-800 text-white rounded-2xl text-xs font-black flex items-center justify-center gap-2 shadow-lg active:scale-95 transition-all">
                      <Banknote className="w-4 h-4" /> PROSES BAYAR
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between gap-4 py-4 px-2 bg-white rounded-xl border border-slate-200 shadow-sm">
          <div className="text-sm text-slate-600">
            <span className="font-medium">{(currentPage - 1) * pageSize + 1}-{Math.min(currentPage * pageSize, totalItems)}</span> dari <span className="font-medium">{totalItems}</span> pesanan
          </div>
            <div className="flex items-center gap-2">
              <label htmlFor="page-size" className="sr-only">Items per page</label>
              <select
                id="page-size"
                name="page-size"
                value={pageSize}
                onChange={(e) => setPageSize(Number(e.target.value))}
                className="text-sm border border-slate-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value={8}>8 per halaman</option>
                <option value={12}>12 per halaman</option>
                <option value={24}>24 per halaman</option>
              </select>
            <button
              onClick={prevPage}
              disabled={currentPage === 1}
              className="p-2 hover:bg-slate-100 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="w-5 h-5 text-slate-600" />
            </button>
            <span className="text-sm font-medium text-slate-800 px-2">
              {currentPage} / {totalPages}
            </span>
            <button
              onClick={nextPage}
              disabled={currentPage === totalPages}
              className="p-2 hover:bg-slate-100 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight className="w-5 h-5 text-slate-600" />
            </button>
          </div>
        </div>
      )}

{/* Stock Manager Modal */}
      {showStockManager && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-100 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-sm rounded-4xl shadow-2xl overflow-hidden flex flex-col h-[90vh] animate-in zoom-in-95">
            <div className="p-6 border-b flex justify-between items-center bg-linear-to-r from-emerald-600 to-emerald-500">
              <div>
                <h3 className="text-lg font-black text-white uppercase tracking-tight leading-none">Kelola Stok</h3>
                <p className="text-xs text-emerald-100 mt-1">Ketuk menu untuk toggle</p>
              </div>
              <button onClick={() => setShowStockManager(false)} className="p-2 bg-white/20 hover:bg-white/30 rounded-full transition-all">
                <X className="w-5 h-5 text-white" />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto bg-slate-50">
              {CATEGORY_GROUPS_ADMIN.map(({ id, label, categories, color }) => {
                const groupItems = menuItems.filter(item => categories.includes(item.category));
                if (groupItems.length === 0) return null;
                
                return (
                  <div key={id} className="p-4">
                    <div className="flex items-center gap-3 mb-3">
                      <div className={`px-3 py-1 rounded-lg font-black text-[10px] uppercase tracking-widest bg-${color}-100 text-${color}-700`}>
                        {label}
                      </div>
                      <div className="h-px bg-slate-200 flex-1" />
                    </div>
                    
                    <div className="grid grid-cols-3 gap-2">
                      {groupItems.map(item => (
                        <button
                          key={item.id}
                          onClick={() => onToggleSoldOut(item.id)}
                          className={`group relative overflow-hidden rounded-xl border transition-all duration-200 p-2 flex flex-col items-center gap-1 bg-white aspect-square ${
                            item.isSoldOut 
                              ? 'border-slate-200 bg-slate-50 grayscale-[0.3]' 
                              : `border-${color}-200 hover:border-${color}-400 bg-${color}-50/30`
                          }`}
                        >
                          <div className="w-full aspect-square rounded-lg overflow-hidden bg-slate-100 relative">
                            <img
                              src={item.image}
                              className={`w-full h-full object-cover transition-all duration-200 ${item.isSoldOut ? 'grayscale opacity-50' : 'group-hover:scale-110'}`}
                            />
                            {item.isSoldOut && (
                              <div className="absolute inset-0 bg-red-500/20 flex items-center justify-center">
                                <span className="bg-red-500 text-white px-2 py-0.5 rounded-full text-[8px] font-black uppercase">HABIS</span>
                              </div>
                            )}
                          </div>
                          <p className={`text-[9px] font-bold leading-tight text-center line-clamp-2 uppercase ${
                            item.isSoldOut ? 'text-slate-400' : 'text-slate-700'
                          }`}>
                            {item.name}
                          </p>
                          <div className={`absolute top-1 right-1 w-2 h-2 rounded-full ${
                            item.isSoldOut ? 'bg-red-500' : `bg-${color}-500`
                          }`} />
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
              
              {menuItems.length === 0 && (
                <div className="flex-1 flex items-center justify-center text-slate-400">
                  <div className="text-center">
                    <PackageSearch className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p className="text-xs font-bold uppercase">Tidak ada menu</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Payment Selection Modal with Receipt Details */}
      {selectedOrderForPayment && !showQrisFullScreen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-100 flex items-end sm:items-center justify-center overflow-y-auto p-4">
          <div className="bg-white w-full max-w-md rounded-[3rem] overflow-hidden shadow-2xl animate-in slide-in-from-bottom duration-300 flex flex-col max-h-[90vh]">
            <div className="p-8 pb-4 text-center border-b border-slate-50">
              <h2 className="text-3xl font-black text-slate-800 tracking-tighter uppercase leading-none">{selectedOrderForPayment.tableNumber}</h2>
              <p className="text-slate-400 font-bold uppercase text-[10px] tracking-widest mt-3">Selesaikan Pembayaran</p>
            </div>

            {/* Receipt Details Section */}
            <div className="flex-1 overflow-y-auto p-8 pt-4">
              <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-4xl p-6 font-mono text-xs text-slate-600">
                <div className="flex justify-between mb-4 border-b border-slate-200 pb-2">
                  <span className="font-bold uppercase">{selectedOrderForPayment.tableNumber}</span>
                  <span>Order: {new Date(selectedOrderForPayment.createdAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB</span>
                </div>
                <div className="space-y-3 mb-4">
                  {selectedOrderForPayment.items.map(item => (
                    <div key={item.id} className="flex justify-between items-start">
                      <span className="flex-1 pr-4">{item.quantity}x {item.menuItem.name}</span>
                      <span className="font-bold shrink-0">Rp {(item.menuItem.price * item.quantity).toLocaleString('id-ID')}</span>
                    </div>
                  ))}
                </div>
                {selectedOrderForPayment.notes && (
                  <div className="mb-4 pt-2 border-t border-slate-200">
                    <span className="text-[10px] uppercase font-bold text-slate-400">Catatan:</span>
                    <p className="mt-1 italic">"{selectedOrderForPayment.notes}"</p>
                  </div>
                )}
                <div className="pt-4 border-t-2 border-slate-300 flex justify-between items-center">
                  <span className="font-black uppercase text-sm">Total</span>
                  <span className="font-black text-lg text-emerald-700">Rp {selectedOrderForPayment.totalPrice.toLocaleString('id-ID')}</span>
                </div>
              </div>
            </div>

            <div className="p-8 pt-0 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <button onClick={() => finalizePayment(PaymentMethod.CASH)} className="flex flex-col items-center gap-3 p-6 bg-white border-2 border-slate-100 hover:border-emerald-600 rounded-4xl transition-all group active:scale-95 shadow-sm">
                  <Banknote className="w-8 h-8 text-emerald-600 transition-transform group-active:scale-90" />
                  <span className="font-black text-[10px] uppercase tracking-widest">TUNAI</span>
                </button>
                <button onClick={() => setShowQrisFullScreen(true)} className="flex flex-col items-center gap-3 p-6 bg-white border-2 border-slate-100 hover:border-blue-600 rounded-4xl transition-all group active:scale-95 shadow-sm">
                  <QrCode className="w-8 h-8 text-blue-600 transition-transform group-active:scale-90" />
                  <span className="font-black text-[10px] uppercase tracking-widest">QRIS</span>
                </button>
              </div>
              <button onClick={() => setSelectedOrderForPayment(null)} className="w-full py-2 text-slate-400 font-bold uppercase text-[10px] hover:text-slate-600 transition-colors">Tutup Panel</button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Order Modal */}
      {editingOrder && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-150 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-[3rem] overflow-hidden shadow-2xl animate-in zoom-in-95 max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b flex justify-between items-center">
              <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight leading-none">Edit Pesanan</h3>
              <button onClick={() => setEditingOrder(null)} className="p-2 hover:bg-slate-100 rounded-full"><X className="w-5 h-5 text-slate-300" /></button>
            </div>
            <div className="p-6 space-y-6">
              <div className="bg-slate-50 p-4 rounded-2xl">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Pemesan</p>
                <p className="text-xl font-black text-slate-800">{editingOrder.tableNumber}</p>
              </div>

              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Item Pesanan</p>
                <div className="space-y-3">
                  {editingOrder.items.map(item => (
                    <div key={item.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg overflow-hidden bg-slate-100">
                          <img src={item.menuItem.image} className="w-full h-full object-cover" alt={item.menuItem.name} />
                        </div>
                        <div>
                          <p className="text-sm font-black text-slate-800">{item.menuItem.name}</p>
                          <p className="text-[10px] text-slate-500">Rp {item.menuItem.price.toLocaleString('id-ID')}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button 
                          className="w-6 h-6 rounded-md bg-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-300"
                          onClick={() => {
                            if (editingOrder) {
                              const updatedItems = editingOrder.items.map(i => 
                                i.id === item.id ? { ...i, quantity: Math.max(1, i.quantity - 1) } : i
                              );
                              setEditingOrder({
                                ...editingOrder,
                                items: updatedItems,
                                totalPrice: updatedItems.reduce((sum, i) => sum + (i.quantity * i.menuItem.price), 0)
                              });
                            }
                          }}
                        >
                          -
                        </button>
                        <span className="text-sm font-black text-slate-800">{item.quantity}</span>
                        <button 
                          className="w-6 h-6 rounded-md bg-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-300"
                          onClick={() => {
                            if (editingOrder) {
                              const updatedItems = editingOrder.items.map(i => 
                                i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i
                              );
                              setEditingOrder({
                                ...editingOrder,
                                items: updatedItems,
                                totalPrice: updatedItems.reduce((sum, i) => sum + (i.quantity * i.menuItem.price), 0)
                              });
                            }
                          }}
                        >
                          +
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {editingOrder.notes && (
                <div className="bg-yellow-50 p-4 rounded-2xl">
                  <p className="text-[10px] font-black text-yellow-600 uppercase tracking-widest mb-2">Catatan</p>
                  <p className="text-sm text-yellow-800 italic">{editingOrder.notes}</p>
                </div>
              )}

              <div className="pt-4 border-t border-slate-200">
                <div className="flex justify-between items-center mb-4">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total</span>
                  <span className="text-2xl font-black text-emerald-800">Rp {editingOrder.totalPrice.toLocaleString('id-ID')}</span>
                </div>
                  <div className="space-y-2">
                  <button
                    onClick={() => {
                      if (editingOrder) {
                        onUpdateOrder(editingOrder.id, editingOrder);
                      }
                      setEditingOrder(null);
                    }}
                    className="w-full py-3 bg-slate-100 text-slate-600 rounded-2xl text-xs font-black flex items-center justify-center gap-2 shadow-lg active:scale-95 transition-all"
                  >
                    Simpan Perubahan
                  </button>
                  <button
                    onClick={() => setEditingOrder(null)}
                    className="w-full py-3 bg-slate-100 text-slate-400 rounded-2xl text-xs font-black flex items-center justify-center gap-2 shadow-lg active:scale-95 transition-all"
                  >
                    Batal
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* QRIS Modal */}
      {showQrisFullScreen && selectedOrderForPayment && (
        <div className="fixed inset-0 bg-white z-150 flex flex-col items-center justify-center p-6 animate-in fade-in">
          <div className="w-full max-w-sm bg-white rounded-[3.5rem] overflow-hidden shadow-2xl border flex flex-col">
            <div className="bg-slate-50 p-6 flex flex-col items-center border-b">
              <div className="flex items-center gap-2 mb-2">
                <div className="bg-red-600 text-white px-2 py-0.5 rounded font-black text-[10px] italic tracking-tighter">QRIS</div>
                <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">SELENDANG SUTRO</div>
              </div>
              <h2 className="text-lg font-black text-slate-800 uppercase tracking-tight">{selectedOrderForPayment.tableNumber}</h2>
            </div>
            <div className="p-10 flex flex-col items-center">
              <div className="w-full aspect-square border-2 border-slate-100 rounded-[2.5rem] p-4 mb-6">
                <img src={`https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=NUSANTARA_${selectedOrderForPayment.id}`} className="w-full h-full object-contain" alt="QRIS" />
              </div>
              <p className="text-4xl font-black text-slate-800 tracking-tighter">Rp {selectedOrderForPayment.totalPrice.toLocaleString('id-ID')}</p>
            </div>
            <div className="p-6 bg-slate-50 border-t flex flex-col gap-3">
              <button onClick={() => finalizePayment(PaymentMethod.QRIS)} className="w-full py-5 bg-emerald-600 text-white rounded-4xl font-black uppercase text-sm tracking-widest flex items-center justify-center gap-3 shadow-xl active:scale-95 transition-all">
                <Check className="w-5 h-5" /> KONFIRMASI BAYAR
              </button>
              <button onClick={() => setShowQrisFullScreen(false)} className="py-4 text-slate-400 font-bold uppercase text-[10px]">Kembali</button>
            </div>
          </div>
        </div>
      )}

      {showReceipt && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-200 flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white w-full max-w-70 rounded-xl shadow-2xl overflow-hidden">
            <div className="bg-slate-900 p-3 text-center">
              <h2 className="font-black text-white text-sm uppercase tracking-widest">SELENDANG SUTRO</h2>
              <p className="text-[9px] text-slate-400">Jl. Sutro No. 1</p>
            </div>
            <div className="p-4 space-y-2 text-[10px]">
              <div className="flex justify-between border-b border-dashed border-slate-200 pb-2">
                <span>Pemesan</span>
                <span className="font-bold">{showReceipt.tableNumber}</span>
              </div>
              <div className="flex justify-between border-b border-dashed border-slate-200 pb-2">
                <span>Waktu</span>
                <span>{new Date(showReceipt.createdAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}</span>
              </div>
              <div className="border-b border-dashed border-slate-200 pb-2">
                <p className="font-bold mb-1">Pesanan:</p>
                {showReceipt.items.map((item, idx) => (
                  <div key={idx} className="flex justify-between">
                    <span>{item.quantity}x {item.menuItem.name}</span>
                    <span>Rp {(item.menuItem.price * item.quantity).toLocaleString('id-ID')}</span>
                  </div>
                ))}
              </div>
              {showReceipt.notes && (
                <div className="border-b border-dashed border-slate-200 pb-2">
                  <p className="font-bold">Catatan: {showReceipt.notes}</p>
                </div>
              )}
              <div className="flex justify-between pt-2">
                <span className="font-bold">TOTAL</span>
                <span className="font-bold text-emerald-600">Rp {showReceipt.totalPrice.toLocaleString('id-ID')}</span>
              </div>
              <div className="text-center pt-3 text-[9px] text-slate-400">
                <p>Terima kasih</p>
                <p>{new Date().toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
              </div>
            </div>
            <div className="bg-slate-50 p-3 flex gap-2">
              <button onClick={() => window.print()} className="flex-1 py-2 bg-slate-200 text-slate-700 rounded-lg font-bold text-[10px] uppercase">CETAK</button>
              <button onClick={() => setShowReceipt(null)} className="flex-1 py-2 bg-emerald-600 text-white rounded-lg font-bold text-[10px] uppercase">TUTUP</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPage;
