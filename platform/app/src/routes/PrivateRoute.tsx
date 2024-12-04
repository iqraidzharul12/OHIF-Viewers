import React from 'react';
import useIsAuthenticated from 'react-auth-kit/hooks/useIsAuthenticated'
import { Navigate } from 'react-router-dom';

export const PrivateRoute = ({ children }) => {
  const isAuthenticated = useIsAuthenticated()

  if(!isAuthenticated){
    return <Navigate to="/login" />
  }

  return children;
};

export default PrivateRoute;
