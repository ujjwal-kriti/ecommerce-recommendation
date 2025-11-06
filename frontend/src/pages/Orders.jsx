import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import apiService from '../services/apiService';
import LoadingSpinner from '../components/common/LoadingSpinner';
import {
  ShoppingBagIcon,
  ClockIcon,
  CheckCircleIcon,
  TruckIcon,
  XCircleIcon,
} from '@heroicons/react/24/outline';

const Orders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const navigate = useNavigate();

  useEffect(() => {
    fetchOrders();
  }, [filter]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const params = filter !== 'all' ? { status: filter } : {};
      const response = await apiService.getOrders(params);
      if (response.success) {
        // Handle different response structures
        const ordersData = response.data?.orders || response.data || [];
        setOrders(Array.isArray(ordersData) ? ordersData : []);
      } else {
        setOrders([]);
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
    }).format(amount);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending':
        return <ClockIcon className="h-5 w-5 text-yellow-500" />;
      case 'confirmed':
      case 'processing':
        return <ClockIcon className="h-5 w-5 text-blue-500" />;
      case 'shipped':
        return <TruckIcon className="h-5 w-5 text-purple-500" />;
      case 'delivered':
        return <CheckCircleIcon className="h-5 w-5 text-green-500" />;
      case 'cancelled':
        return <XCircleIcon className="h-5 w-5 text-red-500" />;
      default:
        return <ClockIcon className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return 'text-yellow-700 bg-yellow-100';
      case 'confirmed':
      case 'processing':
        return 'text-blue-700 bg-blue-100';
      case 'shipped':
        return 'text-purple-700 bg-purple-100';
      case 'delivered':
        return 'text-green-700 bg-green-100';
      case 'cancelled':
        return 'text-red-700 bg-red-100';
      default:
        return 'text-gray-700 bg-gray-100';
    }
  };

  const OrderCard = ({ order }) => (
    <div className="card hover:shadow-lg transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-lg font-medium text-gray-900">
            Order #{order.orderNumber}
          </h3>
          <p className="text-sm text-gray-500">
            Placed on {formatDate(order.createdAt)}
          </p>
        </div>

        <div className="flex items-center space-x-2">
          {getStatusIcon(order.orderStatus || order.status)}
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(order.orderStatus || order.status)}`}>
            {(order.orderStatus || order.status || 'pending').charAt(0).toUpperCase() + (order.orderStatus || order.status || 'pending').slice(1)}
          </span>
        </div>
      </div>

      <div className="space-y-3 mb-4">
        {order.items?.map((item, index) => (
          <div key={index} className="flex items-center space-x-3 p-2 bg-gray-50 rounded-lg">
            <div className="w-12 h-12 bg-gray-200 rounded-lg flex items-center justify-center">
              {(item.productId?.images?.[0] || item.product?.images?.[0]) ? (
                <img
                  src={item.productId?.images?.[0] || item.product?.images?.[0]}
                  alt={item.productId?.name || item.product?.name || 'Product'}
                  className="w-full h-full object-cover rounded-lg"
                />
              ) : (
                <span className="text-gray-400 text-xs">No img</span>
              )}
            </div>

            <div className="flex-1 min-w-0">
              <p className="font-medium text-gray-900 truncate">
                {item.productId?.name || item.product?.name || item.name || 'Product'}
              </p>
              <p className="text-sm text-gray-500">
                {(item.productId?.brand || item.product?.brand || item.brand || '')} • Qty: {item.quantity || 1}
              </p>
            </div>

            <div className="text-right">
              <p className="font-medium text-gray-900">
                {formatCurrency(item.total || (item.price * (item.quantity || 1)) || 0)}
              </p>
            </div>
          </div>
        ))}
      </div>

      <div className="border-t border-gray-200 pt-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-gray-600">Subtotal:</span>
          <span className="text-sm">{formatCurrency(order.totalAmount?.subtotal || 0)}</span>
        </div>

        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-gray-600">Tax:</span>
          <span className="text-sm">{formatCurrency(order.totalAmount?.tax || 0)}</span>
        </div>

        {(order.totalAmount?.shipping || 0) > 0 && (
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600">Shipping:</span>
            <span className="text-sm">{formatCurrency(order.totalAmount?.shipping || 0)}</span>
          </div>
        )}

        <div className="flex items-center justify-between font-medium text-lg border-t border-gray-200 pt-2">
          <span>Total:</span>
          <span className="text-qwipo-primary">{formatCurrency(order.totalAmount?.grandTotal || order.totalAmount?.total || 0)}</span>
        </div>
      </div>

      <div className="flex justify-between items-center mt-4 pt-4 border-t border-gray-200">
        <div className="text-sm text-gray-600">
          Payment: {order.paymentMethod?.charAt(0).toUpperCase() + order.paymentMethod?.slice(1)}
        </div>

        <div className="flex space-x-2">
          <button
            onClick={() => navigate(`/orders/${order._id}`)}
            className="text-sm text-qwipo-primary hover:text-qwipo-secondary font-medium"
          >
            View Details
          </button>

          {(order.orderStatus || order.status) === 'delivered' && (
            <button className="text-sm bg-qwipo-primary text-white px-3 py-1 rounded-lg hover:bg-qwipo-secondary">
              Reorder
            </button>
          )}
        </div>
      </div>
    </div>
  );

  const filters = [
    { key: 'all', label: 'All Orders' },
    { key: 'pending', label: 'Pending' },
    { key: 'processing', label: 'Processing' },
    { key: 'shipped', label: 'Shipped' },
    { key: 'delivered', label: 'Delivered' },
    { key: 'cancelled', label: 'Cancelled' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center">
            <ShoppingBagIcon className="h-8 w-8 text-qwipo-primary mr-2" />
            My Orders
          </h1>
          <p className="text-gray-600">Track and manage your orders</p>
        </div>

        <button
          onClick={() => navigate('/products')}
          className="btn-primary"
        >
          Continue Shopping
        </button>
      </div>

      {/* Filters */}
      <div className="card">
        <div className="flex flex-wrap gap-2">
          {filters.map((filterOption) => (
            <button
              key={filterOption.key}
              onClick={() => setFilter(filterOption.key)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === filterOption.key
                  ? 'bg-qwipo-primary text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {filterOption.label}
            </button>
          ))}
        </div>
      </div>

      {/* Orders List */}
      {loading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="card">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <div className="skeleton-text w-32 mb-2" />
                  <div className="skeleton-text w-24" />
                </div>
                <div className="skeleton w-20 h-6 rounded-full" />
              </div>

              <div className="space-y-3 mb-4">
                {[...Array(2)].map((_, j) => (
                  <div key={j} className="flex items-center space-x-3 p-2 bg-gray-50 rounded-lg">
                    <div className="skeleton w-12 h-12 rounded-lg" />
                    <div className="flex-1">
                      <div className="skeleton-text w-full mb-1" />
                      <div className="skeleton-text w-3/4" />
                    </div>
                    <div className="skeleton-text w-16" />
                  </div>
                ))}
              </div>

              <div className="border-t border-gray-200 pt-4">
                <div className="skeleton-text w-32 ml-auto" />
              </div>
            </div>
          ))}
        </div>
      ) : orders.length > 0 ? (
        <div className="space-y-6">
          {orders.map((order) => (
            <OrderCard key={order._id} order={order} />
          ))}
        </div>
      ) : (
        <div className="card text-center py-12">
          <ShoppingBagIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {filter === 'all' ? 'No orders yet' : `No ${filter} orders`}
          </h3>
          <p className="text-gray-500 mb-4">
            {filter === 'all' 
              ? "You haven't placed any orders yet. Start shopping to see your orders here."
              : `You don't have any ${filter} orders.`
            }
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={() => navigate('/products')}
              className="btn-primary"
            >
              Start Shopping
            </button>
            {filter !== 'all' && (
              <button
                onClick={() => setFilter('all')}
                className="btn-outline"
              >
                View All Orders
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Orders;
