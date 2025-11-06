import React, { createContext, useContext, useReducer, useEffect } from 'react';
import toast from 'react-hot-toast';

// Initial cart state
const initialState = {
  items: [],
  total: 0,
  count: 0,
};

// Cart actions
const CART_ACTIONS = {
  ADD_ITEM: 'ADD_ITEM',
  REMOVE_ITEM: 'REMOVE_ITEM',
  UPDATE_QUANTITY: 'UPDATE_QUANTITY',
  CLEAR_CART: 'CLEAR_CART',
  SET_CART: 'SET_CART',
};

// Cart reducer
const cartReducer = (state, action) => {
  switch (action.type) {
    case CART_ACTIONS.ADD_ITEM: {
      const { product, quantity = 1 } = action.payload;
      const existingItem = state.items.find(item => item._id === product._id);
      
      let updatedItems;
      if (existingItem) {
        // Update quantity if item already exists
        updatedItems = state.items.map(item =>
          item._id === product._id
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      } else {
        // Add new item
        updatedItems = [...state.items, { ...product, quantity }];
      }

      const total = updatedItems.reduce((sum, item) => sum + (item.price.discountedPrice * item.quantity), 0);
      const count = updatedItems.reduce((sum, item) => sum + item.quantity, 0);

      return {
        items: updatedItems,
        total,
        count,
      };
    }

    case CART_ACTIONS.REMOVE_ITEM: {
      const updatedItems = state.items.filter(item => item._id !== action.payload.productId);
      const total = updatedItems.reduce((sum, item) => sum + (item.price.discountedPrice * item.quantity), 0);
      const count = updatedItems.reduce((sum, item) => sum + item.quantity, 0);

      return {
        items: updatedItems,
        total,
        count,
      };
    }

    case CART_ACTIONS.UPDATE_QUANTITY: {
      const { productId, quantity } = action.payload;
      
      if (quantity <= 0) {
        // Remove item if quantity is 0 or less
        return cartReducer(state, { type: CART_ACTIONS.REMOVE_ITEM, payload: { productId } });
      }

      const updatedItems = state.items.map(item =>
        item._id === productId ? { ...item, quantity } : item
      );

      const total = updatedItems.reduce((sum, item) => sum + (item.price.discountedPrice * item.quantity), 0);
      const count = updatedItems.reduce((sum, item) => sum + item.quantity, 0);

      return {
        items: updatedItems,
        total,
        count,
      };
    }

    case CART_ACTIONS.CLEAR_CART:
      return initialState;

    case CART_ACTIONS.SET_CART:
      return action.payload;

    default:
      return state;
  }
};

// Create context
const CartContext = createContext();

// Custom hook to use cart context
export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};

// Cart provider component
export const CartProvider = ({ children }) => {
  const [cart, dispatch] = useReducer(cartReducer, initialState);

  // Load cart from localStorage on mount
  useEffect(() => {
    const savedCart = localStorage.getItem('qwipo_cart');
    if (savedCart) {
      try {
        const parsedCart = JSON.parse(savedCart);
        dispatch({ type: CART_ACTIONS.SET_CART, payload: parsedCart });
      } catch (error) {
        console.error('Error loading cart from localStorage:', error);
      }
    }
  }, []);

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('qwipo_cart', JSON.stringify(cart));
  }, [cart]);

  // Cart actions
  const addToCart = (product, quantity = 1) => {
    dispatch({ type: CART_ACTIONS.ADD_ITEM, payload: { product, quantity } });
    toast.success(`Added ${product.name} to cart!`);
  };

  const removeFromCart = (productId) => {
    dispatch({ type: CART_ACTIONS.REMOVE_ITEM, payload: { productId } });
    toast.success('Item removed from cart');
  };

  const updateQuantity = (productId, quantity) => {
    dispatch({ type: CART_ACTIONS.UPDATE_QUANTITY, payload: { productId, quantity } });
  };

  const clearCart = () => {
    dispatch({ type: CART_ACTIONS.CLEAR_CART });
    toast.success('Cart cleared');
  };

  // Helper functions
  const getItemQuantity = (productId) => {
    const item = cart.items.find(item => item._id === productId);
    return item ? item.quantity : 0;
  };

  const isInCart = (productId) => {
    return cart.items.some(item => item._id === productId);
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
    }).format(amount);
  };

  const value = {
    cart,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    getItemQuantity,
    isInCart,
    formatCurrency,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

export default CartProvider;