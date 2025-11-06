// Enhanced ML Service with advanced algorithms
// const tf = require('@tensorflow/tfjs-node'); // Temporarily disabled for testing
const { Matrix } = require('ml-matrix');
const natural = require('natural');
const cosineSimilarity = require('compute-cosine-similarity');
const KNN = require('ml-knn');
const KMeans = require('ml-kmeans');
const User = require('../models/User');
const Product = require('../models/Product');
const Order = require('../models/Order');
const logger = require('../utils/logger');

/**
 * Enhanced ML Recommendation Service
 * Implements:
 * 1. Advanced Collaborative Filtering with Cosine Similarity
 * 2. Content-Based Filtering with TF-IDF and KNN
 * 3. Hybrid Recommendation System
 * 4. Clustering-based Recommendations
 * 5. Diversity and Freshness Algorithms
 * 6. Real-time Learning Pipeline
 */

class MLRecommendationService {
  constructor() {
    this.userItemMatrix = null;
    this.productFeatures = new Map();
    this.userProfiles = new Map();
    this.modelLastUpdated = null;
    this.minInteractions = parseInt(process.env.MIN_INTERACTIONS_FOR_RECOMMENDATION) || 5;
  }

  // Ensure internal data is loaded before running recommendation methods
  async ensureInitialized() {
    try {
      if (!this.userItemMatrix || !this.userMap || !this.products) {
        await this.initialize();
      }

      // Return true when core data structures are available
      if (this.userItemMatrix && this.userMap && this.products) {
        return true;
      }
      // Initialization attempted but core structures still missing
      return false;
    } catch (err) {
      logger.error('ensureInitialized failed:', err);
      return false;
    }
  }

  // Initialize and load data
  async initialize() {
    try {
      logger.info('Initializing ML Recommendation Service...');
      await this.loadData();
      await this.buildUserItemMatrix();
      await this.extractProductFeatures();
      await this.buildUserProfiles();
      this.modelLastUpdated = new Date();
      logger.info('ML Recommendation Service initialized successfully');
    } catch (error) {
      logger.error('Error initializing ML service:', error);
    }
  }

  // Load all necessary data
  async loadData() {
    this.users = await User.find({ isActive: true }).lean();
    this.products = await Product.find({ isActive: true }).lean();
    this.orders = await Order.find({ orderStatus: 'delivered' }).populate('items.productId').lean();
  }

  // Build user-item interaction matrix
  async buildUserItemMatrix() {
    const userMap = new Map();
    const productMap = new Map();

    // Create mappings
    this.users.forEach((user, index) => {
      userMap.set(user._id.toString(), index);
    });

    this.products.forEach((product, index) => {
      productMap.set(product._id.toString(), index);
    });

    // Initialize matrix with zeros
    const matrix = new Matrix(this.users.length, this.products.length).fill(0);

    // Fill matrix with interaction data
    this.orders.forEach(order => {
      const userIndex = userMap.get(order.userId.toString());
      if (userIndex !== undefined) {
        order.items.forEach(item => {
          if (item.productId) {
            const productIndex = productMap.get(item.productId._id.toString());
            if (productIndex !== undefined) {
              // Use quantity * frequency as interaction strength
              matrix.set(userIndex, productIndex, 
                matrix.get(userIndex, productIndex) + item.quantity
              );
            }
          }
        });
      }
    });

    this.userItemMatrix = matrix;
    this.userMap = userMap;
    this.productMap = productMap;
    this.reverseProductMap = new Map([...productMap].map(([k, v]) => [v, k]));
  }

  // Extract product features using TF-IDF
  async extractProductFeatures() {
    const tfidf = new natural.TfIdf();

    this.products.forEach(product => {
      const text = `${product.name} ${product.description} ${product.brand} ${product.category} ${product.tags?.join(' ') || ''}`;
      tfidf.addDocument(text);
    });

    this.products.forEach((product, index) => {
      const features = [];
      tfidf.listTerms(index).forEach(item => {
        features.push(item.tfidf);
      });
      this.productFeatures.set(product._id.toString(), features);
    });
  }

  // Build user preference profiles
  async buildUserProfiles() {
    this.users.forEach(user => {
      const userIndex = this.userMap.get(user._id.toString());
      if (userIndex !== undefined) {
        const interactions = this.userItemMatrix.getRow(userIndex);
        const preferences = {
          categories: new Map(),
          brands: new Map(),
          avgPrice: 0,
          totalInteractions: 0
        };

        let totalPrice = 0;
        let interactionCount = 0;

        interactions.forEach((score, productIndex) => {
          if (score > 0) {
            const productId = this.reverseProductMap.get(productIndex);
            const product = this.products.find(p => p._id.toString() === productId);

            if (product) {
              // Category preferences
              preferences.categories.set(
                product.category,
                (preferences.categories.get(product.category) || 0) + score
              );

              // Brand preferences
              preferences.brands.set(
                product.brand,
                (preferences.brands.get(product.brand) || 0) + score
              );

              totalPrice += product.price.discountedPrice * score;
              interactionCount += score;
            }
          }
        });

        preferences.avgPrice = interactionCount > 0 ? totalPrice / interactionCount : 0;
        preferences.totalInteractions = interactionCount;

        this.userProfiles.set(user._id.toString(), preferences);
      }
    });
  }

  // Collaborative filtering recommendations
  async getCollaborativeRecommendations(userId, limit = 10) {
    const initialized = await this.ensureInitialized();
    if (!initialized) return await this.getTrendingRecommendations(limit);

    const userIndex = this.userMap.get(userId);
    if (userIndex === undefined) return [];

    const userVector = this.userItemMatrix.getRow(userIndex);
    const similarities = [];

    // Calculate user similarities using cosine similarity
    for (let i = 0; i < this.userItemMatrix.rows; i++) {
      if (i !== userIndex) {
        const otherUserVector = this.userItemMatrix.getRow(i);
        const similarity = this.cosineSimilarity(userVector, otherUserVector);
        if (similarity > 0.1) {
          similarities.push({ userIndex: i, similarity });
        }
      }
    }

    // Sort by similarity
    similarities.sort((a, b) => b.similarity - a.similarity);
    const topSimilarUsers = similarities.slice(0, 20);

    // Get recommendations based on similar users
    const recommendations = new Map();

    topSimilarUsers.forEach(({ userIndex: similarUserIndex, similarity }) => {
      const similarUserVector = this.userItemMatrix.getRow(similarUserIndex);

      similarUserVector.forEach((score, productIndex) => {
        if (score > 0 && userVector[productIndex] === 0) {
          const productId = this.reverseProductMap.get(productIndex);
          const weightedScore = score * similarity;

          recommendations.set(productId, 
            (recommendations.get(productId) || 0) + weightedScore
          );
        }
      });
    });

    // Convert to array and sort
    const sortedRecommendations = Array.from(recommendations.entries())
      .sort(([,a], [,b]) => b - a)
      .slice(0, limit)
      .map(([productId, score]) => ({ productId, score, type: 'collaborative' }));

    return sortedRecommendations;
  }

  // Content-based recommendations
  async getContentBasedRecommendations(userId, limit = 10) {
    const initialized = await this.ensureInitialized();
    if (!initialized) return await this.getTrendingRecommendations(limit);

    const userProfile = this.userProfiles.get(userId);
    if (!userProfile || userProfile.totalInteractions < this.minInteractions) {
      return [];
    }

    const recommendations = [];
    const userIndex = this.userMap.get(userId);
    const userVector = this.userItemMatrix.getRow(userIndex);

    this.products.forEach((product, index) => {
      const productIndex = this.productMap.get(product._id.toString());

      // Skip if user already interacted with this product
      if (productIndex !== undefined && userVector[productIndex] > 0) {
        return;
      }

      let score = 0;

      // Category preference score
      const categoryScore = userProfile.categories.get(product.category) || 0;
      score += categoryScore * 0.4;

      // Brand preference score
      const brandScore = userProfile.brands.get(product.brand) || 0;
      score += brandScore * 0.3;

      // Price similarity score
      const priceRatio = Math.abs(product.price.discountedPrice - userProfile.avgPrice) / userProfile.avgPrice;
      const priceScore = Math.max(0, 1 - priceRatio);
      score += priceScore * 0.2;

      // Popularity score
      const popularityScore = product.analytics?.purchases || 0;
      score += Math.log(1 + popularityScore) * 0.1;

      if (score > 0) {
        recommendations.push({
          productId: product._id.toString(),
          score,
          type: 'content-based'
        });
      }
    });

    return recommendations
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  }

  // Hybrid recommendations combining collaborative and content-based
  async getHybridRecommendations(userId, limit = 10) {
    try {
      const [collaborative, contentBased] = await Promise.all([
        this.getCollaborativeRecommendations(userId, Math.ceil(limit * 0.7)),
        this.getContentBasedRecommendations(userId, Math.ceil(limit * 0.7))
      ]);

      // Combine and normalize scores
      const combined = new Map();

      collaborative.forEach(({ productId, score }) => {
        combined.set(productId, (combined.get(productId) || 0) + score * 0.6);
      });

      contentBased.forEach(({ productId, score }) => {
        combined.set(productId, (combined.get(productId) || 0) + score * 0.4);
      });

      // Add diversity and novelty
      const finalRecommendations = Array.from(combined.entries())
        .sort(([,a], [,b]) => b - a)
        .slice(0, limit)
        .map(([productId, score]) => ({
          productId,
          score: parseFloat(score.toFixed(3)),
          type: 'hybrid'
        }));

      return finalRecommendations;
    } catch (error) {
      logger.error('Error in hybrid recommendations:', error);
      return [];
    }
  }

  // Trending products for new users
  async getTrendingRecommendations(limit = 10) {
    const trending = await Product.find({ isActive: true })
      .sort({ 'analytics.trendingScore': -1, 'analytics.purchases': -1 })
      .limit(limit)
      .select('_id')
      .lean();

    return trending.map(product => ({
      productId: product._id.toString(),
      score: 1.0,
      type: 'trending'
    }));
  }

  // Utility function for cosine similarity
  cosineSimilarity(vectorA, vectorB) {
    const dotProduct = vectorA.reduce((sum, a, i) => sum + a * vectorB[i], 0);
    const magnitudeA = Math.sqrt(vectorA.reduce((sum, a) => sum + a * a, 0));
    const magnitudeB = Math.sqrt(vectorB.reduce((sum, b) => sum + b * b, 0));

    if (magnitudeA === 0 || magnitudeB === 0) return 0;
    return dotProduct / (magnitudeA * magnitudeB);
  }

  // ================================
  // ENHANCED ML ALGORITHMS
  // ================================

  /**
   * Enhanced collaborative filtering with cosine similarity
   */
  async getEnhancedCollaborativeRecommendations(userId, limit = 10) {
    try {
      const initialized = await this.ensureInitialized();
      if (!initialized) return await this.getTrendingRecommendations(limit);

      const userIndex = this.userMap.get(userId);
      if (userIndex === undefined) {
        return await this.getTrendingRecommendations(limit);
      }

      const userVector = Array.from(this.userItemMatrix.getRow(userIndex));
      const similarities = [];

      // Calculate user similarities using proper cosine similarity
      for (let i = 0; i < this.userItemMatrix.rows; i++) {
        if (i !== userIndex) {
          const otherUserVector = Array.from(this.userItemMatrix.getRow(i));
          const similarity = cosineSimilarity(userVector, otherUserVector);
          
          if (similarity && similarity > 0.1) {
            similarities.push({ userIndex: i, similarity });
          }
        }
      }

      similarities.sort((a, b) => b.similarity - a.similarity);
      const topSimilarUsers = similarities.slice(0, Math.min(50, similarities.length));

      if (topSimilarUsers.length === 0) {
        return await this.getTrendingRecommendations(limit);
      }

      const recommendations = new Map();
      const totalSimilarity = topSimilarUsers.reduce((sum, user) => sum + user.similarity, 0);

      topSimilarUsers.forEach(({ userIndex: similarUserIndex, similarity }) => {
        const similarUserVector = this.userItemMatrix.getRow(similarUserIndex);
        const normalizedSimilarity = similarity / totalSimilarity;

        similarUserVector.forEach((score, productIndex) => {
          if (score > 0 && userVector[productIndex] === 0) {
            const productId = this.reverseProductMap.get(productIndex);
            const weightedScore = score * normalizedSimilarity;
            recommendations.set(productId, (recommendations.get(productId) || 0) + weightedScore);
          }
        });
      });

      const result = Array.from(recommendations.entries())
        .map(([productId, score]) => ({
          productId,
          score: Math.min(1, score),
          reason: 'Users like you also purchased this'
        }))
        .sort((a, b) => b.score - a.score);

      return this.applyDiversityFilter(result, limit);
    } catch (error) {
      logger.error('Error in enhanced collaborative filtering:', error);
      return await this.getTrendingRecommendations(limit);
    }
  }

  /**
   * Advanced content-based filtering with KNN
   */
  async getAdvancedContentBasedRecommendations(userId, limit = 10) {
    try {
      const initialized = await this.ensureInitialized();
      if (!initialized) return await this.getTrendingRecommendations(limit);

      const userProfile = this.userProfiles.get(userId);
      if (!userProfile) {
        return await this.getTrendingRecommendations(limit);
      }

      const userIndex = this.userMap.get(userId);
      const userInteractions = this.userItemMatrix.getRow(userIndex);
      
      // Create feature vectors for all products
      const productFeatures = [];
      const productIds = [];
      
      this.products.forEach(product => {
        const productId = product._id.toString();
        const features = this.productFeatures.get(productId) || [];
        
        if (features.length > 0) {
          productFeatures.push(features.slice(0, 20)); // Use first 20 TF-IDF features
          productIds.push(productId);
        }
      });

      if (productFeatures.length === 0) {
        return await this.getTrendingRecommendations(limit);
      }

      // Create user preference vector based on liked products
      const userPreferenceVector = new Array(20).fill(0);
      let interactionCount = 0;

      userInteractions.forEach((score, productIndex) => {
        if (score > 0) {
          const productId = this.reverseProductMap.get(productIndex);
          const features = this.productFeatures.get(productId) || [];
          
          if (features.length >= 20) {
            features.slice(0, 20).forEach((feature, i) => {
              userPreferenceVector[i] += feature * score;
            });
            interactionCount += score;
          }
        }
      });

      if (interactionCount === 0) {
        return await this.getTrendingRecommendations(limit);
      }

      // Normalize user preference vector
      userPreferenceVector.forEach((value, i) => {
        userPreferenceVector[i] = value / interactionCount;
      });

      // Calculate similarity with all products
      const recommendations = [];
      
      productFeatures.forEach((features, index) => {
        const productId = productIds[index];
        const productIndex = this.productMap.get(productId);
        
        // Skip if user already interacted with this product
        if (productIndex !== undefined && userInteractions[productIndex] > 0) {
          return;
        }

        const similarity = cosineSimilarity(userPreferenceVector, features);
        
        if (similarity && similarity > 0.1) {
          recommendations.push({
            productId,
            score: similarity,
            reason: 'Based on your preferences'
          });
        }
      });

      recommendations.sort((a, b) => b.score - a.score);
      return this.applyDiversityFilter(recommendations, limit);
      
    } catch (error) {
      logger.error('Error in advanced content-based filtering:', error);
      return await this.getTrendingRecommendations(limit);
    }
  }

  /**
   * Clustering-based recommendations using K-Means
   */
  async getClusterBasedRecommendations(userId, limit = 10) {
    try {
      const initialized = await this.ensureInitialized();
      if (!initialized) return await this.getTrendingRecommendations(limit);

      // Create user feature vectors for clustering
      const userFeatures = [];
      const userIds = [];
      
      this.users.forEach(user => {
        const userProfile = this.userProfiles.get(user._id.toString());
        if (userProfile && userProfile.totalInteractions > 0) {
          const features = [
            userProfile.avgPrice / 1000, // Normalize price
            userProfile.totalInteractions / 100, // Normalize interactions
            Array.from(userProfile.categories.keys()).length / 10, // Category diversity
            Array.from(userProfile.brands.keys()).length / 10 // Brand diversity
          ];
          
          userFeatures.push(features);
          userIds.push(user._id.toString());
        }
      });

      if (userFeatures.length < 5) {
        return await this.getTrendingRecommendations(limit);
      }

      // Perform K-means clustering
      const numClusters = Math.min(5, Math.floor(userFeatures.length / 3));
      const kmeans = new KMeans(userFeatures, numClusters);
      const clusters = kmeans.clusters;

      // Find user's cluster
      const targetUserIndex = userIds.indexOf(userId);
      if (targetUserIndex === -1) {
        return await this.getTrendingRecommendations(limit);
      }

      const userCluster = clusters[targetUserIndex];
      
      // Get users in the same cluster
      const clusterUsers = [];
      clusters.forEach((cluster, index) => {
        if (cluster === userCluster && userIds[index] !== userId) {
          clusterUsers.push(userIds[index]);
        }
      });

      if (clusterUsers.length === 0) {
        return await this.getTrendingRecommendations(limit);
      }

      // Get popular products from cluster users
      const productScores = new Map();
      const userIndex = this.userMap.get(userId);
      const userInteractions = this.userItemMatrix.getRow(userIndex);

      clusterUsers.forEach(clusterId => {
        const clusterUserIndex = this.userMap.get(clusterId);
        if (clusterUserIndex !== undefined) {
          const clusterInteractions = this.userItemMatrix.getRow(clusterUserIndex);
          
          clusterInteractions.forEach((score, productIndex) => {
            if (score > 0 && userInteractions[productIndex] === 0) {
              const productId = this.reverseProductMap.get(productIndex);
              productScores.set(productId, (productScores.get(productId) || 0) + score);
            }
          });
        }
      });

      const recommendations = Array.from(productScores.entries())
        .map(([productId, score]) => ({
          productId,
          score: score / clusterUsers.length,
          reason: 'Popular in your customer segment'
        }))
        .sort((a, b) => b.score - a.score);

      return this.applyDiversityFilter(recommendations, limit);
      
    } catch (error) {
      logger.error('Error in cluster-based recommendations:', error);
      return await this.getTrendingRecommendations(limit);
    }
  }

  /**
   * Advanced hybrid recommendations
   */
  async getAdvancedHybridRecommendations(userId, limit = 10) {
    try {
      const [collaborative, content, trending, cluster] = await Promise.all([
        this.getEnhancedCollaborativeRecommendations(userId, limit * 2),
        this.getAdvancedContentBasedRecommendations(userId, limit * 2), 
        this.getTrendingRecommendations(limit),
        this.getClusterBasedRecommendations(userId, limit)
      ]);

      // Combine recommendations with different weights
      const combinedScores = new Map();
      
      // Collaborative filtering: 40%
      collaborative.forEach(rec => {
        combinedScores.set(rec.productId, (combinedScores.get(rec.productId) || 0) + rec.score * 0.4);
      });
      
      // Content-based: 30%
      content.forEach(rec => {
        combinedScores.set(rec.productId, (combinedScores.get(rec.productId) || 0) + rec.score * 0.3);
      });
      
      // Trending: 15%
      trending.forEach(rec => {
        combinedScores.set(rec.productId, (combinedScores.get(rec.productId) || 0) + rec.score * 0.15);
      });
      
      // Cluster-based: 15%
      cluster.forEach(rec => {
        combinedScores.set(rec.productId, (combinedScores.get(rec.productId) || 0) + rec.score * 0.15);
      });

      const hybridRecommendations = Array.from(combinedScores.entries())
        .map(([productId, score]) => ({
          productId,
          score,
          reason: 'AI-powered hybrid recommendation'
        }))
        .sort((a, b) => b.score - a.score);

      return this.applyAdvancedDiversityFilter(hybridRecommendations, userId, limit);
      
    } catch (error) {
      logger.error('Error in advanced hybrid recommendations:', error);
      return await this.getTrendingRecommendations(limit);
    }
  }

  /**
   * Apply diversity filter to recommendations
   */
  applyDiversityFilter(recommendations, maxResults = 10) {
    const diverseRecs = [];
    const selectedCategories = new Set();
    const selectedBrands = new Set();
    
    for (const rec of recommendations) {
      const product = this.products.find(p => p._id.toString() === rec.productId);
      if (!product) continue;
      
      // Ensure category diversity (max 2 per category in first half)
      const categoryCount = Array.from(selectedCategories).filter(cat => cat === product.category).length;
      const brandCount = Array.from(selectedBrands).filter(brand => brand === product.brand).length;
      
      if (diverseRecs.length < maxResults / 2) {
        if (categoryCount >= 2 || brandCount >= 2) continue;
      }
      
      selectedCategories.add(product.category);
      selectedBrands.add(product.brand);
      diverseRecs.push(rec);
      
      if (diverseRecs.length >= maxResults) break;
    }
    
    return diverseRecs;
  }

  /**
   * Apply advanced diversity filter with business context
   */
  applyAdvancedDiversityFilter(recommendations, userId, maxResults = 10) {
    const userProfile = this.userProfiles.get(userId);
    if (!userProfile) return this.applyDiversityFilter(recommendations, maxResults);
    
    const diverseRecs = [];
    const selectedCategories = new Map();
    const selectedBrands = new Map();
    const selectedBusinessTypes = new Map();
    
    // Get user's business type for preference
    const userBusinessType = this.users.find(u => u._id.toString() === userId)?.businessType;
    
    for (const rec of recommendations) {
      const product = this.products.find(p => p._id.toString() === rec.productId);
      if (!product) continue;
      
      const categoryCount = selectedCategories.get(product.category) || 0;
      const brandCount = selectedBrands.get(product.brand) || 0;
      const businessTypeCount = selectedBusinessTypes.get(product.businessType) || 0;
      
      // Apply diversity constraints
      if (diverseRecs.length > 3) {
        if (categoryCount >= 2) continue;
        if (brandCount >= 2) continue;
        if (businessTypeCount >= 3 && product.businessType !== userBusinessType) continue;
      }
      
      // Boost score for user's business type
      if (product.businessType === userBusinessType) {
        rec.score *= 1.2;
      }
      
      selectedCategories.set(product.category, categoryCount + 1);
      selectedBrands.set(product.brand, brandCount + 1);
      selectedBusinessTypes.set(product.businessType, businessTypeCount + 1);
      diverseRecs.push(rec);
      
      if (diverseRecs.length >= maxResults) break;
    }
    
    return diverseRecs.sort((a, b) => b.score - a.score);
  }

  /**
   * Real-time learning - update model with user interaction
   */
  async updateWithInteraction(userId, productId, interactionType, weight = 1.0) {
    try {
      const userIndex = this.userMap.get(userId);
      const productIndex = this.productMap.get(productId);
      
      if (userIndex !== undefined && productIndex !== undefined) {
        // Update interaction matrix
        const currentScore = this.userItemMatrix.get(userIndex, productIndex);
        this.userItemMatrix.set(userIndex, productIndex, currentScore + weight);
        
        // Update user profile
        const userProfile = this.userProfiles.get(userId);
        const product = this.products.find(p => p._id.toString() === productId);
        
        if (userProfile && product) {
          // Update category preferences
          const currentCategoryScore = userProfile.categories.get(product.category) || 0;
          userProfile.categories.set(product.category, currentCategoryScore + weight);
          
          // Update brand preferences  
          const currentBrandScore = userProfile.brands.get(product.brand) || 0;
          userProfile.brands.set(product.brand, currentBrandScore + weight);
          
          userProfile.totalInteractions += weight;
          this.userProfiles.set(userId, userProfile);
        }
        
        logger.info(`Updated ML model with interaction: ${userId} -> ${productId} (${interactionType})`);
      }
    } catch (error) {
      logger.error('Error updating ML model with interaction:', error);
    }
  }

  // Update model periodically
  async updateModel() {
    try {
      logger.info('Updating ML recommendation model...');
      await this.loadData();
      await this.buildUserItemMatrix();
      await this.extractProductFeatures();
      await this.buildUserProfiles();
      this.modelLastUpdated = new Date();
      logger.info('ML model updated successfully');
    } catch (error) {
      logger.error('Error updating ML model:', error);
    }
  }

  // Get model status
  getModelStatus() {
    return {
      lastUpdated: this.modelLastUpdated,
      totalUsers: this.users?.length || 0,
      totalProducts: this.products?.length || 0,
      totalOrders: this.orders?.length || 0,
      matrixSize: this.userItemMatrix ? 
        `${this.userItemMatrix.rows} x ${this.userItemMatrix.columns}` : 'Not built'
    };
  }
}

module.exports = new MLRecommendationService();
