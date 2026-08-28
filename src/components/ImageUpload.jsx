import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, X, Image as ImageIcon, Loader } from 'lucide-react';
import { uploadImage } from '../services/uploadService';

const ImageUpload = ({ currentImage, onImageUploaded, onImageRemoved, purpose }) => {
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState('');
    const [preview, setPreview] = useState(currentImage || '');

    const onDrop = useCallback(async (acceptedFiles) => {
        const file = acceptedFiles[0];

        if (!file) return;

        // Validate file size (10MB)
        if (file.size > 10 * 1024 * 1024) {
            setError('Imagem muito grande. Máximo 10MB.');
            return;
        }

        setUploading(true);
        setError('');

        try {
            const result = await uploadImage(file, { purpose });
            setPreview(result.url);
            onImageUploaded(result.url, result.publicId);
        } catch (err) {
            console.error('Upload error:', err);
            setError(err.error || 'Erro ao fazer upload da imagem.');
        } finally {
            setUploading(false);
        }
    }, [onImageUploaded, purpose]);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: {
            'image/*': ['.jpeg', '.jpg', '.png', '.webp', '.gif']
        },
        maxFiles: 1,
        disabled: uploading
    });

    const handleRemove = () => {
        setPreview('');
        setError('');
        onImageRemoved();
    };

    return (
        <div className="space-y-4">
            {preview ? (
                <div className="relative">
                    <img
                        src={preview}
                        alt="Preview"
                        className="w-full h-64 object-contain rounded-lg border border-gray-700 bg-white p-3"
                    />
                    <button
                        type="button"
                        onClick={handleRemove}
                        className="absolute top-2 right-2 bg-red-600 text-white p-2 rounded-full hover:bg-red-700 transition-colors"
                    >
                        <X className="w-4 h-4" />
                    </button>
                    <p className="text-gray-500 text-xs mt-2">
                        {purpose === 'product'
                            ? 'O fundo é padronizado em branco automaticamente ao salvar. Envie uma foto com o produto inteiro visível — o enquadramento é ajustado, mas nada que já esteja cortado na foto original é recuperado.'
                            : 'Assim a foto vai aparecer no site. Fotos com fundo branco/neutro e o produto centralizado ficam mais consistentes com o resto do catálogo.'}
                    </p>
                </div>
            ) : (
                <div
                    {...getRootProps()}
                    className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${isDragActive
                            ? 'border-harley-orange bg-harley-orange/10'
                            : 'border-gray-700 hover:border-gray-600'
                        } ${uploading ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                    <input {...getInputProps()} />

                    {uploading ? (
                        <div className="flex flex-col items-center gap-3">
                            <Loader className="w-12 h-12 text-harley-orange animate-spin" />
                            <p className="text-gray-400">Fazendo upload...</p>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center gap-3">
                            {isDragActive ? (
                                <>
                                    <Upload className="w-12 h-12 text-harley-orange" />
                                    <p className="text-white font-bold">Solte a imagem aqui</p>
                                </>
                            ) : (
                                <>
                                    <ImageIcon className="w-12 h-12 text-gray-500" />
                                    <div>
                                        <p className="text-white font-bold mb-1">
                                            Arraste uma imagem ou clique para selecionar
                                        </p>
                                        <p className="text-gray-400 text-sm">
                                            PNG, JPG, WEBP até 10MB
                                        </p>
                                    </div>
                                </>
                            )}
                        </div>
                    )}
                </div>
            )}

            {error && (
                <div className="bg-red-500/10 border border-red-500 text-red-500 p-3 rounded text-sm">
                    {error}
                </div>
            )}
        </div>
    );
};

export default ImageUpload;
