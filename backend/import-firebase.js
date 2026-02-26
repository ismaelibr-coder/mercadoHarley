import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { sequelize, User, Product, Order, Banner, ShippingRule, AuditLog } from './models/index.js';
import bcrypt from 'bcrypt';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * Convert Firebase timestamp to JavaScript Date
 */
function parseFirebaseTimestamp(timestamp) {
    if (!timestamp) return new Date();
    
    if (timestamp._seconds !== undefined) {
        // Firebase Admin SDK timestamp format
        return new Date(timestamp._seconds * 1000);
    }
    
    if (typeof timestamp === 'string') {
        return new Date(timestamp);
    }
    
    return new Date();
}

/**
 * Import data from Firebase export JSON files to MySQL
 */
async function importFirebaseData() {
    console.log('🔄 Iniciando importação de dados do Firebase para MySQL...\n');

    try {
        // Connect to database
        await sequelize.authenticate();
        console.log('✅ Conectado ao banco de dados MySQL\n');

        // Sync models
        await sequelize.sync({ alter: true });
        console.log('✅ Modelos sincronizados\n');

        const exportDir = './firebase-export';

        // ====================================================
        // 1. IMPORT USERS
        // ====================================================
        console.log('👥 Importando usuários...');
        const usersFile = path.join(exportDir, 'users.json');
        
        if (fs.existsSync(usersFile)) {
            const users = JSON.parse(fs.readFileSync(usersFile, 'utf8'));
            
            for (const firebaseUser of users) {
                try {
                    // Generate a hashed password (Firebase users should reset password on first login)
                    const tempPassword = 'TempPassword123!@#';
                    const hashedPassword = await bcrypt.hash(tempPassword, 10);

                    await User.findOrCreate({
                        where: { email: firebaseUser.email },
                        defaults: {
                            email: firebaseUser.email,
                            hashedPassword,
                            name: firebaseUser.displayName || firebaseUser.email,
                            phone: firebaseUser.phone || '',
                            cpf: firebaseUser.cpf || '',
                            address: firebaseUser.address || {},
                            isAdmin: firebaseUser.isAdmin || false,
                            createdAt: parseFirebaseTimestamp(firebaseUser.createdAt)
                        }
                    });
                } catch (error) {
                    console.warn(`   ⚠️  Erro ao importar usuário ${firebaseUser.email}:`, error.message);
                }
            }
            
            const userCount = await User.count();
            console.log(`   ✅ ${userCount} usuários importados\n`);
        } else {
            console.log('   ⚠️  Arquivo de usuários não encontrado\n');
        }

        // ====================================================
        // 2. IMPORT PRODUCTS
        // ====================================================
        console.log('📦 Importando produtos...');
        const productsFile = path.join(exportDir, 'products.json');
        
        if (fs.existsSync(productsFile)) {
            const products = JSON.parse(fs.readFileSync(productsFile, 'utf8'));
            
            for (const firebaseProduct of products) {
                try {
                    await Product.findOrCreate({
                        where: { id: firebaseProduct.id },
                        defaults: {
                            id: firebaseProduct.id,
                            name: firebaseProduct.name,
                            description: firebaseProduct.description || '',
                            price: parseFloat(firebaseProduct.price) || 0,
                            stock: parseInt(firebaseProduct.stock) || 0,
                            category: firebaseProduct.category || 'Geral',
                            images: firebaseProduct.images || [],
                            dimensions: firebaseProduct.dimensions || {},
                            weight: parseFloat(firebaseProduct.weight) || 0,
                            createdAt: parseFirebaseTimestamp(firebaseProduct.createdAt)
                        }
                    });
                } catch (error) {
                    console.warn(`   ⚠️  Erro ao importar produto ${firebaseProduct.name}:`, error.message);
                }
            }
            
            const productCount = await Product.count();
            console.log(`   ✅ ${productCount} produtos importados\n`);
        } else {
            console.log('   ⚠️  Arquivo de produtos não encontrado\n');
        }

        // ====================================================
        // 3. IMPORT ORDERS
        // ====================================================
        console.log('🛒 Importando pedidos...');
        const ordersFile = path.join(exportDir, 'orders.json');
        
        if (fs.existsSync(ordersFile)) {
            const orders = JSON.parse(fs.readFileSync(ordersFile, 'utf8'));
            
            for (const firebaseOrder of orders) {
                try {
                    // Find user by email
                    const user = await User.findOne({
                        where: { email: firebaseOrder.customerEmail || '' }
                    });

                    if (!user) {
                        console.warn(`   ⚠️  Usuário não encontrado para pedido ${firebaseOrder.id}`);
                        continue;
                    }

                    await Order.findOrCreate({
                        where: { id: firebaseOrder.id },
                        defaults: {
                            id: firebaseOrder.id,
                            orderNumber: firebaseOrder.orderNumber || `ORD-${Date.now()}`,
                            userId: user.id,
                            items: firebaseOrder.items || [],
                            customer: firebaseOrder.customer || {},
                            shipping: firebaseOrder.shipping || {},
                            payment: firebaseOrder.payment || {},
                            status: firebaseOrder.status || 'pending',
                            paidAt: firebaseOrder.paidAt ? parseFirebaseTimestamp(firebaseOrder.paidAt) : null,
                            shippedAt: firebaseOrder.shippedAt ? parseFirebaseTimestamp(firebaseOrder.shippedAt) : null,
                            deliveredAt: firebaseOrder.deliveredAt ? parseFirebaseTimestamp(firebaseOrder.deliveredAt) : null,
                            createdAt: parseFirebaseTimestamp(firebaseOrder.createdAt)
                        }
                    });
                } catch (error) {
                    console.warn(`   ⚠️  Erro ao importar pedido ${firebaseOrder.id}:`, error.message);
                }
            }
            
            const orderCount = await Order.count();
            console.log(`   ✅ ${orderCount} pedidos importados\n`);
        } else {
            console.log('   ⚠️  Arquivo de pedidos não encontrado\n');
        }

        // ====================================================
        // 4. IMPORT BANNERS
        // ====================================================
        console.log('🎨 Importando banners...');
        const bannersFile = path.join(exportDir, 'banners.json');
        
        if (fs.existsSync(bannersFile)) {
            const banners = JSON.parse(fs.readFileSync(bannersFile, 'utf8'));
            
            for (const firebaseBanner of banners) {
                try {
                    await Banner.findOrCreate({
                        where: { id: firebaseBanner.id },
                        defaults: {
                            id: firebaseBanner.id,
                            title: firebaseBanner.title,
                            subtitle: firebaseBanner.subtitle || '',
                            imageUrl: firebaseBanner.imageUrl || '',
                            link: firebaseBanner.link || '',
                            active: firebaseBanner.active !== false,
                            displayOrder: firebaseBanner.displayOrder || 0,
                            createdAt: parseFirebaseTimestamp(firebaseBanner.createdAt)
                        }
                    });
                } catch (error) {
                    console.warn(`   ⚠️  Erro ao importar banner ${firebaseBanner.id}:`, error.message);
                }
            }
            
            const bannerCount = await Banner.count();
            console.log(`   ✅ ${bannerCount} banners importados\n`);
        } else {
            console.log('   ⚠️  Arquivo de banners não encontrado\n');
        }

        // ====================================================
        // 5. IMPORT SHIPPING RULES
        // ====================================================
        console.log('🚚 Importando regras de frete...');
        const shippingRulesFile = path.join(exportDir, 'shippingRules.json');
        
        if (fs.existsSync(shippingRulesFile)) {
            const shippingRules = JSON.parse(fs.readFileSync(shippingRulesFile, 'utf8'));
            
            for (const firebaseRule of shippingRules) {
                try {
                    await ShippingRule.findOrCreate({
                        where: { id: firebaseRule.id },
                        defaults: {
                            id: firebaseRule.id,
                            name: firebaseRule.name,
                            states: firebaseRule.states || [],
                            minWeight: parseFloat(firebaseRule.minWeight) || 0,
                            maxWeight: parseFloat(firebaseRule.maxWeight) || 100,
                            price: parseFloat(firebaseRule.price) || 0,
                            deliveryDays: parseInt(firebaseRule.deliveryDays) || 0,
                            createdAt: parseFirebaseTimestamp(firebaseRule.createdAt)
                        }
                    });
                } catch (error) {
                    console.warn(`   ⚠️  Erro ao importar regra de frete ${firebaseRule.name}:`, error.message);
                }
            }
            
            const shippingRuleCount = await ShippingRule.count();
            console.log(`   ✅ ${shippingRuleCount} regras de frete importadas\n`);
        } else {
            console.log('   ⚠️  Arquivo de regras de frete não encontrado\n');
        }

        // ====================================================
        // SUMMARY
        // ====================================================
        console.log('✨ Importação concluída com sucesso!\n');
        console.log('📊 RESUMO:');
        console.log(`   👥 Usuários: ${await User.count()}`);
        console.log(`   📦 Produtos: ${await Product.count()}`);
        console.log(`   🛒 Pedidos: ${await Order.count()}`);
        console.log(`   🎨 Banners: ${await Banner.count()}`);
        console.log(`   🚚 Regras de Frete: ${await ShippingRule.count()}`);
        console.log('');
        console.log('⚠️  IMPORTANTE:');
        console.log('   - Todos os usuários do Firebase precisam redefinir sua senha');
        console.log('   - Senha temporária: TempPassword123!@# (deve ser alterada)');
        console.log('   - Verifique os dados importados');
        console.log('');

    } catch (error) {
        console.error('❌ Erro durante importação:', error);
        process.exit(1);
    } finally {
        await sequelize.close();
    }
}

// Run import
importFirebaseData();
