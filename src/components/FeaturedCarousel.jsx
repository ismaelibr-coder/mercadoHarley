import React, { useState, useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight, ShoppingBag, ArrowRight, Volume2, VolumeX } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { API_URL } from '../config/api.js';
import { getBannerByPlacement } from '../services/bannerService.js';
import { getVideoSettings } from '../services/videoSettingsService.js';
import { formatCurrency } from '../utils/currency.js';

// Used only if the /api/video-settings fetch fails outright (offline API,
// etc.) — the DB row itself always exists once the backend has started at
// least once (videoSettingsService seeds it with these same defaults via
// findOrCreate), so this is a last-resort fallback, not the normal path.
const FALLBACK_VIDEO_SRC = '/videos/hero-placeholder.mp4';
const FALLBACK_VIDEO_POSTER = '/videos/hero-placeholder-poster.jpg';

// A 'hero' banner (institutional photo — moto/oficina/estrada — configured by an
// admin) takes over this whole slot when active; with none configured, this
// falls back to the product carousel below exactly as before. The banner's
// title/link stay admin-editable via Banners exactly as before — the video
// background is separately admin-editable via /admin/video (see
// videoSettingsService.js), since a Hero video isn't tied to any one banner.
// If the video fails to load, it falls back to the banner's own image
// (pre-video-era field, still stored on every banner), so there's still
// never a blank background.
const HeroBanner = ({ banner, videoSrc, videoPoster }) => {
    const navigate = useNavigate();
    const videoRef = useRef(null);
    const [muted, setMuted] = useState(true);
    const [videoFailed, setVideoFailed] = useState(false);

    const handleClick = () => {
        const { type, value } = banner.link || {};
        if (type === 'category') navigate(`/category/${value}`);
        else if (type === 'product') navigate(`/product/${value}`);
        else if (type === 'external' && value) window.open(value, '_blank', 'noopener,noreferrer');
    };

    const toggleSound = (e) => {
        e.stopPropagation(); // don't trigger the banner's own click-through
        const video = videoRef.current;
        if (!video) return;
        video.muted = !video.muted;
        setMuted(video.muted);
    };

    return (
        <div
            className="relative w-full h-[500px] md:h-[600px] bg-black overflow-hidden cursor-pointer group"
            onClick={handleClick}
        >
            {videoFailed ? (
                <img
                    src={banner.image}
                    alt={banner.title}
                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
            ) : (
                <video
                    ref={videoRef}
                    src={videoSrc}
                    poster={videoPoster}
                    autoPlay
                    loop
                    muted
                    playsInline
                    onError={() => setVideoFailed(true)}
                    className="absolute inset-0 w-full h-full object-cover"
                >
                    Seu navegador não suporta vídeo em HTML5.
                </video>
            )}
            <div className="absolute inset-0 bg-gradient-to-r from-black via-black/60 to-transparent"></div>

            <div className="container mx-auto px-4 h-full flex items-center relative z-10">
                <div className="max-w-xl space-y-6">
                    <div className="inline-block bg-sick-red px-3 py-1 text-xs font-bold uppercase tracking-widest text-white animate-fade-in-up">
                        Destaque SICK GRIP
                    </div>
                    <h1 className="text-4xl md:text-6xl font-display font-bold text-white leading-tight uppercase text-balance animate-fade-in-up [animation-delay:120ms]">
                        {banner.title}
                    </h1>
                    {/* Sliding-fill hover: a red layer clipped by overflow-hidden slides in
                        from the left instead of the whole button flatly swapping color. */}
                    <span className="relative inline-flex items-center gap-2 overflow-hidden bg-white text-black px-8 py-4 font-bold uppercase tracking-wide animate-fade-in-up [animation-delay:240ms]">
                        <span className="absolute inset-0 bg-sick-red -translate-x-full group-hover:translate-x-0 transition-transform duration-300 ease-out" aria-hidden="true"></span>
                        <span className="relative group-hover:text-white transition-colors duration-300">Ver Mais</span>
                        <ArrowRight className="relative w-5 h-5 group-hover:text-white group-hover:translate-x-1 transition-all duration-300" />
                    </span>
                </div>
            </div>

            {/* Separate from "Ver Mais" on purpose — muting/unmuting shouldn't
                trigger the banner's own click-through navigation. */}
            {!videoFailed && (
                <button
                    type="button"
                    onClick={toggleSound}
                    aria-label={muted ? 'Ativar som do vídeo' : 'Silenciar vídeo'}
                    aria-pressed={!muted}
                    className="absolute bottom-4 right-4 md:bottom-6 md:right-6 z-10 p-2.5 rounded-full bg-black/50 border border-white/20 text-white hover:bg-black/70 hover:border-sick-red transition-colors backdrop-blur-sm"
                >
                    {muted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                </button>
            )}
        </div>
    );
};

const FeaturedCarousel = () => {
    const [heroBanner, setHeroBanner] = useState(null);
    const [heroLoading, setHeroLoading] = useState(true);
    const [videoSettings, setVideoSettings] = useState(null);
    const [products, setProducts] = useState([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        getBannerByPlacement('hero')
            .then(setHeroBanner)
            .finally(() => setHeroLoading(false));
    }, []);

    useEffect(() => {
        getVideoSettings().then(setVideoSettings);
    }, []);

    useEffect(() => {
        // Always resolves to a real array — a non-2xx response (rate limit, 5xx,
        // etc.) used to fall through as a truthy non-array object (e.g. the error
        // body {error: "..."}), which every check downstream (`.length === 0`,
        // `products[currentIndex]`) silently mis-handled instead of catching, and
        // the carousel rendered with a broken/undefined product.
        const extractProducts = (body) => {
            const list = Array.isArray(body) ? body : body?.products;
            return Array.isArray(list) ? list : [];
        };

        const fetchFeaturedProducts = async () => {
            try {
                // Fetch featured products from API
                const response = await fetch(`${API_URL}/api/products?featured=true&limit=5`);
                let productsData = response.ok ? extractProducts(await response.json()) : [];

                // If no featured products, fetch regular products as fallback
                if (productsData.length === 0) {
                    const fallbackResponse = await fetch(`${API_URL}/api/products?limit=5`);
                    productsData = fallbackResponse.ok ? extractProducts(await fallbackResponse.json()) : [];
                }

                setProducts(productsData);
            } catch (error) {
                console.error("Error fetching featured products:", error);
                setProducts([]); // Set empty array on error instead of throwing
            } finally {
                setLoading(false);
            }
        };

        fetchFeaturedProducts();
    }, []);

    useEffect(() => {
        if (products.length === 0) return;
        const interval = setInterval(() => {
            setCurrentIndex((prev) => (prev + 1) % products.length);
        }, 6000);
        return () => clearInterval(interval);
    }, [products.length]);

    const nextSlide = () => {
        setCurrentIndex((prev) => (prev + 1) % products.length);
    };

    const prevSlide = () => {
        setCurrentIndex((prev) => (prev - 1 + products.length) % products.length);
    };

    if (heroLoading || loading) return null;

    if (heroBanner) {
        return (
            <HeroBanner
                banner={heroBanner}
                videoSrc={videoSettings?.videoUrl || FALLBACK_VIDEO_SRC}
                videoPoster={videoSettings?.posterUrl || FALLBACK_VIDEO_POSTER}
            />
        );
    }

    if (products.length === 0) return null;

    const currentProduct = products[currentIndex];

    // Was manually swapping the decimal point for a comma without ever adding
    // the thousand separator ("1299,00" instead of "1.299,00") — formatCurrency
    // handles both correctly.
    const formattedPrice = formatCurrency(currentProduct.price || 0);

    return (
        <div className="relative w-full h-[500px] md:h-[600px] bg-black overflow-hidden group">

            {/* Background Blur Effect */}
            <div
                className="absolute inset-0 bg-cover bg-center opacity-30 blur-xl scale-110 transition-all duration-700"
                style={{ backgroundImage: `url(${currentProduct.image})` }}
            ></div>

            {/* Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-r from-black via-black/80 to-transparent"></div>

            <div className="container mx-auto px-4 h-full flex items-center relative z-10">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center w-full">

                    {/* Text Content */}
                    <div className="space-y-6" key={currentProduct.id}>
                        <div className="inline-block bg-sick-red px-3 py-1 text-xs font-bold uppercase tracking-widest text-white mb-2 animate-fade-in-up">
                            Destaque SICK GRIP
                        </div>
                        <h1 className="text-4xl md:text-6xl font-display font-bold text-white leading-tight uppercase animate-fade-in-up [animation-delay:120ms]">
                            {currentProduct.name}
                        </h1>
                        <p className="text-gray-300 text-lg md:text-xl max-w-lg line-clamp-3 animate-fade-in-up [animation-delay:200ms]">
                            {currentProduct.description}
                        </p>
                        <div className="flex items-center gap-6 animate-fade-in-up [animation-delay:280ms]">
                            <span className="text-3xl font-bold text-white">
                                {formattedPrice}
                            </span>
                            <Link
                                to={`/product/${currentProduct.id}`}
                                className="group/btn relative inline-flex items-center gap-2 overflow-hidden bg-white text-black px-8 py-4 font-bold uppercase tracking-wide"
                            >
                                <span className="absolute inset-0 bg-sick-red -translate-x-full group-hover/btn:translate-x-0 transition-transform duration-300 ease-out" aria-hidden="true"></span>
                                <ShoppingBag className="relative w-5 h-5 group-hover/btn:text-white transition-colors duration-300" />
                                <span className="relative group-hover/btn:text-white transition-colors duration-300">Comprar Agora</span>
                            </Link>
                        </div>
                    </div>

                    {/* Product Image */}
                    <div className="hidden md:flex justify-center items-center relative">
                        <div className="relative w-[400px] h-[400px] lg:w-[500px] lg:h-[500px]">
                            {/* Circle Graphic Behind */}
                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90%] h-[90%] border-2 border-dashed border-gray-700 rounded-full animate-spin-slow"></div>

                            <img
                                src={currentProduct.image}
                                alt={currentProduct.name}
                                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full object-contain drop-shadow-2xl transition-transform duration-700 hover:scale-110"
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Controls */}
            <button
                onClick={prevSlide}
                className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/50 p-3 text-white hover:bg-sick-red transition-colors rounded-full"
            >
                <ChevronLeft className="w-8 h-8" />
            </button>
            <button
                onClick={nextSlide}
                className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/50 p-3 text-white hover:bg-sick-red transition-colors rounded-full"
            >
                <ChevronRight className="w-8 h-8" />
            </button>

            {/* Indicators */}
            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-3">
                {products.map((_, idx) => (
                    <button
                        key={idx}
                        onClick={() => setCurrentIndex(idx)}
                        className={`w-3 h-3 rounded-full transition-all duration-300 ${idx === currentIndex ? 'bg-sick-red w-8' : 'bg-gray-600 hover:bg-gray-400'
                            }`}
                    />
                ))}
            </div>
        </div>
    );
};

export default FeaturedCarousel;
