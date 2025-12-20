import React, { useState } from 'react';
import { Package, Truck, Download, MapPin, AlertCircle, CheckCircle, Loader } from 'lucide-react';
import axios from 'axios';

const ShippingLabelSection = ({ orderId, shippingData, onUpdate }) => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

    // Get auth token
    const getAuthToken = () => {
        try {
            const userStr = localStorage.getItem('user');
            if (!userStr) {
                console.error('No user in localStorage');
                return null;
            }

            const user = JSON.parse(userStr);
            const token = user.stsTokenManager?.accessToken || user.token;

            if (!token) {
                console.error('No token found in user object:', user);
                return null;
            }

            return token;
        } catch (error) {
            console.error('Error getting auth token:', error);
            return null;
        }
    };

    // Create shipping label
    const handleCreateLabel = async () => {
        try {
            setLoading(true);
            setError('');
            setSuccess('');

            const token = await getAuthToken();
            if (!token) {
                setError('Sessão expirada. Faça login novamente.');
                return;
            }

            const response = await axios.post(
                `${API_URL}/api/shipping-labels/${orderId}/create`,
                {},
                {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                }
            );

            setSuccess('Etiqueta criada com sucesso! Email enviado ao cliente.');
            if (onUpdate) onUpdate();
        } catch (err) {
            console.error('Error creating label:', err);
            setError(err.response?.data?.message || 'Erro ao criar etiqueta');
        } finally {
            setLoading(false);
        }
    };

    // Request pickup
    const handleRequestPickup = async () => {
        try {
            setLoading(true);
            setError('');
            setSuccess('');

            const token = getAuthToken();
            const response = await axios.post(
                `${API_URL}/api/shipping-labels/${orderId}/pickup`,
                {},
                {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                }
            );

            setSuccess('Coleta solicitada com sucesso! Email enviado ao cliente.');
            if (onUpdate) onUpdate();
        } catch (err) {
            console.error('Error requesting pickup:', err);
            setError(err.response?.data?.message || 'Erro ao solicitar coleta');
        } finally {
            setLoading(false);
        }
    };

    // Download label PDF
    const handleDownloadLabel = async () => {
        try {
            setLoading(true);
            setError('');

            const token = getAuthToken();
            const response = await axios.get(
                `${API_URL}/api/shipping-labels/${orderId}/label`,
                {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                }
            );

            // Open PDF in new tab
            window.open(response.data.labelUrl, '_blank');
        } catch (err) {
            console.error('Error downloading label:', err);
            setError(err.response?.data?.message || 'Erro ao baixar etiqueta');
        } finally {
            setLoading(false);
        }
    };

    // View tracking
    const handleViewTracking = async () => {
        try {
            setLoading(true);
            setError('');

            const token = getAuthToken();
            const response = await axios.get(
                `${API_URL}/api/shipping-labels/${orderId}/tracking`,
                {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                }
            );

            // Open Correios tracking in new tab
            const trackingCode = response.data.trackingCode;
            window.open(`https://rastreamento.correios.com.br/app/index.php?codigo=${trackingCode}`, '_blank');
        } catch (err) {
            console.error('Error viewing tracking:', err);
            setError(err.response?.data?.message || 'Erro ao visualizar rastreamento');
        } finally {
            setLoading(false);
        }
    };

    const hasLabel = shippingData?.melhorEnvioId;
    const hasTracking = shippingData?.trackingCode;
    const pickupScheduled = shippingData?.pickupScheduled;

    return (
        <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
            <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <Package className="w-6 h-6 text-sick-red" />
                Etiqueta de Envio
            </h3>

            {/* Status Messages */}
            {error && (
                <div className="mb-4 p-4 bg-red-900/20 border border-red-500 rounded flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                    <p className="text-red-400 text-sm">{error}</p>
                </div>
            )}

            {success && (
                <div className="mb-4 p-4 bg-green-900/20 border border-green-500 rounded flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <p className="text-green-400 text-sm">{success}</p>
                </div>
            )}

            {/* Shipping Info */}
            {hasLabel && (
                <div className="mb-6 space-y-3">
                    <div className="bg-gray-800 rounded p-4">
                        <p className="text-gray-400 text-sm mb-1">Código de Rastreio</p>
                        <p className="text-white font-mono text-lg font-bold">
                            {hasTracking || 'Aguardando...'}
                        </p>
                    </div>

                    {pickupScheduled && (
                        <div className="bg-green-900/20 border border-green-500 rounded p-4">
                            <p className="text-green-400 font-medium flex items-center gap-2">
                                <CheckCircle className="w-5 h-5" />
                                Coleta Agendada
                            </p>
                        </div>
                    )}
                </div>
            )}

            {/* Action Buttons */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {!hasLabel ? (
                    <button
                        onClick={handleCreateLabel}
                        disabled={loading}
                        className="col-span-full bg-sick-red text-white px-6 py-3 rounded font-bold uppercase hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        {loading ? (
                            <>
                                <Loader className="w-5 h-5 animate-spin" />
                                Criando Etiqueta...
                            </>
                        ) : (
                            <>
                                <Package className="w-5 h-5" />
                                Gerar Etiqueta
                            </>
                        )}
                    </button>
                ) : (
                    <>
                        <button
                            onClick={handleDownloadLabel}
                            disabled={loading}
                            className="bg-blue-600 text-white px-4 py-3 rounded font-bold hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            <Download className="w-5 h-5" />
                            Baixar PDF
                        </button>

                        {!pickupScheduled && (
                            <button
                                onClick={handleRequestPickup}
                                disabled={loading}
                                className="bg-green-600 text-white px-4 py-3 rounded font-bold hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                <Truck className="w-5 h-5" />
                                Solicitar Coleta
                            </button>
                        )}

                        {hasTracking && (
                            <button
                                onClick={handleViewTracking}
                                disabled={loading}
                                className="bg-purple-600 text-white px-4 py-3 rounded font-bold hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                <MapPin className="w-5 h-5" />
                                Rastrear Pedido
                            </button>
                        )}
                    </>
                )}
            </div>

            {/* Help Text */}
            <div className="mt-4 p-4 bg-gray-800 rounded">
                <p className="text-gray-400 text-sm">
                    {!hasLabel ? (
                        <>
                            <strong className="text-white">💡 Próximo passo:</strong> Clique em "Gerar Etiqueta" para criar a etiqueta de envio no Melhor Envio.
                            O sistema irá automaticamente enviar um email ao cliente com o código de rastreio.
                        </>
                    ) : !pickupScheduled ? (
                        <>
                            <strong className="text-white">💡 Próximo passo:</strong> Clique em "Solicitar Coleta" para agendar a coleta com a transportadora.
                            O cliente receberá um email confirmando o envio.
                        </>
                    ) : (
                        <>
                            <strong className="text-white">✅ Tudo pronto!</strong> A etiqueta foi gerada e a coleta foi agendada.
                            O cliente já recebeu o código de rastreio por email.
                        </>
                    )}
                </p>
            </div>
        </div>
    );
};

export default ShippingLabelSection;
