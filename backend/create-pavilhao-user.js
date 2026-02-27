import dotenv from 'dotenv';
import { User } from './models/index.js';
import { sequelize } from './config/database.js';
import { hashPassword } from './services/authService.js';
import { v4 as uuidv4 } from 'uuid';

dotenv.config();

/**
 * Script para criar usuário Pavilhão
 * Usuário usado para controle de estoque da loja física
 * Email: pavilhao@sickgrip.com.br
 * Senha: Pavilhao@59
 */

const createPavilhaoUser = async () => {
    try {
        // Conectar ao banco de dados
        await sequelize.authenticate();
        console.log('✅ Conectado ao banco de dados');

        const email = 'pavilhao@sickgrip.com.br';
        const password = 'Pavilhao@59';
        const name = 'Pavilhão Sickgrip';

        // Verificar se usuário já existe
        const existingUser = await User.findOne({
            where: { email: email.toLowerCase() }
        });

        if (existingUser) {
            console.log('⚠️  Usuário já existe!');
            console.log(`ID: ${existingUser.id}`);
            console.log(`Email: ${existingUser.email}`);
            console.log(`Tipo: ${existingUser.userType}`);
            
            // Atualizar tipo se necessário
            if (existingUser.userType !== 'pavilhao') {
                await existingUser.update({ userType: 'pavilhao' });
                console.log('✅ Tipo de usuário atualizado para "pavilhao"');
            }
            
            process.exit(0);
            return;
        }

        // Criptografar senha
        const hashedPassword = await hashPassword(password);

        // Criar usuário
        const user = await User.create({
            id: `user_${uuidv4()}`,
            email: email.toLowerCase(),
            password: hashedPassword,
            name: name,
            phone: null,
            cpf: null,
            address: null,
            isAdmin: false,
            userType: 'pavilhao'
        });

        console.log('\n🎉 Usuário Pavilhão criado com sucesso!\n');
        console.log('═══════════════════════════════════════');
        console.log('📋 DETALHES DO USUÁRIO:');
        console.log('═══════════════════════════════════════');
        console.log(`ID do Usuário: ${user.id}`);
        console.log(`Email: ${user.email}`);
        console.log(`Senha: ${password}`);
        console.log(`Nome: ${user.name}`);
        console.log(`Tipo: ${user.userType}`);
        console.log('═══════════════════════════════════════\n');
        console.log('ℹ️  Funcionalidades deste usuário:');
        console.log('  • Todos os produtos com desconto de 100%');
        console.log('  • Frete com opção de retirada (sem custo)');
        console.log('  • Usado para dar baixa em estoque da loja física');
        console.log('  • Todas as "compras" registradas como tipo "pavilhao"\n');

        process.exit(0);
    } catch (error) {
        console.error('❌ Erro ao criar usuário:', error.message);
        process.exit(1);
    }
};

// Executar
createPavilhaoUser();
