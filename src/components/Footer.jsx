import React from 'react';
import { Link } from 'react-router-dom';
import { Facebook, Instagram, Twitter, MessageCircle } from 'lucide-react';

const Footer = () => {
    return (
        <footer className="bg-black text-white py-12 border-t border-gray-900">
            <div className="container mx-auto px-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">

                    {/* Quick Links */}
                    <div>
                        <h3 className="font-display font-bold text-lg uppercase mb-6 text-white tracking-widest">Quick Links</h3>
                        <ul className="space-y-3 text-sm text-gray-400">
                            <li><Link to="/" className="hover:text-sick-red transition-colors">Início</Link></li>
                            <li><Link to="/terms" className="hover:text-sick-red transition-colors">Termos e Condições</Link></li>
                            <li><Link to="/category/todos" className="hover:text-sick-red transition-colors">Todos os Produtos</Link></li>
                            <li><Link to="/my-orders" className="hover:text-sick-red transition-colors">Meus Pedidos</Link></li>
                            <li><Link to="/contato" className="hover:text-sick-red transition-colors">Fale Conosco</Link></li>
                        </ul>
                    </div>

                    {/* Conta */}
                    <div>
                        <h3 className="font-display font-bold text-lg uppercase mb-6 text-white tracking-widest">Conta</h3>
                        <ul className="space-y-3 text-sm text-gray-400">
                            <li><Link to="/profile" className="hover:text-sick-red transition-colors">Minha Conta</Link></li>
                            <li><Link to="/my-orders" className="hover:text-sick-red transition-colors">Meus Pedidos</Link></li>
                        </ul>
                    </div>

                    {/* Informações */}
                    <div>
                        <h3 className="font-display font-bold text-lg uppercase mb-6 text-white tracking-widest">Informações</h3>
                        <ul className="space-y-3 text-sm text-gray-400">
                            <li><Link to="/about" className="hover:text-sick-red transition-colors">Quem Somos</Link></li>
                            <li><Link to="/news" className="hover:text-sick-red transition-colors">Novidades</Link></li>
                            <li><Link to="/terms" className="hover:text-sick-red transition-colors">Termos e Condições</Link></li>
                            <li><Link to="/contato" className="hover:text-sick-red transition-colors">Contato</Link></li>
                            <li><Link to="/custom-parts" className="hover:text-sick-red transition-colors">Peças Customizadas</Link></li>
                        </ul>
                    </div>

                    {/* Redes Sociais & Newsletter */}
                    <div>
                        <h3 className="font-display font-bold text-lg uppercase mb-6 text-white tracking-widest">Redes Sociais</h3>
                        <div className="flex gap-4 mb-8">
                            <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className="bg-gray-800 p-2 rounded-full hover:bg-sick-red transition-colors">
                                <Facebook className="w-5 h-5" />
                            </a>
                            <a href="https://instagram.com/sick.grip" target="_blank" rel="noopener noreferrer" className="bg-gray-800 p-2 rounded-full hover:bg-sick-red transition-colors">
                                <Instagram className="w-5 h-5" />
                            </a>
                            <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="bg-gray-800 p-2 rounded-full hover:bg-sick-red transition-colors">
                                <Twitter className="w-5 h-5" />
                            </a>
                            <a href="#" target="_blank" rel="noopener noreferrer" className="bg-gray-800 p-2 rounded-full hover:bg-sick-red transition-colors">
                                <MessageCircle className="w-5 h-5" />
                            </a>
                        </div>

                        <h3 className="font-display font-bold text-lg uppercase mb-4 text-white tracking-widest">Newsletter</h3>
                        <div className="flex">
                            <input
                                type="email"
                                placeholder="Assinar"
                                className="bg-gray-200 text-black px-4 py-2 w-full focus:outline-none"
                            />
                            <button className="bg-gray-700 hover:bg-sick-red text-white px-4 py-2 transition-colors uppercase font-bold text-xs">
                                Assinar
                            </button>
                        </div>
                    </div>
                </div>

                <div className="border-t border-gray-900 pt-8">
                    {/* Gateways */}
                    <div className="mb-8">
                        <h4 className="text-white font-bold uppercase mb-4 text-sm tracking-wider">Gateways e Formas de Pagamento</h4>
                        <div className="flex gap-2 flex-wrap items-center">
                            {/* Using CDN images for payment logos */}
                            <div className="bg-white rounded px-2 py-1 h-10 flex items-center justify-center shadow-md">
                                <img src="https://logodownload.org/wp-content/uploads/2014/07/mastercard-logo-1.png" alt="Mastercard" className="h-6" />
                            </div>
                            <div className="bg-white rounded px-2 py-1 h-10 flex items-center justify-center shadow-md">
                                <img src="https://logodownload.org/wp-content/uploads/2016/10/Visa-logo.png" alt="Visa" className="h-6" />
                            </div>
                            <div className="bg-white rounded px-2 py-1 h-10 flex items-center justify-center shadow-md">
                                <img src="https://logodownload.org/wp-content/uploads/2017/04/elo-logo.png" alt="Elo" className="h-6" />
                            </div>
                            <div className="bg-white rounded px-2 py-1 h-10 flex items-center justify-center shadow-md">
                                <span className="font-bold text-sm text-red-600">Hipercard</span>
                            </div>
                            <div className="bg-white rounded px-2 py-1 h-10 flex items-center justify-center shadow-md">
                                <img src="https://logodownload.org/wp-content/uploads/2016/10/american-express-logo-0.png" alt="American Express" className="h-6" />
                            </div>
                            <div className="bg-white rounded px-2 py-1 h-10 flex items-center justify-center shadow-md">
                                <img src="https://logodownload.org/wp-content/uploads/2014/07/diners-club-logo-1.png" alt="Diners Club" className="h-6" />
                            </div>
                            <div className="bg-gray-800 rounded px-3 py-2 h-10 flex items-center justify-center shadow-md border border-gray-600">
                                <span className="font-bold text-xs text-white">Transferbank</span>
                            </div>
                            <div className="bg-gray-700 rounded px-3 py-2 h-10 flex items-center justify-center shadow-md border border-gray-600">
                                <span className="font-bold text-sm text-white">Boleto</span>
                            </div>
                        </div>
                    </div>

                    {/* Certificações */}
                    <div>
                        <h4 className="text-white font-bold uppercase mb-4 text-sm tracking-wider">Selos e Certificações</h4>
                        <div className="flex gap-4 items-center flex-wrap">
                            <div className="flex items-center gap-2 bg-green-600 rounded px-4 py-2 shadow-md">
                                <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                                </svg>
                                <span className="text-white text-xs font-bold uppercase">Site Seguro</span>
                            </div>
                            <div className="bg-white rounded px-4 py-2 shadow-md flex items-center gap-2">
                                <span className="text-blue-600 font-bold text-xs">Google</span>
                                <span className="text-gray-800 text-xs font-bold">Safe Browsing</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
