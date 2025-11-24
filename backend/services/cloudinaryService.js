import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv';

dotenv.config();

// Configure Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

/**
 * Upload image to Cloudinary
 * @param {Buffer} fileBuffer - Image file buffer
 * @param {string} folder - Cloudinary folder (default: 'mercado-harley/products')
 * @returns {Promise<Object>} - Upload result with URL and public_id
 */
export const uploadImage = async (fileBuffer, folder = 'mercado-harley/products') => {
    try {
        return new Promise((resolve, reject) => {
            const uploadStream = cloudinary.uploader.upload_stream(
                {
                    folder: folder,
                    resource_type: 'image',
                    transformation: [
                        { width: 1000, height: 1000, crop: 'fit' }, // Fit within dimensions without cropping
                        { quality: 'auto' }, // Auto quality
                        { fetch_format: 'auto' } // Auto format (WebP when supported)
                    ]
                },
                (error, result) => {
                    if (error) {
                        reject(error);
                    } else {
                        resolve({
                            url: result.secure_url,
                            publicId: result.public_id,
                            width: result.width,
                            height: result.height,
                            format: result.format
                        });
                    }
                }
            );

            uploadStream.end(fileBuffer);
        });
    } catch (error) {
        console.error('Error uploading to Cloudinary:', error);
        throw error;
    }
};

/**
 * Delete image from Cloudinary
 * @param {string} publicId - Cloudinary public_id
 * @returns {Promise<Object>} - Delete result
 */
export const deleteImage = async (publicId) => {
    try {
        const result = await cloudinary.uploader.destroy(publicId);
        return result;
    } catch (error) {
        console.error('Error deleting from Cloudinary:', error);
        throw error;
    }
};

export default cloudinary;
