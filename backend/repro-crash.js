import fetch from 'node-fetch';

async function testCrash() {
    try {
        console.log('Sending request to forgot-password...');
        const response = await fetch('http://localhost:3001/api/auth/forgot-password', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: 'ismael.ibr@gmail.com' })
        });

        console.log('Response status:', response.status);
        const data = await response.json();
        console.log('Response data:', data);
    } catch (error) {
        console.error('Request failed:', error);
    }
}

testCrash();
