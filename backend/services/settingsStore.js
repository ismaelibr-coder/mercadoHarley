const DEFAULT_FILTER_SETTINGS = {
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

const clone = (value) => JSON.parse(JSON.stringify(value));

let filterSettingsState = clone(DEFAULT_FILTER_SETTINGS);

export const getFilterSettings = () => clone(filterSettingsState);

export const updateFilterSettings = ({ categories, partTypes, partners } = {}) => {
    if (Array.isArray(categories)) {
        filterSettingsState.categories = categories;
    }
    if (Array.isArray(partTypes)) {
        filterSettingsState.partTypes = partTypes;
    }
    if (Array.isArray(partners)) {
        filterSettingsState.partners = partners;
    }

    return getFilterSettings();
};

export const getDefaultFilterSettings = () => clone(DEFAULT_FILTER_SETTINGS);
