import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Image, Plus, Trash2, Edit, ExternalLink } from 'lucide-react';
import { getAllBanners, deleteBanner } from '../../services/bannerService';

const AdminBanners = () => {
    const [banners, setBanners] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        loadBanners();
    }, []);

    const loadBanners = async () => {
        try {
            const data = await getAllBanners();
            setBanners(data);
        } catch (error) {
            console.error('Error loading banners:', error);
            alert('Erro ao carregar banners.');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Tem certeza que deseja excluir este banner?')) return;

        try {
            await deleteBanner(id);
            alert('Banner excluído com sucesso!');
            loadBanners();
        } catch (error) {
            console.error('Error deleting banner:', error);
            alert('Erro ao excluir banner.');
        }
    };

    const getLinkTypeLabel = (type) => {
        const labels = {
            category: 'Categoria',
            product: 'Produto',
            external: 'URL Externa'
        };
        return labels[type] || type;
    };

    return (
        <div>
            <div className="mb-8 flex items-center justify-between">
                <div>
                    <h1 className="text-4xl font-display font-bold text-white uppercase mb-2">
                        Banners
                    </h1>
                    <p className="text-gray-400">Gerencie os banners da home page</p>
                </div>
                <Link
                    to="/admin/banners/new"
                    className="flex items-center gap-2 bg-harley-orange text-white px-6 py-3 rounded font-bold uppercase tracking-wide hover:bg-orange-700 transition-colors"
                >
                    <Plus className="w-5 h-5" />
                    Novo Banner
                </Link>
            </div>

            {loading ? (
                <div className="text-center text-gray-400 py-12">Carregando...</div>
            ) : banners.length === 0 ? (
                <div className="bg-gray-900 border border-gray-800 rounded-lg p-12 text-center">
                    <Image className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                    <p className="text-gray-400 mb-4">Nenhum banner cadastrado</p>
                    <Link
                        to="/admin/banners/new"
                        className="inline-flex items-center gap-2 bg-harley-orange text-white px-6 py-3 rounded font-bold uppercase tracking-wide hover:bg-orange-700 transition-colors"
                    >
                        <Plus className="w-5 h-5" />
                        Criar Primeiro Banner
                    </Link>
                </div>
            ) : (
                <div className="bg-gray-900 border border-gray-800 rounded-lg overflow-hidden">
                    <table className="w-full">
                        <thead className="bg-black">
                            <tr>
                                <th className="text-left p-4 text-gray-400 font-bold uppercase text-sm">Preview</th>
                                <th className="text-left p-4 text-gray-400 font-bold uppercase text-sm">Título</th>
                                <th className="text-left p-4 text-gray-400 font-bold uppercase text-sm">Tipo de Link</th>
                                <th className="text-left p-4 text-gray-400 font-bold uppercase text-sm">Ordem</th>
                                <th className="text-left p-4 text-gray-400 font-bold uppercase text-sm">Status</th>
                                <th className="text-left p-4 text-gray-400 font-bold uppercase text-sm">Ações</th>
                            </tr>
                        </thead>
                        <tbody>
                            {banners.map((banner) => (
                                <tr key={banner.id} className="border-t border-gray-800 hover:bg-gray-800/50">
                                    <td className="p-4">
                                        <img
                                            src={banner.image}
                                            alt={banner.title}
                                            className="w-24 h-12 object-cover rounded"
                                        />
                                    </td>
                                    <td className="p-4 text-white font-bold">{banner.title}</td>
                                    <td className="p-4 text-gray-400">
                                        <span className="inline-flex items-center gap-1">
                                            {getLinkTypeLabel(banner.link.type)}
                                            {banner.link.type === 'external' && <ExternalLink className="w-3 h-3" />}
                                        </span>
                                    </td>
                                    <td className="p-4 text-gray-400">{banner.order}</td>
                                    <td className="p-4">
                                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${banner.active
                                                ? 'bg-green-900/30 text-green-500'
                                                : 'bg-gray-700 text-gray-400'
                                            }`}>
                                            {banner.active ? 'Ativo' : 'Inativo'}
                                        </span>
                                    </td>
                                    <td className="p-4">
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => navigate(`/admin/banners/edit/${banner.id}`)}
                                                className="p-2 text-blue-500 hover:bg-blue-900/20 rounded transition-colors"
                                                title="Editar"
                                            >
                                                <Edit className="w-5 h-5" />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(banner.id)}
                                                className="p-2 text-red-500 hover:bg-red-900/20 rounded transition-colors"
                                                title="Excluir"
                                            >
                                                <Trash2 className="w-5 h-5" />
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
    );
};

export default AdminBanners;
