const OpenAI = require('openai');
const Product = require('../models/Product');
const User = require('../models/User');
const mlService = require('./mlService');
const logger = require('../utils/logger');

class AIAssistantService {
  constructor() {
    if (process.env.OPENAI_API_KEY) {
      this.openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
      });
    }
    this.conversationHistory = new Map();
  }

  // Process natural language query
  async processQuery(userId, query, context = {}) {
    try {
      const user = await User.findById(userId).lean();
      if (!user) {
        throw new Error('User not found');
      }

      // Get conversation history
      const history = this.conversationHistory.get(userId) || [];

      // Analyze intent
      const intent = await this.analyzeIntent(query);

      let response;
      switch (intent.type) {
        case 'product_search':
          response = await this.handleProductSearch(user, intent.entities, query);
          break;
        case 'recommendation':
          response = await this.handleRecommendationRequest(user, intent.entities);
          break;
        case 'order_inquiry':
          response = await this.handleOrderInquiry(user, intent.entities);
          break;
        case 'general_help':
          response = await this.handleGeneralHelp(user, query, history);
          break;
        default:
          response = await this.handleGeneralConversation(user, query, history);
      }

      // Update conversation history
      history.push(
        { role: 'user', content: query, timestamp: new Date() },
        { role: 'assistant', content: response.text, timestamp: new Date() }
      );

      // Keep only last 10 exchanges
      if (history.length > 20) {
        history.splice(0, history.length - 20);
      }

      this.conversationHistory.set(userId, history);

      return response;
    } catch (error) {
      logger.error('AI Assistant error:', error);
      return {
        text: "I'm sorry, I'm having trouble understanding your request right now. Could you please try rephrasing it?",
        type: 'error'
      };
    }
  }

  // Analyze user intent using OpenAI
  async analyzeIntent(query) {
    if (!this.openai) {
      return await this.simpleIntentAnalysis(query);
    }

    try {
      const response = await this.openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: `You are an intent classifier for a B2B product recommendation system. 
            Analyze the user query and respond with a JSON object containing:
            {
              "type": "product_search|recommendation|order_inquiry|general_help|conversation",
              "entities": {
                "category": "extracted category if mentioned",
                "brand": "extracted brand if mentioned",
                "product_name": "extracted product name if mentioned",
                "price_range": "extracted price range if mentioned",
                "quantity": "extracted quantity if mentioned"
              }
            }`
          },
          {
            role: "user",
            content: query
          }
        ],
        temperature: 0.1,
        max_tokens: 200
      });

      return JSON.parse(response.choices[0].message.content);
    } catch (error) {
      logger.error('Intent analysis error:', error);
      return await this.simpleIntentAnalysis(query);
    }
  }
  // Simple rule-based and DB-backed intent analysis as fallback
  async simpleIntentAnalysis(query) {
    const lowerQuery = query.toLowerCase();

    // Direct keyword matches
    if (lowerQuery.includes('recommend') || lowerQuery.includes('suggest') || lowerQuery.includes("what's trending") || lowerQuery.includes('trending')) {
      return { type: 'recommendation', entities: {} };
    }

    if (lowerQuery.includes('search') || lowerQuery.includes('find') || lowerQuery.includes('looking for') || lowerQuery.includes('show me')) {
      // Attempt to detect product name in the query below
      // fall through
    }

    if (lowerQuery.includes('order') || lowerQuery.includes('purchase') || lowerQuery.includes('buy')) {
      return { type: 'order_inquiry', entities: {} };
    }

    // Try to match product names from the database
    try {
      // First try a full-text-ish search for the whole query
      let product = await Product.findOne({ name: new RegExp(query, 'i'), isActive: true }).lean();

      // If not found, try splitting into words and search for any product name containing a significant word
      if (!product) {
        const words = query.split(/\W+/).filter(w => w.length > 3).slice(0, 6);
        for (const w of words) {
          product = await Product.findOne({ name: new RegExp('\\b' + w + '\\b', 'i'), isActive: true }).lean();
          if (product) break;
        }
      }

      if (product) {
        return { type: 'product_search', entities: { product_name: product.name } };
      }
    } catch (err) {
      logger.error('Product keyword search failed in simpleIntentAnalysis:', err);
    }

    // If we detected an explicit product request phrase, map to product_search
    if (lowerQuery.includes('product') || lowerQuery.includes('products') || lowerQuery.includes('maggie') || lowerQuery.includes('noodles')) {
      return { type: 'product_search', entities: {} };
    }

    // Default to conversation
    return { type: 'conversation', entities: {} };
  }

  // Handle product search queries
  async handleProductSearch(user, entities, originalQuery) {
    try {
      const searchQuery = {};

      // Build search query based on entities
      if (entities.category) {
        searchQuery.category = new RegExp(entities.category, 'i');
      }

      if (entities.brand) {
        searchQuery.brand = new RegExp(entities.brand, 'i');
      }

      if (entities.product_name) {
        searchQuery.$text = { $search: entities.product_name };
      }

      // If no specific entities, use text search on original query
      if (Object.keys(searchQuery).length === 0) {
        searchQuery.$text = { $search: originalQuery };
      }

      const products = await Product.find({
        ...searchQuery,
        isActive: true,
        'inventory.stock': { $gt: 0 }
      }).limit(10).lean();

      if (products.length === 0) {
        return {
          text: "I couldn't find any products matching your search. Let me suggest some popular items in your preferred categories instead.",
          type: 'no_results',
          products: await this.getAlternativeProducts(user)
        };
      }

      return {
        text: `I found ${products.length} products matching your search. Here are some options:`,
        type: 'product_results',
        products: products.map(p => ({
          id: p._id,
          name: p.name,
          brand: p.brand,
          price: p.price.discountedPrice,
          category: p.category,
          image: p.images[0] || null
        }))
      };
    } catch (error) {
      logger.error('Product search error:', error);
      return {
        text: "I'm having trouble searching for products right now. Please try again later.",
        type: 'error'
      };
    }
  }

  // Handle recommendation requests
  async handleRecommendationRequest(user, entities) {
    try {
      const recommendations = await mlService.getHybridRecommendations(user._id.toString(), 5);

      if (recommendations.length === 0) {
        const trending = await mlService.getTrendingRecommendations(5);
        const products = await Product.find({
          _id: { $in: trending.map(r => r.productId) }
        }).lean();

        return {
          text: "Based on current trends, here are some popular products you might like:",
          type: 'recommendations',
          products: products.map(p => ({
            id: p._id,
            name: p.name,
            brand: p.brand,
            price: p.price.discountedPrice,
            category: p.category,
            reason: 'Trending product'
          }))
        };
      }

      const products = await Product.find({
        _id: { $in: recommendations.map(r => r.productId) }
      }).lean();

      return {
        text: "Based on your purchase history and preferences, I recommend these products:",
        type: 'recommendations',
        products: products.map((p, index) => ({
          id: p._id,
          name: p.name,
          brand: p.brand,
          price: p.price.discountedPrice,
          category: p.category,
          reason: this.getRecommendationReason(user, p),
          confidence: recommendations[index]?.score || 0
        }))
      };
    } catch (error) {
      logger.error('Recommendation error:', error);
      return {
        text: "I'm having trouble generating recommendations right now. Please try again later.",
        type: 'error'
      };
    }
  }

  // Handle order-related inquiries
  async handleOrderInquiry(user, entities) {
    // This would integrate with order management system
    return {
      text: "I can help you with order-related questions. What would you like to know about your orders?",
      type: 'order_help',
      actions: [
        'View recent orders',
        'Track an order',
        'Reorder previous items',
        'Order status inquiry'
      ]
    };
  }

  // Handle general help
  async handleGeneralHelp(user, query, history) {
    const helpText = `Hi ${user.name}! I'm your AI shopping assistant. I can help you:

• Find products by category, brand, or name
• Get personalized product recommendations
• Answer questions about your orders
• Provide product information and comparisons
• Help you discover new products based on your business type

What would you like to help with today?`;

    return {
      text: helpText,
      type: 'help',
      quickActions: [
        'Show me recommendations',
        'Search for products',
        'Check my orders',
        'What\'s trending?'
      ]
    };
  }

  // Handle general conversation
  async handleGeneralConversation(user, query, history) {
    if (!this.openai) {
      return {
        text: "I'm here to help you find products and get recommendations. How can I assist you with your business needs today?",
        type: 'conversation'
      };
    }

    try {
      const systemPrompt = `You are a helpful AI assistant for Qwipo, a B2B marketplace. 
      The user is ${user.name} who runs a ${user.businessType} business called ${user.businessName}.
      Keep responses concise and business-focused. Always try to guide the conversation towards helping them find products or get recommendations.`;

      const messages = [
        { role: 'system', content: systemPrompt },
        ...history.slice(-6), // Last 3 exchanges
        { role: 'user', content: query }
      ];

      const response = await this.openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages,
        temperature: 0.7,
        max_tokens: 200
      });

      return {
        text: response.choices[0].message.content,
        type: 'conversation'
      };
    } catch (error) {
      logger.error('OpenAI conversation error:', error);
      return {
        text: "I'm here to help you with your business needs. Would you like me to recommend some products or help you search for something specific?",
        type: 'conversation'
      };
    }
  }

  // Get alternative products when search fails
  async getAlternativeProducts(user) {
    const categories = user.preferences?.categories || [];
    let query = { isActive: true, 'inventory.stock': { $gt: 0 } };

    if (categories.length > 0) {
      query.category = { $in: categories };
    }

    return await Product.find(query).limit(5).lean();
  }

  // Generate recommendation reason
  getRecommendationReason(user, product) {
    if (user.preferences?.categories?.includes(product.category)) {
      return `Popular in ${product.category} category`;
    }
    if (user.preferences?.brands?.includes(product.brand)) {
      return `From your preferred brand ${product.brand}`;
    }
    return 'Recommended for your business type';
  }

  // Clear conversation history
  clearHistory(userId) {
    this.conversationHistory.delete(userId);
  }

  // Get conversation history
  getHistory(userId) {
    return this.conversationHistory.get(userId) || [];
  }
}

module.exports = new AIAssistantService();
