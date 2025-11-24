import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, User, ArrowRight, Phone } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const RegisterPage = () => {
    const { register } = useAuth();
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        confirmPassword: '',
        phone: '',
        cpf: '',
        cep: '',
        address: '',
        number: '',
        complement: '',
        city: '',
        state: ''
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [cepLoading, setCepLoading] = useState(false);

    const handleChange = (e) => {
        const { name, value } = e.target;
        let maskedValue = value;

        // Apply masks
        if (name === 'cpf') {
            maskedValue = value
                .replace(/\D/g, '')
                .replace(/(\d{3})(\d)/, '$1.$2')
                .replace(/(\d{3})(\d)/, '$1.$2')
                .replace(/(\d{3})(\d{1,2})/, '$1-$2')
                .replace(/(-\d{2})\d+?$/, '$1');
        }
        if (name === 'cep') {
            maskedValue = value
                .replace(/\D/g, '')
                .replace(/(\d{5})(\d)/, '$1-$2')
                .replace(/(-\d{3})\d+?$/, '$1');
        }
        if (name === 'phone') {
            maskedValue = value
                .replace(/\D/g, '')
                .replace(/(\d{2})(\d)/, '($1) $2')
                .replace(/(\d{5})(\d)/, '$1-$2')
                .replace(/(-\d{4})\d+?$/, '$1');
        }

        setFormData({ ...formData, [name]: maskedValue });
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
                    state: data.uf || '',
                    complement: data.complemento || prev.complement
                }));
            } else {
                alert('CEP não encontrado');
            }
        } catch (error) {
            console.error('Erro ao buscar CEP:', error);
        } finally {
            setCepLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        if (formData.password !== formData.confirmPassword) {
            setError('As senhas não coincidem.');
            setLoading(false);
            return;
        }

        try {
            await register(formData.name, formData.email, formData.password, {
                phone: formData.phone,
                cpf: formData.cpf,
                address: {
                    cep: formData.cep,
                    street: formData.address,
                    number: formData.number,
                    complement: formData.complement,
                    city: formData.city,
                    state: formData.state
                }
            });
            alert("Cadastro realizado com sucesso! Bem-vindo ao Mercado Harley.");
            navigate('/');
        } catch (err) {
            // Firebase error handling
            let errorMessage = 'Erro ao criar conta. Tente novamente.';

            if (err.code === 'auth/email-already-in-use') {
                errorMessage = 'Este e-mail já está cadastrado. Faça login.';
            } else if (err.code === 'auth/invalid-email') {
                errorMessage = 'E-mail inválido.';
            } else if (err.code === 'auth/weak-password') {
                errorMessage = 'Senha muito fraca. Use pelo menos 6 caracteres.';
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
                    <h1 className="text-3xl font-display font-bold text-white uppercase mb-2">Criar Conta</h1>
                    <p className="text-gray-400">Junte-se à comunidade Mercado Harley</p>
                </div>

                {error && (
                    <div className="bg-red-500/10 border border-red-500 text-red-500 p-3 rounded mb-6 text-sm text-center">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-gray-400 text-sm mb-2">Nome Completo</label>
                        <div className="relative">
                            <input
                                type="text"
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                required
                                className="w-full bg-black border border-gray-700 rounded p-3 pl-10 text-white focus:border-harley-orange focus:outline-none transition-colors"
                                placeholder="Seu nome"
                            />
                            <User className="absolute left-3 top-3.5 w-5 h-5 text-gray-500" />
                        </div>
                    </div>

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
                        <label className="block text-gray-400 text-sm mb-2">Telefone</label>
                        <div className="relative">
                            <input
                                type="tel"
                                name="phone"
                                value={formData.phone}
                                onChange={handleChange}
                                required
                                className="w-full bg-black border border-gray-700 rounded p-3 pl-10 text-white focus:border-harley-orange focus:outline-none transition-colors"
                                placeholder="(00) 00000-0000"
                            />
                            <Phone className="absolute left-3 top-3.5 w-5 h-5 text-gray-500" />
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

                    <div>
                        <label className="block text-gray-400 text-sm mb-2">Confirmar Senha</label>
                        <div className="relative">
                            <input
                                type="password"
                                name="confirmPassword"
                                value={formData.confirmPassword}
                                onChange={handleChange}
                                required
                                className="w-full bg-black border border-gray-700 rounded p-3 pl-10 text-white focus:border-harley-orange focus:outline-none transition-colors"
                                placeholder="••••••••"
                            />
                            <Lock className="absolute left-3 top-3.5 w-5 h-5 text-gray-500" />
                        </div>
                    </div>

                    {/* Address Section */}
                    <div className="col-span-2 mt-6 pt-6 border-t border-gray-800">
                        <h3 className="text-gray-400 text-sm mb-4 font-bold">📍 Endereço (Opcional - facilita o checkout)</h3>
                    </div>

                    <div>
                        <label className="block text-gray-400 text-sm mb-2">CPF</label>
                        <input
                            type="text"
                            name="cpf"
                            value={formData.cpf}
                            onChange={handleChange}
                            placeholder="000.000.000-00"
                            className="w-full bg-black border border-gray-700 rounded p-3 text-white focus:border-harley-orange focus:outline-none transition-colors"
                        />
                    </div>

                    <div>
                        <label className="block text-gray-400 text-sm mb-2">CEP</label>
                        <div className="relative">
                            <input
                                type="text"
                                name="cep"
                                value={formData.cep}
                                onChange={handleChange}
                                onBlur={(e) => fetchAddressByCep(e.target.value)}
                                placeholder="00000-000"
                                className="w-full bg-black border border-gray-700 rounded p-3 text-white focus:border-harley-orange focus:outline-none transition-colors"
                            />
                            {cepLoading && (
                                <div className="absolute right-3 top-3.5">
                                    <div className="w-5 h-5 border-2 border-harley-orange border-t-transparent rounded-full animate-spin"></div>
                                </div>
                            )}
                        </div>
                        <p className="text-gray-500 text-xs mt-1">O endereço será preenchido automaticamente</p>
                    </div>

                    <div className="col-span-2">
                        <label className="block text-gray-400 text-sm mb-2">Endereço</label>
                        <input
                            type="text"
                            name="address"
                            value={formData.address}
                            onChange={handleChange}
                            placeholder="Rua, Avenida..."
                            className="w-full bg-black border border-gray-700 rounded p-3 text-white focus:border-harley-orange focus:outline-none transition-colors"
                        />
                    </div>

                    <div>
                        <label className="block text-gray-400 text-sm mb-2">Número</label>
                        <input
                            type="text"
                            name="number"
                            value={formData.number}
                            onChange={handleChange}
                            placeholder="123"
                            className="w-full bg-black border border-gray-700 rounded p-3 text-white focus:border-harley-orange focus:outline-none transition-colors"
                        />
                    </div>

                    <div>
                        <label className="block text-gray-400 text-sm mb-2">Complemento</label>
                        <input
                            type="text"
                            name="complement"
                            value={formData.complement}
                            onChange={handleChange}
                            placeholder="Apto, Bloco..."
                            className="w-full bg-black border border-gray-700 rounded p-3 text-white focus:border-harley-orange focus:outline-none transition-colors"
                        />
                    </div>

                    <div>
                        <label className="block text-gray-400 text-sm mb-2">Cidade</label>
                        <input
                            type="text"
                            name="city"
                            value={formData.city}
                            onChange={handleChange}
                            placeholder="São Paulo"
                            className="w-full bg-black border border-gray-700 rounded p-3 text-white focus:border-harley-orange focus:outline-none transition-colors"
                        />
                    </div>

                    <div>
                        <label className="block text-gray-400 text-sm mb-2">Estado</label>
                        <input
                            type="text"
                            name="state"
                            value={formData.state}
                            onChange={handleChange}
                            placeholder="SP"
                            maxLength="2"
                            className="w-full bg-black border border-gray-700 rounded p-3 text-white focus:border-harley-orange focus:outline-none transition-colors uppercase"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-harley-orange text-white py-3 rounded font-bold uppercase tracking-wider hover:bg-orange-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed mt-6"
                    >
                        {loading ? 'Criando conta...' : 'Criar Conta'}
                        {!loading && <ArrowRight className="w-5 h-5" />}
                    </button>
                </form>

                <div className="mt-8 text-center">
                    <p className="text-gray-400 text-sm">
                        Já tem uma conta?{' '}
                        <Link to="/login" className="text-harley-orange font-bold hover:underline">
                            Entrar
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default RegisterPage;
