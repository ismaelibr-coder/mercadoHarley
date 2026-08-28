import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getActiveBanners } from '../services/bannerService';

const Hero = () => {
    const [heroBanners, setHeroBanners] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        loadHeroBanners();
    }, []);

    const loadHeroBanners = async () => {
        try {
            const data = await getActiveBanners();
            // Filter only hero-type banners
            const heroTypeBanners = (data || []).filter(banner => banner.displayType === 'hero');
            setHeroBanners(heroTypeBanners);
        } catch (error) {
            console.error('Error loading hero banners:', error);
            setHeroBanners([]);
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

    // Don't render if no hero banners
    if (loading || heroBanners.length === 0) {
        return null;
    }

    // Display the first hero banner (highest priority)
    const banner = heroBanners[0];

    return (
        <div className="w-full mb-12 cursor-pointer group flex flex-col sm:flex-row bg-black overflow-hidden"
            onClick={() => handleBannerClick(banner)}
        >
            {/* Image — contained on white, the whole product photo is always visible
                (never cropped). This banner shows a studio product photo, not a wide
                lifestyle shot, so it gets the same treatment as the rest of the catalog. */}
            <div className="order-1 sm:order-2 w-full sm:w-[45%] lg:w-[40%] h-[220px] sm:h-[420px] lg:h-[520px] flex-none bg-white p-6 sm:p-10 flex items-center justify-center">
                <img
                    src={banner.image}
                    alt={banner.title}
                    className="max-w-full max-h-full object-contain"
                />
            </div>

            {/* Content */}
            <div className="order-2 sm:order-1 flex-1 flex items-center py-10 sm:py-0">
                <div className="container mx-auto px-4">
                    <div className="max-w-2xl">
                        <p className="text-sick-red font-bold uppercase tracking-widest text-sm mb-3">Destaque Sick Grip</p>
                        <h1 className="text-3xl md:text-5xl lg:text-6xl font-display font-bold text-white mb-4 leading-tight text-balance">
                            {banner.title}
                        </h1>
                        <div className="mt-6 inline-block bg-harley-orange text-white px-6 py-3 rounded font-bold group-hover:bg-red-800 transition-colors">
                            Ver Mais
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Hero;
