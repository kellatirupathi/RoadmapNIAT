// client/src/pages/NotAuthorized.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import useAuth from '../hooks/useAuth';

const NotAuthorized = () => {
  const { user } = useAuth();
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow-lg text-center">
        <div className="flex justify-center">
          <div className="bg-red-100 rounded-full p-4">
            <svg className="h-16 w-16 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m0 0v2m0-2h2m-2 0H9m3-3a3 3 0 100-6 3 3 0 000 6z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21A7 7 0 0112 14a7 7 0 017 7z" />
            </svg>
          </div>
        </div>
        
        <div>
          <h2 className="mt-6 text-3xl font-bold text-gray-900">Access Denied</h2>
          <p className="mt-2 text-gray-600">
            You don't have permission to access this page.
          </p>
          
          {user && (
            <div className="mt-4 p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-700">
                You are currently logged in as:
              </p>
              <p className="font-medium text-gray-900">
                {user.displayName || user.username} ({user.role})
              </p>
            </div>
          )}
        </div>
        
        <div className="mt-6 flex flex-col space-y-4">
          <Link
            to="/"
            className="inline-flex items-center justify-center px-5 py-3 border border-transparent text-base font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700"
          >
            Return to Dashboard
          </Link>
          
          <Link
            to="/login"
            className="inline-flex items-center justify-center px-5 py-3 border border-gray-300 text-base font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
          >
            Sign in with a different account
          </Link>
        </div>
      </div>
    </div>
  );
};

export default NotAuthorized;