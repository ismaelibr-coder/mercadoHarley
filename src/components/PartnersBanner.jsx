import React from 'react';

const partners = [
    { name: 'Pavilhão Oficina & Performance', logo: '/partners/pavilhao.png', className: 'scale-125 contrast-125 brightness-110' }, // Patch zoom
    { name: 'Dillenburg Kustom', logo: '/partners/dillenburg.png', className: 'scale-125 contrast-125 brightness-150' }, // Boost brightness
    { name: 'Torbal Motorcycle Exhaust', logo: '/partners/torbal.png', className: 'scale-125 contrast-125 brightness-150' }, // Boost brightness
    { name: 'Wings Custom', logo: '/partners/wings.png', className: 'scale-125 contrast-125 brightness-110' }, // Patch zoom (no mix-blend)
    { name: '20W50 Co.', logo: '/partners/20w50.png', className: 'scale-125 contrast-125 brightness-100' }
];

const PartnersBanner = () => {
    return (
        <section className="py-16 bg-gradient-to-b from-black via-gray-900 to-black border-t border-gray-900">
            <div className="container mx-auto px-4">
                <div className="text-center mb-12">
                    <h2 className="text-3xl font-display font-bold text-white uppercase tracking-wider mb-2">
                        Parceiros <span className="text-sick-red">&</span> Apoiadores
                    </h2>
                    <p className="text-gray-400 max-w-2xl mx-auto">
                        Marcas que aceleram junto com a SICK GRIP na cultura custom.
                    </p>
                </div>

                {/* Faixa com scroll infinito: a lista de parceiros é duplicada e a
                    animação translada exatamente 50% (metade = 1 cópia), então o
                    loop não tem salto visível. Pausa no hover pra dar tempo de olhar
                    um logo específico; grayscale->cor no hover de cada item é mantido. */}
                <div
                    className="group/marquee overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_10%,black_90%,transparent)]"
                >
                    <div className="flex w-max items-center gap-8 md:gap-16 animate-marquee group-hover/marquee:[animation-play-state:paused] motion-reduce:animate-none motion-reduce:flex-wrap motion-reduce:justify-center">
                        {[...partners, ...partners].map((partner, index) => (
                            <div
                                key={index}
                                className="group relative w-32 h-32 md:w-40 md:h-40 flex-none flex items-center justify-center transition-transform duration-300 hover:scale-105"
                            >
                                {/* Glow Effect */}
                                <div className="absolute inset-0 bg-sick-red/20 rounded-full blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

                                {/* Circle Container */}
                                <div className="relative w-full h-full rounded-full bg-black flex items-center justify-center p-4 overflow-hidden border border-gray-800 group-hover:border-sick-red transition-all duration-300 shadow-lg shadow-black/50">
                                    <img
                                        src={partner.logo}
                                        alt={partner.name}
                                        aria-hidden={index >= partners.length}
                                        className={`w-full h-full object-cover filter grayscale group-hover:grayscale-0 transition-all duration-300 ${partner.className}`}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
};

export default PartnersBanner;
