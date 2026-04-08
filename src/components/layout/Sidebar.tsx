import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { authService } from '../../services/authService';
import './Sidebar.css';

const menuItems = [
  {
    label: 'Beranda',
    path: '/dashboard',
    icon: (
      <svg viewBox="0 0 24 24"><path d="M3 13h1v7c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2v-7h1a1 1 0 0 0 .7-1.7l-9-9a1 1 0 0 0-1.4 0l-9 9A1 1 0 0 0 3 13zm7 7v-5h4v5h-4zm2-15.6 7 7V20h-3v-5c0-1.1-.9-2-2-2h-4c-1.1 0-2 .9-2 2v5H5v-8.6l7-7z"/></svg>
    ),
  },
  {
    label: 'Jadwal Rapat',
    path: '/meetings',
    icon: (
      <svg viewBox="0 0 24 24"><path d="M19 4h-1V2h-2v2H8V2H6v2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V10h14v10zm0-12H5V6h14v2z"/></svg>
    ),
  },
  {
    label: 'Karyawan',
    path: '/employees',
    icon: (
      <svg viewBox="0 0 24 24"><path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/></svg>
    ),
  },
  {
    label: 'Ruang Rapat',
    path: '/rooms',
    icon: (
      <svg viewBox="0 0 24 24"><path d="M12 7V3H2v18h20V7H12zM6 19H4v-2h2v2zm0-4H4v-2h2v2zm0-4H4V9h2v2zm0-4H4V5h2v2zm4 12H8v-2h2v2zm0-4H8v-2h2v2zm0-4H8V9h2v2zm0-4H8V5h2v2zm10 12h-8v-2h2v-2h-2v-2h2v-2h-2V9h8v10zm-2-8h-2v2h2v-2zm0 4h-2v2h2v-2z"/></svg>
    ),
  },
  {
    label: 'Pengguna',
    path: '/users',
    icon: (
      <svg viewBox="0 0 24 24"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>
    ),
  },
  {
    label: 'Laporan',
    path: '/reports',
    icon: (
      <svg viewBox="0 0 24 24"><path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM9 17H7v-7h2v7zm4 0h-2V7h2v10zm4 0h-2v-4h2v4z"/></svg>
    ),
  },
  {
    label: 'Unit Kerja',
    path: '/work-units',
    icon: (
      <svg viewBox="0 0 24 24"><path d="M19 3h-4.18C14.4 1.84 13.3 1 12 1c-1.3 0-2.4.84-2.82 2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 0c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zm2 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z"/></svg>
    ),
  },
];

interface SidebarProps {
  mobileOpen: boolean;
  onToggleMobile: () => void;
}

export default function Sidebar({ mobileOpen, onToggleMobile }: SidebarProps) {
  const { logout } = useAuthStore();
  const navigate = useNavigate();
  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await authService.logout();
    } catch {
      // ignore
    }
    logout();
    navigate('/login', { replace: true });
  };

  const sidebarClass = `sidebar${mobileOpen ? ' mobile-open' : ''}`;

  return (
    <>
      {/* Hamburger button – mobile only */}
      <button className="sidebar-hamburger" onClick={onToggleMobile} aria-label="Menu">
        <svg viewBox="0 0 24 24" fill="currentColor">
          <path d="M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z" />
        </svg>
      </button>

      {/* Overlay – mobile only */}
      <div
        className={`sidebar-overlay${mobileOpen ? ' visible' : ''}`}
        onClick={onToggleMobile}
      />

      {/* Sidebar */}
      <aside className={sidebarClass}>

        {/* Brand */}
        <div className="sidebar-brand">
          <div className="sidebar-brand-logo-svg">
            <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect width="40" height="40" rx="8" fill="#ffffff" fillOpacity="0.18"/>
              <path d="M26 12h-3.18C22.4 10.84 21.3 10 20 10c-1.3 0-2.4.84-2.82 2H14c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V14c0-1.1-.9-2-2-2zm-6 0c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zm1 14h-6v-2h6v2zm3-4H16v-2h8v2zm0-4H16v-2h8v2z" fill="white"/>
            </svg>
          </div>
          <div className="sidebar-brand-text">
            <h2>RS CITRA HUSADA</h2>
            <p>Smart Presence</p>
          </div>
        </div>

        {/* Nav links */}
        <nav className="sidebar-nav">
          {menuItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) => `sidebar-nav-item${isActive ? ' active' : ''}`}
              onClick={() => mobileOpen && onToggleMobile()}
            >
              <span className="sidebar-nav-icon">{item.icon}</span>
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        {/* Logout */}
        <div className="sidebar-footer">
          <button className="sidebar-logout-btn" onClick={handleLogout} disabled={loggingOut}>
            <span className="sidebar-nav-icon">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.58L17 17l5-5-5-5zM4 5h8V3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h8v-2H4V5z" />
              </svg>
            </span>
            <span>{loggingOut ? 'Keluar...' : 'Keluar'}</span>
          </button>
        </div>
      </aside>
    </>
  );
}
