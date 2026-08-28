import crypto from 'crypto';
import fs from 'fs';
import fsPromises from 'fs/promises';
import path from 'path';
import dotenv from 'dotenv';

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

export const saveImage = async (file, options = {}) => {
    await ensureUploadsDir();

    const detectedType = detectImageType(file.buffer);
    if (!detectedType) {
        throw new Error('Arquivo não reconhecido como uma imagem válida (PNG, JPEG, GIF ou WEBP)');
    }

    const filename = buildFilename(detectedType);
    const filePath = path.join(uploadsDir, filename);
    const uploadsBaseUrl = options.baseUrl || fallbackUploadsBaseUrl;

    // Normalize URL to use /api/uploads path which works through nginx
    const url = uploadsBaseUrl.replace(/\/uploads$/, '/api/uploads') + `/${filename}`;

    await fsPromises.writeFile(filePath, file.buffer);

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
