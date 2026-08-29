import express from 'express';
import { Order, Product, Banner } from '../models/index.js';
import { verifyAdmin } from '../middleware/auth.js';
import logger from '../utils/logger.js';

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

        logger.info('🧹 Iniciando limpeza do banco de dados...');

        const deletedData = {
            products: 0,
            orders: 0
        };

        // Deletar todos os produtos
        logger.info('🗑️ Deletando produtos...');
        deletedData.products = await Product.destroy({ where: {}, truncate: false });
        logger.info(`✅ ${deletedData.products} produtos deletados`);

        // Deletar todos os pedidos
        logger.info('🗑️ Deletando pedidos...');
        deletedData.orders = await Order.destroy({ where: {}, truncate: false });
        logger.info(`✅ ${deletedData.orders} pedidos deletados`);

        logger.info('🎉 Limpeza concluída com sucesso!');

        res.json({
            success: true,
            message: 'Banco de dados limpo com sucesso!',
            deleted: deletedData,
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        logger.error('❌ Erro ao limpar banco de dados:', error);
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
router.get('/cleanup-database/preview', verifyAdmin, async (req, res) => {
    try {
        const productsCount = await Product.count();
        const ordersCount = await Order.count();
        const bannersCount = await Banner.count();

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
        logger.error('Erro ao buscar preview:', error);
        res.status(500).json({ error: error.message });
    }
});

export default router;
