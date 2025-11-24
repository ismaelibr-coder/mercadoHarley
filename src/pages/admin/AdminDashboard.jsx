import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { DollarSign, ShoppingCart, TrendingUp, Package, AlertTriangle } from 'lucide-react';
import { getAllProducts } from '../../services/productService';
import { getMetrics, getSalesChart, getBestSellers } from '../../services/analyticsService';
import MetricCard from '../../components/MetricCard';
import SalesChart from '../../components/SalesChart';
import BestSellersTable from '../../components/BestSellersTable';
import ExportButtons from '../../components/ExportButtons';

const AdminDashboard = () => {
    const [products, setProducts] = useState([]);
    const [metrics, setMetrics] = useState(null);
    const [chartData, setChartData] = useState([]);
    const [bestSellers, setBestSellers] = useState([]);
    const [chartPeriod, setChartPeriod] = useState('day');
    const [loading, setLoading] = useState({
        products: true,
        metrics: true,
        chart: true,
        bestSellers: true
    });

    useEffect(() => {
        loadAllData();
    }, []);

    useEffect(() => {
        loadChartData();
    }, [chartPeriod]);

    const loadAllData = async () => {
        await Promise.all([
            loadProducts(),
            loadMetrics(),
            loadChartData(),
            loadBestSellers()
        ]);
    };

    const loadProducts = async () => {
        try {
            const data = await getAllProducts();
            setProducts(data);
        } catch (error) {
            console.error('Error loading products:', error);
        } finally {
            setLoading(prev => ({ ...prev, products: false }));
        }
    };

    const loadMetrics = async () => {
        try {
            const data = await getMetrics();
            setMetrics(data);
        } catch (error) {
            console.error('Error loading metrics:', error);
        } finally {
            setLoading(prev => ({ ...prev, metrics: false }));
        }
    };

    const loadChartData = async () => {
        setLoading(prev => ({ ...prev, chart: true }));
        try {
            const data = await getSalesChart(chartPeriod, 30);
            setChartData(data.data || []);
        } catch (error) {
            console.error('Error loading chart:', error);
        } finally {
            setLoading(prev => ({ ...prev, chart: false }));
        }
    };

    const loadBestSellers = async () => {
        try {
            const data = await getBestSellers(10);
            setBestSellers(data.products || []);
        } catch (error) {
            console.error('Error loading best sellers:', error);
        } finally {
            setLoading(prev => ({ ...prev, bestSellers: false }));
        }
    };

    const lowStockProducts = products.filter(p => p.stock <= 5);

    return (
        <div id="dashboard-content">
            <div className="mb-8">
                <h1 className="text-4xl font-display font-bold text-white uppercase mb-2">
                    Dashboard
                </h1>
                <p className="text-gray-400">Bem-vindo ao painel administrativo</p>
            </div>

            {/* Metrics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <MetricCard
                    icon={DollarSign}
                    label="Vendas do Mês"
                    value={metrics?.monthSales || 0}
                    trend={metrics?.trends?.salesChange}
                    format="currency"
                />
                <MetricCard
                    icon={ShoppingCart}
                    label="Pedidos do Mês"
                    value={metrics?.monthOrders || 0}
                    trend={metrics?.trends?.ordersChange}
                />
                <MetricCard
                    icon={TrendingUp}
                    label="Ticket Médio"
                    value={metrics?.averageTicket || 0}
                    format="currency"
                />
                <MetricCard
                    icon={Package}
                    label="Pedidos Pendentes"
                    value={metrics?.pendingOrders || 0}
                />
            </div>

            {/* Sales Chart */}
            <div className="bg-gray-900 border border-gray-800 rounded-lg p-6 mb-8">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-display font-bold text-white uppercase">
                        Vendas
                    </h2>
                    <div className="flex gap-2">
                        <button
                            onClick={() => setChartPeriod('day')}
                            className={`px-4 py-2 rounded font-bold text-sm transition-colors ${chartPeriod === 'day'
                                    ? 'bg-harley-orange text-white'
                                    : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                                }`}
                        >
                            Dia
                        </button>
                        <button
                            onClick={() => setChartPeriod('week')}
                            className={`px-4 py-2 rounded font-bold text-sm transition-colors ${chartPeriod === 'week'
                                    ? 'bg-harley-orange text-white'
                                    : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                                }`}
                        >
                            Semana
                        </button>
                        <button
                            onClick={() => setChartPeriod('month')}
                            className={`px-4 py-2 rounded font-bold text-sm transition-colors ${chartPeriod === 'month'
                                    ? 'bg-harley-orange text-white'
                                    : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                                }`}
                        >
                            Mês
                        </button>
                    </div>
                </div>
                <SalesChart data={chartData} period={chartPeriod} loading={loading.chart} />
            </div>

            {/* Best Sellers */}
            <div className="bg-gray-900 border border-gray-800 rounded-lg p-6 mb-8">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-display font-bold text-white uppercase">
                        Produtos Mais Vendidos
                    </h2>
                    <ExportButtons data={bestSellers} filename="produtos-mais-vendidos" type="best-sellers" />
                </div>
                <BestSellersTable products={bestSellers} loading={loading.bestSellers} />
            </div>

            {/* Low Stock Alert */}
            {lowStockProducts.length > 0 && (
                <div className="bg-yellow-900/20 border border-yellow-700 rounded-lg p-6">
                    <div className="flex items-start gap-3 mb-4">
                        <AlertTriangle className="w-6 h-6 text-yellow-500 flex-shrink-0 mt-1" />
                        <div>
                            <h2 className="text-xl font-display font-bold text-yellow-500 uppercase mb-2">
                                Alerta de Estoque Baixo
                            </h2>
                            <p className="text-gray-300 mb-4">
                                {lowStockProducts.length} produto(s) com estoque baixo (≤ 5 unidades)
                            </p>
                        </div>
                    </div>
                    <div className="space-y-3">
                        {lowStockProducts.map(product => (
                            <div key={product.id} className="flex items-center justify-between bg-gray-900/50 p-4 rounded">
                                <div className="flex items-center gap-3">
                                    {product.image && (
                                        <img src={product.image} alt={product.name} className="w-12 h-12 object-cover rounded" />
                                    )}
                                    <div>
                                        <p className="text-white font-bold">{product.name}</p>
                                        <p className={`text-sm font-bold ${product.stock === 0 ? 'text-red-500' :
                                                product.stock <= 2 ? 'text-orange-500' :
                                                    'text-yellow-500'
                                            }`}>
                                            {product.stock === 0 ? 'Esgotado' : `${product.stock} unidades`}
                                        </p>
                                    </div>
                                </div>
                                <Link
                                    to={`/admin/products/edit/${product.id}`}
                                    className="px-4 py-2 bg-harley-orange text-white rounded hover:bg-orange-700 transition-colors font-bold text-sm"
                                >
                                    Editar
                                </Link>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminDashboard;
