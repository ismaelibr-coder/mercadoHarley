const cloudinary = require('cloudinary').v2;
require('dotenv').config();

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

const logoPath = 'C:/Users/ismaelr/.gemini/antigravity/brain/8225c6fb-1c01-441b-b629-92640e3994d6/uploaded_image_1766454357051.png';

cloudinary.uploader.upload(logoPath, {
    folder: 'sickgrip',
    public_id: 'logo',
    overwrite: true
})
    .then(result => {
        console.log('✅ Logo uploaded successfully!');
        console.log('URL:', result.secure_url);
    })
    .catch(err => {
        console.error('❌ Error uploading logo:', err);
    });
