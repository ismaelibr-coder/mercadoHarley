import express from 'express';
import multer from 'multer';
import { uploadImage, deleteImage } from '../services/cloudinaryService.js';
import { verifyToken, isUserAdmin } from '../services/firebaseService.js';

const router = express.Router();

// Configure multer for memory storage
const storage = multer.memoryStorage();
const upload = multer({
    storage: storage,
    limits: {
        fileSize: 10 * 1024 * 1024 // 10MB limit
    },
    fileFilter: (req, file, cb) => {
        // Accept only images
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Only image files are allowed'), false);
        }
    }
});

// Middleware to verify admin
const verifyAdmin = async (req, res, next) => {
    try {
        const token = req.headers.authorization?.split('Bearer ')[1];

        if (!token) {
            return res.status(401).json({ error: 'No token provided' });
        }

        const decodedToken = await verifyToken(token);
        const isAdmin = await isUserAdmin(decodedToken.uid);

        if (!isAdmin) {
            return res.status(403).json({ error: 'Admin access required' });
        }

        req.user = decodedToken;
        next();
    } catch (error) {
        console.error('Auth error:', error);
        res.status(401).json({ error: 'Unauthorized' });
    }
};

// POST /api/upload/image - Upload image
router.post('/image', verifyAdmin, upload.single('image'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No image file provided' });
        }

        const result = await uploadImage(req.file.buffer);

        res.json({
            success: true,
            url: result.url,
            publicId: result.publicId,
            width: result.width,
            height: result.height,
            format: result.format
        });
    } catch (error) {
        console.error('Upload error:', error);
        res.status(500).json({ error: 'Failed to upload image' });
    }
});

// DELETE /api/upload/image/:publicId - Delete image
router.delete('/image/:publicId(*)', verifyAdmin, async (req, res) => {
    try {
        const publicId = req.params.publicId;

        if (!publicId) {
            return res.status(400).json({ error: 'No public ID provided' });
        }

        const result = await deleteImage(publicId);

        res.json({
            success: true,
            result: result
        });
    } catch (error) {
        console.error('Delete error:', error);
        res.status(500).json({ error: 'Failed to delete image' });
    }
});

export default router;
