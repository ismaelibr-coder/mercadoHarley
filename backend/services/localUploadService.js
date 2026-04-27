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

const getExtension = (file) => {
    const ext = path.extname(file.originalname || '');
    if (ext) return ext.toLowerCase();

    const mime = file.mimetype || '';
    if (mime === 'image/png') return '.png';
    if (mime === 'image/jpeg') return '.jpg';
    if (mime === 'image/webp') return '.webp';
    if (mime === 'image/gif') return '.gif';
    return '.bin';
};

const buildFilename = (file) => {
    const ext = getExtension(file);
    const token = crypto.randomBytes(8).toString('hex');
    return `${Date.now()}-${token}${ext}`;
};

export const saveImage = async (file, options = {}) => {
    await ensureUploadsDir();

    const filename = buildFilename(file);
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
