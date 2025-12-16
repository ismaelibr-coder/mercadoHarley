import React from 'react';
import { Link, Outlet, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Package, LogOut, Home, ShoppingBag, Truck, Image, Settings } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const AdminLayout = () => {
    const { currentUser, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = async () => {
        await logout();
        navigate('/');
    };

    return (
        <div className="min-h-screen bg-black text-white flex">
            {/* Sidebar */}
            <aside className="w-64 bg-gray-900 border-r border-gray-800 flex flex-col">
                <div className="p-6 border-b border-gray-800">
                    <h1 className="text-2xl font-display font-bold text-harley-orange uppercase">
                        Admin Panel
                    </h1>
                    <p className="text-gray-400 text-sm mt-2">{currentUser?.displayName}</p>
                </div>

                <nav className="flex-1 p-4">
                    <Link
                        to="/admin"
                        className="flex items-center gap-3 px-4 py-3 rounded hover:bg-gray-800 transition-colors mb-2"
                    >
                        <LayoutDashboard className="w-5 h-5" />
                        <span className="font-bold">Dashboard</span>
                    </Link>
                    <Link
                        to="/admin/products"
                        className="flex items-center gap-3 px-4 py-3 rounded hover:bg-gray-800 transition-colors mb-2"
                    >
                        <Package className="w-5 h-5" />
                        <span className="font-bold">Produtos</span>
                    </Link>
                    <Link
                        to="/admin/orders"
                        className="flex items-center gap-3 px-4 py-3 rounded hover:bg-gray-800 transition-colors mb-2"
                    >
                        <ShoppingBag className="w-5 h-5" />
                        <span className="font-bold">Pedidos</span>
                    </Link>
                    <Link
                        to="/admin/banners"
                        className="flex items-center gap-3 px-4 py-3 rounded hover:bg-gray-800 transition-colors mb-2"
                    >
                        <Image className="w-5 h-5" />
                        <span className="font-bold">Banners</span>
                    </Link>
                    <Link
                        to="/admin/shipping"
                        className="flex items-center gap-3 px-4 py-3 rounded hover:bg-gray-800 transition-colors mb-2"
                    >
                        <Truck className="w-5 h-5" />
                        <span className="font-bold">Frete</span>
                    </Link>
                    <Link
                        to="/admin/settings"
                        className="flex items-center gap-3 px-4 py-3 rounded hover:bg-gray-800 transition-colors mb-2"
                    >
                        <Settings className="w-5 h-5" />
                        <span className="font-bold">Configurações</span>
                    </Link>
                </nav>

                <div className="p-4 border-t border-gray-800">
                    <Link
                        to="/"
                        className="flex items-center gap-3 px-4 py-3 rounded hover:bg-gray-800 transition-colors mb-2"
                    >
                        <Home className="w-5 h-5" />
                        <span className="font-bold">Voltar ao Site</span>
                    </Link>
                    <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-4 py-3 rounded hover:bg-red-900 transition-colors text-red-400"
                    >
                        <LogOut className="w-5 h-5" />
                        <span className="font-bold">Sair</span>
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 p-8">
                <Outlet />
            </main>
        </div>
    );
};

export default AdminLayout;
