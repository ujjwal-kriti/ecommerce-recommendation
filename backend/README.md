# 🚀 Qwipo AI - Product Recommendation System

An advanced B2B product recommendation system built for the Qwipo hackathon challenge. This system combines machine learning, AI assistant capabilities, and real-time features to enhance the retailer experience on B2B marketplaces.

## 🏆 Hackathon Features

### Core Features
- **🤖 AI-Powered Recommendations**: Hybrid ML algorithms using collaborative filtering and content-based filtering
- **💬 Conversational AI Assistant**: Natural language processing with OpenAI integration
- **📊 Real-time Analytics**: Comprehensive dashboards showing user behavior and recommendation effectiveness
- **🔔 Smart Notifications**: Proactive alerts for inventory, pricing, and recommendations
- **📄 Document Processing**: OCR and PDF parsing for automated order processing
- **🛒 Smart Order Management**: Automated reordering and bulk order processing

### Advanced Features
- **Real-time Updates**: Socket.IO integration for live notifications
- **Multi-channel Communication**: WhatsApp, SMS, and email integration capabilities
- **Voice Assistant Ready**: Infrastructure for voice command processing
- **Explainable AI**: Clear reasons for each recommendation
- **A/B Testing Support**: Framework for testing different recommendation strategies

## 🛠️ Technology Stack

### Backend
- **Node.js** with Express.js framework
- **MongoDB** with Mongoose ODM
- **TensorFlow.js** for machine learning
- **OpenAI API** for conversational AI
- **Socket.IO** for real-time communication

### ML/AI
- **Collaborative Filtering** using user-item matrix factorization
- **Content-Based Filtering** with TF-IDF vectorization
- **Hybrid Recommendation System** combining multiple algorithms
- **Natural Language Processing** for query understanding

### Additional Services
- **JWT Authentication** for secure API access
- **Rate Limiting** for API protection
- **Winston Logging** for comprehensive logging
- **Multer** for file upload handling
- **OCR/PDF Processing** for document automation

## 🚀 Quick Start

### Prerequisites
- Node.js (v16 or higher)
- MongoDB (v4.4 or higher)
- OpenAI API Key (optional, for AI assistant)

### Installation

1. **Clone and Setup**
   \`\`\`bash
   cd qwipo-product-recommendations
   npm install
   \`\`\`

2. **Configure Environment**
   \`\`\`bash
   cp .env .env.local
   # Edit .env with your configuration:
   # - MongoDB connection string
   # - OpenAI API key
   # - Other service credentials
   \`\`\`

3. **Setup Database**
   \`\`\`bash
   # Seed sample data
   node src/utils/seedData.js
   \`\`\`

4. **Start the Server**
   \`\`\`bash
   npm run dev
   \`\`\`

5. **Access the Application**
   - API: http://localhost:5000
   - Dashboard: http://localhost:5000 (serves the HTML dashboard)
   - Health Check: http://localhost:5000/health

## 📚 API Documentation

### Authentication
\`\`\`
POST /api/auth/register - User registration
POST /api/auth/login - User authentication
GET /api/auth/me - Get current user profile
\`\`\`

### Product Management
\`\`\`
GET /api/products - Get all products (with filtering)
GET /api/products/:id - Get single product
GET /api/products/meta/categories - Get categories and filters
POST /api/products/search - Advanced product search
\`\`\`

### AI Recommendations
\`\`\`
GET /api/recommendations - Get personalized recommendations
GET /api/recommendations/category/:category - Category-based recommendations
GET /api/recommendations/similar/:productId - Similar products
POST /api/recommendations/track - Track recommendation interactions
\`\`\`

### AI Assistant
\`\`\`
POST /api/ai-assistant/chat - Chat with AI assistant
POST /api/ai-assistant/upload - Upload and process documents
GET /api/ai-assistant/history - Get conversation history
GET /api/ai-assistant/suggestions - Get quick suggestions
\`\`\`

### Analytics & Notifications
\`\`\`
GET /api/analytics/dashboard - User analytics dashboard
GET /api/analytics/products - Product performance analytics
GET /api/notifications - Get user notifications
PUT /api/notifications/preferences - Update notification settings
\`\`\`

## 🤖 Machine Learning Features

### Recommendation Algorithms

1. **Collaborative Filtering**
   - User-item interaction matrix
   - Cosine similarity for user matching
   - Weighted scoring based on similar users

2. **Content-Based Filtering**
   - TF-IDF vectorization of product features
   - Category and brand preference learning
   - Price sensitivity analysis

3. **Hybrid Approach**
   - Combines collaborative and content-based methods
   - Dynamic weight adjustment based on data availability
   - Fallback to trending products for new users

### AI Assistant Capabilities

- **Intent Recognition**: Understands user queries and classifies intent
- **Product Search**: Natural language product discovery
- **Recommendation Explanations**: Provides reasons for suggestions
- **Document Processing**: Extracts information from PDFs and images
- **Conversation Memory**: Maintains context across interactions

## 📊 Demo Data

The system comes with sample data including:
- **5 Sample Products** across different categories
- **2 Sample Users** with different business types
- **Sample Orders** to demonstrate recommendation algorithms
- **Mock Analytics Data** for dashboard demonstration

## 🎯 Hackathon Highlights

### Innovation Points
1. **Hybrid ML Approach**: Combines multiple recommendation techniques
2. **Conversational AI**: Natural language interaction for product discovery
3. **Document Automation**: OCR-powered order processing from invoices
4. **Real-time Features**: Live notifications and updates
5. **Explainable AI**: Clear reasoning for recommendations

### Business Impact
- **Increased Conversion**: Personalized recommendations boost sales
- **Improved UX**: AI assistant simplifies product discovery
- **Operational Efficiency**: Automated document processing
- **Data-Driven Insights**: Comprehensive analytics for business decisions
- **Scalable Architecture**: Microservices-ready design

### Technical Excellence
- **Production Ready**: Comprehensive error handling and logging
- **Security**: JWT authentication, rate limiting, input validation
- **Performance**: Efficient ML algorithms and database optimization
- **Scalability**: Modular architecture with clear separation of concerns

## 🔧 Development

### Project Structure
\`\`\`
src/
├── controllers/     # Business logic controllers
├── models/         # MongoDB models
├── routes/         # API routes
├── middleware/     # Custom middleware
├── services/       # Business services (ML, AI, etc.)
├── utils/          # Utility functions
└── config/         # Configuration files

public/             # Static files
logs/              # Application logs
uploads/           # File uploads
\`\`\`

### Available Scripts
\`\`\`bash
npm start          # Start production server
npm run dev        # Start development server with nodemon
npm test           # Run tests
npm run seed       # Seed database with sample data
\`\`\`

## 🏆 Hackathon Submission

This project demonstrates:
- ✅ **Complete B2B Recommendation System**
- ✅ **AI/ML Integration** with real algorithms
- ✅ **Modern Tech Stack** using latest technologies
- ✅ **Production-Ready Code** with proper architecture
- ✅ **Comprehensive Documentation**
- ✅ **Demo-Ready Features** with sample data

## 📞 Support

For questions or issues related to this hackathon submission:
- Check the API documentation above
- Review the sample data in \`src/utils/seedData.js\`
- Test endpoints using the provided Postman collection
- Access the demo dashboard at the root URL

## 🙏 Acknowledgments

Built for the **Qwipo Hackathon Challenge** - Personalized Product Recommendations for Enhanced Retailer Experience.

Special thanks to the Qwipo team for providing this opportunity to showcase AI-powered B2B solutions.

---

**Happy Coding! 🚀**
