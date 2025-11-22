import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Package, Plus, TrendingUp } from 'lucide-react';
import { getAllProducts } from '../../services/productService';

const AdminDashboard = () => {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadProducts();
    }, []);

    const loadProducts = async () => {
        try {
            const data = await getAllProducts();
            setProducts(data);
        } catch (error) {
            console.error('Error loading products:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div>
            <div className="mb-8">
                <h1 className="text-4xl font-display font-bold text-white uppercase mb-2">
                    Dashboard
                </h1>
                <p className="text-gray-400">Bem-vindo ao painel administrativo</p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
                    <div className="flex items-center justify-between mb-4">
                        <Package className="w-8 h-8 text-harley-orange" />
                        <TrendingUp className="w-5 h-5 text-green-500" />
                    </div>
                    <h3 className="text-3xl font-bold text-white mb-1">
                        {loading ? '...' : products.length}
                    </h3>
                    <p className="text-gray-400 text-sm uppercase tracking-wide">Total de Produtos</p>
                </div>

                <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
                    <div className="flex items-center justify-between mb-4">
                        <Package className="w-8 h-8 text-blue-500" />
                    </div>
                    <h3 className="text-3xl font-bold text-white mb-1">-</h3>
                    <p className="text-gray-400 text-sm uppercase tracking-wide">Categorias</p>
                </div>

                <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
                    <div className="flex items-center justify-between mb-4">
                        <Package className="w-8 h-8 text-purple-500" />
                    </div>
                    <h3 className="text-3xl font-bold text-white mb-1">-</h3>
                    <p className="text-gray-400 text-sm uppercase tracking-wide">Pedidos</p>
                </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-gray-900 border border-gray-800 rounded-lg p-6 mb-8">
                <h2 className="text-2xl font-display font-bold text-white uppercase mb-4">
                    Ações Rápidas
                </h2>
                <div className="flex gap-4">
                    <Link
                        to="/admin/products/new"
                        className="flex items-center gap-2 bg-harley-orange text-white px-6 py-3 rounded font-bold uppercase tracking-wide hover:bg-orange-700 transition-colors"
                    >
                        <Plus className="w-5 h-5" />
                        Adicionar Produto
                    </Link>
                    <Link
                        to="/admin/products"
                        className="flex items-center gap-2 bg-gray-800 text-white px-6 py-3 rounded font-bold uppercase tracking-wide hover:bg-gray-700 transition-colors"
                    >
                        <Package className="w-5 h-5" />
                        Ver Todos os Produtos
                    </Link>
                </div>
            </div>

            {/* Recent Products */}
            <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
                <h2 className="text-2xl font-display font-bold text-white uppercase mb-4">
                    Produtos Recentes
                </h2>
                {loading ? (
                    <p className="text-gray-400">Carregando...</p>
                ) : products.length === 0 ? (
                    <p className="text-gray-400">Nenhum produto cadastrado ainda.</p>
                ) : (
                    <div className="space-y-3">
                        {products.slice(0, 5).map(product => (
                            <div key={product.id} className="flex items-center gap-4 p-3 bg-black rounded hover:bg-gray-800 transition-colors">
                                <img
                                    src={product.image}
                                    alt={product.name}
                                    className="w-16 h-16 object-cover rounded"
                                />
                                <div className="flex-1">
                                    <h3 className="text-white font-bold">{product.name}</h3>
                                    <p className="text-gray-400 text-sm">{product.category}</p>
                                </div>
                                <div className="text-harley-orange font-bold">{product.price}</div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdminDashboard;
