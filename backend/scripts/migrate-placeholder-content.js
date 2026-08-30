import dotenv from 'dotenv';
import logger from '../utils/logger.js';
dotenv.config();

import crypto from 'crypto';
import { sequelize, CustomerGalleryItem, Testimonial } from '../models/index.js';

// One-time migration: moves the placeholder data that used to be hardcoded
// arrays in src/components/CustomerShowcase.jsx and src/components/Testimonials.jsx
// into the new admin-managed tables, so those sections aren't empty right
// after the admin CRUD ships. Idempotent — skips a table that already has rows,
// so re-running this after an admin has started editing content won't
// duplicate or clobber anything.

const GALLERY_PHOTOS = [
    'https://images.unsplash.com/photo-1617719445910-effa370eea18?q=80&w=700&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1620057890888-cb72910b7819?q=80&w=700&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1620057844855-0c91164a7b0b?q=80&w=700&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1563525392903-b6db9ae934dc?q=80&w=700&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1617719447444-ba61e456995b?q=80&w=700&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1601984736960-a4a05e5ce7c1?q=80&w=700&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1599135244885-be2ff2659d5c?q=80&w=700&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1597775542529-5c941bfdcdf2?q=80&w=700&auto=format&fit=crop'
];

const TESTIMONIALS = [
    { name: 'Rafael M.', city: 'Porto Alegre, RS', quote: 'Pneu chegou rápido e ficou perfeito na moto. Atendimento resolveu minha dúvida sobre medida antes mesmo de eu comprar.', rating: 5 },
    { name: 'Fernanda S.', city: 'Canoas, RS', quote: 'Comprei acessórios pra minha Sportster e a qualidade surpreendeu. Embalagem cuidadosa e chegou no prazo.', rating: 5 },
    { name: 'Diego A.', city: 'Caxias do Sul, RS', quote: 'Já é a segunda vez que compro peça customizada com eles. Acabamento sempre impecável.', rating: 4 }
];

async function migrate() {
    try {
        await sequelize.authenticate();
        logger.info('✅ Conectado ao banco');

        const existingGalleryCount = await CustomerGalleryItem.count();
        if (existingGalleryCount > 0) {
            logger.info(`⏭️  Galeria de clientes já tem ${existingGalleryCount} item(ns) — pulando migração da galeria.`);
        } else {
            for (let i = 0; i < GALLERY_PHOTOS.length; i++) {
                await CustomerGalleryItem.create({
                    id: crypto.randomUUID(),
                    image: GALLERY_PHOTOS[i],
                    caption: null,
                    displayOrder: i
                });
            }
            logger.info(`✅ ${GALLERY_PHOTOS.length} fotos migradas para a Galeria de Clientes.`);
        }

        const existingTestimonialCount = await Testimonial.count();
        if (existingTestimonialCount > 0) {
            logger.info(`⏭️  Depoimentos já tem ${existingTestimonialCount} item(ns) — pulando migração de depoimentos.`);
        } else {
            for (let i = 0; i < TESTIMONIALS.length; i++) {
                const t = TESTIMONIALS[i];
                await Testimonial.create({
                    id: crypto.randomUUID(),
                    name: t.name,
                    city: t.city,
                    quote: t.quote,
                    rating: t.rating,
                    photo: null,
                    displayOrder: i
                });
            }
            logger.info(`✅ ${TESTIMONIALS.length} depoimentos migrados.`);
        }
    } catch (err) {
        logger.error('❌ Erro na migração:', err);
        process.exit(1);
    } finally {
        try {
            await sequelize.close();
        } catch (e) {
            // ignore
        }
        process.exit(0);
    }
}

migrate();
