import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import logger from '../utils/logger.js';

dotenv.config();

const __dirname = dirname(fileURLToPath(import.meta.url));

// Initialize Sequelize
export const sequelize = new Sequelize(
    process.env.DB_NAME || 'mercado_harley',
    process.env.DB_USER || 'root',
    process.env.DB_PASSWORD || '',
    {
        host: process.env.DB_HOST || 'localhost',
        port: process.env.DB_PORT || 3306,
        dialect: 'mysql',
        // Sequelize already gates this to development via the ternary; use logger.info
        // (not .debug) so SQL query logs stay visible by default like they did before,
        // rather than getting silently hidden behind LOG_LEVEL=debug.
        logging: process.env.NODE_ENV === 'development' ? logger.info : false,
        dialectOptions: {
            charset: 'utf8mb4'
        },
        pool: {
            max: 10,
            min: 2,
            acquire: 30000,
            idle: 10000
        }
    }
);

/**
 * Test database connection
 */
export const testDatabaseConnection = async () => {
    try {
        await sequelize.authenticate();
        logger.info('✅ Database connection successful');
        return true;
    } catch (error) {
        logger.error('❌ Database connection failed:', error.message);
        throw error;
    }
};

/**
 * Sync all models with database
 */
export const syncDatabase = async ({ force = false, alter = false } = {}) => {
    try {
        await sequelize.sync({ force, alter });
        logger.info('✅ Database synchronized');
        return true;
    } catch (error) {
        logger.error('❌ Database sync failed:', error.message);
        throw error;
    }
};

/**
 * Close database connection
 */
export const closeDatabase = async () => {
    await sequelize.close();
    logger.info('✅ Database connection closed');
};

export default sequelize;
