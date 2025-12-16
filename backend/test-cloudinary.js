import { v2 as cloudinary } from 'cloudinary';

// Configure with your credentials
cloudinary.config({
    cloud_name: 'durlactb',
    api_key: '694539858877091',
    api_secret: 'cJD5pYmr4dGTqN4EScIkaXuaHB'
});

// Test the connection
console.log('Testing Cloudinary connection...');

cloudinary.api.ping()
    .then(result => {
        console.log('✅ Cloudinary connection successful!');
        console.log('Result:', result);
    })
    .catch(error => {
        console.error('❌ Cloudinary connection failed!');
        console.error('Error:', error);
    });
