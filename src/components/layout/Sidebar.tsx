import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { authService } from '../../services/authService';
import { useTheme } from '../../hooks/useTheme';
import './Sidebar.css';

/* ─── Role constants ─── */
const ROLE_SUPER_ADMIN = 1;
const ROLE_ADMIN = 2;
const ROLE_SEKRETARIS = 3;

/*
 * Each menu item can have a `roles` array.
 * – If `roles` is undefined, the item is visible to ALL authenticated users.
 * – If `roles` is set, only users whose role_id is in the array can see it.
 */
interface MenuItem {
  label: string;
  path: string;
  icon: JSX.Element;
  roles?: number[]; // undefined = visible to all
}

const menuItems: MenuItem[] = [
  {
    label: 'Beranda',
    path: '/dashboard',
    icon: (
      <svg viewBox="0 0 24 24"><path d="M3 13h1v7c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2v-7h1a1 1 0 0 0 .7-1.7l-9-9a1 1 0 0 0-1.4 0l-9 9A1 1 0 0 0 3 13zm7 7v-5h4v5h-4zm2-15.6 7 7V20h-3v-5c0-1.1-.9-2-2-2h-4c-1.1 0-2 .9-2 2v5H5v-8.6l7-7z"/></svg>
    ),
    // visible to all roles
  },
  {
    label: 'Jadwal Rapat',
    path: '/meetings',
    icon: (
      <svg viewBox="0 0 24 24"><path d="M19 4h-1V2h-2v2H8V2H6v2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V10h14v10zm0-12H5V6h14v2z"/></svg>
    ),
    // visible to all roles
  },
  {
    label: 'Karyawan',
    path: '/employees',
    icon: (
      <svg viewBox="0 0 24 24"><path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/></svg>
    ),
    roles: [ROLE_SUPER_ADMIN],
  },
  {
    label: 'Ruang Rapat',
    path: '/rooms',
    icon: (
      <svg viewBox="0 0 24 24"><path d="M12 7V3H2v18h20V7H12zM6 19H4v-2h2v2zm0-4H4v-2h2v2zm0-4H4V9h2v2zm0-4H4V5h2v2zm4 12H8v-2h2v2zm0-4H8v-2h2v2zm0-4H8V9h2v2zm0-4H8V5h2v2zm10 12h-8v-2h2v-2h-2v-2h2v-2h-2V9h8v10zm-2-8h-2v2h2v-2zm0 4h-2v2h2v-2z"/></svg>
    ),
    roles: [ROLE_SUPER_ADMIN],
  },
  {
    label: 'Pengguna',
    path: '/users',
    icon: (
      <svg viewBox="0 0 24 24"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>
    ),
    roles: [ROLE_SUPER_ADMIN],
  },
  {
    label: 'Laporan',
    path: '/laporan',
    icon: (
      <svg viewBox="0 0 24 24"><path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM9 17H7v-7h2v7zm4 0h-2V7h2v10zm4 0h-2v-4h2v4z"/></svg>
    ),
    roles: [ROLE_SUPER_ADMIN, ROLE_SEKRETARIS],
  },
  {
    label: 'Unit Kerja',
    path: '/work-units',
    icon: (
      <svg viewBox="0 0 24 24"><path d="M3 3h18v5H3V3zm0 7h5v11H3V10zm7 0h5v11h-5V10zm7 0h5v11h-5V10z"/></svg>
    ),
    roles: [ROLE_SUPER_ADMIN],
  },
];

interface SidebarProps {
  mobileOpen: boolean;
  onToggleMobile: () => void;
}

export default function Sidebar({ mobileOpen, onToggleMobile }: SidebarProps) {
  const { logout, user } = useAuthStore();
  const navigate = useNavigate();
  const [loggingOut, setLoggingOut] = useState(false);
  const { isDark, toggleTheme } = useTheme();

  const userRoleId = user?.role_id;

  // Filter menu items based on user's role
  const visibleMenuItems = menuItems.filter((item) => {
    if (!item.roles) return true; // no restriction → visible to all
    return userRoleId !== undefined && item.roles.includes(userRoleId);
  });

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
          {visibleMenuItems.map((item) => (
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

        {/* Footer actions: Theme Toggle + Logout */}
        <div className="sidebar-footer">
          <div className="theme-toggle-container">
            <span className="theme-label">Mode Gelap</span>
            <button 
              className={`theme-toggle-btn ${isDark ? 'dark' : ''}`} 
              onClick={toggleTheme}
              aria-label="Toggle Dark Mode"
            >
              <div className="theme-toggle-thumb">
                {isDark ? (
                  <svg viewBox="0 0 24 24" fill="currentColor" className="moon-icon">
                    <path d="M12 3a9 9 0 1 0 9 9c0-.46-.04-.92-.1-1.36a5.389 5.389 0 0 1-4.4 2.26 5.403 5.403 0 0 1-3.14-9.8c-.44-.06-.9-.1-1.36-.1z"/>
                  </svg>
                ) : (
                  <svg viewBox="0 0 24 24" fill="currentColor" className="sun-icon">
                    <path d="M12 7c-2.76 0-5 2.24-5 5s2.24 5 5 5 5-2.24 5-5-2.24-5-5-5zM2 13h2c.55 0 1-.45 1-1s-.45-1-1-1H2c-.55 0-1 .45-1 1s.45 1 1 1zm18 0h2c.55 0 1-.45 1-1s-.45-1-1-1h-2c-.55 0-1 .45-1 1s.45 1 1 1zM11 2v2c0 .55.45 1 1 1s1-.45 1-1V2c0-.55-.45-1-1-1s-1 .45-1 1zm0 18v2c0 .55.45 1 1 1s1-.45 1-1v-2c0-.55-.45-1-1-1s-1 .45-1 1zM5.99 4.58a.996.996 0 0 0-1.41 0 .996.996 0 0 0 0 1.41l1.06 1.06c.39.39 1.03.39 1.41 0s.39-1.03 0-1.41L5.99 4.58zm12.37 12.37a.996.996 0 0 0-1.41 0 .996.996 0 0 0 0 1.41l1.06 1.06c.39.39 1.03.39 1.41 0a.996.996 0 0 0 0-1.41l-1.06-1.06zm1.06-10.96a.996.996 0 0 0 0-1.41.996.996 0 0 0-1.41 0l-1.06 1.06c-.39.39-.39 1.03 0 1.41s1.03.39 1.41 0l1.06-1.06zM7.05 18.36a.996.996 0 0 0 0-1.41.996.996 0 0 0-1.41 0l-1.06 1.06c-.39.39-.39 1.03 0 1.41s1.03.39 1.41 0l1.06-1.06z"/>
                  </svg>
                )}
              </div>
            </button>
          </div>

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
