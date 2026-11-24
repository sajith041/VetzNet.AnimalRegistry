import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();

  // While restoring auth state from localStorage, show nothing
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-slate-400">
        Loading...
      </div>
    );
  }

  if (!isAuthenticated) {
    // Redirect to login, saving where the user came from
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
}