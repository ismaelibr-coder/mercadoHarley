import fetch from 'node-fetch';

async function testOrderFlow() {
    try {
        console.log('Creating test order...');

        const orderData = {
            customer: {
                name: 'Ismael Ribeiro',
                email: 'ismael.ibr@gmail.com',
                cpf: '123.456.789-00',
                phone: '(11) 98765-4321'
            },
            items: [
                {
                    id: 'capacete-demo',
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

        // Create order via credit card endpoint
        const response = await fetch('http://localhost:3001/api/payments/credit-card', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                orderData,
                cardToken: 'mock_token_123'
            })
        });

        const result = await response.json();
        console.log('✅ Order created:', result);
        console.log('\n📧 Check your email for order confirmation!');

        return result.orderId;
    } catch (error) {
        console.error('❌ Error:', error);
    }
}

testOrderFlow();
