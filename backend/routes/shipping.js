import express from 'express';
import { calculateShipping, getAllShippingRules, createShippingRule, updateShippingRule, deleteShippingRule } from '../services/shippingService.js';
import { verifyAdmin, authenticate } from '../middleware/auth.js';
import { calculateMelhorEnvioShipping } from '../services/melhorEnvioService.js';

const router = express.Router();

// Calculate shipping (public endpoint)
router.post('/calculate', async (req, res) => {
    try {
        const { cep, weight, dimensions } = req.body;

        if (!cep || !weight) {
            return res.status(400).json({ error: 'CEP e peso são obrigatórios' });
        }

        // Validate CEP format
        const cleanCep = cep.replace(/\D/g, '');
        if (cleanCep.length !== 8) {
            return res.status(400).json({
                error: 'CEP inválido. Digite um CEP válido com 8 dígitos.'
            });
        }

        // Try Melhor Envio API first
        const melhorEnvioOptions = await calculateMelhorEnvioShipping(cep, parseFloat(weight), dimensions);

        if (melhorEnvioOptions && melhorEnvioOptions.length > 0) {
            console.log('✅ Using Melhor Envio shipping options');
            return res.json(melhorEnvioOptions);
        }

        // Fallback to manual rules if Melhor Envio fails (TEMPORARY until token is fixed)
        console.warn('⚠️ Melhor Envio failed, falling back to manual shipping rules');
        console.warn('⚠️ ACTION REQUIRED: Update MELHOR_ENVIO_TOKEN in .env with valid token');
        console.warn('⚠️ Get new token at: https://melhorenvio.com.br/painel/gerenciar/tokens');
        
        const manualOptions = await calculateShipping(cep, parseFloat(weight));
        
        if (manualOptions && manualOptions.length > 0) {
            console.log('📦 Using manual shipping rules as fallback');
            return res.json(manualOptions);
        }

        // If both methods fail, return error
        console.error('❌ Both Melhor Envio and manual rules failed');
        return res.status(503).json({
            error: 'Não foi possível calcular o frete no momento. Por favor, tente novamente em alguns instantes ou entre em contato conosco para consultar o valor do frete.'
        });
    } catch (error) {
        console.error('Error calculating shipping:', error);

        // Return specific error message if available
        if (error.message.includes('CEP')) {
            return res.status(400).json({ error: error.message });
        }

        res.status(500).json({
            error: 'Erro ao calcular frete. Por favor, tente novamente ou entre em contato.'
        });
    }
});

// Get all shipping rules (admin only)
router.get('/rules', verifyAdmin, async (req, res) => {
    try {
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
