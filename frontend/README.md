# Qwipo AI Frontend - React Application

A modern, responsive React frontend for the Qwipo AI Product Recommendation System.

## 🚀 Features

### Core Features
- **Responsive Design**: Mobile-first design with Tailwind CSS
- **Authentication**: Login/Register with JWT token management
- **Product Management**: Browse, search, and filter products
- **AI Recommendations**: ML-powered personalized product suggestions
- **Conversational AI**: Chat with AI assistant for product discovery
- **Real-time Updates**: Socket.IO integration for live notifications
- **Analytics Dashboard**: Comprehensive business insights
- **Order Management**: Track and manage orders

### Technical Features
- **React 18**: Latest React with hooks and context
- **Tailwind CSS**: Utility-first CSS framework
- **Vite**: Fast build tool and dev server
- **Axios**: HTTP client with interceptors
- **React Router**: Client-side routing
- **Socket.IO Client**: Real-time communication
- **Heroicons**: Beautiful SVG icons

## 📦 Installation

```bash
# Navigate to frontend directory
cd qwipo-frontend

# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

## 🛠️ Development

### Available Scripts

- `npm run dev` - Start development server (http://localhost:3000)
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint
- `npm run format` - Format code with Prettier

### Project Structure

```
src/
├── components/          # Reusable components
│   ├── common/         # Common UI components
│   ├── auth/           # Authentication components
│   ├── products/       # Product-related components
│   └── ...
├── pages/              # Page components
├── services/           # API services
├── context/            # React contexts
├── hooks/              # Custom hooks
├── utils/              # Utility functions
└── styles/             # Global styles
```

## 🎨 Design System

### Colors
- Primary: #667eea (Qwipo Blue)
- Secondary: #764ba2 (Qwipo Purple)
- Success: #10B981
- Warning: #F59E0B
- Error: #EF4444

### Components
- Cards with shadow and rounded corners
- Gradient backgrounds
- Interactive buttons with hover effects
- Loading states and skeletons
- Responsive grid layouts

## 🔧 Configuration

### Environment Variables
Create a `.env` file in the frontend directory:

```
VITE_API_URL=http://localhost:5000/api
VITE_SOCKET_URL=http://localhost:5000
```

### Proxy Configuration
The Vite dev server is configured to proxy API requests to the backend:

```javascript
// vite.config.js
server: {
  port: 3000,
  proxy: {
    '/api': {
      target: 'http://localhost:5000',
      changeOrigin: true,
    },
    '/socket.io': {
      target: 'http://localhost:5000',
      ws: true,
    },
  },
}
```

## 🔗 API Integration

### API Service
The `apiService.js` handles all backend communication:

- Automatic token management
- Request/response interceptors
- Error handling
- Loading states

### Socket.IO Integration
Real-time features include:

- Live notifications
- AI chat responses
- Recommendation updates
- Inventory alerts

## 📱 Pages & Features

### Authentication
- **Login Page**: Email/password authentication
- **Register Page**: Multi-step business registration
- **Protected Routes**: JWT-based route protection

### Dashboard
- Welcome section with business info
- Key metrics cards
- Personalized recommendations
- Quick actions
- Recent activity

### Products
- Product grid with pagination
- Advanced search and filtering
- Category and brand filters
- Price range filtering
- Product detail view

### AI Assistant
- Chat interface with message history
- Document upload (PDF/Images)
- Quick suggestions
- Product recommendations in chat
- Real-time responses

### Recommendations
- Multiple recommendation types
- Performance analytics
- Interactive product cards
- Explanation for recommendations

### Orders
- Order history with filtering
- Order status tracking
- Detailed order view
- Reorder functionality

### Analytics
- Business metrics dashboard
- Spending patterns
- Category analysis
- Recommendation performance
- Interactive charts

### Profile
- Profile information management
- Shopping preferences
- Notification settings
- Security options

## 🎯 Key Components

### Layout Component
- Responsive navigation
- Sidebar for desktop
- Mobile menu
- User profile section
- Real-time connection status

### Protected Route
- JWT token validation
- Automatic redirection
- Loading states
- Route protection

### API Service
- Centralized API calls
- Token management
- Error handling
- Request interceptors

## 🚀 Production Deployment

### Build Process
```bash
npm run build
```

### Deployment Options
- **Vercel**: Zero-config deployment
- **Netlify**: Git-based deployment
- **AWS S3 + CloudFront**: Static hosting
- **Docker**: Containerized deployment

### Environment Setup
Ensure environment variables are set for production:

- API endpoints
- Socket.IO URLs
- Feature flags

## 🧪 Testing

### Component Testing
```bash
npm run test
```

### E2E Testing
Integration with backend for full workflow testing.

## 🔧 Troubleshooting

### Common Issues

1. **API Connection Issues**
   - Check backend server is running
   - Verify proxy configuration
   - Check CORS settings

2. **Socket.IO Connection**
   - Ensure WebSocket support
   - Check firewall settings
   - Verify socket server

3. **Build Issues**
   - Clear node_modules and reinstall
   - Check Node.js version compatibility
   - Verify environment variables

## 📄 License

This project is part of the Qwipo Hackathon submission.

---

**Built with ❤️ for the Qwipo Hackathon Challenge**
