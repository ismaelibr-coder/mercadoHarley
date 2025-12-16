import React, { useState, useEffect } from 'react';
import { Search, SlidersHorizontal, ChevronDown, ChevronRight } from 'lucide-react';
import { getFilterSettings } from '../services/settingsService';

const ProductFilters = ({ products, onFilterChange }) => {
    const [isOpen, setIsOpen] = useState(true);
    const [priceRange, setPriceRange] = useState({ min: '', max: '' });
    const [selectedCategories, setSelectedCategories] = useState([]);
    const [selectedPartTypes, setSelectedPartTypes] = useState([]);
    const [selectedPartners, setSelectedPartners] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');

    // Dynamic Options State
    const [availableCategories, setAvailableCategories] = useState([]);
    const [availablePartTypes, setAvailablePartTypes] = useState([]);
    const [availablePartners, setAvailablePartners] = useState([]);

    // Accordion states
    const [expandedSections, setExpandedSections] = useState({
        categories: false,
        partTypes: false,
        partners: false,
        price: false
    });

    // Load Settings
    useEffect(() => {
        const loadSettings = async () => {
            const settings = await getFilterSettings();
            setAvailableCategories(settings.categories);
            setAvailablePartTypes(settings.partTypes);
            setAvailablePartners(settings.partners);
        };
        loadSettings();
    }, []);

    // Counts (Computed from products)
    const categoryCounts = products.reduce((acc, product) => {
        const cat = product.category || 'Outros';
        acc[cat] = (acc[cat] || 0) + 1;
        return acc;
    }, {});

    const partTypeCounts = products.reduce((acc, product) => {
        const type = product.partType;
        if (type) acc[type] = (acc[type] || 0) + 1;
        return acc;
    }, {});

    const partnerCounts = products.reduce((acc, product) => {
        const partner = product.partner;
        if (partner) acc[partner] = (acc[partner] || 0) + 1;
        return acc;
    }, {});

    useEffect(() => {
        applyFilters();
    }, [priceRange, selectedCategories, selectedPartTypes, selectedPartners, searchTerm]);

    const applyFilters = () => {
        onFilterChange({
            priceRange,
            categories: selectedCategories,
            partTypes: selectedPartTypes,
            partners: selectedPartners,
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

    const togglePartType = (type) => {
        setSelectedPartTypes(prev =>
            prev.includes(type)
                ? prev.filter(t => t !== type)
                : [...prev, type]
        );
    };

    const togglePartner = (partner) => {
        setSelectedPartners(prev =>
            prev.includes(partner)
                ? prev.filter(p => p !== partner)
                : [...prev, partner]
        );
    };

    const toggleSection = (section) => {
        setExpandedSections(prev => ({
            ...prev,
            [section]: !prev[section]
        }));
    };

    const clearFilters = () => {
        setPriceRange({ min: '', max: '' });
        setSelectedCategories([]);
        setSelectedPartTypes([]);
        setSelectedPartners([]);
        setSearchTerm('');
    };

    return (
        <div className="mb-8 md:mb-0">
            {/* Mobile Filter Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="md:hidden w-full bg-gray-900 border border-gray-800 text-white p-3 rounded flex items-center justify-center gap-2 mb-4 uppercase font-bold text-sm tracking-wide hover:border-sick-red transition-colors"
            >
                <SlidersHorizontal className="w-5 h-5 text-sick-red" />
                Filtros & Categorias
            </button>

            {/* Sidebar Container */}
            <div className={`${isOpen ? 'block' : 'hidden'} md:block bg-gray-900/50 border border-gray-800 rounded-lg p-6 sticky top-24 max-h-[calc(100vh-120px)] overflow-y-auto`}>
                <h3 className="font-display font-bold text-xl uppercase text-white mb-6 border-b border-gray-800 pb-2">
                    Navegar Por
                </h3>

                {/* Search */}
                <div className="mb-6">
                    <div className="relative">
                        <input
                            type="text"
                            placeholder="Buscar peça..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-black border border-gray-700 rounded p-2 pl-9 text-sm text-white focus:border-sick-red focus:outline-none transition-colors"
                        />
                        <Search className="absolute left-2.5 top-2.5 w-4 h-4 text-gray-500" />
                    </div>
                </div>

                {/* Categories */}
                <div className="mb-6">
                    <button
                        onClick={() => toggleSection('categories')}
                        className="w-full flex items-center justify-between text-gray-300 text-sm font-bold uppercase mb-2 tracking-wider bg-gray-800/50 p-2 rounded hover:bg-gray-800 transition-colors"
                    >
                        <span>Categoria</span>
                        {expandedSections.categories ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                    </button>
                    {expandedSections.categories && (
                        <div className="space-y-1 pl-2 max-h-48 overflow-y-auto">
                            {availableCategories.map(category => (
                                <label key={category} className="flex items-center gap-2 text-sm text-gray-300 hover:text-sick-red cursor-pointer py-1 transition-colors">
                                    <input
                                        type="checkbox"
                                        checked={selectedCategories.includes(category)}
                                        onChange={() => toggleCategory(category)}
                                        className="rounded bg-black border-gray-600 text-sick-red focus:ring-sick-red focus:ring-offset-0"
                                    />
                                    <span className="flex-1">{category}</span>
                                    <span className="text-xs text-gray-500">({categoryCounts[category]})</span>
                                </label>
                            ))}
                        </div>
                    )}
                </div>

                {/* Part Types */}
                <div className="mb-6">
                    <button
                        onClick={() => toggleSection('partTypes')}
                        className="w-full flex items-center justify-between text-gray-300 text-sm font-bold uppercase mb-2 tracking-wider bg-gray-800/50 p-2 rounded hover:bg-gray-800 transition-colors"
                    >
                        <span>Tipo de Peça</span>
                        {expandedSections.partTypes ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                    </button>
                    {expandedSections.partTypes && (
                        <div className="space-y-1 pl-2 max-h-64 overflow-y-auto">
                            {availablePartTypes.map(type => (
                                <label key={type} className="flex items-center gap-2 text-sm text-gray-300 hover:text-sick-red cursor-pointer py-1 transition-colors">
                                    <input
                                        type="checkbox"
                                        checked={selectedPartTypes.includes(type)}
                                        onChange={() => togglePartType(type)}
                                        className="rounded bg-black border-gray-600 text-sick-red focus:ring-sick-red focus:ring-offset-0"
                                    />
                                    <span className="flex-1">{type}</span>
                                    {partTypeCounts[type] && <span className="text-xs text-gray-500">({partTypeCounts[type]})</span>}
                                </label>
                            ))}
                        </div>
                    )}
                </div>

                {/* Partners */}
                <div className="mb-6">
                    <button
                        onClick={() => toggleSection('partners')}
                        className="w-full flex items-center justify-between text-gray-300 text-sm font-bold uppercase mb-2 tracking-wider bg-gray-800/50 p-2 rounded hover:bg-gray-800 transition-colors"
                    >
                        <span>Parceiro / Marca</span>
                        {expandedSections.partners ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                    </button>
                    {expandedSections.partners && (
                        <div className="space-y-1 pl-2 max-h-48 overflow-y-auto">
                            {availablePartners.map(partner => (
                                <label key={partner} className="flex items-center gap-2 text-sm text-gray-300 hover:text-sick-red cursor-pointer py-1 transition-colors">
                                    <input
                                        type="checkbox"
                                        checked={selectedPartners.includes(partner)}
                                        onChange={() => togglePartner(partner)}
                                        className="rounded bg-black border-gray-600 text-sick-red focus:ring-sick-red focus:ring-offset-0"
                                    />
                                    <span className="flex-1">{partner}</span>
                                    {partnerCounts[partner] && <span className="text-xs text-gray-500">({partnerCounts[partner]})</span>}
                                </label>
                            ))}
                        </div>
                    )}
                </div>

                {/* Price Range */}
                <div className="mb-6">
                    <button
                        onClick={() => toggleSection('price')}
                        className="w-full flex items-center justify-between text-gray-300 text-sm font-bold uppercase mb-2 tracking-wider bg-gray-800/50 p-2 rounded hover:bg-gray-800 transition-colors"
                    >
                        <span>Faixa de Preço</span>
                        {expandedSections.price ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                    </button>
                    {expandedSections.price && (
                        <div className="grid grid-cols-2 gap-2 pl-2">
                            <input
                                type="number"
                                placeholder="Min"
                                value={priceRange.min}
                                onChange={(e) => setPriceRange(prev => ({ ...prev, min: e.target.value }))}
                                className="bg-black border border-gray-700 rounded p-2 text-sm text-white focus:border-sick-red focus:outline-none"
                            />
                            <input
                                type="number"
                                placeholder="Max"
                                value={priceRange.max}
                                onChange={(e) => setPriceRange(prev => ({ ...prev, max: e.target.value }))}
                                className="bg-black border border-gray-700 rounded p-2 text-sm text-white focus:border-sick-red focus:outline-none"
                            />
                        </div>
                    )}
                </div>

                {/* Clear Filters */}
                {(selectedCategories.length > 0 || selectedPartTypes.length > 0 || selectedPartners.length > 0 || priceRange.min || priceRange.max || searchTerm) && (
                    <button
                        onClick={clearFilters}
                        className="w-full bg-sick-red text-white py-2 rounded font-bold uppercase text-xs hover:bg-red-700 transition-colors"
                    >
                        Limpar Filtros
                    </button>
                )}
            </div>
        </div>
    );
};

export default ProductFilters;
