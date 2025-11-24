
import fetch from 'node-fetch';

const API_URL = 'http://127.0.0.1:3001/api/shipping/calculate';

const testCases = [
    { region: 'Sudeste (SP)', cep: '01310-100', weight: 1 },
    { region: 'Sul (RS)', cep: '90000-000', weight: 2 },
    { region: 'Nordeste (BA)', cep: '40000-000', weight: 3 },
    { region: 'Norte (AM)', cep: '69000-000', weight: 4 },
    { region: 'Centro-Oeste (DF)', cep: '70000-000', weight: 5 },
    { region: 'Invalid CEP', cep: '00000-000', weight: 1 }
];

async function runTests() {
    console.log('🚚 Starting Shipping API Tests...\n');

    for (const test of testCases) {
        console.log(`Testing ${test.region} - CEP: ${test.cep}, Weight: ${test.weight}kg`);
        try {
            const response = await fetch(API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ cep: test.cep, weight: test.weight })
            });

            const data = await response.json();

            if (response.ok) {
                console.log('✅ Success!');
                console.table(data.map(opt => ({
                    Service: opt.name,
                    Price: `R$ ${opt.price}`,
                    Days: opt.deliveryDays
                })));
            } else {
                console.log(`❌ Error: ${data.error || response.statusText}`);
            }
        } catch (error) {
            console.log(`❌ Network Error: ${error.message}`);
        }
        console.log('-'.repeat(50));
    }
}

runTests();
