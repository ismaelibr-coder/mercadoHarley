import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, X, Video as VideoIcon, Loader } from 'lucide-react';
import { uploadVideo } from '../services/uploadService';

// Same drag-and-drop upload UX as ImageUpload.jsx, but for the Hero's
// background video — preview is a muted <video> instead of an <img>, and the
// size ceiling matches the backend's 80MB video limit (vs. images' 10MB).
const VideoUpload = ({ currentVideo, onVideoUploaded, onVideoRemoved }) => {
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState('');
    const [preview, setPreview] = useState(currentVideo || '');

    const onDrop = useCallback(async (acceptedFiles) => {
        const file = acceptedFiles[0];
        if (!file) return;

        if (file.size > 80 * 1024 * 1024) {
            setError('Vídeo muito grande. Máximo 80MB.');
            return;
        }

        setUploading(true);
        setError('');

        try {
            const result = await uploadVideo(file);
            setPreview(result.url);
            onVideoUploaded(result.url);
        } catch (err) {
            console.error('Video upload error:', err);
            setError(err.error || 'Erro ao fazer upload do vídeo.');
        } finally {
            setUploading(false);
        }
    }, [onVideoUploaded]);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: { 'video/*': ['.mp4', '.webm'] },
        maxFiles: 1,
        disabled: uploading
    });

    const handleRemove = () => {
        setPreview('');
        setError('');
        onVideoRemoved();
    };

    return (
        <div className="space-y-4">
            {preview ? (
                <div className="relative">
                    <video
                        src={preview}
                        controls
                        muted
                        className="w-full h-64 object-contain rounded-lg border border-gray-700 bg-black"
                    />
                    <button
                        type="button"
                        onClick={handleRemove}
                        className="absolute top-2 right-2 bg-red-600 text-white p-2 rounded-full hover:bg-red-700 transition-colors"
                    >
                        <X className="w-4 h-4" />
                    </button>
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
                                    <p className="text-white font-bold">Solte o vídeo aqui</p>
                                </>
                            ) : (
                                <>
                                    <VideoIcon className="w-12 h-12 text-gray-500" />
                                    <div>
                                        <p className="text-white font-bold mb-1">
                                            Arraste um vídeo ou clique para selecionar
                                        </p>
                                        <p className="text-gray-400 text-sm">
                                            MP4 ou WEBM até 80MB
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

export default VideoUpload;
