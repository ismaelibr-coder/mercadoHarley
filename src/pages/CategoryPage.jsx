import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { getProductsByCategory, getAllProducts } from '../services/productService';
import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { Star } from 'lucide-react';

const CategoryPage = () => {
    const { type } = useParams();
    const { addToCart } = useCart();
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);

    // Map URL parameter to display title and category name
    const categoryMap = {
        'todos': { title: 'Todos os Produtos', category: null },
        'pecas': { title: 'Peças', category: 'Peças' },
        'acessorios': { title: 'Acessórios', category: 'Acessórios' },
        'vestuario': { title: 'Vestuário', category: 'Vestuário' }
    };

    const currentCategory = categoryMap[type] || { title: 'Produtos', category: null };

    useEffect(() => {
        loadProducts();
    }, [type]);

    const loadProducts = async () => {
        setLoading(true);
        try {
            // If category is 'todos' or null, get all products
            if (type === 'todos' || !currentCategory.category) {
                const data = await getAllProducts();
                setProducts(data);
            } else {
                const data = await getProductsByCategory(currentCategory.category);
                setProducts(data);
            }
        } catch (error) {
            console.error('Error loading products:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-black min-h-screen py-12">
            <div className="container mx-auto px-4">
                <div className="mb-12 text-center">
                    <h1 className="text-4xl md:text-5xl font-display font-bold text-white uppercase tracking-wider mb-4">
                        {currentCategory.title}
                    </h1>
                    <div className="w-24 h-1 bg-harley-orange mx-auto mb-4"></div>
                    <p className="text-gray-400">
                        {loading ? 'Carregando...' : `${products.length} produto${products.length !== 1 ? 's' : ''} encontrado${products.length !== 1 ? 's' : ''}`}
                    </p>
                </div>

                {loading ? (
                    <div className="text-center text-gray-400 py-12">
                        Carregando produtos...
                    </div>
                ) : products.length === 0 ? (
                    <div className="text-center text-gray-400 py-12">
                        Nenhum produto encontrado nesta categoria.
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {products.map((product) => (
                            <div key={product.id} className="bg-gray-900 border border-gray-800 rounded-lg overflow-hidden hover:border-harley-orange transition-all group">
                                <Link to={`/product/${product.id}`}>
                                    <div className="relative overflow-hidden aspect-square">
                                        <img
                                            src={product.image}
                                            alt={product.name}
                                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                                        />
                                        {product.condition && (
                                            <span className={`absolute top-3 right-3 px-3 py-1 rounded-full text-xs font-bold uppercase ${product.condition === 'Novo'
                                                ? 'bg-green-600 text-white'
                                                : 'bg-yellow-600 text-white'
                                                }`}>
                                                {product.condition}
                                            </span>
                                        )}
                                    </div>
                                </Link>
                                <div className="p-6">
                                    <div className="flex items-center gap-2 mb-2">
                                        <span className="text-xs text-harley-orange font-bold uppercase tracking-wide">
                                            {product.category}
                                        </span>
                                    </div>
                                    <Link to={`/product/${product.id}`}>
                                        <h3 className="text-xl font-display font-bold text-white mb-2 hover:text-harley-orange transition-colors">
                                            {product.name}
                                        </h3>
                                    </Link>
                                    <div className="flex items-center gap-1 mb-3">
                                        {[...Array(5)].map((_, i) => (
                                            <Star
                                                key={i}
                                                className={`w-4 h-4 ${i < product.rating ? 'fill-harley-orange text-harley-orange' : 'text-gray-600'}`}
                                            />
                                        ))}
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-2xl font-bold text-harley-orange">{product.price}</span>
                                        <button
                                            onClick={() => addToCart(product)}
                                            className="bg-harley-orange text-white px-4 py-2 rounded font-bold uppercase text-sm hover:bg-orange-700 transition-colors"
                                        >
                                            Adicionar
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default CategoryPage;
