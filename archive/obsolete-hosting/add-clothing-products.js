import http from 'http';

const clothingProducts = [
    {
        name: 'Jaqueta de Couro Harley-Davidson',
        price: 'R$ 1.899,00',
        image: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?q=80&w=2070&auto=format&fit=crop',
        category: 'Vestuário',
        condition: 'Novo',
        rating: 5,
        description: 'Jaqueta de couro legítimo com proteções removíveis e forro térmico. Design clássico Harley-Davidson com patches bordados.',
        specs: [
            'Material: Couro bovino premium',
            'Proteções: Ombros, cotovelos e costas',
            'Forro térmico removível',
            'Bolsos internos e externos'
        ]
    },
    {
        name: 'Capacete Harley-Davidson Vintage',
        price: 'R$ 899,00',
        image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?q=80&w=2070&auto=format&fit=crop',
        category: 'Vestuário',
        condition: 'Novo',
        rating: 5,
        description: 'Capacete estilo vintage com certificação DOT. Design retrô com acabamento premium e conforto excepcional.',
        specs: [
            'Certificação: DOT e INMETRO',
            'Peso: 1.2kg',
            'Forro interno removível',
            'Viseira anti-risco'
        ]
    },
    {
        name: 'Luvas de Couro Premium',
        price: 'R$ 349,00',
        image: 'https://images.unsplash.com/photo-1605348532760-6753d2c43329?q=80&w=2070&auto=format&fit=crop',
        category: 'Vestuário',
        condition: 'Novo',
        rating: 4,
        description: 'Luvas de couro com proteção de nós e reforço nas palmas. Perfeitas para longas viagens com máximo conforto.',
        specs: [
            'Material: Couro de cabra',
            'Proteção de nós certificada',
            'Forro respirável',
            'Ajuste por velcro'
        ]
    },
    {
        name: 'Botas Harley-Davidson Engineer',
        price: 'R$ 1.299,00',
        image: 'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?q=80&w=2080&auto=format&fit=crop',
        category: 'Vestuário',
        condition: 'Novo',
        rating: 5,
        description: 'Botas estilo engineer em couro legítimo. Clássicas e duráveis, perfeitas para qualquer ocasião.',
        specs: [
            'Couro bovino de alta qualidade',
            'Solado antiderrapante',
            'Fivelas de aço inox',
            'Proteção de tornozelo'
        ]
    },
    {
        name: 'Camiseta Harley-Davidson Classic',
        price: 'R$ 189,00',
        image: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?q=80&w=2080&auto=format&fit=crop',
        category: 'Vestuário',
        condition: 'Novo',
        rating: 4,
        description: 'Camiseta 100% algodão com estampa clássica Harley-Davidson. Confortável e durável.',
        specs: [
            '100% algodão premium',
            'Estampa de alta qualidade',
            'Gola reforçada',
            'Corte regular'
        ]
    },
    {
        name: 'Óculos de Sol Aviador',
        price: 'R$ 449,00',
        image: 'https://images.unsplash.com/photo-1511499767150-a48a237f0083?q=80&w=2080&auto=format&fit=crop',
        category: 'Vestuário',
        condition: 'Novo',
        rating: 5,
        description: 'Óculos estilo aviador com proteção UV400 e lentes polarizadas. Estilo e proteção para suas viagens.',
        specs: [
            'Proteção UV400',
            'Lentes polarizadas',
            'Armação em metal',
            'Estojo incluso'
        ]
    }
];

async function addClothingProducts() {
    console.log('🔄 Adicionando produtos de vestuário...\n');

    let successCount = 0;
    let errorCount = 0;

    for (const product of clothingProducts) {
        try {
            const data = JSON.stringify(product);

            const options = {
                hostname: 'localhost',
                port: 3001,
                path: '/api/products',
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Content-Length': data.length
                }
            };

            await new Promise((resolve, reject) => {
                const req = http.request(options, (res) => {
                    let responseData = '';

                    res.on('data', (chunk) => {
                        responseData += chunk;
                    });

                    res.on('end', () => {
                        if (res.statusCode === 201) {
                            console.log(`✅ ${product.name} - Adicionado com sucesso!`);
                            successCount++;
                            resolve();
                        } else {
                            console.error(`❌ ${product.name} - Status ${res.statusCode}: ${responseData}`);
                            errorCount++;
                            resolve();
                        }
                    });
                });

                req.on('error', (error) => {
                    console.error(`❌ ${product.name} - Erro de conexão:`, error.message);
                    errorCount++;
                    resolve();
                });

                req.write(data);
                req.end();
            });
        } catch (error) {
            console.error(`❌ ${product.name} - Erro:`, error.message);
            errorCount++;
        }
    }

    console.log('\n📊 Resumo:');
    console.log(`✅ Produtos adicionados: ${successCount}`);
    console.log(`❌ Erros: ${errorCount}`);
    console.log(`📦 Total: ${clothingProducts.length}`);
}

addClothingProducts();
