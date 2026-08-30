import React from 'react';
import FeaturedCarousel from '../components/FeaturedCarousel';
import ProductList from '../components/ProductList';
import PartnersBanner from '../components/PartnersBanner';
import CategoryGrid from '../components/CategoryGrid';
import CustomerShowcase from '../components/CustomerShowcase';
import Testimonials from '../components/Testimonials';
import SectionDivider from '../components/ui/SectionDivider';

const HomePage = () => {
    return (
        <>
            <FeaturedCarousel />

            <SectionDivider />

            {/* CategoryGrid, ProductList, CustomerShowcase and Testimonials each own
                their full section (heading included) and render null when there's
                nothing to show — so an empty state here never leaves a heading (or
                a divider) floating over nothing. CustomerShowcase/Testimonials stay
                hidden until real customer content exists — see their own files. */}
            <CategoryGrid />

            <main>
                <ProductList />
            </main>

            <CustomerShowcase />

            <Testimonials />

            <SectionDivider />

            <PartnersBanner />
        </>
    );
};

export default HomePage;
