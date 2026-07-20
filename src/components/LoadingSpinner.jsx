import React from 'react';
import { ClipLoader } from 'react-spinners';

const LoadingSpinner = ({ size = 40, className = '' }) => {
  return (
    <div className={`flex items-center justify-center py-12 ${className}`}>
      <ClipLoader color="#3b82f6" size={size} />
    </div>
  );
};

export default LoadingSpinner;
