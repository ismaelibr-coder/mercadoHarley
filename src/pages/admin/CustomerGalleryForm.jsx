import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Save, ArrowLeft } from 'lucide-react';
import { createGalleryItem, updateGalleryItem, getGalleryItemById } from '../../services/customerGalleryService';
import ImageUpload from '../../components/ImageUpload';
import { useToast } from '../../components/ui/ToastProvider';

const CustomerGalleryForm = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { showToast } = useToast();
    const isEdit = Boolean(id);

    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        image: '',
        caption: '',
        displayOrder: 0
    });

    useEffect(() => {
        if (isEdit) loadItem();
    }, [id]);

    const loadItem = async () => {
        try {
            const item = await getGalleryItemById(id);
            setFormData({
                image: item.image,
                caption: item.caption || '',
                displayOrder: item.displayOrder
            });
        } catch (error) {
            console.error('Error loading gallery item:', error);
            showToast('Erro ao carregar foto.', { type: 'error' });
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.image) {
            showToast('Envie uma foto antes de salvar.', { type: 'error' });
            return;
        }

        setLoading(true);
        try {
            const data = {
                image: formData.image,
                caption: formData.caption || null,
                displayOrder: parseInt(formData.displayOrder) || 0
            };

            if (isEdit) {
                await updateGalleryItem(id, data);
                showToast('Foto atualizada com sucesso!', { type: 'success' });
            } else {
                await createGalleryItem(data);
                showToast('Foto adicionada com sucesso!', { type: 'success' });
            }
            navigate('/admin/customer-gallery');
        } catch (error) {
            console.error('Error saving gallery item:', error);
            showToast('Erro ao salvar foto.', { type: 'error' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div>
            <div className="mb-8">
                <button
                    onClick={() => navigate('/admin/customer-gallery')}
                    className="flex items-center gap-2 text-gray-400 hover:text-white mb-4"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Voltar
                </button>
                <h1 className="text-4xl font-display font-bold text-white uppercase mb-2">
                    {isEdit ? 'Editar Foto' : 'Adicionar Foto'}
                </h1>
                <p className="text-gray-400">Foto da moto de um cliente, para a galeria da home</p>
            </div>

            <form onSubmit={handleSubmit} className="bg-gray-900 border border-gray-800 rounded-lg p-6">
                <div className="mb-6">
                    <label className="block text-gray-400 text-sm mb-2 font-bold uppercase">Foto *</label>
                    <ImageUpload
                        currentImage={formData.image}
                        onImageUploaded={(url) => setFormData((prev) => ({ ...prev, image: url }))}
                        onImageRemoved={() => setFormData((prev) => ({ ...prev, image: '' }))}
                        purpose="customer-gallery"
                    />
                    <p className="text-xs text-gray-500 mt-2">Recomendado: foto quadrada, moto em destaque.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    <div>
                        <label className="block text-gray-400 text-sm mb-2 font-bold uppercase">Legenda (opcional)</label>
                        <input
                            type="text"
                            name="caption"
                            value={formData.caption}
                            onChange={handleChange}
                            placeholder="Ex: Softail do Marcos — SP"
                            className="w-full bg-black border border-gray-700 rounded p-3 text-white focus:border-harley-orange focus:outline-none"
                        />
                        <p className="text-xs text-gray-500 mt-1">Só use um nome real se o cliente autorizou aparecer. Deixe em branco pra mostrar só a foto.</p>
                    </div>

                    <div>
                        <label className="block text-gray-400 text-sm mb-2 font-bold uppercase">Ordem de Exibição</label>
                        <input
                            type="number"
                            name="displayOrder"
                            value={formData.displayOrder}
                            onChange={handleChange}
                            min="0"
                            className="w-full bg-black border border-gray-700 rounded p-3 text-white focus:border-harley-orange focus:outline-none"
                        />
                        <p className="text-xs text-gray-500 mt-1">Menor número = aparece primeiro</p>
                    </div>
                </div>

                <div className="flex gap-4">
                    <button
                        type="submit"
                        disabled={loading}
                        className="flex items-center gap-2 bg-harley-orange text-white px-6 py-3 rounded font-bold uppercase tracking-wide hover:bg-red-800 transition-colors disabled:opacity-50"
                    >
                        <Save className="w-5 h-5" />
                        {loading ? 'Salvando...' : 'Salvar Foto'}
                    </button>
                    <button
                        type="button"
                        onClick={() => navigate('/admin/customer-gallery')}
                        className="bg-gray-800 text-white px-6 py-3 rounded font-bold uppercase tracking-wide hover:bg-gray-700 transition-colors"
                    >
                        Cancelar
                    </button>
                </div>
            </form>
        </div>
    );
};

export default CustomerGalleryForm;
