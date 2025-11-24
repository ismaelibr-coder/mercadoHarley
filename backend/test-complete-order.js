import fetch from 'node-fetch';

async function testCompleteOrderFlow() {
    try {
        console.log('🛒 Creating test order for ismael.ibr@gmail.com...\n');

        const orderData = {
            customer: {
                name: 'Ismael Ribeiro',
                email: 'ismael.ibr@gmail.com',
                cpf: '123.456.789-00',
                phone: '(11) 98765-4321'
            },
            items: [
                {
                    id: '16NuuLWP7ig5VSLnRH3d',
                    name: 'Capacete Demo',
                    price: 1500,
                    quantity: 1,
                    image: '/logo.png'
                }
            ],
            shipping: {
                address: 'Av Paulista',
                number: '1000',
                neighborhood: 'Bela Vista',
                city: 'São Paulo',
                state: 'SP',
                zipCode: '01310-100'
            },
            total: 1500,
            paymentMethod: 'credit_card'
        };

        // Create order via credit card endpoint (mock mode)
        const response = await fetch('http://localhost:3001/api/payments/credit-card', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                orderData,
                cardToken: 'mock_token_approved'
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`HTTP ${response.status}: ${errorText}`);
        }

        const result = await response.json();
        console.log('✅ Order created successfully!');
        console.log('📦 Order ID:', result.orderId);
        console.log('📧 Check your email for order confirmation!\n');
        console.log('Full response:', JSON.stringify(result, null, 2));

        return result.orderId;
    } catch (error) {
        console.error('❌ Error:', error.message);
        console.error('Stack:', error.stack);
    }
}

testCompleteOrderFlow();
