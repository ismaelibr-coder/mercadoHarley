import { Banner } from '../models/index.js';

/**
 * Get all banners ordered by priority
 * @returns {Promise<Array>} - Array of banners
 */
export const getAllBanners = async () => {
    try {
        const banners = await Banner.findAll({
            order: [['displayOrder', 'ASC']]
        });
        return banners;
    } catch (error) {
        console.error('Error getting all banners:', error);
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
        return banners;
    } catch (error) {
        console.error('Error getting active banners:', error);
        throw error;
    }
};

/**
 * Get active banners filtered by display type
 * @param {string} displayType - 'carousel' or 'hero'
 * @returns {Promise<Array>} - Array of active banners of specified type
 */
export const getActiveBannersByType = async (displayType) => {
    try {
        const banners = await Banner.findAll({
            where: {
                active: true,
                displayType: displayType
            },
            order: [['displayOrder', 'ASC']]
        });
        return banners;
    } catch (error) {
        console.error('Error getting active banners by type:', error);
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

        return banner;
    } catch (error) {
        console.error('Error getting banner:', error);
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
        const banner = await Banner.create({
            title: data.title,
            imageUrl: data.image,
            linkType: data.link.type,
            linkValue: data.link.value,
            displayType: data.displayType || 'carousel',
            displayOrder: data.order || 0,
            active: data.active !== undefined ? data.active : true
        });

        return banner;
    } catch (error) {
        console.error('Error creating banner:', error);
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
        if (data.image !== undefined) updateData.imageUrl = data.image;
        if (data.link !== undefined) {
            updateData.linkType = data.link.type;
            updateData.linkValue = data.link.value;
        }
        if (data.displayType !== undefined) updateData.displayType = data.displayType;
        if (data.order !== undefined) updateData.displayOrder = data.order;
        if (data.active !== undefined) updateData.active = data.active;

        await banner.update(updateData);
        return banner;
    } catch (error) {
        console.error('Error updating banner:', error);
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
        console.error('Error deleting banner:', error);
        throw error;
    }
};
