import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Save, Info } from 'lucide-react';
import { getVideoSettings, updateVideoSettings } from '../../services/videoSettingsService';
import VideoUpload from '../../components/VideoUpload';
import ImageUpload from '../../components/ImageUpload';
import { useToast } from '../../components/ui/ToastProvider';

// Singleton settings page (there's only ever one Hero video), not a
// list+form CRUD like Banners/Gallery/Testimonials — same shape as
// AdminSettings.jsx's filter form.
const AdminVideoSettings = () => {
    const { showToast } = useToast();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [formData, setFormData] = useState({
        videoUrl: '',
        posterUrl: '',
        title: ''
    });

    useEffect(() => {
        loadSettings();
    }, []);

    const loadSettings = async () => {
        try {
            const settings = await getVideoSettings();
            if (settings) {
                setFormData({
                    videoUrl: settings.videoUrl || '',
                    posterUrl: settings.posterUrl || '',
                    title: settings.title || ''
                });
            }
        } catch (error) {
            console.error('Error loading video settings:', error);
            showToast('Erro ao carregar configurações de vídeo.', { type: 'error' });
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);

        try {
            await updateVideoSettings(formData);
            showToast('Vídeo do Hero atualizado com sucesso!', { type: 'success' });
        } catch (error) {
            console.error('Error saving video settings:', error);
            showToast('Erro ao salvar vídeo.', { type: 'error' });
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return <div className="text-center text-gray-400 py-12">Carregando...</div>;
    }

    return (
        <div>
            <div className="mb-8">
                <h1 className="text-4xl font-display font-bold text-white uppercase mb-2">
                    Vídeo do Hero
                </h1>
                <p className="text-gray-400">Vídeo de fundo em loop exibido no topo da home</p>
                <p className="text-gray-500 text-xs mt-2 flex items-center gap-1.5">
                    <Info className="w-3.5 h-3.5 flex-none" aria-hidden="true" />
                    O vídeo e o poster daqui aparecem sempre, por trás do banner do Hero — mas só quando existe um banner ativo com "Onde aparece: Hero" em <Link to="/admin/banners" className="underline hover:text-harley-orange">Banners</Link>, que é quem controla o título e o link do botão "Ver Mais". Sem esse banner, o Hero volta a mostrar o carrossel de produtos (não este vídeo).
                </p>
            </div>

            <form onSubmit={handleSubmit} className="bg-gray-900 border border-gray-800 rounded-lg p-6 max-w-3xl">
                <div className="mb-6">
                    <label className="block text-gray-400 text-sm mb-2 font-bold uppercase">Vídeo *</label>
                    <VideoUpload
                        currentVideo={formData.videoUrl}
                        onVideoUploaded={(url) => setFormData((prev) => ({ ...prev, videoUrl: url }))}
                        onVideoRemoved={() => setFormData((prev) => ({ ...prev, videoUrl: '' }))}
                    />
                    <p className="text-xs text-gray-500 mt-2">Recomendado: até ~15MB, sem áudio essencial — o vídeo toca mudo por padrão no site.</p>
                </div>

                <div className="mb-6">
                    <label className="block text-gray-400 text-sm mb-2 font-bold uppercase">Imagem de Poster / Fallback</label>
                    <ImageUpload
                        currentImage={formData.posterUrl}
                        onImageUploaded={(url) => setFormData((prev) => ({ ...prev, posterUrl: url }))}
                        onImageRemoved={() => setFormData((prev) => ({ ...prev, posterUrl: '' }))}
                        purpose="video-poster"
                    />
                    <p className="text-xs text-gray-500 mt-2">Aparece antes do vídeo carregar e no lugar dele, caso não consiga tocar (autoplay bloqueado, formato não suportado etc.).</p>
                </div>

                <div className="mb-6">
                    <label className="block text-gray-400 text-sm mb-2 font-bold uppercase">Título sobre o vídeo *</label>
                    <input
                        type="text"
                        name="title"
                        value={formData.title}
                        onChange={handleChange}
                        required
                        placeholder="Ex: Feita Pra Rodar"
                        className="w-full bg-black border border-gray-700 rounded p-3 text-white focus:border-harley-orange focus:outline-none"
                    />
                    <p className="text-xs text-gray-500 mt-1">Hoje o Hero sempre usa o título do banner ativo com "Onde aparece: Hero" em Banners — esse campo ainda não é exibido no site. Preencha mesmo assim; é reservado para quando o Hero funcionar sem precisar de um banner cadastrado.</p>
                </div>

                <button
                    type="submit"
                    disabled={saving}
                    className="flex items-center gap-2 bg-harley-orange text-white px-6 py-3 rounded font-bold uppercase tracking-wide hover:bg-red-800 transition-colors disabled:opacity-50"
                >
                    <Save className="w-5 h-5" />
                    {saving ? 'Salvando...' : 'Salvar Vídeo'}
                </button>
            </form>
        </div>
    );
};

export default AdminVideoSettings;
