import React, { useState, useEffect } from 'react';
import { ShoppingCart, Star } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { getAllProducts } from '../services/productService';
import { Link } from 'react-router-dom';

const ProductList = () => {
    const { addToCart } = useCart();
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadProducts();
    }, []);

    const loadProducts = async () => {
        try {
            console.log('🔍 Fetching products from Firestore...');
            const data = await getAllProducts();
            console.log('📦 Products received:', data);

            // Filter for featured products and limit to 6
            const featuredProducts = data.filter(p => p.featured).slice(0, 6);
            console.log('⭐ Featured products:', featuredProducts.length);
            setProducts(featuredProducts);
        } catch (error) {
            console.error('❌ Error loading products:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <section className="py-16 bg-gray-900">
            <div className="container mx-auto px-4">
                <div className="flex items-center justify-between mb-12">
                    <div>
                        <h2 className="text-3xl md:text-4xl font-display font-bold text-white mb-2 uppercase">
                            Destaques da Loja
                        </h2>
                        <div className="h-1 w-20 bg-sick-red"></div>
                    </div>
                    <Link
                        to="/category/todos"
                        className="hidden md:block text-sick-red font-bold hover:text-white transition-colors"
                    >
                        Ver Todos os Produtos
                    </Link>
                </div>

                {loading ? (
                    <div className="text-center py-12">
                        <p className="text-gray-400 text-lg">Carregando produtos...</p>
                    </div>
                ) : products.length === 0 ? (
                    <div className="text-center py-12">
                        <p className="text-gray-400 text-lg">Nenhum produto em destaque no momento.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {products.map((product) => (
                            <div key={product.id} className="bg-black border border-gray-800 rounded-lg overflow-hidden group hover:border-sick-red transition-colors duration-300 flex flex-col">
                                <Link to={`/product/${product.id}`} className="relative h-64 overflow-hidden block">
                                    <img
                                        src={product.image}
                                        alt={product.name}
                                        loading="lazy"
                                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                                    />
                                    {product.condition && (
                                        <span className={`absolute top-3 right-3 px-3 py-1 rounded-full text-xs font-bold uppercase ${product.condition === 'Novo'
                                            ? 'bg-green-600 text-white'
                                            : 'bg-yellow-600 text-white'
                                            }`}>
                                            {product.condition}
                                        </span>
                                    )}
                                    <div className="absolute top-3 left-3 bg-black/80 backdrop-blur-sm px-3 py-1 rounded text-xs font-bold text-white uppercase">
                                        {product.category}
                                    </div>
                                </Link>

                                <div className="p-6 flex-1 flex flex-col">
                                    <div className="flex items-center gap-1 mb-2">
                                        {[...Array(5)].map((_, i) => (
                                            <Star
                                                key={i}
                                                className={`w-4 h-4 ${i < product.rating ? 'text-sick-red fill-sick-red' : 'text-gray-600'}`}
                                            />
                                        ))}
                                    </div>

                                    <Link to={`/product/${product.id}`} className="block mb-2">
                                        <h3 className="text-xl font-bold text-white group-hover:text-sick-red transition-colors line-clamp-2">
                                            {product.name}
                                        </h3>
                                    </Link>

                                    <p className="text-gray-400 text-sm mb-4 flex-1 line-clamp-2">
                                        {product.description}
                                    </p>

                                    <div className="flex items-center justify-between mt-auto">
                                        <span className="text-2xl font-bold text-sick-red">
                                            {product.price}
                                        </span>
                                        <button
                                            onClick={() => addToCart(product)}
                                            className="bg-sick-red text-white p-3 rounded-full hover:bg-white hover:text-black transition-colors group/btn"
                                        >
                                            <ShoppingCart className="w-5 h-5" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </section>
    );
};

export default ProductList;
