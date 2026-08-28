import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Star, ShoppingCart, Minus, Plus, XCircle, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { getProductById, getProductsByCategory } from '../services/productService';
import { useCart } from '../context/CartContext';
import SEO from '../components/SEO';
import ShippingCalculator from '../components/ShippingCalculator';
import ConditionBadge from '../components/ui/ConditionBadge';
import RatingStars from '../components/ui/RatingStars';

const ProductPage = () => {
    const { id } = useParams();
    const { addToCart } = useCart();
    const [product, setProduct] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [quantity, setQuantity] = useState(1);
    const [activeImage, setActiveImage] = useState(0);
    const [relatedProducts, setRelatedProducts] = useState([]);

    useEffect(() => {
        const loadProduct = async () => {
            try {
                setLoading(true);
                setQuantity(1);
                setActiveImage(0);
                const data = await getProductById(id);
                setProduct(data);
            } catch (err) {
                console.error('Error loading product:', err);
                setError('Produto não encontrado');
            } finally {
                setLoading(false);
            }
        };

        loadProduct();
    }, [id]);

    useEffect(() => {
        if (!product?.category) {
            setRelatedProducts([]);
            return;
        }
        let cancelled = false;
        getProductsByCategory(product.category)
            .then((items) => {
                if (cancelled) return;
                setRelatedProducts(items.filter((p) => p.id !== product.id).slice(0, 4));
            })
            .catch((err) => console.error('Error loading related products:', err));
        return () => { cancelled = true; };
    }, [product?.category, product?.id]);

    if (loading) {
        return (
            <div className="min-h-[60vh] flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-harley-orange"></div>
            </div>
        );
    }

    if (error || !product) {
        return (
            <>
                <SEO title="Produto não encontrado" />
                <div className="min-h-[60vh] flex flex-col items-center justify-center text-white">
                    <h2 className="text-3xl font-bold mb-4">Produto não encontrado</h2>
                    <Link to="/" className="text-harley-orange hover:underline">
                        Voltar para a loja
                    </Link>
                </div>
            </>
        );
    }

    const gallery = (Array.isArray(product.images) && product.images.length > 0)
        ? product.images
        : [product.image];
    const inStock = !!product.stock && product.stock > 0;
    const maxQuantity = product.stock || 1;

    const handleAddToCart = () => {
        addToCart(product, quantity);
        setQuantity(1);
    };

    return (
        <div className="bg-black min-h-screen py-12 pb-28 lg:pb-12">
            <SEO
                title={product.name}
                description={product.description}
                image={product.image}
                type="product"
            />
            <div className="container mx-auto px-4">
                {/* Breadcrumb */}
                <nav aria-label="Breadcrumb" className="mb-8 text-sm text-gray-400">
                    <ol className="flex items-center flex-wrap gap-2">
                        <li><Link to="/" className="hover:text-harley-orange transition-colors">Início</Link></li>
                        {product.category && (
                            <>
                                <li aria-hidden="true">/</li>
                                <li>
                                    <Link to={`/category/${product.category}`} className="hover:text-harley-orange transition-colors capitalize">
                                        {product.category}
                                    </Link>
                                </li>
                            </>
                        )}
                        <li aria-hidden="true">/</li>
                        <li className="text-gray-200 truncate max-w-[14rem]" aria-current="page">{product.name}</li>
                    </ol>
                </nav>
                <Link to="/" className="inline-flex items-center text-gray-400 hover:text-harley-orange mb-8 transition-colors lg:hidden">
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Voltar para a loja
                </Link>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                    {/* Image Gallery */}
                    <div className="space-y-4">
                        <div className="aspect-square rounded-xl overflow-hidden border border-gray-800 bg-gray-900">
                            <img
                                src={gallery[activeImage] || product.image}
                                alt={product.name}
                                loading="lazy"
                                className="w-full h-full object-cover"
                            />
                        </div>
                        {gallery.length > 1 && (
                            <div className="grid grid-cols-5 gap-3">
                                {gallery.map((src, index) => (
                                    <button
                                        key={src + index}
                                        type="button"
                                        onClick={() => setActiveImage(index)}
                                        aria-label={`Ver imagem ${index + 1} de ${product.name}`}
                                        aria-current={activeImage === index}
                                        className={`aspect-square rounded-lg overflow-hidden border-2 transition-colors ${activeImage === index ? 'border-harley-orange' : 'border-gray-800 hover:border-gray-600'
                                            }`}
                                    >
                                        <img src={src} alt="" className="w-full h-full object-cover" />
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Product Info */}
                    <div>
                        <div className="mb-6">
                            <div className="flex items-center gap-3 mb-2">
                                <span className="text-harley-orange font-bold uppercase tracking-wider text-sm">
                                    {product.category}
                                </span>
                                <ConditionBadge condition={product.condition} />
                            </div>
                            <h1 className="text-3xl md:text-5xl font-display font-bold text-white mt-2 mb-4">
                                {product.name}
                            </h1>
                            <RatingStars rating={product.rating} />
                        </div>

                        <div className="mb-8">
                            <div className="text-4xl font-bold text-white mb-4">
                                R$ {typeof product.price === 'number' ? product.price.toFixed(2) : product.price}
                            </div>

                            {/* Stock Status */}
                            <div className="flex items-center gap-2">
                                {product.stock === 0 ? (
                                    <span className="inline-flex items-center gap-2 px-4 py-2 bg-red-900/50 border border-red-700 text-red-400 rounded font-bold uppercase text-sm">
                                        <XCircle className="w-4 h-4" /> Esgotado
                                    </span>
                                ) : product.stock <= 5 ? (
                                    <span className="inline-flex items-center gap-2 px-4 py-2 bg-yellow-900/50 border border-yellow-700 text-yellow-400 rounded font-bold uppercase text-sm">
                                        <AlertTriangle className="w-4 h-4" /> Últimas {product.stock} unidades
                                    </span>
                                ) : (
                                    <span className="inline-flex items-center gap-2 px-4 py-2 bg-green-900/50 border border-green-700 text-green-400 rounded font-bold uppercase text-sm">
                                        <CheckCircle2 className="w-4 h-4" /> Em Estoque
                                    </span>
                                )}
                            </div>
                        </div>

                        <div className="prose prose-invert max-w-none mb-8">
                            <p className="text-gray-300 text-lg leading-relaxed">
                                {product.description}
                            </p>
                        </div>

                        {/* Specs */}
                        {product.specs && product.specs.length > 0 && (
                            <div className="bg-gray-900 rounded-lg p-6 mb-8 border border-gray-800">
                                <h3 className="text-white font-bold mb-4 uppercase text-sm tracking-wider">Especificações</h3>
                                <ul className="space-y-2">
                                    {product.specs.map((spec, index) => (
                                        <li key={index} className="flex items-center text-gray-400">
                                            <span className="w-2 h-2 bg-harley-orange rounded-full mr-3"></span>
                                            {spec}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        {/* Quantity + Actions (hidden here on mobile — shown in the sticky bar instead) */}
                        <div className="hidden lg:flex flex-col sm:flex-row gap-4 mb-8">
                            {inStock && (
                                <div className="flex items-center gap-2 bg-gray-900 border border-gray-700 rounded px-2">
                                    <button
                                        type="button"
                                        onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                                        disabled={quantity <= 1}
                                        aria-label="Diminuir quantidade"
                                        className="p-3 text-white hover:text-harley-orange transition-colors disabled:opacity-40"
                                    >
                                        <Minus className="w-4 h-4" />
                                    </button>
                                    <span className="w-8 text-center font-bold text-white" aria-live="polite">{quantity}</span>
                                    <button
                                        type="button"
                                        onClick={() => setQuantity((q) => Math.min(maxQuantity, q + 1))}
                                        disabled={quantity >= maxQuantity}
                                        aria-label="Aumentar quantidade"
                                        className="p-3 text-white hover:text-harley-orange transition-colors disabled:opacity-40"
                                    >
                                        <Plus className="w-4 h-4" />
                                    </button>
                                </div>
                            )}
                            <button
                                onClick={handleAddToCart}
                                disabled={!inStock}
                                className={`flex-1 py-4 px-8 rounded font-bold text-lg transition-colors flex items-center justify-center gap-2 uppercase tracking-wider ${!inStock
                                    ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                                    : 'bg-harley-orange text-white hover:bg-red-800'
                                    }`}
                            >
                                <ShoppingCart className="w-6 h-6" />
                                {!inStock ? 'Indisponível' : 'Adicionar ao Carrinho'}
                            </button>
                        </div>

                        {/* Shipping Calculator */}
                        <div className="mb-8">
                            <ShippingCalculator
                                productWeight={product.dimensions?.weight || product.weight || 1}
                                dimensions={{
                                    width: product.dimensions?.width || product.width || 20,
                                    height: product.dimensions?.height || product.height || 20,
                                    length: product.dimensions?.length || product.length || 20
                                }}
                            />
                        </div>
                    </div>
                </div>

                {/* Related products */}
                {relatedProducts.length > 0 && (
                    <div className="mt-16 pt-10 border-t border-gray-800">
                        <h2 className="text-2xl font-display font-bold text-white uppercase mb-6">Você também pode gostar</h2>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                            {relatedProducts.map((item) => (
                                <Link
                                    key={item.id}
                                    to={`/product/${item.id}`}
                                    className="group bg-gray-900 rounded-lg border border-gray-800 overflow-hidden hover:border-harley-orange transition-colors"
                                >
                                    <div className="aspect-square overflow-hidden bg-gray-800">
                                        <img
                                            src={item.image}
                                            alt={item.name}
                                            loading="lazy"
                                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                        />
                                    </div>
                                    <div className="p-3">
                                        <p className="text-white text-sm font-medium line-clamp-2">{item.name}</p>
                                        <p className="text-harley-orange font-bold text-sm mt-1">
                                            R$ {typeof item.price === 'number' ? item.price.toFixed(2) : item.price}
                                        </p>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Sticky add-to-cart bar (mobile only — desktop has the inline action row above) */}
            <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-gray-900 border-t border-gray-800 p-3 flex items-center gap-3">
                {inStock && (
                    <div className="flex items-center gap-1 bg-black border border-gray-700 rounded px-1 flex-none">
                        <button
                            type="button"
                            onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                            disabled={quantity <= 1}
                            aria-label="Diminuir quantidade"
                            className="p-2.5 text-white disabled:opacity-40"
                        >
                            <Minus className="w-4 h-4" />
                        </button>
                        <span className="w-6 text-center font-bold text-white text-sm" aria-live="polite">{quantity}</span>
                        <button
                            type="button"
                            onClick={() => setQuantity((q) => Math.min(maxQuantity, q + 1))}
                            disabled={quantity >= maxQuantity}
                            aria-label="Aumentar quantidade"
                            className="p-2.5 text-white disabled:opacity-40"
                        >
                            <Plus className="w-4 h-4" />
                        </button>
                    </div>
                )}
                <button
                    onClick={handleAddToCart}
                    disabled={!inStock}
                    className={`flex-1 py-3.5 px-4 rounded font-bold uppercase tracking-wide flex items-center justify-center gap-2 transition-colors ${!inStock
                        ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                        : 'bg-harley-orange text-white hover:bg-red-800'
                        }`}
                >
                    <ShoppingCart className="w-5 h-5" />
                    {!inStock ? 'Indisponível' : 'Adicionar ao Carrinho'}
                </button>
            </div>
        </div>
    );
};

export default ProductPage;
