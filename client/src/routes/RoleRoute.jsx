import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import PageLoader from '../components/common/PageLoader';

/** Restricts nested routes to the given roles, e.g. <RoleRoute roles={['admin']} />. */
const RoleRoute = ({ roles }) => {
  const { user, isLoading } = useAuth();

  if (isLoading) return <PageLoader />;
  if (!user) return <Navigate to="/login" replace />;
  if (!roles.includes(user.role)) return <Navigate to="/unauthorized" replace />;

  return <Outlet />;
};

export default RoleRoute;
