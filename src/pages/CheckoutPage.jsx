import React, { useState, useEffect } from 'react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, CreditCard, Truck, QrCode, Barcode, AlertCircle } from 'lucide-react';

import { createPixPayment, createBoletoPayment, processCreditCardPayment, initMercadoPago } from '../services/paymentService';

const CheckoutPage = () => {
    const { cartItems, cartTotal, clearCart } = useCart();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [step, setStep] = useState('shipping'); // shipping, payment, success
    const [paymentMethod, setPaymentMethod] = useState('credit'); // credit, pix, boleto

    const [formData, setFormData] = useState({
        name: '',
        cpf: '',
        phone: '',
        cep: '',
        address: '',
        number: '',
        city: '',
        complement: '',
        cardName: '',
        cardNumber: '',
        cardExpiry: '',
        cardCvv: ''
    });

    const [errors, setErrors] = useState({});

    // Masks
    const maskCPF = (value) => {
        return value
            .replace(/\D/g, '')
            .replace(/(\d{3})(\d)/, '$1.$2')
            .replace(/(\d{3})(\d)/, '$1.$2')
            .replace(/(\d{3})(\d{1,2})/, '$1-$2')
            .replace(/(-\d{2})\d+?$/, '$1');
    };

    const maskPhone = (value) => {
        return value
            .replace(/\D/g, '')
            .replace(/(\d{2})(\d)/, '($1) $2')
            .replace(/(\d{5})(\d)/, '$1-$2')
            .replace(/(-\d{4})\d+?$/, '$1');
    };

    const maskCEP = (value) => {
        return value
            .replace(/\D/g, '')
            .replace(/(\d{5})(\d)/, '$1-$2')
            .replace(/(-\d{3})\d+?$/, '$1');
    };

    const maskCardNumber = (value) => {
        return value
            .replace(/\D/g, '')
            .replace(/(\d{4})(\d)/, '$1 $2')
            .replace(/(\d{4})(\d)/, '$1 $2')
            .replace(/(\d{4})(\d)/, '$1 $2')
            .replace(/(\d{4})\d+?$/, '$1');
    };

    const maskExpiry = (value) => {
        return value
            .replace(/\D/g, '')
            .replace(/(\d{2})(\d)/, '$1/$2')
            .replace(/(\/\d{2})\d+?$/, '$1');
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        let maskedValue = value;

        if (name === 'cpf') maskedValue = maskCPF(value);
        if (name === 'phone') maskedValue = maskPhone(value);
        if (name === 'cep') maskedValue = maskCEP(value);
        if (name === 'cardNumber') maskedValue = maskCardNumber(value);
        if (name === 'cardExpiry') maskedValue = maskExpiry(value);

        setFormData(prev => ({ ...prev, [name]: maskedValue }));
        // Clear error when user types
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: '' }));
        }
    };

    const validateCPF = (cpf) => {
        const cleanCPF = cpf.replace(/\D/g, '');
        if (cleanCPF.length !== 11) return false;
        if (/^(\d)\1{10}$/.test(cleanCPF)) return false;
        return true;
    };

    const validateForm = () => {
        const newErrors = {};

        if (!formData.name.trim()) newErrors.name = 'Nome é obrigatório';
        if (!validateCPF(formData.cpf)) newErrors.cpf = 'CPF inválido';
        if (formData.phone.length < 14) newErrors.phone = 'Telefone inválido';
        if (formData.cep.length < 9) newErrors.cep = 'CEP inválido';
        if (!formData.address.trim()) newErrors.address = 'Endereço é obrigatório';
        if (!formData.number.trim()) newErrors.number = 'Número é obrigatório';
        if (!formData.city.trim()) newErrors.city = 'Cidade é obrigatória';

        if (paymentMethod === 'credit') {
            if (formData.cardNumber.length < 19) newErrors.cardNumber = 'Número do cartão inválido';
            if (!formData.cardName.trim()) newErrors.cardName = 'Nome no cartão é obrigatório';
            if (formData.cardExpiry.length < 5) newErrors.cardExpiry = 'Validade inválida';
            if (formData.cardCvv.length < 3) newErrors.cardCvv = 'CVV inválido';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const { user } = useAuth();
    const [orderId, setOrderId] = useState(null);

    // Initialize Mercado Pago SDK
    useEffect(() => {
        initMercadoPago();
    }, []);

    const handlePayment = async (e) => {
        e.preventDefault();

        if (!validateForm()) {
            return;
        }

        setLoading(true);

        try {
            // Calculate totals
            const subtotal = cartTotal;
            const shippingCost = 0; // Free shipping
            const discount = paymentMethod === 'pix' ? subtotal * 0.05 : 0;
            const total = subtotal - discount + shippingCost;

            // Prepare order data
            const orderData = {
                userId: user?.uid || 'guest',
                userEmail: user?.email || formData.email || 'guest@example.com',
                customer: {
                    name: formData.name,
                    cpf: formData.cpf,
                    phone: formData.phone,
                    email: user?.email || formData.email || ''
                },
                shipping: {
                    cep: formData.cep,
                    address: formData.address,
                    number: formData.number,
                    complement: formData.complement,
                    city: formData.city,
                    state: 'SP' // You might want to add state field to form
                },
                items: cartItems.map(item => ({
                    productId: item.id,
                    name: item.name,
                    price: parseFloat(item.price.replace('R$', '').replace('.', '').replace(',', '.').trim()),
                    quantity: item.quantity,
                    image: item.image
                })),
                payment: {
                    method: paymentMethod,
                    status: 'pending'
                },
                subtotal,
                shipping: shippingCost,
                discount,
                total
            };

            // Create order and process payment via backend
            let paymentResult;

            if (paymentMethod === 'pix') {
                paymentResult = await createPixPayment(orderData);
            } else if (paymentMethod === 'boleto') {
                paymentResult = await createBoletoPayment(orderData);
            } else if (paymentMethod === 'credit') {
                paymentResult = await processCreditCardPayment(orderData, {
                    cardNumber: formData.cardNumber,
                    cardName: formData.cardName,
                    cardExpiry: formData.cardExpiry,
                    cardCvv: formData.cardCvv,
                    cpf: formData.cpf
                });
            }

            if (paymentResult && paymentResult.success) {
                setOrderId(paymentResult.orderId);
                clearCart();
                navigate(`/order-confirmation/${paymentResult.orderId}`);
            } else {
                throw new Error('Erro ao processar pagamento');
            }

        } catch (error) {
            console.error('Error processing order:', error);
            alert(`Erro ao processar pedido: ${error.message}`);
        } finally {
            setLoading(false);
        }
    };

    if (cartItems.length === 0 && step !== 'success') {
        return (
            <div className="min-h-[60vh] flex flex-col items-center justify-center text-white">
                <h2 className="text-3xl font-bold mb-4">Seu carrinho está vazio</h2>
                <button onClick={() => navigate('/')} className="text-harley-orange hover:underline">
                    Voltar para a loja
                </button>
            </div>
        );
    }

    if (step === 'success') {
        return (
            <div className="min-h-[60vh] flex flex-col items-center justify-center text-white text-center px-4">
                <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mb-6">
                    <ShieldCheck className="w-10 h-10 text-white" />
                </div>
                <h2 className="text-4xl font-display font-bold mb-4 text-harley-orange">Pedido Confirmado!</h2>
                <p className="text-gray-400 text-lg mb-8 max-w-md">
                    Obrigado pela sua compra. Você receberá um e-mail com os detalhes do pedido e código de rastreio.
                </p>
                <button
                    onClick={() => navigate('/')}
                    className="bg-harley-orange text-white py-3 px-8 rounded font-bold hover:bg-orange-700 transition-colors uppercase tracking-wide"
                >
                    Voltar para a Loja
                </button>
            </div>
        );
    }

    return (
        <div className="bg-black min-h-screen py-12">
            <div className="container mx-auto px-4">
                <h1 className="text-3xl md:text-4xl font-display font-bold text-white mb-8 uppercase">
                    Finalizar Compra
                </h1>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                    {/* Form */}
                    <div className="lg:col-span-2 space-y-8">
                        {/* Shipping */}
                        <div className="bg-gray-900 p-6 rounded-lg border border-gray-800">
                            <div className="flex items-center gap-3 mb-6">
                                <Truck className="w-6 h-6 text-harley-orange" />
                                <h2 className="text-xl font-bold text-white uppercase">Endereço de Entrega</h2>
                            </div>

                            <form id="checkout-form" onSubmit={handlePayment} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="md:col-span-2">
                                    <h3 className="text-white font-bold mb-4 border-b border-gray-800 pb-2">Dados Pessoais</h3>
                                </div>
                                <div className="md:col-span-2">
                                    <label className="block text-gray-400 text-sm mb-2">Nome Completo</label>
                                    <input
                                        name="name" value={formData.name} onChange={handleChange}
                                        type="text" className={`w-full bg-black border ${errors.name ? 'border-red-500' : 'border-gray-700'} rounded p-3 text-white focus:border-harley-orange focus:outline-none transition-colors`}
                                    />
                                    {errors.name && <span className="text-red-500 text-xs flex items-center gap-1 mt-1"><AlertCircle className="w-3 h-3" /> {errors.name}</span>}
                                </div>
                                <div>
                                    <label className="block text-gray-400 text-sm mb-2">CPF</label>
                                    <input
                                        name="cpf" value={formData.cpf} onChange={handleChange} placeholder="000.000.000-00"
                                        type="text" className={`w-full bg-black border ${errors.cpf ? 'border-red-500' : 'border-gray-700'} rounded p-3 text-white focus:border-harley-orange focus:outline-none transition-colors`}
                                    />
                                    {errors.cpf && <span className="text-red-500 text-xs flex items-center gap-1 mt-1"><AlertCircle className="w-3 h-3" /> {errors.cpf}</span>}
                                </div>
                                <div>
                                    <label className="block text-gray-400 text-sm mb-2">Telefone / WhatsApp</label>
                                    <input
                                        name="phone" value={formData.phone} onChange={handleChange} placeholder="(00) 00000-0000"
                                        type="text" className={`w-full bg-black border ${errors.phone ? 'border-red-500' : 'border-gray-700'} rounded p-3 text-white focus:border-harley-orange focus:outline-none transition-colors`}
                                    />
                                    {errors.phone && <span className="text-red-500 text-xs flex items-center gap-1 mt-1"><AlertCircle className="w-3 h-3" /> {errors.phone}</span>}
                                </div>

                                <div className="md:col-span-2 mt-4">
                                    <h3 className="text-white font-bold mb-4 border-b border-gray-800 pb-2">Endereço de Entrega</h3>
                                </div>
                                <div>
                                    <label className="block text-gray-400 text-sm mb-2">CEP</label>
                                    <input
                                        name="cep" value={formData.cep} onChange={handleChange} placeholder="00000-000"
                                        type="text" className={`w-full bg-black border ${errors.cep ? 'border-red-500' : 'border-gray-700'} rounded p-3 text-white focus:border-harley-orange focus:outline-none transition-colors`}
                                    />
                                    {errors.cep && <span className="text-red-500 text-xs flex items-center gap-1 mt-1"><AlertCircle className="w-3 h-3" /> {errors.cep}</span>}
                                </div>
                                <div>
                                    <label className="block text-gray-400 text-sm mb-2">Cidade</label>
                                    <input
                                        name="city" value={formData.city} onChange={handleChange}
                                        type="text" className={`w-full bg-black border ${errors.city ? 'border-red-500' : 'border-gray-700'} rounded p-3 text-white focus:border-harley-orange focus:outline-none transition-colors`}
                                    />
                                    {errors.city && <span className="text-red-500 text-xs flex items-center gap-1 mt-1"><AlertCircle className="w-3 h-3" /> {errors.city}</span>}
                                </div>
                                <div className="md:col-span-2">
                                    <label className="block text-gray-400 text-sm mb-2">Endereço</label>
                                    <input
                                        name="address" value={formData.address} onChange={handleChange}
                                        type="text" className={`w-full bg-black border ${errors.address ? 'border-red-500' : 'border-gray-700'} rounded p-3 text-white focus:border-harley-orange focus:outline-none transition-colors`}
                                    />
                                    {errors.address && <span className="text-red-500 text-xs flex items-center gap-1 mt-1"><AlertCircle className="w-3 h-3" /> {errors.address}</span>}
                                </div>
                                <div>
                                    <label className="block text-gray-400 text-sm mb-2">Número</label>
                                    <input
                                        name="number" value={formData.number} onChange={handleChange}
                                        type="text" className={`w-full bg-black border ${errors.number ? 'border-red-500' : 'border-gray-700'} rounded p-3 text-white focus:border-harley-orange focus:outline-none transition-colors`}
                                    />
                                    {errors.number && <span className="text-red-500 text-xs flex items-center gap-1 mt-1"><AlertCircle className="w-3 h-3" /> {errors.number}</span>}
                                </div>
                                <div>
                                    <label className="block text-gray-400 text-sm mb-2">Complemento</label>
                                    <input
                                        name="complement" value={formData.complement} onChange={handleChange}
                                        type="text" className="w-full bg-black border border-gray-700 rounded p-3 text-white focus:border-harley-orange focus:outline-none transition-colors"
                                    />
                                </div>
                            </form>
                        </div>

                        {/* Payment Method Selection */}
                        <div className="bg-gray-900 p-6 rounded-lg border border-gray-800">
                            <h2 className="text-xl font-bold text-white uppercase mb-6">Método de Pagamento</h2>

                            <div className="grid grid-cols-3 gap-4 mb-6">
                                <button
                                    type="button"
                                    onClick={() => setPaymentMethod('credit')}
                                    className={`p-4 rounded border flex flex-col items-center gap-2 transition-colors ${paymentMethod === 'credit' ? 'bg-harley-orange border-harley-orange text-white' : 'bg-black border-gray-700 text-gray-400 hover:border-gray-500'}`}
                                >
                                    <CreditCard className="w-6 h-6" />
                                    <span className="text-sm font-bold">Cartão</span>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setPaymentMethod('pix')}
                                    className={`p-4 rounded border flex flex-col items-center gap-2 transition-colors ${paymentMethod === 'pix' ? 'bg-harley-orange border-harley-orange text-white' : 'bg-black border-gray-700 text-gray-400 hover:border-gray-500'}`}
                                >
                                    <QrCode className="w-6 h-6" />
                                    <span className="text-sm font-bold">Pix</span>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setPaymentMethod('boleto')}
                                    className={`p-4 rounded border flex flex-col items-center gap-2 transition-colors ${paymentMethod === 'boleto' ? 'bg-harley-orange border-harley-orange text-white' : 'bg-black border-gray-700 text-gray-400 hover:border-gray-500'}`}
                                >
                                    <Barcode className="w-6 h-6" />
                                    <span className="text-sm font-bold">Boleto</span>
                                </button>
                            </div>

                            {paymentMethod === 'credit' && (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fadeIn">
                                    <div className="md:col-span-2">
                                        <label className="block text-gray-400 text-sm mb-2">Número do Cartão</label>
                                        <div className="relative">
                                            <input
                                                name="cardNumber" value={formData.cardNumber} onChange={handleChange} placeholder="0000 0000 0000 0000"
                                                type="text" className={`w-full bg-black border ${errors.cardNumber ? 'border-red-500' : 'border-gray-700'} rounded p-3 text-white focus:border-harley-orange focus:outline-none transition-colors pl-12`}
                                            />
                                            <CreditCard className="absolute left-4 top-3.5 w-5 h-5 text-gray-500" />
                                        </div>
                                        {errors.cardNumber && <span className="text-red-500 text-xs flex items-center gap-1 mt-1"><AlertCircle className="w-3 h-3" /> {errors.cardNumber}</span>}
                                    </div>
                                    <div className="md:col-span-2">
                                        <label className="block text-gray-400 text-sm mb-2">Nome no Cartão</label>
                                        <input
                                            name="cardName" value={formData.cardName} onChange={handleChange} placeholder="Como está impresso no cartão"
                                            type="text" className={`w-full bg-black border ${errors.cardName ? 'border-red-500' : 'border-gray-700'} rounded p-3 text-white focus:border-harley-orange focus:outline-none transition-colors`}
                                        />
                                        {errors.cardName && <span className="text-red-500 text-xs flex items-center gap-1 mt-1"><AlertCircle className="w-3 h-3" /> {errors.cardName}</span>}
                                    </div>
                                    <div>
                                        <label className="block text-gray-400 text-sm mb-2">Validade</label>
                                        <input
                                            name="cardExpiry" value={formData.cardExpiry} onChange={handleChange} placeholder="MM/AA"
                                            type="text" className={`w-full bg-black border ${errors.cardExpiry ? 'border-red-500' : 'border-gray-700'} rounded p-3 text-white focus:border-harley-orange focus:outline-none transition-colors`}
                                        />
                                        {errors.cardExpiry && <span className="text-red-500 text-xs flex items-center gap-1 mt-1"><AlertCircle className="w-3 h-3" /> {errors.cardExpiry}</span>}
                                    </div>
                                    <div>
                                        <label className="block text-gray-400 text-sm mb-2">CVV</label>
                                        <input
                                            name="cardCvv" value={formData.cardCvv} onChange={handleChange} placeholder="123"
                                            type="text" className={`w-full bg-black border ${errors.cardCvv ? 'border-red-500' : 'border-gray-700'} rounded p-3 text-white focus:border-harley-orange focus:outline-none transition-colors`}
                                        />
                                        {errors.cardCvv && <span className="text-red-500 text-xs flex items-center gap-1 mt-1"><AlertCircle className="w-3 h-3" /> {errors.cardCvv}</span>}
                                    </div>
                                </div>
                            )}

                            {paymentMethod === 'pix' && (
                                <div className="text-center p-6 bg-black rounded border border-gray-800 animate-fadeIn">
                                    <QrCode className="w-32 h-32 mx-auto text-white mb-4" />
                                    <p className="text-white font-bold mb-2">Pagamento via Pix</p>
                                    <p className="text-gray-400 text-sm mb-4">O código QR será gerado após confirmar o pedido.</p>
                                    <div className="text-harley-orange font-bold text-xl">- 5% de Desconto</div>
                                </div>
                            )}

                            {paymentMethod === 'boleto' && (
                                <div className="text-center p-6 bg-black rounded border border-gray-800 animate-fadeIn">
                                    <Barcode className="w-32 h-32 mx-auto text-white mb-4" />
                                    <p className="text-white font-bold mb-2">Pagamento via Boleto Bancário</p>
                                    <p className="text-gray-400 text-sm">O boleto será gerado após confirmar o pedido.</p>
                                    <p className="text-gray-500 text-xs mt-2">Vencimento em 3 dias úteis.</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Order Summary */}
                    <div className="lg:col-span-1">
                        <div className="bg-gray-900 p-6 rounded-lg border border-gray-800 sticky top-24">
                            <h2 className="text-xl font-bold text-white uppercase mb-6">Resumo do Pedido</h2>

                            <div className="space-y-4 mb-6 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                                {cartItems.map((item) => (
                                    <div key={item.id} className="flex gap-3">
                                        <div className="w-16 h-16 bg-gray-800 rounded overflow-hidden flex-shrink-0">
                                            <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                                        </div>
                                        <div className="flex-1">
                                            <h4 className="text-white text-sm font-bold line-clamp-2">{item.name}</h4>
                                            <div className="flex justify-between items-center mt-1">
                                                <span className="text-gray-400 text-xs">Qtd: {item.quantity}</span>
                                                <span className="text-harley-orange text-sm font-bold">{item.price}</span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="border-t border-gray-800 pt-4 space-y-2 mb-6">
                                <div className="flex justify-between text-gray-400">
                                    <span>Subtotal</span>
                                    <span>R$ {cartTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                                </div>
                                <div className="flex justify-between text-gray-400">
                                    <span>Frete</span>
                                    <span className="text-green-500">Grátis</span>
                                </div>
                                {paymentMethod === 'pix' && (
                                    <div className="flex justify-between text-harley-orange">
                                        <span>Desconto Pix (5%)</span>
                                        <span>- R$ {(cartTotal * 0.05).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                                    </div>
                                )}
                                <div className="flex justify-between text-white font-bold text-xl pt-2 border-t border-gray-800 mt-2">
                                    <span>Total</span>
                                    <span>R$ {(paymentMethod === 'pix' ? cartTotal * 0.95 : cartTotal).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                                </div>
                            </div>

                            <button
                                type="submit"
                                form="checkout-form"
                                disabled={loading}
                                className="w-full bg-harley-orange text-white py-4 rounded font-bold uppercase tracking-wider hover:bg-orange-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                            >
                                {loading ? (
                                    <span className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                                ) : (
                                    'Confirmar Pedido'
                                )}
                            </button>

                            <div className="mt-4 flex items-center justify-center gap-2 text-gray-500 text-xs">
                                <ShieldCheck className="w-4 h-4" />
                                <span>Ambiente Seguro</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CheckoutPage;
