import React from 'react';

const PageLoader = () => {
  return (
    <div className="absolute inset-0 flex items-center justify-center z-50 bg-white bg-opacity-80">
      <div className="flex flex-col items-center">
        <div className="relative">
          <div className="h-16 w-16 animate-spin rounded-full border-4 border-solid border-primary-400 border-t-transparent"></div>
          <div className="absolute top-0 left-0 h-16 w-16 animate-pulse rounded-full border-4 border-solid border-primary-400 opacity-20"></div>
        </div>
        <span className="mt-4 text-sm font-medium text-gray-700">Loading...</span>
      </div>
    </div>
  );
};

export default PageLoader;