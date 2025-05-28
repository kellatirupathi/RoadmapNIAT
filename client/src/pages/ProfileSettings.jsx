// client/src/pages/ProfileSettings.jsx
import React, { useState, useEffect } from 'react';
import { Card, Form, Button, Row, Col, Alert, Tab, Nav, Spinner } from 'react-bootstrap';
import useAuth from '../hooks/useAuth';
import authService from '../services/authService';
import userService from '../services/userService';
import { getRoleDisplayName } from '../services/rolesService';

const ProfileSettings = ({ setPageLoading }) => {
  const { user, logout } = useAuth();
  
  // Profile form state
  const [profileData, setProfileData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    username: ''
  });
  
  // Password change form state
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  
  // Activity logs state
  const [activityLogs, setActivityLogs] = useState([]);
  const [loadingActivity, setLoadingActivity] = useState(false);
  
  // UI state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [activeTab, setActiveTab] = useState('profile');

  // Load user data
  useEffect(() => {
    if (user) {
      setProfileData({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        email: user.email || '',
        username: user.username || ''
      });
      
      // Fetch activity logs if user is logged in
      fetchActivityLogs();
    }
  }, [user]);

  // Fetch user activity logs
  const fetchActivityLogs = async () => {
    if (!user) return;
    
    try {
      setLoadingActivity(true);
      const response = await userService.getUserActivity(user.id);
      setActivityLogs(response.data);
      setLoadingActivity(false);
    } catch (err) {
      console.error('Failed to fetch activity logs:', err);
      setLoadingActivity(false);
    }
  };

  // Handle profile form input change
  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    setProfileData({
      ...profileData,
      [name]: value
    });
  };

  // Handle password form input change
  const handlePasswordInputChange = (e) => {
    const { name, value } = e.target;
    setPasswordData({
      ...passwordData,
      [name]: value
    });
  };

  // Update profile
  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      setError(null);
      
      // Call API to update profile
      await userService.updateUser(user.id, {
        firstName: profileData.firstName,
        lastName: profileData.lastName,
        email: profileData.email,
        username: profileData.username
      });
      
      setSuccess('Profile updated successfully');
      setLoading(false);
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update profile');
      setLoading(false);
    }
  };

  // Change password
  const handlePasswordChange = async (e) => {
    e.preventDefault();
    
    // Validate passwords match
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setError('New passwords do not match');
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      // Call API to change password
      await authService.changePassword(
        passwordData.currentPassword,
        passwordData.newPassword
      );
      
      // Reset form
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
      
      setSuccess('Password changed successfully');
      setLoading(false);
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to change password');
      setLoading(false);
    }
  };

  // Format date
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Format activity action
  const formatAction = (action) => {
    return action.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  return (
    <div className="profile-settings">
      <div className="mb-4">
        <h1 className="h3 mb-0">Profile Settings</h1>
        <p className="text-muted">Manage your account settings and preferences</p>
      </div>
      
      {error && (
        <Alert variant="danger" onClose={() => setError(null)} dismissible>
          <i className="fas fa-exclamation-circle me-2"></i>
          {error}
        </Alert>
      )}
      
      {success && (
        <Alert variant="success" onClose={() => setSuccess(null)} dismissible>
          <i className="fas fa-check-circle me-2"></i>
          {success}
        </Alert>
      )}
      
      <Card className="border-0 shadow-sm overflow-hidden">
        <Tab.Container activeKey={activeTab} onSelect={setActiveTab}>
          <Row className="g-0">
            <Col md={3} className="border-end">
              <div className="p-4 text-center border-bottom">
                <div className="avatar-placeholder bg-primary rounded-circle d-flex align-items-center justify-content-center mx-auto mb-3" style={{ width: '80px', height: '80px' }}>
                  <span className="text-white font-weight-bold fs-4">
                    {user?.firstName?.charAt(0) || user?.username?.charAt(0) || 'U'}
                  </span>
                </div>
                <h5 className="mb-1">{user?.firstName ? `${user.firstName} ${user.lastName || ''}` : user?.username}</h5>
                <div className="badge bg-primary">{getRoleDisplayName(user?.role)}</div>
                <p className="text-muted mt-2 mb-0 small">
                  Last login: {user?.lastLogin ? formatDate(user.lastLogin) : 'N/A'}
                </p>
              </div>
              
              <Nav variant="pills" className="flex-column">
                <Nav.Item>
                  <Nav.Link 
                    eventKey="profile" 
                    className="border-0 rounded-0 py-3 px-4 d-flex align-items-center"
                  >
                    <i className="fas fa-user me-2"></i>
                    Profile Information
                  </Nav.Link>
                </Nav.Item>
                <Nav.Item>
                  <Nav.Link 
                    eventKey="password" 
                    className="border-0 rounded-0 py-3 px-4 d-flex align-items-center"
                  >
                    <i className="fas fa-lock me-2"></i>
                    Change Password
                  </Nav.Link>
                </Nav.Item>
                <Nav.Item>
                  <Nav.Link 
                    eventKey="activity" 
                    className="border-0 rounded-0 py-3 px-4 d-flex align-items-center"
                  >
                    <i className="fas fa-history me-2"></i>
                    Activity Log
                  </Nav.Link>
                </Nav.Item>
              </Nav>
              
              <div className="p-4">
                <Button 
                  variant="outline-danger" 
                  className="w-100"
                  onClick={logout}
                >
                  <i className="fas fa-sign-out-alt me-2"></i>
                  Sign Out
                </Button>
              </div>
            </Col>
            
            <Col md={9}>
              <Tab.Content>
                <Tab.Pane eventKey="profile" className="p-4">
                  <h4 className="mb-4">Profile Information</h4>
                  <Form onSubmit={handleProfileUpdate}>
                    <Row className="mb-3">
                      <Col md={6}>
                        <Form.Group controlId="firstName">
                          <Form.Label>First Name</Form.Label>
                          <Form.Control 
                            type="text" 
                            name="firstName"
                            value={profileData.firstName}
                            onChange={handleProfileChange}
                          />
                        </Form.Group>
                      </Col>
                      <Col md={6}>
                        <Form.Group controlId="lastName">
                          <Form.Label>Last Name</Form.Label>
                          <Form.Control 
                            type="text" 
                            name="lastName"
                            value={profileData.lastName}
                            onChange={handleProfileChange}
                          />
                        </Form.Group>
                      </Col>
                    </Row>
                    <Row className="mb-3">
                      <Col md={6}>
                        <Form.Group controlId="username">
                          <Form.Label>Username</Form.Label>
                          <Form.Control 
                            type="text" 
                            name="username"
                            value={profileData.username}
                            onChange={handleProfileChange}
                            required
                          />
                        </Form.Group>
                      </Col>
                      <Col md={6}>
                        <Form.Group controlId="email">
                          <Form.Label>Email Address</Form.Label>
                          <Form.Control 
                            type="email" 
                            name="email"
                            value={profileData.email}
                            onChange={handleProfileChange}
                            required
                          />
                        </Form.Group>
                      </Col>
                    </Row>
                    <Row className="mb-3">
                      <Col>
                        <Form.Group controlId="role">
                          <Form.Label>Role</Form.Label>
                          <Form.Control 
                            type="text" 
                            value={getRoleDisplayName(user?.role)}
                            disabled
                            readOnly
                            className="bg-light"
                          />
                          <Form.Text className="text-muted">
                            Your role determines what features you can access. Contact an administrator to change your role.
                          </Form.Text>
                        </Form.Group>
                      </Col>
                    </Row>
                    <div className="d-flex justify-content-end">
                      <Button 
                        variant="primary" 
                        type="submit"
                        disabled={loading}
                      >
                        {loading ? (
                          <>
                            <Spinner
                              as="span"
                              animation="border"
                              size="sm"
                              role="status"
                              aria-hidden="true"
                              className="me-2"
                            />
                            Saving...
                          </>
                        ) : (
                          'Save Changes'
                        )}
                      </Button>
                    </div>
                  </Form>
                </Tab.Pane>
                
                <Tab.Pane eventKey="password" className="p-4">
                  <h4 className="mb-4">Change Password</h4>
                  <Form onSubmit={handlePasswordChange}>
                    <Form.Group className="mb-3" controlId="currentPassword">
                      <Form.Label>Current Password</Form.Label>
                      <Form.Control 
                        type="password" 
                        name="currentPassword"
                        value={passwordData.currentPassword}
                        onChange={handlePasswordChange}
                        required
                      />
                    </Form.Group>
                    <Form.Group className="mb-3" controlId="newPassword">
                      <Form.Label>New Password</Form.Label>
                      <Form.Control 
                        type="password" 
                        name="newPassword"
                        value={passwordData.newPassword}
                        onChange={handlePasswordChange}
                        required
                        minLength={6}
                      />
                      <Form.Text className="text-muted">
                        Password must be at least 6 characters long.
                      </Form.Text>
                    </Form.Group>
                    <Form.Group className="mb-3" controlId="confirmPassword">
                      <Form.Label>Confirm New Password</Form.Label>
                      <Form.Control 
                        type="password" 
                        name="confirmPassword"
                        value={passwordData.confirmPassword}
                        onChange={handlePasswordChange}
                        required
                      />
                    </Form.Group>
                    <div className="d-flex justify-content-end">
                      <Button 
                        variant="primary" 
                        type="submit"
                        disabled={loading}
                      >
                        {loading ? (
                          <>
                            <Spinner
                              as="span"
                              animation="border"
                              size="sm"
                              role="status"
                              aria-hidden="true"
                              className="me-2"
                            />
                            Changing...
                          </>
                        ) : (
                          'Change Password'
                        )}
                      </Button>
                    </div>
                  </Form>
                </Tab.Pane>
                
                <Tab.Pane eventKey="activity" className="p-4">
                  <div className="d-flex justify-content-between align-items-center mb-4">
                    <h4 className="mb-0">Activity Log</h4>
                    <Button 
                      variant="outline-primary" 
                      size="sm"
                      onClick={fetchActivityLogs}
                      disabled={loadingActivity}
                    >
                      <i className="fas fa-sync-alt me-1"></i>
                      Refresh
                    </Button>
                  </div>
                  
                  {loadingActivity ? (
                    <div className="text-center py-5">
                      <Spinner animation="border" role="status" variant="primary">
                        <span className="visually-hidden">Loading...</span>
                      </Spinner>
                      <p className="mt-3 text-muted">Loading activity logs...</p>
                    </div>
                  ) : activityLogs && activityLogs.length > 0 ? (
                    <div className="timeline">
                      {activityLogs.map((log, index) => (
                        <div key={index} className="timeline-item mb-4">
                          <div className="d-flex">
                            <div className="timeline-marker bg-primary rounded-circle" style={{ width: '12px', height: '12px', marginTop: '6px', marginRight: '15px' }}></div>
                            <div className="timeline-content">
                              <div className="d-flex justify-content-between align-items-center mb-1">
                                <h6 className="mb-0">{formatAction(log.action)}</h6>
                                <span className="text-muted small">{formatDate(log.timestamp)}</span>
                              </div>
                              <p className="text-muted mb-2 small">
                                {log.details && Object.keys(log.details).length > 0 ? (
                                  <span>
                                    Details: {JSON.stringify(log.details)}
                                  </span>
                                ) : (
                                  <span>
                                    {log.action === 'login' && 'You logged into the system'}
                                    {log.action === 'logout' && 'You logged out of the system'}
                                    {log.action.includes('techstack') && `You ${log.action.split('_')[0]}d a tech stack`}
                                    {log.action.includes('roadmap') && `You ${log.action.split('_')[0]}d a roadmap`}
                                  </span>
                                )}
                              </p>
                              {log.ip && (
                                <div className="text-muted small">
                                  IP: {log.ip}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-5">
                      <i className="fas fa-history fa-3x text-muted mb-3"></i>
                      <h5>No Activity Recorded</h5>
                      <p className="text-muted">Your activity will be logged here</p>
                    </div>
                  )}
                </Tab.Pane>
              </Tab.Content>
            </Col>
          </Row>
        </Tab.Container>
      </Card>
    </div>
  );
};

export default ProfileSettings;