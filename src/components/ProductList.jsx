import React, { useState, useEffect } from 'react';
import { ShoppingCart, Check } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { getAllProducts } from '../services/productService';
import { Link } from 'react-router-dom';
import ConditionBadge from './ui/ConditionBadge';
import RatingStars from './ui/RatingStars';
import { useInViewport } from '../hooks/useInViewport.js';

// Own component so each featured card can independently track its own
// scroll-in entrance and "just added to cart" state.
const FeaturedCard = ({ product, delay }) => {
    const { addToCart } = useCart();
    const [ref, isVisible] = useInViewport();
    const [justAdded, setJustAdded] = useState(false);
    const secondImage = Array.isArray(product.images) ? product.images[1] : null;

    const handleAddToCart = () => {
        addToCart(product);
        setJustAdded(true);
        setTimeout(() => setJustAdded(false), 900);
    };

    return (
        <div
            ref={ref}
            style={{ animationDelay: isVisible ? `${delay}ms` : undefined }}
            className={`bg-black border border-gray-800 rounded-lg overflow-hidden group hover:border-sick-red transition-all duration-300 hover:shadow-lg hover:shadow-black/50 hover:-translate-y-1 flex flex-col ${isVisible ? 'animate-fade-in-up' : 'opacity-0'}`}
        >
            <Link to={`/product/${product.id}`} className="relative h-64 overflow-hidden block bg-white p-4">
                <img
                    src={product.image}
                    alt={product.name}
                    loading="lazy"
                    className={`w-full h-full object-contain transition-all duration-300 ${secondImage ? 'group-hover:opacity-0' : 'group-hover:scale-105'}`}
                />
                {secondImage && (
                    <img
                        src={secondImage}
                        alt=""
                        aria-hidden="true"
                        loading="lazy"
                        className="absolute inset-0 w-full h-full object-contain p-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                    />
                )}
                <ConditionBadge condition={product.condition} className="absolute top-3 right-3 !text-[10px] !px-2 !py-0.5 shadow-md" />
                <div className="absolute top-3 left-3 bg-black/80 backdrop-blur-sm px-2.5 py-1 rounded text-[10px] font-bold text-gray-300 uppercase tracking-wide">
                    {product.category}
                </div>
            </Link>

            <div className="p-6 flex-1 flex flex-col">
                <RatingStars rating={product.rating} size="md" className="mb-2" />

                <Link to={`/product/${product.id}`} className="block mb-2">
                    <h3 className="text-xl font-bold text-white group-hover:text-sick-red transition-colors line-clamp-2">
                        {product.name}
                    </h3>
                </Link>

                <p className="text-gray-400 text-sm mb-4 flex-1 line-clamp-2">
                    {product.description}
                </p>

                <div className="flex items-center justify-between mt-auto">
                    <span className="text-3xl font-bold text-sick-red">
                        R$ {product.price}
                    </span>
                    <button
                        onClick={handleAddToCart}
                        aria-label={`Adicionar ${product.name} ao carrinho`}
                        className={`p-3 rounded-full transition-all duration-200 ${justAdded ? 'bg-green-600 scale-110' : 'bg-sick-red hover:bg-white hover:text-black hover:scale-110'}`}
                    >
                        {justAdded ? <Check className="w-5 h-5 text-white" /> : <ShoppingCart className="w-5 h-5" />}
                    </button>
                </div>
            </div>
        </div>
    );
};

const ProductList = () => {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadProducts();
    }, []);

    const loadProducts = async () => {
        try {
            const data = await getAllProducts();
            // Filter for featured products and limit to 6
            const featuredProducts = data.filter(p => p.featured).slice(0, 6);
            setProducts(featuredProducts);
        } catch (error) {
            console.error('Error loading featured products:', error);
        } finally {
            setLoading(false);
        }
    };

    // No featured products yet: hide the whole section instead of showing an
    // empty-state message on the homepage — there's nothing actionable a
    // shopper can do with "nenhum produto em destaque no momento" here.
    if (!loading && products.length === 0) return null;

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
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {products.map((product, index) => (
                            <FeaturedCard key={product.id} product={product} delay={index * 100} />
                        ))}
                    </div>
                )}
            </div>
        </section>
    );
};

export default ProductList;
