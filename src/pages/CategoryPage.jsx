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
        let filtered = [...initialProducts];

        // Search
        if (filters.search) {
            const term = filters.search.toLowerCase();
            filtered = filtered.filter(p =>
                p.name.toLowerCase().includes(term) ||
                p.description?.toLowerCase().includes(term)
            );
        }

        // Price Range
        if (filters.priceRange.min) {
            filtered = filtered.filter(p => {
                const price = parseFloat(p.price.replace('R$', '').replace('.', '').replace(',', '.').trim());
                return price >= parseFloat(filters.priceRange.min);
            });
        }
        if (filters.priceRange.max) {
            filtered = filtered.filter(p => {
                const price = parseFloat(p.price.replace('R$', '').replace('.', '').replace(',', '.').trim());
                return price <= parseFloat(filters.priceRange.max);
            });
        }

        // Categories
        if (filters.categories.length > 0) {
            filtered = filtered.filter(p => filters.categories.includes(p.category));
        }

        // Conditions
        if (filters.conditions && filters.conditions.length > 0) {
            filtered = filtered.filter(p => filters.conditions.includes(p.condition));
        }

        setProducts(filtered);
    };

    return (
        <div className="bg-black min-h-screen py-12">
            <div className="container mx-auto px-4">
                <div className="mb-12 text-center">
                    <h1 className="text-4xl md:text-5xl font-display font-bold text-white uppercase tracking-wider mb-4">
                        {currentCategory.title}
                    </h1>
                    <div className="w-24 h-1 bg-harley-orange mx-auto mb-4"></div>
                    <p className="text-gray-400">
                        {loading ? 'Carregando...' : `${products.length} produto${products.length !== 1 ? 's' : ''} encontrado${products.length !== 1 ? 's' : ''}`}
                    </p>
                </div>

                <ProductFilters
                    products={initialProducts}
                    onFilterChange={handleFilterChange}
                />

                {loading ? (
                    <div className="text-center text-gray-400 py-12">
                        Carregando produtos...
                    </div>
                ) : products.length === 0 ? (
                    <div className="text-center text-gray-400 py-12">
                        Nenhum produto encontrado com os filtros selecionados.
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {products.map((product) => (
                            <div key={product.id} className="bg-gray-900 border border-gray-800 rounded-lg overflow-hidden hover:border-harley-orange transition-all group">
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
                                <div className="p-6">
                                    <div className="flex items-center gap-2 mb-2">
                                        <span className="text-xs text-harley-orange font-bold uppercase tracking-wide">
                                            {product.category}
                                        </span>
                                    </div>
                                    <Link to={`/product/${product.id}`}>
                                        <h3 className="text-xl font-display font-bold text-white mb-2 hover:text-harley-orange transition-colors">
                                            {product.name}
                                        </h3>
                                    </Link>
                                    <div className="flex items-center gap-1 mb-3">
                                        {[...Array(5)].map((_, i) => (
                                            <Star
                                                key={i}
                                                className={`w-4 h-4 ${i < product.rating ? 'fill-harley-orange text-harley-orange' : 'text-gray-600'}`}
                                            />
                                        ))}
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-2xl font-bold text-harley-orange">{product.price}</span>
                                        <button
                                            onClick={() => addToCart(product)}
                                            className="bg-harley-orange text-white px-4 py-2 rounded font-bold uppercase text-sm hover:bg-orange-700 transition-colors"
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

export default CategoryPage;
