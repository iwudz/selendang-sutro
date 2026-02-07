import React from 'react';
import type { Order } from '../types';
import { OrderStatus, PaymentMethod } from '../types';
import { X, Clock, Calendar, CreditCard, FileText } from 'lucide-react';

interface OrderDetailModalProps {
    order: Order | null;
    onClose: () => void;
    onUpdateStatus?: (orderId: string, status: OrderStatus, paymentMethod?: PaymentMethod) => void;
}

const OrderDetailModal: React.FC<OrderDetailModalProps> = ({
    order,
    onClose,
    onUpdateStatus
}) => {
    if (!order) return null;

    const getStatusColor = (status: OrderStatus) => {
        switch (status) {
            case OrderStatus.NEW_ORDER:
                return 'bg-amber-100 text-amber-800 border-amber-200';
            case OrderStatus.COOKING:
                return 'bg-blue-100 text-blue-800 border-blue-200';
            case OrderStatus.SERVED:
                return 'bg-emerald-100 text-emerald-800 border-emerald-200';
            case OrderStatus.PAID:
                return 'bg-slate-100 text-slate-800 border-slate-200';
            default:
                return 'bg-slate-100 text-slate-800 border-slate-200';
        }
    };

    const formatDate = (timestamp: number) => {
        return new Date(timestamp).toLocaleDateString('id-ID', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        });
    };

    const formatTime = (timestamp: number) => {
        return new Date(timestamp).toLocaleTimeString('id-ID', {
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const getWaitTime = () => {
        const minutes = Math.floor((Date.now() - order.createdAt) / 60000);
        if (minutes < 60) return `${minutes} menit`;
        const hours = Math.floor(minutes / 60);
        return `${hours} jam ${minutes % 60} menit`;
    };

    return (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-lg rounded-[2rem] shadow-2xl overflow-hidden animate-in zoom-in-95">
                <div className="p-6 border-b flex justify-between items-center">
                    <div>
                        <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight leading-none">
                            Meja {order.tableNumber}
                        </h3>
                        <p className="text-sm text-slate-500 mt-1">Order #{order.id.slice(-8)}</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-slate-100 rounded-full transition-colors"
                    >
                        <X className="w-5 h-5 text-slate-400" />
                    </button>
                </div>

                <div className="p-6 space-y-6 max-h-[60vh] overflow-y-auto">
                    <div className="flex items-center justify-between">
                        <span className={`px-4 py-2 rounded-full text-sm font-black uppercase border ${getStatusColor(order.status)}`}>
                            {order.status.replace('_', ' ')}
                        </span>
                        <div className="flex items-center gap-2 text-slate-500">
                            <Clock className="w-4 h-4" />
                            <span className="text-sm">{getWaitTime()}</span>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-slate-50 rounded-xl p-4">
                            <div className="flex items-center gap-2 text-slate-500 mb-1">
                                <Calendar className="w-4 h-4" />
                                <span className="text-xs font-medium uppercase">Tanggal</span>
                            </div>
                            <p className="text-sm font-semibold text-slate-800">{formatDate(order.createdAt)}</p>
                        </div>
                        <div className="bg-slate-50 rounded-xl p-4">
                            <div className="flex items-center gap-2 text-slate-500 mb-1">
                                <Clock className="w-4 h-4" />
                                <span className="text-xs font-medium uppercase">Waktu</span>
                            </div>
                            <p className="text-sm font-semibold text-slate-800">{formatTime(order.createdAt)}</p>
                        </div>
                    </div>

                    {order.paymentMethod && (
                        <div className="bg-slate-50 rounded-xl p-4">
                            <div className="flex items-center gap-2 text-slate-500 mb-1">
                                <CreditCard className="w-4 h-4" />
                                <span className="text-xs font-medium uppercase">Pembayaran</span>
                            </div>
                            <p className="text-sm font-semibold text-slate-800">
                                {order.paymentMethod === PaymentMethod.CASH ? 'Tunai' : 'QRIS'}
                            </p>
                        </div>
                    )}

                    <div>
                        <h4 className="text-sm font-black text-slate-800 uppercase tracking-wider mb-3">Items</h4>
                        <div className="bg-slate-50 rounded-xl p-4 space-y-3">
                            {order.items.map((item) => (
                                <div key={item.id} className="flex justify-between items-center">
                                    <div className="flex items-center gap-3">
                                        <span className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center text-emerald-700 font-bold text-sm">
                                            {item.quantity}x
                                        </span>
                                        <span className="text-slate-700 font-medium">{item.menuItem.name}</span>
                                    </div>
                                    <span className="text-slate-600">
                                        Rp {(item.menuItem.price * item.quantity).toLocaleString('id-ID')}
                                    </span>
                                </div>
                            ))}
                            <div className="pt-3 border-t border-slate-200 flex justify-between items-center">
                                <span className="font-black text-slate-800 uppercase">Total</span>
                                <span className="text-xl font-black text-emerald-700">
                                    Rp {order.totalPrice.toLocaleString('id-ID')}
                                </span>
                            </div>
                        </div>
                    </div>

                    {order.notes && (
                        <div>
                            <h4 className="text-sm font-black text-slate-800 uppercase tracking-wider mb-2">Catatan</h4>
                            <div className="bg-amber-50 border border-amber-100 rounded-xl p-4">
                                <div className="flex items-start gap-2">
                                    <FileText className="w-4 h-4 text-amber-600 mt-0.5" />
                                    <p className="text-sm text-amber-800 italic">{order.notes}</p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                <div className="p-6 border-t bg-slate-50">
                    {onUpdateStatus && order.status !== OrderStatus.PAID && (
                        <div className="flex gap-3">
                            {order.status === OrderStatus.NEW_ORDER && (
                                <button
                                    onClick={() => {
                                        onUpdateStatus(order.id, OrderStatus.COOKING);
                                        onClose();
                                    }}
                                    className="flex-1 py-3 bg-blue-600 text-white rounded-xl font-black text-sm uppercase tracking-wide hover:bg-blue-700 transition-colors"
                                >
                                    Mulai Masak
                                </button>
                            )}
                            {order.status === OrderStatus.COOKING && (
                                <button
                                    onClick={() => {
                                        onUpdateStatus(order.id, OrderStatus.SERVED);
                                        onClose();
                                    }}
                                    className="flex-1 py-3 bg-emerald-600 text-white rounded-xl font-black text-sm uppercase tracking-wide hover:bg-emerald-700 transition-colors"
                                >
                                    Selesai Masak
                                </button>
                            )}
                            {order.status === OrderStatus.SERVED && (
                                <button
                                    onClick={() => {
                                        onUpdateStatus(order.id, OrderStatus.PAID, PaymentMethod.CASH);
                                        onClose();
                                    }}
                                    className="flex-1 py-3 bg-slate-800 text-white rounded-xl font-black text-sm uppercase tracking-wide hover:bg-slate-900 transition-colors"
                                >
                                    Tandai Lunas
                                </button>
                            )}
                        </div>
                    )}
                    <button
                        onClick={onClose}
                        className="w-full py-3 text-slate-600 font-medium hover:text-slate-800 transition-colors"
                    >
                        Tutup
                    </button>
                </div>
            </div>
        </div>
    );
};

export default OrderDetailModal;
