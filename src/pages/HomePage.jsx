import React from 'react';
import FeaturedCarousel from '../components/FeaturedCarousel';
import ProductList from '../components/ProductList';
import PartnersBanner from '../components/PartnersBanner';
import CategoryGrid from '../components/CategoryGrid';

const HomePage = () => {
    return (
        <>
            <FeaturedCarousel />

            <div className="container mx-auto px-4 py-12">
                <h2 className="text-3xl font-display font-bold mb-8 text-white uppercase border-l-4 border-sick-red pl-4">
                    Compre por Categoria
                </h2>
                <CategoryGrid />
            </div>

            <main className="container mx-auto px-4 py-12">
                <div className="mb-12">
                    <h2 className="text-3xl font-display font-bold mb-8 text-white uppercase border-l-4 border-sick-red pl-4">
                        Destaques da Loja
                    </h2>
                    <ProductList />


                </div>
            </main>

            <PartnersBanner />
        </>
    );
};

export default HomePage;
