import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Save, ArrowLeft } from 'lucide-react';
import { createBanner, updateBanner, getBannerById } from '../../services/bannerService';
import { getAllProducts } from '../../services/productService';
import ImageUpload from '../../components/ImageUpload';

const BannerForm = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const isEdit = Boolean(id);

    const [loading, setLoading] = useState(false);
    const [products, setProducts] = useState([]);
    const [formData, setFormData] = useState({
        title: '',
        image: '',
        linkType: 'category',
        linkValue: '',
        displayType: 'carousel',
        order: 0,
        active: true
    });

    const categories = ['Peças', 'Vestuário', 'Acessórios'];

    useEffect(() => {
        loadProducts();
        if (isEdit) {
            loadBanner();
        }
    }, [id]);

    const loadProducts = async () => {
        try {
            const data = await getAllProducts();
            setProducts(data);
        } catch (error) {
            console.error('Error loading products:', error);
        }
    };

    const loadBanner = async () => {
        try {
            const banner = await getBannerById(id);
            setFormData({
                title: banner.title,
                image: banner.image,
                linkType: banner.link.type,
                linkValue: banner.link.value,
                displayType: banner.displayType || 'carousel',
                order: banner.order,
                active: banner.active
            });
        } catch (error) {
            console.error('Error loading banner:', error);
            alert('Erro ao carregar banner.');
        }
    };

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const bannerData = {
                title: formData.title,
                image: formData.image,
                link: {
                    type: formData.linkType,
                    value: formData.linkValue
                },
                displayType: formData.displayType,
                order: parseInt(formData.order),
                active: formData.active
            };

            if (isEdit) {
                await updateBanner(id, bannerData);
                alert('Banner atualizado com sucesso!');
            } else {
                await createBanner(bannerData);
                alert('Banner criado com sucesso!');
            }
            navigate('/admin/banners');
        } catch (error) {
            console.error('Error saving banner:', error);
            alert('Erro ao salvar banner.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div>
            <div className="mb-8">
                <button
                    onClick={() => navigate('/admin/banners')}
                    className="flex items-center gap-2 text-gray-400 hover:text-white mb-4"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Voltar
                </button>
                <h1 className="text-4xl font-display font-bold text-white uppercase mb-2">
                    {isEdit ? 'Editar Banner' : 'Novo Banner'}
                </h1>
                <p className="text-gray-400">Preencha os dados do banner</p>
            </div>

            <form onSubmit={handleSubmit} className="bg-gray-900 border border-gray-800 rounded-lg p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    <div className="md:col-span-2">
                        <label className="block text-gray-400 text-sm mb-2 font-bold uppercase">Título *</label>
                        <input
                            type="text"
                            name="title"
                            value={formData.title}
                            onChange={handleChange}
                            required
                            className="w-full bg-black border border-gray-700 rounded p-3 text-white focus:border-harley-orange focus:outline-none"
                        />
                    </div>

                    <div>
                        <label className="block text-gray-400 text-sm mb-2 font-bold uppercase">Tipo de Exibição *</label>
                        <select
                            name="displayType"
                            value={formData.displayType}
                            onChange={handleChange}
                            required
                            className="w-full bg-black border border-gray-700 rounded p-3 text-white focus:border-harley-orange focus:outline-none"
                        >
                            <option value="carousel">Carrossel (Rotativo)</option>
                            <option value="hero">Hero (Fixo)</option>
                        </select>
                        <p className="text-xs text-gray-500 mt-1">Carrossel: múltiplos banners rotativos | Hero: banner fixo estilo destaque</p>
                    </div>

                    <div>
                        <label className="block text-gray-400 text-sm mb-2 font-bold uppercase">Tipo de Link *</label>
                        <select
                            name="linkType"
                            value={formData.linkType}
                            onChange={handleChange}
                            required
                            className="w-full bg-black border border-gray-700 rounded p-3 text-white focus:border-harley-orange focus:outline-none"
                        >
                            <option value="category">Categoria</option>
                            <option value="product">Produto</option>
                            <option value="external">URL Externa</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-gray-400 text-sm mb-2 font-bold uppercase">Destino do Link *</label>
                        {formData.linkType === 'category' ? (
                            <select
                                name="linkValue"
                                value={formData.linkValue}
                                onChange={handleChange}
                                required
                                className="w-full bg-black border border-gray-700 rounded p-3 text-white focus:border-harley-orange focus:outline-none"
                            >
                                <option value="">Selecione uma categoria</option>
                                {categories.map(cat => (
                                    <option key={cat} value={cat}>{cat}</option>
                                ))}
                            </select>
                        ) : formData.linkType === 'product' ? (
                            <select
                                name="linkValue"
                                value={formData.linkValue}
                                onChange={handleChange}
                                required
                                className="w-full bg-black border border-gray-700 rounded p-3 text-white focus:border-harley-orange focus:outline-none"
                            >
                                <option value="">Selecione um produto</option>
                                {products.map(product => (
                                    <option key={product.id} value={product.id}>{product.name}</option>
                                ))}
                            </select>
                        ) : (
                            <input
                                type="url"
                                name="linkValue"
                                value={formData.linkValue}
                                onChange={handleChange}
                                placeholder="https://exemplo.com"
                                required
                                className="w-full bg-black border border-gray-700 rounded p-3 text-white focus:border-harley-orange focus:outline-none"
                            />
                        )}
                    </div>

                    <div>
                        <label className="block text-gray-400 text-sm mb-2 font-bold uppercase">Ordem de Exibição</label>
                        <input
                            type="number"
                            name="order"
                            value={formData.order}
                            onChange={handleChange}
                            min="0"
                            className="w-full bg-black border border-gray-700 rounded p-3 text-white focus:border-harley-orange focus:outline-none"
                        />
                        <p className="text-xs text-gray-500 mt-1">Menor número = maior prioridade</p>
                    </div>

                    <div className="flex items-center">
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input
                                type="checkbox"
                                name="active"
                                checked={formData.active}
                                onChange={handleChange}
                                className="w-5 h-5 bg-black border border-gray-700 rounded focus:ring-harley-orange"
                            />
                            <span className="text-gray-400 font-bold uppercase text-sm">Banner Ativo</span>
                        </label>
                    </div>
                </div>

                <div className="mb-6">
                    <label className="block text-gray-400 text-sm mb-2 font-bold uppercase">Imagem do Banner *</label>
                    <ImageUpload
                        currentImage={formData.image}
                        onImageUploaded={(url) => setFormData(prev => ({ ...prev, image: url }))}
                        onImageRemoved={() => setFormData(prev => ({ ...prev, image: '' }))}
                    />
                    <p className="text-xs text-gray-500 mt-2">Recomendado: 1920x600px (proporção 16:5)</p>
                </div>

                <div className="flex gap-4">
                    <button
                        type="submit"
                        disabled={loading}
                        className="flex items-center gap-2 bg-harley-orange text-white px-6 py-3 rounded font-bold uppercase tracking-wide hover:bg-orange-700 transition-colors disabled:opacity-50"
                    >
                        <Save className="w-5 h-5" />
                        {loading ? 'Salvando...' : 'Salvar Banner'}
                    </button>
                    <button
                        type="button"
                        onClick={() => navigate('/admin/banners')}
                        className="bg-gray-800 text-white px-6 py-3 rounded font-bold uppercase tracking-wide hover:bg-gray-700 transition-colors"
                    >
                        Cancelar
                    </button>
                </div>
            </form>
        </div>
    );
};

export default BannerForm;
