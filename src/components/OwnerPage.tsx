
import React, { useMemo, useState, useRef } from 'react';
import type { Order, MenuItem, MenuCategory, User } from '../types';
import { OrderStatus, UserRole } from '../types';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { 
  TrendingUp, Utensils, Plus, 
  LayoutDashboard, Edit3, Trash2, ShieldCheck, XCircle, Menu as HamburgerIcon, Calendar,
  ImageIcon, CheckCircle2, AlertCircle, Camera, Loader2, Upload, AlertTriangle, BarChart3,
  ShoppingBag, Clock
} from 'lucide-react';
import { SUPABASE_CONFIG } from '../constants';
import ChartContainer from './ChartContainer';

interface OwnerPageProps {
  orders: Order[];
  menuItems: MenuItem[];
  setMenuItems: React.Dispatch<React.SetStateAction<MenuItem[]>>;
  users: User[];
  setUsers: React.Dispatch<React.SetStateAction<User[]>>;
}

type TabMode = 'Dashboard' | 'Menu' | 'Users' | 'Orders';
const CATEGORIES: MenuCategory[] = ['Menu Utama', 'Camilan', 'Minuman Dingin', 'Minuman Panas'];

const STATUS_CONFIG = {
  [OrderStatus.NEW_ORDER]: { label: 'New Order', color: 'amber', icon: '🔔' },
  [OrderStatus.COOKING]: { label: 'Cooking', color: 'blue', icon: '🍳' },
  [OrderStatus.SERVED]: { label: 'Served', color: 'emerald', icon: '✅' },
  [OrderStatus.PAID]: { label: 'Paid', color: 'slate', icon: '💰' }
} as const;

const OwnerPage: React.FC<OwnerPageProps> = ({ orders, menuItems, setMenuItems, users, setUsers }) => {
  const [activeTab, setActiveTab] = useState<TabMode>('Dashboard');
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const [editingMenu, setEditingMenu] = useState<Partial<MenuItem> | null>(null);
  const [editingUser, setEditingUser] = useState<Partial<User> | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  
  const [deleteModal, setDeleteModal] = useState<{ show: boolean; type: 'menu' | 'user'; id: string; name: string } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [dateRange, setDateRange] = useState({ 
    start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], 
    end: new Date().toISOString().split('T')[0] 
  });

  const getBaseUrl = () => SUPABASE_CONFIG.URL.replace(/\/$/, '');

  const getHeaders = () => ({
    'Content-Type': 'application/json',
    'apikey': SUPABASE_CONFIG.ANON_KEY,
    'Authorization': `Bearer ${SUPABASE_CONFIG.ANON_KEY}`,
    'Prefer': 'return=representation'
  });

  const paidOrdersInRange = useMemo(() => {
    return orders.filter(o => {
      if (o.status !== OrderStatus.PAID) return false;
      const orderDate = new Date(o.createdAt).toISOString().split('T')[0];
      return orderDate >= dateRange.start && orderDate <= dateRange.end;
    });
  }, [orders, dateRange]);

  const liveStats = {
    new: orders.filter(o => o.status === OrderStatus.NEW_ORDER).length,
    cook: orders.filter(o => o.status === OrderStatus.COOKING).length,
    served: orders.filter(o => o.status === OrderStatus.SERVED).length,
  };

  const totalRevenueInRange = useMemo(() => paidOrdersInRange.reduce((sum, o) => sum + o.totalPrice, 0), [paidOrdersInRange]);

  const chartData = useMemo(() => {
    const startDate = new Date(dateRange.start);
    const endDate = new Date(dateRange.end);
    const dateMap: Record<string, number> = {};
    
    const currentDate = new Date(startDate);
    while (currentDate <= endDate) {
      const dateKey = currentDate.toLocaleDateString('id-ID', { day: '2-digit', month: 'short' });
      dateMap[dateKey] = 0;
      currentDate.setDate(currentDate.getDate() + 1);
    }

    paidOrdersInRange.forEach(o => {
      const date = new Date(o.createdAt).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' });
      dateMap[date] = (dateMap[date] || 0) + o.totalPrice;
    });

    return Object.entries(dateMap).map(([name, value]) => ({ name, value }));
  }, [paidOrdersInRange, dateRange]);

  const setRangePreset = (type: 'daily' | 'weekly' | 'monthly') => {
    const end = new Date();
    let start = new Date();
    if (type === 'daily') start = new Date();
    if (type === 'weekly') start.setDate(end.getDate() - 7);
    if (type === 'monthly') start.setMonth(end.getMonth() - 1);
    setDateRange({ start: start.toISOString().split('T')[0], end: end.toISOString().split('T')[0] });
  };

  const performanceStats = useMemo(() => {
    let prep = 0, cook = 0, total = 0, count = 0;
    paidOrdersInRange.forEach(o => {
      if (o.verifiedAt && o.servedAt) {
        prep += (o.verifiedAt - o.createdAt) / 60000;
        cook += (o.servedAt - o.verifiedAt) / 60000;
        total += (o.servedAt - o.createdAt) / 60000;
        count++;
      }
    });
    return { 
      prep: count ? (prep/count).toFixed(1) : '0', 
      cook: count ? (cook/count).toFixed(1) : '0', 
      total: count ? (total/count).toFixed(1) : '0' 
    };
  }, [paidOrdersInRange]);

  // --- BEST SELLING MENU ---
  const bestSellingMenu = useMemo(() => {
    const menuCounts: Record<string, { count: number; total: number; name: string }> = {};
    paidOrdersInRange.forEach(o => {
      o.items.forEach(item => {
        if (!menuCounts[item.menuItem.id]) {
          menuCounts[item.menuItem.id] = {
            count: 0,
            total: 0,
            name: item.menuItem.name
          };
        }
        menuCounts[item.menuItem.id].count += item.quantity;
        menuCounts[item.menuItem.id].total += item.quantity * item.menuItem.price;
      });
    });
    return Object.entries(menuCounts)
      .map(([id, data]) => ({ id, ...data }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 3);
  }, [paidOrdersInRange]);

  // --- PEAK HOURS (8:00 - 19:00) ---
  const peakHoursData = useMemo(() => {
    const hourCounts: Record<number, number> = {};
    for (let hour = 8; hour <= 19; hour++) {
      hourCounts[hour] = 0;
    }
    paidOrdersInRange.forEach(o => {
      const orderHour = new Date(o.createdAt).getHours();
      if (orderHour >= 8 && orderHour <= 19) {
        hourCounts[orderHour]++;
      }
    });
    return Object.entries(hourCounts)
      .map(([hour, count]) => ({
        hour: `${hour}:00`,
        count: count
      }));
  }, [paidOrdersInRange]);


  // --- LOGIKA SUPABASE CRUD ---

  const toggleStatus = async (itemId: string) => {
    const item = menuItems.find(i => i.id === itemId);
    if (!item) return;
    const newStatus = !item.isSoldOut;
    
    // Update Local
    setMenuItems(prev => prev.map(m => m.id === itemId ? { ...m, isSoldOut: newStatus } : m));

    // Update Supabase
    if (SUPABASE_CONFIG.URL && SUPABASE_CONFIG.ANON_KEY) {
      await fetch(`${getBaseUrl()}/rest/v1/menu_items?id=eq.${itemId}`, {
        method: 'PATCH',
        headers: getHeaders(),
        body: JSON.stringify({ is_sold_out: newStatus })
      });
    }
  };

  // --- DELETE HANDLERS (REPLACING CONFIRM) ---
  const promptDelete = (type: 'menu' | 'user', id: string, name: string) => {
    setDeleteModal({ show: true, type, id, name });
  };

  const executeDelete = async () => {
    if (!deleteModal) return;
    setIsDeleting(true);
    const { type, id } = deleteModal;

    try {
        const endpoint = type === 'menu' ? 'menu_items' : 'users';

        // 1. Hapus dari Supabase
        if (SUPABASE_CONFIG.URL && SUPABASE_CONFIG.ANON_KEY) {
            const res = await fetch(`${getBaseUrl()}/rest/v1/${endpoint}?id=eq.${id}`, {
                method: 'DELETE',
                headers: getHeaders()
            });
            if (!res.ok) throw new Error(await res.text());
        }

        // 2. Hapus dari State Lokal
        if (type === 'menu') {
            setMenuItems(prev => prev.filter(i => i.id !== id));
        } else {
            setUsers(prev => prev.filter(u => u.id !== id));
        }
        
        setDeleteModal(null); // Tutup Modal
    } catch (err: any) {
        console.error("Delete error:", err);
        // Fallback error visual bisa ditambahkan disini, tapi kita tutup modal saja
        alert("Gagal menghapus: " + err.message);
    } finally {
        setIsDeleting(false);
    }
  };

  const saveMenuData = async () => {
    if (!editingMenu) return;
    setIsUploading(true);

    const dbPayload = {
      name: editingMenu.name,
      price: editingMenu.price,
      category: editingMenu.category,
      image: editingMenu.image,
      is_sold_out: !!editingMenu.isSoldOut
    };

    try {
      if (editingMenu.id) {
        // --- EDIT EXISTING ---
        if (SUPABASE_CONFIG.URL && SUPABASE_CONFIG.ANON_KEY) {
          const res = await fetch(`${getBaseUrl()}/rest/v1/menu_items?id=eq.${editingMenu.id}`, {
            method: 'PATCH',
            headers: getHeaders(),
            body: JSON.stringify(dbPayload)
          });
          if (!res.ok) throw new Error(await res.text());
        }
        setMenuItems(m => m.map(i => i.id === editingMenu.id ? ({...i, ...dbPayload, isSoldOut: dbPayload.is_sold_out} as MenuItem) : i));
      } else {
        // --- CREATE NEW ---
        if (SUPABASE_CONFIG.URL && SUPABASE_CONFIG.ANON_KEY) {
          const res = await fetch(`${getBaseUrl()}/rest/v1/menu_items`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify(dbPayload)
          });
          if (!res.ok) throw new Error(await res.text());
          
          const data = await res.json();
          const newId = data[0].id.toString();
                  setMenuItems(m => [...m, { ...dbPayload, id: newId, isSoldOut: dbPayload.is_sold_out } as MenuItem]);
        } else {
           const newId = 'local-' + Date.now();
           setMenuItems(m => [...m, { ...dbPayload, id: newId, isSoldOut: dbPayload.is_sold_out } as MenuItem]);
        }
      }
      setEditingMenu(null);
    } catch (err: any) {
      alert("Gagal simpan menu: " + err.message);
    } finally {
      setIsUploading(false);
    }
  };

  const saveUserData = async () => {
    if (!editingUser) return;
    
    try {
      const dbPayload = {
          name: editingUser.name,
          role: editingUser.role,
          pin: editingUser.pin
      };

      if (editingUser.id) {
        // EDIT
        if (SUPABASE_CONFIG.URL && SUPABASE_CONFIG.ANON_KEY) {
          const res = await fetch(`${getBaseUrl()}/rest/v1/users?id=eq.${editingUser.id}`, {
            method: 'PATCH',
            headers: getHeaders(),
            body: JSON.stringify(dbPayload)
          });
          if (!res.ok) throw new Error(await res.text());
        }
        setUsers(u => u.map(i => i.id === editingUser.id ? ({...i, ...dbPayload} as User) : i));
      } else {
        // CREATE
        if (SUPABASE_CONFIG.URL && SUPABASE_CONFIG.ANON_KEY) {
          const res = await fetch(`${getBaseUrl()}/rest/v1/users`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify(dbPayload)
          });
          if (!res.ok) throw new Error(await res.text());
          const data = await res.json();
          const newId = data[0].id.toString();
          setUsers(u => [...u, { ...dbPayload, id: newId } as User]);
        } else {
            const newId = 'u-' + Date.now();
            setUsers(u => [...u, { ...dbPayload, id: newId } as User]);
        }
      }
      setEditingUser(null);
    } catch (err: any) {
      alert("Gagal simpan user: " + err.message);
    }
  };

  // --- UPLOAD IMAGE (FIXED) ---
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!SUPABASE_CONFIG.URL || !SUPABASE_CONFIG.ANON_KEY) {
      alert("Config URL/Key Kosong!");
      return;
    }

    setIsUploading(true);

    try {
      // 1. Kompresi Gambar ke JPEG (Blob)
      const compressedBlob = await compressImage(file);
      
      // 2. Generate Nama File Bersih (.jpg)
      // FIX: Memaksa ekstensi .jpg karena kita convert ke JPEG di compressImage
      // Ini mencegah mismatch antara Content-Type (image/jpeg) dan ekstensi file (misal .webp)
      const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.jpg`;
      const filePath = `menu_items/${fileName}`; 

      // 3. Upload ke Supabase
      const res = await fetch(`${getBaseUrl()}/storage/v1/object/${SUPABASE_CONFIG.BUCKET}/${filePath}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${SUPABASE_CONFIG.ANON_KEY}`,
          'apikey': SUPABASE_CONFIG.ANON_KEY,
          'Content-Type': 'image/jpeg', // FIX: Konsisten dengan format blob
          'x-upsert': 'true'
        },
        body: compressedBlob
      });

      if (!res.ok) {
          const errorData = await res.json().catch(() => ({ message: res.statusText }));
          // Pesan error RLS yang lebih user friendly
          if (errorData.message?.includes('row-level security')) {
               throw new Error("Akses Ditolak (RLS). Pastikan Bucket 'menu-images' bersifat PUBLIC dan izinkan INSERT untuk semua orang (anon).");
          }
          throw new Error(errorData.message || "Gagal upload ke storage");
      }

      // 4. Construct Public URL
      const publicUrl = `${getBaseUrl()}/storage/v1/object/public/${SUPABASE_CONFIG.BUCKET}/${filePath}`;
      
      setEditingMenu(prev => prev ? { ...prev, image: publicUrl } : null);
      
    } catch (error: any) {
      console.error("Upload Error:", error);
      alert(`Gagal Upload: ${error.message}`);
    } finally {
      setIsUploading(false);
      if (e.target) e.target.value = ''; 
    }
  };

  const compressImage = (file: File): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_SIZE = 800; 
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > MAX_SIZE) {
              height *= MAX_SIZE / width;
              width = MAX_SIZE;
            }
          } else {
            if (height > MAX_SIZE) {
              width *= MAX_SIZE / height;
              height = MAX_SIZE;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (!ctx) return reject(new Error("Canvas error"));
          
          ctx.drawImage(img, 0, 0, width, height);
          
          // FIX: Pastikan output selalu JPEG
          canvas.toBlob((blob) => {
             if (blob) resolve(blob);
             else reject(new Error("Blob conversion failed"));
          }, 'image/jpeg', 0.8);
        };
        img.onerror = () => reject(new Error("Image load failed"));
      };
      reader.readAsDataURL(file);
    });
  };

  const navItems = [
    { id: 'Dashboard', icon: LayoutDashboard, label: 'Performance' },
    { id: 'Orders', icon: ShoppingBag, label: 'Live Orders' },
    { id: 'Menu', icon: Utensils, label: 'Menu Katalog' },
    { id: 'Users', icon: ShieldCheck, label: 'Akses User' }
  ];

  return (
    <div className="h-full bg-slate-50 flex flex-col overflow-hidden relative">
      {/* Mobile Nav Header */}
      <div className="lg:hidden p-4 bg-white border-b flex items-center justify-between sticky top-0 z-40 shadow-sm">
        <button onClick={() => setIsMobileNavOpen(true)} className="p-2 bg-slate-50 rounded-xl"><HamburgerIcon className="w-5 h-5 text-slate-600" /></button>
        <span className="font-black text-xs uppercase tracking-widest text-emerald-800">Owner Terminal</span>
        <div className="w-9" />
      </div>

      {/* Mobile Nav Overlay */}
      {isMobileNavOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] lg:hidden" onClick={() => setIsMobileNavOpen(false)}>
          <div className="bg-white w-72 h-full p-8 flex flex-col animate-in slide-in-from-left duration-300" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-10">
              <h2 className="font-black text-emerald-900 text-lg uppercase leading-none tracking-tighter">Delights POS</h2>
              <button onClick={() => setIsMobileNavOpen(false)}><XCircle className="w-6 h-6 text-slate-300" /></button>
            </div>
            <nav className="space-y-2">
              {navItems.map(item => (
                <button key={item.id} onClick={() => { setActiveTab(item.id as TabMode); setIsMobileNavOpen(false); }} className={`w-full flex items-center gap-4 p-4 rounded-2xl font-black text-sm transition-all ${activeTab === item.id ? 'bg-emerald-600 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-50'}`}>
                  <item.icon className="w-5 h-5" /> {item.label}
                </button>
              ))}
            </nav>
          </div>
        </div>
      )}

      {/* Desktop Nav */}
      <div className="hidden lg:flex bg-white border-b px-8 shrink-0">
        <div className="flex gap-8">
          {navItems.map(item => (
            <button key={item.id} onClick={() => setActiveTab(item.id as TabMode)} className={`flex items-center gap-2 py-5 px-1 border-b-2 font-black text-xs uppercase tracking-widest transition-all ${activeTab === item.id ? 'border-emerald-600 text-emerald-700' : 'border-transparent text-slate-300 hover:text-slate-500'}`}>
              <item.icon className="w-4 h-4" /> {item.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 lg:p-8 space-y-8 pb-32">
        {activeTab === 'Dashboard' && (
          <div className="animate-in fade-in duration-500 space-y-6">
            <div className="bg-slate-900 p-8 rounded-[3rem] text-white shadow-2xl grid grid-cols-3 divide-x divide-white/10">
              <div className="flex flex-col items-center justify-center text-center">
                <span className="text-[9px] font-black uppercase text-white/40 tracking-widest mb-1">New Order</span>
                <span className="text-4xl font-black text-amber-400 leading-none">{liveStats.new}</span>
              </div>
              <div className="flex flex-col items-center justify-center text-center">
                <span className="text-[9px] font-black uppercase text-white/40 tracking-widest mb-1">Cooking</span>
                <span className="text-4xl font-black text-blue-400 leading-none">{liveStats.cook}</span>
              </div>
              <div className="flex flex-col items-center justify-center text-center">
                <span className="text-[9px] font-black uppercase text-white/40 tracking-widest mb-1">Served</span>
                <span className="text-4xl font-black text-emerald-400 leading-none">{liveStats.served}</span>
              </div>
            </div>

            <div className="bg-white p-6 rounded-[3rem] border border-slate-200 shadow-sm space-y-6">
              <div className="flex flex-col gap-6">
                 <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                    <div>
                        <h3 className="font-black text-slate-800 uppercase text-xs tracking-widest flex items-center gap-2"><TrendingUp className="w-4 h-4 text-emerald-600" /> Trend Penjualan</h3>
                        <p className="text-3xl font-black text-emerald-800 mt-1 tracking-tighter">Rp {totalRevenueInRange.toLocaleString('id-ID')}</p>
                    </div>
                    <div className="flex bg-slate-100 p-1.5 rounded-2xl gap-1">
                      <button onClick={() => setRangePreset('daily')} className="px-3 py-1.5 rounded-xl text-[9px] font-black uppercase text-slate-500 hover:bg-white transition-all">Today</button>
                      <button onClick={() => setRangePreset('weekly')} className="px-3 py-1.5 rounded-xl text-[9px] font-black uppercase text-slate-500 hover:bg-white transition-all">Weekly</button>
                      <button onClick={() => setRangePreset('monthly')} className="px-3 py-1.5 rounded-xl text-[9px] font-black uppercase text-slate-500 hover:bg-white transition-all">Monthly</button>
                    </div>
                 </div>
                  <div className="flex items-center gap-2 bg-slate-50 p-2.5 rounded-2xl border border-slate-100 w-full overflow-x-auto">
                    <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <input id="date-start" type="date" name="date-start" className="bg-transparent border-0 text-[10px] font-black focus:ring-0 text-slate-600 uppercase" value={dateRange.start} onChange={e => setDateRange({...dateRange, start: e.target.value})} />
                    <span className="text-slate-300">-</span>
                    <input id="date-end" type="date" name="date-end" className="bg-transparent border-0 text-[10px] font-black focus:ring-0 text-slate-600 uppercase" value={dateRange.end} onChange={e => setDateRange({...dateRange, end: e.target.value})} />
                  </div>
              </div>
              <ChartContainer height={256} minWidth={300} minHeight={200}>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData}>
                    <defs><linearGradient id="pGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#10b981" stopOpacity={0.1}/><stop offset="95%" stopColor="#10b981" stopOpacity={0}/></linearGradient></defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: '#94a3b8' }} />
                    <YAxis hide />
                    <Tooltip cursor={{ stroke: '#10b981', strokeWidth: 2 }} contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 30px rgba(0,0,0,0.1)' }} />
                    <Area type="monotone" dataKey="value" stroke="#10b981" strokeWidth={5} fill="url(#pGrad)" dot={{ r: 4, fill: '#10b981', strokeWidth: 2, stroke: '#fff' }} />
                  </AreaChart>
                </ResponsiveContainer>
              </ChartContainer>
            </div>

            {/* Best Selling Menu */}
            <div className="bg-white p-6 rounded-[3rem] border border-slate-200 shadow-sm">
              <h3 className="font-black text-slate-800 uppercase text-xs tracking-widest mb-4 flex items-center gap-2">
                <Utensils className="w-4 h-4 text-emerald-600" /> Menu Terlaris
              </h3>
              {bestSellingMenu.length > 0 ? (
                <div className="space-y-3">
                  {bestSellingMenu.map((menu, index) => (
                    <div key={menu.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-2xl">
                      <div className="flex items-center gap-3">
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black ${
                          index === 0 ? 'bg-yellow-400 text-white' : 
                          index === 1 ? 'bg-gray-300 text-white' : 
                          'bg-amber-600 text-white'
                        }`}>
                          {index + 1}
                        </div>
                        <div>
                          <p className="text-sm font-black text-slate-800">{menu.name}</p>
                          <p className="text-[10px] text-slate-500">Terjual: {menu.count} pcs</p>
                        </div>
                      </div>
                      <p className="text-sm font-black text-emerald-800">Rp {menu.total.toLocaleString('id-ID')}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-slate-400">
                  <Utensils className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-xs font-bold uppercase">Tidak ada data penjualan</p>
                </div>
              )}
            </div>

            {/* Peak Hours Chart */}
            <div className="bg-white p-6 rounded-[3rem] border border-slate-200 shadow-sm">
              <h3 className="font-black text-slate-800 uppercase text-xs tracking-widest mb-4 flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-blue-600" /> Jam Peak Pesanan
              </h3>
              <ChartContainer height={192} minWidth={250} minHeight={150}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={peakHoursData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis 
                      dataKey="hour" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fontSize: 9, fill: '#94a3b8' }} 
                      interval={2}
                    />
                    <YAxis hide />
                    <Tooltip 
                      cursor={{ fill: '#f1f5f9' }} 
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                      labelStyle={{ fontSize: '10px', fontWeight: 'bold', color: '#64748b' }}
                      itemStyle={{ fontSize: '12px', fontWeight: 'bold' }}
                    />
                    <Bar 
                      dataKey="count" 
                      fill="#3b82f6" 
                      radius={[4, 4, 0, 0]}
                      barSize={20}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </ChartContainer>
            </div>

            {/* Performance Stats */}
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-white p-5 rounded-[2.5rem] border border-slate-100 shadow-sm text-center">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5 leading-none">Respon</p>
                <p className="text-2xl font-black text-slate-800 leading-none">{performanceStats.prep}<span className="text-[10px] ml-0.5 text-slate-300">m</span></p>
              </div>
              <div className="bg-white p-5 rounded-[2.5rem] border border-slate-100 shadow-sm text-center">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5 leading-none">Dapur</p>
                <p className="text-2xl font-black text-slate-800 leading-none">{performanceStats.cook}<span className="text-[10px] ml-0.5 text-slate-300">m</span></p>
              </div>
              <div className="bg-emerald-50 p-5 rounded-[2.5rem] border border-emerald-100 shadow-sm text-center">
                <p className="text-[9px] font-black text-emerald-600 uppercase tracking-widest mb-1.5 leading-none">Total</p>
                <p className="text-2xl font-black text-emerald-900 leading-none">{performanceStats.total}<span className="text-[10px] ml-0.5 text-emerald-400">m</span></p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'Orders' && (
          <div className="animate-in fade-in duration-500 space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-black text-slate-800 tracking-tight uppercase flex items-center gap-3">
                  <ShoppingBag className="w-6 h-6 text-emerald-600" /> Live Orders
                </h2>
                <p className="text-xs text-slate-400 mt-1">Monitoring pesanan real-time dari semua device</p>
              </div>
              <div className="flex items-center gap-2 text-xs text-emerald-600">
                <Clock className="w-4 h-4 animate-pulse" /> Live
              </div>
            </div>

            {/* Status Summary Cards */}
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-amber-50 border border-amber-200 p-4 rounded-[1.5rem] text-center">
                <p className="text-3xl font-black text-amber-600">{liveStats.new}</p>
                <p className="text-[9px] font-black text-amber-700 uppercase tracking-widest mt-1">New Order</p>
              </div>
              <div className="bg-blue-50 border border-blue-200 p-4 rounded-[1.5rem] text-center">
                <p className="text-3xl font-black text-blue-600">{liveStats.cook}</p>
                <p className="text-[9px] font-black text-blue-700 uppercase tracking-widest mt-1">Cooking</p>
              </div>
              <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-[1.5rem] text-center">
                <p className="text-3xl font-black text-emerald-600">{liveStats.served}</p>
                <p className="text-[9px] font-black text-emerald-700 uppercase tracking-widest mt-1">Served</p>
              </div>
            </div>

            {/* Orders List */}
            <div className="space-y-3">
              {orders.length === 0 ? (
                <div className="bg-white p-12 rounded-[2rem] border border-slate-200 text-center">
                  <ShoppingBag className="w-12 h-12 text-slate-200 mx-auto mb-3" />
                  <p className="font-black text-slate-400 uppercase tracking-widest text-sm">Belum ada pesanan</p>
                </div>
              ) : (
                orders.slice(0, 20).map((order) => {
                  const statusConfig = STATUS_CONFIG[order.status];
                  const timeAgo = Math.floor((Date.now() - order.createdAt) / 60000);
                  
                  return (
                    <div key={order.id} className="bg-white border border-slate-200 rounded-[1.5rem] p-5 shadow-sm">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-black text-lg text-slate-800 uppercase">{order.tableNumber}</p>
                            <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${
                              order.status === OrderStatus.NEW_ORDER ? 'bg-amber-100 text-amber-700' :
                              order.status === OrderStatus.COOKING ? 'bg-blue-100 text-blue-700' :
                              order.status === OrderStatus.SERVED ? 'bg-emerald-100 text-emerald-700' :
                              'bg-slate-100 text-slate-600'
                            }`}>
                              {statusConfig.icon} {statusConfig.label}
                            </span>
                          </div>
                          <div className="flex items-center gap-1 mt-1 text-slate-400">
                            <Clock className="w-3 h-3" />
                            <span className="text-[10px] font-bold">{timeAgo}m lalu</span>
                            <span className="text-slate-200">|</span>
                            <span className="text-[10px] font-bold text-slate-500">{order.id}</span>
                          </div>
                        </div>
                        <p className="font-black text-emerald-700 text-lg">Rp {order.totalPrice.toLocaleString('id-ID')}</p>
                      </div>
                      
                      <div className="space-y-2 border-t border-slate-100 pt-3">
                        {order.items.map((item, idx) => (
                          <div key={idx} className="flex justify-between text-sm">
                            <span className="text-slate-600 font-medium">{item.quantity}x {item.menuItem.name}</span>
                            <span className="text-slate-400">Rp {(item.menuItem.price * item.quantity).toLocaleString('id-ID')}</span>
                          </div>
                        ))}
                      </div>
                      
                      {order.notes && (
                        <div className="mt-3 bg-yellow-50 border border-yellow-100 rounded-xl p-3">
                          <p className="text-[10px] font-black text-yellow-700 uppercase tracking-widest mb-1">Catatan:</p>
                          <p className="text-xs text-yellow-800 font-medium">{order.notes}</p>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {activeTab === 'Menu' && (
          <div className="animate-in fade-in duration-500 space-y-6">
            <div className="flex justify-between items-center px-2">
              <h2 className="text-xl font-black text-slate-800 tracking-tight uppercase">Manajemen Menu</h2>
              <button onClick={() => setEditingMenu({ name: '', price: 0, category: 'Menu Utama', image: '', isSoldOut: false })} className="bg-emerald-600 text-white p-4 rounded-3xl shadow-xl active:scale-95 transition-all"><Plus className="w-6 h-6" /></button>
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {menuItems.map(item => (
                <div key={item.id} className="bg-white rounded-[2.5rem] border border-slate-100 p-4 shadow-sm relative group flex flex-col">
                  <div className="aspect-[4/3] rounded-[2rem] overflow-hidden mb-4 relative bg-slate-50 border border-slate-100 shadow-inner">
                    <img src={item.image || 'https://via.placeholder.com/150'} className={`w-full h-full object-cover transition-transform group-hover:scale-105 ${item.isSoldOut ? 'grayscale opacity-60' : ''}`} />
                    {item.isSoldOut && (
                      <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] flex items-center justify-center">
                         <span className="bg-red-600 text-white px-3 py-1 rounded-full font-black text-[8px] uppercase tracking-widest">Habis</span>
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <span className="text-[9px] font-black text-emerald-600 uppercase tracking-widest leading-none mb-1 block">{item.category}</span>
                    <h4 className="text-xs font-black text-slate-800 uppercase line-clamp-1 mb-1 tracking-tight">{item.name}</h4>
                    <div className="flex justify-between items-center">
                      <p className="text-[10px] font-bold text-slate-400 tracking-widest">Rp {item.price.toLocaleString('id-ID')}</p>
                      <button 
                        onClick={(e) => { e.stopPropagation(); toggleStatus(item.id); }}
                        className={`text-[8px] font-black uppercase px-2 py-1 rounded-md border transition-all flex items-center gap-1 ${
                          item.isSoldOut ? 'bg-red-50 text-red-600 border-red-100' : 'bg-emerald-50 text-emerald-600 border-emerald-100'
                        }`}
                      >
                        {item.isSoldOut ? <AlertCircle className="w-2.5 h-2.5" /> : <CheckCircle2 className="w-2.5 h-2.5" />}
                        {item.isSoldOut ? 'Habis' : 'Ada'}
                      </button>
                    </div>
                  </div>
                  <div className="mt-5 flex gap-2">
                    <button onClick={() => setEditingMenu(item)} className="flex-1 py-3 bg-slate-50 hover:bg-slate-100 rounded-2xl text-[10px] font-black uppercase text-slate-500 transition-colors">Edit</button>
                    <button onClick={() => promptDelete('menu', item.id, item.name)} className="p-3 text-red-200 hover:text-red-500 transition-colors"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'Users' && (
          <div className="animate-in fade-in duration-500 space-y-6">
            <div className="flex justify-between items-center px-2">
              <h2 className="text-xl font-black text-slate-800 tracking-tight uppercase">Manajemen User</h2>
              <button onClick={() => setEditingUser({ name: '', role: UserRole.WAITER, pin: '' })} className="bg-blue-600 text-white p-4 rounded-3xl shadow-xl active:scale-95 transition-all"><Plus className="w-6 h-6" /></button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {users.map(user => (
                <div key={user.id} className="bg-white p-6 rounded-[2.5rem] border border-slate-100 flex items-center justify-between shadow-sm group">
                   <div>
                      <h4 className="font-black text-slate-800 text-sm leading-none mb-1.5 uppercase tracking-tight">{user.name}</h4>
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${user.role === UserRole.OWNER ? 'bg-emerald-500' : user.role === UserRole.ADMIN ? 'bg-blue-500' : 'bg-amber-500'}`} />
                        {user.role} <span className="text-slate-200">|</span> PIN: <span className="text-slate-600">{user.pin}</span>
                      </p>
                   </div>
                   <div className="flex gap-2">
                      <button onClick={() => setEditingUser(user)} className="p-3 bg-slate-50 rounded-2xl text-slate-300 group-hover:text-blue-600 group-hover:bg-blue-50 transition-all"><Edit3 className="w-5 h-5" /></button>
                      <button onClick={() => promptDelete('user', user.id, user.name)} className="p-3 bg-slate-50 rounded-2xl text-slate-300 group-hover:text-red-600 group-hover:bg-red-50 transition-all"><Trash2 className="w-5 h-5" /></button>
                   </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* EDIT MENU MODAL */}
      {editingMenu && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
           <div className="bg-white w-full max-w-sm rounded-[3rem] shadow-2xl p-8 space-y-6 animate-in zoom-in-95 max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-2">
                  <h3 className="font-black text-slate-800 uppercase tracking-tight text-center flex-1">Data Menu</h3>
                  <button onClick={() => setEditingMenu(null)} className="p-1 text-slate-300"><XCircle className="w-6 h-6"/></button>
              </div>
              
              <div className="space-y-4">
                {/* Image Preview & Upload Button */}
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Foto Menu</label>
                  <div className="relative aspect-[4/3] rounded-[2rem] overflow-hidden bg-slate-100 border-2 border-dashed border-slate-200 group">
                    {editingMenu.image ? (
                      <img src={editingMenu.image} className="w-full h-full object-cover" alt="Preview" />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center text-slate-300">
                        <ImageIcon className="w-12 h-12 mb-2" />
                        <span className="text-[9px] font-black uppercase">Belum ada foto</span>
                      </div>
                    )}
                    
                    <button 
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isUploading}
                      className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white gap-2"
                    >
                      {isUploading ? (
                        <Loader2 className="w-8 h-8 animate-spin" />
                      ) : (
                        <>
                          <Camera className="w-8 h-8" />
                          <span className="text-[10px] font-black uppercase tracking-widest">Ganti Foto</span>
                        </>
                      )}
                    </button>
                    
                    {isUploading && (
                      <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center">
                         <div className="flex flex-col items-center gap-3">
                            <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
                            <span className="text-[10px] font-black text-emerald-800 uppercase tracking-widest">Mengunggah...</span>
                         </div>
                      </div>
                    )}
                  </div>
                  <input 
                    id="menu-image-upload"
                    name="menu-image-upload"
                    type="file" 
                    accept="image/*" 
                    className="hidden" 
                    ref={fileInputRef} 
                    onChange={handleImageUpload}
                  />
                  <button 
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full py-3 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2"
                  >
                    <Upload className="w-3.5 h-3.5" /> Pilih dari Galeri / Kamera
                  </button>
                </div>

                <div className="space-y-1">
                  <label htmlFor="menu-name" className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nama Menu</label>
                  <input id="menu-name" name="menu-name" type="text" className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none font-bold text-sm tracking-tight" value={editingMenu.name} onChange={e => setEditingMenu({...editingMenu, name: e.target.value})} />
                </div>
                <div className="space-y-1">
                  <label htmlFor="menu-category" className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Kategori</label>
                  <select id="menu-category" name="menu-category" className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none font-black text-xs uppercase" value={editingMenu.category} onChange={e => setEditingMenu({...editingMenu, category: e.target.value as MenuCategory})}>
                    {CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                  </select>
                </div>
                <div className="space-y-1">
                  <label htmlFor="menu-price" className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Harga (Rp)</label>
                  <input 
                    id="menu-price"
                    name="menu-price"
                    type="number" 
                    className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none font-black text-sm text-right [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    value={editingMenu.price === 0 ? '' : editingMenu.price} 
                    onChange={e => setEditingMenu({...editingMenu, price: e.target.value === '' ? 0 : parseInt(e.target.value)})}
                    placeholder="0"
                  />
                </div>
                
              </div>
              <div className="pt-4">
                <button 
                  disabled={isUploading}
                  onClick={saveMenuData} 
                  className="w-full py-5 bg-emerald-600 text-white rounded-[2rem] font-black uppercase text-xs tracking-[0.2em] shadow-xl shadow-emerald-100 active:scale-95 transition-all disabled:opacity-50"
                >
                  Simpan Menu
                </button>
              </div>
           </div>
        </div>
      )}

      {/* EDIT USER MODAL */}
      {editingUser && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-sm rounded-[3rem] shadow-2xl p-8 space-y-6 animate-in zoom-in-95">
              <div className="flex justify-between items-center mb-2">
                  <h3 className="font-black text-slate-800 uppercase tracking-tight text-center flex-1">Data User</h3>
                  <button onClick={() => setEditingUser(null)} className="p-1 text-slate-300"><XCircle className="w-6 h-6"/></button>
              </div>
              <div className="space-y-4">
                <div className="space-y-1">
                  <label htmlFor="user-name" className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nama Pegawai</label>
                  <input id="user-name" name="user-name" type="text" className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none font-bold text-sm" value={editingUser.name} onChange={e => setEditingUser({...editingUser, name: e.target.value})} />
                </div>
                <div className="space-y-1">
                  <label htmlFor="user-role" className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Role Jabatan</label>
                  <select id="user-role" name="user-role" className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none font-black text-xs uppercase" value={editingUser.role} onChange={e => setEditingUser({...editingUser, role: e.target.value as UserRole})}>
                    <option value={UserRole.WAITER}>Waiter</option>
                    <option value={UserRole.ADMIN}>Admin</option>
                    <option value={UserRole.OWNER}>Owner</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label htmlFor="user-pin" className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">PIN 4-Digit</label>
                  <input id="user-pin" name="user-pin" type="text" inputMode="numeric" maxLength={4} className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none font-black text-base text-center tracking-[0.4em]" value={editingUser.pin} onChange={e => setEditingUser({...editingUser, pin: e.target.value})} />
                </div>
              </div>
              <div className="pt-4">
                <button onClick={saveUserData} className="w-full py-5 bg-blue-600 text-white rounded-[2rem] font-black uppercase text-xs tracking-[0.2em] shadow-xl shadow-blue-100 active:scale-95 transition-all">Simpan Akses</button>
              </div>
            </div>
        </div>
      )}

      {/* NEW DELETE CONFIRMATION MODAL */}
      {deleteModal && (
        <div className="fixed inset-0 bg-red-900/80 backdrop-blur-sm z-[300] flex items-center justify-center p-6 animate-in fade-in duration-200">
           <div className="bg-white w-full max-w-sm rounded-[3rem] shadow-2xl p-8 flex flex-col items-center text-center animate-in zoom-in-95">
              <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mb-6 animate-pulse">
                 <AlertTriangle className="w-10 h-10 text-red-600" />
              </div>
              <h3 className="text-2xl font-black text-slate-800 uppercase tracking-tight mb-2">Hapus Data?</h3>
              <p className="text-sm font-medium text-slate-500 mb-8">
                Anda akan menghapus {deleteModal.type === 'menu' ? 'menu' : 'user'} <br/>
                <span className="font-black text-slate-800 text-lg">"{deleteModal.name}"</span>
                <br/>secara permanen.
              </p>
              
              <div className="w-full space-y-3">
                 <button 
                    disabled={isDeleting}
                    onClick={executeDelete} 
                    className="w-full py-5 bg-red-600 text-white rounded-[2rem] font-black uppercase text-xs tracking-[0.2em] shadow-xl shadow-red-200 hover:bg-red-700 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-70"
                 >
                    {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                    {isDeleting ? 'MENGHAPUS...' : 'YA, HAPUS SEKARANG'}
                 </button>
                 <button 
                    disabled={isDeleting}
                    onClick={() => setDeleteModal(null)} 
                    className="w-full py-5 bg-slate-100 text-slate-600 rounded-[2rem] font-black uppercase text-xs tracking-[0.2em] hover:bg-slate-200 transition-all"
                 >
                    BATALKAN
                 </button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default OwnerPage;
