import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { getUserOrders } from '../services/orderService';
import { useNavigate } from 'react-router-dom';
import { Package, Clock, CheckCircle, XCircle, Truck, ChevronRight, ShoppingBag } from 'lucide-react';

const MyOrdersPage = () => {
    const { currentUser } = useAuth();
    const navigate = useNavigate();
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchOrders = async () => {
            if (!currentUser) return;

            try {
                const userOrders = await getUserOrders(currentUser.uid);
                setOrders(userOrders);
            } catch (err) {
                console.error('Error fetching orders:', err);
                setError('Não foi possível carregar seus pedidos.');
            } finally {
                setLoading(false);
            }
        };

        fetchOrders();
    }, [currentUser]);

    const getStatusColor = (status) => {
        switch (status) {
            case 'paid': return 'text-green-500 bg-green-500/10 border-green-500/20';
            case 'pending': return 'text-yellow-500 bg-yellow-500/10 border-yellow-500/20';
            case 'shipped': return 'text-blue-500 bg-blue-500/10 border-blue-500/20';
            case 'delivered': return 'text-purple-500 bg-purple-500/10 border-purple-500/20';
            case 'cancelled': return 'text-red-500 bg-red-500/10 border-red-500/20';
            default: return 'text-gray-400 bg-gray-800 border-gray-700';
        }
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case 'paid': return <CheckCircle className="w-4 h-4" />;
            case 'pending': return <Clock className="w-4 h-4" />;
            case 'shipped': return <Truck className="w-4 h-4" />;
            case 'delivered': return <Package className="w-4 h-4" />;
            case 'cancelled': return <XCircle className="w-4 h-4" />;
            default: return <Clock className="w-4 h-4" />;
        }
    };

    const getStatusLabel = (status) => {
        switch (status) {
            case 'paid': return 'Pago';
            case 'pending': return 'Pendente';
            case 'shipped': return 'Enviado';
            case 'delivered': return 'Entregue';
            case 'cancelled': return 'Cancelado';
            default: return status;
        }
    };

    const formatDate = (timestamp) => {
        if (!timestamp) return '';
        // Handle Firebase Timestamp or Date object
        const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
        return new Intl.DateTimeFormat('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        }).format(date);
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-black pt-24 pb-12 flex justify-center items-center">
                <div className="w-8 h-8 border-2 border-harley-orange border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-black pt-24 pb-12">
            <div className="container mx-auto px-4">
                <h1 className="text-3xl font-display font-bold text-white mb-8 uppercase flex items-center gap-3">
                    <ShoppingBag className="w-8 h-8 text-harley-orange" />
                    Meus Pedidos
                </h1>

                {error && (
                    <div className="bg-red-500/10 border border-red-500/20 text-red-500 p-4 rounded mb-8">
                        {error}
                    </div>
                )}

                {orders.length === 0 ? (
                    <div className="bg-gray-900 rounded-lg border border-gray-800 p-12 text-center">
                        <Package className="w-16 h-16 text-gray-700 mx-auto mb-4" />
                        <h2 className="text-xl font-bold text-white mb-2">Você ainda não tem pedidos</h2>
                        <p className="text-gray-400 mb-6">Explore nossa loja e encontre as melhores peças para sua moto.</p>
                        <button
                            onClick={() => navigate('/')}
                            className="bg-harley-orange text-white px-6 py-3 rounded font-bold hover:bg-orange-700 transition-colors uppercase"
                        >
                            Ir para a Loja
                        </button>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {orders.map((order) => (
                            <div
                                key={order.id}
                                onClick={() => navigate(`/order-confirmation/${order.id}`)}
                                className="bg-gray-900 rounded-lg border border-gray-800 p-6 hover:border-harley-orange/50 transition-colors cursor-pointer group"
                            >
                                <div className="flex flex-col md:flex-row justify-between gap-4">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-2">
                                            <span className="text-white font-bold text-lg">#{order.orderNumber}</span>
                                            <span className={`px-3 py-1 rounded-full text-xs font-bold border flex items-center gap-1 ${getStatusColor(order.status)}`}>
                                                {getStatusIcon(order.status)}
                                                {getStatusLabel(order.status)}
                                            </span>
                                        </div>
                                        <p className="text-gray-400 text-sm mb-1">
                                            Realizado em {formatDate(order.createdAt)}
                                        </p>
                                        <p className="text-gray-400 text-sm">
                                            {order.items?.length || 0} {order.items?.length === 1 ? 'item' : 'itens'}
                                        </p>
                                    </div>

                                    <div className="flex items-center justify-between md:justify-end gap-6">
                                        <div className="text-right">
                                            <p className="text-gray-400 text-xs uppercase mb-1">Total</p>
                                            <p className="text-white font-bold text-xl">
                                                R$ {order.total?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                            </p>
                                        </div>
                                        <ChevronRight className="w-6 h-6 text-gray-600 group-hover:text-harley-orange transition-colors" />
                                    </div>
                                </div>

                                {/* Items Preview (Optional - show first item image) */}
                                {order.items && order.items.length > 0 && (
                                    <div className="mt-4 pt-4 border-t border-gray-800 flex gap-2 overflow-x-auto">
                                        {order.items.slice(0, 5).map((item, index) => (
                                            <div key={index} className="w-12 h-12 bg-gray-800 rounded overflow-hidden flex-shrink-0" title={item.name}>
                                                <img src={item.image} alt={item.name} className="w-full h-full object-cover opacity-70 group-hover:opacity-100 transition-opacity" />
                                            </div>
                                        ))}
                                        {order.items.length > 5 && (
                                            <div className="w-12 h-12 bg-gray-800 rounded flex items-center justify-center text-gray-500 text-xs font-bold">
                                                +{order.items.length - 5}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default MyOrdersPage;
