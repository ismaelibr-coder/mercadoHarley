import express from 'express';
import {
    getDashboardMetrics,
    getSalesByPeriod,
    getBestSellingProducts,
    getSalesReportPavilhaoVsOnline
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

// GET /api/analytics/pavilhao-report?startDate=2024-01-01&endDate=2024-01-31
router.get('/pavilhao-report', verifyAdmin, async (req, res) => {
    try {
        const { startDate, endDate } = req.query;

        if (!startDate || !endDate) {
            return res.status(400).json({
                error: 'startDate and endDate are required (YYYY-MM-DD format)'
            });
        }

        // Validate date format
        const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
        if (!dateRegex.test(startDate) || !dateRegex.test(endDate)) {
            return res.status(400).json({
                error: 'Invalid date format. Use YYYY-MM-DD'
            });
        }

        const report = await getSalesReportPavilhaoVsOnline(startDate, endDate);

        res.json({
            success: true,
            data: report
        });
    } catch (error) {
        console.error('Error getting pavilhao report:', error);
        res.status(500).json({ error: 'Failed to get pavilhao report' });
    }
});

export default router;
