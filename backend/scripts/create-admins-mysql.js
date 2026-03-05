import dotenv from 'dotenv';
dotenv.config();

import bcrypt from 'bcrypt';
import { sequelize, User } from '../models/index.js';

const admins = [
    { email: 'ismael.ibr@gmail.com', password: '12345678', name: 'Ismael' },
    { email: 'pietrogarcez@gmail.com', password: '12345678', name: 'Pietro Garcez' }
];

async function upsertAdmins() {
    try {
        await sequelize.authenticate();
        console.log('✅ Conectado ao banco');

        for (const a of admins) {
            const email = a.email.toLowerCase();
            const hashed = await bcrypt.hash(a.password, 10);

            let user = await User.findOne({ where: { email } });
            if (user) {
                console.log(`Atualizando usuário existente: ${email} (id: ${user.id})`);
                await user.update({
                    password: hashed,
                    name: a.name,
                    isAdmin: true,
                    userType: 'admin'
                });
            } else {
                const id = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
                user = await User.create({
                    id,
                    email,
                    password: hashed,
                    name: a.name,
                    isAdmin: true,
                    userType: 'admin'
                });
                console.log(`Usuário criado: ${email} -> id: ${id}`);
            }

            console.log(`✅ ${email} agora é ADMIN`);
        }
    } catch (err) {
        console.error('❌ Erro:', err);
        process.exit(1);
    } finally {
        try {
            await sequelize.close();
        } catch (e) {}
        process.exit(0);
    }
}

upsertAdmins();
