import { db } from './firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';

const SETTINGS_DOC_REF = doc(db, 'settings', 'filters');

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
        const docSnap = await getDoc(SETTINGS_DOC_REF);
        if (docSnap.exists()) {
            return { ...DEFAULT_SETTINGS, ...docSnap.data() };
        } else {
            // Initialize with defaults if not exists
            await setDoc(SETTINGS_DOC_REF, DEFAULT_SETTINGS);
            return DEFAULT_SETTINGS;
        }
    } catch (error) {
        console.error("Error fetching settings:", error);
        return DEFAULT_SETTINGS;
    }
};

export const updateFilterSettings = async (newSettings) => {
    try {
        await setDoc(SETTINGS_DOC_REF, newSettings, { merge: true });
        return true;
    } catch (error) {
        console.error("Error updating settings:", error);
        return false;
    }
};
