import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, CheckCircle, ArrowLeft } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { updatePassword, reauthenticateWithCredential, EmailAuthProvider } from 'firebase/auth';
import SEO from '../components/SEO';

const ChangePasswordPage = () => {
    const { currentUser } = useAuth();
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setSuccess(false);

        // Validações
        if (formData.newPassword !== formData.confirmPassword) {
            setError('As senhas não coincidem. Digite a mesma senha nos dois campos.');
            setLoading(false);
            return;
        }

        if (formData.newPassword.length < 6) {
            setError('A nova senha deve ter no mínimo 6 caracteres.');
            setLoading(false);
            return;
        }

        if (formData.currentPassword === formData.newPassword) {
            setError('A nova senha deve ser diferente da senha atual.');
            setLoading(false);
            return;
        }

        try {
            // Reautenticar usuário com senha atual
            const credential = EmailAuthProvider.credential(
                currentUser.email,
                formData.currentPassword
            );
            await reauthenticateWithCredential(currentUser, credential);

            // Atualizar senha
            await updatePassword(currentUser, formData.newPassword);

            setSuccess(true);
            setFormData({
                currentPassword: '',
                newPassword: '',
                confirmPassword: ''
            });

            // Redirecionar após 2 segundos
            setTimeout(() => {
                navigate('/');
            }, 2000);

        } catch (err) {
            let errorMessage = 'Erro ao alterar senha.';

            if (err.code === 'auth/wrong-password') {
                errorMessage = 'Senha atual incorreta.';
            } else if (err.code === 'auth/weak-password') {
                errorMessage = 'A nova senha é muito fraca.';
            } else if (err.code === 'auth/requires-recent-login') {
                errorMessage = 'Por segurança, faça login novamente antes de alterar a senha.';
            }

            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-black flex items-center justify-center px-4 py-12">
            <SEO
                title="Alterar Senha"
                description="Altere sua senha do Mercado Harley"
            />
            <div className="max-w-md w-full bg-gray-900 rounded-lg border border-gray-800 p-8">
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-display font-bold text-white uppercase mb-2">
                        Alterar Senha
                    </h1>
                    <p className="text-gray-400">
                        Digite sua senha atual e escolha uma nova senha
                    </p>
                </div>

                {success && (
                    <div className="bg-green-500/10 border border-green-500 text-green-500 p-4 rounded mb-6">
                        <div className="flex items-start gap-3">
                            <CheckCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
                            <div>
                                <p className="font-bold mb-1">Senha alterada com sucesso!</p>
                                <p className="text-sm">
                                    Redirecionando...
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
                        <label className="block text-gray-400 text-sm mb-2">Senha Atual *</label>
                        <div className="relative">
                            <input
                                type="password"
                                name="currentPassword"
                                value={formData.currentPassword}
                                onChange={handleChange}
                                required
                                className="w-full bg-black border border-gray-700 rounded p-3 pl-10 text-white focus:border-harley-orange focus:outline-none transition-colors"
                                placeholder="••••••••"
                                disabled={loading || success}
                            />
                            <Lock className="absolute left-3 top-3.5 w-5 h-5 text-gray-500" />
                        </div>
                    </div>

                    <div>
                        <label className="block text-gray-400 text-sm mb-2">Nova Senha *</label>
                        <div className="relative">
                            <input
                                type="password"
                                name="newPassword"
                                value={formData.newPassword}
                                onChange={handleChange}
                                required
                                minLength="6"
                                className="w-full bg-black border border-gray-700 rounded p-3 pl-10 text-white focus:border-harley-orange focus:outline-none transition-colors"
                                placeholder="••••••••"
                                disabled={loading || success}
                            />
                            <Lock className="absolute left-3 top-3.5 w-5 h-5 text-gray-500" />
                        </div>
                        <p className="text-xs text-gray-500 mt-1">Mínimo de 6 caracteres</p>
                    </div>

                    <div>
                        <label className="block text-gray-400 text-sm mb-2">Confirmar Nova Senha *</label>
                        <div className="relative">
                            <input
                                type="password"
                                name="confirmPassword"
                                value={formData.confirmPassword}
                                onChange={handleChange}
                                required
                                minLength="6"
                                className="w-full bg-black border border-gray-700 rounded p-3 pl-10 text-white focus:border-harley-orange focus:outline-none transition-colors"
                                placeholder="••••••••"
                                disabled={loading || success}
                            />
                            <Lock className="absolute left-3 top-3.5 w-5 h-5 text-gray-500" />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading || success}
                        className="w-full bg-harley-orange text-white py-3 rounded font-bold uppercase tracking-wider hover:bg-orange-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? 'Alterando...' : success ? 'Senha Alterada' : 'Alterar Senha'}
                    </button>
                </form>

                <div className="mt-8 text-center">
                    <button
                        onClick={() => navigate(-1)}
                        className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Voltar
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ChangePasswordPage;
