// client/src/components/Sidebar/Sidebar.jsx
import React, { useState, useEffect } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import useAuth from '../../hooks/useAuth';
import Calendar from '../Calendar/Calendar'; // Import the new Calendar component
import statsService from '../../services/statsService'; // For fetching scheduled items
import './Sidebar.css';

const Sidebar = ({ isOpen, toggleSidebar, setPageLoading }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState('/');
  const { user, logout } = useAuth();
  const [scheduledCalendarEvents, setScheduledCalendarEvents] = useState([]);
  const [loadingCalendar, setLoadingCalendar] = useState(false);

  useEffect(() => {
    setActiveSection(location.pathname);
  }, [location]);

  // Fetch scheduled dates for the calendar if the user is an instructor
  useEffect(() => {
    const fetchScheduledItemsForCalendar = async () => {
      if (user?.role === 'instructor') {
        setLoadingCalendar(true);
        try {
          const response = await statsService.getTimelineStats();
          if (response && response.timelineStats) {
            const events = response.timelineStats.flatMap(statusGroup =>
              statusGroup.items.map(item => {
                if (!item.scheduledDate) return null;
                // Convert ISO date string to YYYY-MM-DD format for the calendar
                // The date from backend is UTC. Creating a new Date object locally
                // will interpret it in the local timezone for comparison.
                // Calendar should work with local "days".
                const localDate = new Date(item.scheduledDate);
                const year = localDate.getFullYear();
                const month = (localDate.getMonth() + 1).toString().padStart(2, '0');
                const day = localDate.getDate().toString().padStart(2, '0');

                return {
                  date: `${year}-${month}-${day}`,
                  techStackName: item.techStackName,
                  topic: item.topic,
                };
              }).filter(event => event !== null) // Remove null entries for items without scheduledDate
            );
            setScheduledCalendarEvents(events);
          }
        } catch (error) {
          console.error("Error fetching scheduled items for calendar:", error);
          // Handle error appropriately, maybe set an error state for calendar
        } finally {
          setLoadingCalendar(false);
        }
      } else {
        // Clear events if user is not an instructor or logged out
        setScheduledCalendarEvents([]);
      }
    };

    fetchScheduledItemsForCalendar();
  }, [user]);


  const handleNavigation = (path, e) => {
    if (location.pathname === path) {
      e.preventDefault();
      return;
    }
    
    if (setPageLoading) setPageLoading(true);
    navigate(path);
    
    if (window.innerWidth < 1024) { // Assuming 1024px is the lg breakpoint
      toggleSidebar();
    }
    
    // Simulate page load time
    setTimeout(() => {
      if (setPageLoading) setPageLoading(false);
    }, 300); 
  };

  const handleLogout = async () => {
    if (setPageLoading) setPageLoading(true);
    await logout();
  };

  const getNavLinks = () => {
    if (!user) return [];

    const commonLinks = [
      { to: "/", icon: "M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z", label: "Dashboard" },
    ];

    const manageDbRoadmapsLink = { to: "/manage-roadmaps", icon: "M13 21v2.5l-3-2-3 2V21h-.5A3.5 3.5 0 0 1 3 17.5V5a3 3 0 0 1 3-3h14a1 1 0 0 1 1 1v17a1 1 0 0 1-1 1h-7zm-6-2v-2h6v2h6v-3H6.5a1.5 1.5 0 0 0 0 3H7zM7 5v2h2V5H7zm0 3v2h2V8H7zm0 3v2h2v-2H7z", label: "Roadmaps" };
    const publishedGitHubRoadmapsLink = { to: "/roadmaps", icon: "M20.59 2.59C20.21 2.21 19.7 2 19.17 2H4.83C3.17 2 1.83 3.34 1.83 5L1.5 17.01c0 1.66 1.34 3 3 3h15c1.66 0 3-1.34 3-3V7.83c0-.53-.21-1.04-.59-1.41L14.17 2.59zM14 4.5V8h4.5L14 4.5zM5.5 17V5h7.5v4.5H17v7.5H5.5z", label: "Github Files" }; 
    const timelineViewLink = { to: "/timeline", icon: "M9 11H7v2h2v-2zm4 0h-2v2h2v-2zm4 0h-2v2h2v-2zm2-7h-1V2h-2v2H8V2H6v2H5c-1.11 0-1.99.9-1.99 2L3 20c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V9h14v11z", label: "Timeline View" };

    const roleSpecificLinks = {
      admin: [
        ...commonLinks,
        timelineViewLink, // Move timeline view right after dashboard for admin
        { to: "/alltechstacks", icon: "M4 7h16v2H4V7zm0 4h16v2H4v-2zm0 4h16v2H4v-2z", label: "Tech Stacks" },
        manageDbRoadmapsLink, 
        publishedGitHubRoadmapsLink,
        { to: "/users", icon: "M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z", label: "User Management" },
        { to: "/newtechstack", type: 'button', icon: "M11 11V5h2v6h6v2h-6v6h-2v-6H5v-2h6z", label: "New Tech Stack" },
      ],
      content: [
        { to: "/alltechstacks", icon: "M4 7h16v2H4V7zm0 4h16v2H4v-2zm0 4h16v2H4v-2z", label: "Tech Stacks" },
        { to: "/newtechstack", type: 'button', icon: "M11 11V5h2v6h6v2h-6v6h-2v-6H5v-2h6z", label: "New Tech Stack" },
      ],
      instructor: [ 
        ...commonLinks,
        timelineViewLink, // Timeline view right after dashboard for instructor
      ],
      manager: [
        ...commonLinks,
        timelineViewLink, // Timeline view right after dashboard for manager
        { to: "/alltechstacks", icon: "M4 7h16v2H4V7zm0 4h16v2H4v-2zm0 4h16v2H4v-2z", label: "Tech Stacks" },
        manageDbRoadmapsLink, 
      ],
      crm: [
        ...commonLinks, // Only Dashboard for CRM role - removed publishedGitHubRoadmapsLink
      ],
    };

    return roleSpecificLinks[user.role] || commonLinks;
  };

  const navLinks = getNavLinks();

  return (
    <>
      {/* Overlay for mobile */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-20 bg-black bg-opacity-60 backdrop-blur-sm lg:hidden"
          onClick={toggleSidebar}
          aria-hidden="true"
        ></div>
      )}
      
      {/* Sidebar */}
      <div 
        className={`fixed inset-y-0 left-0 z-30 flex flex-col w-64 bg-gray-900 text-gray-100 transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-auto lg:z-auto shadow-2xl ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between h-20 px-6 border-b border-gray-800">
          <div className="flex items-center space-x-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary-500 shadow-md">
              <svg className="w-7 h-7 text-white" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M19.5 6.5H4.5C3.39543 6.5 2.5 7.39543 2.5 8.5V15.5C2.5 16.6046 3.39543 17.5 4.5 17.5H19.5C20.6046 17.5 21.5 16.6046 21.5 15.5V8.5C21.5 7.39543 20.6046 6.5 19.5 6.5Z" stroke="currentColor" strokeWidth="1.5"/>
                <path d="M7.5 6.5V4.5C7.5 3.39543 8.39543 2.5 9.5 2.5H14.5C15.6046 2.5 16.5 3.39543 16.5 4.5V6.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                <path d="M10.5 12C10.5 12.8284 9.82843 13.5 9 13.5C8.17157 13.5 7.5 12.8284 7.5 12C7.5 11.1716 8.17157 10.5 9 10.5C9.82843 10.5 10.5 11.1716 10.5 12Z" stroke="currentColor" strokeWidth="1.5"/>
                <path d="M16.5 12C16.5 12.8284 15.8284 13.5 15 13.5C14.1716 13.5 13.5 12.8284 13.5 12C13.5 11.1716 14.1716 10.5 15 10.5C15.8284 10.5 16.5 11.1716 16.5 12Z" stroke="currentColor" strokeWidth="1.5"/>
              </svg>
            </div>
            <div>
              <div className="text-xl font-bold tracking-tight">NIAT</div>
              <div className="text-xs font-medium text-gray-400">Roadmaps</div>
            </div>
          </div>
          
          <button 
            onClick={toggleSidebar}
            className="lg:hidden text-gray-400 hover:text-white focus:outline-none p-2 -mr-2 rounded-md"
            aria-label="Close sidebar"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        {/* Navigation - Dashboard and Timeline first */}
        <nav className="mt-6 px-4 space-y-1.5 overflow-y-auto custom-scrollbar">
          {navLinks.map((link) => {
            if (link.type === 'button') {
              return (
                <div key={link.to} className="pt-4 pb-2">
                  <NavLink
                    to={link.to}
                    onClick={(e) => handleNavigation(link.to, e)}
                    className="flex items-center justify-center px-4 py-3 text-sm font-semibold rounded-lg transition-all duration-200 ease-in-out bg-primary-500 text-white hover:bg-primary-600 shadow-lg hover:shadow-primary-500/40 transform hover:-translate-y-0.5"
                  >
                    <svg className="mr-2 h-5 w-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d={link.icon} fill="currentColor"/>
                    </svg>
                    <span>{link.label}</span>
                  </NavLink>
                </div>
              );
            }
            return (
              <NavLink
                key={link.to}
                to={link.to}
                onClick={(e) => handleNavigation(link.to, e)}
                className={({ isActive }) => 
                  `group flex items-center px-4 py-2.5 text-sm font-medium rounded-md transition-all duration-200 ease-in-out relative ${
                    (isActive || (link.to !== "/" && activeSection.startsWith(link.to))) 
                      ? 'bg-primary-500 text-white shadow-md' 
                      : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                  }`
                }
                end={link.to === "/"}
              >
                <svg className="mr-3 h-5 w-5 flex-shrink-0" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d={link.icon} fill="currentColor"/>
                </svg>
                <span className="truncate">{link.label}</span>
                 {/* Active indicator example (optional) */}
                {(location.pathname === link.to || (link.to !== "/" && activeSection.startsWith(link.to))) && (
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 h-3/4 w-1 bg-white rounded-r-full"></span>
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* Calendar section for instructors - moved below navigation */}
        {user?.role === 'instructor' && (
          <div className="py-4 border-t border-gray-800 mt-4">
            {loadingCalendar ? (
              <div className="text-center py-2">
                 <div className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-solid border-current border-r-transparent align-[-0.125em] text-gray-400 motion-reduce:animate-[spin_1.5s_linear_infinite]"></div>
                 <span className="text-xs text-gray-400 ml-2">Loading calendar...</span>
              </div>
            ) : (
              <div className="w-full">
                <Calendar scheduledEvents={scheduledCalendarEvents} />
              </div>
            )}
          </div>
        )}
        
        {/* Footer: Logout and User Info */}
        <div className="mt-auto">
          <div className="px-4 py-3 border-t border-gray-800">
            <button
              onClick={handleLogout}
              className="group flex items-center w-full px-4 py-2.5 text-sm font-medium rounded-md transition-all duration-200 ease-in-out text-gray-400 hover:bg-red-600 hover:text-white"
            >
              <svg className="mr-3 h-5 w-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              <span>Logout</span>
            </button>
          </div>

          {/* Non-editable User Profile Section */}
          <div className="px-6 py-5 border-t border-gray-800 bg-gray-800/50">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-full bg-primary-500 flex items-center justify-center text-white font-semibold text-lg shadow-inner">
                {user?.firstName ? user.firstName.charAt(0).toUpperCase() : user?.username ? user.username.charAt(0).toUpperCase() : 'U'}
              </div>
              <div className="text-sm overflow-hidden">
                <div className="font-semibold text-white truncate">{user?.displayName || user?.username}</div>
                <div className="text-xs text-gray-400 truncate">{user?.role}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Sidebar;