import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Package, CheckCircle, Clock, Wrench, BarChart3 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { api } from '../services/api';
import type { DashboardSummary } from '@starlight/shared';

async function fetchDashboard(): Promise<DashboardSummary> {
  const res = await api.get<{ data: DashboardSummary }>('/reports/dashboard');
  return res.data.data;
}

const STAT_CARDS = [
  { key: 'total_items', label: 'Total Items', icon: Package, color: '#1E3A5F', bg: '#E8EEF4' },
  { key: 'available', label: 'Available', icon: CheckCircle, color: '#4CAF50', bg: '#E8F5E9' },
  { key: 'in_use', label: 'In Use', icon: Clock, color: '#2196F3', bg: '#E3F2FD' },
  { key: 'under_repair', label: 'Under Repair', icon: Wrench, color: '#FF9800', bg: '#FFF3E0' },
] as const;

export default function DashboardPage() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['dashboard'],
    queryFn: fetchDashboard,
    refetchInterval: 60_000,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-gray-500">Loading dashboard...</div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-red-500">Failed to load dashboard. Check your connection.</div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500 text-sm mt-1">Starlight ITD Inventory Overview</p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {STAT_CARDS.map(({ key, label, icon: Icon, color, bg }) => (
          <div key={key} className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-gray-500">{label}</span>
              <div className="p-2 rounded-lg" style={{ backgroundColor: bg }}>
                <Icon size={20} style={{ color }} />
              </div>
            </div>
            <div className="text-3xl font-bold" style={{ color }}>
              {data[key as keyof typeof data] as number}
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category Chart */}
        {data.by_category && data.by_category.length > 0 && (
          <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
            <h2 className="text-base font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <BarChart3 size={18} />
              Items by Category
            </h2>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={data.by_category}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="category" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="count" fill="#1E3A5F" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Recent Activity */}
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <h2 className="text-base font-semibold text-gray-800 mb-4">Recent Activity</h2>
          <div className="space-y-3">
            {data.recent_activity?.slice(0, 8).map((log) => (
              <div key={log.id} className="flex items-start gap-3 text-sm">
                <div className="w-2 h-2 rounded-full bg-blue-500 mt-1.5 shrink-0" />
                <div>
                  <span className="font-medium capitalize">{log.action}</span>
                  <span className="text-gray-400"> — {log.entity_type}</span>
                  {(log as unknown as { performed_by_name?: string }).performed_by_name && (
                    <span className="text-gray-400"> by {(log as unknown as { performed_by_name: string }).performed_by_name}</span>
                  )}
                  <div className="text-gray-400 text-xs">
                    {new Date(log.performed_at).toLocaleString()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
