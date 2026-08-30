import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Wrench, Disc, Shirt, Zap } from 'lucide-react';
import { getBannerByPlacement } from '../services/bannerService.js';
import { useInViewport } from '../hooks/useInViewport.js';

// fallbackImage is a curated stock photo (verified working, no visible
// competitor logos) used when no admin-managed banner exists yet for that
// category's placement — keeps every card on an equal visual footing
// ("imagem de fundo" for all 4, not just whichever one has a real banner
// configured) without writing anything to the Banner table.
const categories = [
    {
        id: 'pecas',
        name: 'Peças & Manutenção',
        icon: Wrench,
        color: 'from-orange-600 to-red-600',
        description: 'Mantenha sua máquina rodando.',
        fallbackImage: null // has a real admin-configured banner already
    },
    {
        id: 'acessorios',
        name: 'Acessórios Custom',
        icon: Disc,
        color: 'from-blue-600 to-indigo-600',
        description: 'Estilo único para sua moto.',
        fallbackImage: 'https://images.unsplash.com/photo-1775264047146-9d937a189bb1?q=80&w=800&auto=format&fit=crop'
    },
    {
        id: 'vestuario',
        name: 'Vestuário & Gear',
        icon: Shirt,
        color: 'from-gray-600 to-gray-800',
        description: 'Pilote com estilo e proteção.',
        fallbackImage: 'https://images.unsplash.com/photo-1581425157521-c2948bde6614?q=80&w=800&auto=format&fit=crop'
    },
    {
        id: 'eletrica',
        name: 'Elétrica & Iluminação',
        icon: Zap,
        color: 'from-yellow-500 to-amber-600',
        description: 'Ilumine seu caminho.',
        fallbackImage: 'https://images.unsplash.com/photo-1671039294319-08f95502e09a?q=80&w=800&auto=format&fit=crop'
    }
];

// Own component (not inlined in the .map()) so each card can independently
// track when it scrolls into view — a hook can't be called from inside a loop.
const CategoryCard = ({ category, banner, delay }) => {
    const [ref, isVisible] = useInViewport();
    const image = banner?.image || category.fallbackImage;

    return (
        <Link
            ref={ref}
            to={`/category/${category.id}`}
            style={{ animationDelay: isVisible ? `${delay}ms` : undefined }}
            className={`group relative overflow-hidden rounded-lg bg-gray-900 border border-gray-800 hover:border-sick-red transition-all duration-300 hover:shadow-lg hover:shadow-black/50 hover:-translate-y-1 h-48 sm:h-64 ${isVisible ? 'animate-fade-in-up' : 'opacity-0'}`}
        >
            {image ? (
                <>
                    <img
                        src={image}
                        alt={category.name}
                        className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-black/10 group-hover:from-black/90 transition-colors duration-300"></div>
                    <div className="relative h-full flex flex-col items-center justify-end text-center p-3 sm:p-6">
                        <h3 className="text-sm sm:text-xl font-bold text-white uppercase mb-1 sm:mb-2 tracking-wider group-hover:text-sick-red transition-colors">
                            {category.name}
                        </h3>
                        <p className="hidden sm:block text-sm text-gray-300">
                            {category.description}
                        </p>
                    </div>
                </>
            ) : (
                <>
                    <div className={`absolute inset-0 bg-gradient-to-br ${category.color} opacity-0 group-hover:opacity-10 transition-opacity duration-300`}></div>
                    <div className="relative h-full flex flex-col items-center justify-center text-center p-6">
                        <div className="mb-4 p-4 bg-black rounded-full border border-gray-800 group-hover:border-sick-red/50 group-hover:scale-110 transition-all duration-300">
                            <category.icon className="w-8 h-8 text-gray-400 group-hover:text-sick-red transition-colors" />
                        </div>
                        <h3 className="text-xl font-bold text-white uppercase mb-2 tracking-wider group-hover:text-sick-red transition-colors">
                            {category.name}
                        </h3>
                        <p className="text-sm text-gray-400 group-hover:text-gray-300">
                            {category.description}
                        </p>
                    </div>
                </>
            )}
        </Link>
    );
};

const CategoryGrid = () => {
    // Shows all 4 macro-categories unconditionally — this section is meant to
    // communicate the full breadth of what the store carries, not just what's
    // in stock at this exact moment. A category that's temporarily empty
    // (today, only "Peças" has real products — the other 3 will show "Nenhum
    // produto encontrado" on click until inventory is added there) still
    // reads as more complete than a single lonely card. Per-nav hiding of
    // truly empty sections still happens separately in Layout.jsx via
    // useCategoryCounts, which this intentionally does NOT use.
    const [categoryBanners, setCategoryBanners] = useState({});

    useEffect(() => {
        Promise.all(
            categories.map((category) =>
                getBannerByPlacement(`category-${category.id}`).then((banner) => [category.id, banner])
            )
        ).then((results) => {
            setCategoryBanners(Object.fromEntries(results.filter(([, banner]) => banner)));
        });
    }, []);

    return (
        <div className="container mx-auto px-4 py-16">
            <div className="mb-10">
                <h2 className="text-3xl md:text-4xl font-display font-bold text-white uppercase border-l-4 border-sick-red pl-4">
                    Compre por Categoria
                </h2>
                <p className="text-gray-400 pl-4 mt-1">Encontre exatamente o que sua moto precisa.</p>
            </div>
            {/* Fixed grid, not flex-wrap — the count is always exactly 4 now (all
                macro-categories render unconditionally, see above), so there's no
                "empty track" risk a variable item count would create. */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
                {categories.map((category, index) => (
                    <CategoryCard
                        key={category.id}
                        category={category}
                        banner={categoryBanners[category.id]}
                        delay={index * 100}
                    />
                ))}
            </div>
        </div>
    );
};

export default CategoryGrid;
