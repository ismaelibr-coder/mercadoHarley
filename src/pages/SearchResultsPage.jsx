import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { SearchX } from 'lucide-react';
import { getAllProducts } from '../services/productService';
import ProductCard from '../components/ProductCard';
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
                        {results.map((product, index) => (
                            <ProductCard key={product.id} product={product} delay={(index % 6) * 60} />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default SearchResultsPage;
