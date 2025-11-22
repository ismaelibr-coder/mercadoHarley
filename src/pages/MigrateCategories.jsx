import React, { useState } from 'react';
import { db } from '../services/firebase';
import { collection, getDocs, updateDoc, doc } from 'firebase/firestore';
import { CheckCircle, AlertCircle, RefreshCw } from 'lucide-react';

const MigrateCategories = () => {
    const [status, setStatus] = useState('idle'); // idle, running, success, error
    const [message, setMessage] = useState('');
    const [details, setDetails] = useState([]);

    // Map old categories to new standardized categories
    const categoryMapping = {
        'Escapamentos': 'Peças',
        'Bancos': 'Peças',
        'Guidões': 'Peças',
        'Retrovisores': 'Peças',
        'Faróis': 'Peças',
        'Peças': 'Peças',
        'Acessórios': 'Acessórios',
        'Vestuário': 'Vestuário',
        'Jaquetas': 'Vestuário',
        'Capacetes': 'Acessórios',
        'Luvas': 'Vestuário',
        'Botas': 'Vestuário'
    };

    const migrateProducts = async () => {
        setStatus('running');
        setMessage('Iniciando migração...');
        setDetails([]);
        const migrationDetails = [];

        try {
            const productsRef = collection(db, 'products');
            const snapshot = await getDocs(productsRef);

            migrationDetails.push(`📦 Total de produtos encontrados: ${snapshot.docs.length}`);
            setDetails([...migrationDetails]);

            let updatedCount = 0;
            let skippedCount = 0;

            for (const docSnapshot of snapshot.docs) {
                const product = docSnapshot.data();
                const productId = docSnapshot.id;
                const updates = {};

                // Map category
                const oldCategory = product.category || '';
                const newCategory = categoryMapping[oldCategory] || 'Peças'; // Default to Peças

                if (product.category !== newCategory) {
                    updates.category = newCategory;
                }

                // Add condition if missing
                if (!product.condition) {
                    updates.condition = 'Novo'; // Default to Novo
                }

                // Only update if there are changes
                if (Object.keys(updates).length > 0) {
                    await updateDoc(doc(db, 'products', productId), updates);
                    updatedCount++;
                    migrationDetails.push(
                        `✅ ${product.name}: ${oldCategory || 'sem categoria'} → ${newCategory}${!product.condition ? ', adicionado: Novo' : ''}`
                    );
                } else {
                    skippedCount++;
                    migrationDetails.push(`⏭️ ${product.name}: Já atualizado`);
                }

                setDetails([...migrationDetails]);
            }

            migrationDetails.push('');
            migrationDetails.push(`🎉 Migração concluída!`);
            migrationDetails.push(`✅ Produtos atualizados: ${updatedCount}`);
            migrationDetails.push(`⏭️ Produtos já atualizados: ${skippedCount}`);

            setDetails(migrationDetails);
            setMessage('Migração concluída com sucesso!');
            setStatus('success');
        } catch (error) {
            console.error('Error migrating products:', error);
            setMessage(`Erro durante a migração: ${error.message}`);
            setStatus('error');
            migrationDetails.push(`❌ Erro: ${error.message}`);
            setDetails(migrationDetails);
        }
    };

    return (
        <div className="bg-black min-h-screen py-12">
            <div className="container mx-auto px-4 max-w-4xl">
                <div className="mb-8 text-center">
                    <h1 className="text-4xl font-display font-bold text-white uppercase mb-4">
                        Migração de Categorias
                    </h1>
                    <div className="w-24 h-1 bg-harley-orange mx-auto mb-4"></div>
                    <p className="text-gray-400">
                        Atualiza produtos existentes com as novas categorias padronizadas e campo de condição
                    </p>
                </div>

                <div className="bg-gray-900 border border-gray-800 rounded-lg p-8">
                    <div className="mb-6">
                        <h2 className="text-xl font-bold text-white mb-4">Mapeamento de Categorias:</h2>
                        <div className="bg-black border border-gray-800 rounded p-4 text-sm">
                            <ul className="space-y-2 text-gray-400">
                                <li>• <span className="text-harley-orange">Peças:</span> Escapamentos, Bancos, Guidões, Retrovisores, Faróis</li>
                                <li>• <span className="text-harley-orange">Vestuário:</span> Jaquetas, Luvas, Botas</li>
                                <li>• <span className="text-harley-orange">Acessórios:</span> Capacetes e outros</li>
                            </ul>
                        </div>
                    </div>

                    <div className="mb-6">
                        <h2 className="text-xl font-bold text-white mb-4">O que será feito:</h2>
                        <ul className="space-y-2 text-gray-400">
                            <li>✓ Converter categorias antigas para: Peças, Vestuário ou Acessórios</li>
                            <li>✓ Adicionar campo "condição" com valor padrão "Novo"</li>
                            <li>✓ Manter produtos já atualizados sem alterações</li>
                        </ul>
                    </div>

                    <button
                        onClick={migrateProducts}
                        disabled={status === 'running'}
                        className="w-full bg-harley-orange text-white py-3 rounded font-bold uppercase tracking-wide hover:bg-orange-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        {status === 'running' ? (
                            <>
                                <RefreshCw className="w-5 h-5 animate-spin" />
                                Migrando...
                            </>
                        ) : (
                            <>
                                <RefreshCw className="w-5 h-5" />
                                Iniciar Migração
                            </>
                        )}
                    </button>

                    {message && (
                        <div className={`mt-6 p-4 rounded flex items-start gap-3 ${status === 'success' ? 'bg-green-900/30 border border-green-700' :
                                status === 'error' ? 'bg-red-900/30 border border-red-700' :
                                    'bg-blue-900/30 border border-blue-700'
                            }`}>
                            {status === 'success' && <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />}
                            {status === 'error' && <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />}
                            <div className="flex-1">
                                <p className={`font-bold ${status === 'success' ? 'text-green-400' :
                                        status === 'error' ? 'text-red-400' :
                                            'text-blue-400'
                                    }`}>
                                    {message}
                                </p>
                            </div>
                        </div>
                    )}

                    {details.length > 0 && (
                        <div className="mt-6 bg-black border border-gray-800 rounded p-4 max-h-96 overflow-y-auto">
                            <h3 className="text-white font-bold mb-3">Detalhes da Migração:</h3>
                            <div className="space-y-1 text-sm font-mono">
                                {details.map((detail, index) => (
                                    <div key={index} className="text-gray-400">
                                        {detail}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                <div className="mt-6 text-center">
                    <a
                        href="/admin/products"
                        className="text-harley-orange hover:text-white transition-colors font-bold"
                    >
                        ← Voltar para Produtos
                    </a>
                </div>
            </div>
        </div>
    );
};

export default MigrateCategories;
