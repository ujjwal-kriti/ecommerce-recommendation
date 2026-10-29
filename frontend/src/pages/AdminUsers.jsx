import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import apiService from '../services/apiService';
import LoadingSpinner from '../components/common/LoadingSpinner';

const formatDate = (iso) => {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleDateString();
  } catch (e) {
    return iso;
  }
};

const AdminUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [promoting, setPromoting] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true);
        const res = await apiService.getAdminUsers();
        // support several response shapes
        if (Array.isArray(res)) {
          setUsers(res);
        } else if (res?.success && Array.isArray(res.data)) {
          setUsers(res.data);
        } else if (res?.data && Array.isArray(res.data.users)) {
          setUsers(res.data.users);
        } else if (res?.users && Array.isArray(res.users)) {
          setUsers(res.users);
        } else if (res?.data && Array.isArray(res.data)) {
          setUsers(res.data);
        } else {
          // fallback: try to coerce whatever was returned
          setUsers(res || []);
        }
      } catch (err) {
        console.error('Failed to load users', err);
        toast.error('Failed to load users');
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return users;
    return users.filter(u => {
      return (
        (u.name || '').toLowerCase().includes(q) ||
        (u.email || '').toLowerCase().includes(q) ||
        (u.role || '').toLowerCase().includes(q)
      );
    });
  }, [users, query]);

  const promote = async (user) => {
    if (!window.confirm(`Promote ${user.name || user.email} to admin?`)) return;
    try {
      setPromoting(user._id || user.id);
      // call backend dev endpoint - use apiService.post for direct call
      await apiService.post('/auth/promote-to-admin', { email: user.email });
      toast.success(`${user.name || user.email} is now an admin`);
      // refresh list
      const res = await apiService.getAdminUsers();
      if (Array.isArray(res)) setUsers(res);
      else if (res?.success && Array.isArray(res.data)) setUsers(res.data);
    } catch (err) {
      console.error(err);
      toast.error('Failed to promote user');
    } finally {
      setPromoting(null);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-semibold">Users</h2>
          <p className="text-sm text-gray-500">Manage users, roles and recent activity</p>
        </div>

        <div className="flex items-center space-x-3">
          <div className="relative">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search name, email or role..."
              className="w-64 px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-qwipo-primary"
            />
            {query && (
              <button
                onClick={() => setQuery('')}
                className="absolute right-1 top-1/2 -translate-y-1/2 text-sm text-gray-500 hover:text-gray-700 px-2"
                aria-label="Clear search"
              >
                ✕
              </button>
            )}
          </div>

          <button
            onClick={() => navigate('/dashboard/admin/users/new')}
            className="btn-primary px-4 py-2 rounded-md shadow-sm"
          >
            Invite User
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center p-8"><LoadingSpinner /></div>
      ) : (
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-4">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px] table-auto">
              <thead>
                <tr className="text-left text-sm text-gray-500">
                  <th className="py-3 pl-3">Name</th>
                  <th className="py-3">Email</th>
                  <th className="py-3">Role</th>
                  <th className="py-3">Created</th>
                  <th className="py-3">Recent Product</th>
                  <th className="py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr><td colSpan={6} className="py-8 text-center text-gray-500">No users found</td></tr>
                ) : filtered.map(u => (
                  <tr key={u._id || u.id || u.email} className="border-t hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors">
                    <td className="py-4 pl-3 flex items-center">
                      <div className="w-10 h-10 rounded-full bg-qwipo-primary text-white flex items-center justify-center mr-3 font-medium">
                        {(u.name || u.email || 'U').charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">{u.name || '—'}</div>
                        <div className="text-xs text-gray-500">{u.businessType || ''}</div>
                      </div>
                    </td>
                    <td className="py-4">{u.email}</td>
                    <td className="py-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${u.role === 'admin' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-700'}`}>
                        {u.role || 'user'}
                      </span>
                    </td>
                    <td className="py-4">{formatDate(u.createdAt || u.created_at)}</td>
                    <td className="py-4">{u.recentProductBought || '—'}</td>
                    <td className="py-4">
                      <div className="flex items-center space-x-2">
                        {u.role !== 'admin' && (
                          <button
                            onClick={() => promote(u)}
                            disabled={promoting === (u._id || u.id)}
                            className="px-3 py-1 text-sm bg-qwipo-primary text-white rounded-md hover:opacity-90 disabled:opacity-50"
                          >
                            {promoting === (u._id || u.id) ? 'Promoting...' : 'Promote'}
                          </button>
                        )}
                        <button
                          onClick={() => navigate(`/dashboard/admin/users/${u._id || u.id || encodeURIComponent(u.email)}`)}
                          className="px-3 py-1 text-sm border rounded-md text-gray-700 hover:bg-gray-50"
                        >
                          View
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminUsers;
