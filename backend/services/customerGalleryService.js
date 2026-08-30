import crypto from 'crypto';
import { CustomerGalleryItem } from '../models/index.js';
import logger from '../utils/logger.js';

export const getAllGalleryItems = async () => {
    try {
        const items = await CustomerGalleryItem.findAll({
            order: [['displayOrder', 'ASC'], ['createdAt', 'ASC']]
        });
        return items;
    } catch (error) {
        logger.error('Error getting all gallery items:', error);
        throw error;
    }
};

export const getGalleryItemById = async (id) => {
    try {
        const item = await CustomerGalleryItem.findByPk(id);
        if (!item) {
            throw new Error('Gallery item not found');
        }
        return item;
    } catch (error) {
        logger.error('Error getting gallery item:', error);
        throw error;
    }
};

export const createGalleryItem = async (data) => {
    try {
        const item = await CustomerGalleryItem.create({
            id: crypto.randomUUID(),
            image: data.image,
            caption: data.caption || null,
            displayOrder: data.displayOrder || 0
        });
        return item;
    } catch (error) {
        logger.error('Error creating gallery item:', error);
        throw error;
    }
};

export const updateGalleryItem = async (id, data) => {
    try {
        const item = await CustomerGalleryItem.findByPk(id);
        if (!item) {
            throw new Error('Gallery item not found');
        }

        const updateData = {};
        if (data.image !== undefined) updateData.image = data.image;
        if (data.caption !== undefined) updateData.caption = data.caption || null;
        if (data.displayOrder !== undefined) updateData.displayOrder = data.displayOrder;

        await item.update(updateData);
        return item;
    } catch (error) {
        logger.error('Error updating gallery item:', error);
        throw error;
    }
};

export const deleteGalleryItem = async (id) => {
    try {
        const item = await CustomerGalleryItem.findByPk(id);
        if (!item) {
            throw new Error('Gallery item not found');
        }
        await item.destroy();
    } catch (error) {
        logger.error('Error deleting gallery item:', error);
        throw error;
    }
};
