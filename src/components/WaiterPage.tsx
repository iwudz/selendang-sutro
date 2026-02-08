
import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import type { MenuItem, Order, OrderItem, User, MenuCategory } from '../types';
import { OrderStatus } from '../types';
import { Search, Plus, Minus, ShoppingCart, Send, ChevronDown, X, Maximize2, ListFilter, Check, Utensils, Coffee, IceCream, Flame } from 'lucide-react';

interface WaiterPageProps {
  currentUser: User;
  onSendOrder: (order: Order) => void;
  menuItems: MenuItem[];
  orders: Order[];
}

const CATEGORIES: ('All' | MenuCategory)[] = ['All', 'Menu Utama', 'Camilan', 'Minuman Dingin', 'Minuman Panas'];

const CATEGORY_ICONS: Record<MenuCategory, React.ReactNode> = {
  'Menu Utama': <Utensils className="w-4 h-4" />,
  'Camilan': <IceCream className="w-4 h-4" />,
  'Minuman Dingin': <Coffee className="w-4 h-4" />,
  'Minuman Panas': <Flame className="w-4 h-4" />
};

const CATEGORY_GROUPS = [
  { id: 'makanan', label: 'MAKANAN', categories: ['Menu Utama', 'Camilan'] },
  { id: 'minuman', label: 'MINUMAN', categories: ['Minuman Dingin', 'Minuman Panas'] }
];

const WaiterPage: React.FC<WaiterPageProps> = ({ currentUser, onSendOrder, menuItems, orders }) => {
  const [cart, setCart] = useState<OrderItem[]>([]);
  const [tableInfo, setTableInfo] = useState('');
  const [notes, setNotes] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState<'All' | MenuCategory>('All');
  const [isCartExpanded, setIsCartExpanded] = useState(false);
  const [showCategoryMenu, setShowCategoryMenu] = useState(false);
  const [zoomImage, setZoomImage] = useState<MenuItem | null>(null);
  const [showSplash, setShowSplash] = useState(false);
  const [showMasakanSiap, setShowMasakanSiap] = useState(false);
  const [masakanSiapTable, setMasakanSiapTable] = useState('');
  const [imageLoaded, setImageLoaded] = useState<Record<string, boolean>>({});
  const categoryMenuRef = useRef<HTMLDivElement>(null);
  const tableInputRef = useRef<HTMLInputElement>(null);
  const notesInputRef = useRef<HTMLTextAreaElement>(null);
  const formContainerRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const lastServedOrderRef = useRef<string>('');

  useEffect(() => {
    audioRef.current = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (categoryMenuRef.current && !categoryMenuRef.current.contains(event.target as Node)) {
        setShowCategoryMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (!currentUser?.id) return;
    
    const servedOrders = orders.filter(o => 
      o.status === 'SERVED' && 
      String(o.waiterId) === String(currentUser.id) &&
      String(o.id) !== String(lastServedOrderRef.current)
    );
    
    if (servedOrders.length > 0) {
      const latestServed = servedOrders.sort((a, b) => b.servedAt! - a.servedAt!)[0];
      lastServedOrderRef.current = String(latestServed.id);
      setMasakanSiapTable(latestServed.tableNumber);
      setShowMasakanSiap(true);
      if (audioRef.current) {
        audioRef.current.play().catch(() => {});
      }
      setTimeout(() => setShowMasakanSiap(false), 5000);
    }
  }, [orders, currentUser?.id]);

  const handleFocusScroll = useCallback((ref: React.RefObject<HTMLInputElement | HTMLTextAreaElement | null>) => {
    if (ref.current && formContainerRef.current) {
      const element = ref.current;
      const container = formContainerRef.current;
      const elementTop = element.offsetTop;
      const elementHeight = element.offsetHeight;
      const containerHeight = container.offsetHeight;
      const containerScrollTop = container.scrollTop;
      
      if (elementTop < containerScrollTop || elementTop + elementHeight > containerScrollTop + containerHeight) {
        container.scrollTo({
          top: elementTop - 16,
          behavior: 'smooth'
        });
      }
    }
  }, []);

  const filteredItems = useMemo(() => {
    return menuItems.filter(item => {
      const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = activeCategory === 'All' || item.category === activeCategory;
      return matchesSearch && matchesCategory;
    });
  }, [searchTerm, activeCategory, menuItems]);

  const groupedItems = useMemo(() => {
    if (activeCategory !== 'All') {
      const group = CATEGORY_GROUPS.find(g => g.categories.includes(activeCategory));
      if (group) {
        const items = filteredItems.filter(item => group.categories.includes(item.category));
        return [{ group, items }];
      }
    }
    return CATEGORY_GROUPS.map(group => ({
      group,
      items: filteredItems.filter(item => group.categories.includes(item.category))
    })).filter(g => g.items.length > 0);
  }, [filteredItems, activeCategory]);

  const handleImageLoad = (itemId: string) => {
    setImageLoaded(prev => ({ ...prev, [itemId]: true }));
  };

  const updateCart = (item: MenuItem, delta: number) => {
    const currentItem = menuItems.find(m => m.id === item.id);
    if (currentItem?.isSoldOut) return;
    setCart(prev => {
      const existing = prev.find(i => i.menuItem.id === item.id);
      if (existing) {
        const newQty = existing.quantity + delta;
        if (newQty <= 0) return prev.filter(i => i.menuItem.id !== item.id);
        return prev.map(i => i.menuItem.id === item.id ? { ...i, quantity: newQty } : i);
      }
      if (delta > 0) return [...prev, { id: Date.now().toString(), menuItem: currentItem || item, quantity: 1 }];
      return prev;
    });
  };

  const totalPrice = cart.reduce((sum, item) => sum + (item.menuItem.price * item.quantity), 0);

  const handleSubmit = async () => {
    if (!tableInfo) return alert('Form Pemesan belum di isi!');
    if (cart.length === 0) return alert('Belum Pesan Menu!');

    const newOrder: Order = {
      id: `ORD-${Date.now()}`,
      tableNumber: tableInfo,
      items: [...cart],
      notes,
      status: OrderStatus.NEW_ORDER,
      totalPrice,
      createdAt: Date.now(),
      waiterId: currentUser.id
    };

    onSendOrder(newOrder);
    setShowSplash(true);
    
    setTimeout(() => {
      setShowSplash(false);
      setCart([]);
      setTableInfo('');
      setNotes('');
      setIsCartExpanded(false);
    }, 2500);
  };

  return (
    <div className="flex h-full flex-col lg:flex-row overflow-hidden bg-slate-50 relative">
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto pb-28 lg:pb-0">
        <div className="p-4 lg:p-6 bg-white/80 backdrop-blur-xl border-b sticky top-0 z-20">
          <div className="flex items-center gap-3 max-w-4xl mx-auto w-full relative">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
              <label htmlFor="menu-search" className="sr-only">Cari menu</label>
              <input 
                id="menu-search"
                name="menu-search"
                type="text" 
                placeholder="Cari menu ..."
                autoComplete="off"
                className="w-full pl-11 pr-4 py-2 bg-slate-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 font-semibold placeholder transition-all"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>
            
            <div className="relative" ref={categoryMenuRef}>
              <button 
                onClick={() => setShowCategoryMenu(!showCategoryMenu)}
                className={`p-2 rounded-xl border-2 transition-all flex items-center justify-center relative ${
                  showCategoryMenu || activeCategory !== 'All' 
                  ? 'bg-emerald-600 text-white border-emerald-600 shadow-lg shadow-emerald-100' 
                  : 'bg-white text-slate-500 border-slate-100 hover:bg-slate-50'
                }`}
              >
                <ListFilter className="w-5 h-5" />
                {activeCategory !== 'All' && (
                  <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 border-2 border-white rounded-full"></span>
                )}
              </button>

              {showCategoryMenu && (
                <div className="absolute right-0 mt-3 w-56 bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden">
                  <div className="p-2">
                    <p className="px-4 py-2 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-50 mb-1">Filter Kategori</p>
                    {CATEGORIES.map(cat => (
                      <button
                        key={cat}
                        onClick={() => {
                          setActiveCategory(cat);
                          setShowCategoryMenu(false);
                        }}
                        className={`w-full text-left px-5 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-between ${
                          activeCategory === cat ? 'bg-emerald-50 text-emerald-700' : 'text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        {cat}
                        {activeCategory === cat && <Check className="w-4 h-4" />}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
          
          {activeCategory !== 'All' && (
            <div className="max-w-4xl mx-auto w-full mt-3 flex items-center gap-2">
               <span className="text-[10px] font-black text-slate-400 titlecase tracking-widest">Kategori Aktif:</span>
               <span className="bg-emerald-100 text-emerald-700 px-3 py-1 rounded-md text-[9px] font-black uppercase flex items-center gap-2">
                 {activeCategory}
                 <X className="w-3 h-3 cursor-pointer" onClick={() => setActiveCategory('All')} />
               </span>
            </div>
          )}
        </div>

        <div className="p-4 lg:p-8 space-y-8">
          {groupedItems.map(({ group, items }) => (
            <div key={group.id}>
              <div className="flex items-center gap-3 mb-4">
                <div className={`px-4 py-2 rounded-xl font-black text-xs uppercase tracking-widest ${
                  group.id === 'makanan' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'
                }`}>
                  {group.label}
                </div>
                <div className="h-px bg-slate-200 flex-1" />
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4 lg:gap-6">
                {items.map(item => {
                  const inCart = cart.find(i => i.menuItem.id === item.id);
                  return (
                    <div key={item.id} className={`bg-white rounded-xl border border-slate-200/60 overflow-hidden group shadow-sm flex flex-col transition-all duration-300 ${item.isSoldOut ? 'opacity-80 grayscale-[0.4]' : 'hover:shadow-xl hover:-translate-y-1'}`}>
                      <div className="aspect-4/3 relative overflow-hidden bg-slate-100">
                        <img 
                          src={item.image} 
                          alt={item.name} 
                          loading="lazy"
                          onLoad={() => handleImageLoad(item.id)}
                          className={`w-full h-full object-cover transition-all duration-700 group-hover:scale-110 ${imageLoaded[item.id] ? 'opacity-100' : 'opacity-0'}`} 
                        />
                        {!imageLoaded[item.id] && (
                          <div className="absolute inset-0 bg-slate-200 animate-pulse" />
                        )}
                        <div className="absolute inset-0 bg-linear-to-t from-black/20 to-transparent" />
                        <button 
                          onClick={() => setZoomImage(item)}
                          className="absolute top-3 right-3 p-2 bg-white/20 backdrop-blur-md text-white rounded-xl hover:bg-white hover:text-emerald-600 transition-all active:scale-90"
                        >
                          <Maximize2 className="w-4 h-4" />
                        </button>
                        {item.isSoldOut && (
                          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center">
                            <span className="bg-red-500 text-white px-4 py-1.5 rounded-full font-black text-[9px] uppercase tracking-widest shadow-xl ring-2 ring-red-400">SOLD OUT</span>
                          </div>
                        )}
                      </div>
                      <div className="p-5 flex-1 flex flex-col justify-between space-y-3">
                        <div>
                          <p className="text-[9px] font-black text-emerald-600 uppercase tracking-widest mb-1 leading-none flex items-center gap-1">
                            {CATEGORY_ICONS[item.category]}
                            {item.category}
                          </p>
                          <h3 className="font-bold text-sm text-slate-800 leading-tight line-clamp-2 min-h-10 uppercase">{item.name}</h3>
                          <p className="font-black text-slate-400 text-xs mt-1">Rp {item.price.toLocaleString('id-ID')}</p>
                        </div>
                        <div className="pt-2">
                          {inCart ? (
                            <div className="flex items-center gap-1 bg-emerald-50 rounded-[1.2rem] p-1 shadow-inner border border-emerald-100">
                              <button onClick={() => updateCart(item, -1)} className="w-9 h-9 flex items-center justify-center bg-white text-emerald-600 rounded-xl shadow-sm hover:bg-emerald-50 active:scale-90 transition-all"><Minus className="w-4 h-4" /></button>
                              <span className="flex-1 text-center font-black text-emerald-900 text-sm">{inCart.quantity}</span>
                              <button onClick={() => updateCart(item, 1)} className="w-9 h-9 flex items-center justify-center bg-emerald-600 text-white rounded-xl shadow-sm hover:bg-emerald-700 active:scale-90 transition-all"><Plus className="w-4 h-4" /></button>
                            </div>
                          ) : (
                            <button 
                              disabled={item.isSoldOut}
                              onClick={() => updateCart(item, 1)}
                              className={`w-full py-3.5 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${
                                item.isSoldOut ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : 'bg-slate-700/60 text-white hover:bg-emerald-600 shadow-lg shadow-slate-100'
                              }`}
                            >
                              <Plus className="w-4 h-4" /> Order
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
          {filteredItems.length === 0 && (
            <div className="col-span-full py-20 text-center space-y-3 opacity-20">
               <Search className="w-16 h-16 mx-auto text-slate-400" />
               <p className="font-black uppercase tracking-widest text-sm text-slate-500">Menu tidak ditemukan</p>
            </div>
          )}
        </div>
      </div>

      {showSplash && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-300 flex items-center justify-center">
          <div className="bg-white rounded-3xl p-12 shadow-2xl max-w-md w-full mx-4 animate-in zoom-in-95">
            <div className="text-center space-y-6">
              <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6 animate-bounce">
                <Send className="w-10 h-10 text-emerald-600" />
              </div>
              <h2 className="text-3xl font-black text-slate-800 uppercase tracking-tighter">Order SEND</h2>
              <p className="text-emerald-600 font-bold text-sm uppercase tracking-widest">Pesanan terkirim</p>
            </div>
          </div>
        </div>
      )}

      {showMasakanSiap && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-md z-300 flex items-start justify-center pt-20">
          <div className="border-4 border-red-500 rounded-3xl p-8 animate-pulse bg-white/90 shadow-2xl">
            <div className="text-center">
              <h2 className="text-4xl font-black text-red-600 uppercase tracking-tighter animate-bounce">MASAKAN SIAP</h2>
              <p className="text-xl font-bold text-slate-700 mt-2">Meja: {masakanSiapTable}</p>
            </div>
          </div>
        </div>
      )}

      {zoomImage && (
        <div className="fixed inset-0 bg-black/95 z-200 flex flex-col">
          <header className="p-6 flex justify-between items-center shrink-0">
            <div className="text-white">
              <h4 className="text-xl font-black uppercase tracking-tight leading-none">{zoomImage.name}</h4>
              <p className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest mt-2">Rp {zoomImage.price.toLocaleString('id-ID')}</p>
            </div>
            <button onClick={() => setZoomImage(null)} className="p-3 bg-white/10 hover:bg-white text-white hover:text-black rounded-full transition-all"><X className="w-6 h-6" /></button>
          </header>
          <div className="flex-1 flex items-center justify-center p-4">
            <img src={zoomImage.image} className="max-w-full max-h-[70vh] object-contain rounded-4xl shadow-2xl" />
          </div>
          <footer className="p-10 flex justify-center shrink-0">
             <button 
                disabled={zoomImage.isSoldOut}
                onClick={() => { updateCart(zoomImage, 1); setZoomImage(null); }}
                className="px-12 py-5 bg-emerald-600 text-white rounded-full font-black text-sm uppercase tracking-widest hover:bg-emerald-700 active:scale-95 transition-all shadow-2xl"
             >
               {zoomImage.isSoldOut ? 'MENU HABIS' : 'PESAN MENU INI'}
             </button>
          </footer>
        </div>
      )}

      <div className={`lg:hidden fixed bottom-0 left-0 right-0 z-40 transition-all duration-700 ease-in-out ${cart.length > 0 ? 'translate-y-0' : 'translate-y-full'}`}>
        {isCartExpanded && <div className="fixed inset-0 bg-black/40 backdrop-blur-sm transition-opacity" onClick={() => setIsCartExpanded(false)} />}
        <div className={`bg-white/90 backdrop-blur-2xl border-t border-white/40 shadow-[0_-15px_40px_-15px_rgba(0,0,0,0.3)] rounded-t-4xl transition-all duration-700 ${isCartExpanded ? 'h-[85vh]' : 'h-24'} flex flex-col relative`}>
          <div className="w-full flex justify-center py-4 cursor-pointer" onClick={() => setIsCartExpanded(!isCartExpanded)}><div className="w-16 h-1.5 bg-slate-200 rounded-full" /></div>
          {!isCartExpanded && (
            <div className="px-8 pb-8 flex items-center justify-between cursor-pointer h-full" onClick={() => setIsCartExpanded(true)}>
              <div className="flex items-center gap-4">
                <div className="bg-emerald-600 p-3.5 rounded-2xl shadow-xl shadow-emerald-200"><ShoppingCart className="w-6 h-6 text-white" /></div>
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Checkout</p>
                  <p className="text-sm font-black text-slate-800 mt-1">{cart.length} Pesanan</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-lg font-black text-emerald-800 tracking-tighter">Rp {totalPrice.toLocaleString('id-ID')}</p>
              </div>
            </div>
          )}
          <div className={`flex-1 flex flex-col overflow-hidden transition-opacity duration-500 ${isCartExpanded ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
            <div className="px-8 pb-2 border-b-2 border-slate-100 flex justify-between items-center">
              <h2 className="text-2xl font-black text-slate-800 tracking-tighter uppercase">Review Order</h2>
              <button onClick={() => setIsCartExpanded(false)} className="p-2 bg-slate-50 rounded-full"><ChevronDown className="w-6 h-6 text-slate-400" /></button>
            </div>
            <div ref={formContainerRef} className="flex-1 overflow-y-auto p-6 space-y-6 pb-40">
              <div className="space-y-3">
                <label htmlFor="table-info" className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Pemesan</label>
                <input 
                  id="table-info" 
                  name="table-info" 
                  type="text" 
                  placeholder="Nama / Pemesan" 
                  autoComplete="off" 
                  ref={tableInputRef}
                  onFocus={() => handleFocusScroll(tableInputRef)}
                  className="w-full px-6 py-4 bg-slate-100 border-0 rounded-2xl focus:ring-2 focus:ring-emerald-500 text-xl font-black text-slate-800 placeholder:text-slate-200 uppercase" 
                  value={tableInfo} 
                  onChange={e => setTableInfo(e.target.value.toUpperCase())} 
                />
              </div>
              <div className="space-y-4">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Daftar Order</p>
                <div className="space-y-3">
                  {cart.map(item => (
                    <div key={item.id} className="flex justify-between items-center bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
                      <div className="flex-1 pr-4">
                        <p className="text-sm font-bold text-slate-800 leading-tight uppercase">{item.menuItem.name}</p>
                        <p className="text-[10px] font-bold text-emerald-600 mt-1">Rp {item.menuItem.price.toLocaleString('id-ID')}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2 bg-slate-50 p-1.5 rounded-xl border">
                           <button onClick={() => updateCart(item.menuItem, -1)} className="p-1.5 bg-white rounded-xl shadow-sm"><Minus className="w-3 h-3"/></button>
                           <span className="font-black text-xs min-w-5 text-center">{item.quantity}</span>
                           <button onClick={() => updateCart(item.menuItem, 1)} className="p-1.5 bg-emerald-600 text-white rounded-xl shadow-sm"><Plus className="w-3 h-3"/></button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="space-y-3">
                <label htmlFor="order-notes" className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Catatan :</label>
                <textarea 
                  id="order-notes" 
                  name="order-notes" 
                  placeholder="Contoh: Sambal pisah, Tanpa es, ..." 
                  ref={notesInputRef}
                  onFocus={() => handleFocusScroll(notesInputRef)}
                  className="w-full px-6 py-4 bg-slate-100 border-0 rounded-2xl text-sm h-24 resize-none" 
                  value={notes} 
                  onChange={e => setNotes(e.target.value)} 
                />
              </div>
            </div>
            <div className="p-6 bg-white/80 border-t border-slate-100 backdrop-blur-md shrink-0">
              <div className="flex justify-between items-end mb-4">
                <span className="text-slate-400 font-bold text-xs uppercase tracking-widest">Total Bayar</span>
                <span className="text-3xl font-black text-emerald-900 tracking-tighter">Rp {totalPrice.toLocaleString('id-ID')}</span>
              </div>
              <button disabled={cart.length === 0 || !tableInfo} onClick={handleSubmit} className="w-full py-5 bg-emerald-600/80 text-white rounded-4xl font-black uppercase text-sm tracking-widest flex items-center justify-center gap-3 shadow-2xl shadow-emerald-200 hover:bg-emerald-700 active:scale-95 disabled:grayscale transition-all"><Send className="w-5 h-5" /> Kirim Pesanan</button>
            </div>
          </div>
        </div>
      </div>

      <div className="hidden lg:flex w-105 bg-white border-l shadow-2xl flex-col h-full shrink-0 z-30">
        <div className="p-8 border-b flex items-center justify-between">
          <h2 className="font-black text-slate-800 text-2xl tracking-tighter uppercase flex items-center gap-3"><ShoppingCart className="w-7 h-7 text-emerald-600" /> Ringkasan Order</h2>
          <span className="bg-emerald-100 text-emerald-700 px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest">{cart.length} Item</span>
        </div>
        <div className="flex-1 overflow-y-auto p-8 space-y-10">
          <div className="space-y-3">
            <label htmlFor="order-identity" className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Identitas Pesanan</label>
            <input id="order-identity" name="order-identity" type="text" placeholder="PEMESAN" autoComplete="off" className="w-full px-6 py-5 bg-slate-50 border border-slate-200 rounded-4xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-xl font-black uppercase tracking-tighter" value={tableInfo} onChange={e => setTableInfo(e.target.value.toUpperCase())} />
          </div>
          <div className="space-y-4">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Item Terpilih</p>
            <div className="space-y-4">
              {cart.map(item => (
                <div key={item.id} className="flex justify-between items-center group">
                  <div className="flex-1 pr-4">
                    <p className="font-bold text-slate-800 group-hover:text-emerald-700 transition-colors uppercase">{item.menuItem.name}</p>
                    <p className="text-xs text-slate-400 font-medium italic">Rp {item.menuItem.price.toLocaleString('id-ID')} x {item.quantity}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-black text-emerald-800">Rp {(item.menuItem.price * item.quantity).toLocaleString('id-ID')}</p>
                    <div className="flex gap-1 mt-1 justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                       <button onClick={() => updateCart(item.menuItem, -1)} className="p-1 bg-slate-100 rounded-lg"><Minus className="w-3 h-3"/></button>
                       <button onClick={() => updateCart(item.menuItem, 1)} className="p-1 bg-emerald-100 text-emerald-700 rounded-lg"><Plus className="w-3 h-3"/></button>
                    </div>
                  </div>
                </div>
              ))}
              {cart.length === 0 && <div className="py-12 text-center text-slate-300 font-bold uppercase tracking-widest text-xs border-2 border-dashed border-slate-100 rounded-4xl">Keranjang Kosong</div>}
            </div>
          </div>
          <div className="space-y-3">
            <label htmlFor="special-requests" className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Catatan</label>
            <textarea id="special-requests" name="special-requests" placeholder="Permintaan spesial..." className="w-full px-6 py-5 bg-slate-50 border border-slate-200 rounded-4xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm h-28 resize-none" value={notes} onChange={e => setNotes(e.target.value)} />
          </div>
        </div>
        <div className="p-8 bg-emerald-50/50 border-t border-emerald-100 space-y-8">
          <div className="flex justify-between items-end">
            <span className="text-slate-400 font-bold text-[10px] uppercase tracking-widest">Estimasi Total</span>
            <span className="text-4xl font-black text-emerald-900 tracking-tighter leading-none">Rp {totalPrice.toLocaleString('id-ID')}</span>
          </div>
          <button disabled={cart.length === 0 || !tableInfo} onClick={handleSubmit} className="w-full py-6 bg-emerald-600 text-white rounded-[2.5rem] font-black uppercase text-sm tracking-widest flex items-center justify-center gap-3 shadow-2xl shadow-emerald-200 hover:bg-emerald-700 active:scale-95 disabled:grayscale transition-all"><Send className="w-5 h-5" /> Kirim Ke Admin</button>
        </div>
      </div>
    </div>
  );
};

export default WaiterPage;
