import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function ProtectedRoute({ children, redirectTo = '/' }) {
  const { isAuthed } = useAuth();
  const location = useLocation();

  if (!isAuthed) {
    return <Navigate to={redirectTo} state={{ authRequired: true, from: location.pathname }} replace />;
  }
  return children;
}
