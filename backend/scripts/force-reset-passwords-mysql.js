import dotenv from 'dotenv';
dotenv.config();

import bcrypt from 'bcrypt';
import crypto from 'crypto';
import { sequelize, User } from '../models/index.js';
import { sendTemporaryPassword } from '../services/emailService.js';

const args = process.argv.slice(2);
const emailsArg = process.env.FORCE_RESET_EMAILS || args.join(',');

if (!emailsArg) {
    console.error('Usage: node scripts/force-reset-passwords-mysql.js email1@example.com email2@example.com');
    console.error('Or set FORCE_RESET_EMAILS="a@b.com,c@d.com" in env');
    process.exit(1);
}

const emails = emailsArg.split(',').map(e => e.trim().toLowerCase()).filter(Boolean);

async function run() {
    try {
        await sequelize.authenticate();
        console.log('✅ Connected to DB');

        for (const email of emails) {
            try {
                console.log(`\nProcessing: ${email}`);
                const user = await User.findOne({ where: { email } });
                if (!user) {
                    console.warn(`⚠️  User not found: ${email}`);
                    continue;
                }

                // Generate a temporary strong password
                const tempPassword = crypto.randomBytes(8).toString('hex'); // 16 chars
                const hashed = await bcrypt.hash(tempPassword, 10);

                await user.update({
                    password: hashed,
                    updatedAt: new Date()
                });

                console.log(`✓ Password updated for ${email}`);

                // Try to send email if configured
                if (process.env.RESEND_API_KEY) {
                    const result = await sendTemporaryPassword(email, tempPassword);
                    if (result && result.success) {
                        console.log(`✉️  Temporary password emailed to ${email}`);
                    } else {
                        console.warn(`⚠️  Email not sent for ${email}`, result?.error || result?.reason || 'unknown');
                        console.log(`   Temp password: ${tempPassword}`);
                    }
                } else {
                    console.log(`ℹ️  RESEND_API_KEY not set — temp password for ${email}: ${tempPassword}`);
                }

            } catch (err) {
                console.error(`❌ Error processing ${email}:`, err);
            }
        }

    } catch (err) {
        console.error('❌ Fatal error:', err);
        process.exit(1);
    } finally {
        try { await sequelize.close(); } catch (e) {}
        process.exit(0);
    }
}

run();
