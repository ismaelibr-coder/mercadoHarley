import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import AdminLayout from './components/AdminLayout';
import HomePage from './pages/HomePage';
import ProductPage from './pages/ProductPage';
import CheckoutPage from './pages/CheckoutPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import ChangePasswordPage from './pages/ChangePasswordPage';
import AdminBanners from './pages/admin/AdminBanners';
import BannerForm from './pages/admin/BannerForm';
import ContactPage from './pages/ContactPage';
import AboutPage from './pages/AboutPage';
import TermsPage from './pages/TermsPage';
import CategoryPage from './pages/CategoryPage';
import SearchResultsPage from './pages/SearchResultsPage';
import CustomPartsPage from './pages/CustomPartsPage';
import NewsPage from './pages/NewsPage';
import OrderConfirmation from './pages/OrderConfirmation';
import MyOrdersPage from './pages/MyOrdersPage';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminProducts from './pages/admin/AdminProducts';
import ProductForm from './pages/admin/ProductForm';
import AdminOrdersPage from './pages/admin/AdminOrdersPage';
import AdminOrderDetailsPage from './pages/admin/AdminOrderDetailsPage';
import ShippingRules from './pages/admin/ShippingRules';
import AdminSettings from './pages/admin/AdminSettings';
import AdminInternalStock from './pages/admin/AdminInternalStock';
import { CartProvider } from './context/CartContext';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './components/ui/ToastProvider';
import { ConfirmDialogProvider } from './components/ui/ConfirmDialogProvider';
import ProtectedRoute from './components/ProtectedRoute';
import AdminRoute from './components/AdminRoute';

function App() {
  return (
    <Router>
      <ToastProvider>
      <ConfirmDialogProvider>
      <AuthProvider>
        <CartProvider>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<Layout><HomePage /></Layout>} />
            <Route path="/product/:id" element={<Layout><ProductPage /></Layout>} />
            <Route path="/login" element={<Layout><LoginPage /></Layout>} />
            <Route path="/register" element={<Layout><RegisterPage /></Layout>} />
            <Route path="/forgot-password" element={<Layout><ForgotPasswordPage /></Layout>} />
            <Route path="/reset-password" element={<Layout><ResetPasswordPage /></Layout>} />
            <Route path="/contato" element={<ContactPage />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/terms" element={<TermsPage />} />
            <Route path="/category/:type" element={<Layout><CategoryPage /></Layout>} />
            <Route path="/search" element={<Layout><SearchResultsPage /></Layout>} />
            <Route path="/custom-parts" element={<Layout><CustomPartsPage /></Layout>} />
            <Route path="/news" element={<NewsPage />} />
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
              path="/change-password"
              element={
                <Layout>
                  <ProtectedRoute>
                    <ChangePasswordPage />
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
              <Route path="shipping" element={<ShippingRules />} />
              <Route path="banners" element={<AdminBanners />} />
              <Route path="banners/new" element={<BannerForm />} />
              <Route path="banners/edit/:id" element={<BannerForm />} />
              <Route path="settings" element={<AdminSettings />} />
              <Route path="internal-stock" element={<AdminInternalStock />} />
            </Route>
          </Routes>
        </CartProvider>
      </AuthProvider>
      </ConfirmDialogProvider>
      </ToastProvider>
    </Router>
  );
}

export default App;
