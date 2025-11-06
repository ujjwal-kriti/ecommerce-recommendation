import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import apiService from '../services/apiService';
import toast from 'react-hot-toast';
import {
  ArrowLeftIcon,
  CheckIcon,
  CreditCardIcon,
  TruckIcon,
  ShieldCheckIcon,
  MapPinIcon,
  PhoneIcon,
  EnvelopeIcon,
  UserIcon,
} from '@heroicons/react/24/outline';

const Checkout = () => {
  const navigate = useNavigate();
  const { cart, clearCart, formatCurrency } = useCart();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [orderId, setOrderId] = useState(null);
  const [transactionId, setTransactionId] = useState(null);
  const [paymentRetryCount, setPaymentRetryCount] = useState(0);

  const [shippingInfo, setShippingInfo] = useState({
    fullName: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    address: user?.address || '',
    city: user?.city || '',
    state: user?.state || '',
    pincode: user?.pincode || '',
    country: 'India',
  });

  const [paymentMethod, setPaymentMethod] = useState('cod');

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setShippingInfo(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const validateForm = () => {
    const required = ['fullName', 'email', 'phone', 'address', 'city', 'state', 'pincode'];
    for (let field of required) {
      if (!shippingInfo[field].trim()) {
        toast.error(`Please fill in ${field.replace(/([A-Z])/g, ' $1').toLowerCase()}`);
        return false;
      }
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(shippingInfo.email)) {
      toast.error('Please enter a valid email address');
      return false;
    }

    // Basic phone validation (10 digits)
    const phoneRegex = /^[0-9]{10}$/;
    if (!phoneRegex.test(shippingInfo.phone.replace(/\D/g, ''))) {
      toast.error('Please enter a valid 10-digit phone number');
      return false;
    }

    return true;
  };

  const processOnlinePayment = async (paymentMethod, totalAmount) => {
    // Simulate online payment processing
    return new Promise((resolve) => {
      setTimeout(() => {
        // Simulate successful payment 98% of the time (more realistic)
        const success = Math.random() > 0.02;
        
        let paymentMethodName = '';
        switch(paymentMethod) {
          case 'upi':
            paymentMethodName = 'UPI';
            break;
          case 'card':
            paymentMethodName = 'Credit/Debit Card';
            break;
          case 'netbanking':
            paymentMethodName = 'Net Banking';
            break;
          case 'wallet':
            paymentMethodName = 'Digital Wallet';
            break;
          default:
            paymentMethodName = paymentMethod.toUpperCase();
        }
        
        resolve({
          success,
          transactionId: success ? `TXN_${paymentMethod.toUpperCase()}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}` : null,
          message: success 
            ? `✅ Payment successful via ${paymentMethodName}! Amount: ₹${totalAmount}` 
            : `❌ Payment failed via ${paymentMethodName}. Please try again or use a different payment method.`
        });
      }, 1500); // Simulate 1.5 second processing time
    });
  };

  const handlePlaceOrder = async () => {
    if (!validateForm()) return;

    if (cart.items.length === 0) {
      toast.error('Your cart is empty');
      return;
    }

    // Check if user is authenticated
    if (!user) {
      toast.error('Please login to place an order');
      navigate('/login');
      return;
    }

    setLoading(true);

    try {
      let paymentStatus = 'pending';
      let transactionId = null;

      // Process online payment if not COD
      if (paymentMethod !== 'cod') {
        toast.loading('Processing payment...', { id: 'payment' });
        
        const paymentResult = await processOnlinePayment(paymentMethod, cart.total);
        
        if (!paymentResult.success) {
          toast.error(paymentResult.message, { id: 'payment' });
          
          // Check retry limit
          if (paymentRetryCount >= 2) {
            toast.error('Payment failed multiple times. Please try a different payment method.', {
              duration: 4000
            });
            setLoading(false);
            setPaymentRetryCount(0);
            return;
          }
          
          // Ask user if they want to retry or switch payment method
          const retryPayment = window.confirm(
            `Payment failed! (Attempt ${paymentRetryCount + 1}/3)\n\n` +
            '✅ Click OK to retry the same payment method\n' +
            '❌ Click Cancel to choose a different payment method'
          );
          
          if (retryPayment) {
            // Retry the same payment method
            setPaymentRetryCount(prev => prev + 1);
            setLoading(false);
            setTimeout(() => {
              handlePlaceOrder();
            }, 500);
            return;
          } else {
            // Let user choose different payment method
            setLoading(false);
            setPaymentRetryCount(0);
            toast('Please select a different payment method', {
              icon: '💡',
              duration: 3000
            });
            return;
          }
        }
        
        paymentStatus = 'completed';
        transactionId = paymentResult.transactionId;
        setPaymentRetryCount(0); // Reset retry counter on success
        toast.success(paymentResult.message, { id: 'payment' });
      } else {
        toast.dismiss('payment');
      }
      const orderData = {
        items: cart.items.map(item => ({
          productId: item._id,
          quantity: item.quantity,
          discount: 0,
          // Include full product details for demo orders
          productDetails: {
            _id: item._id,
            name: item.name,
            brand: item.brand,
            images: item.images,
            price: item.price,
            category: item.category,
            businessType: item.businessType
          }
        })),
        shippingAddress: {
          fullName: shippingInfo.fullName,
          email: shippingInfo.email,
          phone: shippingInfo.phone,
          address: shippingInfo.address,
          city: shippingInfo.city,
          state: shippingInfo.state,
          pincode: shippingInfo.pincode,
          country: shippingInfo.country
        },
        paymentMethod,
        paymentStatus,
        transactionId,
        notes: `Order placed through web application. Payment method: ${paymentMethod.toUpperCase()}${transactionId ? `, Transaction ID: ${transactionId}` : ''}`
      };

      console.log('Creating order with data:', orderData);
      const response = await apiService.createOrder(orderData);

      if (response.success) {
        setOrderId(response.data._id || response.data.id || 'ORDER_' + Date.now());
        setTransactionId(transactionId);
        setOrderPlaced(true);
        clearCart();
        
        // Show different message based on demo mode
        if (response.message && response.message.includes('Demo Mode')) {
          toast.success('Order placed successfully! (Demo Mode)');
        } else {
          toast.success('Order placed successfully!');
        }
      } else {
        throw new Error(response.message || 'Failed to place order');
      }
    } catch (error) {
      console.error('Error placing order:', error);
      
      // More specific error handling
      if (error.response?.status === 401) {
        toast.error('Please login to place an order');
        navigate('/login');
      } else if (error.response?.status === 400) {
        toast.error(error.response?.data?.message || 'Invalid order data. Please check your information.');
      } else if (error.response?.status === 500) {
        toast.error('Server error. Please try again later.');
      } else if (error.message.includes('Network Error')) {
        toast.error('Network error. Please check your connection.');
      } else {
        toast.error('Failed to place order. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Redirect to cart if empty
  if (cart.items.length === 0 && !orderPlaced) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="card text-center py-12">
            <TruckIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Your cart is empty</h2>
            <p className="text-gray-600 mb-8">
              Add some products to your cart before proceeding to checkout
            </p>
            <button
              onClick={() => navigate('/dashboard/products')}
              className="btn-primary"
            >
              Start Shopping
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Order success page
  if (orderPlaced) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="card text-center py-12">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckIcon className="h-8 w-8 text-green-600" />
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Order Placed Successfully!</h2>
            <p className="text-lg text-gray-600 mb-2">Thank you for your order</p>
            <p className="text-sm text-gray-500 mb-8">Order ID: #{orderId}</p>
            
            <div className="bg-blue-50 rounded-lg p-4 mb-8">
              <p className="text-blue-800 text-sm">
                <strong>📧 Confirmation:</strong> We've sent an order confirmation to {shippingInfo.email}
              </p>
              <p className="text-blue-800 text-sm mt-1">
                <strong>🚚 Delivery:</strong> Your order will be delivered to {shippingInfo.address}, {shippingInfo.city}
              </p>
              {paymentMethod === 'cod' && (
                <p className="text-blue-800 text-sm mt-1">
                  <strong>💰 Payment:</strong> Cash on Delivery
                </p>
              )}
              {paymentMethod === 'upi' && (
                <p className="text-blue-800 text-sm mt-1">
                  <strong>📱 Payment:</strong> UPI Payment
                </p>
              )}
              {paymentMethod === 'card' && (
                <p className="text-blue-800 text-sm mt-1">
                  <strong>💳 Payment:</strong> Credit/Debit Card
                </p>
              )}
              {paymentMethod === 'netbanking' && (
                <p className="text-blue-800 text-sm mt-1">
                  <strong>🏦 Payment:</strong> Net Banking
                </p>
              )}
              {paymentMethod === 'wallet' && (
                <p className="text-blue-800 text-sm mt-1">
                  <strong>📲 Payment:</strong> Digital Wallet
                </p>
              )}
              {transactionId && paymentMethod !== 'cod' && (
                <p className="text-green-800 text-sm mt-1">
                  <strong>🆔 Transaction ID:</strong> {transactionId}
                </p>
              )}
              {orderId.startsWith('DEMO_') && (
                <p className="text-yellow-700 text-sm mt-2 font-medium">
                  <strong>⚠️ Demo Mode:</strong> This is a demonstration order. In a real application, this would be processed through the backend system.
                </p>
              )}
            </div>

            <div className="space-y-4">
              <button
                onClick={() => navigate('/dashboard/orders')}
                className="btn-primary mx-2"
              >
                Track Your Orders
              </button>
              <button
                onClick={() => navigate('/dashboard/products')}
                className="btn-outline mx-2"
              >
                Continue Shopping
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <button
            onClick={() => navigate('/cart')}
            className="flex items-center space-x-2 text-qwipo-primary hover:text-qwipo-secondary"
          >
            <ArrowLeftIcon className="h-5 w-5" />
            <span>Back to Cart</span>
          </button>
          <h1 className="text-3xl font-bold text-gray-900">Checkout</h1>
          <div></div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Checkout Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Shipping Information */}
            <div className="card">
              <div className="flex items-center space-x-3 mb-6">
                <TruckIcon className="h-6 w-6 text-qwipo-primary" />
                <h2 className="text-xl font-bold text-gray-900">Shipping Information</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <UserIcon className="h-4 w-4 inline mr-2" />
                    Full Name *
                  </label>
                  <input
                    type="text"
                    name="fullName"
                    value={shippingInfo.fullName}
                    onChange={handleInputChange}
                    className="input-field"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <EnvelopeIcon className="h-4 w-4 inline mr-2" />
                    Email Address *
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={shippingInfo.email}
                    onChange={handleInputChange}
                    className="input-field"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <PhoneIcon className="h-4 w-4 inline mr-2" />
                    Phone Number *
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={shippingInfo.phone}
                    onChange={handleInputChange}
                    className="input-field"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <MapPinIcon className="h-4 w-4 inline mr-2" />
                    Pincode *
                  </label>
                  <input
                    type="text"
                    name="pincode"
                    value={shippingInfo.pincode}
                    onChange={handleInputChange}
                    className="input-field"
                    required
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Street Address *
                  </label>
                  <textarea
                    name="address"
                    value={shippingInfo.address}
                    onChange={handleInputChange}
                    rows="3"
                    className="input-field"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">City *</label>
                  <input
                    type="text"
                    name="city"
                    value={shippingInfo.city}
                    onChange={handleInputChange}
                    className="input-field"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">State *</label>
                  <input
                    type="text"
                    name="state"
                    value={shippingInfo.state}
                    onChange={handleInputChange}
                    className="input-field"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Payment Method */}
            <div className="card">
              <div className="flex items-center space-x-3 mb-6">
                <CreditCardIcon className="h-6 w-6 text-qwipo-primary" />
                <h2 className="text-xl font-bold text-gray-900">Payment Method</h2>
              </div>

              <div className="space-y-3">
                <label className="flex items-center space-x-3 p-4 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="cod"
                    checked={paymentMethod === 'cod'}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="text-qwipo-primary"
                  />
                  <div className="flex-1">
                    <div className="font-medium">💰 Cash on Delivery</div>
                    <div className="text-sm text-gray-500">Pay when you receive your order</div>
                  </div>
                </label>

                <label className="flex items-center space-x-3 p-4 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="upi"
                    checked={paymentMethod === 'upi'}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="text-qwipo-primary"
                  />
                  <div className="flex-1">
                    <div className="font-medium">📱 UPI Payment</div>
                    <div className="text-sm text-gray-500">Pay using Google Pay, PhonePe, Paytm, BHIM</div>
                  </div>
                </label>

                <label className="flex items-center space-x-3 p-4 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="card"
                    checked={paymentMethod === 'card'}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="text-qwipo-primary"
                  />
                  <div className="flex-1">
                    <div className="font-medium">💳 Credit/Debit Card</div>
                    <div className="text-sm text-gray-500">Visa, Mastercard, RuPay, American Express</div>
                  </div>
                </label>

                <label className="flex items-center space-x-3 p-4 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="netbanking"
                    checked={paymentMethod === 'netbanking'}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="text-qwipo-primary"
                  />
                  <div className="flex-1">
                    <div className="font-medium">🏦 Net Banking</div>
                    <div className="text-sm text-gray-500">All major banks supported</div>
                  </div>
                </label>

                <label className="flex items-center space-x-3 p-4 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="wallet"
                    checked={paymentMethod === 'wallet'}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="text-qwipo-primary"
                  />
                  <div className="flex-1">
                    <div className="font-medium">📲 Digital Wallet</div>
                    <div className="text-sm text-gray-500">Paytm, Amazon Pay, Mobikwik, Freecharge</div>
                  </div>
                </label>
              </div>
            </div>
          </div>

          {/* Order Summary */}
          <div className="card h-fit">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Order Summary</h2>

            <div className="space-y-4 mb-6">
              {cart.items.map((item) => (
                <div key={item._id} className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-gray-200 rounded-lg overflow-hidden flex-shrink-0">
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
                  <div className="flex-1">
                    <h4 className="text-sm font-medium text-gray-900 truncate">{item.name}</h4>
                    <p className="text-xs text-gray-500">Qty: {item.quantity}</p>
                  </div>
                  <div className="text-sm font-medium text-gray-900">
                    {formatCurrency(item.price.discountedPrice * item.quantity)}
                  </div>
                </div>
              ))}
            </div>

            <div className="border-t pt-4 space-y-3">
              <div className="flex justify-between text-sm">
                <span>Subtotal ({cart.count} items)</span>
                <span>{formatCurrency(cart.total)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Shipping</span>
                <span className="text-green-600">Free</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Tax</span>
                <span>Included</span>
              </div>
              <div className="border-t pt-3">
                <div className="flex justify-between text-lg font-bold">
                  <span>Total</span>
                  <span className="text-qwipo-primary">{formatCurrency(cart.total)}</span>
                </div>
              </div>
            </div>

            {/* Payment Method Summary */}
            <div className="mt-4 p-3 bg-gray-50 rounded-lg">
              <div className="text-sm text-gray-600">
                <strong>Payment Method:</strong>
                {paymentMethod === 'cod' && (
                  <span className="ml-2 text-orange-600">💰 Cash on Delivery</span>
                )}
                {paymentMethod === 'upi' && (
                  <span className="ml-2 text-blue-600">📱 UPI Payment</span>
                )}
                {paymentMethod === 'card' && (
                  <span className="ml-2 text-purple-600">💳 Credit/Debit Card</span>
                )}
                {paymentMethod === 'netbanking' && (
                  <span className="ml-2 text-green-600">🏦 Net Banking</span>
                )}
                {paymentMethod === 'wallet' && (
                  <span className="ml-2 text-indigo-600">📲 Digital Wallet</span>
                )}
              </div>
            </div>

            <button
              onClick={handlePlaceOrder}
              disabled={loading}
              className={`w-full mt-6 ${loading ? 'btn-disabled' : 'btn-primary'} flex items-center justify-center space-x-2`}
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Placing Order...</span>
                </>
              ) : (
                <>
                  <ShieldCheckIcon className="h-5 w-5" />
                  <span>Place Order</span>
                </>
              )}
            </button>

            <div className="mt-4 text-xs text-gray-500 text-center">
              <ShieldCheckIcon className="h-4 w-4 inline mr-1" />
              Your order and payment info is protected
            </div>
            
            {paymentMethod !== 'cod' && (
              <div className="mt-2 text-xs text-blue-600 text-center bg-blue-50 p-2 rounded">
                💡 Demo Mode: Online payments are simulated with 98% success rate
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;