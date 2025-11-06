const axios = require('axios');
const logger = require('../utils/logger');

const PYTHON_ML_URL = process.env.PYTHON_ML_URL || 'http://localhost:8000';

async function getCartRecommendations(productIds = [], limit = 8) {
  try {
    const resp = await axios.post(`${PYTHON_ML_URL}/recommendations/cart`, { productIds, limit }, { timeout: 10000 });
    // Expecting { success:true, data: { recommendations: [...] } }
    return resp.data;
  } catch (err) {
    logger.error('Python ML service error:', err.message || err);
    throw err;
  }
}

module.exports = { getCartRecommendations };
