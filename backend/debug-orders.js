
import { getAllOrders, initializeFirebase } from './services/firebaseService.js';
import dotenv from 'dotenv';

dotenv.config();

const debugOrders = async () => {
    try {
        initializeFirebase();
        console.log('Fetching all orders...');
        const orders = await getAllOrders();
        console.log(`\nFound ${orders.length} orders.`);

        console.log('\n--- Raw Order Statuses ---');
        orders.forEach(order => {
            console.log(`Order ${order.orderNumber || order.id}: status="${order.status}" (type: ${typeof order.status})`);
        });

        // Group by status
        const statusCounts = orders.reduce((acc, order) => {
            const s = order.status;
            acc[s] = (acc[s] || 0) + 1;
            return acc;
        }, {});

        console.log('\n--- Status Counts ---');
        console.table(statusCounts);

    } catch (error) {
        console.error('Error:', error);
    }
};

debugOrders();
