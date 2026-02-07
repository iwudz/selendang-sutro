import { RealtimeChannel } from '@supabase/supabase-js';
import type { Order, MenuItem, PaymentMethod, MenuCategory } from '../types';
import { OrderStatus } from '../types';
import { SUPABASE_CONFIG } from '../constants';
import { supabase } from './supabase';

const getHeaders = () => ({
    'Content-Type': 'application/json',
    'apikey': SUPABASE_CONFIG.ANON_KEY,
    'Authorization': `Bearer ${SUPABASE_CONFIG.ANON_KEY}`,
    'Prefer': 'return=representation'
});

const getBaseUrl = () => SUPABASE_CONFIG.URL.replace(/\/$/, '');

export const api = {
    orders: {
        create: async (newOrder: Order): Promise<string | null> => {
            if (!SUPABASE_CONFIG.URL || !SUPABASE_CONFIG.ANON_KEY) return newOrder.id;

            let tableNumberValue: number | string = newOrder.tableNumber;
            const numericTableNumber = parseInt(newOrder.tableNumber);
            if (!isNaN(numericTableNumber)) {
                tableNumberValue = numericTableNumber;
            }

            const dbOrder = {
                id: newOrder.id,
                table_number: tableNumberValue,
                items: newOrder.items,
                notes: newOrder.notes,
                status: newOrder.status,
                total_price: newOrder.totalPrice,
                created_at: newOrder.createdAt,
                waiter_id: newOrder.waiterId
            };

            const res = await fetch(`${getBaseUrl()}/rest/v1/orders`, {
                method: 'POST',
                headers: getHeaders(),
                body: JSON.stringify(dbOrder)
            });

            if (!res.ok) {
                const errorText = await res.text();
                throw new Error(errorText);
            }

            const data = await res.json();
            if (data && data.length > 0) {
                return data[0].id.toString();
            }
            return null;
        },

        updateStatus: async (
            orderId: string,
            status: OrderStatus,
            paymentMethod?: PaymentMethod
        ): Promise<void> => {
            if (!SUPABASE_CONFIG.URL || !SUPABASE_CONFIG.ANON_KEY) return;

            const now = Date.now();
            const updateData: Record<string, unknown> = { status };
            if (status === OrderStatus.COOKING) updateData.cooking_at = now;
            if (status === OrderStatus.SERVED) updateData.served_at = now;
            if (status === OrderStatus.PAID) {
                updateData.paid_at = now;
                if (paymentMethod) updateData.payment_method = paymentMethod;
            }

            const res = await fetch(`${getBaseUrl()}/rest/v1/orders?id=eq.${orderId}`, {
                method: 'PATCH',
                headers: getHeaders(),
                body: JSON.stringify(updateData)
            });

            if (!res.ok) throw new Error(await res.text());
        },

        update: async (orderId: string, updatedOrder: Order): Promise<void> => {
            if (!SUPABASE_CONFIG.URL || !SUPABASE_CONFIG.ANON_KEY) return;

            const dbOrder = {
                table_number: updatedOrder.tableNumber,
                items: updatedOrder.items,
                notes: updatedOrder.notes,
                total_price: updatedOrder.totalPrice
            };

            await fetch(`${getBaseUrl()}/rest/v1/orders?id=eq.${orderId}`, {
                method: 'PATCH',
                headers: getHeaders(),
                body: JSON.stringify(dbOrder)
            });
        },

        delete: async (orderId: string): Promise<void> => {
            if (!SUPABASE_CONFIG.URL || !SUPABASE_CONFIG.ANON_KEY) return;

            await fetch(`${getBaseUrl()}/rest/v1/orders?id=eq.${orderId}`, {
                method: 'DELETE',
                headers: getHeaders()
            });
        }
    },

    menu: {
        toggleSoldOut: async (itemId: string, isSoldOut: boolean): Promise<void> => {
            if (!SUPABASE_CONFIG.URL || !SUPABASE_CONFIG.ANON_KEY) return;

            await fetch(`${getBaseUrl()}/rest/v1/menu_items?id=eq.${itemId}`, {
                method: 'PATCH',
                headers: getHeaders(),
                body: JSON.stringify({ is_sold_out: isSoldOut })
            });
        }
    }
};

export const subscribeToOrders = (
    onInsert: (order: Order) => void,
    onUpdate: (order: Order) => void,
    onDelete: (orderId: string) => void
): RealtimeChannel | null => {
    if (!SUPABASE_CONFIG.URL || !SUPABASE_CONFIG.ANON_KEY) return null;

    const channel = supabase
        .channel('orders-api-changes')
        .on(
            'postgres_changes',
            { event: '*', schema: 'public', table: 'orders' },
            (payload) => {
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

                if (payload.eventType === 'INSERT') {
                    onInsert(mapOrder(payload.new as Record<string, unknown>));
                } else if (payload.eventType === 'UPDATE') {
                    onUpdate(mapOrder(payload.new as Record<string, unknown>));
                } else if (payload.eventType === 'DELETE') {
                    const deletedId = payload.old.id?.toString() || '';
                    onDelete(deletedId);
                }
            }
        )
        .subscribe();

    return channel;
};

export const subscribeToMenu = (
    onUpdate: (item: MenuItem) => void
): RealtimeChannel | null => {
    if (!SUPABASE_CONFIG.URL || !SUPABASE_CONFIG.ANON_KEY) return null;

    const channel = supabase
        .channel('menu-api-changes')
        .on(
            'postgres_changes',
            { event: 'UPDATE', schema: 'public', table: 'menu_items' },
            (payload) => {
                const updatedItem: MenuItem = {
                    id: payload.new.id?.toString() || '',
                    name: payload.new.name as string || '',
                    price: payload.new.price as number || 0,
                    category: (payload.new.category as MenuCategory) || 'Menu Utama',
                    image: payload.new.image as string || '',
                    isSoldOut: payload.new.is_sold_out as boolean || false
                };
                onUpdate(updatedItem);
            }
        )
        .subscribe();

    return channel;
};

export const unsubscribe = (channel: RealtimeChannel | null): void => {
    if (channel) {
        supabase.removeChannel(channel);
    }
};
