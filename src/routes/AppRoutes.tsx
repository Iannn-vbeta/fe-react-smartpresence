import { Navigate, Outlet } from 'react-router-dom';
import { Routes, Route } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import Login from '../pages/auth/Login';
import DashboardLayout from '../components/layout/DashboardLayout';
import Dashboard from '../pages/dashboard/Dashboard';
import UserManagement from '../pages/users/UserManagement';
import RoomManagement from '../pages/rooms/RoomManagement';
import EmployeeManagement from '../pages/employees/EmployeeManagement';
import MeetingManagement from '../pages/meetings/MeetingManagement';
import MeetingForm from '../pages/meetings/MeetingForm';
import MeetingDetail from '../pages/meetings/MeetingDetail';
import WorkUnitManagement from '../pages/work-units/WorkUnitManagement';

function ProtectedRoute() {
  const { isAuthenticated } = useAuthStore();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route element={<ProtectedRoute />}>
        <Route element={<DashboardLayout />}>
          <Route path="/dashboard" element={<Dashboard />} />
          {/* Meetings */}
          <Route path="/meetings" element={<MeetingManagement />} />
          <Route path="/meetings/create" element={<MeetingForm />} />
          <Route path="/meetings/:id" element={<MeetingDetail />} />
          <Route path="/meetings/:id/edit" element={<MeetingForm />} />
          {/* Placeholder routes */}
          <Route path="/employees" element={<EmployeeManagement />} />
          <Route path="/rooms" element={<RoomManagement />} />
          <Route path="/users" element={<UserManagement />} />
          <Route path="/reports" element={<PlaceholderPage title="Laporan" />} />
          <Route path="/work-units" element={<WorkUnitManagement />} />
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

function PlaceholderPage({ title }: { title: string }) {
  return (
    <div style={{ padding: '1rem 0' }}>
      <h1 style={{ fontSize: '1.75rem', fontWeight: 700, color: '#0f172a', margin: 0 }}>{title}</h1>
      <p style={{ color: '#64748b', marginTop: '0.5rem' }}>Halaman ini sedang dalam pengembangan.</p>
    </div>
  );
}
