import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import AdminLayout from './components/AdminLayout';
import HomePage from './pages/HomePage';
import ProductPage from './pages/ProductPage';
import CheckoutPage from './pages/CheckoutPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ContactPage from './pages/ContactPage';
import CategoryPage from './pages/CategoryPage';
import CustomPartsPage from './pages/CustomPartsPage';
import SeedDatabase from './pages/SeedDatabase';
import MigrateCategories from './pages/MigrateCategories';
import OrderConfirmation from './pages/OrderConfirmation';
import MyOrdersPage from './pages/MyOrdersPage';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminProducts from './pages/admin/AdminProducts';
import ProductForm from './pages/admin/ProductForm';
import AdminOrdersPage from './pages/admin/AdminOrdersPage';
import AdminOrderDetailsPage from './pages/admin/AdminOrderDetailsPage';
import { CartProvider } from './context/CartContext';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import AdminRoute from './components/AdminRoute';

function App() {
  return (
    <Router>
      <AuthProvider>
        <CartProvider>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<Layout><HomePage /></Layout>} />
            <Route path="/product/:id" element={<Layout><ProductPage /></Layout>} />
            <Route path="/login" element={<Layout><LoginPage /></Layout>} />
            <Route path="/register" element={<Layout><RegisterPage /></Layout>} />
            <Route path="/contato" element={<Layout><ContactPage /></Layout>} />
            <Route path="/category/:type" element={<Layout><CategoryPage /></Layout>} />
            <Route path="/custom-parts" element={<Layout><CustomPartsPage /></Layout>} />
            <Route path="/seed" element={<SeedDatabase />} />
            <Route path="/migrate-categories" element={<MigrateCategories />} />
            {/* The original /order-confirmation/:orderId route was public, now it's moved to protected */}

            {/* Protected Routes */}
            <Route
              path="/checkout"
              element={
                <Layout>
                  <ProtectedRoute>
                    <CheckoutPage />
                  </ProtectedRoute>
                </Layout>
              }
            />
            <Route
              path="/my-orders"
              element={
                <Layout>
                  <ProtectedRoute>
                    <MyOrdersPage />
                  </ProtectedRoute>
                </Layout>
              }
            />
            <Route
              path="/order-confirmation/:orderId"
              element={
                <Layout>
                  <ProtectedRoute>
                    <OrderConfirmation />
                  </ProtectedRoute>
                </Layout>
              }
            />

            {/* Admin Routes */}
            <Route
              path="/admin"
              element={
                <AdminRoute>
                  <AdminLayout />
                </AdminRoute>
              }
            >
              <Route index element={<AdminDashboard />} />
              <Route path="products" element={<AdminProducts />} />
              <Route path="products/new" element={<ProductForm />} />
              <Route path="products/edit/:id" element={<ProductForm />} />
              <Route path="orders" element={<AdminOrdersPage />} />
              <Route path="orders/:id" element={<AdminOrderDetailsPage />} />
            </Route>
          </Routes>
        </CartProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
