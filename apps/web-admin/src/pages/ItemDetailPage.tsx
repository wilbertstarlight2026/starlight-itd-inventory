import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Edit, Trash2, QrCode } from 'lucide-react';
import { api } from '../services/api';
import { useAuthStore } from '../store/authStore';
import type { Item } from '@starlight/shared';

const STATUS_COLORS: Record<string, string> = {
  available: '#4CAF50', in_use: '#2196F3', under_repair: '#FF9800',
  reserved: '#9C27B0', retired: '#9E9E9E', disposed: '#F44336',
};

export default function ItemDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const isAdminOrManager = user?.role === 'admin' || user?.role === 'manager';

  const { data, isLoading } = useQuery({
    queryKey: ['item', id],
    queryFn: async () => {
      const res = await api.get<{ data: Item }>(`/items/${id}`);
      return res.data.data;
    },
  });

  async function handleDelete() {
    if (!confirm(`Delete "${data?.name}"?`)) return;
    await api.delete(`/items/${id}`);
    navigate('/inventory');
  }

  if (isLoading) return <div className="p-6 text-gray-400">Loading...</div>;
  if (!data) return <div className="p-6 text-gray-400">Item not found</div>;

  const color = STATUS_COLORS[data.status] || '#9E9E9E';

  return (
    <div className="p-6 space-y-6 max-w-3xl">
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-gray-500 hover:text-gray-800 transition-colors"
        >
          <ArrowLeft size={18} /> Back
        </button>

        {isAdminOrManager && (
          <div className="flex gap-2">
            <button
              onClick={handleDelete}
              className="flex items-center gap-1 px-3 py-1.5 text-red-600 border border-red-200 rounded-lg hover:bg-red-50 text-sm"
            >
              <Trash2 size={16} /> Delete
            </button>
          </div>
        )}
      </div>

      {/* Header */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900">{data.name}</h1>
            <p className="font-mono text-sm text-gray-500 mt-1">{data.item_code}</p>
          </div>
          <span
            className="px-3 py-1 rounded-full text-sm font-semibold text-white"
            style={{ backgroundColor: color }}
          >
            {data.status.replace('_', ' ')}
          </span>
        </div>
      </div>

      {/* Details */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <h2 className="font-semibold text-gray-700 mb-4">Details</h2>
        <dl className="grid grid-cols-2 gap-x-8 gap-y-4">
          {[
            ['Brand', data.brand],
            ['Model', data.model],
            ['Serial Number', data.serial_number],
            ['Barcode', data.barcode],
            ['Condition', data.condition],
            ['Category', (data as unknown as { category_name?: string }).category_name],
            ['Purchase Date', data.purchase_date],
            ['Purchase Price', data.purchase_price ? `₱${Number(data.purchase_price).toLocaleString()}` : null],
            ['Warranty Expiry', data.warranty_expiry],
          ].map(([label, value]) => (
            value ? (
              <div key={String(label)}>
                <dt className="text-xs text-gray-500">{label}</dt>
                <dd className="text-sm font-medium text-gray-800 mt-0.5">{String(value)}</dd>
              </div>
            ) : null
          ))}
        </dl>
        {data.notes && (
          <div className="mt-4 pt-4 border-t border-gray-100">
            <dt className="text-xs text-gray-500">Notes</dt>
            <dd className="text-sm text-gray-700 mt-1">{data.notes}</dd>
          </div>
        )}
      </div>

      {/* QR Code section */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <h2 className="font-semibold text-gray-700 mb-2 flex items-center gap-2">
          <QrCode size={18} /> QR Code
        </h2>
        <p className="text-sm text-gray-500">
          Barcode value: <code className="bg-gray-100 px-2 py-0.5 rounded font-mono text-sm">{data.barcode || data.item_code}</code>
        </p>
        <p className="text-sm text-gray-400 mt-1">
          Scan this item using the mobile app to view or assign it.
        </p>
      </div>
    </div>
  );
}
