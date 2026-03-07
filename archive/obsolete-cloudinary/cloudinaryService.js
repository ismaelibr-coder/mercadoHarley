// Archived: cloudinary helper (removed from active codebase - Cloudinary is deprecated)
// Original implementation preserved for reference.
import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv';

dotenv.config();

// Validate Cloudinary configuration
if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
    console.error('❌ Cloudinary configuration missing! (archived copy)');
} else {
    console.log('✅ Cloudinary configured (archived copy)');
}

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

export const uploadImage = async (fileBuffer, folder = 'mercado-harley/products') => {
    // archived implementation
    try {
        return new Promise((resolve, reject) => {
            const uploadStream = cloudinary.uploader.upload_stream(
                {
                    folder: folder,
                    resource_type: 'image'
                },
                (error, result) => {
                    if (error) reject(error);
                    else resolve(result);
                }
            );
            uploadStream.end(fileBuffer);
        });
    } catch (error) {
        throw error;
    }
};

export const deleteImage = async (publicId) => {
    return await cloudinary.uploader.destroy(publicId);
};

export default cloudinary;
