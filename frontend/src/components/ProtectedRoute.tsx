import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth, canScore } from '@/store/auth';

export function ProtectedRoute({ requireScorer = false }: { requireScorer?: boolean }) {
  const { user, accessToken } = useAuth();
  const location = useLocation();

  if (!accessToken || !user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  if (requireScorer && !canScore(user.role)) {
    return <Navigate to="/app" replace />;
  }
  return <Outlet />;
}
