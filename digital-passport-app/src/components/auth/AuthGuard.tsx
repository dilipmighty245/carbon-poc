import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';

interface AuthGuardProps {
  children?: React.ReactNode;
}

export const AuthGuard: React.FC<AuthGuardProps> = ({ children }) => {
  const location = useLocation();
  const token = localStorage.getItem('saurient_auth_token');
  const userEmail = localStorage.getItem('saurient_user_email');

  const isAuthenticated = Boolean(
    token && 
    token !== 'undefined' && 
    token !== 'null' && 
    token.trim() !== '' &&
    userEmail && 
    userEmail.trim() !== ''
  );

  if (!isAuthenticated) {
    // Preserve the attempted path to redirect back after successful login
    const redirectParam = encodeURIComponent(location.pathname + location.search);
    return <Navigate to={`/login?redirect=${redirectParam}`} replace />;
  }

  return children ? <>{children}</> : <Outlet />;
};

export default AuthGuard;
