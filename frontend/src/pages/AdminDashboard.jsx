import React, { useEffect, useState } from 'react';
import { UsersIcon, CubeIcon, ShoppingCartIcon } from '@heroicons/react/24/outline';
import apiService from '../services/apiService';
import LoadingSpinner from '../components/common/LoadingSpinner';

const StatCard = ({ title, subtitle, icon: Icon, count, loading, onClick, gradient }) => {
  const isColored = Boolean(gradient);
  return (
    <div
      onClick={onClick}
      className={`rounded-lg p-4 flex flex-col justify-between hover:shadow-lg transition-shadow ${isColored ? gradient : 'bg-white dark:bg-slate-800'}`}
    >
      <div className="flex items-start justify-between">
        <div>
          <h3 className={`text-lg font-medium ${isColored ? 'text-white' : ''}`}>{title}</h3>
          <p className={`text-sm mt-1 ${isColored ? 'text-white/90' : 'text-gray-500 dark:text-gray-400'}`}>{subtitle}</p>
        </div>
        <div className="ml-4 flex items-center">
          <div className={`rounded-md p-2 ${isColored ? 'bg-white/20 text-white' : 'bg-qwipo-primary/10 text-qwipo-primary'}`}>
            <Icon className="h-6 w-6" />
          </div>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between">
        <div className="flex items-baseline space-x-2">
          {loading ? (
            <div className="h-8 w-24 flex items-center"><LoadingSpinner /></div>
          ) : (
            <div className={`text-2xl font-bold ${isColored ? 'text-white' : 'text-gray-900 dark:text-white'}`}>{count}</div>
          )}
          <div className={`${isColored ? 'text-white/80' : 'text-sm text-gray-500'}`}>total</div>
        </div>

        <button
          onClick={(e) => { e.stopPropagation(); if (onClick) onClick(); }}
          className={`text-sm hover:underline ${isColored ? 'text-white/90' : 'text-qwipo-primary'}`}
        >
          View
        </button>
      </div>
    </div>
  );
};

const AdminDashboard = () => {
  const [counts, setCounts] = useState({ users: 0, products: 0, orders: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [usersRes, productsRes, ordersRes] = await Promise.allSettled([
          apiService.getAdminUsers(),
          apiService.getProducts({ limit: 1 }),
          apiService.getOrders({ limit: 1 }),
        ]);

        const extractTotal = (r) => {
          if (!r) return 0;
          // If wrapped by { success, data }
          const body = r?.data ?? r;

          // Common pagination/total fields
          if (typeof body.total === 'number') return body.total;
          if (body.pagination && typeof body.pagination.total === 'number') return body.pagination.total;
          if (body.meta && typeof body.meta.total === 'number') return body.meta.total;
          if (body.data && typeof body.data.total === 'number') return body.data.total;

          // If actual list returned, return its length
          if (Array.isArray(body)) return body.length;
          if (Array.isArray(body.users)) return body.users.length;
          if (Array.isArray(body.data)) return body.data.length;

          return 0;
        };

        const usersCount = extractTotal(usersRes.status === 'fulfilled' ? usersRes.value : null);

        const productsCount = extractTotal(productsRes.status === 'fulfilled' ? productsRes.value : null);

        const ordersCount = extractTotal(ordersRes.status === 'fulfilled' ? ordersRes.value : null);

        setCounts({ users: usersCount, products: productsCount, orders: ordersCount });
      } catch (err) {
        console.error('Failed to load admin dashboard counts', err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold mb-6">Admin Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard
          title="Users"
          subtitle="Manage users, roles and permissions"
          icon={UsersIcon}
          count={counts.users}
          loading={loading}
          gradient="bg-gradient-to-r from-indigo-500 to-purple-600"
          onClick={() => window.location.href = '/dashboard/admin/users'}
        />

        <StatCard
          title="Products"
          subtitle="Quick links to product management and bulk updates"
          icon={CubeIcon}
          count={counts.products}
          loading={loading}
          gradient="bg-gradient-to-r from-emerald-400 to-teal-500"
          onClick={() => window.location.href = '/dashboard/products'}
        />

        <StatCard
          title="Orders"
          subtitle="View and manage recent orders and refunds"
          icon={ShoppingCartIcon}
          count={counts.orders}
          loading={loading}
          gradient="bg-gradient-to-r from-rose-500 to-orange-400"
          onClick={() => window.location.href = '/dashboard/orders'}
        />
      </div>

      <div className="mt-6 text-sm text-gray-600 dark:text-gray-400">This admin surface gives quick access to common management pages. Add charts or widgets here for deeper insights.</div>
    </div>
  );
};

export default AdminDashboard;
