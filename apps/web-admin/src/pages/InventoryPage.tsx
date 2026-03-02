import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Search, Plus, Filter } from 'lucide-react';
import { api } from '../services/api';
import { useAuthStore } from '../store/authStore';
import type { Item, PaginatedResponse } from '@starlight/shared';

const STATUS_BADGE: Record<string, string> = {
  available: 'bg-green-100 text-green-700',
  in_use: 'bg-blue-100 text-blue-700',
  under_repair: 'bg-orange-100 text-orange-700',
  reserved: 'bg-purple-100 text-purple-700',
  retired: 'bg-gray-100 text-gray-600',
  disposed: 'bg-red-100 text-red-700',
};

export default function InventoryPage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);

  const isAdminOrManager = user?.role === 'admin' || user?.role === 'manager';

  const { data, isLoading } = useQuery({
    queryKey: ['items', search, status, page],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: String(page),
        limit: '25',
        ...(search && { search }),
        ...(status && { status }),
      });
      const res = await api.get<PaginatedResponse<Item>>(`/items?${params}`);
      return res.data;
    },
  });

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Inventory</h1>
          <p className="text-gray-500 text-sm">
            {data?.meta?.total ?? 0} items total
          </p>
        </div>
        {isAdminOrManager && (
          <button
            onClick={() => navigate('/inventory/new')}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-white text-sm font-medium"
            style={{ backgroundColor: '#1E3A5F' }}
          >
            <Plus size={18} />
            Add Item
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
          <input
            type="text"
            placeholder="Search by name, code, serial..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <select
          value={status}
          onChange={(e) => { setStatus(e.target.value); setPage(1); }}
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">All Status</option>
          <option value="available">Available</option>
          <option value="in_use">In Use</option>
          <option value="under_repair">Under Repair</option>
          <option value="reserved">Reserved</option>
          <option value="retired">Retired</option>
          <option value="disposed">Disposed</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Item Code</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Name</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Category</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Brand / Model</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Status</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Assigned To</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-gray-400">Loading...</td>
                </tr>
              ) : data?.data?.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-gray-400">No items found</td>
                </tr>
              ) : (
                data?.data?.map((item) => (
                  <tr
                    key={item.id}
                    onClick={() => navigate(`/inventory/${item.id}`)}
                    className="border-b border-gray-50 hover:bg-blue-50 cursor-pointer transition-colors"
                  >
                    <td className="px-4 py-3 font-mono text-xs text-gray-600">{item.item_code}</td>
                    <td className="px-4 py-3 font-medium text-gray-900">{item.name}</td>
                    <td className="px-4 py-3 text-gray-500">{(item as unknown as { category_name?: string }).category_name ?? '—'}</td>
                    <td className="px-4 py-3 text-gray-500">
                      {[item.brand, item.model].filter(Boolean).join(' ') || '—'}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_BADGE[item.status]}`}>
                        {item.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-500">
                      {(item as unknown as { assigned_to_name?: string }).assigned_to_name ?? '—'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {data?.meta && data.meta.total_pages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
            <span className="text-xs text-gray-500">
              Page {data.meta.page} of {data.meta.total_pages}
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1 text-xs border rounded disabled:opacity-40 hover:bg-gray-50"
              >
                Previous
              </button>
              <button
                onClick={() => setPage((p) => Math.min(data.meta.total_pages, p + 1))}
                disabled={page === data.meta.total_pages}
                className="px-3 py-1 text-xs border rounded disabled:opacity-40 hover:bg-gray-50"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
