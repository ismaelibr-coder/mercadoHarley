import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { getAllOrders, updateOrderStatus } from '../../services/orderService';
import { useNavigate, Link } from 'react-router-dom';
import { Package, Search, Filter, ChevronDown, ChevronUp, CheckCircle, XCircle, Clock, Truck, AlertCircle } from 'lucide-react';

const AdminOrdersPage = () => {
    const { currentUser, isAdmin } = useAuth();
    const navigate = useNavigate();
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [filterStatus, setFilterStatus] = useState('all');
    const [searchTerm, setSearchTerm] = useState('');
    const [updatingId, setUpdatingId] = useState(null);

    useEffect(() => {
        if (!currentUser || !isAdmin) {
            navigate('/'); // Redirect if not admin
            return;
        }

        fetchOrders();
    }, [currentUser, isAdmin, navigate]);

    const fetchOrders = async () => {
        try {
            setLoading(true);
            const allOrders = await getAllOrders();
            setOrders(allOrders);
        } catch (err) {
            console.error('Error fetching orders:', err);
            setError('Erro ao carregar pedidos.');
        } finally {
            setLoading(false);
        }
    };

    const handleStatusUpdate = async (orderId, newStatus) => {
        try {
            setUpdatingId(orderId);
            await updateOrderStatus(orderId, newStatus);

            // Update local state
            setOrders(orders.map(order =>
                order.id === orderId ? { ...order, status: newStatus } : order
            ));
        } catch (err) {
            console.error('Error updating status:', err);
            alert('Erro ao atualizar status do pedido.');
        } finally {
            setUpdatingId(null);
        }
    };

    const getStatusColor = (status) => {
        const normalizedStatus = status === 'approved' ? 'paid' : status;
        switch (normalizedStatus) {
            case 'paid': return 'bg-green-500/10 text-green-500 border-green-500/20';
            case 'pending': return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
            case 'processing': return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
            case 'shipped': return 'bg-purple-500/10 text-purple-500 border-purple-500/20';
            case 'delivered': return 'bg-green-500/10 text-green-500 border-green-500/20';
            case 'cancelled': return 'bg-red-500/10 text-red-500 border-red-500/20';
            default: return 'bg-gray-500/10 text-gray-500 border-gray-500/20';
        }
    };

    const getStatusLabel = (status) => {
        const normalizedStatus = status === 'approved' ? 'paid' : status;
        switch (normalizedStatus) {
            case 'paid': return 'Pago';
            case 'pending': return 'Pendente';
            case 'processing': return 'Em Processamento';
            case 'shipped': return 'Enviado';
            case 'delivered': return 'Entregue';
            case 'cancelled': return 'Cancelado';
            default: return status;
        }
    };

    const filteredOrders = orders.filter(order => {
        const normalizedStatus = order.status === 'approved' ? 'paid' : order.status;
        const matchesStatus = filterStatus === 'all' || normalizedStatus === filterStatus;

        const searchLower = searchTerm.toLowerCase();
        const dateString = order.createdAt?.toDate ? order.createdAt.toDate().toLocaleDateString() : '';
        const statusLabel = getStatusLabel(order.status).toLowerCase();
        const totalString = order.total?.toFixed(2) || '';

        const matchesSearch =
            order.orderNumber?.toLowerCase().includes(searchLower) ||
            order.customer?.email?.toLowerCase().includes(searchLower) ||
            order.customer?.name?.toLowerCase().includes(searchLower) ||
            dateString.includes(searchLower) ||
            statusLabel.includes(searchLower) ||
            totalString.includes(searchLower);

        if (order.orderNumber === 'HD-2025-600190') {
            console.log(`Debug Search: Term="${searchTerm}", OrderNum="${order.orderNumber}", Match=${matchesSearch}`);
        }

        return matchesStatus && matchesSearch;
    });

    if (loading) {
        return (
            <div className="min-h-screen bg-black pt-24 pb-12 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-harley-orange"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-black pt-24 pb-12">
            <div className="container mx-auto px-4">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                    <div>
                        <h1 className="text-3xl font-display font-bold text-white uppercase tracking-wide mb-2">
                            Gerenciar <span className="text-harley-orange">Pedidos</span>
                        </h1>
                        <p className="text-gray-400">
                            Total de pedidos: {orders.length}
                        </p>
                    </div>

                    <div className="flex flex-col md:flex-row gap-4 w-full md:w-auto">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 w-5 h-5" />
                            <input
                                type="text"
                                placeholder="Buscar por nº, nome ou email..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="bg-gray-900 border border-gray-800 text-white pl-10 pr-4 py-2 rounded focus:outline-none focus:border-harley-orange w-full md:w-64"
                            />
                        </div>

                        <div className="relative">
                            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 w-5 h-5" />
                            <select
                                value={filterStatus}
                                onChange={(e) => setFilterStatus(e.target.value)}
                                className="bg-gray-900 border border-gray-800 text-white pl-10 pr-8 py-2 rounded focus:outline-none focus:border-harley-orange appearance-none w-full md:w-48 cursor-pointer"
                            >
                                <option value="all">Todos os Status</option>
                                <option value="pending">Pendente</option>
                                <option value="paid">Pago</option>
                                <option value="processing">Em Processamento</option>
                                <option value="shipped">Enviado</option>
                                <option value="delivered">Entregue</option>
                                <option value="cancelled">Cancelado</option>
                            </select>
                            <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 w-4 h-4 pointer-events-none" />
                        </div>
                    </div>
                </div>

                {error && (
                    <div className="bg-red-500/10 border border-red-500/20 text-red-500 p-4 rounded mb-6 flex items-center gap-2">
                        <AlertCircle className="w-5 h-5" />
                        {error}
                    </div>
                )}

                <div className="bg-gray-900 rounded-lg border border-gray-800 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="bg-black/50 border-b border-gray-800">
                                    <th className="p-4 text-gray-400 font-bold uppercase text-sm">Pedido</th>
                                    <th className="p-4 text-gray-400 font-bold uppercase text-sm">Cliente</th>
                                    <th className="p-4 text-gray-400 font-bold uppercase text-sm">Data</th>
                                    <th className="p-4 text-gray-400 font-bold uppercase text-sm">Total</th>
                                    <th className="p-4 text-gray-400 font-bold uppercase text-sm">Status</th>
                                    <th className="p-4 text-gray-400 font-bold uppercase text-sm">Ações</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-800">
                                {filteredOrders.map((order) => (
                                    <tr key={order.id} className="hover:bg-black/30 transition-colors">
                                        <td className="p-4">
                                            <Link to={`/admin/orders/${order.id}`} className="font-mono font-bold text-white hover:text-harley-orange transition-colors">
                                                {order.orderNumber}
                                            </Link>
                                        </td>
                                        <td className="p-4">
                                            <div className="flex flex-col">
                                                <span className="text-white font-bold">{order.customer?.name}</span>
                                                <span className="text-gray-500 text-sm">{order.customer?.email}</span>
                                            </div>
                                        </td>
                                        <td className="p-4 text-gray-400">
                                            {order.createdAt?.toDate ? order.createdAt.toDate().toLocaleDateString() : new Date().toLocaleDateString()}
                                        </td>
                                        <td className="p-4 text-harley-orange font-bold">
                                            R$ {order.total?.toFixed(2)}
                                        </td>
                                        <td className="p-4">
                                            <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase border ${getStatusColor(order.status)}`}>
                                                {getStatusLabel(order.status)}
                                            </span>
                                        </td>
                                        <td className="p-4">
                                            <select
                                                value={order.status}
                                                onChange={(e) => handleStatusUpdate(order.id, e.target.value)}
                                                disabled={updatingId === order.id}
                                                className="bg-black border border-gray-700 text-gray-300 text-sm rounded px-2 py-1 focus:outline-none focus:border-harley-orange cursor-pointer disabled:opacity-50"
                                            >
                                                <option value="pending">Pendente</option>
                                                <option value="paid">Pago</option>
                                                <option value="processing">Processando</option>
                                                <option value="shipped">Enviado</option>
                                                <option value="delivered">Entregue</option>
                                                <option value="cancelled">Cancelado</option>
                                            </select>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {filteredOrders.length === 0 && (
                        <div className="p-12 text-center text-gray-500">
                            <Package className="w-12 h-12 mx-auto mb-4 opacity-50" />
                            <p>Nenhum pedido encontrado.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AdminOrdersPage;
