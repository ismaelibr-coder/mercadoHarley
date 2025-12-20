import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { getOrderById, updateOrderStatus } from '../../services/orderService';
import { ArrowLeft, Package, Truck, MapPin, User, CreditCard, Calendar } from 'lucide-react';
import ShippingLabelSection from '../../components/admin/ShippingLabelSection';

const AdminOrderDetailsPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [updating, setUpdating] = useState(false);

    useEffect(() => {
        const fetchOrder = async () => {
            try {
                const orderData = await getOrderById(id);
                setOrder(orderData);
            } catch (err) {
                console.error('Error fetching order:', err);
                setError('Erro ao carregar detalhes do pedido.');
            } finally {
                setLoading(false);
            }
        };

        fetchOrder();
    }, [id]);

    const handleStatusUpdate = async (newStatus) => {
        try {
            setUpdating(true);
            await updateOrderStatus(id, newStatus);
            setOrder(prev => ({ ...prev, status: newStatus }));
        } catch (err) {
            console.error('Error updating status:', err);
            alert('Erro ao atualizar status.');
        } finally {
            setUpdating(false);
        }
    };

    const handleShippingUpdate = async () => {
        // Refresh order data after shipping label operations
        try {
            const orderData = await getOrderById(id);
            setOrder(orderData);
        } catch (err) {
            console.error('Error refreshing order:', err);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-harley-orange"></div>
            </div>
        );
    }

    if (error || !order) {
        return (
            <div className="min-h-screen bg-black p-8 text-center">
                <p className="text-red-500 mb-4">{error || 'Pedido não encontrado'}</p>
                <Link to="/admin/orders" className="text-harley-orange hover:underline">
                    Voltar para Pedidos
                </Link>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-black text-white p-8">
            <div className="max-w-4xl mx-auto">
                <div className="flex items-center gap-4 mb-8">
                    <button
                        onClick={() => navigate('/admin/orders')}
                        className="p-2 hover:bg-gray-800 rounded-full transition-colors"
                    >
                        <ArrowLeft className="w-6 h-6" />
                    </button>
                    <h1 className="text-2xl font-display font-bold uppercase">
                        Pedido <span className="text-harley-orange">{order.orderNumber}</span>
                    </h1>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {/* Main Info */}
                    <div className="md:col-span-2 space-y-8">
                        {/* Items */}
                        <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
                            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                                <Package className="w-5 h-5 text-harley-orange" />
                                Itens do Pedido
                            </h2>
                            <div className="space-y-4">
                                {order.items?.map((item, index) => (
                                    <div key={index} className="flex items-center gap-4 border-b border-gray-800 pb-4 last:border-0 last:pb-0">
                                        <img
                                            src={item.image || '/placeholder.png'}
                                            alt={item.name || 'Produto'}
                                            className="w-16 h-16 object-cover rounded"
                                        />
                                        <div className="flex-1">
                                            <h3 className="font-bold">{item.name || 'Produto sem nome'}</h3>
                                            <p className="text-gray-400 text-sm">Qtd: {item.quantity || 0}</p>
                                        </div>
                                        <p className="font-bold text-harley-orange">
                                            R$ {((item.price || 0) * (item.quantity || 0)).toFixed(2)}
                                        </p>
                                    </div>
                                )) || <p className="text-gray-500">Nenhum item encontrado.</p>}
                            </div>
                            <div className="mt-6 pt-4 border-t border-gray-800 flex justify-between items-center">
                                <span className="text-gray-400">Total</span>
                                <span className="text-2xl font-bold text-harley-orange">
                                    R$ {(order.total || 0).toFixed(2)}
                                </span>
                            </div>
                        </div>

                        {/* Shipping Info */}
                        <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
                            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                                <Truck className="w-5 h-5 text-harley-orange" />
                                Entrega
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <p className="text-gray-400 text-sm mb-1">Endereço</p>
                                    <p className="font-medium">
                                        {order.shippingAddress?.street || 'Rua não informada'}, {order.shippingAddress?.number || 'S/N'}
                                        {order.shippingAddress?.complement && ` - ${order.shippingAddress.complement}`}
                                    </p>
                                    <p className="font-medium">
                                        {order.shippingAddress?.neighborhood || ''} - {order.shippingAddress?.city || ''}/{order.shippingAddress?.state || ''}
                                    </p>
                                    <p className="font-medium">{order.shippingAddress?.zipCode || ''}</p>
                                </div>
                                <div>
                                    <p className="text-gray-400 text-sm mb-1">Método de Envio</p>
                                    <p className="font-medium uppercase">{order.shippingMethod || 'Padrão'}</p>
                                </div>
                            </div>
                        </div>

                        {/* Shipping Label Section */}
                        <ShippingLabelSection
                            orderId={id}
                            shippingData={order.shipping}
                            onUpdate={handleShippingUpdate}
                        />
                    </div>

                    {/* Sidebar Info */}
                    <div className="space-y-8">
                        {/* Status */}
                        <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
                            <h2 className="text-xl font-bold mb-4">Status</h2>
                            <select
                                value={order.status}
                                onChange={(e) => handleStatusUpdate(e.target.value)}
                                disabled={updating}
                                className="w-full bg-black border border-gray-700 text-white p-3 rounded focus:outline-none focus:border-harley-orange mb-4"
                            >
                                <option value="pending">Pendente</option>
                                <option value="paid">Pago</option>
                                <option value="processing">Processando</option>
                                <option value="shipped">Enviado</option>
                                <option value="delivered">Entregue</option>
                                <option value="cancelled">Cancelado</option>
                            </select>
                            <div className="text-sm text-gray-400 space-y-2">
                                <p className="flex justify-between">
                                    <span>Criado em:</span>
                                    <span>{order.createdAt?.toDate ? order.createdAt.toDate().toLocaleDateString() : '-'}</span>
                                </p>
                                {order.paidAt && (
                                    <p className="flex justify-between">
                                        <span>Pago em:</span>
                                        <span>{order.paidAt.toDate().toLocaleDateString()}</span>
                                    </p>
                                )}
                            </div>
                        </div>

                        {/* Customer */}
                        <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
                            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                                <User className="w-5 h-5 text-harley-orange" />
                                Cliente
                            </h2>
                            <div className="space-y-3">
                                <div>
                                    <p className="text-gray-400 text-sm">Nome</p>
                                    <p className="font-medium">{order.customer?.name || 'Não informado'}</p>
                                </div>
                                <div>
                                    <p className="text-gray-400 text-sm">Email</p>
                                    <p className="font-medium">{order.customer?.email || 'Não informado'}</p>
                                </div>
                                <div>
                                    <p className="text-gray-400 text-sm">CPF</p>
                                    <p className="font-medium">{order.customer?.cpf || 'Não informado'}</p>
                                </div>
                                <div>
                                    <p className="text-gray-400 text-sm">Telefone</p>
                                    <p className="font-medium">{order.customer?.phone || 'Não informado'}</p>
                                </div>
                            </div>
                        </div>

                        {/* Payment */}
                        <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
                            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                                <CreditCard className="w-5 h-5 text-harley-orange" />
                                Pagamento
                            </h2>
                            <div className="space-y-3">
                                <div>
                                    <p className="text-gray-400 text-sm">Método</p>
                                    <p className="font-medium uppercase">{order.paymentMethod}</p>
                                </div>
                                {order.payment && (
                                    <div>
                                        <p className="text-gray-400 text-sm">ID Transação</p>
                                        <p className="font-mono text-xs">{order.payment.id}</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminOrderDetailsPage;
