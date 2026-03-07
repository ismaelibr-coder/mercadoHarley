import express from 'express';
import { verifyAdmin } from '../middleware/auth.js';

const router = express.Router();

// Default settings (can be moved to database later)
const DEFAULT_SETTINGS = {
    categories: [
        'Peças',
        'Acessórios',
        'Vestuário',
        'Elétrica',
        'Customização',
        'Manutenção',
        'Outros'
    ],
    partTypes: [
        'Parabrisas E Carenagem',
        'Banco Alforge Mala Sissybar',
        'Carburador',
        'Comando Manete Guidao Manopla',
        'Cabos Acelerador e Embreagem',
        'Elétrica Injecao Sensores',
        'Iluminacao',
        'Escapamentos e Ponteiras',
        'Ferramentas Capas Itens Gerais',
        'Filtros Ar Óleo Gas Mangueiras',
        'Freios Pastilhas Reparos',
        'Juntas Vedações Retentores',
        'Lubrificantes e Fluidos',
        'Motor',
        'Primaria Embreagem Transmissão',
        'Pneus Rodas Cameras Bicos',
        'Rolamentos',
        'Chassi Balanca Amortecedor',
        'Tanque Óleo Gasolina',
        'Buell',
        'Parafusos Porcas Arruelas',
        'Manuais de Serviço e Manutenção para Harley',
        'Indian',
        'Paralamas',
        'Audio Comunicacao e Suportes'
    ],
    partners: [
        'Shinko',
        'Pavilhão Oficina & Performance',
        'Dillenburg Kustom',
        'Torbal Motorcycle Exhaust',
        'Wings Custom',
        '20W50 Co.',
        'Outros'
    ]
};

// Get filter settings (categories, partTypes, partners)
router.get('/filters', (req, res) => {
    try {
        res.json(DEFAULT_SETTINGS);
    } catch (error) {
        console.error('Error getting settings:', error);
        res.status(500).json({ error: 'Failed to get settings' });
    }
});

// Update filter settings (admin only)
router.put('/filters', verifyAdmin, (req, res) => {
    try {
        const { categories, partTypes, partners } = req.body;
        
        // For now, just validate and return success
        // TODO: Save to database when Settings model is implemented
        if (categories && Array.isArray(categories)) {
            DEFAULT_SETTINGS.categories = categories;
        }
        if (partTypes && Array.isArray(partTypes)) {
            DEFAULT_SETTINGS.partTypes = partTypes;
        }
        if (partners && Array.isArray(partners)) {
            DEFAULT_SETTINGS.partners = partners;
        }
        
        res.json({ success: true, settings: DEFAULT_SETTINGS });
    } catch (error) {
        console.error('Error updating settings:', error);
        res.status(500).json({ error: 'Failed to update settings' });
    }
});

export default router;
