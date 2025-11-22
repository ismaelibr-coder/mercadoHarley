import React, { useState } from 'react';
import { Mail, Phone, MapPin, Send } from 'lucide-react';

const ContactPage = () => {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        subject: '',
        message: ''
    });

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        // Simulate form submission
        alert('Mensagem enviada com sucesso! Entraremos em contato em breve.');
        setFormData({ name: '', email: '', subject: '', message: '' });
    };

    return (
        <div className="bg-black min-h-screen py-12">
            <div className="container mx-auto px-4">
                <div className="text-center mb-16">
                    <h1 className="text-4xl md:text-5xl font-display font-bold text-white uppercase tracking-wider mb-4">
                        Fale Conosco
                    </h1>
                    <div className="w-24 h-1 bg-harley-orange mx-auto"></div>
                    <p className="text-gray-400 mt-6 max-w-2xl mx-auto">
                        Tem alguma dúvida sobre peças, acessórios ou compatibilidade? Nossa equipe de especialistas está pronta para ajudar.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-12 max-w-6xl mx-auto">
                    {/* Contact Info */}
                    <div className="space-y-8">
                        <div className="bg-gray-900 p-8 rounded-lg border border-gray-800">
                            <h3 className="text-2xl font-display font-bold text-white uppercase mb-6">Informações de Contato</h3>
                            <div className="space-y-6">
                                <div className="flex items-start gap-4">
                                    <div className="bg-harley-orange p-3 rounded-full text-white">
                                        <Phone className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <h4 className="text-white font-bold uppercase mb-1">Telefone / WhatsApp</h4>
                                        <p className="text-gray-400">(11) 99999-9999</p>
                                        <p className="text-gray-500 text-sm">Seg - Sex: 9h às 18h</p>
                                    </div>
                                </div>

                                <div className="flex items-start gap-4">
                                    <div className="bg-harley-orange p-3 rounded-full text-white">
                                        <Mail className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <h4 className="text-white font-bold uppercase mb-1">E-mail</h4>
                                        <p className="text-gray-400">contato@mercadoharley.com.br</p>
                                        <p className="text-gray-500 text-sm">Respondemos em até 24h</p>
                                    </div>
                                </div>

                                <div className="flex items-start gap-4">
                                    <div className="bg-harley-orange p-3 rounded-full text-white">
                                        <MapPin className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <h4 className="text-white font-bold uppercase mb-1">Endereço</h4>
                                        <p className="text-gray-400">Av. das Motocicletas, 1903</p>
                                        <p className="text-gray-400">São Paulo - SP</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Contact Form */}
                    <div className="bg-gray-900 p-8 rounded-lg border border-gray-800">
                        <h3 className="text-2xl font-display font-bold text-white uppercase mb-6">Envie uma Mensagem</h3>
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-gray-400 text-sm mb-2">Nome</label>
                                    <input
                                        type="text"
                                        name="name"
                                        value={formData.name}
                                        onChange={handleChange}
                                        required
                                        className="w-full bg-black border border-gray-700 rounded p-3 text-white focus:border-harley-orange focus:outline-none transition-colors"
                                    />
                                </div>
                                <div>
                                    <label className="block text-gray-400 text-sm mb-2">E-mail</label>
                                    <input
                                        type="email"
                                        name="email"
                                        value={formData.email}
                                        onChange={handleChange}
                                        required
                                        className="w-full bg-black border border-gray-700 rounded p-3 text-white focus:border-harley-orange focus:outline-none transition-colors"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-gray-400 text-sm mb-2">Assunto</label>
                                <input
                                    type="text"
                                    name="subject"
                                    value={formData.subject}
                                    onChange={handleChange}
                                    required
                                    className="w-full bg-black border border-gray-700 rounded p-3 text-white focus:border-harley-orange focus:outline-none transition-colors"
                                />
                            </div>

                            <div>
                                <label className="block text-gray-400 text-sm mb-2">Mensagem</label>
                                <textarea
                                    name="message"
                                    value={formData.message}
                                    onChange={handleChange}
                                    required
                                    rows="4"
                                    className="w-full bg-black border border-gray-700 rounded p-3 text-white focus:border-harley-orange focus:outline-none transition-colors resize-none"
                                ></textarea>
                            </div>

                            <button
                                type="submit"
                                className="w-full bg-harley-orange text-white py-3 rounded font-bold uppercase tracking-wider hover:bg-orange-700 transition-colors flex items-center justify-center gap-2"
                            >
                                Enviar Mensagem
                                <Send className="w-5 h-5" />
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ContactPage;
