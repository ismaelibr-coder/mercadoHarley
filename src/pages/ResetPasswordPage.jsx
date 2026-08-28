import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Lock, ArrowLeft, CheckCircle, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import SEO from '../components/SEO';

const ResetPasswordPage = () => {
    const { resetPasswordWithToken } = useAuth();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const token = searchParams.get('token') || '';
    const email = searchParams.get('email') || '';

    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const [loading, setLoading] = useState(false);

    const linkIsIncomplete = !token || !email;

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (newPassword.length < 6) {
            setError('A senha deve ter ao menos 6 caracteres.');
            return;
        }
        if (newPassword !== confirmPassword) {
            setError('As senhas não coincidem.');
            return;
        }

        setLoading(true);
        try {
            await resetPasswordWithToken(email, token, newPassword);
            setSuccess(true);
            setTimeout(() => navigate('/login'), 2500);
        } catch (err) {
            setError(err.message || 'Não foi possível redefinir a senha.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-black flex items-center justify-center px-4 py-12">
            <SEO
                title="Redefinir Senha"
                description="Defina uma nova senha para sua conta"
            />
            <div className="max-w-md w-full bg-gray-900 rounded-lg border border-gray-800 p-8">
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-display font-bold text-white uppercase mb-2">
                        Redefinir Senha
                    </h1>
                    <p className="text-gray-400">
                        Escolha uma nova senha para sua conta
                    </p>
                </div>

                {linkIsIncomplete && (
                    <div className="bg-red-500/10 border border-red-500 text-red-500 p-4 rounded mb-6 flex items-start gap-3">
                        <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
                        <p className="text-sm">
                            Este link de redefinição está incompleto. Solicite um novo em{' '}
                            <Link to="/forgot-password" className="underline font-bold">Esqueci minha senha</Link>.
                        </p>
                    </div>
                )}

                {success ? (
                    <div className="bg-green-500/10 border border-green-500 text-green-500 p-4 rounded mb-6">
                        <div className="flex items-start gap-3">
                            <CheckCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
                            <div>
                                <p className="font-bold mb-1">Senha redefinida com sucesso!</p>
                                <p className="text-sm">Redirecionando para o login...</p>
                            </div>
                        </div>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {error && (
                            <div className="bg-red-500/10 border border-red-500 text-red-500 p-3 rounded text-sm text-center">
                                {error}
                            </div>
                        )}

                        <div>
                            <label className="block text-gray-400 text-sm mb-2">Nova senha</label>
                            <div className="relative">
                                <input
                                    type="password"
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    required
                                    disabled={loading || linkIsIncomplete}
                                    className="w-full bg-black border border-gray-700 rounded p-3 pl-10 text-white focus:border-harley-orange focus:outline-none transition-colors"
                                    placeholder="Mínimo 6 caracteres"
                                />
                                <Lock className="absolute left-3 top-3.5 w-5 h-5 text-gray-500" />
                            </div>
                        </div>

                        <div>
                            <label className="block text-gray-400 text-sm mb-2">Confirmar nova senha</label>
                            <div className="relative">
                                <input
                                    type="password"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    required
                                    disabled={loading || linkIsIncomplete}
                                    className="w-full bg-black border border-gray-700 rounded p-3 pl-10 text-white focus:border-harley-orange focus:outline-none transition-colors"
                                    placeholder="Repita a nova senha"
                                />
                                <Lock className="absolute left-3 top-3.5 w-5 h-5 text-gray-500" />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading || linkIsIncomplete}
                            className="w-full bg-harley-orange text-white py-3 rounded font-bold uppercase tracking-wider hover:bg-red-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? 'Salvando...' : 'Redefinir Senha'}
                        </button>
                    </form>
                )}

                <div className="mt-8 text-center">
                    <Link
                        to="/login"
                        className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Voltar para o login
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default ResetPasswordPage;
