import dotenv from 'dotenv';
import logger from '../utils/logger.js';
dotenv.config();

import bcrypt from 'bcrypt';
import crypto from 'crypto';
import { sequelize, User } from '../models/index.js';
import { sendTemporaryPassword } from '../services/emailService.js';

const args = process.argv.slice(2);
const emailsArg = process.env.FORCE_RESET_EMAILS || args.join(',');

if (!emailsArg) {
    logger.error('Usage: node scripts/force-reset-passwords-mysql.js email1@example.com email2@example.com');
    logger.error('Or set FORCE_RESET_EMAILS="a@b.com,c@d.com" in env');
    process.exit(1);
}

const emails = emailsArg.split(',').map(e => e.trim().toLowerCase()).filter(Boolean);

async function run() {
    try {
        await sequelize.authenticate();
        logger.info('✅ Connected to DB');

        for (const email of emails) {
            try {
                logger.info(`\nProcessing: ${email}`);
                const user = await User.findOne({ where: { email } });
                if (!user) {
                    logger.warn(`⚠️  User not found: ${email}`);
                    continue;
                }

                // Generate a temporary strong password
                const tempPassword = crypto.randomBytes(8).toString('hex'); // 16 chars
                const hashed = await bcrypt.hash(tempPassword, 10);

                await user.update({
                    password: hashed,
                    updatedAt: new Date()
                });

                logger.info(`✓ Password updated for ${email}`);

                // Try to send email if configured
                if (process.env.RESEND_API_KEY) {
                    const result = await sendTemporaryPassword(email, tempPassword);
                    if (result && result.success) {
                        logger.info(`✉️  Temporary password emailed to ${email}`);
                    } else {
                        logger.warn(`⚠️  Email not sent for ${email}`, result?.error || result?.reason || 'unknown');
                        logger.info(`   Temp password: ${tempPassword}`);
                    }
                } else {
                    logger.info(`ℹ️  RESEND_API_KEY not set — temp password for ${email}: ${tempPassword}`);
                }

            } catch (err) {
                logger.error(`❌ Error processing ${email}:`, err);
            }
        }

    } catch (err) {
        logger.error('❌ Fatal error:', err);
        process.exit(1);
    } finally {
        try { await sequelize.close(); } catch (e) {}
        process.exit(0);
    }
}

run();
