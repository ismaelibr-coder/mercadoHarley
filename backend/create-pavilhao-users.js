import dotenv from 'dotenv';
import { User } from './models/index.js';
import { sequelize } from './config/database.js';
import { hashPassword } from './services/authService.js';
import { v4 as uuidv4 } from 'uuid';

dotenv.config();

/**
 * Script para criar múltiplos usuários do tipo 'pavilhao'
 * Emails e senhas adicionados:
 * - ismael.ibr@gmail.com / 12345678
 * - pietrogarcez@gmail.com / 12345678
 */

const usersToAdd = [
    { email: 'ismael.ibr@gmail.com', password: '12345678' },
    { email: 'pietrogarcez@gmail.com', password: '12345678' }
];

const deriveNameFromEmail = (email) => {
    const local = String(email || '').split('@')[0] || '';
    return local
        .split(/[._-]/)
        .filter(Boolean)
        .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
        .join(' ');
};

const createPavilhaoUsers = async () => {
    try {
        await sequelize.authenticate();
        console.log('✅ Conectado ao banco de dados');

        for (const item of usersToAdd) {
            const email = item.email.toLowerCase();
            const password = item.password;
            const name = deriveNameFromEmail(email);

            const existingUser = await User.findOne({ where: { email } });

            if (existingUser) {
                console.log(`\n⚠️  Usuário já existe: ${existingUser.email}`);
                console.log(`ID: ${existingUser.id}`);
                console.log(`Tipo: ${existingUser.userType}`);

                if (existingUser.userType !== 'pavilhao') {
                    await existingUser.update({ userType: 'pavilhao' });
                    console.log('✅ Tipo de usuário atualizado para "pavilhao"');
                }

                continue;
            }

            const hashedPassword = await hashPassword(password);

            const user = await User.create({
                id: `user_${uuidv4()}`,
                email,
                password: hashedPassword,
                name,
                phone: null,
                cpf: null,
                address: null,
                isAdmin: false,
                userType: 'pavilhao'
            });

            console.log('\n🎉 Usuário criado com sucesso!');
            console.log('═══════════════════════════════════════');
            console.log(`ID do Usuário: ${user.id}`);
            console.log(`Email: ${user.email}`);
            console.log(`Senha: ${password}`);
            console.log(`Nome: ${user.name}`);
            console.log('═══════════════════════════════════════\n');
        }

        process.exit(0);
    } catch (error) {
        console.error('❌ Erro ao criar usuários:', error.message || error);
        process.exit(1);
    }
};

// Executar
createPavilhaoUsers();
