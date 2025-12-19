import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, ShoppingBag } from 'lucide-react';
import { collection, query, where, getDocs, limit } from 'firebase/firestore';
import { db } from '../services/firebase';
import { Link } from 'react-router-dom';

const FeaturedCarousel = () => {
    const [products, setProducts] = useState([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchFeaturedProducts = async () => {
            try {
                const q = query(
                    collection(db, 'products'),
                    where('featuredCarousel', '==', true),
                    limit(5)
                );
                const querySnapshot = await getDocs(q);
                const productsData = querySnapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));
                // Se não houver produtos em destaque, carrega produtos normais como fallback
                if (productsData.length === 0) {
                    const fallbackQ = query(
                        collection(db, 'products'),
                        limit(5)
                    );
                    const fallbackSnapshot = await getDocs(fallbackQ);
                    const fallbackData = fallbackSnapshot.docs.map(doc => ({
                        id: doc.id,
                        ...doc.data()
                    }));
                    setProducts(fallbackData);
                } else {
                    setProducts(productsData);
                }
            } catch (error) {
                console.error("Error fetching featured products:", error);
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

    if (loading || products.length === 0) return null;

    const currentProduct = products[currentIndex];

    // Safe access for price
    const formattedPrice = currentProduct.price
        ? `R$ ${Number(currentProduct.price).toFixed(2).replace('.', ',')}`
        : 'R$ 0,00';

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
                    <div className="space-y-6 transform transition-all duration-500 translate-x-0 opacity-100">
                        <div className="inline-block bg-sick-red px-3 py-1 text-xs font-bold uppercase tracking-widest text-white mb-2">
                            Destaque SICK GRIP
                        </div>
                        <h1 className="text-4xl md:text-6xl font-display font-bold text-white leading-tight uppercase">
                            {currentProduct.name}
                        </h1>
                        <p className="text-gray-300 text-lg md:text-xl max-w-lg line-clamp-3">
                            {currentProduct.description}
                        </p>
                        <div className="flex items-center gap-6">
                            <span className="text-3xl font-bold text-white">
                                {formattedPrice}
                            </span>
                            <Link
                                to={`/product/${currentProduct.id}`}
                                className="bg-white text-black px-8 py-4 font-bold uppercase tracking-wide hover:bg-sick-red hover:text-white transition-colors flex items-center gap-2"
                            >
                                <ShoppingBag className="w-5 h-5" />
                                Comprar Agora
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
                                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full object-cover drop-shadow-2xl transition-transform duration-700 hover:scale-110"
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
