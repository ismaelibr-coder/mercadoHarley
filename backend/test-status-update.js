import fetch from 'node-fetch';

async function testStatusUpdate() {
    try {
        const orderId = 'Facw5DbjVatRuzz2Xw5U';
        const newStatus = 'shipped';

        console.log(`📦 Updating order ${orderId} to status: ${newStatus}...\n`);

        const response = await fetch(`http://localhost:3001/api/orders/${orderId}/status`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: newStatus })
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`HTTP ${response.status}: ${errorText}`);
        }

        const result = await response.json();
        console.log('✅ Status updated successfully!');
        console.log('📧 Check your email for status update notification!\n');
        console.log('Response:', JSON.stringify(result, null, 2));

    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

testStatusUpdate();
