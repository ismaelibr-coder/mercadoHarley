import express from 'express';
import multer from 'multer';
import { saveImage, deleteImage, saveVideo } from '../services/localUploadService.js';
import { verifyAdmin } from '../middleware/auth.js';
import logger from '../utils/logger.js';

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

// Separate multer instance for video: much bigger size ceiling, and a
// video/* filter instead of image/* — kept as its own upload() call rather
// than widening the image one so the 10MB image limit doesn't accidentally
// grow for product/banner photos.
const uploadVideo = multer({
    storage,
    limits: {
        fileSize: 80 * 1024 * 1024 // 80MB limit
    },
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('video/')) {
            cb(null, true);
        } else {
            cb(new Error('Only video files are allowed'), false);
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
        // multer populates non-file fields on req.body for upload.single(); 'purpose'
        // tells saveImage whether to normalize onto a white square canvas ('product')
        // or keep the image as-is ('banner' or anything else).
        const result = await saveImage(req.file, { baseUrl: uploadBaseUrl, purpose: req.body.purpose });

        res.json({
            success: true,
            url: result.url,
            filename: result.filename
        });
    } catch (error) {
        logger.error('Upload error:', error);
        // saveImage rejects files whose real content isn't a recognized image format —
        // that's a client input problem (400), not a server failure (500).
        if (error.message && error.message.includes('não reconhecido')) {
            return res.status(400).json({ error: error.message });
        }
        res.status(500).json({ error: 'Failed to upload image' });
    }
});

// POST /api/upload/video - Upload video (hero background, etc.)
router.post('/video', verifyAdmin, uploadVideo.single('video'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No video file provided' });
        }

        const uploadBaseUrl = process.env.UPLOADS_BASE_URL || `${req.protocol}://${req.get('host')}/uploads`;
        const result = await saveVideo(req.file, { baseUrl: uploadBaseUrl });

        res.json({
            success: true,
            url: result.url,
            filename: result.filename
        });
    } catch (error) {
        logger.error('Video upload error:', error);
        if (error.message && error.message.includes('não reconhecido')) {
            return res.status(400).json({ error: error.message });
        }
        res.status(500).json({ error: 'Failed to upload video' });
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
        logger.error('Delete error:', error);
        res.status(500).json({ error: 'Failed to delete image' });
    }
});

export default router;
