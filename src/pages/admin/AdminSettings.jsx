import React, { useState, useEffect } from 'react';
import { getFilterSettings, updateFilterSettings } from '../../services/settingsService';
import { Plus, Trash2, Save, RotateCcw } from 'lucide-react';

const AdminSettings = () => {
    const [settings, setSettings] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // New item inputs
    const [newCategory, setNewCategory] = useState('');
    const [newPartType, setNewPartType] = useState('');
    const [newPartner, setNewPartner] = useState('');

    useEffect(() => {
        loadSettings();
    }, []);

    const loadSettings = async () => {
        setLoading(true);
        const data = await getFilterSettings();
        setSettings(data);
        setLoading(false);
    };

    const handleAddItem = (listName, item, setItem) => {
        if (!item.trim()) return;
        setSettings(prev => ({
            ...prev,
            [listName]: [...prev[listName], item.trim()]
        }));
        setItem('');
    };

    const handleRemoveItem = (listName, itemToRemove) => {
        setSettings(prev => ({
            ...prev,
            [listName]: prev[listName].filter(item => item !== itemToRemove)
        }));
    };

    const handleSave = async () => {
        setSaving(true);
        const success = await updateFilterSettings(settings);
        if (success) {
            alert('Configurações salvas com sucesso!');
        } else {
            alert('Erro ao salvar configurações.');
        }
        setSaving(false);
    };

    if (loading) return <div className="p-8 text-white">Carregando configurações...</div>;

    return (
        <div>
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-display font-bold text-white uppercase">
                    Configurações do Site
                </h1>
                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="bg-sick-red hover:bg-red-700 text-white px-6 py-2 rounded font-bold uppercase flex items-center gap-2 transition-colors disabled:opacity-50"
                >
                    <Save className="w-5 h-5" />
                    {saving ? 'Salvando...' : 'Salvar Alterações'}
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">

                {/* Categories Column */}
                <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
                    <h2 className="text-xl font-bold text-white mb-4 uppercase flex items-center gap-2">
                        Categorias Principais
                    </h2>
                    <div className="flex gap-2 mb-4">
                        <input
                            type="text"
                            value={newCategory}
                            onChange={(e) => setNewCategory(e.target.value)}
                            placeholder="Nova Categoria..."
                            className="bg-black border border-gray-700 rounded p-2 text-white flex-1 focus:border-sick-red focus:outline-none"
                            onKeyPress={(e) => e.key === 'Enter' && handleAddItem('categories', newCategory, setNewCategory)}
                        />
                        <button
                            onClick={() => handleAddItem('categories', newCategory, setNewCategory)}
                            className="bg-gray-800 hover:bg-gray-700 text-white p-2 rounded transition-colors"
                        >
                            <Plus className="w-5 h-5" />
                        </button>
                    </div>
                    <ul className="space-y-2 max-h-[500px] overflow-y-auto pr-2">
                        {settings.categories.map((cat, index) => (
                            <li key={index} className="flex justify-between items-center bg-black/50 p-2 rounded border border-gray-800">
                                <span className="text-gray-300">{cat}</span>
                                <button
                                    onClick={() => handleRemoveItem('categories', cat)}
                                    className="text-gray-500 hover:text-red-500 transition-colors"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </li>
                        ))}
                    </ul>
                </div>

                {/* Partners Column */}
                <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
                    <h2 className="text-xl font-bold text-white mb-4 uppercase flex items-center gap-2">
                        Parceiros / Marcas
                    </h2>
                    <div className="flex gap-2 mb-4">
                        <input
                            type="text"
                            value={newPartner}
                            onChange={(e) => setNewPartner(e.target.value)}
                            placeholder="Novo Parceiro..."
                            className="bg-black border border-gray-700 rounded p-2 text-white flex-1 focus:border-sick-red focus:outline-none"
                            onKeyPress={(e) => e.key === 'Enter' && handleAddItem('partners', newPartner, setNewPartner)}
                        />
                        <button
                            onClick={() => handleAddItem('partners', newPartner, setNewPartner)}
                            className="bg-gray-800 hover:bg-gray-700 text-white p-2 rounded transition-colors"
                        >
                            <Plus className="w-5 h-5" />
                        </button>
                    </div>
                    <ul className="space-y-2 max-h-[500px] overflow-y-auto pr-2">
                        {settings.partners.map((partner, index) => (
                            <li key={index} className="flex justify-between items-center bg-black/50 p-2 rounded border border-gray-800">
                                <span className="text-gray-300">{partner}</span>
                                <button
                                    onClick={() => handleRemoveItem('partners', partner)}
                                    className="text-gray-500 hover:text-red-500 transition-colors"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </li>
                        ))}
                    </ul>
                </div>

                {/* Part Types Column */}
                <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
                    <h2 className="text-xl font-bold text-white mb-4 uppercase flex items-center gap-2">
                        Tipos de Peça
                    </h2>
                    <div className="flex gap-2 mb-4">
                        <input
                            type="text"
                            value={newPartType}
                            onChange={(e) => setNewPartType(e.target.value)}
                            placeholder="Novo Tipo de Peça..."
                            className="bg-black border border-gray-700 rounded p-2 text-white flex-1 focus:border-sick-red focus:outline-none"
                            onKeyPress={(e) => e.key === 'Enter' && handleAddItem('partTypes', newPartType, setNewPartType)}
                        />
                        <button
                            onClick={() => handleAddItem('partTypes', newPartType, setNewPartType)}
                            className="bg-gray-800 hover:bg-gray-700 text-white p-2 rounded transition-colors"
                        >
                            <Plus className="w-5 h-5" />
                        </button>
                    </div>
                    <ul className="space-y-2 max-h-[500px] overflow-y-auto pr-2">
                        {settings.partTypes.map((type, index) => (
                            <li key={index} className="flex justify-between items-center bg-black/50 p-2 rounded border border-gray-800">
                                <span className="text-gray-300 text-sm">{type}</span>
                                <button
                                    onClick={() => handleRemoveItem('partTypes', type)}
                                    className="text-gray-500 hover:text-red-500 transition-colors"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </li>
                        ))}
                    </ul>
                </div>

            </div>
        </div>
    );
};

export default AdminSettings;
