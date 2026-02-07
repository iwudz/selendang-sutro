import { useEffect, useState, useRef } from 'react';
import { RealtimeChannel } from '@supabase/supabase-js';
import type { User, Order, MenuItem, MenuCategory } from '../types';
import { OrderStatus } from '../types';
import { INITIAL_USERS, INITIAL_MENU_ITEMS, SUPABASE_CONFIG } from '../constants';
import { supabase } from '../services/supabase';

interface SupabaseData {
    orders: Order[];
    menuItems: MenuItem[];
    users: User[];
}

const mapMenuItem = (m: Record<string, unknown>): MenuItem => ({
    id: m.id?.toString() || '',
    name: m.name as string || '',
    price: m.price as number || 0,
    category: (m.category as MenuCategory) || 'Menu Utama',
    image: m.image as string || '',
    isSoldOut: m.is_sold_out as boolean || false
});

const mapUser = (u: Record<string, unknown>): User => ({
    id: u.id?.toString() || '',
    name: u.name as string || '',
    role: u.role as User['role'] || 'WAITER',
    pin: u.pin as string || ''
});

const mapOrder = (o: Record<string, unknown>): Order => ({
    id: o.id?.toString() || '',
    tableNumber: (o.table_number as string) || '',
    items: (o.items as Order['items']) || [],
    notes: (o.notes as string) || '',
    status: (o.status as OrderStatus) || OrderStatus.NEW_ORDER,
    totalPrice: (o.total_price as number) || 0,
    createdAt: o.created_at ? new Date(o.created_at as string).getTime() : Date.now(),
    verifiedAt: o.verified_at ? new Date(o.verified_at as string).getTime() : undefined,
    servedAt: o.served_at ? new Date(o.served_at as string).getTime() : undefined,
    paidAt: o.paid_at ? new Date(o.paid_at as string).getTime() : undefined,
    waiterId: (o.waiter_id as string) || '',
    paymentMethod: (o.payment_method as Order['paymentMethod']) || undefined
});

const useSupabase = () => {
    const [data, setData] = useState<SupabaseData>({
        orders: [],
        menuItems: INITIAL_MENU_ITEMS,
        users: INITIAL_USERS
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const channelsRef = useRef<RealtimeChannel[]>([]);

    const fetchInitialData = async () => {
        if (!SUPABASE_CONFIG.URL || !SUPABASE_CONFIG.ANON_KEY) {
            const savedOrders = localStorage.getItem('nusantara_orders');
            const savedMenu = localStorage.getItem('nusantara_menu');
            const savedUsers = localStorage.getItem('nusantara_users');

            if (savedOrders) setData(prev => ({ ...prev, orders: JSON.parse(savedOrders) }));
            if (savedMenu) setData(prev => ({ ...prev, menuItems: JSON.parse(savedMenu) }));
            if (savedUsers) setData(prev => ({ ...prev, users: JSON.parse(savedUsers) }));

            setLoading(false);
            return;
        }

        try {
            const { data: menuData, error: menuError } = await supabase
                .from('menu_items')
                .select('*')
                .order('name');
            
            if (menuError) throw menuError;
            
            const mappedMenu = (menuData || []).map(mapMenuItem);
            setData(prev => ({ ...prev, menuItems: mappedMenu.length > 0 ? mappedMenu : INITIAL_MENU_ITEMS }));

            const { data: userData, error: userError } = await supabase
                .from('users')
                .select('*');
            
            if (userError) throw userError;
            
            const mappedUsers = (userData || []).map(mapUser);
            setData(prev => ({ ...prev, users: mappedUsers.length > 0 ? mappedUsers : INITIAL_USERS }));

            const { data: orderData, error: orderError } = await supabase
                .from('orders')
                .select('*')
                .order('created_at', { ascending: false });
            
            if (orderError) throw orderError;
            
            const mappedOrders = (orderData || []).map(mapOrder);
            setData(prev => ({ ...prev, orders: mappedOrders }));

            setLoading(false);
        } catch (err: any) {
            console.error("Gagal sinkronisasi Supabase:", err);
            setError("Gagal terhubung ke database. Cek internet atau konfigurasi API Key.");
            setLoading(false);
        }
    };

    const setupRealtimeSubscription = () => {
        if (!SUPABASE_CONFIG.URL || !SUPABASE_CONFIG.ANON_KEY) return;

        const orderChannel = supabase
            .channel('orders-changes')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'orders' },
                (payload) => {
                    if (payload.eventType === 'INSERT') {
                        const newOrder = mapOrder(payload.new as Record<string, unknown>);
                        setData(prev => ({
                            ...prev,
                            orders: [newOrder, ...prev.orders]
                        }));
                    } else if (payload.eventType === 'UPDATE') {
                        const updatedOrder = mapOrder(payload.new as Record<string, unknown>);
                        setData(prev => ({
                            ...prev,
                            orders: prev.orders.map(o => o.id === updatedOrder.id ? updatedOrder : o)
                        }));
                    } else if (payload.eventType === 'DELETE') {
                        const deletedId = payload.old.id?.toString() || '';
                        setData(prev => ({
                            ...prev,
                            orders: prev.orders.filter(o => o.id !== deletedId)
                        }));
                    }
                }
            )
            .subscribe();

        const menuChannel = supabase
            .channel('menu-changes')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'menu_items' },
                (payload) => {
                    if (payload.eventType === 'UPDATE') {
                        const updatedItem = mapMenuItem(payload.new as Record<string, unknown>);
                        setData(prev => ({
                            ...prev,
                            menuItems: prev.menuItems.map(m => m.id === updatedItem.id ? updatedItem : m)
                        }));
                    }
                }
            )
            .subscribe();

        channelsRef.current = [orderChannel, menuChannel];
    };

    useEffect(() => {
        fetchInitialData();
    }, []);

    useEffect(() => {
        if (!loading && SUPABASE_CONFIG.URL && SUPABASE_CONFIG.ANON_KEY) {
            setupRealtimeSubscription();
        }

        return () => {
            channelsRef.current.forEach(channel => {
                supabase.removeChannel(channel);
            });
            channelsRef.current = [];
        };
    }, [loading]);

    return { data, loading, error, fetchInitialData };
};

export default useSupabase;
