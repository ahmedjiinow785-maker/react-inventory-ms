import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import LoadingSpinner from './LoadingSpinner';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = () => {
  const { loading, isAuthenticated } = useAuth();
  const token = localStorage.getItem('token');

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#f8fafc] dark:bg-[#0f172a]">
        <LoadingSpinner />
      </div>
    );
  }

  if (!token) {
    return <Navigate to="/" replace />;
  }

  return isAuthenticated || token ? <Outlet /> : <Navigate to="/" replace />;
};

export default ProtectedRoute;
