import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { SearchX } from 'lucide-react';
import { getAllProducts } from '../services/productService';
import { useCart } from '../context/CartContext';
import ConditionBadge from '../components/ui/ConditionBadge';
import RatingStars from '../components/ui/RatingStars';
import SEO from '../components/SEO';

const matches = (product, query) => {
    const haystack = [product.name, product.description, product.category, product.partner]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
    return haystack.includes(query);
};

const SearchResultsPage = () => {
    const [searchParams] = useSearchParams();
    const query = (searchParams.get('q') || '').trim();
    const { addToCart } = useCart();
    const [allProducts, setAllProducts] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let cancelled = false;
        getAllProducts()
            .then((data) => { if (!cancelled) setAllProducts(data); })
            .catch((err) => console.error('Error loading products for search:', err))
            .finally(() => { if (!cancelled) setLoading(false); });
        return () => { cancelled = true; };
    }, []);

    const normalizedQuery = query.toLowerCase();
    const results = normalizedQuery
        ? allProducts.filter((p) => matches(p, normalizedQuery))
        : [];

    return (
        <div className="bg-black min-h-screen py-12">
            <SEO title={query ? `Busca por "${query}"` : 'Buscar produtos'} />
            <div className="container mx-auto px-4">
                <h1 className="text-2xl md:text-3xl font-display font-bold text-white uppercase mb-2">
                    {query ? `Resultados para "${query}"` : 'Buscar produtos'}
                </h1>

                {!loading && (
                    <p className="text-gray-400 mb-8">
                        {query
                            ? `${results.length} produto${results.length === 1 ? '' : 's'} encontrado${results.length === 1 ? '' : 's'}`
                            : 'Digite algo na busca para ver resultados.'}
                    </p>
                )}

                {loading ? (
                    <div className="text-center text-gray-400 py-12">Carregando...</div>
                ) : query && results.length === 0 ? (
                    <div className="flex flex-col items-center text-center py-16">
                        <SearchX className="w-14 h-14 text-gray-700 mb-4" />
                        <p className="text-gray-400 text-lg mb-2">Nenhum produto encontrado para "{query}".</p>
                        <p className="text-gray-500 text-sm">Tente outro termo, ou navegue pelas categorias no menu.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {results.map((product) => (
                            <div key={product.id} className="bg-gray-900 border border-gray-800 rounded-lg overflow-hidden hover:border-sick-red transition-all group">
                                <Link to={`/product/${product.id}`}>
                                    <div className="relative overflow-hidden aspect-square">
                                        <img
                                            src={product.image}
                                            alt={product.name}
                                            loading="lazy"
                                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                                        />
                                        <ConditionBadge condition={product.condition} className="absolute top-3 right-3" />
                                    </div>
                                </Link>
                                <div className="p-4">
                                    <span className="text-xs text-sick-red font-bold uppercase tracking-wide">{product.category}</span>
                                    <Link to={`/product/${product.id}`}>
                                        <h3 className="text-lg font-display font-bold text-white my-2 hover:text-sick-red transition-colors line-clamp-2 min-h-[3.5rem]">
                                            {product.name}
                                        </h3>
                                    </Link>
                                    <RatingStars rating={product.rating} size="sm" className="mb-3" />
                                    <div className="flex items-center justify-between mt-auto pt-2 border-t border-gray-800">
                                        <span className="text-xl font-bold text-white">
                                            R$ {typeof product.price === 'number' ? product.price.toFixed(2) : product.price}
                                        </span>
                                        <button
                                            onClick={() => addToCart(product)}
                                            className="bg-sick-red text-white px-3 py-1.5 rounded font-bold uppercase text-xs hover:bg-red-800 transition-colors"
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

export default SearchResultsPage;
