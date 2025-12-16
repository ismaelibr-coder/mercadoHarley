import React from 'react';
import { Link } from 'react-router-dom';
import { Wrench, Disc, Shirt, Zap } from 'lucide-react';

const categories = [
    {
        id: 'pecas',
        name: 'Peças & Manutenção',
        icon: Wrench,
        color: 'from-orange-600 to-red-600',
        description: 'Mantenha sua máquina rodando.'
    },
    {
        id: 'acessorios',
        name: 'Acessórios Custom',
        icon: Disc,
        color: 'from-blue-600 to-indigo-600',
        description: 'Estilo único para sua moto.'
    },
    {
        id: 'vestuario',
        name: 'Vestuário & Gear',
        icon: Shirt,
        color: 'from-gray-600 to-gray-800',
        description: 'Pilote com estilo e proteção.'
    },
    {
        id: 'eletrica',
        name: 'Elétrica & Iluminação',
        icon: Zap,
        color: 'from-yellow-500 to-amber-600',
        description: 'Ilumine seu caminho.'
    }
];

const CategoryGrid = () => {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {categories.map((category) => (
                <Link
                    key={category.id}
                    to={`/category/${category.id}`}
                    className="group relative overflow-hidden rounded-lg bg-gray-900 border border-gray-800 hover:border-sick-red transition-all duration-300"
                >
                    <div className={`absolute inset-0 bg-gradient-to-br ${category.color} opacity-0 group-hover:opacity-10 transition-opacity duration-300`}></div>

                    <div className="p-6 flex flex-col items-center text-center h-full">
                        <div className="mb-4 p-4 bg-black rounded-full border border-gray-800 group-hover:border-sick-red/50 group-hover:scale-110 transition-all duration-300">
                            <category.icon className="w-8 h-8 text-gray-400 group-hover:text-sick-red transition-colors" />
                        </div>

                        <h3 className="text-xl font-bold text-white uppercase mb-2 tracking-wider group-hover:text-sick-red transition-colors">
                            {category.name}
                        </h3>

                        <p className="text-sm text-gray-500 group-hover:text-gray-400">
                            {category.description}
                        </p>
                    </div>
                </Link>
            ))}
        </div>
    );
};

export default CategoryGrid;
