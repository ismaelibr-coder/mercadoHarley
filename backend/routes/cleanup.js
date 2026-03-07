import express from 'express';
import { Order, Product, User } from '../models/index.js';
import { verifyAdmin } from '../middleware/auth.js';

const router = express.Router();

/**
 * DELETE /api/admin/cleanup-database
 * Limpa dados de teste do banco (produtos e pedidos)
 * ATENÇÃO: Esta ação é IRREVERSÍVEL!
 */
router.delete('/cleanup-database', verifyAdmin, async (req, res) => {
    try {
        // Verificar confirmação
        const { confirm } = req.body;
        if (confirm !== 'DELETE_ALL_DATA') {
            return res.status(400).json({
                error: 'Confirmação necessária',
                message: 'Envie { "confirm": "DELETE_ALL_DATA" } no body para confirmar a exclusão'
            });
        }

        console.log('🧹 Iniciando limpeza do banco de dados...');

        const deletedData = {
            products: 0,
            orders: 0
        };

        // Deletar todos os produtos
        console.log('🗑️ Deletando produtos...');
        deletedData.products = await Product.destroy({ where: {}, truncate: false });
        console.log(`✅ ${deletedData.products} produtos deletados`);

        // Deletar todos os pedidos
        console.log('🗑️ Deletando pedidos...');
        deletedData.orders = await Order.destroy({ where: {}, truncate: false });
        console.log(`✅ ${deletedData.orders} pedidos deletados`);

        console.log('🎉 Limpeza concluída com sucesso!');

        res.json({
            success: true,
            message: 'Banco de dados limpo com sucesso!',
            deleted: deletedData,
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('❌ Erro ao limpar banco de dados:', error);
        res.status(500).json({
            error: 'Erro ao limpar banco de dados',
            details: error.message
        });
    }
});

/**
 * GET /api/admin/cleanup-database/preview
 * Mostra quantos registros serão deletados (preview)
 */
router.get('/cleanup-database/preview', async (req, res) => {
    try {
        const token = req.headers.authorization?.split('Bearer ')[1];
        if (!token) {
            return res.status(401).json({ error: 'Token não fornecido' });
        }

        const decodedToken = await verifyToken(token);
        const isAdmin = await isUserAdmin(decodedToken.uid);

        if (!isAdmin) {
            return res.status(403).json({ error: 'Acesso negado' });
        }

        const productsCount = (await db.collection('products').get()).size;
        const ordersCount = (await db.collection('orders').get()).size;

        let bannersCount = 0;
        try {
            bannersCount = (await db.collection('banners').get()).size;
        } catch (error) {
            // Coleção não existe
        }

        res.json({
            preview: {
                products: productsCount,
                orders: ordersCount,
                banners: bannersCount,
                total: productsCount + ordersCount + bannersCount
            },
            warning: 'Esta ação é IRREVERSÍVEL! Todos estes dados serão permanentemente deletados.',
            howToConfirm: 'Para confirmar, envie DELETE request para /api/admin/cleanup-database com body: { "confirm": "DELETE_ALL_DATA" }'
        });

    } catch (error) {
        console.error('Erro ao buscar preview:', error);
        res.status(500).json({ error: error.message });
    }
});

export default router;
