import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Mail, Lock, ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const LoginPage = () => {
    const { login } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const from = location.state?.from?.pathname || '/';

    const [formData, setFormData] = useState({ email: '', password: '' });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            await login(formData.email, formData.password);
            navigate(from, { replace: true });
        } catch (err) {
            // Firebase error handling
            let errorMessage = 'Falha ao fazer login. Verifique suas credenciais.';

            if (err.code === 'auth/user-not-found') {
                errorMessage = 'Usuário não encontrado. Verifique seu e-mail.';
            } else if (err.code === 'auth/wrong-password') {
                errorMessage = 'Senha incorreta. Tente novamente.';
            } else if (err.code === 'auth/invalid-email') {
                errorMessage = 'E-mail inválido.';
            } else if (err.code === 'auth/too-many-requests') {
                errorMessage = 'Muitas tentativas. Tente novamente mais tarde.';
            }

            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-black flex items-center justify-center px-4 py-12">
            <div className="max-w-md w-full bg-gray-900 rounded-lg border border-gray-800 p-8">
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-display font-bold text-white uppercase mb-2">Bem-vindo de Volta</h1>
                    <p className="text-gray-400">Entre na sua conta para continuar</p>
                </div>

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
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
                                required
                                className="w-full bg-black border border-gray-700 rounded p-3 pl-10 text-white focus:border-harley-orange focus:outline-none transition-colors"
                                placeholder="seu@email.com"
                            />
                            <Mail className="absolute left-3 top-3.5 w-5 h-5 text-gray-500" />
                        </div>
                    </div>

                    <div>
                        <label className="block text-gray-400 text-sm mb-2">Senha</label>
                        <div className="relative">
                            <input
                                type="password"
                                name="password"
                                value={formData.password}
                                onChange={handleChange}
                                required
                                className="w-full bg-black border border-gray-700 rounded p-3 pl-10 text-white focus:border-harley-orange focus:outline-none transition-colors"
                                placeholder="••••••••"
                            />
                            <Lock className="absolute left-3 top-3.5 w-5 h-5 text-gray-500" />
                        </div>
                    </div>

                    <div className="flex items-center justify-between text-sm">
                        <label className="flex items-center text-gray-400 cursor-pointer hover:text-white">
                            <input type="checkbox" className="mr-2 rounded bg-gray-800 border-gray-700 text-harley-orange focus:ring-harley-orange" />
                            Lembrar de mim
                        </label>
                        <Link to="/forgot-password" className="text-harley-orange hover:underline">Esqueceu a senha?</Link>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-harley-orange text-white py-3 rounded font-bold uppercase tracking-wider hover:bg-orange-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? 'Entrando...' : 'Entrar'}
                        {!loading && <ArrowRight className="w-5 h-5" />}
                    </button>
                </form>

                <div className="mt-8 text-center">
                    <p className="text-gray-400 text-sm">
                        Não tem uma conta?{' '}
                        <Link to="/register" className="text-harley-orange font-bold hover:underline">
                            Cadastre-se
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default LoginPage;
