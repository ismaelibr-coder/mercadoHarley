import crypto from 'crypto';
import fs from 'fs';
import fsPromises from 'fs/promises';
import path from 'path';
import dotenv from 'dotenv';
import sharp from 'sharp';

dotenv.config();

const resolveUploadsDir = () => {
    if (process.env.UPLOADS_DIR) return process.env.UPLOADS_DIR;

    const candidates = [
        '/var/www/mercadoHarley/repo/uploads',
        '/var/www/mercadoHarley/uploads',
        path.resolve(process.cwd(), '../uploads'),
        path.resolve(process.cwd(), './uploads')
    ];

    const countFiles = (dirPath) => {
        try {
            if (!fs.existsSync(dirPath)) return -1;
            return fs.readdirSync(dirPath).length;
        } catch (error) {
            return -1;
        }
    };

    const existing = candidates
        .filter(candidate => fs.existsSync(candidate))
        .sort((a, b) => countFiles(b) - countFiles(a));

    return existing[0] || path.resolve(process.cwd(), '../uploads');
};

const uploadsDir = resolveUploadsDir();
const fallbackUploadsBaseUrl = process.env.UPLOADS_BASE_URL
    || `${process.env.FRONTEND_URL || 'http://localhost:3000'}/uploads`;

const ensureUploadsDir = async () => {
    await fsPromises.mkdir(uploadsDir, { recursive: true });
};

// Detects the real image format from its magic bytes — never trust the client-supplied
// mimetype/filename extension (both are just header/form fields, trivially spoofable).
const IMAGE_SIGNATURES = [
    {
        ext: '.png',
        check: (b) => b.length >= 8 && b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4E && b[3] === 0x47
            && b[4] === 0x0D && b[5] === 0x0A && b[6] === 0x1A && b[7] === 0x0A
    },
    {
        ext: '.jpg',
        check: (b) => b.length >= 3 && b[0] === 0xFF && b[1] === 0xD8 && b[2] === 0xFF
    },
    {
        ext: '.gif',
        check: (b) => b.length >= 6 && (b.toString('ascii', 0, 6) === 'GIF87a' || b.toString('ascii', 0, 6) === 'GIF89a')
    },
    {
        ext: '.webp',
        check: (b) => b.length >= 12 && b.toString('ascii', 0, 4) === 'RIFF' && b.toString('ascii', 8, 12) === 'WEBP'
    }
];

const detectImageType = (buffer) => IMAGE_SIGNATURES.find(sig => sig.check(buffer)) || null;

const buildFilename = (detectedType) => {
    const token = crypto.randomBytes(8).toString('hex');
    return `${Date.now()}-${token}${detectedType.ext}`;
};

// Product photos come from many different sellers/phones/backgrounds, so we normalize
// them onto a consistent white square canvas at upload time (not just at display time —
// display-time object-contain can't fix an image that's already inconsistent at rest,
// e.g. different aspect ratios or non-white backgrounds showing through transparency).
// Fit is 'contain': the whole original photo is always preserved, never cropped — this
// only pads/flattens, it can't recover content a photo never captured in the first place.
const PRODUCT_IMAGE_SIZE = 1200;

const normalizeProductImage = async (buffer) => {
    const normalized = await sharp(buffer)
        .resize(PRODUCT_IMAGE_SIZE, PRODUCT_IMAGE_SIZE, {
            fit: 'contain',
            background: { r: 255, g: 255, b: 255, alpha: 1 }
        })
        .flatten({ background: { r: 255, g: 255, b: 255 } })
        .jpeg({ quality: 88 })
        .toBuffer();
    return { buffer: normalized, ext: '.jpg' };
};

export const saveImage = async (file, options = {}) => {
    await ensureUploadsDir();

    const detectedType = detectImageType(file.buffer);
    if (!detectedType) {
        throw new Error('Arquivo não reconhecido como uma imagem válida (PNG, JPEG, GIF ou WEBP)');
    }

    let outputBuffer = file.buffer;
    let outputType = detectedType;

    // Only product photos get the white-canvas treatment — banners keep their natural
    // aspect ratio (they're already designed as wide/lifestyle shots), and animated GIFs
    // are skipped since sharp/jpeg output would flatten them to a single frame.
    if (options.purpose === 'product' && detectedType.ext !== '.gif') {
        try {
            const result = await normalizeProductImage(file.buffer);
            outputBuffer = result.buffer;
            outputType = { ext: result.ext };
        } catch (error) {
            console.error('Image normalization failed, saving original upload instead:', error);
            outputBuffer = file.buffer;
            outputType = detectedType;
        }
    }

    const filename = buildFilename(outputType);
    const filePath = path.join(uploadsDir, filename);
    const uploadsBaseUrl = options.baseUrl || fallbackUploadsBaseUrl;

    // Normalize URL to use /api/uploads path which works through nginx
    const url = uploadsBaseUrl.replace(/\/uploads$/, '/api/uploads') + `/${filename}`;

    await fsPromises.writeFile(filePath, outputBuffer);

    return {
        filename,
        url,
        path: filePath
    };
};

export const deleteImage = async (filename) => {
    const safeName = path.basename(filename);
    const filePath = path.join(uploadsDir, safeName);

    await fsPromises.unlink(filePath);

    return { deleted: true, filename: safeName };
};

export default {
    saveImage,
    deleteImage
};
