import { DataTypes } from 'sequelize';
import { sequelize } from '../config/database.js';

// Singleton table (always exactly one row, id: 'main') for the Hero's
// background video — see services/videoSettingsService.js for the
// get-or-create-default logic. A real table instead of the in-memory
// settingsStore.js pattern on purpose: settingsStore resets to defaults on
// every server restart, which is fine for filter dropdown options but not
// for admin-uploaded media that needs to survive a deploy/restart.
export const VideoSettings = sequelize.define('VideoSettings', {
    id: {
        type: DataTypes.STRING(50),
        primaryKey: true
    },
    videoUrl: {
        type: DataTypes.STRING(500)
    },
    posterUrl: {
        type: DataTypes.STRING(500)
    },
    title: {
        type: DataTypes.STRING(255)
    },
    updatedAt: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
    }
}, {
    tableName: 'video_settings',
    timestamps: true,
    createdAt: false
});

export default VideoSettings;
