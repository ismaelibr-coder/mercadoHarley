import React, { useState, useEffect } from 'react';
import { Quote, Star } from 'lucide-react';
import { getTestimonials } from '../services/testimonialService';

/**
 * "O que os clientes dizem" — cards com foto/nome/cidade/frase/nota.
 *
 * Busca os depoimentos de /admin/testimonials (antes era um array fixo no
 * código com depoimentos placeholder) — gerenciável pelo admin em
 * /admin/testimonials, sem precisar mexer em código pra trocar texto/nota/foto.
 */
const initials = (name) => name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0].toUpperCase())
    .join('');

const Testimonials = () => {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let cancelled = false;
        getTestimonials()
            .then((data) => { if (!cancelled) setItems(data); })
            .finally(() => { if (!cancelled) setLoading(false); });
        return () => { cancelled = true; };
    }, []);

    if (loading || items.length === 0) return null;

    return (
        <section className="py-16 md:py-20 bg-gray-900">
            <div className="container mx-auto px-4">
                <div className="text-center mb-12">
                    <h2 className="text-3xl md:text-4xl font-display font-bold text-white uppercase mb-2">
                        O que os clientes <span className="text-sick-red">dizem</span>
                    </h2>
                    <div className="h-1 w-20 bg-sick-red mx-auto"></div>
                </div>

                {/* Carrossel horizontal com scroll-snap no mobile (um card
                    predominante por vez, próximo espiando na borda); vira grid de 3
                    colunas fixas a partir do md — sem JS de carrossel, só CSS. */}
                <div className="flex md:grid md:grid-cols-3 gap-6 overflow-x-auto md:overflow-visible snap-x snap-mandatory md:snap-none -mx-4 px-4 md:mx-0 md:px-0 pb-2 md:pb-0">
                    {items.map((testimonial) => (
                        <div
                            key={testimonial.id}
                            className="flex-none w-[85%] sm:w-[60%] md:w-auto snap-center bg-black border border-gray-800 rounded-lg p-6 flex flex-col hover:border-sick-red transition-colors duration-300"
                        >
                            <Quote className="w-8 h-8 text-sick-red/40 mb-3" aria-hidden="true" />
                            <p className="text-gray-300 flex-1 mb-6 leading-relaxed">"{testimonial.quote}"</p>
                            <div className="flex items-center gap-3 pt-4 border-t border-gray-800">
                                {testimonial.photo ? (
                                    <img
                                        src={testimonial.photo}
                                        alt={testimonial.name}
                                        loading="lazy"
                                        className="w-12 h-12 rounded-full object-cover flex-none"
                                    />
                                ) : (
                                    <div className="w-12 h-12 rounded-full bg-sick-red/10 border border-sick-red/30 flex items-center justify-center flex-none text-sick-red font-bold">
                                        {initials(testimonial.name)}
                                    </div>
                                )}
                                <div>
                                    <p className="text-white font-bold text-sm">{testimonial.name}</p>
                                    {testimonial.city && <p className="text-gray-500 text-xs">{testimonial.city}</p>}
                                    {testimonial.rating && (
                                        <div className="flex items-center gap-0.5 mt-1" role="img" aria-label={`${testimonial.rating} de 5 estrelas`}>
                                            {[...Array(5)].map((_, i) => (
                                                <Star
                                                    key={i}
                                                    className={`w-3 h-3 ${i < testimonial.rating ? 'text-harley-orange fill-harley-orange' : 'text-gray-600'}`}
                                                    aria-hidden="true"
                                                />
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default Testimonials;
