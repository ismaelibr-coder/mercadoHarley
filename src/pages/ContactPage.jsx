
import React from 'react';
import Layout from '../components/Layout';
import { Mail, Phone, MapPin } from 'lucide-react';

const ContactPage = () => {
    return (
        <Layout>
            <div className="container mx-auto px-4 py-12 text-white">
                <h1 className="text-4xl font-display font-bold uppercase mb-8 text-sick-red">Fale Conosco</h1>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                    <div>
                        <p className="text-lg text-gray-300 mb-8">
                            Tem alguma dúvida sobre peças, compatibilidade ou seu pedido? Entre em contato com nossa equipe especializada.
                        </p>

                        <div className="space-y-6">
                            <div className="flex items-center gap-4">
                                <div className="bg-gray-900 p-3 rounded-full text-sick-red">
                                    <Phone className="w-6 h-6" />
                                </div>
                                <div>
                                    <h3 className="font-bold uppercase text-sm text-gray-500">Telefone / WhatsApp</h3>
                                    <p className="text-xl font-bold">(51) 98444-2294</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-4">
                                <div className="bg-gray-900 p-3 rounded-full text-sick-red">
                                    <Mail className="w-6 h-6" />
                                </div>
                                <div>
                                    <h3 className="font-bold uppercase text-sm text-gray-500">Email</h3>
                                    <p className="text-xl font-bold">sickgrip.br@gmail.com</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-4">
                                <div className="bg-gray-900 p-3 rounded-full text-sick-red">
                                    <MapPin className="w-6 h-6" />
                                </div>
                                <div>
                                    <h3 className="font-bold uppercase text-sm text-gray-500">Endereço</h3>
                                    <p className="text-lg font-bold">R. Júlio Verne, 788 - Santa Maria Goretti, Porto Alegre - RS, 91030-170</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-gray-900 p-8 rounded-lg border border-gray-800">
                        <h2 className="text-2xl font-bold uppercase mb-6 text-white">Envie uma Mensagem</h2>
                        <form className="space-y-4">
                            <div>
                                <label className="block text-sm font-bold text-gray-400 mb-1">NOME</label>
                                <input type="text" className="w-full bg-black border border-gray-700 rounded p-3 text-white focus:border-sick-red focus:outline-none" />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-400 mb-1">EMAIL</label>
                                <input type="email" className="w-full bg-black border border-gray-700 rounded p-3 text-white focus:border-sick-red focus:outline-none" />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-400 mb-1">MENSAGEM</label>
                                <textarea rows="4" className="w-full bg-black border border-gray-700 rounded p-3 text-white focus:border-sick-red focus:outline-none"></textarea>
                            </div>
                            <button className="w-full bg-sick-red text-white py-3 rounded font-bold uppercase hover:bg-red-700 transition-colors">
                                Enviar
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </Layout>
    );
};

export default ContactPage;
