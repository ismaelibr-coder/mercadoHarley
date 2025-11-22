
const orders = [
    { id: 1, orderNumber: '001', status: 'paid' },
    { id: 2, orderNumber: '002', status: 'pending' },
    { id: 3, orderNumber: '003', status: 'approved' }, // Mercado Pago style
    { id: 4, orderNumber: '004', status: ' paid ' }, // Dirty data
];

const testFilter = (filterStatus) => {
    console.log(`\nTesting filter: "${filterStatus}"`);
    const filtered = orders.filter(order => {
        const matchesStatus = filterStatus === 'all' || order.status === filterStatus;
        return matchesStatus;
    });
    console.log('Results:', filtered.map(o => `${o.orderNumber} (${o.status})`));
};

testFilter('all');
testFilter('paid');
testFilter('pending');
