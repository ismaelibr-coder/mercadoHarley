import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { getAllProducts } from '../services/productService';
import { Link } from 'react-router-dom';
import { Star, TrendingUp } from 'lucide-react';
import { useCart } from '../context/CartContext';

const NewsPage = () => {
    const [latestProducts, setLatestProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const { addToCart } = useCart();

    useEffect(() => {
        loadLatestProducts();
    }, []);

    const loadLatestProducts = async () => {
        try {
            const products = await getAllProducts();
            // Sort by createdAt or just get the first 12
            const latest = products.slice(0, 12);
            setLatestProducts(latest);
        } catch (error) {
            console.error('Error loading products:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Layout>
            <div className="container mx-auto px-4 py-12">
                <div className="mb-12 text-center">
                    <div className="flex items-center justify-center gap-3 mb-4">
                        <TrendingUp className="w-10 h-10 text-sick-red" />
                        <h1 className="text-4xl md:text-5xl font-display font-bold uppercase text-white">
                            Novidades
                        </h1>
                    </div>
                    <div className="w-32 h-1 bg-sick-red mx-auto mb-4"></div>
                    <p className="text-gray-400 text-lg max-w-2xl mx-auto">
                        Confira os últimos lançamentos e produtos recém-chegados na SICK GRIP.
                        Performance e estilo para sua máquina.
                    </p>
                </div>

                {loading ? (
                    <div className="text-center text-gray-400 py-12">
                        Carregando novidades...
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
                        {latestProducts.map((product) => (
                            <div key={product.id} className="bg-gray-900 border border-gray-800 rounded-lg overflow-hidden hover:border-sick-red transition-all group">
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
                                        <span className="absolute top-3 left-3 px-3 py-1 rounded-full text-xs font-bold uppercase bg-sick-red text-white">
                                            NOVO
                                        </span>
                                    </div>
                                </Link>
                                <div className="p-4">
                                    <div className="flex items-center gap-2 mb-2">
                                        <span className="text-xs text-sick-red font-bold uppercase tracking-wide">
                                            {product.category}
                                        </span>
                                    </div>
                                    <Link to={`/product/${product.id}`}>
                                        <h3 className="text-lg font-display font-bold text-white mb-2 hover:text-sick-red transition-colors line-clamp-2 min-h-[3.5rem]">
                                            {product.name}
                                        </h3>
                                    </Link>
                                    <div className="flex items-center gap-1 mb-3">
                                        {[...Array(5)].map((_, i) => (
                                            <Star
                                                key={i}
                                                className={`w-3 h-3 ${i < product.rating ? 'fill-sick-red text-sick-red' : 'text-gray-600'}`}
                                            />
                                        ))}
                                    </div>
                                    <div className="flex items-center justify-between mt-auto pt-2 border-t border-gray-800">
                                        <span className="text-xl font-bold text-white">{product.price}</span>
                                        <button
                                            onClick={() => addToCart(product)}
                                            className="bg-sick-red text-white px-3 py-1.5 rounded font-bold uppercase text-xs hover:bg-red-700 transition-colors"
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
        </Layout>
    );
};

export default NewsPage;
