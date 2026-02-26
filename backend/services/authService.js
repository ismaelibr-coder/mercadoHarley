import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { User } from '../models/index.js';
import dotenv from 'dotenv';

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-key-change-this-in-production';
const JWT_EXPIRY = process.env.JWT_EXPIRY || '7d';
const REFRESH_TOKEN_EXPIRY = process.env.REFRESH_TOKEN_EXPIRY || '30d';

/**
 * Hash password
 */
export const hashPassword = async (password) => {
    const salt = await bcrypt.genSalt(10);
    return bcrypt.hash(password, salt);
};

/**
 * Compare password
 */
export const comparePassword = async (password, hashedPassword) => {
    return bcrypt.compare(password, hashedPassword);
};

/**
 * Generate JWT token
 */
export const generateToken = (userId, email, isAdmin = false) => {
    return jwt.sign(
        {
            uid: userId,
            email,
            isAdmin
        },
        JWT_SECRET,
        {
            expiresIn: JWT_EXPIRY
        }
    );
};

/**
 * Generate Refresh Token
 */
export const generateRefreshToken = (userId) => {
    return jwt.sign(
        { uid: userId },
        JWT_SECRET,
        {
            expiresIn: REFRESH_TOKEN_EXPIRY
        }
    );
};

/**
 * Verify JWT token
 */
export const verifyToken = (token) => {
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        return decoded;
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            throw new Error('Token expired');
        }
        throw new Error('Invalid token');
    }
};

/**
 * Login user
 */
export const loginUser = async (email, password) => {
    try {
        const user = await User.findOne({
            where: { email: email.toLowerCase() }
        });

        if (!user) {
            throw new Error('User not found');
        }

        const isPasswordValid = await comparePassword(password, user.password);
        if (!isPasswordValid) {
            throw new Error('Invalid password');
        }

        const token = generateToken(user.id, user.email, user.isAdmin);
        const refreshToken = generateRefreshToken(user.id);

        return {
            token,
            refreshToken,
            user: {
                uid: user.id,
                email: user.email,
                name: user.name,
                isAdmin: user.isAdmin
            }
        };
    } catch (error) {
        console.error('Login error:', error);
        throw error;
    }
};

/**
 * Register user
 */
export const registerUser = async (userData) => {
    try {
        const { email, password, name, phone, cpf } = userData;

        // Check if user exists
        const existingUser = await User.findOne({
            where: { email: email.toLowerCase() }
        });

        if (existingUser) {
            throw new Error('User already exists');
        }

        // Hash password
        const hashedPassword = await hashPassword(password);

        // Create user
        const user = await User.create({
            id: `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            email: email.toLowerCase(),
            password: hashedPassword,
            name,
            phone,
            cpf,
            isAdmin: false
        });

        const token = generateToken(user.id, user.email, user.isAdmin);
        const refreshToken = generateRefreshToken(user.id);

        return {
            token,
            refreshToken,
            user: {
                uid: user.id,
                email: user.email,
                name: user.name,
                isAdmin: user.isAdmin
            }
        };
    } catch (error) {
        console.error('Register error:', error);
        throw error;
    }
};

/**
 * Refresh access token
 */
export const refreshAccessToken = async (refreshToken) => {
    try {
        const decoded = verifyToken(refreshToken);
        const user = await User.findByPk(decoded.uid);

        if (!user) {
            throw new Error('User not found');
        }

        const newToken = generateToken(user.id, user.email, user.isAdmin);

        return {
            token: newToken
        };
    } catch (error) {
        console.error('Refresh token error:', error);
        throw error;
    }
};
