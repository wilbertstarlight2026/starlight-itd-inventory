import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Package, Users, BarChart3,
  Settings, LogOut, Menu, X, QrCode,
} from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { api } from '../services/api';

const NAV_ITEMS = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard', exact: true },
  { to: '/inventory', icon: Package, label: 'Inventory' },
  { to: '/reports', icon: BarChart3, label: 'Reports' },
  { to: '/users', icon: Users, label: 'Users', adminOnly: true },
  { to: '/settings', icon: Settings, label: 'Settings', adminOnly: true },
];

export default function Layout() {
  const { user, refreshToken, clearAuth } = useAuthStore();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const isAdmin = user?.role === 'admin';

  async function handleLogout() {
    if (refreshToken) {
      await api.post('/auth/logout', { refresh_token: refreshToken }).catch(() => {});
    }
    clearAuth();
    navigate('/login');
  }

  return (
    <div className="flex h-screen bg-gray-100 overflow-hidden">
      {/* Sidebar */}
      <aside
        className={`bg-navy-900 text-white flex flex-col transition-all duration-200 ${
          sidebarOpen ? 'w-64' : 'w-16'
        }`}
      >
        {/* Logo */}
        <div className="flex items-center justify-between p-4 border-b border-navy-700">
          {sidebarOpen && (
            <div>
              <div className="font-bold text-lg leading-tight">STARLIGHT</div>
              <div className="text-xs text-blue-300">ITD Inventory</div>
            </div>
          )}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-1 rounded hover:bg-navy-700 transition-colors"
          >
            {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 py-4 space-y-1 px-2">
          {NAV_ITEMS.filter((item) => !item.adminOnly || isAdmin).map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.exact}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors text-sm ${
                  isActive
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-300 hover:bg-navy-700 hover:text-white'
                }`
              }
            >
              <item.icon size={20} className="shrink-0" />
              {sidebarOpen && <span>{item.label}</span>}
            </NavLink>
          ))}
        </nav>

        {/* User */}
        <div className="border-t border-navy-700 p-4">
          {sidebarOpen && (
            <div className="mb-3">
              <div className="text-sm font-medium truncate">{user?.name}</div>
              <div className="text-xs text-gray-400 uppercase">{user?.role}</div>
            </div>
          )}
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors text-sm w-full"
          >
            <LogOut size={18} />
            {sidebarOpen && 'Sign Out'}
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
}
