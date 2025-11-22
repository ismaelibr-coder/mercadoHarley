import React, { useState } from 'react';
import { Upload, AlertCircle } from 'lucide-react';
import { db } from '../services/firebase';
import { collection, addDoc } from 'firebase/firestore';
import { products } from '../data/products';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';

const SeedDatabase = () => {
    const { currentUser } = useAuth();
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState('');
    const [migrated, setMigrated] = useState(0);

    const handleSeed = async () => {
        if (!currentUser) {
            alert('Você precisa estar logado para migrar produtos!');
            return;
        }

        setLoading(true);
        setStatus('Iniciando migração...');
        setMigrated(0);

        try {
            for (let i = 0; i < products.length; i++) {
                const product = products[i];
                // Remove the id field since Firestore will generate its own
                const { id, ...productData } = product;

                await addDoc(collection(db, 'products'), {
                    ...productData,
                    createdAt: new Date(),
                    updatedAt: new Date()
                });

                setMigrated(i + 1);
                setStatus(`Migrado: ${product.name} (${i + 1}/${products.length})`);
            }

            setStatus(`✅ Sucesso! ${products.length} produtos migrados para o Firestore!`);
            alert(`Migração concluída! ${products.length} produtos adicionados ao Firestore.\n\nAgora você pode:\n1. Ir para a home page e ver os produtos\n2. Configurar seu usuário como admin\n3. Acessar o painel admin em /admin`);
        } catch (error) {
            console.error('Error seeding products:', error);
            setStatus(`❌ Erro: ${error.message}`);

            if (error.message.includes('permissions')) {
                alert(`Erro de permissão!\n\nSOLUÇÃO TEMPORÁRIA:\n\n1. Vá ao Firebase Console\n2. Firestore Database → Regras\n3. Cole isto (TEMPORÁRIO para migração):\n\nrules_version = '2';\nservice cloud.firestore {\n  match /databases/{database}/documents {\n    match /users/{userId} {\n      allow read, write: if request.auth != null && request.auth.uid == userId;\n    }\n    match /products/{productId} {\n      allow read: if true;\n      allow write: if request.auth != null;\n    }\n  }\n}\n\n4. Publique e tente novamente\n5. DEPOIS da migração, mude para:\n\nmatch /products/{productId} {\n  allow read: if true;\n  allow write: if request.auth != null && get(/databases/$(database)/documents/users/$(request.auth.uid)).data.isAdmin == true;\n}`);
            }
        } finally {
            setLoading(false);
        }
    };

    if (!currentUser) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center p-4">
                <div className="max-w-md w-full bg-gray-900 rounded-lg border border-gray-800 p-8 text-center">
                    <AlertCircle className="w-16 h-16 text-harley-orange mx-auto mb-4" />
                    <h1 className="text-2xl font-display font-bold text-white uppercase mb-4">
                        Login Necessário
                    </h1>
                    <p className="text-gray-400 mb-6">
                        Você precisa estar logado para migrar produtos para o Firestore.
                    </p>
                    <Link
                        to="/login"
                        className="inline-block bg-harley-orange text-white px-6 py-3 rounded font-bold uppercase tracking-wider hover:bg-orange-700 transition-colors"
                    >
                        Fazer Login
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-black flex items-center justify-center p-4">
            <div className="max-w-md w-full bg-gray-900 rounded-lg border border-gray-800 p-8">
                <div className="text-center mb-8">
                    <Upload className="w-16 h-16 text-harley-orange mx-auto mb-4" />
                    <h1 className="text-3xl font-display font-bold text-white uppercase mb-2">
                        Migração de Produtos
                    </h1>
                    <p className="text-gray-400">
                        Migre os produtos de <code className="bg-black px-2 py-1 rounded text-harley-orange">products.js</code> para o Firestore
                    </p>
                </div>

                <div className="bg-black border border-gray-800 rounded p-4 mb-6">
                    <p className="text-gray-400 text-sm mb-2">
                        <strong className="text-white">Usuário:</strong> {currentUser.email}
                    </p>
                    <p className="text-gray-400 text-sm mb-2">
                        <strong className="text-white">Total de produtos:</strong> {products.length}
                    </p>
                    {migrated > 0 && (
                        <p className="text-gray-400 text-sm">
                            <strong className="text-white">Migrados:</strong> {migrated}/{products.length}
                        </p>
                    )}
                </div>

                {status && (
                    <div className={`p-4 rounded mb-6 text-sm ${status.includes('✅') ? 'bg-green-500/10 border border-green-500 text-green-500' :
                            status.includes('❌') ? 'bg-red-500/10 border border-red-500 text-red-500' :
                                'bg-blue-500/10 border border-blue-500 text-blue-500'
                        }`}>
                        {status}
                    </div>
                )}

                <button
                    onClick={handleSeed}
                    disabled={loading}
                    className="w-full bg-harley-orange text-white py-3 rounded font-bold uppercase tracking-wider hover:bg-orange-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mb-4"
                >
                    <Upload className="w-5 h-5" />
                    {loading ? 'Migrando...' : 'Iniciar Migração'}
                </button>

                <div className="text-center">
                    <Link to="/" className="text-gray-400 hover:text-white text-sm">
                        ← Voltar para o site
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default SeedDatabase;
