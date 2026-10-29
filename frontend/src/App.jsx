import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import { CartProvider } from './context/CartContext';
import ProtectedRoute from './components/common/ProtectedRoute';
import Layout from './components/common/Layout';
import LoadingSpinner from './components/common/LoadingSpinner';
import Reports from "./pages/Reports";
import AdminDashboard from './pages/AdminDashboard';
import AdminRoute from './components/common/AdminRoute';
import AdminUsers from './pages/AdminUsers';

// Pages
import LandingPage from './pages/LandingPage';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import Register from './pages/Register';
import Products from './pages/Products';
import ProductDetail from './pages/ProductDetail';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import Recommendations from './pages/Recommendations';
import AIAssistant from './pages/AIAssistant';
import Orders from './pages/Orders';
import Analytics from './pages/Analytics';
import Profile from './pages/Profile';
import NotFound from './pages/NotFound';

function App() {
  return (
    <AuthProvider>
      <SocketProvider>
        <CartProvider>
          <Router future={{ 
            v7_startTransition: true,
            v7_relativeSplatPath: true 
          }}>
          <div className="App min-h-screen bg-gray-50">
            <Toaster
                position="top-right"
                toastOptions={{
                  duration: 4000,
                  style: {
                    background: '#363636',
                    color: '#fff',
                  },
                  success: {
                    style: {
                      background: '#10B981',
                    },
                  },
                error: {
                  style: {
                    background: '#EF4444',
                  },
                },
              }}
            />

            <Routes>
              {/* Landing page */}
              <Route path="/" element={<LandingPage />} />

              {/* Public routes */}
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/cart" element={<Cart />} />
              <Route path="/checkout" element={<Checkout />} />

              {/* Protected routes */}
              <Route path="/dashboard" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
                <Route index element={<Dashboard />} />
                <Route path="products" element={<Products />} />
                <Route path="products/:id" element={<ProductDetail />} />
                <Route path="recommendations" element={<Recommendations />} />
                <Route path="ai-assistant" element={<AIAssistant />} />
                <Route path="orders" element={<Orders />} />
                <Route path="analytics" element={<Analytics />} />
                <Route path="admin" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
                <Route path="admin/users" element={<AdminRoute><AdminUsers /></AdminRoute>} />
                {/* Business Insights page removed */}
                <Route path="profile" element={<Profile />} />
                <Route path="reports" element={<Reports />} />
                {/* Performance page removed */}
              </Route>
              
              {/* 404 route */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </div>
        </Router>
        </CartProvider>
        </SocketProvider>
      </AuthProvider>
  );
}

export default App;
