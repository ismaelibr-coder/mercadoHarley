import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { getGalleryItems } from '../services/customerGalleryService';

/**
 * "Quem já roda com a SICK GRIP" — grid estilo Instagram com lightbox.
 *
 * Busca os itens de /admin/customer-gallery (antes era um array fixo no
 * código com fotos de banco) — gerenciável pelo admin em
 * /admin/customer-gallery, sem precisar mexer em código pra trocar foto.
 */
const CustomerShowcase = () => {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [lightboxIndex, setLightboxIndex] = useState(null);

    useEffect(() => {
        let cancelled = false;
        getGalleryItems()
            .then((data) => { if (!cancelled) setItems(data); })
            .finally(() => { if (!cancelled) setLoading(false); });
        return () => { cancelled = true; };
    }, []);

    // Hidden while loading (avoids a flash of "empty" before the first
    // fetch resolves) and when there's genuinely nothing cadastrado.
    if (loading || items.length === 0) return null;

    const openLightbox = (index) => setLightboxIndex(index);
    const closeLightbox = () => setLightboxIndex(null);
    const activePhoto = lightboxIndex !== null ? items[lightboxIndex] : null;

    return (
        <section className="py-16 md:py-20 bg-black bg-noise">
            <div className="container mx-auto px-4">
                <div className="text-center mb-12">
                    <h2 className="text-3xl md:text-4xl font-display font-bold text-white uppercase mb-2">
                        Quem já roda com a <span className="text-sick-red">SICK GRIP</span>
                    </h2>
                    <p className="text-gray-400 max-w-2xl mx-auto">
                        Motos de clientes de verdade, equipadas com peças da loja.
                    </p>
                </div>

                <div className="grid grid-cols-3 md:grid-cols-4 gap-3 md:gap-4">
                    {items.map((photo, index) => (
                        <button
                            key={photo.id}
                            type="button"
                            onClick={() => openLightbox(index)}
                            className="relative aspect-square overflow-hidden rounded-lg group focus:outline-none focus-visible:ring-2 focus-visible:ring-sick-red"
                        >
                            <img
                                src={photo.image}
                                alt={photo.caption || 'Cliente SICK GRIP'}
                                loading="lazy"
                                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                            />
                            {photo.caption && (
                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/0 to-black/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-3">
                                    <p className="text-white font-bold text-sm text-left">{photo.caption}</p>
                                </div>
                            )}
                        </button>
                    ))}
                </div>
            </div>

            {activePhoto && (
                <div
                    className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
                    role="dialog"
                    aria-modal="true"
                    onClick={closeLightbox}
                >
                    <button
                        type="button"
                        onClick={closeLightbox}
                        aria-label="Fechar"
                        className="absolute top-4 right-4 text-white hover:text-sick-red transition-colors"
                    >
                        <X className="w-8 h-8" />
                    </button>
                    <div className="max-w-3xl max-h-[85vh]" onClick={(e) => e.stopPropagation()}>
                        <img
                            src={activePhoto.image}
                            alt={activePhoto.caption || 'Cliente SICK GRIP'}
                            className="max-w-full max-h-[75vh] object-contain rounded-lg mx-auto"
                        />
                        {activePhoto.caption && (
                            <p className="text-center text-white font-bold mt-4">{activePhoto.caption}</p>
                        )}
                    </div>
                </div>
            )}
        </section>
    );
};

export default CustomerShowcase;
