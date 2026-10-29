import React, { useEffect, useState } from 'react';
import { CalendarIcon, DocumentChartBarIcon, ArrowDownTrayIcon } from '@heroicons/react/24/outline';
import apiService from '../services/apiService';
import LoadingSpinner from '../components/common/LoadingSpinner';

const timeRanges = [
  { value: '7', label: 'Last 7 days' },
  { value: '30', label: 'Last 30 days' },
  { value: '90', label: 'Last 3 months' },
  { value: '365', label: 'Last year' },
  { value: 'all', label: 'All time' }
];

const formatCurrency = (amount) => {
  try {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(amount);
  } catch (e) {
    return amount;
  }
};

export default function Reports() {
  const [timeRange, setTimeRange] = useState('30');
  const [customDays, setCustomDays] = useState(30);
  const [loading, setLoading] = useState(false);
  const [analytics, setAnalytics] = useState(null);
  const [fetchError, setFetchError] = useState(null);
  const [growthMode, setGrowthMode] = useState('daily');
  const [growth, setGrowth] = useState(null);

  useEffect(() => {
    fetchReports();
  }, [timeRange, customDays]);

  const fetchReports = async () => {
    setLoading(true);
    setFetchError(null);
    try {
      const effective = timeRange === 'custom' ? String(customDays) : timeRange;

      // Fetch analytics and admin summary in parallel. Admin summary is a lightweight
      // endpoint that returns site-wide totals (useful when analytics is empty or scoped).
      const [res, adminRes] = await Promise.allSettled([
        apiService.getAnalytics(effective),
        apiService.get('/analytics/admin/summary')
      ]);

      let analyticsData = null;
      if (res.status === 'fulfilled' && res.value && res.value.success) {
        analyticsData = res.value.data;
      }

      // Normalize admin summary response (apiService.get may unwrap response)
      let adminSummary = null;
      if (adminRes.status === 'fulfilled' && adminRes.value) {
        const body = adminRes.value?.data ?? adminRes.value;
        if (body && body.success && body.data) adminSummary = body.data;
        else if (body && typeof body.totalOrders === 'number') adminSummary = body;
      }

      // If analytics didn't return useful order metrics, populate from admin summary where possible
      if ((!analyticsData || !analyticsData.orderMetrics || !analyticsData.orderMetrics.totalOrders || analyticsData.orderMetrics.totalOrders === 0) && adminSummary) {
        analyticsData = analyticsData || {};
        analyticsData.orderMetrics = analyticsData.orderMetrics || {};

        // Choose an appropriate total based on selected range
        const chooseTotalForRange = () => {
          if (effective === 'all') return adminSummary.totalOrders ?? adminSummary.ordersLast365 ?? 0;
          if (effective === '365') return adminSummary.ordersLast365 ?? adminSummary.totalOrders ?? 0;
          if (effective === '30') return adminSummary.ordersLast30 ?? adminSummary.totalOrders ?? 0;
          if (effective === '90') return adminSummary.ordersLast365 ?? adminSummary.totalOrders ?? 0;
          // custom or unknown: fallback to totalOrders
          return adminSummary.totalOrders ?? 0;
        };

        analyticsData.orderMetrics.totalOrders = chooseTotalForRange();
        // other metrics are unknown from admin summary; leave them as-is or zero
        analyticsData.orderMetrics.totalSpent = analyticsData.orderMetrics.totalSpent || 0;
        analyticsData.orderMetrics.averageOrderValue = analyticsData.orderMetrics.averageOrderValue || 0;
      }

      if (analyticsData) {
        setAnalytics(analyticsData);

        // If analytics has zero totalSpent, attempt to compute from orders as a fallback
        try {
          const totalSpentMissing = !analyticsData.orderMetrics || !analyticsData.orderMetrics.totalSpent || analyticsData.orderMetrics.totalSpent === 0;
          if (totalSpentMissing) {
            const rawOrdersResp = await apiService.getOrders({ limit: 1000 });
            const orders = rawOrdersResp && rawOrdersResp.success ? rawOrdersResp.data : [];

            // compute totals within the selected range
            const now = new Date();
            const days = effective === 'all' ? 36500 : parseInt(effective, 10) || 30; // large number for 'all'
            const since = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);

            let computedTotal = 0;
            let computedOrders = 0;
            orders.forEach(order => {
              try {
                const created = order.createdAt ? new Date(order.createdAt) : new Date();
                if (created < since) return;
                // prefer grandTotal
                const grand = (order.totalAmount?.grandTotal ?? order.totalAmount?.grand_total ?? order.grandTotal ?? order.total);
                if (typeof grand === 'number' && grand > 0) {
                  computedTotal += grand;
                } else {
                  const items = order.items || [];
                  let orderSum = 0;
                  items.forEach(it => {
                    const qty = it.quantity || it.qty || 1;
                    const unit = (it.price != null) ? it.price : (it.productId?.price?.discountedPrice ?? it.product?.price?.discountedPrice ?? 0);
                    const itemTotal = (it.total != null) ? it.total : (unit * qty);
                    orderSum += Number(itemTotal) || 0;
                  });
                  computedTotal += orderSum;
                }
                computedOrders += 1;
              } catch (e) {
                // ignore
              }
            });

            if (computedTotal > 0) {
              setAnalytics(prev => ({
                ...(prev || {}),
                orderMetrics: {
                  ...(prev?.orderMetrics || {}),
                  totalSpent: computedTotal,
                  averageOrderValue: computedOrders > 0 ? (computedTotal / computedOrders) : (prev?.orderMetrics?.averageOrderValue || 0)
                }
              }));
            }
          }
        } catch (e) {
          console.debug('Reports: fallback compute failed', e?.message || e);
        }
      }
      else setAnalytics(null);

      // compute sales growth series from recent orders (best-effort)
      try {
        const ordResp = await apiService.getOrders({ limit: 2000 });
        const ords = ordResp && ordResp.success ? ordResp.data : [];
        const g = computeGrowthFromOrders(ords, growthMode);
        setGrowth(g);
      } catch (e) {
        console.debug('Failed to compute growth series', e?.message || e);
      }
    } catch (err) {
      console.error('Failed to load reports', err);
      setAnalytics(null);
      setFetchError(err?.response?.data?.message || err.message || 'Failed to fetch analytics');
    } finally {
      setLoading(false);
    }
  };

  // Try admin summary as a fallback to get counts when analytics or orders are unavailable
  const fetchAdminSummary = async () => {
    try {
      const res = await apiService.get('/analytics/admin/summary');
      // apiService.get returns body (interceptor-unwrapped) in many shapes
      const body = res?.data ?? res;
      if (body && body.success && body.data) return body.data;
      if (body && typeof body.totalOrders === 'number') return body;
      return null;
    } catch (e) {
      console.debug('Admin summary fetch failed', e?.message || e);
      return null;
    }
  };

  const exportCSV = (type = 'sales') => {
    if (!analytics) return;
    let rows = [];
    if (type === 'sales') {
      // export monthly spending
      rows.push(['Month', 'Amount']);
      (analytics.spendingPatterns?.monthlySpending || []).forEach(r => rows.push([r.month, r.amount]));
    } else if (type === 'orders') {
      rows.push(['Metric', 'Value']);
      const om = analytics.orderMetrics || {};
      rows.push(['totalOrders', om.totalOrders || 0]);
      rows.push(['totalSpent', om.totalSpent || 0]);
      rows.push(['averageOrderValue', om.averageOrderValue || 0]);
    }

    const csv = rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${type}-report-${timeRange || 'custom'}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  // Export all orders with details (attempts to fetch a large page of orders)
  const exportAllOrdersCSV = async () => {
    try {
      setLoading(true);
      // Try the apiService helper which normalizes responses
      const res = await apiService.getOrders({ limit: 10000 });
      const orders = res && res.success ? res.data : [];

      // If no orders found, try lower-level GET to handle different shapes
      let allOrders = orders;
      if ((!allOrders || allOrders.length === 0)) {
        try {
          const raw = await apiService.get('/orders?limit=10000');
          const body = raw?.data ?? raw;
          if (Array.isArray(body)) allOrders = body;
          else if (Array.isArray(body.data)) allOrders = body.data;
          else if (Array.isArray(body.orders)) allOrders = body.orders;
          else allOrders = [];
        } catch (e) {
          allOrders = [];
        }
      }

      if (!allOrders || allOrders.length === 0) {
        setLoading(false);
        return alert('No orders available to export');
      }

      // Build CSV rows
      const rows = [];
      rows.push([
        'Order ID', 'Order Number', 'Created At', 'Customer Name', 'Customer Email', 'Status', 'Payment Method', 'Payment Status', 'Item Count', 'Items', 'Subtotal', 'Tax', 'Shipping', 'Grand Total', 'Shipping Address'
      ]);

      allOrders.forEach(order => {
        try {
          const id = order._id || order.id || '';
          const orderNumber = order.orderNumber || order.order_number || '';
          const createdAt = order.createdAt || order.created_at || '';
          const customerName = (order.user && (order.user.name || order.user.fullName)) || order.customerName || order.customer?.name || '';
          const customerEmail = order.user?.email || order.customer?.email || order.email || '';
          const status = order.status || '';
          const paymentMethod = order.paymentMethod || order.payment_method || '';
          const paymentStatus = order.paymentStatus || order.payment_status || '';

          const items = order.items || order.orderItems || [];
          const itemCount = items.length || 0;
          const itemsText = (items || []).map(it => {
            const name = it.productId?.name || it.product?.name || it.name || it.title || 'Product';
            const qty = it.quantity || it.qty || 1;
            const price = (it.total != null) ? it.total : ((it.price != null ? it.price : (it.productId?.price?.discountedPrice ?? it.product?.price?.discountedPrice ?? 0)) * qty);
            const unit = it.price != null ? it.price : (it.productId?.price?.discountedPrice ?? it.product?.price?.discountedPrice ?? 0);
            return `${name} x${qty} @ ${unit} = ${price}`;
          }).join(' | ');

          const subtotal = order.totalAmount?.subtotal ?? order.subtotal ?? '';
          const tax = order.totalAmount?.tax ?? order.tax ?? '';
          const shipping = order.totalAmount?.shipping ?? order.shipping ?? '';
          const grandTotal = (order.totalAmount?.grandTotal ?? order.totalAmount?.grand_total ?? order.grandTotal ?? order.total) || '';

          const shippingAddr = (() => {
            const a = order.shippingAddress || order.address || order.shipping || {};
            if (typeof a === 'string') return a;
            const parts = [a.name, a.line1 || a.address1 || a.street, a.city, a.state, a.postalCode || a.zip, a.country].filter(Boolean);
            return parts.join(', ');
          })();

          rows.push([id, orderNumber, createdAt, customerName, customerEmail, status, paymentMethod, paymentStatus, itemCount, itemsText, subtotal, tax, shipping, grandTotal, shippingAddr]);
        } catch (e) {
          // skip problematic order
        }
      });

      const csv = rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `orders-all-${new Date().toISOString().slice(0,10)}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error('Export all orders failed', e);
      alert('Failed to export orders');
    } finally {
      setLoading(false);
    }
  };

  // Helpers to compute growth
  const parseOrderAmount = (order) => {
    const grand = order?.totalAmount?.grandTotal ?? order?.totalAmount?.grand_total ?? order?.grandTotal ?? order?.total;
    if (typeof grand === 'number' && !isNaN(grand)) return grand;
    const items = order.items || [];
    let sum = 0;
    items.forEach(it => {
      const qty = it.quantity || it.qty || 1;
      const unit = (it.price != null) ? it.price : (it.productId?.price?.discountedPrice ?? it.product?.price?.discountedPrice ?? 0);
      const itemTotal = (it.total != null) ? it.total : (unit * qty);
      sum += Number(itemTotal) || 0;
    });
    return sum;
  };

  const computeGrowthFromOrders = (orders = [], mode = 'daily') => {
    const now = new Date();
    const series = [];
    if (mode === 'daily') {
      const days = 14;
      for (let i = days - 1; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
        const label = d.toISOString().slice(0,10);
        const dayTotal = orders.reduce((s, o) => {
          try {
            const created = o.createdAt ? new Date(o.createdAt) : new Date();
            if (created.toISOString().slice(0,10) === label) return s + parseOrderAmount(o);
            return s;
          } catch (e) { return s; }
        }, 0);
        series.push({ label, value: dayTotal });
      }
      const current = series.slice(7).reduce((s, x) => s + x.value, 0);
      const previous = series.slice(0,7).reduce((s, x) => s + x.value, 0);
      const pct = previous === 0 ? (current === 0 ? 0 : 100) : ((current - previous) / previous) * 100;
      return { mode: 'daily', series, current, previous, percentChange: pct };
    }
    if (mode === 'weekly') {
      const weeks = 8;
      for (let i = weeks - 1; i >= 0; i--) {
        const end = new Date(now.getTime() - i * 7 * 24 * 60 * 60 * 1000);
        const weekStart = new Date(end.getFullYear(), end.getMonth(), end.getDate() - end.getDay());
        const label = `${weekStart.getFullYear()}-W${Math.ceil(((weekStart - new Date(weekStart.getFullYear(),0,1))/(24*60*60*1000) + 1)/7)}`;
        const weekTotal = orders.reduce((s, o) => {
          try {
            const created = o.createdAt ? new Date(o.createdAt) : new Date();
            const inWeek = created >= weekStart && created < new Date(weekStart.getTime() + 7*24*60*60*1000);
            if (inWeek) return s + parseOrderAmount(o);
            return s;
          } catch (e) { return s; }
        }, 0);
        series.push({ label, value: weekTotal });
      }
      const current = series.slice(4).reduce((s, x) => s + x.value, 0);
      const previous = series.slice(0,4).reduce((s, x) => s + x.value, 0);
      const pct = previous === 0 ? (current === 0 ? 0 : 100) : ((current - previous) / previous) * 100;
      return { mode: 'weekly', series, current, previous, percentChange: pct };
    }
    const months = 6;
    for (let i = months - 1; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const label = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
      const monthTotal = orders.reduce((s, o) => {
        try {
          const created = o.createdAt ? new Date(o.createdAt) : new Date();
          if (created.getFullYear() === d.getFullYear() && created.getMonth() === d.getMonth()) return s + parseOrderAmount(o);
          return s;
        } catch (e) { return s; }
      }, 0);
      series.push({ label, value: monthTotal });
    }
    const current = series.slice(3).reduce((s, x) => s + x.value, 0);
    const previous = series.slice(0,3).reduce((s, x) => s + x.value, 0);
    const pct = previous === 0 ? (current === 0 ? 0 : 100) : ((current - previous) / previous) * 100;
    return { mode: 'monthly', series, current, previous, percentChange: pct };
  };

  // Compute spending patterns (monthly and by category) from raw orders
  const computeSpendingFromOrders = (orders = [], timeRangeDays = '30') => {
    const now = new Date();
    const days = timeRangeDays === 'all' ? 36500 : parseInt(timeRangeDays, 10) || 30;
    const since = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);

    const monthMap = new Map();
    const categoryMap = new Map();

    let totalOrders = 0;
    let totalSpent = 0;

    orders.forEach(order => {
      try {
        const created = order.createdAt ? new Date(order.createdAt) : new Date();
        if (created < since) return;

        totalOrders += 1;

        const items = order.items || [];
        items.forEach(item => {
          const qty = item.quantity || 1;
          const price = (item.price != null) ? item.price : (item.productId?.price?.discountedPrice ?? item.product?.price?.discountedPrice ?? 0);
          const amount = (price || 0) * qty;
          totalSpent += amount;

          const monthKey = `${created.getFullYear()}-${String(created.getMonth()+1).padStart(2,'0')}`;
          monthMap.set(monthKey, (monthMap.get(monthKey) || 0) + amount);

          const category = item.productId?.category || item.product?.category || item.category || 'Uncategorized';
          categoryMap.set(category, (categoryMap.get(category) || 0) + amount);
        });
      } catch (e) {
        // ignore
      }
    });

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

  // Small SVG bar chart for monthly spending
  const MonthlyBarChart = ({ data = [] }) => {
    if (!data || data.length === 0) return null;

    const count = data.length;
    const padLeft = 24;
    const padRight = 16;
    const padBottom = 32;
    const padTop = 8;
    const barSpacing = 12;
    const barWidth = Math.max(20, Math.floor((Math.min(1000, count * 70) - padLeft - padRight - (count - 1) * barSpacing) / count));
    const svgWidth = padLeft + padRight + count * barWidth + (count - 1) * barSpacing;
    const svgHeight = 220;
    const max = Math.max(...data.map(d => d.amount), 1);

    return (
      <div className="w-full overflow-x-auto">
        <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} className="w-full h-56">
          <defs>
            <linearGradient id="monthlyGrad" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="#60a5fa" />
              <stop offset="100%" stopColor="#7c3aed" />
            </linearGradient>
          </defs>

          {/* grid lines */}
          {[0, 0.25, 0.5, 0.75, 1].map((t, i) => {
            const y = padTop + (svgHeight - padTop - padBottom) * t;
            return <line key={i} x1={padLeft} x2={svgWidth - padRight} y1={y} y2={y} stroke="#eef2ff" strokeWidth={1} />;
          })}

          {data.map((d, i) => {
            const x = padLeft + i * (barWidth + barSpacing);
            const barMaxHeight = svgHeight - padTop - padBottom;
            const h = Math.round((d.amount / max) * barMaxHeight);
            const y = svgHeight - padBottom - h;
            const monthLabel = (d.month || '').toString();
            const shortLabel = monthLabel.includes('-') ? monthLabel.split('-')[1] : monthLabel;
            return (
              <g key={d.month || i}>
                <rect
                  x={x}
                  y={y}
                  width={barWidth}
                  height={h}
                  rx={6}
                  fill="url(#monthlyGrad)"
                  tabIndex={0}
                  role="img"
                  aria-label={`${monthLabel}: ${formatCurrency(d.amount)}`}
                />
                <text x={x + barWidth / 2} y={svgHeight - 10} fontSize={11} fill="#6b7280" textAnchor="middle">{shortLabel}</text>
              </g>
            );
          })}
        </svg>
      </div>
    );
  };

  return (
    <div className="p-8">
      <div className="rounded-2xl bg-gradient-to-br from-green-600 to-emerald-500 p-6 text-white mb-6 shadow-lg">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center"><DocumentChartBarIcon className="h-8 w-8 mr-3"/>Reports</h1>
            <p className="text-green-100 mt-1">Generate and download reports for sales and orders.</p>
          </div>
          <div className="flex items-center space-x-3 bg-white/10 rounded-lg p-2">
            <CalendarIcon className="h-5 w-5 text-white/90" />
            <select value={timeRange} onChange={(e) => setTimeRange(e.target.value)} className="bg-transparent text-white outline-none">
              {timeRanges.map(r => (
                <option key={r.value} value={r.value} className="text-gray-900">{r.label}</option>
              ))}
              <option value="custom" className="text-gray-900">Custom...</option>
            </select>
            {timeRange === 'custom' && (
              <input type="number" min={1} max={365} value={customDays} onChange={(e) => setCustomDays(Math.max(1, Math.min(365, Number(e.target.value || 0))))} className="w-20 bg-white/20 rounded px-2 py-1 text-white" />
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div className="bg-white rounded-2xl p-6 shadow-lg">
          <h3 className="text-lg font-semibold mb-2">Total Orders</h3>
          {loading ? <LoadingSpinner /> : (
            <div>
              <div className="text-3xl font-bold">{analytics?.orderMetrics?.totalOrders ?? 0}</div>
              <div className="text-sm text-gray-500">Orders in selected range</div>
              {fetchError && (
                <div className="mt-3 text-sm text-red-600">{fetchError}
                  <button onClick={async () => {
                    setLoading(true); setFetchError(null);
                    // try admin summary fallback
                    const sum = await fetchAdminSummary();
                    if (sum) {
                      // if range is '30' use ordersLast30, else if 'all' use totalOrders
                      const val = timeRange === 'all' ? (sum.totalOrders ?? sum.ordersLast365 ?? 0) : (sum.ordersLast30 ?? sum.totalOrders ?? 0);
                      setAnalytics({ orderMetrics: { totalOrders: val, totalSpent: 0, averageOrderValue: 0 }, spendingPatterns: { monthlySpending: [], categorySpending: [] } });
                    }
                    setLoading(false);
                  }} className="ml-3 text-sm underline">Try fallback</button>
                </div>
              )}
            </div>
          )}
          <div className="mt-4 flex justify-end">
            <button onClick={exportAllOrdersCSV} className="inline-flex items-center px-3 py-1.5 bg-green-50 text-green-700 rounded-md text-sm hover:bg-green-100">
              <ArrowDownTrayIcon className="h-4 w-4 mr-2" />Export All Orders
            </button>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-lg">
          <h3 className="text-lg font-semibold mb-2">Total Spent</h3>
          {loading ? <LoadingSpinner /> : (
            <div>
              <div className="text-3xl font-bold">{formatCurrency(analytics?.orderMetrics?.totalSpent || 0)}</div>
              <div className="text-sm text-gray-500">Sum of order amounts in range</div>
            </div>
          )}
          <div className="mt-4 flex justify-end">
            <button onClick={() => exportCSV('sales')} className="inline-flex items-center px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-md text-sm hover:bg-emerald-100">
              <ArrowDownTrayIcon className="h-4 w-4 mr-2" />Export
            </button>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-lg">
          <h3 className="text-lg font-semibold mb-2">Avg Order Value</h3>
          {loading ? <LoadingSpinner /> : (
            <div>
              <div className="text-3xl font-bold">{formatCurrency(analytics?.orderMetrics?.averageOrderValue || 0)}</div>
              <div className="text-sm text-gray-500">Average order value in range</div>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl p-6 shadow-lg">
          <h3 className="text-lg font-semibold mb-4">Monthly Spending</h3>
          {loading ? <LoadingSpinner /> : (
            (analytics?.spendingPatterns?.monthlySpending?.length > 0) ? (
              <div className="space-y-4">
                {analytics.spendingPatterns.monthlySpending.map(m => (
                  <div key={m.month}>
                    <div className="flex justify-between mb-1">
                      <div className="text-sm text-gray-700">{m.month}</div>
                      <div className="text-sm font-semibold">{formatCurrency(m.amount)}</div>
                    </div>
                    <div className="bg-gray-100 rounded-full h-3 overflow-hidden">
                      <div className="bg-gradient-to-r from-blue-500 to-purple-600 h-3 rounded-full" style={{ width: `${Math.min(100, (m.amount / Math.max(...analytics.spendingPatterns.monthlySpending.map(x => x.amount))) * 100)}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
                <div className="text-gray-500">
                  <div className="py-8 text-center">
                    <div className="w-14 h-14 bg-gray-100 rounded-full mx-auto flex items-center justify-center mb-4">
                      <DocumentChartBarIcon className="h-6 w-6 text-gray-400" />
                    </div>
                    <div className="text-gray-700 font-medium mb-2">Nothing to show</div>
                    <div className="text-sm text-gray-500 mb-4">No monthly spending data available for the selected range.</div>
                    <div className="flex items-center justify-center space-x-2">
                      <button onClick={async () => {
                        setLoading(true);
                        try {
                          const resp = await apiService.getOrders({ limit: 2000 });
                          const orders = resp && resp.success ? resp.data : [];
                          const computed = computeSpendingFromOrders(orders, timeRange);
                          setAnalytics(prev => ({ ...(prev||{}), spendingPatterns: computed.spendingPatterns, orderMetrics: computed.orderMetrics }));
                        } catch (e) {
                          console.debug('compute spending failed', e?.message || e);
                        } finally { setLoading(false); }
                      }} className="px-3 py-1.5 bg-indigo-50 text-indigo-700 rounded-md text-sm">Compute from orders</button>
                      <button onClick={exportAllOrdersCSV} className="px-3 py-1.5 bg-green-50 text-green-700 rounded-md text-sm">Export orders</button>
                    </div>
                  </div>
                </div>
            )
          )}
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-lg">
          <h3 className="text-lg font-semibold mb-4">Spending by Category</h3>
          {loading ? <LoadingSpinner /> : (
            (analytics?.spendingPatterns?.categorySpending?.length > 0) ? (
              <div className="space-y-4">
                {analytics.spendingPatterns.categorySpending.map(cat => (
                  <div key={cat.category}>
                    <div className="flex justify-between mb-1">
                      <div className="text-sm text-gray-700">{cat.category}</div>
                      <div className="text-sm font-semibold">{formatCurrency(cat.amount)}</div>
                    </div>
                    <div className="bg-gray-100 rounded-full h-3 overflow-hidden">
                      <div className="bg-gradient-to-r from-green-500 to-teal-500 h-3 rounded-full" style={{ width: `${Math.min(100, (cat.amount / Math.max(...analytics.spendingPatterns.categorySpending.map(x => x.amount))) * 100)}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
                <div className="text-gray-500">
                  <div className="py-8 text-center">
                    <div className="w-14 h-14 bg-gray-100 rounded-full mx-auto flex items-center justify-center mb-4">
                      <DocumentChartBarIcon className="h-6 w-6 text-gray-400" />
                    </div>
                    <div className="text-gray-700 font-medium mb-2">Nothing to show</div>
                    <div className="text-sm text-gray-500 mb-4">No category spending data available for the selected range.</div>
                    <div className="flex items-center justify-center space-x-2">
                      <button onClick={async () => {
                        setLoading(true);
                        try {
                          const resp = await apiService.getOrders({ limit: 2000 });
                          const orders = resp && resp.success ? resp.data : [];
                          const computed = computeSpendingFromOrders(orders, timeRange);
                          setAnalytics(prev => ({ ...(prev||{}), spendingPatterns: computed.spendingPatterns, orderMetrics: computed.orderMetrics }));
                        } catch (e) {
                          console.debug('compute spending failed', e?.message || e);
                        } finally { setLoading(false); }
                      }} className="px-3 py-1.5 bg-indigo-50 text-indigo-700 rounded-md text-sm">Compute from orders</button>
                      <button onClick={exportAllOrdersCSV} className="px-3 py-1.5 bg-green-50 text-green-700 rounded-md text-sm">Export orders</button>
                    </div>
                  </div>
                </div>
            )
          )}
        </div>
      </div>

      {/* Sales Growth Chart */}
      <div className="mt-6 bg-white rounded-2xl p-6 shadow-lg">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Sales Growth</h3>
          <div className="flex items-center space-x-3">
            <select value={growthMode} onChange={async (e) => {
              const m = e.target.value;
              setGrowthMode(m);
              setLoading(true);
              try {
                const resp = await apiService.getOrders({ limit: 2000 });
                const ords = resp && resp.success ? resp.data : [];
                setGrowth(computeGrowthFromOrders(ords, m));
              } catch (err) {
                console.debug('Failed to recompute growth', err?.message || err);
              } finally { setLoading(false); }
            }} className="bg-gray-50 border border-gray-200 rounded px-3 py-1 text-sm">
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
            </select>
          </div>
        </div>

        {loading ? <LoadingSpinner /> : (
          growth ? (
            <div>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <div className="text-3xl font-bold">{growth.percentChange >= 0 ? '+' : ''}{growth.percentChange.toFixed(1)}%</div>
                  <div className="text-sm text-gray-500">{growth.mode === 'daily' ? 'Last 7 days vs previous 7 days' : growth.mode === 'weekly' ? 'Last 4 weeks vs previous 4 weeks' : 'Last 3 months vs previous 3 months'}</div>
                </div>
                <div className="text-right">
                  <div className="text-sm text-gray-500">Current</div>
                  <div className="text-lg font-semibold">{formatCurrency(growth.current || 0)}</div>
                  <div className="text-sm text-gray-400">Prev: {formatCurrency(growth.previous || 0)}</div>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-end space-x-2 h-24">
                  {growth.series.map((s, idx) => {
                    const max = Math.max(...growth.series.map(x => x.value), 1);
                    const h = Math.round((s.value / max) * 100);
                    return (
                      <div key={s.label} className="flex-1 flex flex-col items-center">
                        <div className={`w-full rounded-t ${s.value >= 0 ? 'bg-gradient-to-b from-green-400 to-emerald-500' : 'bg-gray-300'}`} style={{ height: `${Math.max(6, h)}%` }} />
                        <div className="text-xs text-gray-400 mt-1 truncate w-full text-center">{s.label}</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          ) : (
            <div className="text-gray-500">No sales growth data available for the selected range.</div>
          )
        )}
      </div>
    </div>
  );
}