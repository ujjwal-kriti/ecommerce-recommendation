const express = require('express');
const multer = require('multer');
const pdfParse = require('pdf-parse');
const tesseract = require('tesseract.js');
const aiAssistant = require('../services/aiAssistant');
const { protect } = require('../middleware/auth');
const logger = require('../utils/logger');

const router = express.Router();

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf' || file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only PDF and image files are allowed'), false);
    }
  }
});

// @desc    Process natural language query
// @route   POST /api/ai-assistant/chat
// @access  Private
router.post('/chat', protect, async (req, res) => {
  try {
    const { message, context = {} } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Message is required'
      });
    }

    const userId = req.user._id.toString();

    // Process the query
    const response = await aiAssistant.processQuery(userId, message.trim(), context);

    // Send real-time response via socket
    const io = req.app.get('io');
    if (io) {
      io.to(userId).emit('ai-response', {
        message: response.text,
        type: response.type,
        timestamp: new Date()
      });
    }

    res.json({
      success: true,
      data: {
        response: response.text,
        type: response.type,
        products: response.products || null,
        actions: response.actions || null,
        quickActions: response.quickActions || null
      }
    });
  } catch (error) {
    logger.error('AI Assistant chat error:', error);
    res.status(500).json({
      success: false,
      message: 'Error processing your request'
    });
  }
});

// --------------------------------------------------
// Demo route (unauthenticated) for quick testing
// Creates or reuses a demo user and forwards the message
// @route   POST /api/ai-assistant/demo
// @access  Public (dev only)
router.post('/demo', async (req, res) => {
  try {
    const { message, context = {} } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({ success: false, message: 'Message is required' });
    }

    // Find or create a lightweight demo user
    let demoUser = await require('../models/User').findOne({ email: 'demo@local' }).lean();

    if (!demoUser) {
      // Create minimal demo user (use the User model save so pre-save hooks run)
      const UserModel = require('../models/User');
      const demo = new UserModel({
        name: 'Demo User',
        email: 'demo@local',
        password: 'demopassword',
        businessType: 'other',
        businessName: 'Demo Business',
        phone: '0000000000'
      });

      await demo.save();
      demoUser = demo.toObject();
    }

    // Forward to AI assistant service
    const aiAssistant = require('../services/aiAssistant');
    const response = await aiAssistant.processQuery(demoUser._id.toString(), message.trim(), context);

    res.json({
      success: true,
      data: {
        response: response.text,
        type: response.type,
        products: response.products || null,
        actions: response.actions || null,
        quickActions: response.quickActions || null
      }
    });
  } catch (error) {
    logger.error('Demo chat error:', error);
    res.status(500).json({ success: false, message: 'Error processing demo request' });
  }
});

// @desc    Upload and process document (PDF/Image)
// @route   POST /api/ai-assistant/upload
// @access  Private
router.post('/upload', protect, upload.single('document'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }

    const { purpose = 'order' } = req.body;
    let extractedText = '';

    // Extract text based on file type
    if (req.file.mimetype === 'application/pdf') {
      const pdfData = await pdfParse(req.file.buffer);
      extractedText = pdfData.text;
    } else if (req.file.mimetype.startsWith('image/')) {
      const { data: { text } } = await tesseract.recognize(req.file.buffer, 'eng');
      extractedText = text;
    }

    if (!extractedText.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Could not extract text from the document'
      });
    }

    // Process extracted text based on purpose
    let processedData = {};

    switch (purpose) {
      case 'order':
        processedData = await processOrderDocument(extractedText);
        break;
      case 'invoice':
        processedData = await processInvoiceDocument(extractedText);
        break;
      case 'inventory':
        processedData = await processInventoryDocument(extractedText);
        break;
      default:
        processedData = { text: extractedText };
    }

    // Get AI insights
    const aiResponse = await aiAssistant.processQuery(
      req.user._id.toString(),
      `Please analyze this ${purpose} document: ${extractedText.substring(0, 1000)}...`
    );

    res.json({
      success: true,
      data: {
        extractedText: extractedText.substring(0, 2000), // Limit response size
        processedData,
        aiInsights: aiResponse.text,
        purpose
      }
    });
  } catch (error) {
    logger.error('Document upload error:', error);
    res.status(500).json({
      success: false,
      message: 'Error processing document'
    });
  }
});

// @desc    Get conversation history
// @route   GET /api/ai-assistant/history
// @access  Private
router.get('/history', protect, async (req, res) => {
  try {
    const userId = req.user._id.toString();
    const history = aiAssistant.getHistory(userId);

    res.json({
      success: true,
      data: {
        history: history.slice(-20), // Last 20 messages
        total: history.length
      }
    });
  } catch (error) {
    logger.error('Get history error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching conversation history'
    });
  }
});

// @desc    Clear conversation history
// @route   DELETE /api/ai-assistant/history
// @access  Private
router.delete('/history', protect, async (req, res) => {
  try {
    const userId = req.user._id.toString();
    aiAssistant.clearHistory(userId);

    res.json({
      success: true,
      message: 'Conversation history cleared'
    });
  } catch (error) {
    logger.error('Clear history error:', error);
    res.status(500).json({
      success: false,
      message: 'Error clearing conversation history'
    });
  }
});

// @desc    Get quick suggestions
// @route   GET /api/ai-assistant/suggestions
// @access  Private
router.get('/suggestions', protect, async (req, res) => {
  try {
    const suggestions = [
      {
        category: 'Product Discovery',
        items: [
          'Show me trending products',
          'Find products in electronics category',
          'Recommend products for my business',
          'What are the best deals today?'
        ]
      },
      {
        category: 'Business Help',
        items: [
          'Help me reorder my usual items',
          'Show my purchase history',
          'Track my recent orders',
          'Find products similar to what I bought before'
        ]
      },
      {
        category: 'Smart Features',
        items: [
          'Analyze my spending patterns',
          'Set up automatic reordering',
          'Get price drop alerts',
          'Find bulk purchase opportunities'
        ]
      }
    ];

    res.json({
      success: true,
      data: suggestions
    });
  } catch (error) {
    logger.error('Get suggestions error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching suggestions'
    });
  }
});

// @desc    Process voice message
// @route   POST /api/ai-assistant/voice
// @access  Private
router.post('/voice', protect, upload.single('audio'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No audio file uploaded'
      });
    }

    // For now, return a placeholder response
    // In production, you would integrate with speech-to-text service
    const response = {
      text: "Voice processing is not yet implemented. Please use text chat.",
      type: 'voice_not_supported'
    };

    res.json({
      success: true,
      data: response
    });
  } catch (error) {
    logger.error('Voice processing error:', error);
    res.status(500).json({
      success: false,
      message: 'Error processing voice message'
    });
  }
});

// Helper functions for document processing
async function processOrderDocument(text) {
  const lines = text.split('\n');
  const items = [];

  // Simple pattern matching for common order formats
  for (const line of lines) {
    const itemMatch = line.match(/(\d+)\s*x?\s*([A-Za-z0-9\s]+)\s*[₹$]?([\d,]+\.?\d*)/);
    if (itemMatch) {
      items.push({
        quantity: parseInt(itemMatch[1]),
        name: itemMatch[2].trim(),
        price: parseFloat(itemMatch[3].replace(',', ''))
      });
    }
  }

  return {
    type: 'order',
    items,
    totalItems: items.length
  };
}

async function processInvoiceDocument(text) {
  // Basic invoice processing logic
  const totalMatch = text.match(/total[:\s]+[₹$]?([\d,]+\.?\d*)/i);
  const dateMatch = text.match(/(\d{1,2}[/-]\d{1,2}[/-]\d{2,4})/);

  return {
    type: 'invoice',
    total: totalMatch ? parseFloat(totalMatch[1].replace(',', '')) : null,
    date: dateMatch ? dateMatch[1] : null
  };
}

async function processInventoryDocument(text) {
  // Basic inventory processing logic
  const lines = text.split('\n');
  const items = [];

  for (const line of lines) {
    const stockMatch = line.match(/([A-Za-z0-9\s]+)\s*[:\s]+(\d+)/);
    if (stockMatch) {
      items.push({
        name: stockMatch[1].trim(),
        stock: parseInt(stockMatch[2])
      });
    }
  }

  return {
    type: 'inventory',
    items,
    totalItems: items.length
  };
}

module.exports = router;
