// // client/src/App.jsx
// import React, { useState, useEffect } from 'react';
// import { BrowserRouter as Router, Route, Routes, Navigate, useLocation } from 'react-router-dom';
// import { AuthProvider } from './contexts/AuthContext';
// import { NotificationProvider } from './contexts/NotificationContext';
// import useAuth from './hooks/useAuth';
// import ProtectedRoute from './routes/ProtectedRoute';

// // Layout Components
// import Sidebar from './components/Sidebar/Sidebar';
// import TopBar from './components/Layout/TopBar';
// import PageLoader from './components/UI/PageLoader';

// // Public Pages
// import Login from './pages/Login';
// import NotAuthorized from './pages/NotAuthorized';
// import PublicInteractionPage from './pages/PublicInteractionPage'; // --- NEW IMPORT ---

// // Admin Pages
// import UserManagement from './pages/UserManagement';
// import AdminDashboard from './pages/AdminDashboard';
// import InternshipsTracker from './pages/InternshipsTracker';
// import StudentsTrackerPage from './pages/StudentsTrackerPage'; 
// import OverallHubPage from './pages/OverallHubPage';
// import CriticalPointsPage from './pages/CriticalPoints';
// import PostInternships from './pages/PostInternships';
// import StudentTaskTrackerPage from './pages/StudentTaskTrackerPage';

// // Content Team Pages
// import ContentDashboard from './pages/ContentDashboard';
// import AddTechStackForm from './components/AddTechStackForm/AddTechStackForm';

// // Instructor Pages
// import InstructorDashboard from './pages/InstructorDashboard';
// import TimelineView from './pages/TimelineView';

// // CRM Pages
// import CRMDashboard from './pages/CRMDashboard';

// // Manager Pages
// import ManagerDashboard from './pages/ManagerDashboard';

// // Shared Pages
// import RoadmapsList from './components/RoadmapsList/RoadmapsList';
// import RoadmapsManagement from './pages/RoadmapsManagement';
// import Dashboard from './components/Dashboard/Dashboard';
// import ProfileSettings from './pages/ProfileSettings';

// const AppRoutes = () => {
//   const { isAuthenticated, loading, user } = useAuth();
//   const [pageLoading, setPageLoading] = useState(false);
//   const [sidebarOpen, setSidebarOpen] = useState(true);
//   const location = useLocation();

//   useEffect(() => {
//     if (window.innerWidth < 1024) {
//       setSidebarOpen(false);
//     }
//   }, []);

//   const toggleSidebar = () => {
//     setSidebarOpen(!sidebarOpen);
//   };

//   if (loading) {
//     return <PageLoader />;
//   }
  
//   if (!isAuthenticated) {
//     return (
//         <Routes>
//             <Route path="/login" element={<Login />} />
//             <Route path="/not-authorized" element={<NotAuthorized />} />
//             <Route path="*" element={<Navigate to="/login" replace />} />
//         </Routes>
//     );
//   }

//   const getDashboardForRole = () => {
//     switch (user.role) {
//       case 'admin': return <AdminDashboard setPageLoading={setPageLoading} />;
//       case 'manager': return <ManagerDashboard setPageLoading={setPageLoading} />;
//       case 'instructor': return <InstructorDashboard setPageLoading={setPageLoading} />;
//       case 'content': return <ContentDashboard setPageLoading={setPageLoading} />;
//       case 'crm': return <CRMDashboard setPageLoading={setPageLoading} />;
//       default: return <Navigate to="/not-authorized" replace />;
//     }
//   };

//   const canAccessPostInternships = 
//       user.role === 'admin' || 
//       user.role === 'manager' || 
//       user.role === 'crm' ||
//       (user.role === 'instructor' && user.canAccessPostInternships);

//   return (
//     <div className="flex h-screen bg-gray-100">
//       <Sidebar isOpen={sidebarOpen} toggleSidebar={toggleSidebar} setPageLoading={setPageLoading} />
//       <div className="flex-1 flex flex-col overflow-hidden">
//         {/* START: Conditionally render the TopBar, excluding specified pages */}
//         {(
//             location.pathname !== '/internships-tracker' && 
//             location.pathname !== '/students-tracker' && 
//             location.pathname !== '/critical-points' &&
//             location.pathname !== '/overall-hub' &&
//             !location.pathname.startsWith('/post-internships')
//         ) && <TopBar toggleSidebar={toggleSidebar} />}
//         {/* END: Conditionally render the TopBar */}
//         <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100 p-4 md:p-6 relative">
//           {pageLoading && <PageLoader />}
//           <div className={`transition-opacity duration-300 ${pageLoading ? 'opacity-50 pointer-events-none' : 'opacity-100'}`}>
//             <Routes>
//               <Route path="/" element={getDashboardForRole()} />
//               <Route path="/profile" element={<ProtectedRoute element={<ProfileSettings setPageLoading={setPageLoading} />} />} />
//               <Route path="/internships-tracker" element={<ProtectedRoute element={<InternshipsTracker user={user} />} requiredRoles={['admin', 'manager']} />} />
//               <Route path="/students-tracker" element={<ProtectedRoute element={<StudentsTrackerPage />} requiredRoles={['admin', 'manager', 'instructor', 'crm']} />} />
//               <Route path="/overall-hub" element={<ProtectedRoute element={<OverallHubPage />} requiredRoles={['admin', 'manager', 'instructor', 'crm']} />} />
//               <Route path="/critical-points" element={<ProtectedRoute element={<CriticalPointsPage />} requiredRoles={['admin', 'manager', 'crm', 'instructor']} />} />
//               <Route path="/post-internships" element={canAccessPostInternships ? <ProtectedRoute element={<PostInternships />} /> : <Navigate to="/not-authorized" replace />} />
//               <Route path="/post-internships/:studentId/tasks" element={canAccessPostInternships ? <ProtectedRoute element={<StudentTaskTrackerPage />} /> : <Navigate to="/not-authorized" replace />} />
//               <Route path="/users" element={<ProtectedRoute element={<UserManagement setPageLoading={setPageLoading} />} requiredRoles={['admin']} />} />
//               <Route path="/alltechstacks" element={<ProtectedRoute element={<ContentDashboard setPageLoading={setPageLoading} />} requiredRoles={['admin', 'manager', 'content', 'instructor']} />} />
//               <Route path="/roadmaps" element={<ProtectedRoute element={<RoadmapsList setPageLoading={setPageLoading} />} />} />
//               <Route path="/manage-roadmaps" element={<ProtectedRoute element={<RoadmapsManagement setPageLoading={setPageLoading} />} requiredRoles={['admin', 'manager', 'instructor']} />} />
//               <Route path="/newtechstack" element={<ProtectedRoute element={<AddTechStackForm onTechStackAdded={() => {}} />} requiredRoles={['admin', 'content', 'instructor']} />} />
//               <Route path="/timeline" element={<ProtectedRoute element={<TimelineView setPageLoading={setPageLoading} />} requiredRoles={['admin', 'instructor', 'manager']} />} />
//               <Route path="/not-authorized" element={<NotAuthorized />} />
//               <Route path="*" element={<Navigate to="/" replace />} />
//             </Routes>
//           </div>
//         </main>
//       </div>
//     </div>
//   );
// };

// function App() {
//   return (
//     <React.Fragment> 
//       <Router>
//         <AuthProvider>
//           <NotificationProvider>
//              <Routes>
//                 {/* Public Routes (no sidebar/topbar) */}
//                 <Route path="/public/interaction/:publicId" element={<PublicInteractionPage />} />
                
//                 {/* Authenticated Routes */}
//                 <Route path="/*" element={<AppRoutes />} />
//              </Routes>
//           </NotificationProvider>
//         </AuthProvider>
//       </Router>
//       <div id="datepicker-portal" style={{ position: "relative", zIndex: 9999 }}></div>
//     </React.Fragment>
//   );
// }

// export default App;



// client/src/App.jsx
import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { NotificationProvider } from './contexts/NotificationContext';
import useAuth from './hooks/useAuth';
import ProtectedRoute from './routes/ProtectedRoute';

// Layout Components
import Sidebar from './components/Sidebar/Sidebar';
import TopBar from './components/Layout/TopBar';
import PageLoader from './components/UI/PageLoader';

// Public Pages
import Login from './pages/Login';
import NotAuthorized from './pages/NotAuthorized';
import PublicInteractionPage from './pages/PublicInteractionPage'; // --- NEW IMPORT ---

// Admin Pages
import UserManagement from './pages/UserManagement';
import AdminDashboard from './pages/AdminDashboard';
import InternshipsTracker from './pages/InternshipsTracker';
import StudentsTrackerPage from './pages/StudentsTrackerPage'; 
import OverallHubPage from './pages/OverallHubPage';
import CriticalPointsPage from './pages/CriticalPoints';
import PostInternships from './pages/PostInternships';
import StudentTaskTrackerPage from './pages/StudentTaskTrackerPage';

// Content Team Pages
import ContentDashboard from './pages/ContentDashboard';
import AddTechStackForm from './components/AddTechStackForm/AddTechStackForm';

// Instructor Pages
import InstructorDashboard from './pages/InstructorDashboard';
import TimelineView from './pages/TimelineView';

// CRM Pages
import CRMDashboard from './pages/CRMDashboard';

// Manager Pages
import ManagerDashboard from './pages/ManagerDashboard';

// Shared Pages
import RoadmapsList from './components/RoadmapsList/RoadmapsList';
import RoadmapsManagement from './pages/RoadmapsManagement';
import Dashboard from './components/Dashboard/Dashboard';
import ProfileSettings from './pages/ProfileSettings';

const AppRoutes = () => {
  const { isAuthenticated, loading, user } = useAuth();
  const [pageLoading, setPageLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const location = useLocation();

  useEffect(() => {
    if (window.innerWidth < 1024) {
      setSidebarOpen(false);
    }
  }, []);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  if (loading) {
    return <PageLoader />;
  }
  
  if (!isAuthenticated) {
    return (
        <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/not-authorized" element={<NotAuthorized />} />
            <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
    );
  }

  const getDashboardForRole = () => {
    switch (user.role) {
      case 'admin': return <AdminDashboard setPageLoading={setPageLoading} />;
      case 'manager': return <ManagerDashboard setPageLoading={setPageLoading} />;
      case 'instructor': return <InstructorDashboard setPageLoading={setPageLoading} />;
      case 'content': return <ContentDashboard setPageLoading={setPageLoading} />;
      case 'crm': return <CRMDashboard setPageLoading={setPageLoading} />;
      default: return <Navigate to="/not-authorized" replace />;
    }
  };

  const canAccessPostInternships = 
      user.role === 'admin' || 
      user.role === 'manager' || 
      user.role === 'crm' ||
      (user.role === 'instructor' && user.canAccessPostInternships);

  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar isOpen={sidebarOpen} toggleSidebar={toggleSidebar} setPageLoading={setPageLoading} />
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* START: Conditionally render the TopBar, excluding specified pages */}
        {(
            location.pathname !== '/internships-tracker' && 
            location.pathname !== '/students-tracker' && 
            location.pathname !== '/critical-points' &&
            location.pathname !== '/overall-hub' &&
            !location.pathname.startsWith('/post-internships')
        ) && <TopBar toggleSidebar={toggleSidebar} />}
        {/* END: Conditionally render the TopBar */}
        <main className={`flex-1 overflow-x-hidden overflow-y-auto bg-gray-100 relative ${
            (location.pathname === '/internships-tracker' || 
            location.pathname === '/students-tracker' || 
            location.pathname === '/critical-points' ||
            location.pathname === '/overall-hub' ||
            location.pathname.startsWith('/post-internships')) ? 'p-0' : 'p-4 md:p-6'
          }`}>
          {pageLoading && <PageLoader />}
          <div className={`transition-opacity duration-300 ${pageLoading ? 'opacity-50 pointer-events-none' : 'opacity-100'}`}>
            <Routes>
              <Route path="/" element={getDashboardForRole()} />
              <Route path="/profile" element={<ProtectedRoute element={<ProfileSettings setPageLoading={setPageLoading} />} />} />
              <Route path="/internships-tracker" element={<ProtectedRoute element={<InternshipsTracker user={user} />} requiredRoles={['admin', 'manager']} />} />
              <Route path="/students-tracker" element={<ProtectedRoute element={<StudentsTrackerPage />} requiredRoles={['admin', 'manager', 'instructor', 'crm']} />} />
              <Route path="/overall-hub" element={<ProtectedRoute element={<OverallHubPage />} requiredRoles={['admin', 'manager', 'instructor', 'crm']} />} />
              <Route path="/critical-points" element={<ProtectedRoute element={<CriticalPointsPage />} requiredRoles={['admin', 'manager', 'crm', 'instructor']} />} />
              <Route path="/post-internships" element={canAccessPostInternships ? <ProtectedRoute element={<PostInternships />} /> : <Navigate to="/not-authorized" replace />} />
              <Route path="/post-internships/:studentId/tasks" element={canAccessPostInternships ? <ProtectedRoute element={<StudentTaskTrackerPage />} /> : <Navigate to="/not-authorized" replace />} />
              <Route path="/users" element={<ProtectedRoute element={<UserManagement setPageLoading={setPageLoading} />} requiredRoles={['admin']} />} />
              <Route path="/alltechstacks" element={<ProtectedRoute element={<ContentDashboard setPageLoading={setPageLoading} />} requiredRoles={['admin', 'manager', 'content', 'instructor']} />} />
              <Route path="/roadmaps" element={<ProtectedRoute element={<RoadmapsList setPageLoading={setPageLoading} />} />} />
              <Route path="/manage-roadmaps" element={<ProtectedRoute element={<RoadmapsManagement setPageLoading={setPageLoading} />} requiredRoles={['admin', 'manager', 'instructor']} />} />
              <Route path="/newtechstack" element={<ProtectedRoute element={<AddTechStackForm onTechStackAdded={() => {}} />} requiredRoles={['admin', 'content', 'instructor']} />} />
              <Route path="/timeline" element={<ProtectedRoute element={<TimelineView setPageLoading={setPageLoading} />} requiredRoles={['admin', 'instructor', 'manager']} />} />
              <Route path="/not-authorized" element={<NotAuthorized />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </div>
        </main>
      </div>
    </div>
  );
};

function App() {
  return (
    <React.Fragment> 
      <Router>
        <AuthProvider>
          <NotificationProvider>
             <Routes>
                {/* Public Routes (no sidebar/topbar) */}
                <Route path="/public/interaction/:publicId" element={<PublicInteractionPage />} />
                
                {/* Authenticated Routes */}
                <Route path="/*" element={<AppRoutes />} />
             </Routes>
          </NotificationProvider>
        </AuthProvider>
      </Router>
      <div id="datepicker-portal" style={{ position: "relative", zIndex: 9999 }}></div>
    </React.Fragment>
  );
}

export default App;
