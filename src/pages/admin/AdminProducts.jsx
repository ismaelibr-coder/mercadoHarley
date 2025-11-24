import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Edit, Trash2, Search } from 'lucide-react';
import { getAllProducts, deleteProduct } from '../../services/productService';

const AdminProducts = () => {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

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

    const handleDelete = async (id, name) => {
        if (window.confirm(`Tem certeza que deseja excluir "${name}"?`)) {
            try {
                await deleteProduct(id);
                setProducts(products.filter(p => p.id !== id));
                alert('Produto excluído com sucesso!');
            } catch (error) {
                console.error('Error deleting product:', error);
                alert('Erro ao excluir produto.');
            }
        }
    };

    const filteredProducts = products.filter(product =>
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.category.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div>
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-4xl font-display font-bold text-white uppercase mb-2">
                        Produtos
                    </h1>
                    <p className="text-gray-400">Gerencie todos os produtos da loja</p>
                </div>
                <Link
                    to="/admin/products/new"
                    className="flex items-center gap-2 bg-harley-orange text-white px-6 py-3 rounded font-bold uppercase tracking-wide hover:bg-orange-700 transition-colors"
                >
                    <Plus className="w-5 h-5" />
                    Novo Produto
                </Link>
            </div>

            {/* Search */}
            <div className="mb-6">
                <div className="relative">
                    <Search className="absolute left-3 top-3.5 w-5 h-5 text-gray-500" />
                    <input
                        type="text"
                        placeholder="Buscar produtos..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-gray-900 border border-gray-800 rounded p-3 pl-10 text-white focus:border-harley-orange focus:outline-none"
                    />
                </div>
            </div>

            {/* Products Table */}
            <div className="bg-gray-900 border border-gray-800 rounded-lg overflow-hidden">
                {loading ? (
                    <div className="p-8 text-center text-gray-400">Carregando...</div>
                ) : filteredProducts.length === 0 ? (
                    <div className="p-8 text-center text-gray-400">
                        {searchTerm ? 'Nenhum produto encontrado.' : 'Nenhum produto cadastrado ainda.'}
                    </div>
                ) : (
                    <table className="w-full">
                        <thead className="bg-black border-b border-gray-800">
                            <tr>
                                <th className="text-left p-4 text-gray-400 font-bold uppercase text-sm">Imagem</th>
                                <th className="text-left p-4 text-gray-400 font-bold uppercase text-sm">Nome</th>
                                <th className="text-left p-4 text-gray-400 font-bold uppercase text-sm">Categoria</th>
                                <th className="text-left p-4 text-gray-400 font-bold uppercase text-sm">Preço</th>
                                <th className="text-left p-4 text-gray-400 font-bold uppercase text-sm">Estoque</th>
                                <th className="text-left p-4 text-gray-400 font-bold uppercase text-sm">Avaliação</th>
                                <th className="text-right p-4 text-gray-400 font-bold uppercase text-sm">Ações</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredProducts.map((product) => (
                                <tr key={product.id} className="border-b border-gray-800 hover:bg-gray-800 transition-colors">
                                    <td className="p-4">
                                        <img
                                            src={product.image}
                                            alt={product.name}
                                            className="w-16 h-16 object-cover rounded"
                                        />
                                    </td>
                                    <td className="p-4 text-white font-bold">{product.name}</td>
                                    <td className="p-4 text-gray-400">{product.category}</td>
                                    <td className="p-4 text-harley-orange font-bold">{product.price}</td>
                                    <td className="p-4">
                                        <span className={`px-3 py-1 rounded font-bold text-sm ${(product.stock || 0) === 0
                                                ? 'bg-red-900/50 text-red-400'
                                                : (product.stock || 0) <= 5
                                                    ? 'bg-yellow-900/50 text-yellow-400'
                                                    : 'bg-green-900/50 text-green-400'
                                            }`}>
                                            {product.stock || 0}
                                        </span>
                                    </td>
                                    <td className="p-4 text-gray-400">{'⭐'.repeat(product.rating || 0)}</td>
                                    <td className="p-4">
                                        <div className="flex items-center justify-end gap-2">
                                            <Link
                                                to={`/admin/products/edit/${product.id}`}
                                                className="p-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                                                title="Editar"
                                            >
                                                <Edit className="w-4 h-4" />
                                            </Link>
                                            <button
                                                onClick={() => handleDelete(product.id, product.name)}
                                                className="p-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
                                                title="Excluir"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
};

export default AdminProducts;
