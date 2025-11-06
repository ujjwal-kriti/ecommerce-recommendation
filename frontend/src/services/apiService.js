import axios from 'axios';
import toast from 'react-hot-toast';
import requestManager from '../utils/requestManager';

class ApiService {
  constructor() {
    this.baseURL = '/api';
    this.token = localStorage.getItem('qwipo_token');

    // Create axios instance
    this.api = axios.create({
      baseURL: this.baseURL,
      timeout: 30000,
    });

    // Request interceptor to add auth token
    this.api.interceptors.request.use(
      (config) => {
        if (this.token) {
          config.headers.Authorization = `Bearer ${this.token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor for error handling
    this.api.interceptors.response.use(
      (response) => response.data,
      (error) => {
        const message = error.response?.data?.message || error.message || 'An error occurred';

        if (error.response?.status === 401) {
          this.logout();
          toast.error('Session expired. Please login again.');
        } else {
          toast.error(message);
        }

        return Promise.reject(error);
      }
    );
  }

  setToken(token) {
    this.token = token;
    localStorage.setItem('qwipo_token', token);
  }

  removeToken() {
    this.token = null;
    localStorage.removeItem('qwipo_token');
  }

  clearCache(pattern) {
    if (typeof requestManager !== 'undefined' && requestManager.clearCache) {
      requestManager.clearCache(pattern);
    }
  }

  // Enhanced request method with request manager
  async requestWithCache(method, url, data = null, useCache = true) {
    const key = requestManager.generateKey(url, method, data);
    
    if (useCache) {
      return requestManager.getOrCreate(key, () => this.api[method.toLowerCase()](url, data));
    } else {
      return this.api[method.toLowerCase()](url, data);
    }
  }

  // Authentication APIs
  async register(userData) {
    const response = await this.api.post('/auth/register', userData);
    if (response.success) {
      this.setToken(response.data.token);
    }
    return response;
  }

  async login(email, password) {
    const response = await this.api.post('/auth/login', { email, password });
    if (response.success) {
      this.setToken(response.data.token);
    }
    return response;
  }

  async getCurrentUser() {
    return await this.api.get('/auth/me');
  }

  async updatePreferences(preferences) {
    return await this.api.put('/auth/preferences', { preferences });
  }

  logout() {
    this.removeToken();
    window.location.href = '/login';
  }

  // Product APIs
  async getProducts(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    // Disable cache for dynamic filtering to ensure fresh data
    return await this.requestWithCache('GET', `/products?${queryString}`, null, false);
  }

  async getProduct(id) {
    return await this.api.get(`/products/${id}`);
  }

  async searchProducts(searchData) {
    return await this.api.post('/products/search', searchData);
  }

  async getCategories() {
    return await this.requestWithCache('GET', '/products/meta/categories', null, true);
  }

  async getTrendingProducts(limit = 10) {
    return await this.api.get(`/products/meta/trending?limit=${limit}`);
  }

  async getFeaturedProducts(limit = 10) {
    return await this.api.get(`/products/meta/featured?limit=${limit}`);
  }

  // Recommendation APIs
  async getRecommendations(type = 'hybrid', limit = 10) {
    return await this.api.get(`/recommendations?type=${type}&limit=${limit}`);
  }

  async getCategoryRecommendations(category, limit = 10) {
    return await this.api.get(`/recommendations/category/${category}?limit=${limit}`);
  }

  async getSimilarProducts(productId, limit = 5) {
    return await this.api.get(`/recommendations/similar/${productId}?limit=${limit}`);
  }

  async getCartRecommendations(productIds = [], limit = 8) {
    return await this.api.post('/recommendations/cart', { productIds, limit });
  }

  async trackRecommendation(data) {
    return await this.api.post('/recommendations/track', data);
  }

  async getRecommendationAnalytics() {
    return await this.api.get('/recommendations/analytics');
  }

  async refreshRecommendations() {
    return await this.api.post('/recommendations/refresh');
  }

  // AI Assistant APIs
  async chatWithAI(message, context = {}) {
    return await this.api.post('/ai-assistant/chat', { message, context });
  }

  async uploadDocument(file, purpose = 'order') {
    const formData = new FormData();
    formData.append('document', file);
    formData.append('purpose', purpose);

    return await this.api.post('/ai-assistant/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  }

  async getChatHistory() {
    return await this.api.get('/ai-assistant/history');
  }

  async clearChatHistory() {
    return await this.api.delete('/ai-assistant/history');
  }

  async getAISuggestions() {
    return await this.api.get('/ai-assistant/suggestions');
  }

  // Order APIs
  async createOrder(orderData) {
    try {
      return await this.api.post('/orders', orderData);
    } catch (error) {
      // If backend fails, create a demo order locally for demonstration
      console.log('Backend order creation failed, creating demo order:', error.message);
      
      // Calculate totals for demo order using actual product details
      let subtotal = 0;
      const enrichedItems = orderData.items.map(item => {
        const productDetails = item.productDetails;
        const price = productDetails?.price?.discountedPrice || productDetails?.price?.mrp || 100;
        const itemTotal = price * item.quantity;
        subtotal += itemTotal;
        
        return {
          productId: {
            _id: productDetails._id,
            name: productDetails.name || 'Product',
            brand: productDetails.brand || 'Brand',
            images: productDetails.images || ['https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=400&h=400&fit=crop'],
            price: {
              discountedPrice: price,
              mrp: productDetails?.price?.mrp || price + 20
            },
            category: productDetails.category || 'General',
            businessType: productDetails.businessType || 'grocery'
          },
          quantity: item.quantity,
          price: price,
          total: itemTotal
        };
      });

      const tax = subtotal * 0.18;
      const shipping = subtotal > 1000 ? 0 : 50;
      const grandTotal = subtotal + tax + shipping;
      
      // Simulate order creation for demo purposes
      const demoOrder = {
        _id: 'DEMO_' + Date.now(),
        orderNumber: 'ORD' + Date.now(),
        items: enrichedItems,
        totalAmount: {
          subtotal,
          tax,
          shipping,
          grandTotal
        },
        shippingAddress: orderData.shippingAddress,
        paymentMethod: orderData.paymentMethod,
        paymentStatus: orderData.paymentStatus,
        transactionId: orderData.transactionId,
        notes: orderData.notes,
        status: 'pending',
        createdAt: new Date().toISOString()
      };

      // Store in localStorage for demo
      const existingOrders = JSON.parse(localStorage.getItem('demo_orders') || '[]');
      existingOrders.push(demoOrder);
      localStorage.setItem('demo_orders', JSON.stringify(existingOrders));

      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 500));

      return {
        success: true,
        data: demoOrder,
        message: 'Order created successfully (Demo Mode)'
      };
    }
  }

  async getOrders(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    
    try {
      // Try to get orders from backend
      const response = await this.api.get(`/orders?${queryString}`);
      
      // Also get demo orders from localStorage
      const demoOrders = JSON.parse(localStorage.getItem('demo_orders') || '[]');
      
      // Extract backend orders correctly (could be response.data or response.data.data)
      const backendOrders = response.data?.data || response.data || [];
      const ordersArray = Array.isArray(backendOrders) ? backendOrders : [];
      
      // Combine backend orders with demo orders
      const allOrders = [...ordersArray, ...demoOrders];
      
      return {
        success: true,
        data: allOrders.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)) // Sort by newest first
      };
    } catch (error) {
      console.log('Backend orders fetch failed, returning demo orders only:', error.message);
      
      // If backend fails, return only demo orders
      const demoOrders = JSON.parse(localStorage.getItem('demo_orders') || '[]');
      
      return {
        success: true,
        data: demoOrders.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      };
    }
  }

  async getOrder(id) {
    return await this.api.get(`/orders/${id}`);
  }

  // Cart APIs (Local storage based - can be extended for server-side cart)
  async addToCart(product, quantity = 1) {
    // For demo purposes, we'll use local storage
    // In a real app, this would be a server API call
    const cartData = {
      productId: product._id,
      product: product,
      quantity: quantity,
      addedAt: new Date().toISOString()
    };
    
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 200));
    
    return {
      success: true,
      data: cartData,
      message: 'Item added to cart successfully'
    };
  }

  async removeFromCart(productId) {
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 200));
    
    return {
      success: true,
      data: { productId },
      message: 'Item removed from cart successfully'
    };
  }

  async updateCartQuantity(productId, quantity) {
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 200));
    
    return {
      success: true,
      data: { productId, quantity },
      message: 'Cart updated successfully'
    };
  }

  async getCart() {
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 200));
    
    // In a real app, this would fetch cart from server
    const cart = localStorage.getItem('qwipo_cart');
    return {
      success: true,
      data: cart ? JSON.parse(cart) : { items: [], total: 0, count: 0 }
    };
  }

  async clearCart() {
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 200));
    
    return {
      success: true,
      data: {},
      message: 'Cart cleared successfully'
    };
  }

  // Quick purchase APIs
  async createQuickOrder(items, shippingInfo) {
    const orderData = {
      items,
      shippingInfo,
      orderType: 'quick_purchase',
      createdAt: new Date().toISOString()
    };

    return await this.api.post('/orders/quick', orderData);
  }

  // User APIs
  async updateProfile(profileData) {
    return await this.api.put('/users/profile', profileData);
  }

  async getDashboardData() {
    return await this.api.get('/users/dashboard');
  }

  // Analytics APIs
  async getAnalytics(timeRange = '30') {
    return await this.api.get(`/analytics/dashboard?timeRange=${timeRange}`);
  }

  async getProductAnalytics(limit = 10) {
    return await this.api.get(`/analytics/products?limit=${limit}`);
  }

  async getMLStatus() {
    return await this.api.get('/analytics/ml-status');
  }

  // Notification APIs
  async getNotifications() {
    return await this.api.get('/notifications');
  }

  async markNotificationRead(id) {
    return await this.api.put(`/notifications/${id}/read`);
  }

  async getNotificationPreferences() {
    return await this.api.get('/notifications/preferences');
  }

  async updateNotificationPreferences(preferences) {
    return await this.api.put('/notifications/preferences', preferences);
  }

  // Business Insights APIs
  async getBusinessInsights(type = 'diversification') {
    return await this.api.get(`/business-insights/${type}`);
  }

  // Generic HTTP methods
  async get(url, config = {}) {
    return await this.api.get(url, config);
  }

  async post(url, data, config = {}) {
    return await this.api.post(url, data, config);
  }

  async put(url, data, config = {}) {
    return await this.api.put(url, data, config);
  }

  async delete(url, config = {}) {
    return await this.api.delete(url, config);
  }
}

const apiService = new ApiService();

// Make it globally accessible for cache clearing
if (typeof window !== 'undefined') {
  window.apiService = apiService;
}

export default apiService;
