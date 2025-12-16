import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, ArrowLeft, CheckCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import SEO from '../components/SEO';

const ForgotPasswordPage = () => {
    const { requestPasswordReset } = useAuth();
    const [email, setEmail] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setSuccess(false);

        try {
            await requestPasswordReset(email);
            setSuccess(true);
            setEmail('');
        } catch (err) {
            console.error(err);
            let errorMessage = 'Erro ao enviar e-mail de recuperação.';

            // Generic error message for security, or specific if needed
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-black flex items-center justify-center px-4 py-12">
            <SEO
                title="Recuperar Senha"
                description="Recupere sua senha do SICK GRIP"
            />
            <div className="max-w-md w-full bg-gray-900 rounded-lg border border-gray-800 p-8">
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-display font-bold text-white uppercase mb-2">
                        Esqueceu a Senha?
                    </h1>
                    <p className="text-gray-400">
                        Digite seu e-mail para receber instruções de recuperação
                    </p>
                </div>

                {success && (
                    <div className="bg-green-500/10 border border-green-500 text-green-500 p-4 rounded mb-6">
                        <div className="flex items-start gap-3">
                            <CheckCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
                            <div>
                                <p className="font-bold mb-1">E-mail enviado com sucesso!</p>
                                <p className="text-sm">
                                    Verifique sua caixa de entrada e siga as instruções para redefinir sua senha.
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {error && (
                    <div className="bg-red-500/10 border border-red-500 text-red-500 p-3 rounded mb-6 text-sm text-center">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label className="block text-gray-400 text-sm mb-2">E-mail</label>
                        <div className="relative">
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                className="w-full bg-black border border-gray-700 rounded p-3 pl-10 text-white focus:border-harley-orange focus:outline-none transition-colors"
                                placeholder="seu@email.com"
                                disabled={loading || success}
                            />
                            <Mail className="absolute left-3 top-3.5 w-5 h-5 text-gray-500" />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading || success}
                        className="w-full bg-harley-orange text-white py-3 rounded font-bold uppercase tracking-wider hover:bg-orange-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? 'Enviando...' : success ? 'E-mail Enviado' : 'Enviar E-mail de Recuperação'}
                    </button>
                </form>

                <div className="mt-8 text-center space-y-3">
                    <Link
                        to="/login"
                        className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Voltar para o login
                    </Link>

                    {success && (
                        <p className="text-sm text-gray-400">
                            Não recebeu o e-mail?{' '}
                            <button
                                onClick={() => setSuccess(false)}
                                className="text-harley-orange font-bold hover:underline"
                            >
                                Enviar novamente
                            </button>
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ForgotPasswordPage;
