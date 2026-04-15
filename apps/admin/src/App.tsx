import { Navigate, Route, Routes } from 'react-router-dom'
import AdminAccessPage from '@/pages/Auth/AdminAccessPage'
import AdminDashboardPage from '@/pages/Dashboard/AdminDashboardPage'
import { useAdminAuthStore } from '@/stores/admin-auth.store'

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const token = useAdminAuthStore((state) => state.token)
  return token ? <>{children}</> : <Navigate to="/" replace />
}

export default function App() {
  const token = useAdminAuthStore((state) => state.token)

  return (
    <Routes>
      <Route
        path="/"
        element={token ? <Navigate to="/dashboard" replace /> : <AdminAccessPage />}
      />
      <Route
        path="/dashboard"
        element={
          <PrivateRoute>
            <AdminDashboardPage />
          </PrivateRoute>
        }
      />
      <Route path="*" element={<Navigate to={token ? '/dashboard' : '/'} replace />} />
    </Routes>
  )
}
