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
    cookingAt: o.cooking_at ? new Date(o.cooking_at as string).getTime() : undefined,
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
    const [isConnected, setIsConnected] = useState(false);
    const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
    const channelsRef = useRef<RealtimeChannel[]>([]);
    const isSubscribed = useRef(false);

    const fetchFromSupabase = async () => {
        if (!SUPABASE_CONFIG.URL || !SUPABASE_CONFIG.ANON_KEY) return;

        try {
            const [menuResult, userResult, orderResult] = await Promise.all([
                supabase.from('menu_items').select('*').order('name'),
                supabase.from('users').select('*'),
                supabase.from('orders').select('*').order('created_at', { ascending: false })
            ]);

            if (menuResult.error || userResult.error || orderResult.error) return;

            const newMappedMenu = (menuResult.data || []).map(mapMenuItem);
            const newMappedUsers = (userResult.data || []).map(mapUser);
            const newMappedOrders = (orderResult.data || []).map(mapOrder);

            setData(prev => {
                const menuChanged = JSON.stringify(prev.menuItems) !== JSON.stringify(newMappedMenu);
                const usersChanged = JSON.stringify(prev.users) !== JSON.stringify(newMappedUsers);
                const ordersChanged = JSON.stringify(prev.orders) !== JSON.stringify(newMappedOrders);
                
                if (!menuChanged && !usersChanged && !ordersChanged) {
                    return prev;
                }

                return {
                    orders: newMappedOrders,
                    menuItems: newMappedMenu.length > 0 ? newMappedMenu : prev.menuItems,
                    users: newMappedUsers.length > 0 ? newMappedUsers : prev.users
                };
            });
            setLastUpdated(new Date());
        } catch (err) {
            console.error('Fetch error:', err);
        }
    };

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
            const [menuResult, userResult, orderResult] = await Promise.all([
                supabase.from('menu_items').select('*').order('name'),
                supabase.from('users').select('*'),
                supabase.from('orders').select('*').order('created_at', { ascending: false })
            ]);

            if (menuResult.error) throw menuResult.error;
            if (userResult.error) throw userResult.error;
            if (orderResult.error) throw orderResult.error;

            const mappedMenu = (menuResult.data || []).map(mapMenuItem);
            const mappedUsers = (userResult.data || []).map(mapUser);
            const mappedOrders = (orderResult.data || []).map(mapOrder);

            setData({
                orders: mappedOrders,
                menuItems: mappedMenu.length > 0 ? mappedMenu : INITIAL_MENU_ITEMS,
                users: mappedUsers.length > 0 ? mappedUsers : INITIAL_USERS
            });
            setLastUpdated(new Date());
            setLoading(false);
        } catch (err: any) {
            console.error("Gagal sinkronisasi Supabase:", err);
            setError("Gagal terhubung ke database.");
            setLoading(false);
        }
    };

    const setupRealtimeSubscription = () => {
        if (!SUPABASE_CONFIG.URL || !SUPABASE_CONFIG.ANON_KEY) {
            console.log('⚠️ Supabase not configured');
            return;
        }
        if (isSubscribed.current) {
            console.log('⚠️ Already subscribed');
            return;
        }
        
        isSubscribed.current = true;

        console.log('🔌 Connecting to Supabase realtime...');

        const channel = supabase.channel('test-channel');
        
        channel
            .on('postgres_changes', { 
                event: 'INSERT', 
                schema: 'public', 
                table: 'orders' 
            }, (payload) => {
                console.log('🎯 ORDER INSERT DETECTED!', payload);
                fetchFromSupabase();
            })
            .on('postgres_changes', { 
                event: 'UPDATE', 
                schema: 'public', 
                table: 'orders' 
            }, (payload) => {
                console.log('🎯 ORDER UPDATE DETECTED!', payload);
                fetchFromSupabase();
            })
            .on('postgres_changes', { 
                event: 'UPDATE', 
                schema: 'public', 
                table: 'menu_items' 
            }, (payload) => {
                console.log('🎯 MENU UPDATE DETECTED!', payload);
                fetchFromSupabase();
            })
            .subscribe((status, err) => {
                console.log('📻 Subscription status:', status, err);
                if (status === 'SUBSCRIBED') {
                    console.log('✅ Connected!');
                    setIsConnected(true);
                    
                    // Verify subscription dengan test
                    channel.track({ online_at: new Date().toISOString() })
                        .then(() => console.log('✅ Presence tracked'))
                        .catch(e => console.log('❌ Presence error:', e));
                }
                if (status === 'CLOSED' || status === 'CHANNEL_ERROR') {
                    console.log('❌ Disconnected:', err);
                    isSubscribed.current = false;
                    setIsConnected(false);
                }
            });

        channelsRef.current = [channel];
    };

    useEffect(() => {
        fetchInitialData();
        return () => {
            channelsRef.current.forEach(channel => {
                supabase.removeChannel(channel);
            });
            channelsRef.current = [];
            isSubscribed.current = false;
        };
    }, []);

    useEffect(() => {
        if (!loading && SUPABASE_CONFIG.URL && SUPABASE_CONFIG.ANON_KEY) {
            setupRealtimeSubscription();
        }
    }, [loading]);

    return { data, loading, error, refresh: fetchFromSupabase, isConnected, lastUpdated };
};

export default useSupabase;
