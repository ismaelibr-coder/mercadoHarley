import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

const Hero = () => {
    return (
        <div className="relative h-[600px] flex items-center overflow-hidden">
            {/* Background Image with Overlay */}
            <div className="absolute inset-0 z-0">
                <img
                    src="/hero-chopper.png"
                    alt="Harley Davidson Chopper"
                    className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-r from-black via-black/70 to-transparent"></div>
            </div>

            {/* Content */}
            <div className="container mx-auto px-4 relative z-10">
                <div className="max-w-2xl">
                    <span className="text-harley-orange font-bold tracking-widest uppercase mb-4 block">
                        Performance & Estilo
                    </span>
                    <h1 className="text-5xl md:text-7xl font-display font-bold text-white mb-6 leading-tight">
                        LIBERDADE <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-gray-100 to-gray-500">
                            SOBRE RODAS
                        </span>
                    </h1>
                    <p className="text-gray-300 text-lg mb-8 max-w-lg">
                        Encontre as melhores peças e acessórios para sua Harley.
                        Qualidade premium para quem exige o melhor da estrada.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4">
                        <Link
                            to="/category/todos"
                            className="bg-harley-orange text-white px-8 py-4 rounded font-bold text-lg hover:bg-orange-700 transition-colors flex items-center justify-center gap-2 group"
                        >
                            Ver Catálogo
                            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                        </Link>
                        <Link
                            to="/custom-parts"
                            className="border-2 border-white text-white px-8 py-4 rounded font-bold text-lg hover:bg-white hover:text-black transition-colors text-center"
                        >
                            Peças Customizadas
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Hero;
