import dotenv from 'dotenv';
import logger from '../utils/logger.js';
dotenv.config();

import bcrypt from 'bcrypt';
import crypto from 'crypto';
import { sequelize, User } from '../models/index.js';
import { sendTemporaryPassword } from '../services/emailService.js';

// Reads "email:Full Name" pairs (comma-separated) from ADMIN_USERS, or as CLI args.
// Admin credentials are never hardcoded here: for a brand-new user a random
// temporary password is generated (and emailed, if RESEND_API_KEY is set); for an
// existing user, this script only promotes them to admin and never touches their
// password — re-running it can't reset someone's password back to a known value.
const args = process.argv.slice(2);
const usersArg = process.env.ADMIN_USERS || args.join(',');

if (!usersArg) {
    logger.error('Usage: ADMIN_USERS="email1@example.com:Name One,email2@example.com:Name Two" node scripts/create-admins-mysql.js');
    logger.error('Or as CLI args: node scripts/create-admins-mysql.js "email1@example.com:Name One" "email2@example.com:Name Two"');
    process.exit(1);
}

const admins = usersArg.split(',').map((entry) => {
    const [emailRaw, ...nameParts] = entry.split(':');
    const email = (emailRaw || '').trim().toLowerCase();
    const name = nameParts.join(':').trim() || email.split('@')[0];
    return { email, name };
}).filter((a) => a.email);

async function upsertAdmins() {
    try {
        await sequelize.authenticate();
        logger.info('✅ Conectado ao banco');

        for (const { email, name } of admins) {
            let user = await User.findOne({ where: { email } });

            if (user) {
                // Existing user: only promote to admin — password is left untouched.
                await user.update({ isAdmin: true, userType: 'admin' });
                logger.info(`✅ ${email} promovido a admin (senha inalterada)`);
                continue;
            }

            const id = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            const tempPassword = crypto.randomBytes(8).toString('hex');
            const hashed = await bcrypt.hash(tempPassword, 10);

            user = await User.create({
                id,
                email,
                password: hashed,
                name,
                isAdmin: true,
                userType: 'admin'
            });

            logger.info(`✅ Admin criado: ${email} -> id: ${id}`);

            if (process.env.RESEND_API_KEY) {
                const result = await sendTemporaryPassword(email, tempPassword);
                if (result?.success) {
                    logger.info(`   ✉️  Senha temporária enviada por e-mail para ${email}`);
                } else {
                    logger.info(`   ⚠️  E-mail não enviado — senha temporária: ${tempPassword}`);
                }
            } else {
                logger.info(`   ℹ️  RESEND_API_KEY não configurado — senha temporária: ${tempPassword}`);
            }
        }
    } catch (err) {
        logger.error('❌ Erro:', err);
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

upsertAdmins();
