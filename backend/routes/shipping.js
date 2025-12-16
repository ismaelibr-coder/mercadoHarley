import express from 'express';
import { calculateShipping, getAllShippingRules, createShippingRule, updateShippingRule, deleteShippingRule } from '../services/shippingService.js';
import { verifyToken, isUserAdmin } from '../services/firebaseService.js';
import { calculateMelhorEnvioShipping } from '../services/melhorEnvioService.js';

const router = express.Router();

// Calculate shipping (public endpoint)
router.post('/calculate', async (req, res) => {
    try {
        const { cep, weight, dimensions } = req.body;

        if (!cep || !weight) {
            return res.status(400).json({ error: 'CEP e peso são obrigatórios' });
        }

        // 1. Try Melhor Envio (External API)
        const melhorEnvioOptions = await calculateMelhorEnvioShipping(cep, parseFloat(weight), dimensions);

        if (melhorEnvioOptions && melhorEnvioOptions.length > 0) {
            return res.json(melhorEnvioOptions);
        } else {
            console.error('Melhor Envio returned no options or failed.');
            return res.status(503).json({ error: 'Serviço de cálculo de frete indisponível no momento.' });
        }
    } catch (error) {
        console.error('Error calculating shipping:', error);
        res.status(500).json({ error: error.message });
    }
});

// Get all shipping rules (admin only)
router.get('/rules', async (req, res) => {
    try {
        const token = req.headers.authorization?.split('Bearer ')[1];
        if (!token) {
            return res.status(401).json({ error: 'Token não fornecido' });
        }

        const decodedToken = await verifyToken(token);
        const isAdmin = await isUserAdmin(decodedToken.uid);

        if (!isAdmin) {
            return res.status(403).json({ error: 'Acesso negado' });
        }

        const rules = await getAllShippingRules();
        res.json(rules);
    } catch (error) {
        console.error('Error getting shipping rules:', error);
        res.status(500).json({ error: error.message });
    }
});

// Create shipping rule (admin only)
router.post('/rules', async (req, res) => {
    try {
        const token = req.headers.authorization?.split('Bearer ')[1];
        if (!token) {
            return res.status(401).json({ error: 'Token não fornecido' });
        }

        const decodedToken = await verifyToken(token);
        const isAdmin = await isUserAdmin(decodedToken.uid);

        if (!isAdmin) {
            return res.status(403).json({ error: 'Acesso negado' });
        }

        const ruleId = await createShippingRule(req.body);
        res.status(201).json({ id: ruleId });
    } catch (error) {
        console.error('Error creating shipping rule:', error);
        res.status(500).json({ error: error.message });
    }
});

// Update shipping rule (admin only)
router.put('/rules/:id', async (req, res) => {
    try {
        const token = req.headers.authorization?.split('Bearer ')[1];
        if (!token) {
            return res.status(401).json({ error: 'Token não fornecido' });
        }

        const decodedToken = await verifyToken(token);
        const isAdmin = await isUserAdmin(decodedToken.uid);

        if (!isAdmin) {
            return res.status(403).json({ error: 'Acesso negado' });
        }

        await updateShippingRule(req.params.id, req.body);
        res.json({ success: true });
    } catch (error) {
        console.error('Error updating shipping rule:', error);
        res.status(500).json({ error: error.message });
    }
});

// Delete shipping rule (admin only)
router.delete('/rules/:id', async (req, res) => {
    try {
        const token = req.headers.authorization?.split('Bearer ')[1];
        if (!token) {
            return res.status(401).json({ error: 'Token não fornecido' });
        }

        const decodedToken = await verifyToken(token);
        const isAdmin = await isUserAdmin(decodedToken.uid);

        if (!isAdmin) {
            return res.status(403).json({ error: 'Acesso negado' });
        }

        await deleteShippingRule(req.params.id);
        res.json({ success: true });
    } catch (error) {
        console.error('Error deleting shipping rule:', error);
        res.status(500).json({ error: error.message });
    }
});

export default router;
