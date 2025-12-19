import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { getOrderById } from '../services/orderService';
import { CheckCircle, Package, Truck, CreditCard, QrCode, Barcode, Printer, ArrowLeft } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';

const OrderConfirmation = () => {
    const { orderId } = useParams();
    const navigate = useNavigate();
    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadOrder();
    }, [orderId]);

    const loadOrder = async () => {
        try {
            const orderData = await getOrderById(orderId);
            setOrder(orderData);
        } catch (error) {
            console.error('Error loading order:', error);
            alert('Pedido não encontrado');
            navigate('/');
        } finally {
            setLoading(false);
        }
    };

    const handlePrint = () => {
        window.print();
    };

    const getStatusColor = (status) => {
        const colors = {
            pending: 'text-yellow-500',
            paid: 'text-blue-500',
            processing: 'text-purple-500',
            shipped: 'text-orange-500',
            delivered: 'text-green-500',
            cancelled: 'text-red-500'
        };
        return colors[status] || 'text-gray-500';
    };

    const getStatusText = (status) => {
        const texts = {
            pending: 'Aguardando Pagamento',
            paid: 'Pagamento Confirmado',
            processing: 'Em Processamento',
            shipped: 'Enviado',
            delivered: 'Entregue',
            cancelled: 'Cancelado'
        };
        return texts[status] || status;
    };

    if (loading) {
        return (
            <div className="bg-black min-h-screen flex items-center justify-center">
                <div className="text-white text-xl">Carregando pedido...</div>
            </div>
        );
    }

    if (!order) {
        return null;
    }

    return (
        <div className="bg-black min-h-screen py-12">
            <div className="container mx-auto px-4 max-w-4xl">
                {/* Success Header */}
                <div className="text-center mb-12">
                    <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-6">
                        <CheckCircle className="w-12 h-12 text-white" />
                    </div>
                    <h1 className="text-4xl font-display font-bold text-white mb-2 uppercase">
                        Pedido Confirmado!
                    </h1>
                    <p className="text-gray-400 text-lg">
                        Obrigado pela sua compra, {order.customer.name.split(' ')[0]}!
                    </p>
                </div>

                {/* Order Info Card */}
                <div className="bg-gray-900 border border-gray-800 rounded-lg p-8 mb-6">
                    <div className="flex items-center justify-between mb-6 pb-6 border-b border-gray-800">
                        <div>
                            <h2 className="text-2xl font-bold text-white mb-2">
                                Pedido #{order.orderNumber}
                            </h2>
                            <p className="text-gray-400">
                                {new Date(order.createdAt?.seconds * 1000 || Date.now()).toLocaleDateString('pt-BR', {
                                    day: '2-digit',
                                    month: 'long',
                                    year: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                })}
                            </p>
                        </div>
                        <div className="text-right">
                            <p className="text-gray-400 text-sm mb-1">Status</p>
                            <p className={`text-lg font-bold ${getStatusColor(order.status)}`}>
                                {getStatusText(order.status)}
                            </p>
                        </div>
                    </div>

                    {/* Payment Info */}
                    <div className="mb-8">
                        <h3 className="text-white font-bold text-lg mb-4 flex items-center gap-2">
                            <CreditCard className="w-5 h-5 text-harley-orange" />
                            Informações de Pagamento
                        </h3>

                        {order.payment.method === 'pix' && order.payment.qrCode && (
                            <div className="bg-black border border-gray-800 rounded p-6 text-center">
                                <QrCode className="w-16 h-16 mx-auto text-white mb-4" />
                                <p className="text-white font-bold mb-2">Pague com PIX</p>
                                <p className="text-gray-400 text-sm mb-4">
                                    Escaneie o QR Code abaixo ou copie o código PIX
                                </p>

                                {/* Generate QR Code from text if Base64 not available */}
                                <div className="bg-white p-4 rounded inline-block mb-4">
                                    {order.payment.qrCodeBase64 ? (
                                        <img
                                            src={`data:image/png;base64,${order.payment.qrCodeBase64}`}
                                            alt="QR Code PIX"
                                            className="w-64 h-64"
                                        />
                                    ) : (
                                        <QRCodeSVG
                                            value={order.payment.qrCode}
                                            size={256}
                                            level="H"
                                            includeMargin={true}
                                        />
                                    )}
                                </div>

                                <div className="bg-gray-900 p-3 rounded text-xs text-gray-300 break-all font-mono">
                                    {order.payment.qrCode}
                                </div>
                                <button
                                    onClick={() => navigator.clipboard.writeText(order.payment.qrCode)}
                                    className="mt-4 bg-harley-orange text-white px-6 py-2 rounded font-bold hover:bg-orange-700 transition-colors"
                                >
                                    Copiar Código PIX
                                </button>
                                <p className="text-green-500 text-sm mt-4 font-bold">
                                    Desconto de 5% aplicado!
                                </p>
                            </div>
                        )}

                        {order.payment.method === 'boleto' && order.payment.boletoUrl && (
                            <div className="bg-black border border-gray-800 rounded p-6 text-center">
                                <Barcode className="w-16 h-16 mx-auto text-white mb-4" />
                                <p className="text-white font-bold mb-2">Boleto Bancário</p>
                                <p className="text-gray-400 text-sm mb-4">
                                    Clique no botão abaixo para visualizar e imprimir o boleto
                                </p>
                                <a
                                    href={order.payment.boletoUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-block bg-harley-orange text-white px-6 py-3 rounded font-bold hover:bg-orange-700 transition-colors"
                                >
                                    Visualizar Boleto
                                </a>
                                {order.payment.expirationDate && (
                                    <p className="text-gray-400 text-sm mt-4">
                                        Vencimento: {new Date(order.payment.expirationDate).toLocaleDateString('pt-BR')}
                                    </p>
                                )}
                            </div>
                        )}

                        {order.payment.method === 'credit' && (
                            <div className="bg-black border border-gray-800 rounded p-6">
                                <p className="text-white mb-2">
                                    <span className="text-gray-400">Método:</span> Cartão de Crédito
                                </p>
                                <p className="text-white">
                                    <span className="text-gray-400">Status:</span>{' '}
                                    <span className={order.payment.status === 'approved' ? 'text-green-500' : 'text-yellow-500'}>
                                        {order.payment.status === 'approved' ? 'Aprovado' : 'Processando'}
                                    </span>
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Items */}
                    <div className="mb-8">
                        <h3 className="text-white font-bold text-lg mb-4 flex items-center gap-2">
                            <Package className="w-5 h-5 text-harley-orange" />
                            Itens do Pedido
                        </h3>
                        <div className="space-y-4">
                            {order.items.map((item, index) => (
                                <div key={index} className="flex gap-4 bg-black border border-gray-800 rounded p-4">
                                    <div className="w-20 h-20 bg-gray-800 rounded overflow-hidden flex-shrink-0">
                                        <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                                    </div>
                                    <div className="flex-1">
                                        <h4 className="text-white font-bold mb-1">{item.name}</h4>
                                        <p className="text-gray-400 text-sm">Quantidade: {item.quantity}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-harley-orange font-bold">
                                            R$ {item.price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Shipping Address */}
                    <div className="mb-8">
                        <h3 className="text-white font-bold text-lg mb-4 flex items-center gap-2">
                            <Truck className="w-5 h-5 text-harley-orange" />
                            Endereço de Entrega
                        </h3>
                        <div className="bg-black border border-gray-800 rounded p-4 text-gray-300">
                            <p className="font-bold text-white mb-2">{order.customer.name}</p>
                            <p>{order.shipping.address}, {order.shipping.number}</p>
                            {order.shipping.complement && <p>{order.shipping.complement}</p>}
                            <p>{order.shipping.city} - {order.shipping.state}</p>
                            <p>CEP: {order.shipping.cep}</p>
                            <p className="mt-2">Telefone: {order.customer.phone}</p>
                        </div>
                    </div>

                    {/* Order Summary */}
                    <div className="border-t border-gray-800 pt-6">
                        <div className="space-y-2 mb-4">
                            <div className="flex justify-between text-gray-400">
                                <span>Subtotal</span>
                                <span>R$ {order.subtotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                            </div>
                            <div className="flex justify-between text-gray-400">
                                <span>Frete</span>
                                <span className="text-green-500">Grátis</span>
                            </div>
                            {order.discount > 0 && (
                                <div className="flex justify-between text-harley-orange">
                                    <span>Desconto PIX (5%)</span>
                                    <span>- R$ {order.discount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                                </div>
                            )}
                            <div className="flex justify-between text-white font-bold text-xl pt-2 border-t border-gray-800">
                                <span>Total</span>
                                <span>R$ {order.total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-4 justify-center print:hidden">
                    <button
                        onClick={handlePrint}
                        className="bg-gray-800 text-white px-6 py-3 rounded font-bold hover:bg-gray-700 transition-colors flex items-center gap-2"
                    >
                        <Printer className="w-5 h-5" />
                        Imprimir Pedido
                    </button>
                    <Link
                        to="/"
                        className="bg-harley-orange text-white px-6 py-3 rounded font-bold hover:bg-orange-700 transition-colors flex items-center gap-2"
                    >
                        <ArrowLeft className="w-5 h-5" />
                        Voltar para a Loja
                    </Link>
                </div>

                {/* Help Text */}
                <div className="mt-8 text-center text-gray-400 text-sm print:hidden">
                    <p>Você receberá um e-mail com os detalhes do pedido.</p>
                    <p className="mt-2">
                        Dúvidas? Entre em contato: <Link to="/contato" className="text-harley-orange hover:underline">Fale Conosco</Link>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default OrderConfirmation;
