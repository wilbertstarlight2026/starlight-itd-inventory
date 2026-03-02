import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, Trash2 } from 'lucide-react';
import { api } from '../services/api';
import type { Department, Location, Category } from '@starlight/shared';

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<'departments' | 'locations' | 'categories'>('departments');

  return (
    <div className="p-6 space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-500 text-sm">Manage reference data</p>
      </div>

      <div className="flex gap-2 border-b border-gray-200">
        {(['departments', 'locations', 'categories'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors capitalize ${
              activeTab === tab
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-800'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {activeTab === 'departments' && <DepartmentsPanel />}
      {activeTab === 'locations' && <LocationsPanel />}
      {activeTab === 'categories' && <CategoriesPanel />}
    </div>
  );
}

function DepartmentsPanel() {
  const qc = useQueryClient();
  const [name, setName] = useState('');
  const [saving, setSaving] = useState(false);

  const { data } = useQuery({
    queryKey: ['departments'],
    queryFn: async () => (await api.get<{ data: Department[] }>('/departments')).data.data,
  });

  async function add() {
    if (!name.trim()) return;
    setSaving(true);
    await api.post('/departments', { name: name.trim() });
    await qc.invalidateQueries({ queryKey: ['departments'] });
    setName('');
    setSaving(false);
  }

  async function remove(id: string) {
    if (!confirm('Delete this department?')) return;
    await api.delete(`/departments/${id}`);
    await qc.invalidateQueries({ queryKey: ['departments'] });
  }

  return <RefList items={data ?? []} name={name} setName={setName} onAdd={add} onDelete={remove} saving={saving} label="Department" />;
}

function LocationsPanel() {
  const qc = useQueryClient();
  const [name, setName] = useState('');
  const [building, setBuilding] = useState('');
  const [room, setRoom] = useState('');
  const [saving, setSaving] = useState(false);

  const { data } = useQuery({
    queryKey: ['locations'],
    queryFn: async () => (await api.get<{ data: Location[] }>('/locations')).data.data,
  });

  async function add() {
    if (!name.trim()) return;
    setSaving(true);
    await api.post('/locations', { name: name.trim(), building: building.trim() || undefined, room: room.trim() || undefined });
    await qc.invalidateQueries({ queryKey: ['locations'] });
    setName(''); setBuilding(''); setRoom('');
    setSaving(false);
  }

  async function remove(id: string) {
    if (!confirm('Delete this location?')) return;
    await api.delete(`/locations/${id}`);
    await qc.invalidateQueries({ queryKey: ['locations'] });
  }

  return (
    <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm space-y-4">
      <h3 className="font-semibold text-gray-700">Locations</h3>
      <div className="flex gap-2 flex-wrap">
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Location name *" className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 flex-1 min-w-32" />
        <input value={building} onChange={(e) => setBuilding(e.target.value)} placeholder="Building" className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 flex-1 min-w-24" />
        <input value={room} onChange={(e) => setRoom(e.target.value)} placeholder="Room" className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 flex-1 min-w-24" />
        <button onClick={add} disabled={saving || !name.trim()} className="flex items-center gap-1 px-4 py-2 text-sm text-white rounded-lg disabled:opacity-50" style={{ backgroundColor: '#1E3A5F' }}>
          <Plus size={16} /> Add
        </button>
      </div>
      <div className="divide-y divide-gray-100">
        {data?.map((item) => (
          <div key={item.id} className="flex items-center justify-between py-2.5">
            <div>
              <span className="font-medium text-gray-800">{item.name}</span>
              {item.building && <span className="text-xs text-gray-500 ml-2">{item.building} {item.room}</span>}
            </div>
            <button onClick={() => remove(item.id)} className="text-gray-400 hover:text-red-500 transition-colors"><Trash2 size={15} /></button>
          </div>
        ))}
      </div>
    </div>
  );
}

function CategoriesPanel() {
  const qc = useQueryClient();
  const [name, setName] = useState('');
  const [saving, setSaving] = useState(false);

  const { data } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => (await api.get<{ data: Category[] }>('/categories')).data.data,
  });

  async function add() {
    if (!name.trim()) return;
    setSaving(true);
    await api.post('/categories', { name: name.trim() });
    await qc.invalidateQueries({ queryKey: ['categories'] });
    setName('');
    setSaving(false);
  }

  async function remove(id: string) {
    if (!confirm('Delete this category?')) return;
    await api.delete(`/categories/${id}`);
    await qc.invalidateQueries({ queryKey: ['categories'] });
  }

  return <RefList items={data ?? []} name={name} setName={setName} onAdd={add} onDelete={remove} saving={saving} label="Category" />;
}

function RefList({
  items, name, setName, onAdd, onDelete, saving, label,
}: {
  items: { id: string; name: string }[];
  name: string;
  setName: (v: string) => void;
  onAdd: () => void;
  onDelete: (id: string) => void;
  saving: boolean;
  label: string;
}) {
  return (
    <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm space-y-4">
      <h3 className="font-semibold text-gray-700">{label}s</h3>
      <div className="flex gap-2">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && onAdd()}
          placeholder={`${label} name`}
          className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          onClick={onAdd}
          disabled={saving || !name.trim()}
          className="flex items-center gap-1 px-4 py-2 text-sm text-white rounded-lg disabled:opacity-50"
          style={{ backgroundColor: '#1E3A5F' }}
        >
          <Plus size={16} /> Add
        </button>
      </div>
      <div className="divide-y divide-gray-100">
        {items.map((item) => (
          <div key={item.id} className="flex items-center justify-between py-2.5">
            <span className="text-gray-800">{item.name}</span>
            <button onClick={() => onDelete(item.id)} className="text-gray-400 hover:text-red-500 transition-colors">
              <Trash2 size={15} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
