import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Save, ArrowLeft } from 'lucide-react';
import { createProduct, updateProduct, getProductById } from '../../services/productService';

const ProductForm = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const isEdit = Boolean(id);

    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        price: '',
        image: '',
        category: '',
        condition: '',
        rating: 5,
        description: '',
        specs: ['', '', '', '']
    });

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
                condition: product.condition || '',
                rating: product.rating || 5,
                description: product.description || '',
                specs: product.specs || ['', '', '', '']
            });
        } catch (error) {
            console.error('Error loading product:', error);
            alert('Erro ao carregar produto.');
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
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
                rating: parseInt(formData.rating),
                specs: formData.specs.filter(spec => spec.trim() !== '')
            };

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

            <form onSubmit={handleSubmit} className="bg-gray-900 border border-gray-800 rounded-lg p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    <div>
                        <label className="block text-gray-400 text-sm mb-2 font-bold uppercase">Nome do Produto *</label>
                        <input
                            type="text"
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            required
                            className="w-full bg-black border border-gray-700 rounded p-3 text-white focus:border-harley-orange focus:outline-none"
                        />
                    </div>

                    <div>
                        <label className="block text-gray-400 text-sm mb-2 font-bold uppercase">Preço *</label>
                        <input
                            type="text"
                            name="price"
                            value={formData.price}
                            onChange={handleChange}
                            placeholder="R$ 0,00"
                            required
                            className="w-full bg-black border border-gray-700 rounded p-3 text-white focus:border-harley-orange focus:outline-none"
                        />
                    </div>

                    <div>
                        <label className="block text-gray-400 text-sm mb-2 font-bold uppercase">Categoria *</label>
                        <select
                            name="category"
                            value={formData.category}
                            onChange={handleChange}
                            required
                            className="w-full bg-black border border-gray-700 rounded p-3 text-white focus:border-harley-orange focus:outline-none"
                        >
                            <option value="">Selecione uma categoria</option>
                            <option value="Peças">Peças</option>
                            <option value="Vestuário">Vestuário</option>
                            <option value="Acessórios">Acessórios</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-gray-400 text-sm mb-2 font-bold uppercase">Condição *</label>
                        <select
                            name="condition"
                            value={formData.condition}
                            onChange={handleChange}
                            required
                            className="w-full bg-black border border-gray-700 rounded p-3 text-white focus:border-harley-orange focus:outline-none"
                        >
                            <option value="">Selecione a condição</option>
                            <option value="Novo">Novo</option>
                            <option value="Usado">Usado</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-gray-400 text-sm mb-2 font-bold uppercase">Avaliação (1-5)</label>
                        <input
                            type="number"
                            name="rating"
                            value={formData.rating}
                            onChange={handleChange}
                            min="1"
                            max="5"
                            className="w-full bg-black border border-gray-700 rounded p-3 text-white focus:border-harley-orange focus:outline-none"
                        />
                    </div>
                </div>

                <div className="mb-6">
                    <label className="block text-gray-400 text-sm mb-2 font-bold uppercase">URL da Imagem *</label>
                    <input
                        type="url"
                        name="image"
                        value={formData.image}
                        onChange={handleChange}
                        required
                        className="w-full bg-black border border-gray-700 rounded p-3 text-white focus:border-harley-orange focus:outline-none"
                    />
                    {formData.image && (
                        <img src={formData.image} alt="Preview" className="mt-3 w-32 h-32 object-cover rounded" />
                    )}
                </div>

                <div className="mb-6">
                    <label className="block text-gray-400 text-sm mb-2 font-bold uppercase">Descrição *</label>
                    <textarea
                        name="description"
                        value={formData.description}
                        onChange={handleChange}
                        required
                        rows="4"
                        className="w-full bg-black border border-gray-700 rounded p-3 text-white focus:border-harley-orange focus:outline-none resize-none"
                    ></textarea>
                </div>

                <div className="mb-6">
                    <label className="block text-gray-400 text-sm mb-2 font-bold uppercase">Especificações</label>
                    {formData.specs.map((spec, index) => (
                        <input
                            key={index}
                            type="text"
                            value={spec}
                            onChange={(e) => handleSpecChange(index, e.target.value)}
                            placeholder={`Especificação ${index + 1}`}
                            className="w-full bg-black border border-gray-700 rounded p-3 text-white focus:border-harley-orange focus:outline-none mb-3"
                        />
                    ))}
                </div>

                <div className="flex gap-4">
                    <button
                        type="submit"
                        disabled={loading}
                        className="flex items-center gap-2 bg-harley-orange text-white px-6 py-3 rounded font-bold uppercase tracking-wide hover:bg-orange-700 transition-colors disabled:opacity-50"
                    >
                        <Save className="w-5 h-5" />
                        {loading ? 'Salvando...' : 'Salvar Produto'}
                    </button>
                    <button
                        type="button"
                        onClick={() => navigate('/admin/products')}
                        className="bg-gray-800 text-white px-6 py-3 rounded font-bold uppercase tracking-wide hover:bg-gray-700 transition-colors"
                    >
                        Cancelar
                    </button>
                </div>
            </form>
        </div>
    );
};

export default ProductForm;
