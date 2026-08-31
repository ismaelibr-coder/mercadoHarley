import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Save, ArrowLeft } from 'lucide-react';
import { createBanner, updateBanner, getBannerById } from '../../services/bannerService';
import { getAllProducts } from '../../services/productService';
import ImageUpload from '../../components/ImageUpload';
import { useToast } from '../../components/ui/ToastProvider';

const BannerForm = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { showToast } = useToast();
    const isEdit = Boolean(id);

    const [loading, setLoading] = useState(false);
    const [products, setProducts] = useState([]);
    const [formData, setFormData] = useState({
        title: '',
        image: '',
        linkType: 'category',
        linkValue: '',
        placement: 'hero',
        order: 0,
        active: true
    });

    const categories = ['Peças', 'Vestuário', 'Acessórios'];

    // Where this banner shows on the site. 'hero' replaces the homepage's product
    // carousel when active; the 4 category-* placements become that category
    // card's background image on the home instead of the default icon.
    const PLACEMENTS = [
        { value: 'hero', label: 'Hero (topo da home)' },
        { value: 'category-pecas', label: 'Card de categoria — Peças' },
        { value: 'category-acessorios', label: 'Card de categoria — Acessórios' },
        { value: 'category-vestuario', label: 'Card de categoria — Vestuário' },
        { value: 'category-eletrica', label: 'Card de categoria — Elétrica & Iluminação' }
    ];

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
                linkType: banner.link?.type || 'category',
                linkValue: banner.link?.value || '',
                placement: banner.placement || 'hero',
                order: banner.displayOrder,
                active: banner.active
            });
        } catch (error) {
            console.error('Error loading banner:', error);
            showToast('Erro ao carregar banner.', { type: 'error' });
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
                placement: formData.placement,
                order: parseInt(formData.order),
                active: formData.active
            };

            if (isEdit) {
                await updateBanner(id, bannerData);
                showToast('Banner atualizado com sucesso!', { type: 'success' });
            } else {
                await createBanner(bannerData);
                showToast('Banner criado com sucesso!', { type: 'success' });
            }
            navigate('/admin/banners');
        } catch (error) {
            console.error('Error saving banner:', error);
            showToast('Erro ao salvar banner.', { type: 'error' });
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
                        <label className="block text-gray-400 text-sm mb-2 font-bold uppercase">Onde aparece *</label>
                        <select
                            name="placement"
                            value={formData.placement}
                            onChange={handleChange}
                            required
                            className="w-full bg-black border border-gray-700 rounded p-3 text-white focus:border-harley-orange focus:outline-none"
                        >
                            {PLACEMENTS.map((p) => (
                                <option key={p.value} value={p.value}>{p.label}</option>
                            ))}
                        </select>
                        <p className="text-xs text-gray-500 mt-1">Só um banner ativo por local é usado por vez. Ativar um novo aqui não apaga o anterior — ele fica inativo e pode ser reativado.</p>
                        {formData.placement === 'hero' && (
                            <p className="text-xs text-harley-orange/80 mt-2 bg-harley-orange/10 border border-harley-orange/30 rounded p-2">
                                💡 O topo da home mostra um <strong>vídeo</strong> de fundo, cadastrado à parte em <strong>Vídeo</strong> (menu lateral) — não a imagem enviada aqui embaixo. Este banner só controla o <strong>título</strong> e o <strong>link do botão "Ver Mais"</strong>. A imagem serve apenas de reserva, caso o vídeo não consiga carregar.
                            </p>
                        )}
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
                        purpose="banner"
                    />
                    <p className="text-xs text-gray-500 mt-2">Recomendado: 1920x600px (proporção 16:5)</p>
                </div>

                <div className="flex gap-4">
                    <button
                        type="submit"
                        disabled={loading}
                        className="flex items-center gap-2 bg-harley-orange text-white px-6 py-3 rounded font-bold uppercase tracking-wide hover:bg-red-800 transition-colors disabled:opacity-50"
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
