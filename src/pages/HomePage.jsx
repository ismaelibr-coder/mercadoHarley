import React from 'react';
import BannerCarousel from '../components/BannerCarousel';
import Hero from '../components/Hero';
import ProductList from '../components/ProductList';
import SEO from '../components/SEO';

const HomePage = () => {
    return (
        <>
            <SEO
                title="Mercado Harley - Peças e Acessórios para Harley-Davidson"
                description="Encontre as melhores peças, acessórios e equipamentos para sua Harley-Davidson. Escapamentos, guidões, bancos e muito mais. Entrega para todo Brasil."
            />

            {/* Hero Section - displays hero-type banners */}
            <Hero />

            {/* Carousel Section - displays carousel-type banners */}
            <BannerCarousel />

            <ProductList />
        </>
    );
};

export default HomePage;
