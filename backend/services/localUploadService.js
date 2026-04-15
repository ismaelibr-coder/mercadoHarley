import crypto from 'crypto';
import fs from 'fs/promises';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

const uploadsDir = process.env.UPLOADS_DIR || path.resolve(process.cwd(), '../uploads');
const fallbackUploadsBaseUrl = process.env.UPLOADS_BASE_URL
    || `${process.env.FRONTEND_URL || 'http://localhost:3000'}/uploads`;

const ensureUploadsDir = async () => {
    await fs.mkdir(uploadsDir, { recursive: true });
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

    await fs.writeFile(filePath, file.buffer);

    return {
        filename,
        url: `${uploadsBaseUrl}/${filename}`,
        path: filePath
    };
};

export const deleteImage = async (filename) => {
    const safeName = path.basename(filename);
    const filePath = path.join(uploadsDir, safeName);

    await fs.unlink(filePath);

    return { deleted: true, filename: safeName };
};

export default {
    saveImage,
    deleteImage
};
