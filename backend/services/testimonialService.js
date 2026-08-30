import crypto from 'crypto';
import { Testimonial } from '../models/index.js';
import logger from '../utils/logger.js';

export const getAllTestimonials = async () => {
    try {
        const items = await Testimonial.findAll({
            order: [['displayOrder', 'ASC'], ['createdAt', 'ASC']]
        });
        return items;
    } catch (error) {
        logger.error('Error getting all testimonials:', error);
        throw error;
    }
};

export const getTestimonialById = async (id) => {
    try {
        const item = await Testimonial.findByPk(id);
        if (!item) {
            throw new Error('Testimonial not found');
        }
        return item;
    } catch (error) {
        logger.error('Error getting testimonial:', error);
        throw error;
    }
};

export const createTestimonial = async (data) => {
    try {
        const item = await Testimonial.create({
            id: crypto.randomUUID(),
            name: data.name,
            city: data.city || null,
            quote: data.quote,
            rating: data.rating || 5,
            photo: data.photo || null,
            displayOrder: data.displayOrder || 0
        });
        return item;
    } catch (error) {
        logger.error('Error creating testimonial:', error);
        throw error;
    }
};

export const updateTestimonial = async (id, data) => {
    try {
        const item = await Testimonial.findByPk(id);
        if (!item) {
            throw new Error('Testimonial not found');
        }

        const updateData = {};
        if (data.name !== undefined) updateData.name = data.name;
        if (data.city !== undefined) updateData.city = data.city || null;
        if (data.quote !== undefined) updateData.quote = data.quote;
        if (data.rating !== undefined) updateData.rating = data.rating;
        if (data.photo !== undefined) updateData.photo = data.photo || null;
        if (data.displayOrder !== undefined) updateData.displayOrder = data.displayOrder;

        await item.update(updateData);
        return item;
    } catch (error) {
        logger.error('Error updating testimonial:', error);
        throw error;
    }
};

export const deleteTestimonial = async (id) => {
    try {
        const item = await Testimonial.findByPk(id);
        if (!item) {
            throw new Error('Testimonial not found');
        }
        await item.destroy();
    } catch (error) {
        logger.error('Error deleting testimonial:', error);
        throw error;
    }
};
