import { DataTypes } from 'sequelize';
import { sequelize } from '../config/database.js';

export const Banner = sequelize.define('Banner', {
    id: {
        type: DataTypes.STRING(255),
        primaryKey: true
    },
    title: {
        type: DataTypes.STRING(255),
        allowNull: false
    },
    subtitle: {
        type: DataTypes.STRING(500)
    },
    image: {
        type: DataTypes.STRING(500)
    },
    // JSON, not STRING — this holds { type: 'category'|'product'|'external', value }
    // (see BannerForm.jsx/bannerService.js). It was STRING(500) before, which can't
    // round-trip an object through Sequelize without manual JSON.stringify/parse
    // that nothing in this codebase was actually doing.
    link: {
        type: DataTypes.JSON
    },
    // Where this banner is meant to be shown: 'hero', or 'category-<pecas|
    // acessorios|vestuario|eletrica>' (see src/config/categories.js for the
    // category keys). Replaces the old `displayType` that the admin form/service
    // referenced but this model never actually had a column for.
    placement: {
        type: DataTypes.STRING(50)
    },
    active: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
    },
    displayOrder: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    },
    createdAt: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
    },
    updatedAt: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
    }
}, {
    tableName: 'banners',
    timestamps: true,
    indexes: [
        { fields: ['active'] },
        { fields: ['displayOrder'] }
    ]
});

export default Banner;
