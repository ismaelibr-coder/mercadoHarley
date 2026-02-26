import express from 'express';
import { createProduct, getAllProducts, getProductById, updateProduct, deleteProduct } from '../services/databaseService.js';
import { validateProduct } from '../middleware/validation.js';
import { verifyAdmin } from '../middleware/auth.js';
import { auditLog } from '../middleware/auditLog.js';

const router = express.Router();

/**
 * GET /api/products
 * Get all products
 */
router.get('/', async (req, res) => {
    try {
        const products = await getAllProducts();
        res.json(products);
    } catch (error) {
        console.error('Error fetching products:', error);
        res.status(500).json({ error: 'Failed to fetch products' });
    }
});

/**
 * GET /api/products/:id
 * Get product by ID
 */
router.get('/:id', async (req, res) => {
    try {
        const product = await getProductById(req.params.id);
        res.json(product);
    } catch (error) {
        console.error('Error fetching product:', error);
        if (error.message.includes('not found')) {
            return res.status(404).json({ error: 'Product not found' });
        }
        res.status(500).json({ error: 'Failed to fetch product' });
    }
});

/**
 * POST /api/products
 * Create product (requires admin)
 */
router.post('/', verifyAdmin, validateProduct, auditLog('CREATE_PRODUCT'), async (req, res) => {
    try {
        const productData = req.body;
        const product = await createProduct(productData);
        res.status(201).json({
            success: true,
            product,
            message: 'Product created successfully'
        });
    } catch (error) {
        console.error('Error creating product:', error);
        res.status(500).json({ error: error.message || 'Failed to create product' });
    }
});

/**
 * PUT /api/products/:id
 * Update product (requires admin)
 */
router.put('/:id', verifyAdmin, auditLog('UPDATE_PRODUCT'), async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = req.body;
        
        const product = await updateProduct(id, updateData);
        res.json({
            success: true,
            product,
            message: 'Product updated successfully'
        });
    } catch (error) {
        console.error('Error updating product:', error);
        if (error.message.includes('not found')) {
            return res.status(404).json({ error: 'Product not found' });
        }
        res.status(500).json({ error: error.message || 'Failed to update product' });
    }
});

/**
 * DELETE /api/products/:id
 * Delete product (requires admin)
 */
router.delete('/:id', verifyAdmin, auditLog('DELETE_PRODUCT'), async (req, res) => {
    try {
        const { id } = req.params;
        await deleteProduct(id);
        res.json({
            success: true,
            message: 'Product deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting product:', error);
        if (error.message.includes('not found')) {
            return res.status(404).json({ error: 'Product not found' });
        }
        res.status(500).json({ error: error.message || 'Failed to delete product' });
    }
});

export default router;
