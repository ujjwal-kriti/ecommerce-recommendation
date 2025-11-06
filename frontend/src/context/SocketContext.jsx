import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import toast from 'react-hot-toast';
import { useAuth } from './AuthContext';

const SocketContext = createContext();

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);
  const { user, isAuthenticated } = useAuth();

  useEffect(() => {
    if (isAuthenticated && user) {
      const newSocket = io('http://localhost:5000', {
        transports: ['polling'], // Use polling only to avoid WebSocket issues
        reconnectionAttempts: 3,
        reconnectionDelay: 2000,
        timeout: 5000,
        forceNew: true,
        withCredentials: false // Disable credentials for development
      });

      newSocket.on('connect', () => {
        console.log('Connected to server');
        setConnected(true);
        newSocket.emit('join-room', user.id);
      });

      newSocket.on('connect_error', (error) => {
        console.log('Socket connection error (using fallback):', error.message);
        setConnected(false);
        // Don't show error to user, just log it
      });

      newSocket.on('disconnect', () => {
        console.log('Disconnected from server');
        setConnected(false);
      });

      newSocket.on('ai-response', (data) => {
        console.log('AI Response received:', data);
        // Handle AI response in real-time
      });

      newSocket.on('recommendation-interaction', (data) => {
        console.log('Recommendation interaction:', data);
        // Handle recommendation tracking
      });

      newSocket.on('notification', (data) => {
        toast.success(data.message);
      });

      newSocket.on('inventory-alert', (data) => {
        toast.info(`Low stock: ${data.productName} (${data.stock} left)`);
      });

      newSocket.on('price-drop', (data) => {
        toast.success(`Price drop alert: ${data.productName} is now ${data.discount}% off!`);
      });

      setSocket(newSocket);

      return () => {
        newSocket.close();
        setSocket(null);
        setConnected(false);
      };
    }
  }, [isAuthenticated, user]);

  const emitEvent = (event, data) => {
    if (socket && connected) {
      socket.emit(event, data);
    }
  };

  const value = {
    socket,
    connected,
    emitEvent,
  };

  return <SocketContext.Provider value={value}>{children}</SocketContext.Provider>;
};

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    // Return a default object with safe methods instead of throwing error
    return {
      socket: null,
      connected: false,
      emitEvent: () => console.log('Socket not available')
    };
  }
  return context;
};
