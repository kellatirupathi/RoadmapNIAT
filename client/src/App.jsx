// client/src/App.jsx
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { AuthProvider } from './contexts/AuthContext';
import { NotificationProvider } from './contexts/NotificationContext'; // Import NotificationProvider
import useAuth from './hooks/useAuth';
import ProtectedRoute from './routes/ProtectedRoute';

// Layout Components
import Sidebar from './components/Sidebar/Sidebar';
import TopBar from './components/Layout/TopBar'; // Import TopBar
import PageLoader from './components/UI/PageLoader';

// Public Pages
import Login from './pages/Login';
import NotAuthorized from './pages/NotAuthorized';

// Admin Pages
import UserManagement from './pages/UserManagement';
import AdminDashboard from './pages/AdminDashboard';
import InternshipsTracker from './pages/InternshipsTracker';

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
  const [pageLoading, setPageLoading] = useState(false); // Local page loading state
  const [sidebarOpen, setSidebarOpen] = useState(true); // Default to open on larger screens

  useEffect(() => {
    // Close sidebar by default on smaller screens
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
      case 'admin':
        return <AdminDashboard setPageLoading={setPageLoading} />;
      case 'manager':
        return <ManagerDashboard setPageLoading={setPageLoading} />;
      case 'instructor':
        return <InstructorDashboard setPageLoading={setPageLoading} />;
      case 'content':
        return <ContentDashboard setPageLoading={setPageLoading} />;
      case 'crm':
        return <CRMDashboard setPageLoading={setPageLoading} />;
      default:
        return <Navigate to="/not-authorized" replace />;
    }
  };

  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar 
        isOpen={sidebarOpen} 
        toggleSidebar={toggleSidebar}
        setPageLoading={setPageLoading} // Pass page loading setter
      />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <TopBar toggleSidebar={toggleSidebar} /> {/* Use TopBar here */}
        
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100 p-4 md:p-6 relative">
          {pageLoading && <PageLoader />}
          
          <div className={`transition-opacity duration-300 ${pageLoading ? 'opacity-50 pointer-events-none' : 'opacity-100'}`}>
            <Routes>
              <Route path="/" element={getDashboardForRole()} />
              
              <Route path="/profile" element={
                <ProtectedRoute 
                  element={<ProfileSettings setPageLoading={setPageLoading} />} 
                />
              } />

              <Route path="/internships-tracker" element={
                <ProtectedRoute
                    element={<InternshipsTracker />}
                    requiredRoles={['admin', 'manager']}
                />
              } />
              
              <Route path="/users" element={
                <ProtectedRoute 
                  element={<UserManagement setPageLoading={setPageLoading} />} 
                  requiredRoles={['admin']}
                />
              } />
              
              <Route path="/alltechstacks" element={
                <ProtectedRoute 
                  element={
                    (user.role === 'content' || user.role === 'manager' || user.role === 'admin') 
                      ? <ContentDashboard setPageLoading={setPageLoading} /> 
                      : <Dashboard view="all-roadmaps" setPageLoading={setPageLoading} /> // Fallback, ensure roles match
                  }
                  requiredRoles={['admin', 'content', 'manager']} // Instructors usually view timeline, not raw stacks
                />
              } />
              
              <Route path="/roadmaps" element={ // Published GitHub files
                <ProtectedRoute 
                  element={<RoadmapsList setPageLoading={setPageLoading} />}
                  // Accessible by most roles that need to see published content
                  requiredRoles={['admin', 'manager', 'instructor', 'crm', 'content']}
                />
              } />

              <Route path="/manage-roadmaps" element={ // DB Roadmaps
                <ProtectedRoute
                  element={<RoadmapsManagement setPageLoading={setPageLoading} />}
                  requiredRoles={['admin', 'manager']}
                />
              } />
              
              <Route path="/newtechstack" element={
                <ProtectedRoute 
                  element={<AddTechStackForm onTechStackAdded={() => { /* Potentially refresh list or redirect */ }} />} // Pass dummy or actual handler
                  requiredRoles={['admin', 'content']}
                />
              } />
              
              <Route path="/timeline" element={
                <ProtectedRoute 
                  element={<TimelineView setPageLoading={setPageLoading} />}
                  requiredRoles={['admin', 'instructor', 'manager']}
                />
              } />
              
              <Route path="/not-authorized" element={<NotAuthorized />} />
              <Route path="*" element={<Navigate to="/" replace />} /> {/* Default fallback */}
            </Routes>
          </div>
        </main>
      </div>
    </div>
  );
};

function App() {
  return (
    <Router>
      <AuthProvider>
        <NotificationProvider> {/* Wrap AppRoutes with NotificationProvider */}
          <AppRoutes />
        </NotificationProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;