import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Check, ShoppingCart } from 'lucide-react';
import { useCart } from '../context/CartContext';
import ConditionBadge from './ui/ConditionBadge';
import RatingStars from './ui/RatingStars';
import { useInViewport } from '../hooks/useInViewport.js';

/**
 * The catalog card — was copy-pasted with tiny differences across
 * CategoryPage.jsx and SearchResultsPage.jsx; this is the single version both
 * use now. (ProductList.jsx's "Destaques da Loja" card is intentionally a
 * bigger, different treatment and stays separate.)
 */
const ProductCard = ({ product, delay = 0 }) => {
    const { addToCart } = useCart();
    const [ref, isVisible] = useInViewport();
    const [justAdded, setJustAdded] = useState(false);

    const secondImage = Array.isArray(product.images) ? product.images[1] : null;
    const price = typeof product.price === 'number' ? product.price.toFixed(2) : product.price;

    const handleAddToCart = () => {
        addToCart(product);
        setJustAdded(true);
        setTimeout(() => setJustAdded(false), 900);
    };

    return (
        <div
            ref={ref}
            style={{ animationDelay: isVisible ? `${delay}ms` : undefined }}
            className={`bg-gray-900 border border-gray-800 rounded-lg overflow-hidden hover:border-sick-red transition-all duration-300 hover:shadow-lg hover:shadow-black/50 hover:-translate-y-1 group ${isVisible ? 'animate-fade-in-up' : 'opacity-0'}`}
        >
            <Link to={`/product/${product.id}`} className="relative block overflow-hidden aspect-square bg-white p-4">
                <img
                    src={product.image}
                    alt={product.name}
                    loading="lazy"
                    className={`w-full h-full object-contain transition-all duration-300 ${secondImage ? 'group-hover:opacity-0' : 'group-hover:scale-105'}`}
                />
                {/* Swaps to the product's 2nd photo on hover when one exists — the
                    catalog already stores multiple images per product, the listing
                    just never showed more than the first one. */}
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
            </Link>
            <div className="p-4">
                <span className="text-[11px] text-gray-500 font-bold uppercase tracking-widest">
                    {product.category}
                </span>
                <Link to={`/product/${product.id}`}>
                    <h3 className="text-lg font-display font-bold text-white mt-1 mb-2 hover:text-sick-red transition-colors line-clamp-2 min-h-[3.5rem]">
                        {product.name}
                    </h3>
                </Link>
                <RatingStars rating={product.rating} size="sm" className="mb-3" />
                <div className="flex items-center justify-between mt-auto pt-3 border-t border-gray-800">
                    <span className="text-2xl font-bold text-white">R$ {price}</span>
                    <button
                        onClick={handleAddToCart}
                        aria-label={`Adicionar ${product.name} ao carrinho`}
                        className={`flex items-center justify-center w-9 h-9 rounded-full font-bold transition-all duration-200 ${justAdded ? 'bg-green-600 scale-110' : 'bg-sick-red hover:bg-red-700 hover:scale-110'}`}
                    >
                        {justAdded ? <Check className="w-4 h-4 text-white" /> : <ShoppingCart className="w-4 h-4 text-white" />}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ProductCard;
