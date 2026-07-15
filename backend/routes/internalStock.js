import express from 'express';
import { verifyAdmin } from '../middleware/auth.js';
import { auditLog } from '../middleware/auditLog.js';
import {
    validateInternalStockItemCreate,
    validateInternalStockItemUpdate,
    validatePricingConfigPayload,
    validateSupplierPayload,
    validateSupplierUpdatePayload
} from '../middleware/validation.js';
import {
    createInternalStockItem,
    createSupplier,
    deactivateSupplier,
    deleteInternalStockItem,
    getInternalStockItemById,
    getPricingConfig,
    importSuppliersFromPartners,
    listInternalStockItems,
    listSuppliers,
    updateInternalStockItem,
    updatePricingConfig,
    updateSupplier
} from '../services/internalStockService.js';

const router = express.Router();

router.use(verifyAdmin);

router.get('/suppliers', async (req, res) => {
    try {
        const includeInactive = req.query.includeInactive === 'true';
        const suppliers = await listSuppliers({ includeInactive });
        res.json(suppliers);
    } catch (error) {
        console.error('Error listing suppliers:', error);
        res.status(500).json({ error: 'Failed to list suppliers' });
    }
});

router.post('/suppliers', validateSupplierPayload, async (req, res) => {
    try {
        const supplier = await createSupplier({ name: req.body.name });
        res.status(201).json({ success: true, supplier });
    } catch (error) {
        console.error('Error creating supplier:', error);
        if (error.message.includes('exists')) {
            return res.status(409).json({ error: error.message });
        }
        res.status(500).json({ error: 'Failed to create supplier' });
    }
});

router.put('/suppliers/:id', validateSupplierUpdatePayload, async (req, res) => {
    try {
        const supplier = await updateSupplier(req.params.id, req.body);
        res.json({ success: true, supplier });
    } catch (error) {
        console.error('Error updating supplier:', error);
        if (error.message.includes('not found')) {
            return res.status(404).json({ error: error.message });
        }
        if (error.message.includes('exists')) {
            return res.status(409).json({ error: error.message });
        }
        res.status(500).json({ error: 'Failed to update supplier' });
    }
});

router.delete('/suppliers/:id', async (req, res) => {
    try {
        const supplier = await deactivateSupplier(req.params.id);
        res.json({ success: true, supplier });
    } catch (error) {
        console.error('Error deactivating supplier:', error);
        if (error.message.includes('not found')) {
            return res.status(404).json({ error: error.message });
        }
        res.status(500).json({ error: 'Failed to deactivate supplier' });
    }
});

router.post('/suppliers/import-from-partners', async (req, res) => {
    try {
        const result = await importSuppliersFromPartners();
        res.json({ success: true, ...result });
    } catch (error) {
        console.error('Error importing suppliers from partners:', error);
        res.status(500).json({ error: 'Failed to import suppliers from partners' });
    }
});

router.get('/pricing-config', async (req, res) => {
    try {
        const config = await getPricingConfig();
        res.json(config);
    } catch (error) {
        console.error('Error getting pricing config:', error);
        res.status(500).json({ error: 'Failed to get pricing config' });
    }
});

router.put('/pricing-config', validatePricingConfigPayload, auditLog('UPDATE_INTERNAL_STOCK_PRICING_CONFIG'), async (req, res) => {
    try {
        const result = await updatePricingConfig({
            siteMarkupPercent: req.body.siteMarkupPercent,
            marketplaceMarkupPercent: req.body.marketplaceMarkupPercent,
            roundingStrategy: req.body.roundingStrategy,
            updatedBy: req.user?.email || req.user?.uid || null
        });
        res.json({ success: true, ...result });
    } catch (error) {
        console.error('Error updating pricing config:', error);
        res.status(500).json({ error: 'Failed to update pricing config' });
    }
});

router.get('/items', async (req, res) => {
    try {
        const items = await listInternalStockItems();
        res.json(items);
    } catch (error) {
        console.error('Error listing internal stock items:', error);
        res.status(500).json({ error: 'Failed to list internal stock items' });
    }
});

router.get('/items/:id', async (req, res) => {
    try {
        const item = await getInternalStockItemById(req.params.id);
        res.json(item);
    } catch (error) {
        console.error('Error getting internal stock item:', error);
        if (error.message.includes('not found')) {
            return res.status(404).json({ error: error.message });
        }
        res.status(500).json({ error: 'Failed to get internal stock item' });
    }
});

router.post('/items', validateInternalStockItemCreate, auditLog('CREATE_INTERNAL_STOCK_ITEM'), async (req, res) => {
    try {
        const item = await createInternalStockItem(req.body);
        res.status(201).json({ success: true, item });
    } catch (error) {
        console.error('Error creating internal stock item:', error);
        if (error.message.includes('Supplier')) {
            return res.status(400).json({ error: error.message });
        }
        res.status(500).json({ error: 'Failed to create internal stock item' });
    }
});

router.put('/items/:id', validateInternalStockItemUpdate, auditLog('UPDATE_INTERNAL_STOCK_ITEM'), async (req, res) => {
    try {
        const item = await updateInternalStockItem(req.params.id, req.body);
        res.json({ success: true, item });
    } catch (error) {
        console.error('Error updating internal stock item:', error);
        if (error.message.includes('not found')) {
            return res.status(404).json({ error: error.message });
        }
        if (error.message.includes('Supplier')) {
            return res.status(400).json({ error: error.message });
        }
        res.status(500).json({ error: 'Failed to update internal stock item' });
    }
});

router.delete('/items/:id', auditLog('DELETE_INTERNAL_STOCK_ITEM'), async (req, res) => {
    try {
        await deleteInternalStockItem(req.params.id);
        res.json({ success: true });
    } catch (error) {
        console.error('Error deleting internal stock item:', error);
        if (error.message.includes('not found')) {
            return res.status(404).json({ error: error.message });
        }
        res.status(500).json({ error: 'Failed to delete internal stock item' });
    }
});

export default router;
