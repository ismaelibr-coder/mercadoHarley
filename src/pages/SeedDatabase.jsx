import React from 'react';
import { Link } from 'react-router-dom';

const SeedDatabase = () => {
  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <div className="max-w-2xl w-full bg-gray-900 rounded-lg border border-gray-800 p-8 text-center">
        <h1 className="text-2xl font-display font-bold text-white mb-4">Migração de Produtos (arquivada)</h1>
        <p className="text-gray-400 mb-4">A página de seed/migração de produtos foi arquivada. Use os scripts de migração no backend para inserir dados no MySQL.</p>
        <p className="text-gray-400 mb-6">A versão original foi arquivada para referência.</p>
        <Link to="/" className="inline-block bg-harley-orange text-white px-6 py-3 rounded font-bold">Voltar para a loja</Link>
      </div>
    </div>
  );
};

export default SeedDatabase;
