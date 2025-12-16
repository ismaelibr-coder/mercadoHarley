import React, { useState, useEffect } from 'react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, CreditCard, Truck, QrCode, Barcode, AlertCircle } from 'lucide-react';

import { createPixPayment, createBoletoPayment, processCreditCardPayment, initMercadoPago } from '../services/paymentService';
import { calculateShipping } from '../services/shippingService';

const CheckoutPage = () => {
    const { cartItems, cartTotal, clearCart } = useCart();
    const { currentUser, loading: authLoading, getUserProfile } = useAuth();
    const navigate = useNavigate();

    const [loading, setLoading] = useState(false);
    const [step, setStep] = useState('shipping');
    const [paymentMethod, setPaymentMethod] = useState('credit');
    const [orderId, setOrderId] = useState(null);
    const [userProfile, setUserProfile] = useState(null);
    const [useSavedAddress, setUseSavedAddress] = useState(true);

    const [formData, setFormData] = useState({
        name: '',
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
                    console.log('No profile found in Firestore');
                }
            } else {
                console.log('User is not logged in');
            }
        };

        loadUserProfile();
    }, [currentUser, authLoading, useSavedAddress, getUserProfile]);

    // Initialize Mercado Pago SDK
    useEffect(() => {
        initMercadoPago();
    }, []);

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

    const handlePayment = async (e) => {
        e.preventDefault();

        if (!validateForm()) {
            return;
        }

        setLoading(true);

        try {
            const subtotal = cartTotal;
            const shippingCost = selectedShipping ? selectedShipping.price : 0;
            const discount = paymentMethod === 'pix' ? subtotal * 0.05 : 0;
            const total = subtotal - discount + shippingCost;

            const orderData = {
                userId: currentUser?.uid || 'guest',
                userEmail: currentUser?.email || formData.email || 'guest@example.com',
                customer: {
                    name: formData.name,
                    cpf: formData.cpf,
                    phone: formData.phone,
                    email: currentUser?.email || formData.email || ''
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
                    deliveryDays: selectedShipping ? selectedShipping.deliveryDays : 0
                },
                items: cartItems.map(item => ({
                    id: item.id,
                    name: item.name,
                    price: parseFloat(item.price.replace('R$', '').replace('.', '').replace(',', '.').trim()),
                    quantity: item.quantity,
                    image: item.image,
                    profitMargin: item.profitMargin || 0,
                    partner: item.partner || ''
                })),
                payment: {
                    method: paymentMethod,
                    status: 'pending'
                },
                subtotal,
                // shipping: shippingCost, // Already included in shipping object above
                discount,
                total
            };

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
                <button onClick={() => navigate('/')} className="text-sick-red hover:underline">
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
                <h2 className="text-4xl font-display font-bold mb-4 text-sick-red">Pedido Confirmado!</h2>
                <p className="text-gray-400 text-lg mb-8 max-w-md">
                    Obrigado pela sua compra. Você receberá um e-mail com os detalhes do pedido e código de rastreio.
                </p>
                <button
                    onClick={() => navigate('/')}
                    className="bg-sick-red text-white py-3 px-8 rounded font-bold hover:bg-orange-700 transition-colors uppercase tracking-wide"
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
                                <Truck className="w-6 h-6 text-sick-red" />
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
                                        type="text" className={`w-full bg-black border ${errors.name ? 'border-red-500' : 'border-gray-700'} rounded p-3 text-white focus:border-sick-red focus:outline-none transition-colors`}
                                    />
                                    {errors.name && <span className="text-red-500 text-xs flex items-center gap-1 mt-1"><AlertCircle className="w-3 h-3" /> {errors.name}</span>}
                                </div>
                                <div>
                                    <label className="block text-gray-400 text-sm mb-2">CPF</label>
                                    <input
                                        name="cpf" value={formData.cpf} onChange={handleChange} placeholder="000.000.000-00"
                                        type="text" className={`w-full bg-black border ${errors.cpf ? 'border-red-500' : 'border-gray-700'} rounded p-3 text-white focus:border-sick-red focus:outline-none transition-colors`}
                                    />
                                    {errors.cpf && <span className="text-red-500 text-xs flex items-center gap-1 mt-1"><AlertCircle className="w-3 h-3" /> {errors.cpf}</span>}
                                </div>
                                <div>
                                    <label className="block text-gray-400 text-sm mb-2">Telefone / WhatsApp</label>
                                    <input
                                        name="phone" value={formData.phone} onChange={handleChange} placeholder="(00) 00000-0000"
                                        type="text" className={`w-full bg-black border ${errors.phone ? 'border-red-500' : 'border-gray-700'} rounded p-3 text-white focus:border-sick-red focus:outline-none transition-colors`}
                                    />
                                    {errors.phone && <span className="text-red-500 text-xs flex items-center gap-1 mt-1"><AlertCircle className="w-3 h-3" /> {errors.phone}</span>}
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
                                    <label className="block text-gray-400 text-sm mb-2">CEP</label>
                                    <div className="relative">
                                        <input
                                            name="cep" value={formData.cep} onChange={handleChange}
                                            onBlur={(e) => fetchAddressByCep(e.target.value)}
                                            placeholder="00000-000"
                                            type="text" className={`w-full bg-black border ${errors.cep ? 'border-red-500' : 'border-gray-700'} rounded p-3 text-white focus:border-sick-red focus:outline-none transition-colors`}
                                        />
                                        {cepLoading && (
                                            <div className="absolute right-3 top-3.5">
                                                <div className="w-5 h-5 border-2 border-sick-red border-t-transparent rounded-full animate-spin"></div>
                                            </div>
                                        )}
                                    </div>
                                    {errors.cep && <span className="text-red-500 text-xs flex items-center gap-1 mt-1"><AlertCircle className="w-3 h-3" /> {errors.cep}</span>}
                                    <p className="text-gray-500 text-xs mt-1">O endereço será preenchido automaticamente</p>
                                </div>
                                <div>
                                    <label className="block text-gray-400 text-sm mb-2">Cidade</label>
                                    <input
                                        name="city" value={formData.city} onChange={handleChange}
                                        type="text" className={`w-full bg-black border ${errors.city ? 'border-red-500' : 'border-gray-700'} rounded p-3 text-white focus:border-sick-red focus:outline-none transition-colors`}
                                    />
                                    {errors.city && <span className="text-red-500 text-xs flex items-center gap-1 mt-1"><AlertCircle className="w-3 h-3" /> {errors.city}</span>}
                                </div>
                                <div className="md:col-span-2">
                                    <label className="block text-gray-400 text-sm mb-2">Endereço</label>
                                    <input
                                        name="address" value={formData.address} onChange={handleChange}
                                        type="text" className={`w-full bg-black border ${errors.address ? 'border-red-500' : 'border-gray-700'} rounded p-3 text-white focus:border-sick-red focus:outline-none transition-colors`}
                                    />
                                    {errors.address && <span className="text-red-500 text-xs flex items-center gap-1 mt-1"><AlertCircle className="w-3 h-3" /> {errors.address}</span>}
                                </div>
                                <div>
                                    <label className="block text-gray-400 text-sm mb-2">Número</label>
                                    <input
                                        name="number" value={formData.number} onChange={handleChange}
                                        type="text" className={`w-full bg-black border ${errors.number ? 'border-red-500' : 'border-gray-700'} rounded p-3 text-white focus:border-sick-red focus:outline-none transition-colors`}
                                    />
                                    {errors.number && <span className="text-red-500 text-xs flex items-center gap-1 mt-1"><AlertCircle className="w-3 h-3" /> {errors.number}</span>}
                                </div>
                                <div>
                                    <label className="block text-gray-400 text-sm mb-2">Complemento</label>
                                    <input
                                        name="complement" value={formData.complement} onChange={handleChange}
                                        type="text" className="w-full bg-black border border-gray-700 rounded p-3 text-white focus:border-sick-red focus:outline-none transition-colors"
                                    />
                                </div>

                                {/* Shipping Options */}
                                {formData.cep.length >= 9 && (
                                    <div className="md:col-span-2 mt-4">
                                        <h3 className="text-white font-bold mb-4 border-b border-gray-800 pb-2">Opções de Frete</h3>
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
                                                        <div className="text-sick-red font-bold">R$ {option.price.toFixed(2)}</div>
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
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div className="md:col-span-2">
                                                <label className="block text-gray-400 text-sm mb-2">Número do Cartão</label>
                                                <input
                                                    name="cardNumber" value={formData.cardNumber} onChange={handleChange}
                                                    placeholder="0000 0000 0000 0000"
                                                    type="text" className={`w-full bg-black border ${errors.cardNumber ? 'border-red-500' : 'border-gray-700'} rounded p-3 text-white focus:border-sick-red focus:outline-none transition-colors`}
                                                />
                                                {errors.cardNumber && <span className="text-red-500 text-xs flex items-center gap-1 mt-1"><AlertCircle className="w-3 h-3" /> {errors.cardNumber}</span>}
                                            </div>
                                            <div className="md:col-span-2">
                                                <label className="block text-gray-400 text-sm mb-2">Nome no Cartão</label>
                                                <input
                                                    name="cardName" value={formData.cardName} onChange={handleChange}
                                                    placeholder="NOME COMO NO CARTÃO"
                                                    type="text" className={`w-full bg-black border ${errors.cardName ? 'border-red-500' : 'border-gray-700'} rounded p-3 text-white focus:border-sick-red focus:outline-none transition-colors uppercase`}
                                                />
                                                {errors.cardName && <span className="text-red-500 text-xs flex items-center gap-1 mt-1"><AlertCircle className="w-3 h-3" /> {errors.cardName}</span>}
                                            </div>
                                            <div>
                                                <label className="block text-gray-400 text-sm mb-2">Validade</label>
                                                <input
                                                    name="cardExpiry" value={formData.cardExpiry} onChange={handleChange}
                                                    placeholder="MM/AA"
                                                    type="text" className={`w-full bg-black border ${errors.cardExpiry ? 'border-red-500' : 'border-gray-700'} rounded p-3 text-white focus:border-sick-red focus:outline-none transition-colors`}
                                                />
                                                {errors.cardExpiry && <span className="text-red-500 text-xs flex items-center gap-1 mt-1"><AlertCircle className="w-3 h-3" /> {errors.cardExpiry}</span>}
                                            </div>
                                            <div>
                                                <label className="block text-gray-400 text-sm mb-2">CVV</label>
                                                <input
                                                    name="cardCvv" value={formData.cardCvv} onChange={handleChange}
                                                    placeholder="000"
                                                    type="text" maxLength="4" className={`w-full bg-black border ${errors.cardCvv ? 'border-red-500' : 'border-gray-700'} rounded p-3 text-white focus:border-sick-red focus:outline-none transition-colors`}
                                                />
                                                {errors.cardCvv && <span className="text-red-500 text-xs flex items-center gap-1 mt-1"><AlertCircle className="w-3 h-3" /> {errors.cardCvv}</span>}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div className="md:col-span-2 mt-6">
                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="w-full bg-sick-red text-white py-4 rounded font-bold hover:bg-orange-700 transition-colors uppercase tracking-wide disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {loading ? 'Processando...' : 'Finalizar Pedido'}
                                    </button>
                                </div>
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
                                        <img src={item.image} alt={item.name} className="w-16 h-16 object-cover rounded" />
                                        <div className="flex-1">
                                            <div className="text-white font-medium">{item.name}</div>
                                            <div className="text-gray-400 text-sm">Qtd: {item.quantity}</div>
                                        </div>
                                        <div className="text-harley-orange font-bold">{item.price}</div>
                                    </div>
                                ))}
                            </div>

                            <div className="border-t border-gray-800 pt-4 space-y-2">
                                <div className="flex justify-between text-gray-400">
                                    <span>Subtotal</span>
                                    <span>R$ {cartTotal.toFixed(2)}</span>
                                </div>
                                {selectedShipping && (
                                    <div className="flex justify-between text-gray-400">
                                        <span>Frete</span>
                                        <span>R$ {selectedShipping.price.toFixed(2)}</span>
                                    </div>
                                )}
                                {paymentMethod === 'pix' && (
                                    <div className="flex justify-between text-green-500">
                                        <span>Desconto PIX (5%)</span>
                                        <span>- R$ {(cartTotal * 0.05).toFixed(2)}</span>
                                    </div>
                                )}
                                <div className="flex justify-between text-white text-xl font-bold pt-2 border-t border-gray-800">
                                    <span>Total</span>
                                    <span className="text-harley-orange">
                                        R$ {(
                                            cartTotal +
                                            (selectedShipping ? selectedShipping.price : 0) -
                                            (paymentMethod === 'pix' ? cartTotal * 0.05 : 0)
                                        ).toFixed(2)}
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
