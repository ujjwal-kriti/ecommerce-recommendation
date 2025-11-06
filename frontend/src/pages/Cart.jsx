import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import {
  ArrowLeftIcon,
  ShoppingCartIcon,
  TrashIcon,
  PlusIcon,
  MinusIcon,
} from '@heroicons/react/24/outline';

import apiService from '../services/apiService';

const Cart = () => {
  const navigate = useNavigate();
  const { cart, updateQuantity, removeFromCart, clearCart, formatCurrency, addToCart } = useCart();

  const [recommendations, setRecommendations] = useState([]);
  const [recoLoading, setRecoLoading] = useState(false);

  const handleQuantityChange = (productId, newQuantity) => {
    if (newQuantity <= 0) {
      removeFromCart(productId);
    } else {
      updateQuantity(productId, newQuantity);
    }
  };

  const handleCheckout = () => {
    navigate('/checkout');
  };

  // Fetch recommendations whenever cart items change
  useEffect(() => {
    let mounted = true;

    const fetchRecs = async () => {
      if (!cart.items || cart.items.length === 0) {
        setRecommendations([]);
        return;
      }

      try {
        setRecoLoading(true);
        const productIds = cart.items.map(i => i._id);
        const res = await apiService.getCartRecommendations(productIds, 6);
        // API returns { success, data: { recommendations: [...] } }
        const recs = res?.data?.recommendations || res?.recommendations || [];
        if (mounted) setRecommendations(recs);
      } catch (err) {
        console.error('Failed to load cart recommendations', err);
      } finally {
        if (mounted) setRecoLoading(false);
      }
    };

    fetchRecs();

    return () => { mounted = false; };
  }, [cart.items]);

  if (cart.items.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <button
            onClick={() => navigate('/products')}
            className="flex items-center space-x-2 text-qwipo-primary hover:text-qwipo-secondary mb-6"
          >
            <ArrowLeftIcon className="h-5 w-5" />
            <span>Continue Shopping</span>
          </button>

          <div className="card text-center py-12">
            <ShoppingCartIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Your cart is empty</h2>
            <p className="text-gray-600 mb-8">
              Add some products to your cart to get started
            </p>
            <button
              onClick={() => navigate('/products')}
              className="btn-primary"
            >
              Start Shopping
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => navigate('/products')}
            className="flex items-center space-x-2 text-qwipo-primary hover:text-qwipo-secondary"
          >
            <ArrowLeftIcon className="h-5 w-5" />
            <span>Continue Shopping</span>
          </button>

          <div className="flex items-center space-x-4">
            <h1 className="text-2xl font-bold text-gray-900">Shopping Cart</h1>
            <span className="bg-qwipo-primary text-white px-3 py-1 rounded-full text-sm">
              {cart.count} items
            </span>
          </div>

          <button
            onClick={clearCart}
            className="text-red-600 hover:text-red-700 text-sm"
          >
            Clear Cart
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-4">
            {cart.items.map((item) => (
              <div key={item._id} className="bg-white rounded-lg shadow-sm p-4">
                <div className="flex items-center gap-4">
                  {/* Product Image */}
                  <div className="w-28 h-28 bg-gray-100 rounded-md overflow-hidden flex-shrink-0 border">
                    {item.images?.[0] ? (
                      <img
                        src={item.images[0]}
                        alt={item.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">
                        No Image
                      </div>
                    )}
                  </div>

                  {/* Product Info */}
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 text-lg">{item.name}</h3>
                    <p className="text-sm text-gray-500 mt-1">{item.brand} • {item.category}</p>
                    <div className="flex items-center space-x-3 mt-3">
                      <span className="text-xl font-bold text-qwipo-primary">
                        {formatCurrency(item.price.discountedPrice)}
                      </span>
                      {item.price.mrp > item.price.discountedPrice && (
                        <span className="text-sm text-gray-400 line-through">
                          {formatCurrency(item.price.mrp)}
                        </span>
                      )}
                    </div>
                    <div className="text-sm text-gray-500 mt-2">Qty: <span className="font-medium text-gray-700">{item.quantity}</span></div>
                  </div>

                  {/* Quantity Controls & Remove */}
                  <div className="flex flex-col items-end space-y-3">
                    <div className="flex items-center space-x-2 bg-gray-50 rounded-md px-2 py-1">
                      <button
                        onClick={() => handleQuantityChange(item._id, item.quantity - 1)}
                        className="w-8 h-8 flex items-center justify-center rounded-md border border-gray-200 bg-white hover:bg-gray-50"
                      >
                        <MinusIcon className="h-4 w-4 text-gray-600" />
                      </button>
                      <span className="w-8 text-center font-medium">{item.quantity}</span>
                      <button
                        onClick={() => handleQuantityChange(item._id, item.quantity + 1)}
                        className="w-8 h-8 flex items-center justify-center rounded-md border border-gray-200 bg-white hover:bg-gray-50"
                        disabled={item.quantity >= item.inventory?.stock}
                      >
                        <PlusIcon className="h-4 w-4 text-gray-600" />
                      </button>
                    </div>

                    <div className="text-right">
                      <div className="font-semibold text-gray-900">{formatCurrency(item.price.discountedPrice * item.quantity)}</div>
                      <button
                        onClick={() => removeFromCart(item._id)}
                        className="text-red-600 hover:text-red-700 text-sm flex items-center space-x-1 mt-1"
                      >
                        <TrashIcon className="h-4 w-4" />
                        <span>Remove</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Order Summary */}
          <div className="card h-fit">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Order Summary</h3>
            
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span>Items ({cart.count})</span>
                <span>{formatCurrency(cart.total)}</span>
              </div>
              
              <div className="flex justify-between text-sm">
                <span>Shipping</span>
                <span className="text-green-600">Free</span>
              </div>
              
              <div className="border-t pt-3">
                <div className="flex justify-between text-lg font-bold">
                  <span>Total</span>
                  <span className="text-qwipo-primary">{formatCurrency(cart.total)}</span>
                </div>
              </div>
            </div>

            <button
              onClick={handleCheckout}
              className="w-full bg-gradient-to-r from-indigo-600 to-indigo-500 text-white py-3 rounded-lg mt-6 hover:from-indigo-700 shadow"
            >
              Proceed to Checkout
            </button>

            <div className="mt-4 p-3 bg-blue-50 rounded-lg">
              <p className="text-xs text-blue-700">
                <strong>Demo Note:</strong> This is a demo cart. In a real application, 
                this would connect to payment processing and order management systems.
              </p>
            </div>
            {/* Recommendations based on cart */}
            <div className="mt-6">
              <h4 className="text-md font-semibold mb-3">Recommended for you</h4>
              {recoLoading ? (
                <div className="text-sm text-gray-500">Loading recommendations...</div>
              ) : recommendations && recommendations.length > 0 ? (
                <div className="grid grid-cols-1 gap-3">
                  {recommendations.map((rec) => (
                    <div key={rec.product._id} className="flex items-center justify-between p-3 border rounded-md">
                      <div className="flex items-center space-x-3">
                        <div className="w-14 h-14 bg-gray-100 rounded overflow-hidden flex-shrink-0">
                          {rec.product.images?.[0] ? (
                            <img src={rec.product.images[0]} alt={rec.product.name} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-xs text-gray-400">No Image</div>
                          )}
                        </div>
                        <div>
                          <div className="font-medium text-sm">{rec.product.name}</div>
                          <div className="text-xs text-gray-500">{rec.product.brand} • {rec.product.category}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-qwipo-primary">{formatCurrency(rec.product.price.discountedPrice)}</div>
                        <button
                          onClick={() => addToCart(rec.product, 1)}
                          className="mt-2 btn-secondary text-sm"
                        >
                          Add
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-sm text-gray-500">No recommendations available</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Cart;