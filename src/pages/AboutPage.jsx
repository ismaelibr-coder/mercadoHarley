
import React from 'react';
import Layout from '../components/Layout';

const AboutPage = () => {
    return (
        <Layout>
            <div className="container mx-auto px-4 py-12 text-white">
                <h1 className="text-4xl font-display font-bold uppercase mb-8 text-sick-red">Quem Somos</h1>
                <div className="prose prose-invert max-w-none">
                    <p className="text-lg text-gray-300 mb-6">
                        A <strong>SICK GRIP Classic & Performance Tires</strong> nasceu da paixão por motocicletas custom e performance,
                        com foco especial na <strong className="text-sick-red">importação de pneus diagonais "vintage" da marca Shinko</strong> para Harley-Davidson.
                    </p>
                    <p className="text-gray-400 mb-6">
                        Os <strong className="text-sick-red">pneus Shinko</strong>, conhecidos por sua qualidade e estilo clássico,
                        se mostraram bastante atrativos para motociclistas brasileiros que buscam autenticidade e performance
                        em suas máquinas customizadas.
                    </p>
                    <p className="text-gray-400">
                        Hoje, além dos renomados pneus Shinko, oferecemos uma linha completa de peças e acessórios premium
                        para transformar sua moto em uma máquina única. Seja para uma Cafe Racer, Bobber, Chopper ou uma
                        moderna Performance Bagger, temos o que você precisa.
                    </p>
                </div>
            </div>
        </Layout>
    );
};

export default AboutPage;
