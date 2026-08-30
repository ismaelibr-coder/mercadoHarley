import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Save, ArrowLeft, Star } from 'lucide-react';
import { createTestimonial, updateTestimonial, getTestimonialById } from '../../services/testimonialService';
import ImageUpload from '../../components/ImageUpload';
import { useToast } from '../../components/ui/ToastProvider';

const TestimonialForm = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { showToast } = useToast();
    const isEdit = Boolean(id);

    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        city: '',
        quote: '',
        rating: 5,
        photo: '',
        displayOrder: 0
    });

    useEffect(() => {
        if (isEdit) loadItem();
    }, [id]);

    const loadItem = async () => {
        try {
            const item = await getTestimonialById(id);
            setFormData({
                name: item.name,
                city: item.city || '',
                quote: item.quote,
                rating: item.rating,
                photo: item.photo || '',
                displayOrder: item.displayOrder
            });
        } catch (error) {
            console.error('Error loading testimonial:', error);
            showToast('Erro ao carregar depoimento.', { type: 'error' });
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const data = {
                name: formData.name,
                city: formData.city || null,
                quote: formData.quote,
                rating: parseInt(formData.rating),
                photo: formData.photo || null,
                displayOrder: parseInt(formData.displayOrder) || 0
            };

            if (isEdit) {
                await updateTestimonial(id, data);
                showToast('Depoimento atualizado com sucesso!', { type: 'success' });
            } else {
                await createTestimonial(data);
                showToast('Depoimento criado com sucesso!', { type: 'success' });
            }
            navigate('/admin/testimonials');
        } catch (error) {
            console.error('Error saving testimonial:', error);
            showToast('Erro ao salvar depoimento.', { type: 'error' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div>
            <div className="mb-8">
                <button
                    onClick={() => navigate('/admin/testimonials')}
                    className="flex items-center gap-2 text-gray-400 hover:text-white mb-4"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Voltar
                </button>
                <h1 className="text-4xl font-display font-bold text-white uppercase mb-2">
                    {isEdit ? 'Editar Depoimento' : 'Novo Depoimento'}
                </h1>
                <p className="text-gray-400">Preencha os dados do depoimento</p>
            </div>

            <form onSubmit={handleSubmit} className="bg-gray-900 border border-gray-800 rounded-lg p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    <div>
                        <label className="block text-gray-400 text-sm mb-2 font-bold uppercase">Nome ou Apelido *</label>
                        <input
                            type="text"
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            required
                            placeholder="Ex: Rafael M."
                            className="w-full bg-black border border-gray-700 rounded p-3 text-white focus:border-harley-orange focus:outline-none"
                        />
                    </div>

                    <div>
                        <label className="block text-gray-400 text-sm mb-2 font-bold uppercase">Cidade (opcional)</label>
                        <input
                            type="text"
                            name="city"
                            value={formData.city}
                            onChange={handleChange}
                            placeholder="Ex: Porto Alegre, RS"
                            className="w-full bg-black border border-gray-700 rounded p-3 text-white focus:border-harley-orange focus:outline-none"
                        />
                    </div>

                    <div className="md:col-span-2">
                        <label className="block text-gray-400 text-sm mb-2 font-bold uppercase">Depoimento *</label>
                        <textarea
                            name="quote"
                            value={formData.quote}
                            onChange={handleChange}
                            required
                            rows={4}
                            placeholder="O que o cliente disse..."
                            className="w-full bg-black border border-gray-700 rounded p-3 text-white focus:border-harley-orange focus:outline-none resize-none"
                        />
                    </div>

                    <div>
                        <label className="block text-gray-400 text-sm mb-2 font-bold uppercase">Nota</label>
                        <div className="flex items-center gap-2">
                            {[1, 2, 3, 4, 5].map((star) => (
                                <button
                                    key={star}
                                    type="button"
                                    onClick={() => setFormData((prev) => ({ ...prev, rating: star }))}
                                    aria-label={`${star} estrela${star > 1 ? 's' : ''}`}
                                    className="p-1"
                                >
                                    <Star
                                        className={`w-7 h-7 transition-colors ${star <= formData.rating ? 'text-harley-orange fill-harley-orange' : 'text-gray-700 hover:text-gray-500'}`}
                                    />
                                </button>
                            ))}
                        </div>
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

                <div className="mb-6">
                    <label className="block text-gray-400 text-sm mb-2 font-bold uppercase">Foto do Cliente (opcional)</label>
                    <ImageUpload
                        currentImage={formData.photo}
                        onImageUploaded={(url) => setFormData((prev) => ({ ...prev, photo: url }))}
                        onImageRemoved={() => setFormData((prev) => ({ ...prev, photo: '' }))}
                        purpose="testimonial"
                    />
                    <p className="text-xs text-gray-500 mt-2">Sem foto, o card mostra a inicial do nome no lugar.</p>
                </div>

                <div className="flex gap-4">
                    <button
                        type="submit"
                        disabled={loading}
                        className="flex items-center gap-2 bg-harley-orange text-white px-6 py-3 rounded font-bold uppercase tracking-wide hover:bg-red-800 transition-colors disabled:opacity-50"
                    >
                        <Save className="w-5 h-5" />
                        {loading ? 'Salvando...' : 'Salvar Depoimento'}
                    </button>
                    <button
                        type="button"
                        onClick={() => navigate('/admin/testimonials')}
                        className="bg-gray-800 text-white px-6 py-3 rounded font-bold uppercase tracking-wide hover:bg-gray-700 transition-colors"
                    >
                        Cancelar
                    </button>
                </div>
            </form>
        </div>
    );
};

export default TestimonialForm;
