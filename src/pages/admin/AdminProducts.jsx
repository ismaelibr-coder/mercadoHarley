import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Edit, Trash2, Search, ChevronUp, ChevronDown } from 'lucide-react';
import { getAllProducts, deleteProduct } from '../../services/productService';
import { useToast } from '../../components/ui/ToastProvider';
import { useConfirm } from '../../components/ui/ConfirmDialogProvider';
import RatingStars from '../../components/ui/RatingStars';
import { formatCurrency } from '../../utils/currency.js';

const PAGE_SIZE = 20;

const AdminProducts = () => {
    const { showToast } = useToast();
    const confirm = useConfirm();
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('all');
    const [stockFilter, setStockFilter] = useState('all');
    const [sortConfig, setSortConfig] = useState({ key: 'name', direction: 'asc' });
    const [selectedIds, setSelectedIds] = useState(new Set());
    const [page, setPage] = useState(1);

    useEffect(() => {
        loadProducts();
    }, []);

    const loadProducts = async () => {
        try {
            const data = await getAllProducts();
            setProducts(data);
        } catch (error) {
            console.error('Error loading products:', error);
        } finally {
            setLoading(false);
        }
    };

    const getNumericPrice = (product) => (
        typeof product.price === 'number'
            ? product.price
            : parseFloat(String(product.price).replace('R$', '').replace('.', '').replace(',', '.').trim())
    );

    const categories = useMemo(
        () => [...new Set(products.map((p) => p.category).filter(Boolean))].sort(),
        [products]
    );

    const filteredProducts = useMemo(() => {
        let list = products.filter((product) =>
            product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            product.category.toLowerCase().includes(searchTerm.toLowerCase())
        );

        if (categoryFilter !== 'all') {
            list = list.filter((p) => p.category === categoryFilter);
        }
        if (stockFilter === 'out') {
            list = list.filter((p) => (p.stock || 0) === 0);
        } else if (stockFilter === 'low') {
            list = list.filter((p) => (p.stock || 0) > 0 && (p.stock || 0) <= 5);
        }

        const { key, direction } = sortConfig;
        const dir = direction === 'asc' ? 1 : -1;
        list = [...list].sort((a, b) => {
            if (key === 'price') return (getNumericPrice(a) - getNumericPrice(b)) * dir;
            if (key === 'stock') return ((a.stock || 0) - (b.stock || 0)) * dir;
            return String(a[key] || '').localeCompare(String(b[key] || '')) * dir;
        });

        return list;
    }, [products, searchTerm, categoryFilter, stockFilter, sortConfig]);

    // Reset to page 1 whenever the result set changes shape (new filter/search/sort).
    useEffect(() => { setPage(1); }, [searchTerm, categoryFilter, stockFilter, sortConfig]);

    const totalPages = Math.max(1, Math.ceil(filteredProducts.length / PAGE_SIZE));
    const pagedProducts = filteredProducts.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

    const toggleSort = (key) => {
        setSortConfig((prev) => ({
            key,
            direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
        }));
    };

    const SortHeader = ({ label, sortKey }) => (
        <th className="text-left p-4 text-gray-400 font-bold uppercase text-sm">
            <button type="button" onClick={() => toggleSort(sortKey)} className="flex items-center gap-1 hover:text-white transition-colors">
                {label}
                {sortConfig.key === sortKey && (sortConfig.direction === 'asc' ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />)}
            </button>
        </th>
    );

    const toggleSelected = (id) => {
        setSelectedIds((prev) => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id); else next.add(id);
            return next;
        });
    };

    const toggleSelectAllOnPage = () => {
        setSelectedIds((prev) => {
            const pageIds = pagedProducts.map((p) => p.id);
            const allSelected = pageIds.every((id) => prev.has(id));
            const next = new Set(prev);
            pageIds.forEach((id) => (allSelected ? next.delete(id) : next.add(id)));
            return next;
        });
    };

    const handleDelete = async (id, name) => {
        if (!(await confirm(`Tem certeza que deseja excluir "${name}"?`))) return;
        try {
            await deleteProduct(id);
            setProducts((prev) => prev.filter((p) => p.id !== id));
            setSelectedIds((prev) => { const next = new Set(prev); next.delete(id); return next; });
            showToast('Produto excluído com sucesso.', { type: 'success' });
        } catch (error) {
            console.error('Error deleting product:', error);
            showToast('Erro ao excluir produto.', { type: 'error' });
        }
    };

    const handleBulkDelete = async () => {
        const ids = [...selectedIds];
        if (ids.length === 0) return;
        if (!(await confirm(`Excluir ${ids.length} produto${ids.length === 1 ? '' : 's'} selecionado${ids.length === 1 ? '' : 's'}? Essa ação não pode ser desfeita.`))) return;

        const results = await Promise.allSettled(ids.map((id) => deleteProduct(id)));
        const succeededIds = ids.filter((_, i) => results[i].status === 'fulfilled');
        const failedCount = results.filter((r) => r.status === 'rejected').length;

        setProducts((prev) => prev.filter((p) => !succeededIds.includes(p.id)));
        setSelectedIds(new Set());

        if (failedCount === 0) {
            showToast(`${succeededIds.length} produto${succeededIds.length === 1 ? '' : 's'} excluído${succeededIds.length === 1 ? '' : 's'} com sucesso.`, { type: 'success' });
        } else {
            showToast(`${succeededIds.length} excluído(s), ${failedCount} falharam.`, { type: 'warning' });
        }
    };

    const allOnPageSelected = pagedProducts.length > 0 && pagedProducts.every((p) => selectedIds.has(p.id));

    return (
        <div>
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-4xl font-display font-bold text-white uppercase mb-2">
                        Produtos
                    </h1>
                    <p className="text-gray-400">Gerencie todos os produtos da loja</p>
                </div>
                <Link
                    to="/admin/products/new"
                    className="flex items-center gap-2 bg-harley-orange text-white px-6 py-3 rounded font-bold uppercase tracking-wide hover:bg-red-800 transition-colors"
                >
                    <Plus className="w-5 h-5" />
                    Novo Produto
                </Link>
            </div>

            {/* Filters */}
            <div className="flex flex-col md:flex-row gap-3 mb-6">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-3.5 w-5 h-5 text-gray-500" />
                    <input
                        type="text"
                        placeholder="Buscar produtos..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-gray-900 border border-gray-800 rounded p-3 pl-10 text-white focus:border-harley-orange focus:outline-none"
                    />
                </div>
                <select
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                    className="bg-gray-900 border border-gray-800 rounded p-3 text-white focus:border-harley-orange focus:outline-none md:w-56"
                >
                    <option value="all">Todas as categorias</option>
                    {categories.map((cat) => <option key={cat} value={cat}>{cat}</option>)}
                </select>
                <select
                    value={stockFilter}
                    onChange={(e) => setStockFilter(e.target.value)}
                    className="bg-gray-900 border border-gray-800 rounded p-3 text-white focus:border-harley-orange focus:outline-none md:w-56"
                >
                    <option value="all">Todo o estoque</option>
                    <option value="low">Estoque baixo (≤5)</option>
                    <option value="out">Esgotados</option>
                </select>
            </div>

            {selectedIds.size > 0 && (
                <div className="flex items-center justify-between bg-gray-900 border border-harley-orange/40 rounded-lg px-4 py-3 mb-4">
                    <span className="text-white text-sm font-bold">{selectedIds.size} selecionado{selectedIds.size === 1 ? '' : 's'}</span>
                    <div className="flex items-center gap-3">
                        <button onClick={() => setSelectedIds(new Set())} className="text-gray-400 hover:text-white text-sm transition-colors">
                            Limpar seleção
                        </button>
                        <button
                            onClick={handleBulkDelete}
                            className="flex items-center gap-2 bg-red-700 text-white px-4 py-2 rounded font-bold text-sm hover:bg-red-800 transition-colors"
                        >
                            <Trash2 className="w-4 h-4" /> Excluir selecionados
                        </button>
                    </div>
                </div>
            )}

            {/* Products Table */}
            <div className="bg-gray-900 border border-gray-800 rounded-lg overflow-hidden">
                {loading ? (
                    <div className="p-8 text-center text-gray-400">Carregando...</div>
                ) : filteredProducts.length === 0 ? (
                    <div className="p-8 text-center text-gray-400">
                        {searchTerm || categoryFilter !== 'all' || stockFilter !== 'all' ? 'Nenhum produto encontrado com esses filtros.' : 'Nenhum produto cadastrado ainda.'}
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-black border-b border-gray-800">
                                <tr>
                                    <th className="p-4 w-10">
                                        <input
                                            type="checkbox"
                                            checked={allOnPageSelected}
                                            onChange={toggleSelectAllOnPage}
                                            aria-label="Selecionar todos os produtos desta página"
                                            className="rounded bg-black border-gray-600 text-harley-orange focus:ring-harley-orange"
                                        />
                                    </th>
                                    <th className="text-left p-4 text-gray-400 font-bold uppercase text-sm">Imagem</th>
                                    <SortHeader label="Nome" sortKey="name" />
                                    <SortHeader label="Categoria" sortKey="category" />
                                    <SortHeader label="Preço" sortKey="price" />
                                    <SortHeader label="Estoque" sortKey="stock" />
                                    <th className="text-left p-4 text-gray-400 font-bold uppercase text-sm">Avaliação</th>
                                    <th className="text-right p-4 text-gray-400 font-bold uppercase text-sm">Ações</th>
                                </tr>
                            </thead>
                            <tbody>
                                {pagedProducts.map((product) => (
                                    <tr key={product.id} className="border-b border-gray-800 hover:bg-gray-800 transition-colors">
                                        <td className="p-4">
                                            <input
                                                type="checkbox"
                                                checked={selectedIds.has(product.id)}
                                                onChange={() => toggleSelected(product.id)}
                                                aria-label={`Selecionar ${product.name}`}
                                                className="rounded bg-black border-gray-600 text-harley-orange focus:ring-harley-orange"
                                            />
                                        </td>
                                        <td className="p-4">
                                            <img
                                                src={product.image}
                                                alt={product.name}
                                                className="w-16 h-16 object-contain rounded bg-white p-1"
                                            />
                                        </td>
                                        <td className="p-4 text-white font-bold">{product.name}</td>
                                        <td className="p-4 text-gray-400">{product.category}</td>
                                        <td className="p-4 text-harley-orange font-bold">{formatCurrency(product.price)}</td>
                                        <td className="p-4">
                                            <span className={`px-3 py-1 rounded font-bold text-sm ${(product.stock || 0) === 0
                                                    ? 'bg-red-900/50 text-red-400'
                                                    : (product.stock || 0) <= 5
                                                        ? 'bg-yellow-900/50 text-yellow-400'
                                                        : 'bg-green-900/50 text-green-400'
                                                }`}>
                                                {product.stock || 0}
                                            </span>
                                        </td>
                                        <td className="p-4"><RatingStars rating={product.rating} size="sm" /></td>
                                        <td className="p-4">
                                            <div className="flex items-center justify-end gap-2">
                                                <Link
                                                    to={`/admin/products/edit/${product.id}`}
                                                    className="p-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                                                    title="Editar"
                                                >
                                                    <Edit className="w-4 h-4" />
                                                </Link>
                                                <button
                                                    onClick={() => handleDelete(product.id, product.name)}
                                                    className="p-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
                                                    title="Excluir"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {!loading && totalPages > 1 && (
                <div className="flex items-center justify-between mt-4 text-sm text-gray-400">
                    <span>Página {page} de {totalPages} ({filteredProducts.length} produtos)</span>
                    <div className="flex gap-2">
                        <button
                            onClick={() => setPage((p) => Math.max(1, p - 1))}
                            disabled={page === 1}
                            className="px-3 py-1.5 bg-gray-900 border border-gray-800 rounded disabled:opacity-40 hover:border-harley-orange transition-colors"
                        >
                            Anterior
                        </button>
                        <button
                            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                            disabled={page === totalPages}
                            className="px-3 py-1.5 bg-gray-900 border border-gray-800 rounded disabled:opacity-40 hover:border-harley-orange transition-colors"
                        >
                            Próxima
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminProducts;
