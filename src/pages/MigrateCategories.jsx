import React from 'react';
import { Link } from 'react-router-dom';

const MigrateCategories = () => {
  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <div className="max-w-2xl w-full bg-gray-900 rounded-lg border border-gray-800 p-8 text-center">
        <h1 className="text-2xl font-display font-bold text-white mb-4">Migração de Categorias (arquivada)</h1>
        <p className="text-gray-400 mb-4">A ferramenta de migração de categorias foi arquivada. As migrações agora são executadas no backend contra o banco MySQL.</p>
        <p className="text-gray-400 mb-6">Se precisar rodar uma migração, execute os scripts de migração no servidor ou solicite que eu crie um runner seguro.</p>
        <Link to="/" className="inline-block bg-harley-orange text-white px-6 py-3 rounded font-bold">Voltar para a loja</Link>
      </div>
    </div>
  );
};

export default MigrateCategories;
