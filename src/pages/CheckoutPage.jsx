import React, { useState, useEffect } from 'react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, CreditCard, Truck, QrCode, Barcode, AlertCircle, Minus, Plus, Trash2 } from 'lucide-react';
import CreditCardForm from '../components/CreditCardForm';
import { useToast } from '../components/ui/ToastProvider';

import { createPixPayment, createBoletoPayment, processCreditCardPayment, initMercadoPago } from '../services/paymentService';
import { calculateShipping } from '../services/shippingService';
import { createOrder } from '../services/orderService';
import { formatCurrency } from '../utils/currency.js';

const CheckoutPage = () => {
    const { cartItems, cartTotal, clearCart, updateQuantity, removeFromCart } = useCart();
    const { currentUser, loading: authLoading, getUserProfile, userType } = useAuth();
    const navigate = useNavigate();
    const { showToast } = useToast();

    const [loading, setLoading] = useState(false);
    const [step, setStep] = useState('shipping');
    const [paymentMethod, setPaymentMethod] = useState('credit');
    const [orderId, setOrderId] = useState(null);
    const [userProfile, setUserProfile] = useState(null);
    const [useSavedAddress, setUseSavedAddress] = useState(true);
    const [sellerName, setSellerName] = useState('');

    const [formData, setFormData] = useState({
        name: '',
        email: '',
        cpf: '',
        phone: '',
        cep: '',
        address: '',
        number: '',
        city: '',
        state: '',
        complement: '',
        cardName: '',
        cardNumber: '',
        cardExpiry: '',
        cardCvv: ''
    });

    const [errors, setErrors] = useState({});
    const [cepLoading, setCepLoading] = useState(false);

    // Shipping State
    const [shippingOptions, setShippingOptions] = useState([]);
    const [selectedShipping, setSelectedShipping] = useState(null);
    const [shippingLoading, setShippingLoading] = useState(false);
    const [shippingError, setShippingError] = useState('');

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

        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: '' }));
        }
    };

    const fetchAddressByCep = async (cep) => {
        const cleanCep = cep.replace(/\D/g, '');
        if (cleanCep.length !== 8) return;

        setCepLoading(true);
        try {
            const response = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
            const data = await response.json();

            if (!data.erro) {
                setFormData(prev => ({
                    ...prev,
                    address: data.logradouro || '',
                    city: data.localidade || '',
                    state: data.uf || ''
                }));
            }
        } catch (error) {
            console.error('Erro ao buscar CEP:', error);
        } finally {
            setCepLoading(false);
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
        // Logged-in users already have a verified e-mail (currentUser.email); guests must provide one.
        if (!currentUser && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
            newErrors.email = 'E-mail inválido';
        }
        if (!validateCPF(formData.cpf)) newErrors.cpf = 'CPF inválido';
        if (formData.phone.length < 14) newErrors.phone = 'Telefone inválido';
        if (formData.cep.length < 9) newErrors.cep = 'CEP inválido';
        if (!formData.address.trim()) newErrors.address = 'Endereço é obrigatório';
        if (!formData.number.trim()) newErrors.number = 'Número é obrigatório';
        if (!formData.city.trim()) newErrors.city = 'Cidade é obrigatória';

        // Card fields (number/name/expiry/CVV) are owned and validated entirely by
        // CreditCardForm — they never exist on this form's state, and must not be
        // checked here.

        // Shipping is optional - can proceed without it
        // if (!selectedShipping) {
        //     setShippingError('Selecione uma opção de frete');
        //     newErrors.shipping = 'Selecione uma opção de frete';
        // }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    // Load user profile and auto-fill form
    useEffect(() => {
        console.log('=== CHECKOUT AUTO-FILL useEffect ===');
        console.log('Auth Loading:', authLoading);
        console.log('Current User:', currentUser);

        if (authLoading) {
            console.log('Auth still loading, waiting...');
            return;
        }

        const loadUserProfile = async () => {
            if (currentUser) {
                console.log('Loading user profile for:', currentUser.email);
                const profile = await getUserProfile();
                console.log('Profile loaded:', profile);

                if (profile) {
                    setUserProfile(profile);

                    setFormData(prev => ({
                        ...prev,
                        name: profile.displayName || currentUser.displayName || '',
                        email: currentUser.email || profile.email || prev.email,
                        phone: profile.phone || '',
                        cpf: profile.cpf || '',
                        ...(profile.address && useSavedAddress ? {
                            cep: profile.address.cep || '',
                            address: profile.address.street || profile.address.address || '',
                            number: profile.address.number || '',
                            complement: profile.address.complement || '',
                            city: profile.address.city || '',
                            state: profile.address.state || ''
                        } : {})
                    }));

                    console.log('✅ Form data updated with profile');
                } else {
                    console.log('No profile found');
                }
            } else {
                console.log('User is not logged in');
            }
        };

        loadUserProfile();
    }, [currentUser, authLoading, useSavedAddress, getUserProfile]);

    // Initialize Mercado Pago SDK
    useEffect(() => {
        if (userType === 'pavilhao') {
            return;
        }
        initMercadoPago();
    }, [userType]);

    // Calculate shipping when CEP changes
    useEffect(() => {
        const calculateDelivery = async () => {
            const cep = formData.cep.replace(/\D/g, '');
            if (cep.length === 8) {
                setShippingLoading(true);
                setShippingError('');
                setShippingOptions([]);
                setSelectedShipping(null);

                try {
                    // Check for free shipping (test user)
                    if (currentUser && currentUser.email === 'ismael.ibr@gmail.com') {
                        const freeShipping = [{
                            name: 'Frete Grátis (Teste)',
                            price: 0,
                            deliveryTime: '1-2 dias úteis',
                            service: 'FREE_TEST'
                        }];
                        setShippingOptions(freeShipping);
                        setSelectedShipping(freeShipping[0]);
                        setShippingLoading(false);
                        return;
                    }

                    const totalWeight = cartItems.reduce((total, item) => {
                        const itemWeight = item.dimensions?.weight || item.weight || 1;
                        return total + (itemWeight * item.quantity);
                    }, 0);

                    const options = await calculateShipping(cep, totalWeight);
                    setShippingOptions(options);

                    if (options.length > 0) {
                        setSelectedShipping(options[0]);
                    }
                } catch (error) {
                    console.error('Error calculating shipping:', error);
                    setShippingError('Não foi possível calcular o frete para este CEP.');
                } finally {
                    setShippingLoading(false);
                }
            }
        };

        const timer = setTimeout(() => {
            calculateDelivery();
        }, 1000);

        return () => clearTimeout(timer);
    }, [formData.cep, cartItems]);

    // Builds the order payload shared by every payment method, so subtotal/discount/
    // total and the customer/shipping/items shape can never drift between them again.
    // The backend always recomputes these amounts from the database before charging —
    // what's sent here only drives the optimistic UI and the payment request itself.
    const buildOrderData = (activePaymentMethod) => {
        const subtotal = cartTotal;
        const shippingCost = selectedShipping ? selectedShipping.price : 0;
        const discount = activePaymentMethod === 'pix' ? subtotal * 0.05 : 0;
        const total = subtotal - discount + shippingCost;
        const customerEmail = currentUser?.email || formData.email || '';
        const normalizedMethod = activePaymentMethod === 'credit' ? 'credit_card' : activePaymentMethod;

        return {
            orderNumber: `HD-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
            userId: currentUser?.uid || 'guest',
            userEmail: customerEmail || 'guest@example.com',
            customer: {
                name: formData.name,
                cpf: formData.cpf,
                phone: formData.phone,
                email: customerEmail
            },
            shipping: {
                cep: formData.cep,
                address: formData.address,
                number: formData.number,
                complement: formData.complement,
                city: formData.city,
                state: formData.state || 'SP',
                neighborhood: 'Centro',
                zipCode: formData.cep,
                method: selectedShipping ? selectedShipping.name : 'Padrão',
                price: shippingCost,
                // The server never trusts this price — it re-quotes shipping itself and
                // matches this id against a fresh Melhor Envio option (see
                // orderCalculationService.js). Sent only so the server knows which
                // option the customer picked, not to report its cost.
                serviceId: selectedShipping?.id || null,
                deliveryDays: selectedShipping ? selectedShipping.deliveryDays : 0
            },
            items: cartItems.map(item => ({
                id: item.id,
                name: item.name,
                price: typeof item.price === 'number'
                    ? item.price
                    : parseFloat(item.price.replace('R$', '').replace('.', '').replace(',', '.').trim()),
                quantity: item.quantity,
                image: item.image,
                profitMargin: item.profitMargin || 0,
                partner: item.partner || ''
            })),
            payment: {
                method: normalizedMethod,
                status: 'pending'
            },
            method: normalizedMethod,
            subtotal,
            discount,
            total
        };
    };

    // Handle card payment from CreditCardForm (called after the card is already
    // tokenized by Mercado Pago's SDK — raw card data never reaches this component).
    const handleCardPayment = async ({ token, installments, paymentMethodId }) => {
        if (!validateForm()) {
            throw new Error('Por favor, preencha todos os campos obrigatórios');
        }

        setLoading(true);

        try {
            const orderData = { ...buildOrderData('credit'), installments };

            const paymentResult = await processCreditCardPayment(orderData, {
                token,
                installments,
                paymentMethodId
            });

            if (paymentResult && paymentResult.success) {
                setOrderId(paymentResult.orderId);
                clearCart();
                navigate(`/order-confirmation/${paymentResult.orderId}`);
            } else {
                throw new Error('Erro ao processar pagamento');
            }

        } catch (error) {
            console.error('Error processing card payment:', error);
            throw error; // Re-throw to be caught by CreditCardForm
        } finally {
            setLoading(false);
        }
    };

    const handlePayment = async (e) => {
        e.preventDefault();

        if (paymentMethod === 'credit') {
            // Credit card is handled exclusively by CreditCardForm's own button/flow
            // (needed for Mercado Pago tokenization) — nothing to do if this form's
            // submit fires instead (e.g. Enter pressed in one of its fields).
            return;
        }

        if (!validateForm()) {
            return;
        }

        setLoading(true);

        try {
            const orderData = buildOrderData(paymentMethod);

            let paymentResult;
            if (paymentMethod === 'pix') {
                paymentResult = await createPixPayment(orderData);
            } else if (paymentMethod === 'boleto') {
                paymentResult = await createBoletoPayment(orderData);
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
            showToast(`Erro ao processar pedido: ${error.message}`, { type: 'error' });
        } finally {
            setLoading(false);
        }
    };

    if (cartItems.length === 0 && step !== 'success') {
        return (
            <div className="min-h-[60vh] flex flex-col items-center justify-center text-white">
                <h2 className="text-3xl font-bold mb-4">Seu carrinho está vazio</h2>
                <button onClick={() => navigate('/')} className="text-sick-red hover:underline">
                    Voltar para a loja
                </button>
            </div>
        );
    }

    // PAVILHÃO CHECKOUT - Interface Simplificada
    if (userType === 'pavilhao' || currentUser?.userType === 'pavilhao') {
        const handlePavilhaoCheckout = async (e) => {
            e.preventDefault();
            
            if (!sellerName.trim()) {
                showToast('Por favor, insira o nome do vendedor', { type: 'warning' });
                return;
            }

            setLoading(true);
            try {
                const orderNumber = `HD-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
                
                const orderData = {
                    orderNumber,
                    userId: currentUser?.uid || 'pavilhao',
                    userEmail: currentUser?.email || 'pavilhao@sickgrip.com.br',
                    items: cartItems.map(item => ({
                        id: item.id,
                        name: item.name,
                        price: 0, // Always zero for pavilhao
                        quantity: item.quantity,
                        image: item.image
                    })),
                    customer: {
                        name: 'Pavilhão',
                        email: 'pavilhao@sickgrip.com.br',
                        phone: ''
                    },
                    shipping: {
                        method: 'withdrawal',
                        cost: 0,
                        address: 'Pavilhão Oficina - R. Júlio Verne, 788',
                        city: 'Porto Alegre',
                        state: 'RS',
                        neighborhood: 'Santa Maria Goretti'
                    },
                    payment: {
                        method: 'cash',
                        status: 'completed'
                    },
                    sellerName: sellerName,
                    orderType: 'pavilhao',
                    subtotal: 0,
                    discount: 0,
                    total: 0
                };

                // Uses the shared orderService (same as every other checkout flow)
                // instead of a hand-rolled fetch — was duplicating createOrder() with
                // its own copy of the auth header and its own (drifted) API_URL fallback.
                const result = await createOrder(orderData);
                clearCart();
                setOrderId(result.order.id);
                navigate(`/order-confirmation/${result.order.id}`);
            } catch (error) {
                console.error('Erro ao processar pedido:', error);
                const message = error.response?.data?.error || error.message || 'Erro ao criar pedido';
                showToast(`Erro ao processar pedido: ${message}`, { type: 'error' });
            } finally {
                setLoading(false);
            }
        };

        return (
            <div className="bg-black min-h-screen py-12">
                <div className="container mx-auto px-4">
                    <h1 className="text-3xl md:text-4xl font-display font-bold text-white mb-8 uppercase">
                        Venda Pavilhão
                    </h1>

                    <div className="max-w-2xl mx-auto">
                        {/* Formulário Simplificado */}
                        <div className="bg-gray-900 p-8 rounded-lg border border-gray-800 mb-8">
                            <div className="mb-8">
                                <h2 className="text-2xl font-bold text-white mb-4">📍 Local de Retirada</h2>
                                <div className="bg-gray-800 p-4 rounded border border-gray-700">
                                    <p className="text-white font-semibold">Pavilhão Oficina</p>
                                    <p className="text-gray-400 text-sm">R. Júlio Verne, 788</p>
                                    <p className="text-gray-400 text-sm">Santa Maria Goretti, Porto Alegre - RS</p>
                                </div>
                            </div>

                            <form onSubmit={handlePavilhaoCheckout} className="space-y-6">
                                {/* Produtos */}
                                <div>
                                    <h2 className="text-2xl font-bold text-white mb-4">📦 Produtos</h2>
                                    <div className="space-y-3">
                                        {cartItems.map(item => (
                                            <div key={item.id} className="flex items-center justify-between p-4 bg-gray-800 rounded border border-gray-700">
                                                <div className="flex items-center gap-4">
                                                    <img src={item.image} alt={item.name} className="w-12 h-12 object-cover rounded" />
                                                    <div>
                                                        <p className="text-white font-medium">{item.name}</p>
                                                        <p className="text-gray-400 text-sm">Qtd: {item.quantity}</p>
                                                    </div>
                                                </div>
                                                <p className="text-sick-red font-bold">{formatCurrency((item.price || 0) * (item.quantity || 1))}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Campo do Vendedor */}
                                <div>
                                    <label className="block text-white font-bold mb-3">👤 Nome do Vendedor *</label>
                                    <input
                                        type="text"
                                        value={sellerName}
                                        onChange={(e) => setSellerName(e.target.value)}
                                        placeholder="Digite o nome do vendedor"
                                        className="w-full bg-black border border-gray-700 rounded p-4 text-white focus:border-sick-red focus:outline-none transition-colors text-lg"
                                        required
                                    />
                                    <p className="text-gray-400 text-sm mt-2">Este nome será registrado para auditoria</p>
                                </div>

                                {/* Resumo Total */}
                                <div className="bg-gray-800 p-4 rounded border border-gray-700">
                                    <div className="flex justify-between text-lg font-bold">
                                        <span className="text-white">Total:</span>
                                        <span className="text-sick-red">{formatCurrency(cartTotal)}</span>
                                    </div>
                                </div>

                                {/* Botão Submit */}
                                <button
                                    type="submit"
                                    disabled={loading || !sellerName.trim()}
                                    className="w-full bg-sick-red text-white py-4 rounded font-bold text-lg hover:bg-red-800 transition-colors uppercase tracking-wide disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {loading ? '⏳ Processando...' : '✅ Finalizar Pedido'}
                                </button>

                                <button
                                    type="button"
                                    onClick={() => navigate('/')}
                                    className="w-full bg-gray-800 text-white py-3 rounded font-bold border border-gray-700 hover:border-gray-600 transition-colors"
                                >
                                    Voltar para a Loja
                                </button>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (step === 'success') {
        return (
            <div className="min-h-[60vh] flex flex-col items-center justify-center text-white text-center px-4">
                <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mb-6">
                    <ShieldCheck className="w-10 h-10 text-white" />
                </div>
                <h2 className="text-4xl font-display font-bold mb-4 text-sick-red">Pedido Confirmado!</h2>
                <p className="text-gray-400 text-lg mb-8 max-w-md">
                    Obrigado pela sua compra. Você receberá um e-mail com os detalhes do pedido e código de rastreio.
                </p>
                <button
                    onClick={() => navigate('/')}
                    className="bg-sick-red text-white py-3 px-8 rounded font-bold hover:bg-red-800 transition-colors uppercase tracking-wide"
                >
                    Voltar para a Loja
                </button>
            </div>
        );
    }

    return (
        <div className="bg-black min-h-screen py-12">
            <div className="container mx-auto px-4">
                <h1 className="text-3xl md:text-4xl font-display font-bold text-white mb-4 uppercase">
                    Finalizar Compra
                </h1>

                {/* Progress indicator — the form below is a single scrolling page (not a
                    multi-step wizard), so this shows where the customer is in the overall
                    purchase flow rather than gating navigation between sections. */}
                <ol className="flex items-center gap-3 mb-8 text-sm">
                    <li className="flex items-center gap-2 text-white font-bold">
                        <span className="w-6 h-6 rounded-full bg-sick-red text-white flex items-center justify-center text-xs">1</span>
                        Dados e Entrega
                    </li>
                    <li className="w-8 h-px bg-gray-700" aria-hidden="true"></li>
                    <li className="flex items-center gap-2 text-white font-bold">
                        <span className="w-6 h-6 rounded-full bg-sick-red text-white flex items-center justify-center text-xs">2</span>
                        Pagamento
                    </li>
                    <li className="w-8 h-px bg-gray-700" aria-hidden="true"></li>
                    <li className="flex items-center gap-2 text-gray-500">
                        <span className="w-6 h-6 rounded-full border border-gray-700 flex items-center justify-center text-xs">3</span>
                        Confirmação
                    </li>
                </ol>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                    {/* Form */}
                    <div className="lg:col-span-2 space-y-8">
                        {/* Shipping */}
                        <div className="bg-gray-900 p-6 rounded-lg border border-gray-800">
                            <div className="flex items-center gap-3 mb-6">
                                <Truck className="w-6 h-6 text-sick-red" />
                                <h2 className="text-xl font-bold text-white uppercase">Endereço de Entrega</h2>
                            </div>

                            <form id="checkout-form" onSubmit={handlePayment} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="md:col-span-2">
                                    <h3 className="text-white font-bold mb-4 border-b border-gray-800 pb-2">Dados Pessoais</h3>
                                </div>
                                <div className="md:col-span-2">
                                    <label htmlFor="checkout-name" className="block text-gray-400 text-sm mb-2">Nome Completo</label>
                                    <input
                                        id="checkout-name" name="name" value={formData.name} onChange={handleChange}
                                        type="text" aria-invalid={!!errors.name} aria-describedby={errors.name ? 'checkout-name-error' : undefined}
                                        className={`w-full bg-black border ${errors.name ? 'border-red-500' : 'border-gray-700'} rounded p-3 text-white focus:border-sick-red focus:outline-none transition-colors`}
                                    />
                                    {errors.name && <span id="checkout-name-error" role="alert" className="text-red-500 text-xs flex items-center gap-1 mt-1"><AlertCircle className="w-3 h-3" /> {errors.name}</span>}
                                </div>
                                <div className="md:col-span-2">
                                    <label htmlFor="checkout-email" className="block text-gray-400 text-sm mb-2">E-mail</label>
                                    <input
                                        id="checkout-email" name="email" value={formData.email} onChange={handleChange}
                                        type="email" disabled={!!currentUser}
                                        placeholder="voce@exemplo.com"
                                        aria-invalid={!!errors.email} aria-describedby={errors.email ? 'checkout-email-error' : undefined}
                                        className={`w-full bg-black border ${errors.email ? 'border-red-500' : 'border-gray-700'} rounded p-3 text-white focus:border-sick-red focus:outline-none transition-colors disabled:opacity-60`}
                                    />
                                    {errors.email && <span id="checkout-email-error" role="alert" className="text-red-500 text-xs flex items-center gap-1 mt-1"><AlertCircle className="w-3 h-3" /> {errors.email}</span>}
                                    {currentUser && <p className="text-gray-400 text-xs mt-1">E-mail da sua conta</p>}
                                </div>
                                <div>
                                    <label htmlFor="checkout-cpf" className="block text-gray-400 text-sm mb-2">CPF</label>
                                    <input
                                        id="checkout-cpf" name="cpf" value={formData.cpf} onChange={handleChange} placeholder="000.000.000-00"
                                        type="text" aria-invalid={!!errors.cpf} aria-describedby={errors.cpf ? 'checkout-cpf-error' : undefined}
                                        className={`w-full bg-black border ${errors.cpf ? 'border-red-500' : 'border-gray-700'} rounded p-3 text-white focus:border-sick-red focus:outline-none transition-colors`}
                                    />
                                    {errors.cpf && <span id="checkout-cpf-error" role="alert" className="text-red-500 text-xs flex items-center gap-1 mt-1"><AlertCircle className="w-3 h-3" /> {errors.cpf}</span>}
                                </div>
                                <div>
                                    <label htmlFor="checkout-phone" className="block text-gray-400 text-sm mb-2">Telefone / WhatsApp</label>
                                    <input
                                        id="checkout-phone" name="phone" value={formData.phone} onChange={handleChange} placeholder="(00) 00000-0000"
                                        type="text" aria-invalid={!!errors.phone} aria-describedby={errors.phone ? 'checkout-phone-error' : undefined}
                                        className={`w-full bg-black border ${errors.phone ? 'border-red-500' : 'border-gray-700'} rounded p-3 text-white focus:border-sick-red focus:outline-none transition-colors`}
                                    />
                                    {errors.phone && <span id="checkout-phone-error" role="alert" className="text-red-500 text-xs flex items-center gap-1 mt-1"><AlertCircle className="w-3 h-3" /> {errors.phone}</span>}
                                </div>

                                <div className="md:col-span-2 mt-4">
                                    <div className="flex items-center justify-between mb-4 border-b border-gray-800 pb-2">
                                        <h3 className="text-white font-bold">Endereço de Entrega</h3>
                                        {userProfile?.address?.cep && (
                                            <label className="flex items-center gap-2 text-sm cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    checked={useSavedAddress}
                                                    onChange={(e) => setUseSavedAddress(e.target.checked)}
                                                    className="text-sick-red focus:ring-sick-red bg-black border-gray-600 rounded"
                                                />
                                                <span className="text-gray-400">Usar endereço cadastrado</span>
                                            </label>
                                        )}
                                    </div>
                                </div>
                                <div>
                                    <label htmlFor="checkout-cep" className="block text-gray-400 text-sm mb-2">CEP</label>
                                    <div className="relative">
                                        <input
                                            id="checkout-cep" name="cep" value={formData.cep} onChange={handleChange}
                                            onBlur={(e) => fetchAddressByCep(e.target.value)}
                                            placeholder="00000-000"
                                            type="text" aria-invalid={!!errors.cep} aria-describedby={errors.cep ? 'checkout-cep-error' : undefined}
                                            className={`w-full bg-black border ${errors.cep ? 'border-red-500' : 'border-gray-700'} rounded p-3 text-white focus:border-sick-red focus:outline-none transition-colors`}
                                        />
                                        {cepLoading && (
                                            <div className="absolute right-3 top-3.5" aria-hidden="true">
                                                <div className="w-5 h-5 border-2 border-sick-red border-t-transparent rounded-full animate-spin"></div>
                                            </div>
                                        )}
                                    </div>
                                    {errors.cep && <span id="checkout-cep-error" role="alert" className="text-red-500 text-xs flex items-center gap-1 mt-1"><AlertCircle className="w-3 h-3" /> {errors.cep}</span>}
                                    <p className="text-gray-400 text-xs mt-1">O endereço será preenchido automaticamente</p>
                                </div>
                                <div>
                                    <label htmlFor="checkout-city" className="block text-gray-400 text-sm mb-2">Cidade</label>
                                    <input
                                        id="checkout-city" name="city" value={formData.city} onChange={handleChange}
                                        type="text" aria-invalid={!!errors.city} aria-describedby={errors.city ? 'checkout-city-error' : undefined}
                                        className={`w-full bg-black border ${errors.city ? 'border-red-500' : 'border-gray-700'} rounded p-3 text-white focus:border-sick-red focus:outline-none transition-colors`}
                                    />
                                    {errors.city && <span id="checkout-city-error" role="alert" className="text-red-500 text-xs flex items-center gap-1 mt-1"><AlertCircle className="w-3 h-3" /> {errors.city}</span>}
                                </div>
                                <div className="md:col-span-2">
                                    <label htmlFor="checkout-address" className="block text-gray-400 text-sm mb-2">Endereço</label>
                                    <input
                                        id="checkout-address" name="address" value={formData.address} onChange={handleChange}
                                        type="text" aria-invalid={!!errors.address} aria-describedby={errors.address ? 'checkout-address-error' : undefined}
                                        className={`w-full bg-black border ${errors.address ? 'border-red-500' : 'border-gray-700'} rounded p-3 text-white focus:border-sick-red focus:outline-none transition-colors`}
                                    />
                                    {errors.address && <span id="checkout-address-error" role="alert" className="text-red-500 text-xs flex items-center gap-1 mt-1"><AlertCircle className="w-3 h-3" /> {errors.address}</span>}
                                </div>
                                <div>
                                    <label htmlFor="checkout-number" className="block text-gray-400 text-sm mb-2">Número</label>
                                    <input
                                        id="checkout-number" name="number" value={formData.number} onChange={handleChange}
                                        type="text" aria-invalid={!!errors.number} aria-describedby={errors.number ? 'checkout-number-error' : undefined}
                                        className={`w-full bg-black border ${errors.number ? 'border-red-500' : 'border-gray-700'} rounded p-3 text-white focus:border-sick-red focus:outline-none transition-colors`}
                                    />
                                    {errors.number && <span id="checkout-number-error" role="alert" className="text-red-500 text-xs flex items-center gap-1 mt-1"><AlertCircle className="w-3 h-3" /> {errors.number}</span>}
                                </div>
                                <div>
                                    <label htmlFor="checkout-complement" className="block text-gray-400 text-sm mb-2">Complemento</label>
                                    <input
                                        id="checkout-complement" name="complement" value={formData.complement} onChange={handleChange}
                                        type="text" className="w-full bg-black border border-gray-700 rounded p-3 text-white focus:border-sick-red focus:outline-none transition-colors"
                                    />
                                </div>

                                {/* Shipping Options */}
                                {formData.cep.length >= 9 && (
                                    <div className="md:col-span-2 mt-4">
                                        <h3 className="text-white font-bold mb-4 border-b border-gray-800 pb-2">Opções de Frete</h3>
                                        {/* Store Pickup Option */}
                                        <div className="mb-4">
                                            <label className={`flex items-center justify-between p-4 rounded border cursor-pointer transition-colors ${selectedShipping?.name === 'Retirar na Loja' ? 'border-sick-red bg-gray-800' : 'border-gray-700 hover:border-gray-600'}`}>
                                                <div className="flex items-center gap-3">
                                                    <input
                                                        type="radio"
                                                        name="shipping"
                                                        checked={selectedShipping?.name === 'Retirar na Loja'}
                                                        onChange={() => setSelectedShipping({ name: 'Retirar na Loja', price: 0, deliveryDays: 0 })}
                                                        className="text-sick-red focus:ring-sick-red"
                                                    />
                                                    <div>
                                                        <div className="text-white font-medium">Retirar na Loja</div>
                                                        <div className="text-gray-400 text-sm">Pavilhão Oficina - R. Júlio Verne, 788</div>
                                                        <div className="text-gray-400 text-xs">Santa Maria Goretti, Porto Alegre - RS</div>
                                                    </div>
                                                </div>
                                                <div className="text-green-500 font-bold">GRÁTIS</div>
                                            </label>
                                        </div>

                                        {shippingLoading ? (
                                            <div className="text-gray-400 text-center py-4">Calculando frete...</div>
                                        ) : shippingError ? (
                                            <div className="text-red-500 text-sm">{shippingError}</div>
                                        ) : shippingOptions.length > 0 ? (
                                            <div className="space-y-3">
                                                {shippingOptions.map((option, index) => (
                                                    <label key={index} className={`flex items-center justify-between p-4 rounded border cursor-pointer transition-colors ${selectedShipping === option ? 'border-sick-red bg-gray-800' : 'border-gray-700 hover:border-gray-600'}`}>
                                                        <div className="flex items-center gap-3">
                                                            <input
                                                                type="radio"
                                                                name="shipping"
                                                                checked={selectedShipping === option}
                                                                onChange={() => setSelectedShipping(option)}
                                                                className="text-sick-red focus:ring-sick-red"
                                                            />
                                                            <div>
                                                                <div className="text-white font-medium">{option.name}</div>
                                                                <div className="text-gray-400 text-sm">Entrega em {option.deliveryDays} dias úteis</div>
                                                            </div>
                                                        </div>
                                                        <div className="text-sick-red font-bold">{formatCurrency(option.price)}</div>
                                                    </label>
                                                ))}
                                            </div>
                                        ) : null}
                                    </div>
                                )}

                                {/* Payment Method */}
                                <div className="md:col-span-2 mt-6">
                                    <div className="flex items-center gap-3 mb-6">
                                        <CreditCard className="w-6 h-6 text-sick-red" />
                                        <h2 className="text-xl font-bold text-white uppercase">Forma de Pagamento</h2>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                                        <button
                                            type="button"
                                            onClick={() => setPaymentMethod('credit')}
                                            className={`p-4 rounded border transition-colors ${paymentMethod === 'credit' ? 'border-sick-red bg-gray-800' : 'border-gray-700 hover:border-gray-600'}`}
                                        >
                                            <CreditCard className="w-8 h-8 mx-auto mb-2 text-sick-red" />
                                            <div className="text-white font-medium">Cartão de Crédito</div>
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setPaymentMethod('pix')}
                                            className={`p-4 rounded border transition-colors ${paymentMethod === 'pix' ? 'border-sick-red bg-gray-800' : 'border-gray-700 hover:border-gray-600'}`}
                                        >
                                            <QrCode className="w-8 h-8 mx-auto mb-2 text-sick-red" />
                                            <div className="text-white font-medium">PIX</div>
                                            <div className="text-green-500 text-xs">5% de desconto</div>
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setPaymentMethod('boleto')}
                                            className={`p-4 rounded border transition-colors ${paymentMethod === 'boleto' ? 'border-sick-red bg-gray-800' : 'border-gray-700 hover:border-gray-600'}`}
                                        >
                                            <Barcode className="w-8 h-8 mx-auto mb-2 text-sick-red" />
                                            <div className="text-white font-medium">Boleto</div>
                                        </button>
                                    </div>

                                    {paymentMethod === 'credit' && (
                                        <CreditCardForm
                                            total={cartTotal + (selectedShipping?.price || 0)}
                                            onPaymentSuccess={handleCardPayment}
                                            onError={(error) => showToast(error, { type: 'error' })}
                                        />
                                    )}
                                </div>

                                {/* Credit card has its own submit button above (CreditCardForm) —
                                    showing this one too would be a second, conflicting way to pay. */}
                                {paymentMethod !== 'credit' && (
                                    <div className="md:col-span-2 mt-6">
                                        <button
                                            type="submit"
                                            disabled={loading}
                                            className="w-full bg-sick-red text-white py-4 rounded font-bold hover:bg-red-800 transition-colors uppercase tracking-wide disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            {loading ? 'Processando...' : 'Finalizar Pedido'}
                                        </button>
                                    </div>
                                )}
                            </form>
                        </div>
                    </div>

                    {/* Order Summary */}
                    <div className="lg:col-span-1">
                        <div className="bg-gray-900 p-6 rounded-lg border border-gray-800 sticky top-4">
                            <h2 className="text-xl font-bold text-white mb-6 uppercase">Resumo do Pedido</h2>

                            <div className="space-y-4 mb-6">
                                {cartItems.map(item => (
                                    <div key={item.id} className="flex gap-4">
                                        <img src={item.image} alt={item.name} className="w-16 h-16 object-cover rounded flex-none" />
                                        <div className="flex-1 min-w-0">
                                            <div className="text-white font-medium truncate">{item.name}</div>
                                            <div className="flex items-center gap-2 mt-1">
                                                <div className="flex items-center gap-1 bg-black border border-gray-700 rounded px-1">
                                                    <button
                                                        type="button"
                                                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                                        aria-label={`Diminuir quantidade de ${item.name}`}
                                                        className="p-2.5 text-gray-300 hover:text-harley-orange transition-colors"
                                                    >
                                                        <Minus className="w-3 h-3" />
                                                    </button>
                                                    <span className="text-xs font-bold w-4 text-center text-white">{item.quantity}</span>
                                                    <button
                                                        type="button"
                                                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                                        aria-label={`Aumentar quantidade de ${item.name}`}
                                                        className="p-2.5 text-gray-300 hover:text-harley-orange transition-colors"
                                                    >
                                                        <Plus className="w-3 h-3" />
                                                    </button>
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => removeFromCart(item.id)}
                                                    aria-label={`Remover ${item.name} do pedido`}
                                                    className="p-2.5 text-gray-400 hover:text-red-500 transition-colors"
                                                >
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                </button>
                                            </div>
                                        </div>
                                        <div className="text-harley-orange font-bold flex-none">{formatCurrency(item.price)}</div>
                                    </div>
                                ))}
                            </div>

                            <div className="border-t border-gray-800 pt-4 space-y-2">
                                <div className="flex justify-between text-gray-400">
                                    <span>Subtotal</span>
                                    <span>{formatCurrency(cartTotal)}</span>
                                </div>
                                {selectedShipping && (
                                    <div className="flex justify-between text-gray-400">
                                        <span>Frete</span>
                                        <span>{formatCurrency(selectedShipping.price)}</span>
                                    </div>
                                )}
                                {paymentMethod === 'pix' && (
                                    <div className="flex justify-between text-green-500">
                                        <span>Desconto PIX (5%)</span>
                                        <span>- {formatCurrency(cartTotal * 0.05)}</span>
                                    </div>
                                )}
                                <div className="flex justify-between text-white text-xl font-bold pt-2 border-t border-gray-800">
                                    <span>Total</span>
                                    <span className="text-harley-orange">
                                        {formatCurrency(
                                            cartTotal +
                                            (selectedShipping ? selectedShipping.price : 0) -
                                            (paymentMethod === 'pix' ? cartTotal * 0.05 : 0)
                                        )}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CheckoutPage;
