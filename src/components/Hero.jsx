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
        <div className="relative h-[300px] md:h-[500px] lg:h-[600px] w-full mb-12 overflow-hidden cursor-pointer group"
            onClick={() => handleBannerClick(banner)}
        >
            {/* Background Image */}
            <img
                src={banner.image}
                alt={banner.title}
                className="w-full h-full object-cover"
            />

            {/* Overlay */}
            <div className="absolute inset-0 bg-gradient-to-r from-black via-black/70 to-transparent"></div>

            {/* Content */}
            <div className="absolute inset-0 flex items-center">
                <div className="container mx-auto px-4">
                    <div className="max-w-2xl">
                        <h1 className="text-4xl md:text-6xl lg:text-7xl font-display font-bold text-white mb-4 leading-tight">
                            {banner.title}
                        </h1>
                        <div className="mt-6 inline-block bg-harley-orange text-white px-6 py-3 rounded font-bold group-hover:bg-orange-700 transition-colors">
                            Ver Mais
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Hero;
