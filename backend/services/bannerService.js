import crypto from 'crypto';
import { Banner } from '../models/index.js';
import logger from '../utils/logger.js';

// Real MySQL (production) auto-parses DataTypes.JSON columns on read. MariaDB
// (this project's local dev, via XAMPP) stores JSON as CHECK-constrained
// LONGTEXT, and Sequelize's mysql2 dialect doesn't always recognize that as
// JSON to auto-parse — `link` can come back as a raw string locally even
// though the exact same code gets a real object in production. Normalizing
// here means every consumer (routes, frontend) can always trust `banner.link`
// is a real object, in both environments.
const normalizeBanner = (banner) => {
    if (!banner) return banner;
    const plain = banner.toJSON ? banner.toJSON() : banner;
    if (typeof plain.link === 'string') {
        try {
            plain.link = JSON.parse(plain.link);
        } catch {
            plain.link = null;
        }
    }
    return plain;
};

/**
 * Get all banners ordered by priority
 * @returns {Promise<Array>} - Array of banners
 */
export const getAllBanners = async () => {
    try {
        const banners = await Banner.findAll({
            order: [['displayOrder', 'ASC']]
        });
        return banners.map(normalizeBanner);
    } catch (error) {
        logger.error('Error getting all banners:', error);
        throw error;
    }
};

/**
 * Get only active banners for public display
 * @returns {Promise<Array>} - Array of active banners
 */
export const getActiveBanners = async () => {
    try {
        const banners = await Banner.findAll({
            where: { active: true },
            order: [['displayOrder', 'ASC']]
        });
        return banners.map(normalizeBanner);
    } catch (error) {
        logger.error('Error getting active banners:', error);
        throw error;
    }
};

/**
 * Get the active banner for a given placement ('hero', 'category-pecas', etc. —
 * see models/Banner.js). Only one banner is expected to be active per placement
 * at a time; if an admin activates a second one for the same slot, the most
 * recently ordered wins rather than the page showing two banners fighting for
 * the same spot.
 * @param {string} placement
 * @returns {Promise<Object|null>}
 */
export const getActiveBannerByPlacement = async (placement) => {
    try {
        const banner = await Banner.findOne({
            where: { active: true, placement },
            order: [['displayOrder', 'ASC'], ['updatedAt', 'DESC']]
        });
        return normalizeBanner(banner);
    } catch (error) {
        logger.error('Error getting active banner by placement:', error);
        throw error;
    }
};

/**
 * Get single banner by ID
 * @param {string} id - Banner ID
 * @returns {Promise<Object>} - Banner data
 */
export const getBannerById = async (id) => {
    try {
        const banner = await Banner.findByPk(id);
        
        if (!banner) {
            throw new Error('Banner not found');
        }

        return normalizeBanner(banner);
    } catch (error) {
        logger.error('Error getting banner:', error);
        throw error;
    }
};

/**
 * Create new banner
 * @param {Object} data - Banner data
 * @returns {Promise<Object>} - Created banner with ID
 */
export const createBanner = async (data) => {
    try {
        // Every field name here now matches a real column on the Banner model
        // (see models/Banner.js) — this previously wrote imageUrl/linkType/
        // linkValue/displayType, none of which exist on the model, so Sequelize
        // silently dropped them and only title/active/displayOrder ever
        // persisted. Worse: no id was ever generated, so every createBanner call
        // failed outright with a NOT NULL constraint error on `id`.
        const banner = await Banner.create({
            id: crypto.randomUUID(),
            title: data.title,
            image: data.image,
            link: data.link,
            placement: data.placement,
            displayOrder: data.order || 0,
            active: data.active !== undefined ? data.active : true
        });

        return banner;
    } catch (error) {
        logger.error('Error creating banner:', error);
        throw error;
    }
};

/**
 * Update existing banner
 * @param {string} id - Banner ID
 * @param {Object} data - Updated banner data
 * @returns {Promise<Object>} - Updated banner
 */
export const updateBanner = async (id, data) => {
    try {
        const banner = await Banner.findByPk(id);

        if (!banner) {
            throw new Error('Banner not found');
        }

        const updateData = {};
        if (data.title !== undefined) updateData.title = data.title;
        if (data.image !== undefined) updateData.image = data.image;
        if (data.link !== undefined) updateData.link = data.link;
        if (data.placement !== undefined) updateData.placement = data.placement;
        if (data.order !== undefined) updateData.displayOrder = data.order;
        if (data.active !== undefined) updateData.active = data.active;

        await banner.update(updateData);
        return banner;
    } catch (error) {
        logger.error('Error updating banner:', error);
        throw error;
    }
};

/**
 * Delete banner
 * @param {string} id - Banner ID
 * @returns {Promise<void>}
 */
export const deleteBanner = async (id) => {
    try {
        const banner = await Banner.findByPk(id);

        if (!banner) {
            throw new Error('Banner not found');
        }

        await banner.destroy();
    } catch (error) {
        logger.error('Error deleting banner:', error);
        throw error;
    }
};
