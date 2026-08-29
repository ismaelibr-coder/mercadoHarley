import React, { useEffect, useMemo, useState } from 'react';
import {
    Save,
    RefreshCw,
    Plus,
    Trash2,
    Pencil,
    Boxes,
    Factory,
    TrendingUp
} from 'lucide-react';
import {
    createInternalStockItem,
    createSupplier,
    deleteInternalStockItem,
    deleteSupplier,
    getInternalStockItems,
    getPricingConfig,
    getSuppliers,
    importSuppliersFromPartners,
    updateInternalStockItem,
    updatePricingConfig
} from '../../services/internalStockService';
import { useToast } from '../../components/ui/ToastProvider';
import { useConfirm } from '../../components/ui/ConfirmDialogProvider';

const initialItemForm = {
    name: '',
    description: '',
    quantity: '0',
    unitCost: '',
    supplierId: ''
};

const formatMoney = (value) => new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
}).format(Number(value || 0));

const AdminInternalStock = () => {
    const { showToast } = useToast();
    const confirm = useConfirm();
    const [loading, setLoading] = useState(true);
    const [savingConfig, setSavingConfig] = useState(false);
    const [savingItem, setSavingItem] = useState(false);
    const [savingSupplier, setSavingSupplier] = useState(false);
    const [importingSuppliers, setImportingSuppliers] = useState(false);

    const [pricingConfig, setPricingConfig] = useState({
        siteMarkupPercent: 0,
        marketplaceMarkupPercent: 0
    });

    const [suppliers, setSuppliers] = useState([]);
    const [items, setItems] = useState([]);

    const [newSupplierName, setNewSupplierName] = useState('');
    const [editingItemId, setEditingItemId] = useState(null);
    const [itemForm, setItemForm] = useState(initialItemForm);

    useEffect(() => {
        loadAll();
    }, []);

    const loadAll = async () => {
        setLoading(true);
        try {
            const [configData, supplierData, itemData] = await Promise.all([
                getPricingConfig(),
                getSuppliers(false),
                getInternalStockItems()
            ]);

            setPricingConfig({
                siteMarkupPercent: Number(configData.siteMarkupPercent || 0),
                marketplaceMarkupPercent: Number(configData.marketplaceMarkupPercent || 0)
            });

            setSuppliers(supplierData);
            setItems(itemData);

            if (supplierData.length && !itemForm.supplierId) {
                setItemForm((prev) => ({ ...prev, supplierId: supplierData[0].id }));
            }
        } catch (error) {
            console.error('Erro ao carregar estoque interno:', error);
            showToast('Erro ao carregar dados do estoque interno.', { type: 'error' });
        } finally {
            setLoading(false);
        }
    };

    const resetItemForm = () => {
        setEditingItemId(null);
        setItemForm({
            ...initialItemForm,
            supplierId: suppliers[0]?.id || ''
        });
    };

    const handleSavePricingConfig = async () => {
        setSavingConfig(true);
        try {
            const response = await updatePricingConfig({
                siteMarkupPercent: Number(pricingConfig.siteMarkupPercent || 0),
                marketplaceMarkupPercent: Number(pricingConfig.marketplaceMarkupPercent || 0),
                roundingStrategy: '2_decimals'
            });

            const recalculatedItems = response?.recalculatedItems || 0;
            showToast(`Configuração salva. ${recalculatedItems} item(ns) recalculado(s).`, { type: 'success' });

            await loadAll();
        } catch (error) {
            console.error('Erro ao salvar configuração:', error);
            showToast(error.response?.data?.error || 'Erro ao salvar configuração de preço.', { type: 'error' });
        } finally {
            setSavingConfig(false);
        }
    };

    const handleAddSupplier = async () => {
        if (!newSupplierName.trim()) {
            return;
        }

        setSavingSupplier(true);
        try {
            await createSupplier(newSupplierName.trim());
            setNewSupplierName('');
            const supplierData = await getSuppliers(false);
            setSuppliers(supplierData);

            if (!itemForm.supplierId && supplierData.length > 0) {
                setItemForm((prev) => ({ ...prev, supplierId: supplierData[0].id }));
            }
        } catch (error) {
            console.error('Erro ao cadastrar fornecedor:', error);
            showToast(error.response?.data?.error || 'Erro ao cadastrar fornecedor.', { type: 'error' });
        } finally {
            setSavingSupplier(false);
        }
    };

    const handleImportPartners = async () => {
        setImportingSuppliers(true);
        try {
            const response = await importSuppliersFromPartners();
            const supplierData = await getSuppliers(false);
            setSuppliers(supplierData);

            showToast(`${response.imported || 0} fornecedor(es) importado(s) de Parceiros/Marcas.`, { type: 'success' });
        } catch (error) {
            console.error('Erro ao importar fornecedores:', error);
            showToast(error.response?.data?.error || 'Erro ao importar fornecedores de Parceiros/Marcas.', { type: 'error' });
        } finally {
            setImportingSuppliers(false);
        }
    };

    const handleRemoveSupplier = async (supplierId, supplierName) => {
        const inUse = items.some((item) => item.supplierId === supplierId);
        if (inUse) {
            showToast('Este fornecedor está vinculado a itens e não pode ser removido agora.', { type: 'warning' });
            return;
        }

        if (!(await confirm(`Remover fornecedor ${supplierName}?`))) {
            return;
        }

        try {
            await deleteSupplier(supplierId);
            const supplierData = await getSuppliers(false);
            setSuppliers(supplierData);

            if (itemForm.supplierId === supplierId) {
                setItemForm((prev) => ({ ...prev, supplierId: supplierData[0]?.id || '' }));
            }
        } catch (error) {
            console.error('Erro ao remover fornecedor:', error);
            showToast(error.response?.data?.error || 'Erro ao remover fornecedor.', { type: 'error' });
        }
    };

    const handleItemFormChange = (field, value) => {
        setItemForm((prev) => ({ ...prev, [field]: value }));
    };

    const handleSubmitItem = async (event) => {
        event.preventDefault();

        if (!itemForm.name.trim() || !itemForm.description.trim() || !itemForm.supplierId) {
            showToast('Preencha nome, descrição e fornecedor.', { type: 'warning' });
            return;
        }

        const payload = {
            name: itemForm.name.trim(),
            description: itemForm.description.trim(),
            quantity: Number(itemForm.quantity || 0),
            unitCost: Number(itemForm.unitCost || 0),
            supplierId: itemForm.supplierId
        };

        if (payload.unitCost <= 0) {
            showToast('Valor unitário deve ser maior que zero.', { type: 'warning' });
            return;
        }

        setSavingItem(true);
        try {
            if (editingItemId) {
                await updateInternalStockItem(editingItemId, payload);
                showToast('Item atualizado com sucesso.', { type: 'success' });
            } else {
                await createInternalStockItem(payload);
                showToast('Item cadastrado com sucesso.', { type: 'success' });
            }

            const itemData = await getInternalStockItems();
            setItems(itemData);
            resetItemForm();
        } catch (error) {
            console.error('Erro ao salvar item:', error);
            showToast(error.response?.data?.error || 'Erro ao salvar item do estoque interno.', { type: 'error' });
        } finally {
            setSavingItem(false);
        }
    };

    const handleEditItem = (item) => {
        setEditingItemId(item.id);
        setItemForm({
            name: item.name,
            description: item.description,
            quantity: String(item.quantity),
            unitCost: String(item.unitCost),
            supplierId: item.supplierId
        });
    };

    const handleDeleteItem = async (itemId) => {
        if (!(await confirm('Deseja realmente excluir este item do estoque interno?'))) {
            return;
        }

        try {
            await deleteInternalStockItem(itemId);
            const itemData = await getInternalStockItems();
            setItems(itemData);

            if (editingItemId === itemId) {
                resetItemForm();
            }
        } catch (error) {
            console.error('Erro ao excluir item:', error);
            showToast(error.response?.data?.error || 'Erro ao excluir item do estoque interno.', { type: 'error' });
        }
    };

    const stockSummary = useMemo(() => {
        const totalItems = items.length;
        const totalUnits = items.reduce((acc, item) => acc + Number(item.quantity || 0), 0);
        const totalCost = items.reduce((acc, item) => acc + (Number(item.quantity || 0) * Number(item.unitCost || 0)), 0);

        return {
            totalItems,
            totalUnits,
            totalCost
        };
    }, [items]);

    if (loading) {
        return <div className="p-8 text-white">Carregando estoque interno...</div>;
    }

    return (
        <div className="space-y-8">
            <div className="flex justify-between items-start gap-4 flex-wrap">
                <div>
                    <h1 className="text-3xl font-display font-bold text-white uppercase">Estoque Interno</h1>
                    <p className="text-gray-400 mt-2">Controle separado do estoque atual do site.</p>
                </div>
                <button
                    onClick={loadAll}
                    className="bg-gray-800 hover:bg-gray-700 text-white px-4 py-2 rounded font-bold uppercase flex items-center gap-2"
                >
                    <RefreshCw className="w-4 h-4" />
                    Atualizar
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
                    <p className="text-gray-400 text-xs uppercase">Itens cadastrados</p>
                    <p className="text-2xl font-bold text-white mt-1">{stockSummary.totalItems}</p>
                </div>
                <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
                    <p className="text-gray-400 text-xs uppercase">Quantidade total</p>
                    <p className="text-2xl font-bold text-white mt-1">{stockSummary.totalUnits}</p>
                </div>
                <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
                    <p className="text-gray-400 text-xs uppercase">Custo total em estoque</p>
                    <p className="text-2xl font-bold text-white mt-1">{formatMoney(stockSummary.totalCost)}</p>
                </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                <div className="bg-gray-900 border border-gray-800 rounded-lg p-6 xl:col-span-2">
                    <div className="flex items-center gap-2 mb-4">
                        <TrendingUp className="w-5 h-5 text-sick-red" />
                        <h2 className="text-xl font-bold text-white uppercase">Configuração de Precificação</h2>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-gray-400 text-sm mb-2 font-bold uppercase">Markup Site (%)</label>
                            <input
                                type="number"
                                min="0"
                                step="0.01"
                                value={pricingConfig.siteMarkupPercent}
                                onChange={(e) => setPricingConfig((prev) => ({ ...prev, siteMarkupPercent: e.target.value }))}
                                className="w-full bg-black border border-gray-700 rounded p-3 text-white focus:border-sick-red focus:outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-gray-400 text-sm mb-2 font-bold uppercase">Markup Mercado Livre (%)</label>
                            <input
                                type="number"
                                min="0"
                                step="0.01"
                                value={pricingConfig.marketplaceMarkupPercent}
                                onChange={(e) => setPricingConfig((prev) => ({ ...prev, marketplaceMarkupPercent: e.target.value }))}
                                className="w-full bg-black border border-gray-700 rounded p-3 text-white focus:border-sick-red focus:outline-none"
                            />
                        </div>
                    </div>
                    <button
                        onClick={handleSavePricingConfig}
                        disabled={savingConfig}
                        className="mt-4 bg-sick-red hover:bg-red-700 text-white px-5 py-2 rounded font-bold uppercase flex items-center gap-2 disabled:opacity-60"
                    >
                        <Save className="w-4 h-4" />
                        {savingConfig ? 'Salvando...' : 'Salvar e Recalcular'}
                    </button>
                </div>

                <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
                    <div className="flex items-center gap-2 mb-4">
                        <Factory className="w-5 h-5 text-sick-red" />
                        <h2 className="text-xl font-bold text-white uppercase">Fornecedores</h2>
                    </div>

                    <div className="flex gap-2 mb-3">
                        <input
                            type="text"
                            value={newSupplierName}
                            onChange={(e) => setNewSupplierName(e.target.value)}
                            placeholder="Novo fornecedor"
                            className="bg-black border border-gray-700 rounded p-2 text-white flex-1 focus:border-sick-red focus:outline-none"
                            onKeyDown={(e) => e.key === 'Enter' && handleAddSupplier()}
                        />
                        <button
                            onClick={handleAddSupplier}
                            disabled={savingSupplier}
                            className="bg-gray-800 hover:bg-gray-700 text-white p-2 rounded disabled:opacity-60"
                        >
                            <Plus className="w-5 h-5" />
                        </button>
                    </div>

                    <button
                        onClick={handleImportPartners}
                        disabled={importingSuppliers}
                        className="w-full mb-3 bg-gray-800 hover:bg-gray-700 text-white px-3 py-2 rounded font-bold text-sm uppercase disabled:opacity-60"
                    >
                        {importingSuppliers ? 'Importando...' : 'Importar de Parceiros/Marcas'}
                    </button>

                    <ul className="space-y-2 max-h-64 overflow-y-auto pr-1">
                        {suppliers.map((supplier) => (
                            <li key={supplier.id} className="flex justify-between items-center bg-black/50 p-2 rounded border border-gray-800 gap-2">
                                <div className="min-w-0">
                                    <p className="text-gray-200 text-sm truncate">{supplier.name}</p>
                                    <p className="text-gray-500 text-xs uppercase">{supplier.source === 'partner_import' ? 'Parceiros' : 'Manual'}</p>
                                </div>
                                <button
                                    onClick={() => handleRemoveSupplier(supplier.id, supplier.name)}
                                    className="text-gray-500 hover:text-red-500 transition-colors"
                                    title="Remover fornecedor"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>

            <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
                <div className="flex items-center gap-2 mb-4">
                    <Boxes className="w-5 h-5 text-sick-red" />
                    <h2 className="text-xl font-bold text-white uppercase">
                        {editingItemId ? 'Editar Item Interno' : 'Cadastrar Item Interno'}
                    </h2>
                </div>

                <form onSubmit={handleSubmitItem} className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-4">
                    <div className="xl:col-span-2">
                        <label className="block text-gray-400 text-sm mb-2 font-bold uppercase">Nome</label>
                        <input
                            type="text"
                            value={itemForm.name}
                            onChange={(e) => handleItemFormChange('name', e.target.value)}
                            required
                            className="w-full bg-black border border-gray-700 rounded p-3 text-white focus:border-sick-red focus:outline-none"
                        />
                    </div>

                    <div className="xl:col-span-2">
                        <label className="block text-gray-400 text-sm mb-2 font-bold uppercase">Descrição</label>
                        <input
                            type="text"
                            value={itemForm.description}
                            onChange={(e) => handleItemFormChange('description', e.target.value)}
                            required
                            className="w-full bg-black border border-gray-700 rounded p-3 text-white focus:border-sick-red focus:outline-none"
                        />
                    </div>

                    <div>
                        <label className="block text-gray-400 text-sm mb-2 font-bold uppercase">Fornecedor</label>
                        <select
                            value={itemForm.supplierId}
                            onChange={(e) => handleItemFormChange('supplierId', e.target.value)}
                            required
                            className="w-full bg-black border border-gray-700 rounded p-3 text-white focus:border-sick-red focus:outline-none"
                        >
                            <option value="">Selecione</option>
                            {suppliers.map((supplier) => (
                                <option key={supplier.id} value={supplier.id}>{supplier.name}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-gray-400 text-sm mb-2 font-bold uppercase">Quantidade</label>
                        <input
                            type="number"
                            min="0"
                            value={itemForm.quantity}
                            onChange={(e) => handleItemFormChange('quantity', e.target.value)}
                            required
                            className="w-full bg-black border border-gray-700 rounded p-3 text-white focus:border-sick-red focus:outline-none"
                        />
                    </div>

                    <div>
                        <label className="block text-gray-400 text-sm mb-2 font-bold uppercase">Valor Unitário</label>
                        <input
                            type="number"
                            min="0.01"
                            step="0.01"
                            value={itemForm.unitCost}
                            onChange={(e) => handleItemFormChange('unitCost', e.target.value)}
                            required
                            className="w-full bg-black border border-gray-700 rounded p-3 text-white focus:border-sick-red focus:outline-none"
                        />
                    </div>

                    <div className="md:col-span-2 xl:col-span-3 flex items-end gap-2">
                        <button
                            type="submit"
                            disabled={savingItem}
                            className="bg-sick-red hover:bg-red-700 text-white px-5 py-3 rounded font-bold uppercase disabled:opacity-60"
                        >
                            {savingItem ? 'Salvando...' : editingItemId ? 'Atualizar Item' : 'Cadastrar Item'}
                        </button>
                        {editingItemId && (
                            <button
                                type="button"
                                onClick={resetItemForm}
                                className="bg-gray-800 hover:bg-gray-700 text-white px-5 py-3 rounded font-bold uppercase"
                            >
                                Cancelar Edição
                            </button>
                        )}
                    </div>
                </form>
            </div>

            <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
                <h2 className="text-xl font-bold text-white uppercase mb-4">Lista de Itens Internos</h2>
                <div className="overflow-x-auto">
                    <table className="w-full min-w-[900px]">
                        <thead>
                            <tr className="text-left border-b border-gray-800 text-gray-400 text-xs uppercase">
                                <th className="p-3">Nome</th>
                                <th className="p-3">Quantidade</th>
                                <th className="p-3">Valor Unitário</th>
                                <th className="p-3">Venda Site</th>
                                <th className="p-3">Venda Mercado Livre</th>
                                <th className="p-3">Fornecedor</th>
                                <th className="p-3">Ações</th>
                            </tr>
                        </thead>
                        <tbody>
                            {items.map((item) => (
                                <tr key={item.id} className="border-b border-gray-800 text-sm">
                                    <td className="p-3 text-white">
                                        <p className="font-semibold">{item.name}</p>
                                        <p className="text-gray-400 text-xs mt-1">{item.description}</p>
                                    </td>
                                    <td className="p-3 text-gray-300">{item.quantity}</td>
                                    <td className="p-3 text-gray-300">{formatMoney(item.unitCost)}</td>
                                    <td className="p-3 text-green-400 font-semibold">{formatMoney(item.siteSalePrice)}</td>
                                    <td className="p-3 text-blue-400 font-semibold">{formatMoney(item.mlSalePrice)}</td>
                                    <td className="p-3 text-gray-300">{item.supplier?.name || '-'}</td>
                                    <td className="p-3">
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => handleEditItem(item)}
                                                className="text-gray-400 hover:text-white"
                                                title="Editar"
                                            >
                                                <Pencil className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => handleDeleteItem(item.id)}
                                                className="text-gray-400 hover:text-red-500"
                                                title="Excluir"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {items.length === 0 && (
                                <tr>
                                    <td colSpan="7" className="p-6 text-center text-gray-500">
                                        Nenhum item interno cadastrado.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default AdminInternalStock;
