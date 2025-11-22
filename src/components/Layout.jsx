import React, { useState } from 'react';
import { Menu, X, ShoppingCart, Phone, Mail, Instagram, Facebook, Twitter, User, LogOut } from 'lucide-react';
import CartSidebar from './CartSidebar';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import WhatsAppButton from './WhatsAppButton';

const Layout = ({ children }) => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const { cartCount, isCartOpen, setIsCartOpen } = useCart();
    const { currentUser, logout } = useAuth();
    const navigate = useNavigate();

    const toggleMenu = () => setIsMenuOpen(!isMenuOpen);
    const toggleCart = () => setIsCartOpen(!isCartOpen);

    const handleLogout = async () => {
        await logout();
        navigate('/');
    };

    return (
        <div className="min-h-screen flex flex-col bg-black text-white font-sans">
            {/* Header */}
            <header className="bg-black border-b border-gray-800 sticky top-0 z-50">
                <div className="container mx-auto px-4 py-4">
                    <div className="flex items-center justify-between">
                        {/* Logo */}
                        <Link to="/" className="flex items-center gap-3 group">
                            <img src="/logo.png" alt="Mercado Harley" className="h-16 md:h-20 w-auto transition-transform duration-300 group-hover:scale-105" />
                            <span className="font-display font-bold text-2xl md:text-3xl tracking-wider uppercase text-white group-hover:text-harley-orange transition-colors duration-300 hidden sm:block">
                                Mercado <span className="text-harley-orange group-hover:text-white">Harley</span>
                            </span>
                        </Link>

                        {/* Desktop Navigation */}
                        <nav className="hidden md:flex items-center gap-8">
                            <Link to="/" className="font-bold hover:text-harley-orange transition-colors uppercase text-sm tracking-wide">Início</Link>
                            <Link to="/category/pecas" className="font-bold hover:text-harley-orange transition-colors uppercase text-sm tracking-wide">Peças</Link>
                            <Link to="/category/acessorios" className="font-bold hover:text-harley-orange transition-colors uppercase text-sm tracking-wide">Acessórios</Link>
                            <Link to="/category/vestuario" className="font-bold hover:text-harley-orange transition-colors uppercase text-sm tracking-wide">Vestuário</Link>
                            <Link to="/contato" className="font-bold hover:text-harley-orange transition-colors uppercase text-sm tracking-wide">Contato</Link>
                        </nav>

                        {/* Actions */}
                        <div className="flex items-center gap-4">
                            {currentUser ? (
                                <div className="hidden md:flex items-center gap-4">
                                    <span className="text-sm font-bold text-gray-300">
                                        Olá, <span className="text-harley-orange">{currentUser.displayName || 'Rider'}</span>
                                    </span>
                                    <Link
                                        to="/my-orders"
                                        className="text-sm font-bold text-gray-300 hover:text-harley-orange transition-colors uppercase"
                                        title="Meus Pedidos"
                                    >
                                        Meus Pedidos
                                    </Link>
                                    {currentUser.isAdmin && (
                                        <Link
                                            to="/admin/products"
                                            className="text-sm font-bold text-gray-300 hover:text-harley-orange transition-colors uppercase"
                                            title="Painel Admin"
                                        >
                                            Admin
                                        </Link>
                                    )}
                                    <button
                                        onClick={handleLogout}
                                        className="p-2 hover:bg-gray-900 rounded-full transition-colors text-gray-400 hover:text-white"
                                        title="Sair"
                                    >
                                        <LogOut className="w-5 h-5" />
                                    </button>
                                </div>
                            ) : (
                                <Link
                                    to="/login"
                                    className="hidden md:flex items-center gap-2 text-sm font-bold hover:text-harley-orange transition-colors uppercase tracking-wide"
                                >
                                    <User className="w-5 h-5" />
                                    Entrar
                                </Link>
                            )}

                            <button
                                onClick={toggleCart}
                                className="relative p-2 hover:bg-gray-900 rounded-full transition-colors group"
                            >
                                <ShoppingCart className="w-6 h-6 group-hover:text-harley-orange transition-colors" />
                                {cartCount > 0 && (
                                    <span className="absolute -top-1 -right-1 bg-harley-orange text-white text-xs font-bold w-5 h-5 flex items-center justify-center rounded-full">
                                        {cartCount}
                                    </span>
                                )}
                            </button>
                            <button className="md:hidden p-2 hover:bg-gray-900 rounded-full transition-colors" onClick={toggleMenu}>
                                {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Mobile Menu */}
                {isMenuOpen && (
                    <div className="md:hidden bg-gray-900 border-t border-gray-800 absolute w-full left-0">
                        <nav className="flex flex-col p-4 space-y-4">
                            {currentUser && (
                                <div className="pb-4 border-b border-gray-800 mb-2">
                                    <span className="block text-sm font-bold text-gray-300 mb-2">
                                        Olá, <span className="text-harley-orange">{currentUser.displayName || 'Rider'}</span>
                                    </span>
                                    <Link
                                        to="/my-orders"
                                        className="block text-sm text-gray-300 hover:text-harley-orange font-bold uppercase mb-2"
                                        onClick={toggleMenu}
                                    >
                                        Meus Pedidos
                                    </Link>
                                    {currentUser.isAdmin && (
                                        <Link
                                            to="/admin/products"
                                            className="block text-sm text-gray-300 hover:text-harley-orange font-bold uppercase mb-2"
                                            onClick={toggleMenu}
                                        >
                                            Painel Admin
                                        </Link>
                                    )}
                                    <button onClick={handleLogout} className="text-sm text-red-500 font-bold uppercase flex items-center gap-2">
                                        <LogOut className="w-4 h-4" /> Sair
                                    </button>
                                </div>
                            )}
                            <Link to="/" className="font-bold hover:text-harley-orange transition-colors uppercase" onClick={toggleMenu}>Início</Link>
                            <Link to="/category/pecas" className="font-bold hover:text-harley-orange transition-colors uppercase" onClick={toggleMenu}>Peças</Link>
                            <Link to="/category/acessorios" className="font-bold hover:text-harley-orange transition-colors uppercase" onClick={toggleMenu}>Acessórios</Link>
                            <Link to="/category/vestuario" className="font-bold hover:text-harley-orange transition-colors uppercase" onClick={toggleMenu}>Vestuário</Link>
                            <Link to="/contato" className="font-bold hover:text-harley-orange transition-colors uppercase" onClick={toggleMenu}>Contato</Link>
                            {!currentUser && (
                                <Link to="/login" className="font-bold hover:text-harley-orange transition-colors uppercase flex items-center gap-2 pt-4 border-t border-gray-800" onClick={toggleMenu}>
                                    <User className="w-5 h-5" /> Entrar
                                </Link>
                            )}
                        </nav>
                    </div>
                )}
            </header>

            {/* Main Content */}
            <main className="flex-grow">
                {children}
            </main>

            {/* Footer */}
            <footer className="bg-gray-900 border-t border-gray-800 pt-16 pb-8">
                <div className="container mx-auto px-4">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
                        <div>
                            <div className="flex items-center gap-3 mb-6">
                                <img src="/logo.png" alt="Mercado Harley" className="h-10 w-auto" />
                                <span className="font-display font-bold text-xl tracking-wider uppercase text-white">
                                    Mercado <span className="text-harley-orange">Harley</span>
                                </span>
                            </div>
                            <p className="text-gray-400 mb-6">
                                Sua fonte confiável para peças e acessórios premium Harley-Davidson. Qualidade e estilo para sua jornada.
                            </p>
                            <div className="flex gap-4">
                                <a href="#" className="w-10 h-10 bg-black flex items-center justify-center rounded hover:bg-harley-orange hover:text-white transition-colors">
                                    <Instagram className="w-5 h-5" />
                                </a>
                                <a href="#" className="w-10 h-10 bg-black flex items-center justify-center rounded hover:bg-harley-orange hover:text-white transition-colors">
                                    <Facebook className="w-5 h-5" />
                                </a>
                                <a href="#" className="w-10 h-10 bg-black flex items-center justify-center rounded hover:bg-harley-orange hover:text-white transition-colors">
                                    <Twitter className="w-5 h-5" />
                                </a>
                            </div>
                        </div>

                        <div>
                            <h3 className="font-display font-bold text-lg uppercase mb-6 text-white">Navegação</h3>
                            <ul className="space-y-3 text-gray-400">
                                <li><Link to="/" className="hover:text-harley-orange transition-colors">Início</Link></li>
                                <li><Link to="/category/pecas" className="hover:text-harley-orange transition-colors">Peças</Link></li>
                                <li><Link to="/category/acessorios" className="hover:text-harley-orange transition-colors">Acessórios</Link></li>
                                <li><Link to="/contato" className="hover:text-harley-orange transition-colors">Sobre Nós</Link></li>
                            </ul>
                        </div>

                        <div>
                            <h3 className="font-display font-bold text-lg uppercase mb-6 text-white">Contato</h3>
                            <ul className="space-y-3 text-gray-400">
                                <li className="flex items-center gap-3">
                                    <Phone className="w-5 h-5 text-harley-orange" />
                                    <span>(11) 99999-9999</span>
                                </li>
                                <li className="flex items-center gap-3">
                                    <Mail className="w-5 h-5 text-harley-orange" />
                                    <span>contato@mercadoharley.com.br</span>
                                </li>
                            </ul>
                        </div>

                        <div>
                            <h3 className="font-display font-bold text-lg uppercase mb-6 text-white">Newsletter</h3>
                            <p className="text-gray-400 mb-4">Receba ofertas exclusivas e novidades.</p>
                            <form className="flex flex-col gap-3">
                                <input
                                    type="email"
                                    placeholder="Seu e-mail"
                                    className="bg-black border border-gray-800 p-3 rounded focus:outline-none focus:border-harley-orange text-white"
                                />
                                <button className="bg-harley-orange text-white font-bold py-3 px-6 rounded hover:bg-white hover:text-black transition-colors uppercase tracking-wide">
                                    Inscrever-se
                                </button>
                            </form>
                        </div>
                    </div>

                    <div className="border-t border-gray-800 pt-8 text-center text-gray-500 text-sm">
                        <p>&copy; 2024 Mercado Harley. Todos os direitos reservados.</p>
                    </div>
                </div>
            </footer>

            {/* WhatsApp Button */}
            <WhatsAppButton />

            {/* Cart Sidebar */}
            <CartSidebar />
        </div>
    );
};

export default Layout;
