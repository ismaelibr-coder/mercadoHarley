import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Image, Plus, Trash2, Edit } from 'lucide-react';
import { getGalleryItems, deleteGalleryItem } from '../../services/customerGalleryService';
import { useToast } from '../../components/ui/ToastProvider';
import { useConfirm } from '../../components/ui/ConfirmDialogProvider';

// Same list+form CRUD shape as AdminBanners.jsx/BannerForm.jsx, applied to
// the "Quem já roda com a SICK GRIP" home grid.
const AdminCustomerGallery = () => {
    const { showToast } = useToast();
    const confirm = useConfirm();
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        loadItems();
    }, []);

    const loadItems = async () => {
        try {
            const data = await getGalleryItems();
            setItems(data);
        } catch (error) {
            console.error('Error loading gallery items:', error);
            showToast('Erro ao carregar galeria.', { type: 'error' });
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (!(await confirm('Tem certeza que deseja excluir esta foto?'))) return;

        try {
            await deleteGalleryItem(id);
            showToast('Foto excluída com sucesso!', { type: 'success' });
            loadItems();
        } catch (error) {
            console.error('Error deleting gallery item:', error);
            showToast('Erro ao excluir foto.', { type: 'error' });
        }
    };

    return (
        <div>
            <div className="mb-8 flex items-center justify-between">
                <div>
                    <h1 className="text-4xl font-display font-bold text-white uppercase mb-2">
                        Galeria de Clientes
                    </h1>
                    <p className="text-gray-400">Fotos da seção "Quem já roda com a SICK GRIP" na home</p>
                </div>
                <Link
                    to="/admin/customer-gallery/new"
                    className="flex items-center gap-2 bg-harley-orange text-white px-6 py-3 rounded font-bold uppercase tracking-wide hover:bg-red-800 transition-colors"
                >
                    <Plus className="w-5 h-5" />
                    Adicionar Foto
                </Link>
            </div>

            {loading ? (
                <div className="text-center text-gray-400 py-12">Carregando...</div>
            ) : items.length === 0 ? (
                <div className="bg-gray-900 border border-gray-800 rounded-lg p-12 text-center">
                    <Image className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                    <p className="text-gray-400 mb-4">Nenhuma foto cadastrada</p>
                    <Link
                        to="/admin/customer-gallery/new"
                        className="inline-flex items-center gap-2 bg-harley-orange text-white px-6 py-3 rounded font-bold uppercase tracking-wide hover:bg-red-800 transition-colors"
                    >
                        <Plus className="w-5 h-5" />
                        Adicionar Primeira Foto
                    </Link>
                </div>
            ) : (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {items.map((item) => (
                        <div
                            key={item.id}
                            className="bg-gray-900 border border-gray-800 rounded-lg overflow-hidden group"
                        >
                            <div className="relative aspect-square">
                                <img
                                    src={item.image}
                                    alt={item.caption || 'Foto da galeria'}
                                    className="w-full h-full object-cover"
                                />
                                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                    <button
                                        onClick={() => navigate(`/admin/customer-gallery/edit/${item.id}`)}
                                        className="p-2 bg-blue-600 hover:bg-blue-700 rounded-full transition-colors"
                                        title="Editar"
                                    >
                                        <Edit className="w-4 h-4 text-white" />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(item.id)}
                                        className="p-2 bg-red-600 hover:bg-red-700 rounded-full transition-colors"
                                        title="Excluir"
                                    >
                                        <Trash2 className="w-4 h-4 text-white" />
                                    </button>
                                </div>
                            </div>
                            <div className="p-3">
                                <p className="text-gray-400 text-xs truncate">{item.caption || '— sem legenda —'}</p>
                                <p className="text-gray-600 text-[10px] mt-1">Ordem: {item.displayOrder}</p>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default AdminCustomerGallery;
