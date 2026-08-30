import { VideoSettings } from '../models/index.js';
import logger from '../utils/logger.js';

const SINGLETON_ID = 'main';

// Same placeholder paths FeaturedCarousel.jsx had hardcoded before this
// table existed — used as the default row on first read, so the Hero never
// shows a blank video before an admin configures one via /admin/video.
const DEFAULT_SETTINGS = {
    videoUrl: '/videos/hero-placeholder.mp4',
    posterUrl: '/videos/hero-placeholder-poster.jpg',
    title: 'Nossas peças rodando de verdade'
};

export const getVideoSettings = async () => {
    try {
        const [settings] = await VideoSettings.findOrCreate({
            where: { id: SINGLETON_ID },
            defaults: { id: SINGLETON_ID, ...DEFAULT_SETTINGS }
        });
        return settings;
    } catch (error) {
        logger.error('Error getting video settings:', error);
        throw error;
    }
};

export const updateVideoSettings = async (data) => {
    try {
        const settings = await getVideoSettings();

        const updateData = {};
        if (data.videoUrl !== undefined) updateData.videoUrl = data.videoUrl;
        if (data.posterUrl !== undefined) updateData.posterUrl = data.posterUrl;
        if (data.title !== undefined) updateData.title = data.title;

        await settings.update(updateData);
        return settings;
    } catch (error) {
        logger.error('Error updating video settings:', error);
        throw error;
    }
};
