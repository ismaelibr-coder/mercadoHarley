import { Order } from '../models/index.js';
import { Op } from 'sequelize';
import sequelize from '../config/database.js';

/**
 * Get sales metrics for dashboard
 * @param {Date} startDate - Start date for metrics
 * @param {Date} endDate - End date for metrics
 * @returns {Promise<Object>} - Sales metrics
 */
export const getSalesMetrics = async (startDate, endDate) => {
    try {
        const orders = await Order.findAll({
            where: {
                createdAt: {
                    [Op.between]: [startDate, endDate]
                }
            },
            attributes: ['total', 'items', 'payment']
        });

        // Filter paid orders - payment status is inside payment JSON field
        const paidOrders = orders.filter(order => {
            const paymentStatus = order.payment?.status;
            return paymentStatus === 'paid' || paymentStatus === 'approved';
        });

        let totalSales = 0;
        let netRevenue = 0;
        const orderCount = paidOrders.length;

        paidOrders.forEach(order => {
            totalSales += parseFloat(order.total) || 0;

            // Calculate Net Revenue based on profit margin
            const items = order.items;
            if (items) {
                // items is already parsed as JSON by Sequelize
                const itemsArray = Array.isArray(items) ? items : [];
                itemsArray.forEach(item => {
                    const profitMargin = item.profitMargin || 0; // %
                    const itemTotal = (item.price * item.quantity) || 0;
                    const itemProfit = itemTotal * (profitMargin / 100);
                    netRevenue += itemProfit;
                });
            }
        });

        const averageTicket = orderCount > 0 ? totalSales / orderCount : 0;

        return {
            totalSales,
            netRevenue,
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
        const count = await Order.count({
            where: {
                status: 'pending'
            }
        });

        return count;
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

        const orders = await Order.findAll({
            where: {
                createdAt: {
                    [Op.gte]: startDate
                },
                status: {
                    [Op.ne]: 'cancelled'
                }
            },
            order: [['createdAt', 'ASC']],
            attributes: ['createdAt', 'total']
        });

        // Group orders by period
        const salesByPeriod = {};

        orders.forEach(order => {
            const orderDate = new Date(order.createdAt);

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

            salesByPeriod[periodKey].sales += parseFloat(order.total) || 0;
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
        const orders = await Order.findAll({
            where: {
                status: {
                    [Op.ne]: 'cancelled'
                }
            },
            attributes: ['items']
        });

        const productSales = {};

        // Aggregate product sales
        orders.forEach(order => {
            let items = [];
            if (order.items && typeof order.items === 'string') {
                try {
                    items = JSON.parse(order.items);
                } catch (e) {
                    console.warn('Error parsing items JSON:', e);
                    return;
                }
            } else if (Array.isArray(order.items)) {
                items = order.items;
            }

            items.forEach(item => {
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
            monthNetRevenue: currentMetrics.netRevenue,
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

/**
 * Get sales report: Pavilhão vs Online
 * @param {string} startDate - Start date (YYYY-MM-DD)
 * @param {string} endDate - End date (YYYY-MM-DD)
 * @returns {Promise<Object>} - Sales comparison report
 */
export const getSalesReportPavilhaoVsOnline = async (startDate, endDate) => {
    try {
        const { Order } = await import('../models/index.js');
        const { Op } = await import('sequelize');

        const start = new Date(startDate + 'T00:00:00Z');
        const end = new Date(endDate + 'T23:59:59Z');

        // Get all orders in the date range
        const orders = await Order.findAll({
            where: {
                createdAt: {
                    [Op.between]: [start, end]
                }
            },
            attributes: ['id', 'orderNumber', 'orderType', 'subtotal', 'discount', 'total', 'status', 'sellerName', 'createdAt']
        });

        // Separate by type
        const pavilhaoOrders = orders.filter(o => o.orderType === 'pavilhao');
        const onlineOrders = orders.filter(o => o.orderType !== 'pavilhao' || !o.orderType);

        // Calculate metrics
        const calcMetrics = (orderList) => {
            const totalItems = orderList.length;
            const totalSubtotal = orderList.reduce((sum, o) => sum + (parseFloat(o.subtotal) || 0), 0);
            const totalDiscount = orderList.reduce((sum, o) => sum + (parseFloat(o.discount) || 0), 0);
            const totalRevenue = orderList.reduce((sum, o) => sum + (parseFloat(o.total) || 0), 0);

            return {
                totalOrders: totalItems,
                totalSubtotal: parseFloat(totalSubtotal.toFixed(2)),
                totalDiscount: parseFloat(totalDiscount.toFixed(2)),
                totalRevenue: parseFloat(totalRevenue.toFixed(2)),
                averageOrderValue: totalItems > 0 ? parseFloat((totalRevenue / totalItems).toFixed(2)) : 0
            };
        };

        const pavilhaoMetrics = calcMetrics(pavilhaoOrders);
        const onlineMetrics = calcMetrics(onlineOrders);

        // Group pavilhao by seller
        const sellerSales = {};
        pavilhaoOrders.forEach(order => {
            const seller = order.sellerName || 'Sem informação';
            if (!sellerSales[seller]) {
                sellerSales[seller] = [];
            }
            sellerSales[seller].push(order);
        });

        const sellerMetrics = Object.entries(sellerSales).map(([sellerName, orders]) => {
            const metrics = calcMetrics(orders);
            return {
                seller: sellerName,
                ...metrics
            };
        }).sort((a, b) => b.totalOrders - a.totalOrders);

        return {
            period: {
                startDate,
                endDate
            },
            pavilhao: pavilhaoMetrics,
            online: onlineMetrics,
            comparison: {
                pavilhaoPercentage: onlineMetrics.totalOrders + pavilhaoMetrics.totalOrders > 0 
                    ? parseFloat(((pavilhaoMetrics.totalOrders / (onlineMetrics.totalOrders + pavilhaoMetrics.totalOrders)) * 100).toFixed(2))
                    : 0,
                onlinePercentage: onlineMetrics.totalOrders + pavilhaoMetrics.totalOrders > 0
                    ? parseFloat(((onlineMetrics.totalOrders / (onlineMetrics.totalOrders + pavilhaoMetrics.totalOrders)) * 100).toFixed(2))
                    : 0
            },
            sellerBreakdown: sellerMetrics
        };
    } catch (error) {
        console.error('Error getting sales report:', error);
        throw error;
    }
};
