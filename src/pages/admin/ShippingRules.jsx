import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Edit, Save, X, Truck } from 'lucide-react';
import { getShippingRules, createShippingRule, updateShippingRule, deleteShippingRule } from '../../services/shippingService';
import { useAuth } from '../../context/AuthContext';

const ShippingRules = () => {
    const { currentUser } = useAuth();
    const [rules, setRules] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [editingId, setEditingId] = useState(null);
    const [isCreating, setIsCreating] = useState(false);

    // Form state
    const [formData, setFormData] = useState({
        name: '',
        states: '',
        minWeight: 0,
        maxWeight: 5,
        price: 0,
        deliveryDays: 0
    });

    useEffect(() => {
        if (currentUser) {
            loadRules();
        } else {
            setLoading(false);
        }
    }, [currentUser]);

    const loadRules = async () => {
        try {
            setLoading(true);
            if (!currentUser) {
                setError('Usuário não autenticado');
                setLoading(false);
                return;
            }
            const token = await currentUser.getIdToken();
            const data = await getShippingRules(token);
            setRules(data);
        } catch (err) {
            setError('Erro ao carregar regras de frete');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (rule) => {
        setEditingId(rule.id);
        setFormData({
            name: rule.name,
            states: rule.states.join(', '),
            minWeight: rule.minWeight,
            maxWeight: rule.maxWeight,
            price: rule.price,
            deliveryDays: rule.deliveryDays
        });
        setIsCreating(false);
    };

    const handleCreate = () => {
        setIsCreating(true);
        setEditingId(null);
        setFormData({
            name: '',
            states: '',
            minWeight: 0,
            maxWeight: 5,
            price: 0,
            deliveryDays: 0
        });
    };

    const handleCancel = () => {
        setEditingId(null);
        setIsCreating(false);
        setError('');
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Tem certeza que deseja excluir esta regra?')) return;

        if (!currentUser) {
            setError('Usuário não autenticado');
            return;
        }

        try {
            const token = await currentUser.getIdToken();
            await deleteShippingRule(token, id);
            setRules(rules.filter(r => r.id !== id));
        } catch (err) {
            setError('Erro ao excluir regra');
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!currentUser) {
            setError('Usuário não autenticado');
            return;
        }

        try {
            const token = await currentUser.getIdToken();

            const ruleData = {
                ...formData,
                states: formData.states.split(',').map(s => s.trim().toUpperCase()).filter(s => s),
                minWeight: parseFloat(formData.minWeight),
                maxWeight: parseFloat(formData.maxWeight),
                price: parseFloat(formData.price),
                deliveryDays: parseInt(formData.deliveryDays)
            };

            if (isCreating) {
                const newRule = await createShippingRule(token, ruleData);
                setRules([...rules, { id: newRule.id, ...ruleData }]);
            } else {
                await updateShippingRule(token, editingId, ruleData);
                setRules(rules.map(r => r.id === editingId ? { ...r, ...ruleData } : r));
            }

            handleCancel();
        } catch (err) {
            setError('Erro ao salvar regra');
            console.error(err);
        }
    };

    if (loading) return <div className="text-white">Carregando...</div>;

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-white flex items-center gap-2">
                    <Truck className="text-harley-orange" />
                    Regras de Frete
                </h1>
                <button
                    onClick={handleCreate}
                    className="bg-harley-orange text-white px-4 py-2 rounded flex items-center gap-2 hover:bg-orange-600"
                >
                    <Plus size={20} />
                    Nova Regra
                </button>
            </div>

            {error && (
                <div className="bg-red-500/10 border border-red-500 text-red-500 p-4 rounded mb-6">
                    {error}
                </div>
            )}

            {(isCreating || editingId) && (
                <div className="bg-gray-900 p-6 rounded-lg mb-6 border border-gray-800">
                    <h3 className="text-xl font-bold text-white mb-4">
                        {isCreating ? 'Nova Regra' : 'Editar Regra'}
                    </h3>
                    <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-gray-400 mb-1">Nome</label>
                            <input
                                type="text"
                                value={formData.name}
                                onChange={e => setFormData({ ...formData, name: e.target.value })}
                                className="w-full bg-black border border-gray-700 rounded px-3 py-2 text-white"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-gray-400 mb-1">Estados (separados por vírgula)</label>
                            <input
                                type="text"
                                value={formData.states}
                                onChange={e => setFormData({ ...formData, states: e.target.value })}
                                placeholder="SP, RJ, MG"
                                className="w-full bg-black border border-gray-700 rounded px-3 py-2 text-white"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-gray-400 mb-1">Peso Mínimo (kg)</label>
                            <input
                                type="number"
                                step="0.1"
                                value={formData.minWeight}
                                onChange={e => setFormData({ ...formData, minWeight: e.target.value })}
                                className="w-full bg-black border border-gray-700 rounded px-3 py-2 text-white"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-gray-400 mb-1">Peso Máximo (kg)</label>
                            <input
                                type="number"
                                step="0.1"
                                value={formData.maxWeight}
                                onChange={e => setFormData({ ...formData, maxWeight: e.target.value })}
                                className="w-full bg-black border border-gray-700 rounded px-3 py-2 text-white"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-gray-400 mb-1">Preço (R$)</label>
                            <input
                                type="number"
                                step="0.01"
                                value={formData.price}
                                onChange={e => setFormData({ ...formData, price: e.target.value })}
                                className="w-full bg-black border border-gray-700 rounded px-3 py-2 text-white"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-gray-400 mb-1">Prazo (dias)</label>
                            <input
                                type="number"
                                value={formData.deliveryDays}
                                onChange={e => setFormData({ ...formData, deliveryDays: e.target.value })}
                                className="w-full bg-black border border-gray-700 rounded px-3 py-2 text-white"
                                required
                            />
                        </div>
                        <div className="col-span-2 flex justify-end gap-2 mt-4">
                            <button
                                type="button"
                                onClick={handleCancel}
                                className="px-4 py-2 text-gray-400 hover:text-white"
                            >
                                Cancelar
                            </button>
                            <button
                                type="submit"
                                className="bg-harley-orange text-white px-6 py-2 rounded hover:bg-orange-600 flex items-center gap-2"
                            >
                                <Save size={20} />
                                Salvar
                            </button>
                        </div>
                    </form>
                </div>
            )}

            <div className="bg-gray-900 rounded-lg border border-gray-800 overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-gray-800 text-gray-400">
                        <tr>
                            <th className="p-4">Nome</th>
                            <th className="p-4">Estados</th>
                            <th className="p-4">Peso (kg)</th>
                            <th className="p-4">Preço</th>
                            <th className="p-4">Prazo</th>
                            <th className="p-4 text-right">Ações</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-800">
                        {rules.map(rule => (
                            <tr key={rule.id} className="text-gray-300 hover:bg-gray-800/50">
                                <td className="p-4 font-medium text-white">{rule.name}</td>
                                <td className="p-4">
                                    <div className="flex flex-wrap gap-1">
                                        {(rule.states || []).map(state => (
                                            <span key={state} className="bg-gray-800 px-2 py-0.5 rounded text-xs">
                                                {state}
                                            </span>
                                        ))}
                                    </div>
                                </td>
                                <td className="p-4">{rule.minWeight} - {rule.maxWeight}</td>
                                <td className="p-4">R$ {(rule.price || 0).toFixed(2)}</td>
                                <td className="p-4">{rule.deliveryDays} dias</td>
                                <td className="p-4 text-right">
                                    <div className="flex justify-end gap-2">
                                        <button
                                            onClick={() => handleEdit(rule)}
                                            className="p-2 hover:bg-gray-700 rounded text-blue-400"
                                            title="Editar"
                                        >
                                            <Edit size={18} />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(rule.id)}
                                            className="p-2 hover:bg-gray-700 rounded text-red-400"
                                            title="Excluir"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                        {rules.length === 0 && (
                            <tr>
                                <td colspan="6" className="p-8 text-center text-gray-500">
                                    Nenhuma regra de frete cadastrada.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default ShippingRules;
