import React, { useState, useEffect } from 'react';
import apiService from '../services/apiService';
import LoadingSpinner from '../components/common/LoadingSpinner';
import SpendingCharts from '../components/analytics/SpendingCharts';
import {
  ChartBarIcon,
  CurrencyDollarIcon,
  ShoppingCartIcon,
  ArrowTrendingUpIcon,
  CalendarIcon,
} from '@heroicons/react/24/outline';

const Analytics = () => {
  const [analytics, setAnalytics] = useState(null);
  const [productAnalytics, setProductAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('30');
  const [customDays, setCustomDays] = useState(30);
  const [allTimeOrders, setAllTimeOrders] = useState(null);

  useEffect(() => {
    fetchAnalytics();
  }, [timeRange, customDays]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const effectiveRange = timeRange === 'custom' ? String(customDays) : timeRange;

      const [analyticsResponse, productResponse] = await Promise.all([
        apiService.getAnalytics(effectiveRange),
        apiService.getProductAnalytics(10),
      ]);

      let analyticsData = null;
      if (analyticsResponse && analyticsResponse.success) {
        analyticsData = analyticsResponse.data;
      }

      if (productResponse && productResponse.success) {
        setProductAnalytics(productResponse.data);
      }

      // If analytics missing spending patterns, fallback to compute from orders (including demo orders)
      const shouldComputeFromOrders = !analyticsData || !analyticsData.spendingPatterns ||
        !Array.isArray(analyticsData.spendingPatterns.monthlySpending) || analyticsData.spendingPatterns.monthlySpending.length === 0 ||
        !Array.isArray(analyticsData.spendingPatterns.categorySpending);

      if (shouldComputeFromOrders) {
        try {
          const ordersResp = await apiService.getOrders();
          const orders = ordersResp && ordersResp.success ? ordersResp.data : [];

          let computed;
          if ((!orders || orders.length === 0) && productResponse && productResponse.success) {
            // If there are no orders, derive spending approximately from product analytics
            const prodData = productResponse.data;
            computed = computeSpendingFromProducts(prodData, timeRange);
          } else {
            computed = computeSpendingFromOrders(orders, timeRange);
          }

          analyticsData = analyticsData || {};
          analyticsData.spendingPatterns = computed.spendingPatterns;
          analyticsData.orderMetrics = analyticsData.orderMetrics || computed.orderMetrics;
          analyticsData.recommendationMetrics = analyticsData.recommendationMetrics || { totalRecommendations: 0, clickThroughRate: 0, conversionRate: 0 };
        } catch (err) {
          console.error('Error computing analytics from orders:', err);
        }
      }

      // If totals are still zero, try to fetch a lightweight orders summary and extract total from pagination/meta
      const extractTotalFromResp = (r) => {
        if (!r) return 0;
        const body = r?.data ?? r;
        if (typeof body.total === 'number') return body.total;
        if (body.pagination && typeof body.pagination.total === 'number') return body.pagination.total;
        if (body.meta && typeof body.meta.total === 'number') return body.meta.total;
        if (body.orders && typeof body.orders.total === 'number') return body.orders.total;
        if (body.data && typeof body.data.total === 'number') return body.data.total;
        return 0;
      };

      if (analyticsData && analyticsData.orderMetrics && (!analyticsData.orderMetrics.totalOrders || analyticsData.orderMetrics.totalOrders === 0)) {
        try {
          const rawOrdersResp = await apiService.get('/orders?limit=1');
          // apiService.get returns interceptor-unwrapped body in many cases
          const totalFromMeta = extractTotalFromResp(rawOrdersResp);
          if (totalFromMeta > 0) {
            analyticsData.orderMetrics.totalOrders = totalFromMeta;
            console.debug('Analytics: extracted totalOrders from /orders metadata ->', totalFromMeta);
          } else {
            console.debug('Analytics: no total found in /orders metadata, raw response:', rawOrdersResp);
          }
        } catch (e) {
          console.debug('Analytics: fallback /orders metadata fetch failed', e.message || e);
        }
      }

      if (analyticsData) setAnalytics(analyticsData);

      // Also fetch all-time total orders (from orders metadata) so analytics can show both range and all-time
      try {
        const rawAll = await apiService.get('/orders?limit=1');
        const body = rawAll?.data ?? rawAll;
        const totalAll = typeof body.total === 'number' ? body.total : (body.pagination?.total ?? body.meta?.total ?? body.data?.total ?? 0);
        if (totalAll && totalAll > 0) setAllTimeOrders(totalAll);
      } catch (e) {
        console.debug('Analytics: failed to fetch all-time orders metadata', e?.message || e);
      }
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  // Estimate spending from product analytics (topProducts / mostViewed) when order history is not available
  const computeSpendingFromProducts = (prodData, timeRangeDays = '30') => {
    const categoryMap = new Map();
    let totalOrders = 0;
    let totalSpent = 0;

    const collect = (arr) => {
      (arr || []).forEach(p => {
        try {
          const purchases = p.analytics?.purchases || p.purchases || 0;
          const price = p.price?.discountedPrice || p.price?.mrp || 0;
          const amount = purchases * price;
          totalOrders += purchases;
          totalSpent += amount;
          const category = p.category || p.product?.category || 'Uncategorized';
          categoryMap.set(category, (categoryMap.get(category) || 0) + amount);
        } catch (e) {
          // ignore
        }
      });
    };

    collect(prodData?.topProducts || []);
    collect(prodData?.mostViewed || []);

    const categoriesArr = Array.from(categoryMap.entries()).map(([category, amount]) => ({ category, amount }));
    categoriesArr.sort((a,b) => b.amount - a.amount);

    // For monthly spending, we don't have timestamps; approximate as single bucket with total
    const monthsArr = [{ month: new Date().toISOString().slice(0,7), amount: totalSpent }];

    return {
      spendingPatterns: {
        monthlySpending: monthsArr,
        categorySpending: categoriesArr
      },
      orderMetrics: {
        totalOrders,
        totalSpent,
        averageOrderValue: totalOrders > 0 ? totalSpent / totalOrders : 0
      }
    };
  };

  // Compute monthly and category spending from orders (includes demo orders stored in localStorage)
  const computeSpendingFromOrders = (orders, timeRangeDays = '30') => {
    // timeRangeDays is a string like '30' (days)
    const now = new Date();
    const days = parseInt(timeRangeDays, 10) || 30;
    const since = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);

    // Initialize monthly buckets by month label in the selected range (group by YYYY-MM)
    const monthMap = new Map();
    const categoryMap = new Map();

    let totalOrders = 0;
    let totalSpent = 0;

    orders.forEach(order => {
      try {
        const created = order.createdAt ? new Date(order.createdAt) : new Date();
        if (created < since) return; // skip older than range

        totalOrders += 1;

        const items = order.items || [];
        items.forEach(item => {
          const qty = item.quantity || 1;
          const price = (item.price != null) ? item.price : (item.productId?.price?.discountedPrice ?? item.product?.price?.discountedPrice ?? 0);
          const amount = (price || 0) * qty;
          totalSpent += amount;

          // month key
          const monthKey = `${created.getFullYear()}-${String(created.getMonth()+1).padStart(2,'0')}`;
          monthMap.set(monthKey, (monthMap.get(monthKey) || 0) + amount);

          const category = item.productId?.category || item.product?.category || item.category || 'Uncategorized';
          categoryMap.set(category, (categoryMap.get(category) || 0) + amount);
        });
      } catch (e) {
        // ignore
      }
    });

    // Convert monthMap to ordered array of last N months (based on days window)
    const monthsArr = Array.from(monthMap.entries()).map(([k,v]) => ({ month: k, amount: v }));
    monthsArr.sort((a,b) => a.month.localeCompare(b.month));

    const categoriesArr = Array.from(categoryMap.entries()).map(([category, amount]) => ({ category, amount }));
    categoriesArr.sort((a,b) => b.amount - a.amount);

    return {
      spendingPatterns: {
        monthlySpending: monthsArr,
        categorySpending: categoriesArr
      },
      orderMetrics: {
        totalOrders,
        totalSpent,
        averageOrderValue: totalOrders > 0 ? totalSpent / totalOrders : 0
      }
    };
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
    }).format(amount);
  };

  const timeRanges = [
    { value: '7', label: 'Last 7 days' },
    { value: '30', label: 'Last 30 days' },
    { value: '90', label: 'Last 3 months' },
    { value: '365', label: 'Last year' },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-700 p-8 text-white">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="relative flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
          <div>
            <h1 className="text-3xl font-bold text-white flex items-center">
              <div className="p-2 bg-white/20 rounded-xl mr-4 backdrop-blur-sm">
                <ChartBarIcon className="h-8 w-8 text-white" />
              </div>
              Business Analytics
            </h1>
            <p className="text-blue-100 text-lg mt-2">Insights into your purchasing patterns and preferences</p>
          </div>

          <div className="flex items-center space-x-3 bg-white/20 backdrop-blur-sm rounded-xl p-3">
            <CalendarIcon className="h-5 w-5 text-blue-100" />
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              className="bg-transparent text-white border-none outline-none cursor-pointer font-medium"
            >
              {timeRanges.map((range) => (
                <option key={range.value} value={range.value} className="text-gray-900">
                  {range.label}
                </option>
              ))}
              <option value="custom" className="text-gray-900">Custom...</option>
            </select>

            {timeRange === 'custom' && (
              <div className="flex items-center space-x-2">
                <input
                  type="number"
                  min={1}
                  max={365}
                  value={customDays}
                  onChange={(e) => setCustomDays(Math.max(1, Math.min(365, Number(e.target.value || 0))))}
                  className="w-20 bg-white/20 text-white border-none outline-none px-2 py-1 rounded-md text-sm"
                />
                <span className="text-sm text-blue-100">days</span>
              </div>
            )}
          </div>
        </div>
        
        {/* Decorative elements */}
        <div className="absolute top-4 right-4 w-32 h-32 bg-white/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-4 left-4 w-24 h-24 bg-purple-400/20 rounded-full blur-2xl"></div>
      </div>

      {analytics && (
        <>
          {/* Key Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="group bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 border border-gray-100 text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                <ShoppingCartIcon className="h-8 w-8 text-white" />
              </div>
              <div className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
                {analytics.orderMetrics.totalOrders}
              </div>
              <div className="text-sm font-medium text-gray-600">
                Total Orders
                <div className="text-xs text-gray-400">All-time: {allTimeOrders !== null ? allTimeOrders : '—'}</div>
              </div>
            </div>

            <div className="group bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 border border-gray-100 text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                <CurrencyDollarIcon className="h-8 w-8 text-white" />
              </div>
              <div className="text-3xl font-bold bg-gradient-to-r from-green-600 to-teal-600 bg-clip-text text-transparent mb-2">
                {formatCurrency(analytics.orderMetrics.totalSpent)}
              </div>
              <div className="text-sm font-medium text-gray-600">Total Spent</div>
            </div>

            <div className="group bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 border border-gray-100 text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                <ArrowTrendingUpIcon className="h-8 w-8 text-white" />
              </div>
              <div className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-2">
                {formatCurrency(analytics.orderMetrics.averageOrderValue)}
              </div>
              <div className="text-sm font-medium text-gray-600">Avg Order Value</div>
            </div>

            <div className="group bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 border border-gray-100 text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-red-500 rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                <ChartBarIcon className="h-8 w-8 text-white" />
              </div>
              <div className="text-3xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent mb-2">
                {analytics.recommendationMetrics.clickThroughRate}%
              </div>
              <div className="text-sm font-medium text-gray-600">Recommendation CTR</div>
            </div>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Monthly Spending Chart */}
            <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100 hover:shadow-xl transition-shadow duration-300">
              <div className="flex items-center mb-6">
                <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg mr-3">
                  <ArrowTrendingUpIcon className="h-5 w-5 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900">Monthly Spending Trend</h3>
              </div>
              {analytics.spendingPatterns.monthlySpending.length > 0 ? (
                <div className="space-y-5">
                  {analytics.spendingPatterns.monthlySpending.map((data, index) => (
                    <div key={data.month} className="group">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-700">{data.month}</span>
                        <span className="text-sm font-bold text-gray-900">
                          {formatCurrency(data.amount)}
                        </span>
                      </div>
                      <div className="flex items-center space-x-3">
                        <div className="flex-1 bg-gray-200 rounded-full h-3 overflow-hidden">
                          <div
                            className="bg-gradient-to-r from-blue-500 to-purple-600 h-3 rounded-full transition-all duration-1000 ease-out"
                            style={{
                              width: `${(data.amount / Math.max(...analytics.spendingPatterns.monthlySpending.map(d => d.amount))) * 100}%`,
                              animationDelay: `${index * 100}ms`
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <ChartBarIcon className="h-8 w-8 text-gray-400" />
                  </div>
                  <p className="text-gray-500">No spending data available</p>
                </div>
              )}
            </div>

            {/* Category Spending */}
            <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100 hover:shadow-xl transition-shadow duration-300">
              <div className="flex items-center mb-6">
                <div className="p-2 bg-gradient-to-br from-green-500 to-teal-600 rounded-lg mr-3">
                  <ChartBarIcon className="h-5 w-5 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900">Spending by Category</h3>
              </div>
              {analytics.spendingPatterns.categorySpending.length > 0 ? (
                <div className="space-y-5">
                  {analytics.spendingPatterns.categorySpending.slice(0, 6).map((data, index) => (
                    <div key={data.category} className="group">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-700 truncate flex-1 mr-4">{data.category}</span>
                        <span className="text-sm font-bold text-gray-900">
                          {formatCurrency(data.amount)}
                        </span>
                      </div>
                      <div className="flex items-center space-x-3">
                        <div className="flex-1 bg-gray-200 rounded-full h-3 overflow-hidden">
                          <div
                            className="bg-gradient-to-r from-green-500 to-teal-600 h-3 rounded-full transition-all duration-1000 ease-out"
                            style={{
                              width: `${(data.amount / Math.max(...analytics.spendingPatterns.categorySpending.map(d => d.amount))) * 100}%`,
                              animationDelay: `${index * 150}ms`
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <ChartBarIcon className="h-8 w-8 text-gray-400" />
                  </div>
                  <p className="text-gray-500">No category data available</p>
                </div>
              )}
            </div>
          </div>

          {/* Visual charts (bar + doughnut) */}
          {analytics.spendingPatterns && (
            <SpendingCharts spendingPatterns={analytics.spendingPatterns} />
          )}

          {/* Recommendation Performance */}
          <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl p-8 border border-indigo-100">
            <div className="flex items-center mb-8">
              <div className="p-3 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-xl mr-4 shadow-lg">
                <ChartBarIcon className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">AI Recommendation Performance</h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 text-center border border-white/50 hover:shadow-lg transition-all duration-300">
                <div className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-3">
                  {analytics.recommendationMetrics.totalRecommendations}
                </div>
                <div className="text-sm font-semibold text-gray-700">Total Recommendations</div>
              </div>

              <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 text-center border border-white/50 hover:shadow-lg transition-all duration-300">
                <div className="text-4xl font-bold bg-gradient-to-r from-green-600 to-teal-600 bg-clip-text text-transparent mb-3">
                  {analytics.recommendationMetrics.clickThroughRate}%
                </div>
                <div className="text-sm font-semibold text-gray-700">Click Through Rate</div>
                <div className="text-xs text-gray-500 mt-2 bg-gray-100/80 rounded-full px-3 py-1 inline-block">
                  Industry avg: 2.5%
                </div>
              </div>

              <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 text-center border border-white/50 hover:shadow-lg transition-all duration-300">
                <div className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-3">
                  {analytics.recommendationMetrics.conversionRate}%
                </div>
                <div className="text-sm font-semibold text-gray-700">Conversion Rate</div>
                <div className="text-xs text-gray-500 mt-2 bg-gray-100/80 rounded-full px-3 py-1 inline-block">
                  Industry avg: 1.2%
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Product Performance */}
      {productAnalytics && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100 hover:shadow-xl transition-shadow duration-300">
            <div className="flex items-center mb-6">
              <div className="p-2 bg-gradient-to-br from-yellow-500 to-orange-600 rounded-lg mr-3">
                <ArrowTrendingUpIcon className="h-5 w-5 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900">Top Selling Products</h3>
            </div>
            <div className="space-y-4">
              {productAnalytics.topProducts.map((product, index) => (
                <div key={product._id} className="group flex items-center space-x-4 p-4 rounded-xl hover:bg-gradient-to-r hover:from-yellow-50 hover:to-orange-50 transition-all duration-300">
                  <div className="w-10 h-10 bg-gradient-to-br from-yellow-500 to-orange-600 text-white rounded-full flex items-center justify-center text-sm font-bold shadow-lg group-hover:scale-110 transition-transform duration-300">
                    {index + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 truncate group-hover:text-orange-700 transition-colors">{product.name}</p>
                    <p className="text-sm text-gray-500">{product.brand} • {product.category}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-gray-900 group-hover:text-orange-700 transition-colors">{product.analytics.purchases} sold</p>
                    <p className="text-sm font-medium text-green-600">{formatCurrency(product.price.discountedPrice)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100 hover:shadow-xl transition-shadow duration-300">
            <div className="flex items-center mb-6">
              <div className="p-2 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-lg mr-3">
                <ChartBarIcon className="h-5 w-5 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900">Most Viewed Products</h3>
            </div>
            <div className="space-y-4">
              {productAnalytics.mostViewed.map((product, index) => (
                <div key={product._id} className="group flex items-center space-x-4 p-4 rounded-xl hover:bg-gradient-to-r hover:from-emerald-50 hover:to-teal-50 transition-all duration-300">
                  <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-600 text-white rounded-full flex items-center justify-center text-sm font-bold shadow-lg group-hover:scale-110 transition-transform duration-300">
                    {index + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 truncate group-hover:text-emerald-700 transition-colors">{product.name}</p>
                    <p className="text-sm text-gray-500">{product.brand} • {product.category}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-gray-900 group-hover:text-emerald-700 transition-colors">{product.analytics.views} views</p>
                    <p className="text-sm font-medium text-blue-600">
                      {product.analytics.purchases > 0 && `${product.analytics.purchases} purchases`}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Analytics;
