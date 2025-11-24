import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { getActiveBanners } from '../services/bannerService';

const BannerCarousel = () => {
    const [banners, setBanners] = useState([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        loadBanners();
    }, []);

    useEffect(() => {
        if (banners.length === 0) return;

        const interval = setInterval(() => {
            setCurrentIndex((prev) => (prev + 1) % banners.length);
        }, 5000); // Auto-play every 5 seconds

        return () => clearInterval(interval);
    }, [banners.length]);

    const loadBanners = async () => {
        try {
            const data = await getActiveBanners();
            // Filter only carousel-type banners
            const carouselBanners = (data || []).filter(banner => banner.displayType === 'carousel');
            setBanners(carouselBanners);
        } catch (error) {
            console.error('Error loading banners:', error);
            setBanners([]);
        } finally {
            setLoading(false);
        }
    };

    const handleBannerClick = (banner) => {
        const { type, value } = banner.link;

        if (type === 'category') {
            navigate(`/products?category=${encodeURIComponent(value)}`);
        } else if (type === 'product') {
            navigate(`/product/${value}`);
        } else if (type === 'external') {
            window.open(value, '_blank', 'noopener,noreferrer');
        }
    };

    const goToPrevious = () => {
        setCurrentIndex((prev) => (prev - 1 + banners.length) % banners.length);
    };

    const goToNext = () => {
        setCurrentIndex((prev) => (prev + 1) % banners.length);
    };

    if (loading || banners.length === 0) {
        return null;
    }

    return (
        <div className="relative w-full bg-black mb-12 group">
            <div className="relative h-[300px] md:h-[500px] lg:h-[600px] w-full overflow-hidden">
                {banners.map((banner, index) => (
                    <div
                        key={banner.id}
                        className={`absolute inset-0 transition-opacity duration-700 ${index === currentIndex ? 'opacity-100' : 'opacity-0'
                            }`}
                    >
                        <img
                            src={banner.image}
                            alt={banner.title}
                            className="w-full h-full object-cover cursor-pointer"
                            onClick={() => handleBannerClick(banner)}
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent pointer-events-none" />
                        <div className="absolute bottom-8 left-8 text-white pointer-events-none">
                            <h2 className="text-3xl md:text-5xl font-display font-bold uppercase mb-2">
                                {banner.title}
                            </h2>
                        </div>
                    </div>
                ))}
            </div>

            {/* Navigation Arrows */}
            {banners.length > 1 && (
                <>
                    <button
                        onClick={goToPrevious}
                        className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-harley-orange text-white p-3 rounded-full transition-colors"
                        aria-label="Banner anterior"
                    >
                        <ChevronLeft className="w-6 h-6" />
                    </button>
                    <button
                        onClick={goToNext}
                        className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-harley-orange text-white p-3 rounded-full transition-colors"
                        aria-label="Próximo banner"
                    >
                        <ChevronRight className="w-6 h-6" />
                    </button>
                </>
            )}

            {/* Dot Indicators */}
            {banners.length > 1 && (
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                    {banners.map((_, index) => (
                        <button
                            key={index}
                            onClick={() => setCurrentIndex(index)}
                            className={`w-3 h-3 rounded-full transition-all ${index === currentIndex
                                ? 'bg-harley-orange w-8'
                                : 'bg-white/50 hover:bg-white/75'
                                }`}
                            aria-label={`Ir para banner ${index + 1}`}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};

export default BannerCarousel;
