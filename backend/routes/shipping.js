import express from 'express';
import { calculateShipping, getAllShippingRules, createShippingRule, updateShippingRule, deleteShippingRule } from '../services/shippingService.js';
import { verifyAdmin } from '../middleware/auth.js';
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

        // Use ONLY Melhor Envio API (no fallback to manual rules)
        const melhorEnvioOptions = await calculateMelhorEnvioShipping(cep, parseFloat(weight), dimensions);

        if (melhorEnvioOptions && melhorEnvioOptions.length > 0) {
            console.log('✅ Using Melhor Envio shipping options');
            return res.json(melhorEnvioOptions);
        }

        // If Melhor Envio fails, return error (no fallback)
        console.error('❌ Melhor Envio API failed or returned no options');
        console.error('⚠️ Verifique o token em: https://melhorenvio.com.br/painel/gerenciar/tokens');
        return res.status(503).json({
            error: 'Não foi possível calcular o frete. Verifique se o token do Melhor Envio está configurado corretamente.'
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
router.post('/rules', verifyAdmin, async (req, res) => {
    try {
        const ruleId = await createShippingRule(req.body);
        res.status(201).json({ id: ruleId });
    } catch (error) {
        console.error('Error creating shipping rule:', error);
        res.status(500).json({ error: error.message });
    }
});

// Update shipping rule (admin only)
router.put('/rules/:id', verifyAdmin, async (req, res) => {
    try {
        await updateShippingRule(req.params.id, req.body);
        res.json({ success: true });
    } catch (error) {
        console.error('Error updating shipping rule:', error);
        res.status(500).json({ error: error.message });
    }
});

// Delete shipping rule (admin only)
router.delete('/rules/:id', verifyAdmin, async (req, res) => {
    try {
        await deleteShippingRule(req.params.id);
        res.json({ success: true });
    } catch (error) {
        console.error('Error deleting shipping rule:', error);
        res.status(500).json({ error: error.message });
    }
});

export default router;
