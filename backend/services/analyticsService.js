import { db } from './firebaseService.js';
import admin from 'firebase-admin';

/**
 * Get sales metrics for dashboard
 * @param {Date} startDate - Start date for metrics
 * @param {Date} endDate - End date for metrics
 * @returns {Promise<Object>} - Sales metrics
 */
export const getSalesMetrics = async (startDate, endDate) => {
    try {
        const ordersSnapshot = await db.collection('orders')
            .where('createdAt', '>=', startDate)
            .where('createdAt', '<=', endDate)
            .get();

        let totalSales = 0;
        let orderCount = 0;

        ordersSnapshot.forEach(doc => {
            const order = doc.data();
            // Filter out cancelled orders in code
            if (order.status !== 'cancelled') {
                totalSales += order.total || 0;
                orderCount++;
            }
        });

        const averageTicket = orderCount > 0 ? totalSales / orderCount : 0;

        return {
            totalSales,
            orderCount,
            averageTicket
        };
    } catch (error) {
        console.error('Error getting sales metrics:', error);
        throw error;
    }
};

/**
 * Get pending orders count
 * @returns {Promise<number>} - Number of pending orders
 */
export const getPendingOrdersCount = async () => {
    try {
        const pendingSnapshot = await db.collection('orders')
            .where('status', '==', 'pending')
            .get();

        return pendingSnapshot.size;
    } catch (error) {
        console.error('Error getting pending orders:', error);
        throw error;
    }
};

/**
 * Get sales data aggregated by period
 * @param {string} period - 'day', 'week', or 'month'
 * @param {number} limit - Number of periods to return
 * @returns {Promise<Array>} - Array of sales data by period
 */
export const getSalesByPeriod = async (period = 'day', limit = 30) => {
    try {
        const now = new Date();
        let startDate;

        // Calculate start date based on period
        if (period === 'day') {
            startDate = new Date(now.getTime() - (limit * 24 * 60 * 60 * 1000));
        } else if (period === 'week') {
            startDate = new Date(now.getTime() - (limit * 7 * 24 * 60 * 60 * 1000));
        } else if (period === 'month') {
            startDate = new Date(now.getTime() - (limit * 30 * 24 * 60 * 60 * 1000));
        }

        const ordersSnapshot = await db.collection('orders')
            .where('createdAt', '>=', startDate)
            .orderBy('createdAt', 'asc')
            .get();

        // Group orders by period
        const salesByPeriod = {};

        ordersSnapshot.forEach(doc => {
            const order = doc.data();

            // Filter out cancelled orders
            if (order.status === 'cancelled') return;

            const orderDate = order.createdAt.toDate();

            let periodKey;
            if (period === 'day') {
                periodKey = orderDate.toISOString().split('T')[0]; // YYYY-MM-DD
            } else if (period === 'week') {
                const weekStart = new Date(orderDate);
                weekStart.setDate(orderDate.getDate() - orderDate.getDay());
                periodKey = weekStart.toISOString().split('T')[0];
            } else if (period === 'month') {
                periodKey = `${orderDate.getFullYear()}-${String(orderDate.getMonth() + 1).padStart(2, '0')}`;
            }

            if (!salesByPeriod[periodKey]) {
                salesByPeriod[periodKey] = {
                    date: periodKey,
                    sales: 0,
                    orders: 0
                };
            }

            salesByPeriod[periodKey].sales += order.total || 0;
            salesByPeriod[periodKey].orders++;
        });

        // Convert to array and sort
        return Object.values(salesByPeriod).sort((a, b) =>
            a.date.localeCompare(b.date)
        );
    } catch (error) {
        console.error('Error getting sales by period:', error);
        throw error;
    }
};

/**
 * Get best-selling products
 * @param {number} limit - Number of products to return
 * @returns {Promise<Array>} - Array of best-selling products
 */
export const getBestSellingProducts = async (limit = 10) => {
    try {
        const ordersSnapshot = await db.collection('orders').get();

        const productSales = {};

        // Aggregate product sales
        ordersSnapshot.forEach(doc => {
            const order = doc.data();

            // Filter out cancelled orders
            if (order.status === 'cancelled') return;

            if (order.items && Array.isArray(order.items)) {
                order.items.forEach(item => {
                    if (!productSales[item.id]) {
                        productSales[item.id] = {
                            id: item.id,
                            name: item.name,
                            image: item.image,
                            quantitySold: 0,
                            revenue: 0
                        };
                    }

                    productSales[item.id].quantitySold += item.quantity || 0;
                    productSales[item.id].revenue += (item.price * item.quantity) || 0;
                });
            }
        });

        // Convert to array, sort by revenue, and limit
        return Object.values(productSales)
            .sort((a, b) => b.revenue - a.revenue)
            .slice(0, limit);
    } catch (error) {
        console.error('Error getting best-selling products:', error);
        throw error;
    }
};

/**
 * Get dashboard metrics (current month vs previous month)
 * @returns {Promise<Object>} - Dashboard metrics with trends
 */
export const getDashboardMetrics = async () => {
    try {
        const now = new Date();

        // Current month
        const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        const currentMonthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

        // Previous month
        const previousMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const previousMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);

        const [currentMetrics, previousMetrics, pendingOrders] = await Promise.all([
            getSalesMetrics(currentMonthStart, currentMonthEnd),
            getSalesMetrics(previousMonthStart, previousMonthEnd),
            getPendingOrdersCount()
        ]);

        // Calculate trends
        const salesChange = previousMetrics.totalSales > 0
            ? ((currentMetrics.totalSales - previousMetrics.totalSales) / previousMetrics.totalSales) * 100
            : 0;

        const ordersChange = previousMetrics.orderCount > 0
            ? ((currentMetrics.orderCount - previousMetrics.orderCount) / previousMetrics.orderCount) * 100
            : 0;

        return {
            monthSales: currentMetrics.totalSales,
            monthOrders: currentMetrics.orderCount,
            averageTicket: currentMetrics.averageTicket,
            pendingOrders,
            trends: {
                salesChange: Math.round(salesChange * 10) / 10,
                ordersChange: Math.round(ordersChange * 10) / 10
            }
        };
    } catch (error) {
        console.error('Error getting dashboard metrics:', error);
        throw error;
    }
};
