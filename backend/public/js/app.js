// Qwipo AI Recommendation System - Frontend JavaScript

class QwipoAPI {
    constructor(baseURL = '/api') {
        this.baseURL = baseURL;
        this.token = localStorage.getItem('qwipo_token');
    }

    async request(endpoint, options = {}) {
        const url = `${this.baseURL}${endpoint}`;
        const config = {
            headers: {
                'Content-Type': 'application/json',
                ...(this.token && { 'Authorization': `Bearer ${this.token}` })
            },
            ...options
        };

        try {
            const response = await fetch(url, config);
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'API request failed');
            }

            return data;
        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
    }

    // Authentication
    async login(email, password) {
        const data = await this.request('/auth/login', {
            method: 'POST',
            body: JSON.stringify({ email, password })
        });

        if (data.success) {
            this.token = data.data.token;
            localStorage.setItem('qwipo_token', this.token);
        }

        return data;
    }

    // Products
    async getProducts(params = {}) {
        const queryString = new URLSearchParams(params).toString();
        return await this.request(`/products?${queryString}`);
    }

    // Recommendations
    async getRecommendations(type = 'hybrid', limit = 10) {
        return await this.request(`/recommendations?type=${type}&limit=${limit}`);
    }

    // AI Assistant
    async chatWithAI(message, context = {}) {
        return await this.request('/ai-assistant/chat', {
            method: 'POST',
            body: JSON.stringify({ message, context })
        });
    }

    logout() {
        this.token = null;
        localStorage.removeItem('qwipo_token');
    }
}

// Initialize API
const qwipoAPI = new QwipoAPI();

// Utility functions
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `alert alert-${type}`;
    notification.textContent = message;

    document.body.insertBefore(notification, document.body.firstChild);

    setTimeout(() => {
        notification.remove();
    }, 5000);
}

function formatCurrency(amount) {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR'
    }).format(amount);
}
