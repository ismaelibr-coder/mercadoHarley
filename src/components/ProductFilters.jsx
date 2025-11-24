
import React, { useState, useEffect } from 'react';
import { Search, SlidersHorizontal, X } from 'lucide-react';

const ProductFilters = ({ products, onFilterChange }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [priceRange, setPriceRange] = useState({ min: '', max: '' });
    const [selectedCategories, setSelectedCategories] = useState([]);
    const [selectedConditions, setSelectedConditions] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');

    // Extract unique categories from products
    const availableCategories = [...new Set(products.map(p => p.category))].filter(Boolean).sort();

    // Extract unique conditions
    const availableConditions = ['Novo', 'Usado'];

    useEffect(() => {
        applyFilters();
    }, [priceRange, selectedCategories, selectedConditions, searchTerm]);

    const applyFilters = () => {
        onFilterChange({
            priceRange,
            categories: selectedCategories,
            conditions: selectedConditions,
            search: searchTerm
        });
    };

    const toggleCategory = (category) => {
        setSelectedCategories(prev =>
            prev.includes(category)
                ? prev.filter(c => c !== category)
                : [...prev, category]
        );
    };

    const clearFilters = () => {
        setPriceRange({ min: '', max: '' });
        setSelectedCategories([]);
        setSelectedConditions([]);
        setSearchTerm('');
    };

    return (
        <div className="mb-8">
            {/* Mobile Filter Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="md:hidden w-full bg-gray-900 border border-gray-800 text-white p-3 rounded flex items-center justify-center gap-2 mb-4"
            >
                <SlidersHorizontal className="w-5 h-5" />
                Filtros
            </button>

            {/* Filters Container */}
            <div className={`${isOpen ? 'block' : 'hidden'} md:block bg-gray-900 border border-gray-800 rounded-lg p-6`}>
                <div className="flex flex-col md:flex-row gap-6 justify-between items-start md:items-end">

                    {/* Search */}
                    <div className="w-full md:w-1/4">
                        <label className="block text-gray-400 text-sm mb-2 font-bold uppercase">Buscar</label>
                        <div className="relative">
                            <input
                                type="text"
                                placeholder="Nome do produto..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full bg-black border border-gray-700 rounded p-3 pl-10 text-white focus:border-harley-orange focus:outline-none transition-colors"
                            />
                            <Search className="absolute left-3 top-3.5 w-5 h-5 text-gray-500" />
                        </div>
                    </div>

                    {/* Price Range */}
                    <div className="w-full md:w-1/4">
                        <label className="block text-gray-400 text-sm mb-2 font-bold uppercase">Preço (R$)</label>
                        <div className="flex gap-2 items-center">
                            <input
                                type="number"
                                placeholder="Mín"
                                value={priceRange.min}
                                onChange={(e) => setPriceRange({ ...priceRange, min: e.target.value })}
                                className="w-full bg-black border border-gray-700 rounded p-3 text-white focus:border-harley-orange focus:outline-none transition-colors"
                            />
                            <span className="text-gray-500">-</span>
                            <input
                                type="number"
                                placeholder="Máx"
                                value={priceRange.max}
                                onChange={(e) => setPriceRange({ ...priceRange, max: e.target.value })}
                                className="w-full bg-black border border-gray-700 rounded p-3 text-white focus:border-harley-orange focus:outline-none transition-colors"
                            />
                        </div>
                    </div>

                    {/* Condition (Dropdown) */}
                    <div className="w-full md:w-1/4">
                        <label className="block text-gray-400 text-sm mb-2 font-bold uppercase">Condição</label>
                        <select
                            value={selectedConditions[0] || ''}
                            onChange={(e) => setSelectedConditions(e.target.value ? [e.target.value] : [])}
                            className="w-full bg-black border border-gray-700 rounded p-3 text-white focus:border-harley-orange focus:outline-none transition-colors appearance-none cursor-pointer"
                        >
                            <option value="">Todas</option>
                            {availableConditions.map(condition => (
                                <option key={condition} value={condition}>{condition}</option>
                            ))}
                        </select>
                    </div>

                    {/* Categories */}
                    <div className="w-full md:w-1/4">
                        <label className="block text-gray-400 text-sm mb-2 font-bold uppercase">Categorias</label>
                        <div className="flex flex-wrap gap-2">
                            {availableCategories.map(category => (
                                <button
                                    key={category}
                                    onClick={() => toggleCategory(category)}
                                    className={`px-3 py-1 rounded-full text-xs font-bold uppercase border transition-colors ${selectedCategories.includes(category)
                                            ? 'bg-harley-orange border-harley-orange text-white'
                                            : 'bg-black border-gray-700 text-gray-400 hover:border-gray-500'
                                        }`}
                                >
                                    {category}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Active Filters Summary & Clear */}
                {(searchTerm || priceRange.min || priceRange.max || selectedCategories.length > 0 || selectedConditions.length > 0) && (
                    <div className="mt-6 pt-6 border-t border-gray-800 flex justify-between items-center">
                        <div className="text-sm text-gray-400">
                            Filtros ativos:
                            {searchTerm && <span className="ml-2 text-white">"{searchTerm}"</span>}
                            {(priceRange.min || priceRange.max) && <span className="ml-2 text-white">Preço</span>}
                            {selectedConditions.length > 0 && <span className="ml-2 text-white">{selectedConditions.join(', ')}</span>}
                            {selectedCategories.length > 0 && <span className="ml-2 text-white">{selectedCategories.length} categorias</span>}
                        </div>
                        <button
                            onClick={clearFilters}
                            className="text-red-500 text-sm font-bold uppercase flex items-center gap-1 hover:text-red-400"
                        >
                            <X className="w-4 h-4" /> Limpar Filtros
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ProductFilters;
