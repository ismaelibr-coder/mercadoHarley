import React from 'react';
import { Helmet } from 'react-helmet-async';

const SEO = ({
    title = 'Mercado Harley - Peças e Acessórios para Harley-Davidson',
    description = 'Encontre as melhores peças, acessórios e equipamentos para sua Harley-Davidson. Entrega para todo Brasil com qualidade garantida.',
    image = '/og-image.jpg',
    url = window.location.href,
    type = 'website'
}) => {
    const siteTitle = 'Mercado Harley';
    const fullTitle = title.includes(siteTitle) ? title : `${title} | ${siteTitle}`;

    return (
        <Helmet>
            {/* Primary Meta Tags */}
            <title>{fullTitle}</title>
            <meta name="title" content={fullTitle} />
            <meta name="description" content={description} />

            {/* Open Graph / Facebook */}
            <meta property="og:type" content={type} />
            <meta property="og:url" content={url} />
            <meta property="og:title" content={fullTitle} />
            <meta property="og:description" content={description} />
            <meta property="og:image" content={image} />
            <meta property="og:site_name" content={siteTitle} />

            {/* Twitter */}
            <meta property="twitter:card" content="summary_large_image" />
            <meta property="twitter:url" content={url} />
            <meta property="twitter:title" content={fullTitle} />
            <meta property="twitter:description" content={description} />
            <meta property="twitter:image" content={image} />

            {/* Additional Meta Tags */}
            <meta name="robots" content="index, follow" />
            <meta name="language" content="Portuguese" />
            <meta name="author" content="Mercado Harley" />
            <link rel="canonical" href={url} />
        </Helmet>
    );
};

export default SEO;
