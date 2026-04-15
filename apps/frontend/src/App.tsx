import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from '@/stores/auth.store'

import AccessPage from '@/pages/Access/AccessPage'
import AppLayout from '@/pages/App/AppLayout'

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const token = useAuthStore((s) => s.token)
  return token ? <>{children}</> : <Navigate to="/" replace />
}

export default function App() {
  const token = useAuthStore((s) => s.token)
  const hydrated = useAuthStore((s) => s.hydrated)

  if (!hydrated) {
    return (
      <div className="flex min-h-full items-center justify-center bg-[#000000] text-sm text-[#4B5563]">
        Loading Relay...
      </div>
    )
  }

  return (
    <Routes>
      <Route path="/" element={token ? <Navigate to="/app" replace /> : <AccessPage />} />
      <Route
        path="/app/*"
        element={
          <PrivateRoute>
            <AppLayout />
          </PrivateRoute>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
