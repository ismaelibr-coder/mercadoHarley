// Archived test script for Cloudinary (contained credentials) — preserved for auditing only
import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'YOUR_CLOUD_NAME',
    api_key: process.env.CLOUDINARY_API_KEY || 'YOUR_API_KEY',
    api_secret: process.env.CLOUDINARY_API_SECRET || 'YOUR_API_SECRET'
});

console.log('Testing Cloudinary connection (archived script)');

cloudinary.api.ping()
    .then(result => {
        console.log('✅ Cloudinary connection successful!');
        console.log('Result:', result);
    })
    .catch(error => {
        console.error('❌ Cloudinary connection failed!');
        console.error('Error:', error);
    });
