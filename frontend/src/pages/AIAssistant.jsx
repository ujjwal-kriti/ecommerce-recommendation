import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import apiService from '../services/apiService';
import LoadingSpinner from '../components/common/LoadingSpinner';
import {
  PaperAirplaneIcon,
  DocumentArrowUpIcon,
  TrashIcon,
  SparklesIcon,
  UserIcon,
  ChatBubbleLeftIcon,
  ArrowPathIcon,
} from '@heroicons/react/24/outline';

const AIAssistant = () => {
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [typing, setTyping] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    loadChatHistory();
    loadSuggestions();
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadChatHistory = async () => {
    try {
      const response = await apiService.getChatHistory();
      if (response.success && response.data.history.length > 0) {
        const formattedHistory = response.data.history.map((msg) => ({
          id: Date.now() + Math.random(),
          type: msg.role === 'user' ? 'user' : 'ai',
          content: msg.content,
          timestamp: new Date(msg.timestamp),
        }));
        setMessages(formattedHistory);
      } else {
        // Add welcome message
        setMessages([
          {
            id: 1,
            type: 'ai',
            content: `Hi! I'm your AI shopping assistant. I can help you:

• Find products based on your needs
• Get personalized recommendations  
• Answer questions about inventory and orders
• Process documents and invoices
• Provide business insights

What would you like help with today?`,
            timestamp: new Date(),
          },
        ]);
      }
    } catch (error) {
      console.error('Error loading chat history:', error);
    }
  };

  const loadSuggestions = async () => {
    try {
      const response = await apiService.getAISuggestions();
      if (response.success) {
        setSuggestions(response.data.slice(0, 2)); // Show 2 categories
      }
    } catch (error) {
      console.error('Error loading suggestions:', error);
    }
  };

  const sendMessage = async (message = inputMessage) => {
    if (!message.trim() || loading) return;

    const userMessage = {
      id: Date.now(),
      type: 'user',
      content: message,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputMessage('');
    setLoading(true);
    setTyping(true);

    try {
      const response = await apiService.chatWithAI(message);

      if (response.success) {
        const aiMessage = {
          id: Date.now() + 1,
          type: 'ai',
          content: response.data.response,
          data: {
            products: response.data.products,
            actions: response.data.actions,
            type: response.data.type,
          },
          timestamp: new Date(),
        };

        setMessages((prev) => [...prev, aiMessage]);
      }
    } catch (error) {
      const errorMessage = {
        id: Date.now() + 1,
        type: 'ai',
        content: "I'm sorry, I'm having trouble understanding your request right now. Could you please try rephrasing it?",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setLoading(false);
      setTyping(false);
    }
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const userMessage = {
      id: Date.now(),
      type: 'user',
      content: `📎 Uploaded file: ${file.name}`,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setLoading(true);
    setTyping(true);

    try {
      const response = await apiService.uploadDocument(file, 'order');

      if (response.success) {
        const aiMessage = {
          id: Date.now() + 1,
          type: 'ai',
          content: `I've analyzed your document. Here's what I found:

${response.data.aiInsights}

Extracted Information:
${response.data.extractedText ? response.data.extractedText.substring(0, 500) : 'Could not extract text from document'}${response.data.extractedText?.length > 500 ? '...' : ''}`,
          data: {
            processedData: response.data.processedData,
          },
          timestamp: new Date(),
        };

        setMessages((prev) => [...prev, aiMessage]);
      }
    } catch (error) {
      const errorMessage = {
        id: Date.now() + 1,
        type: 'ai',
        content: "I'm sorry, I couldn't process that document. Please make sure it's a PDF or image file and try again.",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setLoading(false);
      setTyping(false);
    }

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const clearChat = async () => {
    try {
      await apiService.clearChatHistory();
      setMessages([
        {
          id: 1,
          type: 'ai',
          content: "Chat history cleared! How can I help you today?",
          timestamp: new Date(),
        },
      ]);
    } catch (error) {
      console.error('Error clearing chat:', error);
    }
  };

  const ProductCard = ({ product }) => (
    <div
      className="border rounded-lg p-3 hover:shadow-md cursor-pointer transition-shadow bg-gray-50 hover:bg-white"
      onClick={() => navigate(`/products/${product.id}`)}
    >
      <h4 className="font-medium text-sm text-gray-900 truncate">{product.name}</h4>
      <p className="text-xs text-gray-500">{product.brand} • {product.category}</p>
      <div className="flex items-center justify-between mt-2">
        <span className="text-sm font-bold text-qwipo-primary">
          ₹{product.price?.toLocaleString() || 'N/A'}
        </span>
        {product.reason && (
          <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
            {product.confidence && `${Math.round(product.confidence * 100)}%`}
          </span>
        )}
      </div>
      {product.reason && (
        <p className="text-xs text-gray-600 mt-1">{product.reason}</p>
      )}
    </div>
  );

  const MessageBubble = ({ message }) => (
    <div className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'} mb-4`}>
      <div className={`flex items-start space-x-2 max-w-3xl ${message.type === 'user' ? 'flex-row-reverse space-x-reverse' : ''}`}>
        <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
          message.type === 'user' 
            ? 'bg-qwipo-primary text-white' 
            : 'bg-gray-200 text-gray-600'
        }`}>
          {message.type === 'user' ? (
            <UserIcon className="h-4 w-4" />
          ) : (
            <SparklesIcon className="h-4 w-4" />
          )}
        </div>

        <div className={`rounded-2xl px-4 py-3 ${
          message.type === 'user'
            ? 'bg-qwipo-primary text-white'
            : 'bg-white border border-gray-200'
        }`}>
          <div className="whitespace-pre-wrap text-sm">{message.content}</div>

          {/* Product recommendations */}
          {message.data?.products && message.data.products.length > 0 && (
            <div className="mt-3 space-y-2">
              <p className="text-xs font-medium text-gray-600">Recommended products:</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {message.data.products.slice(0, 4).map((product, index) => (
                  <ProductCard key={index} product={product} />
                ))}
              </div>
            </div>
          )}

          {/* Action buttons */}
          {message.data?.actions && (
            <div className="mt-3 flex flex-wrap gap-2">
              {message.data.actions.map((action, index) => (
                <button
                  key={index}
                  onClick={() => sendMessage(action)}
                  className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full hover:bg-blue-200 transition-colors"
                >
                  {action}
                </button>
              ))}
            </div>
          )}

          <div className="text-xs text-gray-500 mt-2">
            {message.timestamp.toLocaleTimeString()}
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="h-[calc(100vh-12rem)] flex flex-col bg-gray-50 rounded-lg overflow-hidden">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-r from-qwipo-primary to-qwipo-secondary rounded-full flex items-center justify-center">
              <SparklesIcon className="h-6 w-6 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">AI Shopping Assistant</h2>
              <p className="text-sm text-gray-500">
                Ask me anything about products, orders, or get recommendations
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              title="Upload document"
            >
              <DocumentArrowUpIcon className="h-5 w-5" />
            </button>
            <button
              onClick={clearChat}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              title="Clear chat"
            >
              <TrashIcon className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <MessageBubble key={message.id} message={message} />
        ))}

        {typing && (
          <div className="flex justify-start mb-4">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                <SparklesIcon className="h-4 w-4 text-gray-600" />
              </div>
              <div className="bg-white border border-gray-200 rounded-2xl px-4 py-3">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                </div>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Quick suggestions */}
      {suggestions.length > 0 && messages.length <= 1 && (
        <div className="p-4 bg-white border-t border-gray-200">
          <p className="text-sm font-medium text-gray-700 mb-3">Quick suggestions:</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {suggestions.map((category) => (
              <div key={category.category}>
                <h4 className="text-xs font-medium text-gray-600 mb-2">{category.category}</h4>
                <div className="space-y-1">
                  {category.items.slice(0, 2).map((item, index) => (
                    <button
                      key={index}
                      onClick={() => sendMessage(item)}
                      className="w-full text-left text-xs bg-gray-100 hover:bg-gray-200 p-2 rounded-lg transition-colors"
                    >
                      {item}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      <div className="bg-white border-t border-gray-200 p-4">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            sendMessage();
          }}
          className="flex space-x-3"
        >
          <input
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            placeholder="Ask me about products, recommendations, or upload a document..."
            className="flex-1 input-field"
            disabled={loading}
          />
          <button
            type="submit"
            disabled={loading || !inputMessage.trim()}
            className="btn-primary flex items-center space-x-2"
          >
            {loading ? (
              <LoadingSpinner size="sm" />
            ) : (
              <PaperAirplaneIcon className="h-5 w-5" />
            )}
          </button>
        </form>
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.jpg,.jpeg,.png"
        onChange={handleFileUpload}
        className="hidden"
      />
    </div>
  );
};

export default AIAssistant;
