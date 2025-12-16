import React from 'react';
import { Link } from 'react-router-dom';
import { MessageCircle, Wrench, Sparkles, ArrowLeft } from 'lucide-react';
import SEO from '../components/SEO';

const CustomPartsPage = () => {
    const whatsappNumber = '5511999999999'; // Substitua pelo número real
    const whatsappMessage = encodeURIComponent('Olá! Gostaria de um orçamento para peças customizadas.');
    const whatsappLink = `https://wa.me/${whatsappNumber}?text=${whatsappMessage}`;

    const customExamples = [
        {
            title: 'Escapamento Custom',
            description: 'Escapamento artesanal em aço inox com acabamento cromado',
            image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?q=80&w=2070&auto=format&fit=crop'
        },
        {
            title: 'Guidão Personalizado',
            description: 'Guidão sob medida com altura e ângulo customizados',
            image: 'https://images.unsplash.com/photo-1558981001-1995369a39cd?q=80&w=2070&auto=format&fit=crop'
        },
        {
            title: 'Banco Exclusivo',
            description: 'Banco com costura personalizada e estofamento premium',
            image: 'https://images.unsplash.com/photo-1622185135505-2d795043df06?q=80&w=2069&auto=format&fit=crop'
        },
        {
            title: 'Pintura Customizada',
            description: 'Pintura artística exclusiva para tanque e paralamas',
            image: 'https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?q=80&w=2070&auto=format&fit=crop'
        }
    ];

    return (
        <div className="min-h-screen bg-black text-white py-12">
            <SEO
                title="Peças Customizadas - SICK GRIP"
                description="Fabricamos peças exclusivas sob medida para sua Harley-Davidson. Entre em contato via WhatsApp para orçamentos e ideias personalizadas."
            />

            <div className="container mx-auto px-4">
                {/* Breadcrumb */}
                <Link to="/" className="inline-flex items-center text-gray-400 hover:text-harley-orange mb-8 transition-colors">
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Voltar para a loja
                </Link>

                {/* Header */}
                <div className="text-center mb-12">
                    <h1 className="text-4xl md:text-6xl font-display font-bold mb-4 uppercase">
                        Peças <span className="text-harley-orange">Customizadas</span>
                    </h1>
                    <p className="text-gray-400 text-lg max-w-2xl mx-auto">
                        Transforme sua Harley em uma obra única. Fabricamos peças exclusivas sob medida com a mais alta qualidade.
                    </p>
                </div>

                {/* WhatsApp CTA */}
                <div className="bg-gradient-to-r from-harley-orange to-orange-600 rounded-lg p-8 mb-12 text-center">
                    <MessageCircle className="w-16 h-16 mx-auto mb-4" />
                    <h2 className="text-2xl font-bold mb-2">Solicite seu Orçamento</h2>
                    <p className="text-white/90 mb-6">
                        Entre em contato via WhatsApp para discutir suas ideias e receber um orçamento personalizado
                    </p>
                    <a
                        href={whatsappLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 bg-white text-harley-orange px-8 py-4 rounded-lg font-bold text-lg hover:bg-gray-100 transition-colors"
                    >
                        <MessageCircle className="w-6 h-6" />
                        Falar no WhatsApp
                    </a>
                </div>

                {/* Examples Grid */}
                <div className="mb-12">
                    <h2 className="text-3xl font-bold mb-8 text-center">
                        <Sparkles className="inline w-8 h-8 text-harley-orange mr-2" />
                        Exemplos de Trabalhos
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {customExamples.map((example, index) => (
                            <div key={index} className="bg-gray-900 rounded-lg overflow-hidden border border-gray-800 hover:border-harley-orange transition-colors group">
                                <div className="relative h-48 overflow-hidden">
                                    <img
                                        src={example.image}
                                        alt={example.title}
                                        loading="lazy"
                                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                                    />
                                </div>
                                <div className="p-4">
                                    <h3 className="text-xl font-bold mb-2">{example.title}</h3>
                                    <p className="text-gray-400 text-sm">{example.description}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Process Section */}
                <div className="bg-gray-900 rounded-lg p-8 border border-gray-800">
                    <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                        <Wrench className="w-6 h-6 text-harley-orange" />
                        Como Funciona
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="text-center">
                            <div className="bg-harley-orange/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                                <span className="text-2xl font-bold text-harley-orange">1</span>
                            </div>
                            <h3 className="font-bold mb-2">Contato</h3>
                            <p className="text-gray-400 text-sm">Entre em contato via WhatsApp com sua ideia</p>
                        </div>
                        <div className="text-center">
                            <div className="bg-harley-orange/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                                <span className="text-2xl font-bold text-harley-orange">2</span>
                            </div>
                            <h3 className="font-bold mb-2">Orçamento</h3>
                            <p className="text-gray-400 text-sm">Analisamos o projeto e enviamos o orçamento</p>
                        </div>
                        <div className="text-center">
                            <div className="bg-harley-orange/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                                <span className="text-2xl font-bold text-harley-orange">3</span>
                            </div>
                            <h3 className="font-bold mb-2">Fabricação</h3>
                            <p className="text-gray-400 text-sm">Produzimos sua peça exclusiva com qualidade premium</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CustomPartsPage;
