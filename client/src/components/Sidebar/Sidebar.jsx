// client/src/components/Sidebar/Sidebar.jsx
import React, { useState, useEffect } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import useAuth from '../../hooks/useAuth';
import Calendar from '../Calendar/Calendar';
import statsService from '../../services/statsService';
import './Sidebar.css';

const Sidebar = ({ isOpen, toggleSidebar, setPageLoading }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState('/');
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [justCollapsed, setJustCollapsed] = useState(false);
  const { user, logout } = useAuth();
  const [scheduledCalendarEvents, setScheduledCalendarEvents] = useState([]);
  const [loadingCalendar, setLoadingCalendar] = useState(false);

  useEffect(() => {
    setActiveSection(location.pathname);
  }, [location]);

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
                const localDate = new Date(item.scheduledDate);
                const year = localDate.getFullYear();
                const month = (localDate.getMonth() + 1).toString().padStart(2, '0');
                const day = localDate.getDate().toString().padStart(2, '0');
                return { date: `${year}-${month}-${day}`, techStackName: item.techStackName, topic: item.topic };
              }).filter(event => event !== null)
            );
            setScheduledCalendarEvents(events);
          }
        } catch (error) {
          console.error("Error fetching scheduled items for calendar:", error);
        } finally {
          setLoadingCalendar(false);
        }
      } else {
        setScheduledCalendarEvents([]);
      }
    };
    fetchScheduledItemsForCalendar();
  }, [user]);

  const handleNavigation = (path, e) => {
    if (location.pathname === path) {
      e.preventDefault(); return;
    }
    if (setPageLoading) setPageLoading(true);
    navigate(path);
    if (window.innerWidth < 1024) toggleSidebar();
    setTimeout(() => { if (setPageLoading) setPageLoading(false); }, 300); 
  };

  const handleLogout = async () => {
    if (setPageLoading) setPageLoading(true);
    await logout();
  };

  const toggleCollapse = () => {
    setIsCollapsed(!isCollapsed);
    setIsHovered(false);
    if (!isCollapsed) {
      setJustCollapsed(true);
      setTimeout(() => setJustCollapsed(false), 300);
    }
  };

  const getNavLinks = () => {
    if (!user) return [];

    const navLinks = [
        { to: "/", icon: "M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z", label: "Dashboard" }
    ];

    // --- START MODIFICATION: Updated access logic for Internships/Students Tracker ---
    const canAccessStudentsTracker = 
      user.role === 'admin' || 
      user.role === 'manager' ||
      ((user.role === 'instructor' || user.role === 'crm') && user.canAccessStudentsTracker);
    
    if (canAccessStudentsTracker) {
        navLinks.push({ to: "/students-tracker", icon: "M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-8.5 12.5H7v-1h3.5v1zm0-3H7v-1h3.5v1zm0-3H7v-1h3.5v1zm4.5 6H12v-1h3.5v1zm0-3H12v-1h3.5v1zm0-3H12v-1h3.5v1z", label: "Students Tracker" });
    }
    // --- END MODIFICATION ---

    // The logic for legacy "Internships Tracker" page remains
    if (user.role === 'admin' || user.role === 'manager') {
      navLinks.push({ to: "/internships-tracker", icon: "M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm-1 9h-2v4h2v-4zm-2-2h2V5h-2v4z", label: "Internships Tracker" });
    }
    
    if (user.role === 'admin' || user.role === 'manager' || (user.role === 'instructor' && user.canAccessCriticalPoints) || user.role === 'crm') {
      navLinks.push({ to: "/critical-points", icon: "M20.285 2l-2.857 2.857-1.428-1.428-1.428 1.428-2.143-2.143L9.571 5.571l-1.428-1.428L5.286 7l-2.143 2.143 2.857 2.857-1.428 1.428 1.428 1.428 2.143-2.143L11.571 16l1.428 1.428-2.857 2.857 2.143 2.143L16 19.571l1.428 1.428 2.857-2.857L23.143 16l-2.858-2.857zM11.857 9.143L8 5.286l-2.143 2.143 3.857 3.857-2.857 2.857 1.428 1.428 3.857-3.857L16 16l-1.428-1.428L10.714 10.714l1.143-1.571z", label: "Critical Points" });
    }
    
    // --- START MODIFICATION: Updated access logic for Overall HUB ---
    const canAccessOverallHub = 
      user.role === 'admin' || 
      user.role === 'manager' ||
      ((user.role === 'instructor' || user.role === 'crm') && user.canAccessOverallHub);
    
    if (canAccessOverallHub) {
        navLinks.push({ to: "/overall-hub", icon: "M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1.25 12.25H11v-4.5h2.25v4.5zm-3.5 0H7.5v-6.75h2.25v6.75zM17 14.25h-2.25V9H17v5.25z", label: "Overall HUB" });
    }
    // --- END MODIFICATION ---
    
    const canAccessPostInternships = 
      user.role === 'admin' || 
      user.role === 'manager' || 
      user.role === 'crm' ||
      (user.role === 'instructor' && user.canAccessPostInternships);

    if (canAccessPostInternships) {
      navLinks.push({ to: "/post-internships", icon: "M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14.59L6.41 12 5 13.41 11 19.41l8-8L17.59 10 11 16.59z", label: "Post Internships" });
    }
    
    if (user.role === 'admin' || user.role === 'manager' || user.role === 'instructor') {
      navLinks.push({ to: "/timeline", icon: "M9 11H7v2h2v-2zm4 0h-2v2h2v-2zm4 0h-2v2h2v-2zm2-7h-1V2h-2v2H8V2H6v2H5c-1.11 0-1.99.9-1.99 2L3 20c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V9h14v11z", label: "Timeline View" });
    }
    
    if (user.role === 'admin' || user.role === 'manager' || user.role === 'content' || (user.role === 'instructor' && user.techStackPermission !== 'none')) {
      navLinks.push({ to: "/alltechstacks", icon: "M4 7h16v2H4V7zm0 4h16v2H4v-2zm0 4h16v2H4v-2z", label: "Tech Stacks" });
    }
    
    if (user.role === 'admin' || user.role === 'manager' || (user.role === 'instructor' && user.canManageRoadmaps)) {
        navLinks.push({ to: "/manage-roadmaps", icon: "M13 21v2.5l-3-2-3 2V21h-.5A3.5 3.5 0 0 1 3 17.5V5a3 3 0 0 1 3-3h14a1 1 0 0 1 1 1v17a1 1 0 0 1-1 1h-7zm-6-2v-2h6v2h6v-3H6.5a1.5 1.5 0 0 0 0 3H7zM7 5v2h2V5H7zm0 3v2h2V8H7zm0 3v2h2v-2H7z", label: "Roadmaps" });
    }
    
    if (user.role === 'admin') {
        navLinks.push({ to: "/users", icon: "M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z", label: "User Management" });
        navLinks.push({ to: "/newtechstack", type: 'button', icon: "M11 11V5h2v6h6v2h-6v6h-2v-6H5v-2h6z", label: "New Tech Stack" });
    }
    
    return navLinks;
  };
  
  const navLinks = getNavLinks();
  const isExpanded = !isCollapsed || (isHovered && !justCollapsed);
  const getSidebarWidth = () => {
    if (window.innerWidth < 1024) return 'w-64';
    return isExpanded ? 'w-64' : 'w-16';
  };

  return (
    <>
      {isOpen && (
        <div className="fixed inset-0 z-20 bg-black bg-opacity-60 backdrop-blur-sm lg:hidden" onClick={toggleSidebar} aria-hidden="true"></div>
      )}
      <div className={`fixed inset-y-0 left-0 z-30 flex flex-col bg-gray-900 text-gray-100 transform transition-all duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-auto lg:z-auto shadow-2xl ${isOpen ? 'translate-x-0' : '-translate-x-full'} ${getSidebarWidth()}`}
        onMouseEnter={() => window.innerWidth >= 1024 && isCollapsed && setIsHovered(true)}
        onMouseLeave={() => window.innerWidth >= 1024 && isCollapsed && setIsHovered(false)}
      >
        <div className={`flex items-center h-20 px-6 border-b border-gray-800 ${isCollapsed && !isHovered ? 'justify-center px-4' : 'justify-between'}`}>
          <div className={`flex items-center space-x-3 ${isCollapsed && !isHovered ? 'space-x-0' : ''}`}>
            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary-500 shadow-md flex-shrink-0">
              <svg className="w-7 h-7 text-white" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M19.5 6.5H4.5C3.39543 6.5 2.5 7.39543 2.5 8.5V15.5C2.5 16.6046 3.39543 17.5 4.5 17.5H19.5C20.6046 17.5 21.5 16.6046 21.5 15.5V8.5C21.5 7.39543 20.6046 6.5 19.5 6.5Z" stroke="currentColor" strokeWidth="1.5"/>
                <path d="M7.5 6.5V4.5C7.5 3.39543 8.39543 2.5 9.5 2.5H14.5C15.6046 2.5 16.5 3.39543 16.5 4.5V6.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                <path d="M10.5 12C10.5 12.8284 9.82843 13.5 9 13.5C8.17157 13.5 7.5 12.8284 7.5 12C7.5 11.1716 8.17157 10.5 9 10.5C9.82843 10.5 10.5 11.1716 10.5 12Z" stroke="currentColor" strokeWidth="1.5"/>
                <path d="M16.5 12C16.5 12.8284 15.8284 13.5 15 13.5C14.1716 13.5 13.5 12.8284 13.5 12C13.5 11.1716 14.1716 10.5 15 10.5C15.8284 10.5 16.5 11.1716 16.5 12Z" stroke="currentColor" strokeWidth="1.5"/>
              </svg>
            </div>
            {(isExpanded || window.innerWidth < 1024) && (
              <div className="transition-opacity duration-300"><div className="text-xl font-bold tracking-tight">NIAT</div><div className="text-xs font-medium text-gray-400">Roadmaps</div></div>
            )}
          </div>
          <div className="flex items-center space-x-2">
            {window.innerWidth >= 1024 && (isExpanded || window.innerWidth < 1024) && (
              <button onClick={toggleCollapse} className="hidden lg:block text-gray-400 hover:text-white focus:outline-none p-2 rounded-md transition-colors duration-200" title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}><svg className={`w-5 h-5 transition-transform duration-300 ${isCollapsed ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" /></svg></button>
            )}
            <button onClick={toggleSidebar} className="lg:hidden text-gray-400 hover:text-white focus:outline-none p-2 -mr-2 rounded-md"><svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></button>
          </div>
        </div>
        <nav className={`mt-6 space-y-1.5 overflow-y-auto custom-scrollbar ${isCollapsed && !isHovered ? 'px-2' : 'px-4'}`}>
          {navLinks.map((link) => {
            if (link.type === 'button') {
              return (
                <div key={link.to} className="pt-4 pb-2">
                  <NavLink to={link.to} onClick={(e) => handleNavigation(link.to, e)} className={`flex items-center px-4 py-3 text-sm font-semibold rounded-lg transition-all duration-200 ease-in-out bg-primary-500 text-white hover:bg-primary-600 shadow-lg hover:shadow-primary-500/40 transform hover:-translate-y-0.5 ${isCollapsed && !isHovered ? 'justify-center px-2' : 'justify-center'}`} title={isCollapsed && !isHovered ? link.label : ''}>
                    <svg className={`h-5 w-5 flex-shrink-0 ${(isExpanded || window.innerWidth < 1024) ? 'mr-2' : ''}`} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d={link.icon} fill="currentColor"/></svg>
                    {(isExpanded || window.innerWidth < 1024) && <span>{link.label}</span>}
                  </NavLink>
                </div>
              );
            }
            return (
              <NavLink key={link.to} to={link.to} onClick={(e) => handleNavigation(link.to, e)} className={({ isActive }) => `group flex items-center py-2.5 text-sm font-medium rounded-md transition-all duration-200 ease-in-out relative ${(isActive || (link.to !== "/" && activeSection.startsWith(link.to))) ? 'bg-primary-500 text-white shadow-md' : 'text-gray-300 hover:bg-gray-800 hover:text-white'} ${isCollapsed && !isHovered ? 'px-2 justify-center' : 'px-4'}`} end={link.to === "/"} title={isCollapsed && !isHovered ? link.label : ''}>
                {link.icon.startsWith("M") ? 
                    <svg className={`h-5 w-5 flex-shrink-0 ${(isExpanded || window.innerWidth < 1024) ? 'mr-3' : ''}`} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d={link.icon} fill="currentColor"/></svg>
                    : <i className={`h-5 w-5 flex-shrink-0 text-center ${(isExpanded || window.innerWidth < 1024) ? 'mr-3' : ''} ${link.icon}`}></i>
                }
                {(isExpanded || window.innerWidth < 1024) && <span className="truncate">{link.label}</span>}
                {(location.pathname === link.to || (link.to !== "/" && activeSection.startsWith(link.to))) && (<span className="absolute left-0 top-1/2 -translate-y-1/2 h-3/4 w-1 bg-white rounded-r-full"></span>)}
              </NavLink>
            );
          })}
        </nav>
        {user?.role === 'instructor' && (isExpanded || window.innerWidth < 1024) && (
          <div className="border-t border-gray-800">
            {loadingCalendar ? (<div className="text-center py-2"><div className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-solid border-current border-r-transparent align-[-0.125em] text-gray-400 motion-reduce:animate-[spin_1.5s_linear_infinite]"></div><span className="text-xs text-gray-400 ml-2">Loading...</span></div>) : (<div className="w-full"><Calendar scheduledEvents={scheduledCalendarEvents} /></div>)}
          </div>
        )}
        <div className="mt-auto">
          <div className={`py-3 border-t border-gray-800 ${isCollapsed && !isHovered ? 'px-2' : 'px-4'}`}>
            <button onClick={handleLogout} className={`group flex items-center w-full py-2.5 text-sm font-medium rounded-md transition-all duration-200 ease-in-out text-gray-400 hover:bg-red-600 hover:text-white ${isCollapsed && !isHovered ? 'px-2 justify-center' : 'px-4'}`} title={isCollapsed && !isHovered ? 'Logout' : ''}>
              <svg className={`h-5 w-5 flex-shrink-0 ${(isExpanded || window.innerWidth < 1024) ? 'mr-3' : ''}`} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
              {(isExpanded || window.innerWidth < 1024) && <span>Logout</span>}
            </button>
          </div>
          {(isExpanded || window.innerWidth < 1024) && (
            <div className="px-6 py-2 border-t border-gray-800 bg-gray-800/50"><div className="flex items-center space-x-3"><div className="w-10 h-10 rounded-full bg-primary-500 flex items-center justify-center text-white font-semibold text-lg shadow-inner flex-shrink-0">{user?.firstName ? user.firstName.charAt(0).toUpperCase() : user?.username ? user.username.charAt(0).toUpperCase() : 'U'}</div><div className="text-sm overflow-hidden"><div className="font-semibold text-white truncate">{user?.displayName || user?.username}</div><div className="text-xs text-gray-400 truncate">{user?.role}</div></div></div></div>
          )}
          {isCollapsed && !isHovered && window.innerWidth >= 1024 && (
            <div className="px-2 py-3 border-t border-gray-800 bg-gray-800/50 flex justify-center"><div className="w-10 h-10 rounded-full bg-primary-500 flex items-center justify-center text-white font-semibold text-lg shadow-inner cursor-pointer" title={`${user?.displayName || user?.username} (${user?.role})`}>{user?.firstName ? user.firstName.charAt(0).toUpperCase() : user?.username ? user.username.charAt(0).toUpperCase() : 'U'}</div></div>
          )}
        </div>
      </div>
    </>
  );
};

export default Sidebar;
