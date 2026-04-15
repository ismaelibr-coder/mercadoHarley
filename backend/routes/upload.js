import express from 'express';
import multer from 'multer';
import { saveImage, deleteImage } from '../services/localUploadService.js';
import { verifyAdmin } from '../middleware/auth.js';

const router = express.Router();

// Configure multer for memory storage
const storage = multer.memoryStorage();
const upload = multer({
    storage,
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

// POST /api/upload/image - Upload image
router.post('/image', verifyAdmin, upload.single('image'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No image file provided' });
        }

        const uploadBaseUrl = process.env.UPLOADS_BASE_URL || `${req.protocol}://${req.get('host')}/uploads`;
        const result = await saveImage(req.file, { baseUrl: uploadBaseUrl });

        res.json({
            success: true,
            url: result.url,
            filename: result.filename
        });
    } catch (error) {
        console.error('Upload error:', error);
        res.status(500).json({ error: 'Failed to upload image' });
    }
});

// DELETE /api/upload/image/:filename - Delete image
router.delete('/image/:filename', verifyAdmin, async (req, res) => {
    try {
        const filename = req.params.filename;

        if (!filename) {
            return res.status(400).json({ error: 'No filename provided' });
        }

        const result = await deleteImage(filename);

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
