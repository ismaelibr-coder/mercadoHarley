import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { getAllProducts } from '../services/productService';
import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { Star } from 'lucide-react';
import ProductFilters from '../components/ProductFilters';

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

    const handleFilterChange = (filters) => {
        console.log('🔍 Filter changed:', filters);
        console.log('📦 Initial products count:', initialProducts.length);

        let filtered = [...initialProducts];

        // Search
        if (filters.search) {
            const term = filters.search.toLowerCase();
            console.log('🔎 Searching for:', term);
            filtered = filtered.filter(p =>
                p.name.toLowerCase().includes(term) ||
                p.description?.toLowerCase().includes(term)
            );
            console.log('✅ After search:', filtered.length, 'products');
        }

        // Price Range
        if (filters.priceRange.min) {
            console.log('💰 Min price filter:', filters.priceRange.min);
            filtered = filtered.filter(p => {
                const price = typeof p.price === 'number'
                    ? p.price
                    : parseFloat(p.price.replace('R$', '').replace('.', '').replace(',', '.').trim());
                return price >= parseFloat(filters.priceRange.min);
            });
            console.log('✅ After min price:', filtered.length, 'products');
        }
        if (filters.priceRange.max) {
            console.log('💰 Max price filter:', filters.priceRange.max);
            filtered = filtered.filter(p => {
                const price = typeof p.price === 'number'
                    ? p.price
                    : parseFloat(p.price.replace('R$', '').replace('.', '').replace(',', '.').trim());
                return price <= parseFloat(filters.priceRange.max);
            });
            console.log('✅ After max price:', filtered.length, 'products');
        }

        // Categories
        if (filters.categories.length > 0) {
            console.log('📁 Category filter:', filters.categories);
            filtered = filtered.filter(p => filters.categories.includes(p.category));
            console.log('✅ After categories:', filtered.length, 'products');
        }

        // Part Types
        if (filters.partTypes && filters.partTypes.length > 0) {
            console.log('🔧 Part type filter:', filters.partTypes);
            filtered = filtered.filter(p => filters.partTypes.includes(p.partType));
            console.log('✅ After part types:', filtered.length, 'products');
        }

        // Partners
        if (filters.partners && filters.partners.length > 0) {
            console.log('🤝 Partner filter:', filters.partners);
            filtered = filtered.filter(p => filters.partners.includes(p.partner));
            console.log('✅ After partners:', filtered.length, 'products');
        }

        console.log('🎯 Final filtered products:', filtered.length);
        setProducts(filtered);
    };

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
                    <div className="mb-8">
                        <h1 className="text-3xl md:text-4xl font-display font-bold text-white uppercase tracking-wider mb-2">
                            {currentCategory.title}
                        </h1>
                        <div className="w-20 h-1 bg-sick-red mb-2"></div>
                        <p className="text-gray-400 text-sm">
                            {loading ? 'Carregando...' : `${products.length} produto${products.length !== 1 ? 's' : ''} encontrado${products.length !== 1 ? 's' : ''}`}
                        </p>
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
                            {products.map((product) => (
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
                </main>
            </div>
        </div>
    );
};

export default CategoryPage;
