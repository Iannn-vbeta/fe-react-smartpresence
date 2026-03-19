import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import './DashboardLayout.css';

export default function DashboardLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className={`dashboard-layout${collapsed ? ' sidebar-collapsed' : ''}`}>
      <Sidebar
        collapsed={collapsed}
        mobileOpen={mobileOpen}
        onToggleCollapse={() => setCollapsed((prev) => !prev)}
        onToggleMobile={() => setMobileOpen((prev) => !prev)}
      />
      <main className="dashboard-layout-content">
        <Outlet />
      </main>
    </div>
  );
}
