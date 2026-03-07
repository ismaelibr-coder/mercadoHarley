const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

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

export const getFilterSettings = async () => {
    try {
        // Try backend endpoint first
        const resp = await fetch(`${API_URL}/api/settings/filters`);
        if (resp.ok) {
            const data = await resp.json();
            return { ...DEFAULT_SETTINGS, ...data };
        }
        console.warn('Settings endpoint not available, using defaults');
        return DEFAULT_SETTINGS;
    } catch (error) {
        console.warn('Settings fetch failed, using defaults', error);
        return DEFAULT_SETTINGS;
    }
};

export const updateFilterSettings = async (newSettings) => {
    try {
        const resp = await fetch(`${API_URL}/api/settings/filters`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newSettings)
        });
        return resp.ok;
    } catch (error) {
        console.error('Error updating settings via API:', error);
        return false;
    }
};
