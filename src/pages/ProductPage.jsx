import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Star, ShoppingCart, Truck, ShieldCheck } from 'lucide-react';
import { getProductById } from '../services/productService';
import { useCart } from '../context/CartContext';
import SEO from '../components/SEO';

const ProductPage = () => {
    const { id } = useParams();
    const { addToCart } = useCart();
    const [product, setProduct] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const loadProduct = async () => {
            try {
                setLoading(true);
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

    return (
        <div className="bg-black min-h-screen py-12">
            <SEO
                title={product.name}
                description={product.description}
                image={product.image}
                type="product"
            />
            <div className="container mx-auto px-4">
                {/* Breadcrumb */}
                <Link to="/" className="inline-flex items-center text-gray-400 hover:text-harley-orange mb-8 transition-colors">
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Voltar para a loja
                </Link>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                    {/* Image Gallery */}
                    <div className="space-y-4">
                        <div className="aspect-square rounded-xl overflow-hidden border border-gray-800 bg-gray-900">
                            <img
                                src={product.image}
                                alt={product.name}
                                loading="lazy"
                                className="w-full h-full object-cover"
                            />
                        </div>
                    </div>

                    {/* Product Info */}
                    <div>
                        <div className="mb-6">
                            <div className="flex items-center gap-3 mb-2">
                                <span className="text-harley-orange font-bold uppercase tracking-wider text-sm">
                                    {product.category}
                                </span>
                                {product.condition && (
                                    <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${product.condition === 'Novo'
                                        ? 'bg-green-600 text-white'
                                        : 'bg-yellow-600 text-white'
                                        }`}>
                                        {product.condition}
                                    </span>
                                )}
                            </div>
                            <h1 className="text-3xl md:text-5xl font-display font-bold text-white mt-2 mb-4">
                                {product.name}
                            </h1>
                            <div className="flex items-center gap-4">
                                <div className="flex items-center gap-1">
                                    {[...Array(5)].map((_, i) => (
                                        <Star
                                            key={i}
                                            className={`w-5 h-5 ${i < product.rating ? 'text-harley-orange fill-harley-orange' : 'text-gray-600'}`}
                                        />
                                    ))}
                                </div>
                                <span className="text-gray-400 text-sm">(12 avaliações)</span>
                            </div>
                        </div>

                        <div className="text-4xl font-bold text-white mb-8">
                            {product.price}
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

                        {/* Actions */}
                        <div className="flex flex-col sm:flex-row gap-4 mb-8">
                            <button
                                onClick={() => addToCart(product)}
                                className="flex-1 bg-harley-orange text-white py-4 px-8 rounded font-bold text-lg hover:bg-orange-700 transition-colors flex items-center justify-center gap-2 uppercase tracking-wider"
                            >
                                <ShoppingCart className="w-6 h-6" />
                                Adicionar ao Carrinho
                            </button>
                        </div>

                        {/* Features */}
                        <div className="grid grid-cols-2 gap-4 pt-8 border-t border-gray-800">
                            <div className="flex items-center gap-3 text-gray-300">
                                <Truck className="w-6 h-6 text-harley-orange" />
                                <span className="text-sm">Frete Grátis para todo Brasil</span>
                            </div>
                            <div className="flex items-center gap-3 text-gray-300">
                                <ShieldCheck className="w-6 h-6 text-harley-orange" />
                                <span className="text-sm">Garantia de 1 ano</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProductPage;
