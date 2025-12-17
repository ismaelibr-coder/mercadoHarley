import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Save, ArrowLeft, Package, DollarSign, Tag, Truck } from 'lucide-react';
import { createProduct, updateProduct, getProductById } from '../../services/productService';
import { getFilterSettings } from '../../services/settingsService';
import ImageUpload from '../../components/ImageUpload';

const PART_TYPES = [
    'Guidão',
    'Escapamento',
    'Banco',
    'Rodas',
    'Pneus',
    'Iluminação',
    'Filtro de Ar',
    'Motor',
    'Freios',
    'Suspensão',
    'Retrovisor',
    'Manoplas',
    'Alforges',
    'Pedaleiras',
    'Carenagem',
    'Outros'
];

const ProductForm = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const isEdit = Boolean(id);

    const [loading, setLoading] = useState(false);
    const [partners, setPartners] = useState(['Outros']); // Default fallback
    const [formData, setFormData] = useState({
        name: '',
        price: '',
        image: '',
        category: '',
        partType: '',
        partner: '',
        condition: '', // ... existing code
        rating: 5,
        stock: 10,
        description: '',
        profitMargin: '',
        featured: false, // Destaque na Loja (meio)
        featuredCarousel: false, // Destaque no Carrossel (topo)
        weight: '',
        height: '',
        width: '',
        length: '',
        specs: ['', '', '', '']
    });

    // Load partners from settings
    useEffect(() => {
        const loadSettings = async () => {
            try {
                const settings = await getFilterSettings();
                if (settings.partners && settings.partners.length > 0) {
                    setPartners(settings.partners);
                }
            } catch (error) {
                console.error('Error loading partners:', error);
            }
        };
        loadSettings();
    }, []);

    useEffect(() => {
        if (isEdit) {
            loadProduct();
        }
    }, [id]);

    const loadProduct = async () => {
        try {
            const product = await getProductById(id);
            setFormData({
                name: product.name || '',
                price: product.price || '',
                image: product.image || '',
                category: product.category || '',
                partType: product.partType || '',
                partner: product.partner || '',
                condition: product.condition || '',
                rating: product.rating || 5,
                stock: product.stock || 10,
                description: product.description || '',
                profitMargin: product.profitMargin || '',
                featured: product.featured || false,
                featuredCarousel: product.featuredCarousel || false,
                weight: product.dimensions?.weight || '',
                height: product.dimensions?.height || '',
                width: product.dimensions?.width || '',
                length: product.dimensions?.length || '',
                specs: product.specs || ['', '', '', '']
            });
        } catch (error) {
            console.error('Error loading product:', error);
            alert('Erro ao carregar produto.');
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;

        if (name === 'price') {
            const numericValue = value.replace(/[^\d,]/g, '');
            setFormData(prev => ({ ...prev, [name]: numericValue }));
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }
    };

    const formatCurrencyDisplay = (value) => {
        if (!value) return '';
        const numericValue = value.toString().replace(',', '.');
        const number = parseFloat(numericValue);
        if (isNaN(number)) return '';
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        }).format(number);
    };

    const handleSpecChange = (index, value) => {
        const newSpecs = [...formData.specs];
        newSpecs[index] = value;
        setFormData(prev => ({ ...prev, specs: newSpecs }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const productData = {
                ...formData,
                price: parseFloat(formData.price.replace(',', '.')) || 0,
                rating: parseInt(formData.rating),
                stock: parseInt(formData.stock) || 0,
                profitMargin: parseFloat(formData.profitMargin) || 0,
                dimensions: {
                    weight: parseFloat(formData.weight) || 0,
                    height: parseFloat(formData.height) || 0,
                    width: parseFloat(formData.width) || 0,
                    length: parseFloat(formData.length) || 0
                },
                specs: formData.specs.filter(spec => spec.trim() !== '')
            };

            // Remove flat dimension fields before saving to clean up data structure
            delete productData.weight;
            delete productData.height;
            delete productData.width;
            delete productData.length;

            if (isEdit) {
                await updateProduct(id, productData);
                alert('Produto atualizado com sucesso!');
            } else {
                await createProduct(productData);
                alert('Produto criado com sucesso!');
            }
            navigate('/admin/products');
        } catch (error) {
            console.error('Error saving product:', error);
            alert('Erro ao salvar produto.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div>
            <div className="mb-8">
                <button
                    onClick={() => navigate('/admin/products')}
                    className="flex items-center gap-2 text-gray-400 hover:text-white mb-4"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Voltar
                </button>
                <h1 className="text-4xl font-display font-bold text-white uppercase mb-2">
                    {isEdit ? 'Editar Produto' : 'Novo Produto'}
                </h1>
                <p className="text-gray-400">Preencha os dados do produto</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-8">

                {/* Informações Básicas */}
                <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
                    <div className="flex items-center gap-2 mb-6 pb-2 border-b border-gray-800">
                        <Tag className="w-5 h-5 text-sick-red" />
                        <h2 className="text-xl font-bold text-white uppercase">Informações Básicas</h2>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="md:col-span-2">
                            <label className="block text-gray-400 text-sm mb-2 font-bold uppercase">Nome do Produto *</label>
                            <input
                                type="text"
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                required
                                className="w-full bg-black border border-gray-700 rounded p-3 text-white focus:border-sick-red focus:outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-gray-400 text-sm mb-2 font-bold uppercase">Parceiro / Marca</label>
                            <select
                                name="partner"
                                value={formData.partner}
                                onChange={handleChange}
                                className="w-full bg-black border border-gray-700 rounded p-3 text-white focus:border-sick-red focus:outline-none"
                            >
                                <option value="">Selecione um parceiro</option>
                                {partners.map(p => (
                                    <option key={p} value={p}>{p}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-gray-400 text-sm mb-2 font-bold uppercase">Tipo de Peça</label>
                            <select
                                name="partType"
                                value={formData.partType}
                                onChange={handleChange}
                                className="w-full bg-black border border-gray-700 rounded p-3 text-white focus:border-sick-red focus:outline-none"
                            >
                                <option value="">Selecione o tipo de peça</option>
                                {PART_TYPES.map(t => (
                                    <option key={t} value={t}>{t}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-gray-400 text-sm mb-2 font-bold uppercase">Categoria *</label>
                            <select
                                name="category"
                                value={formData.category}
                                onChange={handleChange}
                                required
                                className="w-full bg-black border border-gray-700 rounded p-3 text-white focus:border-sick-red focus:outline-none"
                            >
                                <option value="">Selecione uma categoria</option>
                                <option value="Peças">Peças</option>
                                <option value="Vestuário">Vestuário</option>
                                <option value="Acessórios">Acessórios</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-gray-400 text-sm mb-2 font-bold uppercase">Descrição *</label>
                            <textarea
                                name="description"
                                value={formData.description}
                                onChange={handleChange}
                                required
                                rows="4"
                                className="w-full bg-black border border-gray-700 rounded p-3 text-white focus:border-sick-red focus:outline-none resize-none"
                            ></textarea>
                        </div>
                    </div>
                </div>

                {/* Financeiro & Estoque */}
                <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
                    <div className="flex items-center gap-2 mb-6 pb-2 border-b border-gray-800">
                        <DollarSign className="w-5 h-5 text-sick-red" />
                        <h2 className="text-xl font-bold text-white uppercase">Financeiro & Estoque</h2>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <div>
                            <label className="block text-gray-400 text-sm mb-2 font-bold uppercase">Preço Venda (R$) *</label>
                            <div className="relative">
                                <span className="absolute left-3 top-3.5 text-gray-400 font-bold">R$</span>
                                <input
                                    type="text"
                                    name="price"
                                    value={formData.price}
                                    onChange={handleChange}
                                    placeholder="0,00"
                                    required
                                    className="w-full bg-black border border-gray-700 rounded p-3 pl-12 text-white focus:border-sick-red focus:outline-none"
                                />
                            </div>
                            {formData.price && (
                                <p className="text-xs text-green-500 mt-1 font-bold">
                                    {formatCurrencyDisplay(formData.price)}
                                </p>
                            )}
                        </div>
                        <div>
                            <label className="block text-gray-400 text-sm mb-2 font-bold uppercase">Margem de Lucro (%)</label>
                            <div className="relative">
                                <input
                                    type="number"
                                    name="profitMargin"
                                    value={formData.profitMargin}
                                    onChange={handleChange}
                                    placeholder="0"
                                    min="0"
                                    className="w-full bg-black border border-gray-700 rounded p-3 text-white focus:border-sick-red focus:outline-none"
                                />
                                <span className="absolute right-3 top-3.5 text-gray-400 font-bold">%</span>
                            </div>
                        </div>
                        <div>
                            <label className="block text-gray-400 text-sm mb-2 font-bold uppercase">Estoque (Qtd) *</label>
                            <input
                                type="number"
                                name="stock"
                                value={formData.stock}
                                onChange={handleChange}
                                min="0"
                                required
                                className="w-full bg-black border border-gray-700 rounded p-3 text-white focus:border-sick-red focus:outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-gray-400 text-sm mb-2 font-bold uppercase">Condição *</label>
                            <select
                                name="condition"
                                value={formData.condition}
                                onChange={handleChange}
                                required
                                className="w-full bg-black border border-gray-700 rounded p-3 text-white focus:border-sick-red focus:outline-none"
                            >
                                <option value="">Selecione</option>
                                <option value="Novo">Novo</option>
                                <option value="Usado">Usado</option>
                            </select>
                        </div>
                        <div>
                            <label className="flex items-center gap-2 text-gray-400 text-sm font-bold uppercase cursor-pointer mt-8">
                                <input
                                    type="checkbox"
                                    name="featured"
                                    checked={formData.featured}
                                    onChange={(e) => setFormData(prev => ({ ...prev, featured: e.target.checked }))}
                                    className="rounded bg-black border-gray-700 text-sick-red focus:ring-sick-red focus:ring-offset-0 w-5 h-5"
                                />
                                <span>Produto em Destaque (Home)</span>
                            </label>
                        </div>
                    </div>
                </div>

                {/* Envio e Dimensões */}
                <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
                    <div className="flex items-center gap-2 mb-6 pb-2 border-b border-gray-800">
                        <Truck className="w-5 h-5 text-sick-red" />
                        <h2 className="text-xl font-bold text-white uppercase">Envio & Dimensões (Melhor Envio)</h2>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                        <div>
                            <label className="block text-gray-400 text-sm mb-2 font-bold uppercase">Peso (kg)</label>
                            <input
                                type="number"
                                name="weight"
                                value={formData.weight}
                                onChange={handleChange}
                                placeholder="0.00"
                                step="0.01"
                                min="0"
                                className="w-full bg-black border border-gray-700 rounded p-3 text-white focus:border-sick-red focus:outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-gray-400 text-sm mb-2 font-bold uppercase">Altura (cm)</label>
                            <input
                                type="number"
                                name="height"
                                value={formData.height}
                                onChange={handleChange}
                                placeholder="0"
                                min="0"
                                className="w-full bg-black border border-gray-700 rounded p-3 text-white focus:border-sick-red focus:outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-gray-400 text-sm mb-2 font-bold uppercase">Largura (cm)</label>
                            <input
                                type="number"
                                name="width"
                                value={formData.width}
                                onChange={handleChange}
                                placeholder="0"
                                min="0"
                                className="w-full bg-black border border-gray-700 rounded p-3 text-white focus:border-sick-red focus:outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-gray-400 text-sm mb-2 font-bold uppercase">Comprimento (cm)</label>
                            <input
                                type="number"
                                name="length"
                                value={formData.length}
                                onChange={handleChange}
                                placeholder="0"
                                min="0"
                                className="w-full bg-black border border-gray-700 rounded p-3 text-white focus:border-sick-red focus:outline-none"
                            />
                        </div>
                    </div>
                </div>

                {/* Imagens e Extras */}
                <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
                    <div className="flex items-center gap-2 mb-6 pb-2 border-b border-gray-800">
                        <Package className="w-5 h-5 text-sick-red" />
                        <h2 className="text-xl font-bold text-white uppercase">Mídia & Extras</h2>
                    </div>

                    <div className="mb-6">
                        <label className="block text-gray-400 text-sm mb-2 font-bold uppercase">Imagem do Produto *</label>
                        <ImageUpload
                            currentImage={formData.image}
                            onImageUploaded={(url) => setFormData(prev => ({ ...prev, image: url }))}
                            onImageRemoved={() => setFormData(prev => ({ ...prev, image: '' }))}
                        />
                    </div>

                    <div className="mb-6">
                        <label className="block text-gray-400 text-sm mb-2 font-bold uppercase">Avaliação Inicial (1-5)</label>
                        <input
                            type="number"
                            name="rating"
                            value={formData.rating}
                            onChange={handleChange}
                            min="1"
                            max="5"
                            className="w-full bg-black border border-gray-700 rounded p-3 text-white focus:border-sick-red focus:outline-none"
                        />
                    </div>

                    <div className="mb-6">
                        <label className="block text-gray-400 text-sm mb-2 font-bold uppercase">Especificações Técnicas</label>
                        {formData.specs.map((spec, index) => (
                            <input
                                key={index}
                                type="text"
                                value={spec}
                                onChange={(e) => handleSpecChange(index, e.target.value)}
                                placeholder={`Especificação ${index + 1}`}
                                className="w-full bg-black border border-gray-700 rounded p-3 text-white focus:border-sick-red focus:outline-none mb-3"
                            />
                        ))}
                    </div>

                    {/* Checkboxes de Destaque */}
                    <div className="border-t border-gray-800 pt-6 mt-6">
                        <label className="block text-gray-400 text-sm mb-4 font-bold uppercase">Opções de Destaque</label>
                        <div className="flex flex-col gap-4">
                            <label className="flex items-center gap-3 cursor-pointer hover:bg-gray-800 p-3 rounded transition-colors">
                                <input
                                    type="checkbox"
                                    name="featuredCarousel"
                                    checked={formData.featuredCarousel}
                                    onChange={(e) => setFormData(prev => ({ ...prev, featuredCarousel: e.target.checked }))}
                                    className="w-5 h-5 accent-sick-red cursor-pointer"
                                />
                                <div>
                                    <span className="text-white font-bold">Destaque no Carrossel (Topo)</span>
                                    <p className="text-gray-500 text-sm">Aparece no carrossel principal da home (até 5 produtos)</p>
                                </div>
                            </label>

                            <label className="flex items-center gap-3 cursor-pointer hover:bg-gray-800 p-3 rounded transition-colors">
                                <input
                                    type="checkbox"
                                    name="featured"
                                    checked={formData.featured}
                                    onChange={(e) => setFormData(prev => ({ ...prev, featured: e.target.checked }))}
                                    className="w-5 h-5 accent-sick-red cursor-pointer"
                                />
                                <div>
                                    <span className="text-white font-bold">Destaque na Loja (Meio)</span>
                                    <p className="text-gray-500 text-sm">Aparece na seção "Destaques da Loja" (até 6 produtos)</p>
                                </div>
                            </label>
                        </div>
                    </div>
                </div>

                <div className="flex gap-4 pt-4">
                    <button
                        type="submit"
                        disabled={loading}
                        className="flex items-center gap-2 bg-sick-red text-white px-8 py-4 rounded font-bold uppercase tracking-wide hover:bg-red-700 transition-colors disabled:opacity-50 text-lg shadow-lg hover:shadow-red-900/20"
                    >
                        <Save className="w-6 h-6" />
                        {loading ? 'Salvando...' : 'Salvar Produto'}
                    </button>
                    <button
                        type="button"
                        onClick={() => navigate('/admin/products')}
                        className="bg-gray-800 text-white px-8 py-4 rounded font-bold uppercase tracking-wide hover:bg-gray-700 transition-colors"
                    >
                        Cancelar
                    </button>
                </div>
            </form>
        </div>
    );
};

export default ProductForm;
