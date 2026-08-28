import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { getAllProducts } from '../services/productService';
import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import ProductFilters from '../components/ProductFilters';
import ConditionBadge from '../components/ui/ConditionBadge';
import RatingStars from '../components/ui/RatingStars';

const CategoryPage = () => {
    const { type } = useParams();
    const { addToCart } = useCart();
    const [products, setProducts] = useState([]);
    const [initialProducts, setInitialProducts] = useState([]); // Store all fetched products for filtering
    const [loading, setLoading] = useState(true);

    // Map URL parameter to display title and allowed categories
    const categoryMap = {
        'todos': {
            title: 'Todos os Produtos',
            allowedCategories: null // All categories
        },
        'pecas': {
            title: 'Peças',
            allowedCategories: ['Peças', 'Escapamentos', 'Guidões', 'Bancos', 'Performance', 'Iluminação', 'Freios', 'Suspensão']
        },
        'acessorios': {
            title: 'Acessórios',
            allowedCategories: ['Acessórios', 'Alforges', 'Retrovisores', 'Manoplas']
        },
        'vestuario': {
            title: 'Vestuário',
            allowedCategories: ['Vestuário', 'Jaquetas', 'Capacetes', 'Luvas', 'Botas', 'Camisetas']
        }
    };

    const currentCategory = categoryMap[type] || { title: 'Produtos', allowedCategories: [] };

    useEffect(() => {
        loadProducts();
    }, [type]);

    const loadProducts = async () => {
        setLoading(true);
        try {
            // Fetch all products and filter client-side
            // This is efficient enough for small catalogs and ensures we get all subcategories
            const allProducts = await getAllProducts();

            let filtered = allProducts;
            if (currentCategory.allowedCategories) {
                filtered = allProducts.filter(p =>
                    currentCategory.allowedCategories.includes(p.category)
                );
            }

            setInitialProducts(filtered);
            setProducts(filtered);
        } catch (error) {
            console.error('Error loading products:', error);
        } finally {
            setLoading(false);
        }
    };

    const getNumericPrice = (product) => (
        typeof product.price === 'number'
            ? product.price
            : parseFloat(String(product.price).replace('R$', '').replace('.', '').replace(',', '.').trim())
    );

    const handleFilterChange = (filters) => {
        let filtered = [...initialProducts];

        if (filters.search) {
            const term = filters.search.toLowerCase();
            filtered = filtered.filter(p =>
                p.name.toLowerCase().includes(term) ||
                p.description?.toLowerCase().includes(term)
            );
        }

        if (filters.priceRange.min) {
            filtered = filtered.filter(p => getNumericPrice(p) >= parseFloat(filters.priceRange.min));
        }
        if (filters.priceRange.max) {
            filtered = filtered.filter(p => getNumericPrice(p) <= parseFloat(filters.priceRange.max));
        }

        if (filters.categories.length > 0) {
            filtered = filtered.filter(p => filters.categories.includes(p.category));
        }

        if (filters.partTypes && filters.partTypes.length > 0) {
            filtered = filtered.filter(p => filters.partTypes.includes(p.partType));
        }

        if (filters.partners && filters.partners.length > 0) {
            filtered = filtered.filter(p => filters.partners.includes(p.partner));
        }

        setProducts(filtered);
    };

    const [sortBy, setSortBy] = useState('relevance');
    const sortedProducts = React.useMemo(() => {
        const list = [...products];
        switch (sortBy) {
            case 'price-asc':
                return list.sort((a, b) => getNumericPrice(a) - getNumericPrice(b));
            case 'price-desc':
                return list.sort((a, b) => getNumericPrice(b) - getNumericPrice(a));
            case 'newest':
                return list.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
            default:
                return list;
        }
    }, [products, sortBy]);

    return (
        <div className="bg-black min-h-screen py-12">
            <div className="container mx-auto px-4 flex flex-col md:flex-row gap-8">

                {/* Sidebar */}
                <aside className="w-full md:w-1/4">
                    <ProductFilters
                        products={initialProducts}
                        onFilterChange={handleFilterChange}
                    />
                </aside>

                {/* Main Content */}
                <main className="w-full md:w-3/4">
                    <div className="mb-8 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
                        <div>
                            <h1 className="text-3xl md:text-4xl font-display font-bold text-white uppercase tracking-wider mb-2">
                                {currentCategory.title}
                            </h1>
                            <div className="w-20 h-1 bg-sick-red mb-2"></div>
                            <p className="text-gray-400 text-sm">
                                {loading ? 'Carregando...' : `${products.length} produto${products.length !== 1 ? 's' : ''} encontrado${products.length !== 1 ? 's' : ''}`}
                            </p>
                        </div>
                        {!loading && products.length > 0 && (
                            <div className="flex items-center gap-2">
                                <label htmlFor="sort-by" className="text-gray-400 text-sm flex-none">Ordenar por</label>
                                <select
                                    id="sort-by"
                                    value={sortBy}
                                    onChange={(e) => setSortBy(e.target.value)}
                                    className="bg-gray-900 border border-gray-800 rounded p-2 text-sm text-white focus:outline-none focus:border-sick-red"
                                >
                                    <option value="relevance">Relevância</option>
                                    <option value="price-asc">Menor preço</option>
                                    <option value="price-desc">Maior preço</option>
                                    <option value="newest">Mais recentes</option>
                                </select>
                            </div>
                        )}
                    </div>

                    {loading ? (
                        <div className="text-center text-gray-400 py-12">
                            Carregando produtos...
                        </div>
                    ) : products.length === 0 ? (
                        <div className="text-center text-gray-400 py-12">
                            Nenhum produto encontrado com os filtros selecionados.
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {sortedProducts.map((product) => (
                                <div key={product.id} className="bg-gray-900 border border-gray-800 rounded-lg overflow-hidden hover:border-sick-red transition-all group">
                                    <Link to={`/product/${product.id}`}>
                                        <div className="relative overflow-hidden aspect-square bg-white p-4">
                                            <img
                                                src={product.image}
                                                alt={product.name}
                                                className="w-full h-full object-contain group-hover:scale-110 transition-transform duration-300"
                                            />
                                            <ConditionBadge condition={product.condition} className="absolute top-3 right-3" />
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
                                        <RatingStars rating={product.rating} size="sm" className="mb-3" />
                                        <div className="flex items-center justify-between mt-auto pt-2 border-t border-gray-800">
                                            <span className="text-xl font-bold text-white">R$ {typeof product.price === 'number' ? product.price.toFixed(2) : product.price}</span>
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
                </main>
            </div>
        </div>
    );
};

export default CategoryPage;
