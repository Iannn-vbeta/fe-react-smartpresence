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
import LaporanRapat from '../pages/laporan/LaporanRapat';
import LaporanDetail from '../pages/laporan/LaporanDetail';

/* ─── Role constants ─── */
const ROLE_SUPER_ADMIN = 1;
// const ROLE_ADMIN = 2;
const ROLE_SEKRETARIS = 3;

function ProtectedRoute() {
  const { isAuthenticated } = useAuthStore();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <Outlet />;
}

function RoleProtectedRoute({ allowedRoles }: { allowedRoles: number[] }) {
  const { user } = useAuthStore();
  if (!user || !allowedRoles.includes(user.role_id)) return <Navigate to="/dashboard" replace />;
  return <Outlet />;
}

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route element={<ProtectedRoute />}>
        <Route element={<DashboardLayout />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/meetings" element={<MeetingManagement />} />
          <Route path="/meetings/create" element={<MeetingForm />} />
          <Route path="/meetings/:id" element={<MeetingDetail />} />
          <Route path="/meetings/:id/edit" element={<MeetingForm />} />

          {/* Laporan – SuperAdmin + Sekretaris */}
          <Route element={<RoleProtectedRoute allowedRoles={[ROLE_SUPER_ADMIN, ROLE_SEKRETARIS]} />}>
            <Route path="/laporan" element={<LaporanRapat />} />
            <Route path="/laporan/:id" element={<LaporanDetail />} />
          </Route>

          {/* SuperAdmin only */}
          <Route element={<RoleProtectedRoute allowedRoles={[ROLE_SUPER_ADMIN]} />}>
            <Route path="/employees" element={<EmployeeManagement />} />
            <Route path="/rooms" element={<RoomManagement />} />
            <Route path="/users" element={<UserManagement />} />
            <Route path="/work-units" element={<WorkUnitManagement />} />
          </Route>
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

