// client/src/components/Layout/TopBar.jsx
import React from 'react';
import { useLocation } from 'react-router-dom';
import useAuth from '../../hooks/useAuth';
import NotificationIcon from './NotificationIcon'; // Assuming NotificationIcon is in the same folder

const TopBar = ({ pageTitle, toggleSidebar }) => {
  const { user } = useAuth();
  const location = useLocation();

  const getPageTitle = () => {
    if (pageTitle) return pageTitle;
    // Infer title from path
    const path = location.pathname.toLowerCase();
    if (path === '/') {
        switch (user?.role) {
            case 'admin': return 'Admin Dashboard';
            case 'manager': return 'Manager Dashboard';
            case 'instructor': return 'Instructor Dashboard';
            case 'content': return 'Content Dashboard';
            case 'crm': return 'CRM Dashboard';
            default: return 'Dashboard';
        }
    }
    if (path.startsWith('/users')) return 'User Management';
    if (path.startsWith('/alltechstacks')) return 'Tech Stacks';
    if (path.startsWith('/roadmaps')) return 'Published Roadmaps';
    if (path.startsWith('/manage-roadmaps')) return 'Manage Roadmaps';
    if (path.startsWith('/newtechstack')) return 'Create Tech Stack';
    if (path.startsWith('/timeline')) return 'Timeline View';
    if (path.startsWith('/profile')) return 'Profile Settings';
    return 'Tech Stack Roadmap';
  };

  return (
    <header className="bg-white shadow-sm border-b border-gray-200 h-16 flex items-center justify-between px-4 sm:px-6">
      <div className="flex items-center">
        <button
          onClick={toggleSidebar}
          className="text-gray-600 focus:outline-none lg:hidden me-3"
          aria-label="Toggle sidebar"
        >
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        <h1 className="text-lg sm:text-xl font-semibold text-gray-800">{getPageTitle()}</h1>
      </div>

      <div className="flex items-center">
        {/* Show NotificationIcon for admin, manager, AND instructor */}
        {(user?.role === 'admin' || user?.role === 'manager' || user?.role === 'instructor') && (
          <NotificationIcon />
        )}
        {/* Other icons like profile dropdown can be added here */}
        <div className="flex items-center">
            <span className="text-sm text-gray-600 me-2 hidden sm:inline">{user?.displayName || user?.username}</span>
            <div className="w-8 h-8 rounded-full bg-primary-500 text-white flex items-center justify-center text-sm font-semibold">
                {user?.firstName ? user.firstName.charAt(0).toUpperCase() : user?.username ? user.username.charAt(0).toUpperCase() : 'U'}
            </div>
        </div>
      </div>
    </header>
  );
};

export default TopBar;