
import React from 'react';
import Layout from '../components/Layout';

const TermsPage = () => {
    return (
        <Layout>
            <div className="container mx-auto px-4 py-12 text-white">
                <h1 className="text-4xl font-display font-bold uppercase mb-8 text-sick-red">Termos e Condições</h1>
                <div className="prose prose-invert max-w-none text-gray-300 space-y-4">
                    <section>
                        <h2 className="text-2xl font-bold text-white mb-2">1. Introdução</h2>
                        <p>Ao acessar e usar o site da SICK GRIP, você aceita e concorda em estar vinculado aos termos e provisões deste acordo.</p>
                    </section>
                    <section>
                        <h2 className="text-2xl font-bold text-white mb-2">2. Compras e Pagamentos</h2>
                        <p>Aceitamos pagamentos via Cartão de Crédito, PIX e Boleto. Todas as transações são seguras e processadas por gateways de pagamento confiáveis.</p>
                    </section>
                    <section>
                        <h2 className="text-2xl font-bold text-white mb-2">3. Envio e Entrega</h2>
                        <p>Os prazos de entrega variam de acordo com a sua localização e o método de envio escolhido. Utilizamos integração com Melhor Envio para oferecer as melhores opções.</p>
                    </section>
                    <section>
                        <h2 className="text-2xl font-bold text-white mb-2">4. Devoluções</h2>
                        <p>Você tem até 7 dias após o recebimento do produto para solicitar a devolução em caso de arrependimento, conforme o Código de Defesa do Consumidor.</p>
                    </section>
                </div>
            </div>
        </Layout>
    );
};

export default TermsPage;
