import express from 'express';
import {
    getDashboardMetrics,
    getSalesByPeriod,
    getBestSellingProducts
} from '../services/analyticsService.js';
import { verifyAdmin } from '../middleware/auth.js';

const router = express.Router();

// GET /api/analytics/metrics - Get dashboard metrics
router.get('/metrics', verifyAdmin, async (req, res) => {
    try {
        const metrics = await getDashboardMetrics();
        res.json(metrics);
    } catch (error) {
        console.error('Error getting metrics:', error);
        res.status(500).json({ error: 'Failed to get metrics' });
    }
});

// GET /api/analytics/sales-chart?period=day|week|month&limit=30
router.get('/sales-chart', verifyAdmin, async (req, res) => {
    try {
        const period = req.query.period || 'day';
        const limit = parseInt(req.query.limit) || 30;

        if (!['day', 'week', 'month'].includes(period)) {
            return res.status(400).json({ error: 'Invalid period. Use day, week, or month' });
        }

        const chartData = await getSalesByPeriod(period, limit);

        res.json({
            period,
            data: chartData
        });
    } catch (error) {
        console.error('Error getting sales chart:', error);
        res.status(500).json({ error: 'Failed to get sales chart data' });
    }
});

// GET /api/analytics/best-sellers?limit=10
router.get('/best-sellers', verifyAdmin, async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 10;
        const bestSellers = await getBestSellingProducts(limit);

        res.json({
            products: bestSellers
        });
    } catch (error) {
        console.error('Error getting best sellers:', error);
        res.status(500).json({ error: 'Failed to get best sellers' });
    }
});

export default router;
