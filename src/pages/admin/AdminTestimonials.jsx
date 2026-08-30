import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { MessageSquareQuote, Plus, Trash2, Edit, Star } from 'lucide-react';
import { getTestimonials, deleteTestimonial } from '../../services/testimonialService';
import { useToast } from '../../components/ui/ToastProvider';
import { useConfirm } from '../../components/ui/ConfirmDialogProvider';

// Same list+form CRUD shape as AdminBanners.jsx/BannerForm.jsx, applied to
// the "O que os clientes dizem" home section.
const AdminTestimonials = () => {
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
            const data = await getTestimonials();
            setItems(data);
        } catch (error) {
            console.error('Error loading testimonials:', error);
            showToast('Erro ao carregar depoimentos.', { type: 'error' });
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (!(await confirm('Tem certeza que deseja excluir este depoimento?'))) return;

        try {
            await deleteTestimonial(id);
            showToast('Depoimento excluído com sucesso!', { type: 'success' });
            loadItems();
        } catch (error) {
            console.error('Error deleting testimonial:', error);
            showToast('Erro ao excluir depoimento.', { type: 'error' });
        }
    };

    return (
        <div>
            <div className="mb-8 flex items-center justify-between">
                <div>
                    <h1 className="text-4xl font-display font-bold text-white uppercase mb-2">
                        Depoimentos
                    </h1>
                    <p className="text-gray-400">Depoimentos da seção "O que os clientes dizem" na home</p>
                </div>
                <Link
                    to="/admin/testimonials/new"
                    className="flex items-center gap-2 bg-harley-orange text-white px-6 py-3 rounded font-bold uppercase tracking-wide hover:bg-red-800 transition-colors"
                >
                    <Plus className="w-5 h-5" />
                    Novo Depoimento
                </Link>
            </div>

            {loading ? (
                <div className="text-center text-gray-400 py-12">Carregando...</div>
            ) : items.length === 0 ? (
                <div className="bg-gray-900 border border-gray-800 rounded-lg p-12 text-center">
                    <MessageSquareQuote className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                    <p className="text-gray-400 mb-4">Nenhum depoimento cadastrado</p>
                    <Link
                        to="/admin/testimonials/new"
                        className="inline-flex items-center gap-2 bg-harley-orange text-white px-6 py-3 rounded font-bold uppercase tracking-wide hover:bg-red-800 transition-colors"
                    >
                        <Plus className="w-5 h-5" />
                        Criar Primeiro Depoimento
                    </Link>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {items.map((item) => (
                        <div
                            key={item.id}
                            className="bg-gray-900 border border-gray-800 rounded-lg p-6 flex flex-col"
                        >
                            <div className="flex items-center gap-1 mb-3">
                                {[...Array(5)].map((_, i) => (
                                    <Star
                                        key={i}
                                        className={`w-4 h-4 ${i < item.rating ? 'text-harley-orange fill-harley-orange' : 'text-gray-700'}`}
                                    />
                                ))}
                            </div>
                            <p className="text-gray-300 text-sm flex-1 mb-4 line-clamp-3">"{item.quote}"</p>
                            <div className="flex items-center gap-3 pt-4 border-t border-gray-800">
                                {item.photo ? (
                                    <img src={item.photo} alt={item.name} className="w-10 h-10 rounded-full object-cover" />
                                ) : (
                                    <div className="w-10 h-10 rounded-full bg-harley-orange/10 border border-harley-orange/30 flex items-center justify-center text-harley-orange font-bold text-sm">
                                        {item.name?.[0]?.toUpperCase()}
                                    </div>
                                )}
                                <div>
                                    <p className="text-white font-bold text-sm">{item.name}</p>
                                    {item.city && <p className="text-gray-500 text-xs">{item.city}</p>}
                                </div>
                            </div>
                            <div className="flex gap-2 mt-4">
                                <button
                                    onClick={() => navigate(`/admin/testimonials/edit/${item.id}`)}
                                    className="flex-1 flex items-center justify-center gap-2 p-2 text-blue-500 hover:bg-blue-900/20 rounded transition-colors"
                                >
                                    <Edit className="w-4 h-4" /> Editar
                                </button>
                                <button
                                    onClick={() => handleDelete(item.id)}
                                    className="flex-1 flex items-center justify-center gap-2 p-2 text-red-500 hover:bg-red-900/20 rounded transition-colors"
                                >
                                    <Trash2 className="w-4 h-4" /> Excluir
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default AdminTestimonials;
