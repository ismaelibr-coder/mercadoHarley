import express from 'express';
import { createProduct, getAllProducts as getProducts } from '../services/firebaseService.js';

const router = express.Router();

// GET all products
router.get('/', async (req, res) => {
    try {
        const products = await getProducts();
        res.json(products);
    } catch (error) {
        console.error('Error fetching products:', error);
        res.status(500).json({ error: 'Failed to fetch products' });
    }
});

// POST create product
router.post('/', async (req, res) => {
    try {
        const productData = req.body;
        const productId = await createProduct(productData);
        res.status(201).json({
            success: true,
            id: productId,
            message: 'Product created successfully'
        });
    } catch (error) {
        console.error('Error creating product:', error);
        res.status(500).json({ error: 'Failed to create product' });
    }
});

export default router;
