// client/src/pages/UserManagement.jsx
import React, { useState, useEffect } from 'react';
import { Form, Button, Modal, Alert, Table, Badge, Dropdown, InputGroup, Card, Row, Col, Spinner, Tabs, Tab } from 'react-bootstrap';
import userService from '../services/userService';
import * as techStackService from '../services/techStackService'; 
import { getRoleDisplayName, getRoleBadgeColor } from '../services/rolesService';

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [showEditUserModal, setShowEditUserModal] = useState(false);
  const [showResetPasswordModal, setShowResetPasswordModal] = useState(false);
  const [showDeleteUserModal, setShowDeleteUserModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  
  const [newUser, setNewUser] = useState({
    username: '', email: '', password: '', firstName: '', lastName: '', role: 'crm', assignedTechStacks: [], canManageRoadmaps: false, techStackPermission: 'none', canAccessCriticalPoints: false, canAccessPostInternships: false
  });
  
  const [resetPassword, setResetPassword] = useState({ newPassword: '', confirmPassword: '' });
  
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [activeModalTab, setActiveModalTab] = useState('details');

  const [allTechStacksForDropdown, setAllTechStacksForDropdown] = useState([]);
  const [actionLoading, setActionLoading] = useState(false);

  // Memoized fetch function
  const fetchUsers = React.useCallback(async () => {
    try {
      setLoading(true);
      const response = await userService.getUsers();
      setUsers(response.data || []);
    } catch (err) {
      setError('Failed to fetch users. ' + (err.response?.data?.error || err.message));
    } finally {
      setLoading(false);
    }
  }, []); // Empty dependency array means this function is created once

  useEffect(() => {
    const loadInitialData = async () => {
      try {
        setLoading(true);
        setError(null);
        const [usersResponse, techStacksResponse] = await Promise.all([
          userService.getUsers(),
          techStackService.getAllTechStacks()
        ]);
        setUsers(usersResponse.data || []);
        setAllTechStacksForDropdown(techStacksResponse.data || []);
      } catch (err) {
        setError('Failed to fetch initial data. ' + (err.response?.data?.error || err.message));
      } finally {
        setLoading(false);
      }
    };
    loadInitialData();
  }, []);

  const handleAddUserClick = () => {
    setNewUser({ username: '', email: '', password: '', firstName: '', lastName: '', role: 'crm', assignedTechStacks: [], canManageRoadmaps: false, techStackPermission: 'none', canAccessCriticalPoints: false, canAccessPostInternships: false });
    setError(null); setSuccess(null);
    setActiveModalTab('details');
    setShowAddUserModal(true);
  };

  const handleNewUserChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (name === "assignedTechStacks") {
        const selectedOptions = Array.from(e.target.selectedOptions, option => option.value);
        setNewUser(prev => ({ ...prev, assignedTechStacks: selectedOptions }));
    } else {
        const formValue = type === 'checkbox' ? checked : value;
        setNewUser(prev => ({ ...prev, [name]: formValue }));
    }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    setError(null); setSuccess(null);
    setActionLoading(true);
    try {
      await userService.createUser(newUser);
      await fetchUsers();
      setShowAddUserModal(false);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create user');
    } finally {
      setActionLoading(false);
    }
  };

  const handleEditUserClick = (userToEdit) => {
    setSelectedUser({
      ...userToEdit,
      assignedTechStacks: userToEdit.assignedTechStacks ? userToEdit.assignedTechStacks.map(ts => ts._id) : [],
      techStackPermission: userToEdit.techStackPermission || 'none',
      canAccessCriticalPoints: userToEdit.canAccessCriticalPoints || false,
      canAccessPostInternships: userToEdit.canAccessPostInternships || false,
    });
    setActiveModalTab('details');
    setError(null); setSuccess(null);
    setShowEditUserModal(true);
  };

  const handleEditUserChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (name === "assignedTechStacks") {
        const selectedOptions = Array.from(e.target.selectedOptions, option => option.value);
        setSelectedUser(prev => ({ ...prev, assignedTechStacks: selectedOptions }));
    } else {
        const formValue = type === 'checkbox' ? checked : value;
        setSelectedUser(prev => ({ ...prev, [name]: formValue }));
    }
  };

  const handleUpdateUser = async (e) => {
    e.preventDefault();
    setError(null); setSuccess(null);
    setActionLoading(true);
    try {
      const { _id, username, email, firstName, lastName, role, isActive, assignedTechStacks, canManageRoadmaps, techStackPermission, canAccessCriticalPoints, canAccessPostInternships } = selectedUser;
      await userService.updateUser(_id, {
        username, email, firstName, lastName, role, isActive,
        assignedTechStacks, canManageRoadmaps, techStackPermission, canAccessCriticalPoints, canAccessPostInternships
      });
      await fetchUsers();
      setShowEditUserModal(false);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update user');
    } finally {
      setActionLoading(false);
    }
  };

  const handleResetPasswordClick = (userToReset) => {
    setSelectedUser(userToReset);
    setResetPassword({ newPassword: '', confirmPassword: '' });
    setError(null); setSuccess(null);
    setShowResetPasswordModal(true);
  };

  const handleResetPasswordChange = (e) => {
    const { name, value } = e.target;
    setResetPassword(prev => ({ ...prev, [name]: value }));
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError(null); setSuccess(null);
    if (resetPassword.newPassword !== resetPassword.confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    setActionLoading(true);
    try {
      await userService.resetUserPassword(selectedUser._id, { newPassword: resetPassword.newPassword });
      setShowResetPasswordModal(false);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to reset password');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteUserClick = (userToDelete) => {
    setSelectedUser(userToDelete);
    setError(null); setSuccess(null);
    setShowDeleteUserModal(true);
  };

  const handleDeleteUser = async () => {
    setError(null); setSuccess(null);
    setActionLoading(true);
    try {
      await userService.deleteUser(selectedUser._id);
      await fetchUsers();
      setShowDeleteUserModal(false);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to delete user');
    } finally {
      setActionLoading(false);
    }
  };

  const handleToggleUserStatus = async (userToToggle) => {
    setError(null); setSuccess(null);
    setActionLoading(true);
    try {
      await userService.updateUser(userToToggle._id, { isActive: !userToToggle.isActive });
      await fetchUsers();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update user status');
    } finally {
      setActionLoading(false);
    }
  };

  const filteredUsers = users.filter(u => {
    const searchLower = searchTerm.toLowerCase();
    const searchMatch = 
      u.username.toLowerCase().includes(searchLower) ||
      u.email.toLowerCase().includes(searchLower) ||
      (u.firstName && u.firstName.toLowerCase().includes(searchLower)) ||
      (u.lastName && u.lastName.toLowerCase().includes(searchLower));
    const roleMatch = roleFilter === 'all' || u.role === roleFilter;
    return searchMatch && roleMatch;
  });

  const TechStackDropdownDisplay = ({ techStacks }) => {
    if (!techStacks || techStacks.length === 0) {
      return <span className="text-muted small">N/A</span>;
    }
    if (techStacks.length <= 1) {
        return techStacks.map(ts => (
            <Badge key={ts._id} bg="light" text="dark" className="me-1 mb-1 border fw-normal">{ts.name}</Badge>
        ));
    }
    return (
      <Dropdown size="sm">
        <Dropdown.Toggle variant="outline-secondary" id={`dropdown-assigned-${techStacks[0]._id}`} className="py-1 px-2">
          {techStacks.length} Assigned
        </Dropdown.Toggle>
        <Dropdown.Menu style={{maxHeight: '200px', overflowY: 'auto'}}>
          {techStacks.map(ts => (
            <Dropdown.ItemText key={ts._id} className="small">{ts.name}</Dropdown.ItemText>
          ))}
        </Dropdown.Menu>
      </Dropdown>
    );
  };

  return (
    <div className="">
      <Row className="mb-4 align-items-center">
        <Col><h1 className="h3 mb-0">User Management</h1><p className="text-muted mb-0">Administer user accounts and roles.</p></Col>
        <Col xs="auto"><Button variant="primary" onClick={handleAddUserClick} className="d-flex align-items-center shadow-sm"><i className="fas fa-user-plus me-2"></i>Add New User</Button></Col>
      </Row>
      
      {error && !showAddUserModal && !showEditUserModal && !showResetPasswordModal && !showDeleteUserModal && (<Alert variant="danger" onClose={() => setError(null)} dismissible className="shadow-sm">{error}</Alert>)}
      {success && (<Alert variant="success" onClose={() => setSuccess(null)} dismissible>{success}</Alert>)}      
      
      <Card className="border-0 shadow-sm mb-4"><Card.Body>
        <Row className="g-3"><Col md={6}><Form.Label htmlFor="userSearchInput" className="small fw-medium">Search Users</Form.Label><InputGroup><InputGroup.Text><i className="fas fa-search text-muted"></i></InputGroup.Text><Form.Control id="userSearchInput" type="text" placeholder="Search by name, username, or email..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />{searchTerm && (<Button variant="outline-secondary" onClick={() => setSearchTerm('')} aria-label="Clear search"><i className="fas fa-times"></i></Button>)}</InputGroup></Col><Col md={4}><Form.Label htmlFor="roleFilterSelect" className="small fw-medium">Filter by Role</Form.Label><Form.Select id="roleFilterSelect" value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}><option value="all">All Roles</option><option value="admin">Admin</option><option value="manager">Manager</option><option value="instructor">Instructor</option><option value="content">Content Team</option><option value="crm">CRM</option></Form.Select></Col><Col md={2} className="d-flex align-items-end"><Button variant="outline-secondary" className="w-100" onClick={fetchUsers} disabled={loading}><i className={`fas fa-sync-alt me-1 ${loading && 'fa-spin'}`}></i>Refresh</Button></Col></Row>
      </Card.Body></Card>
      
      <Card className="border-0 shadow-sm"><Card.Body className="p-0"><div className="table-responsive">
        <Table hover className="m-0 user-table"><thead className="bg-light">
          <tr><th>Username</th><th>Name</th><th>Email</th><th>Role</th><th>Assigned Stacks</th><th>Status</th><th>Last Login</th><th className="text-center">Actions</th></tr>
        </thead><tbody> 
          {loading && (<tr><td colSpan="8" className="text-center py-5"><Spinner animation="border" variant="primary" /></td></tr>)}      
          {!loading && filteredUsers.length === 0 && (<tr><td colSpan="8" className="text-center py-5"><h5>No Users Found</h5></td></tr>)}
          {!loading && filteredUsers.map(u => (<tr key={u._id}><td className="fw-medium">{u.username}</td><td>{u.firstName && u.lastName ? `${u.firstName} ${u.lastName}` : <span className="text-muted fst-italic">N/A</span>}</td><td><a href={`mailto:${u.email}`} className="text-decoration-none">{u.email}</a></td><td><Badge bg={getRoleBadgeColor(u.role)} pill className="user-role-badge">{getRoleDisplayName(u.role)}</Badge></td><td>{u.role === 'instructor' ? <TechStackDropdownDisplay techStacks={u.assignedTechStacks} /> : <span className="text-muted small">N/A</span>}</td><td><Badge pill bg={u.isActive ? 'success-subtle' : 'danger-subtle'} text={u.isActive ? 'success' : 'danger'} className="user-status-badge">{u.isActive ? 'Active' : 'Inactive'}</Badge></td><td className="small text-muted">{u.lastLogin ? new Date(u.lastLogin).toLocaleString() : 'Never'}</td><td className="text-center"><Dropdown><Dropdown.Toggle variant="link" id={`dropdown-actions-${u._id}`} className="p-1 text-muted no-caret"><i className="fas fa-ellipsis-v"></i></Dropdown.Toggle><Dropdown.Menu align="end"><Dropdown.Item onClick={() => handleEditUserClick(u)}><i className="fas fa-edit me-2 text-primary"></i>Edit User</Dropdown.Item><Dropdown.Item onClick={() => handleResetPasswordClick(u)}><i className="fas fa-key me-2 text-warning"></i>Reset Password</Dropdown.Item><Dropdown.Item onClick={() => handleToggleUserStatus(u)}><i className={`fas ${u.isActive ? 'fa-user-slash' : 'fa-user-check'} me-2 ${u.isActive ? 'text-secondary' : 'text-success'}`}></i>{u.isActive ? 'Deactivate' : 'Activate'}</Dropdown.Item><Dropdown.Divider /><Dropdown.Item onClick={() => handleDeleteUserClick(u)} className="text-danger"><i className="fas fa-trash-alt me-2"></i>Delete User</Dropdown.Item></Dropdown.Menu></Dropdown></td></tr>))}
        </tbody></Table>
      </div></Card.Body></Card>
      
      <Modal show={showAddUserModal || showEditUserModal} onHide={() => { setShowAddUserModal(false); setShowEditUserModal(false); setError(null); }} centered>
        <Modal.Header closeButton><Modal.Title><i className={`fas ${showAddUserModal ? 'fa-user-plus' : 'fa-user-edit'} me-2`}></i>{showAddUserModal ? 'Add New User' : 'Edit User Details'}</Modal.Title></Modal.Header>
        <Form onSubmit={showAddUserModal ? handleCreateUser : handleUpdateUser}>
          <Modal.Body>
             <Tabs activeKey={activeModalTab} onSelect={(k) => setActiveModalTab(k)} id="user-details-tabs" className="mb-3 nav-tabs-custom">
              <Tab eventKey="details" title="Details">
                <div className="p-2">
                  {error && <Alert variant="danger" className="py-2 small">{error}</Alert>}
                  <Form.Group className="mb-3"><Form.Label>Username*</Form.Label><Form.Control type="text" name="username" value={showAddUserModal ? newUser.username : selectedUser?.username || ''} onChange={showAddUserModal ? handleNewUserChange : handleEditUserChange} required /></Form.Group>
                  <Form.Group className="mb-3"><Form.Label>Email*</Form.Label><Form.Control type="email" name="email" value={showAddUserModal ? newUser.email : selectedUser?.email || ''} onChange={showAddUserModal ? handleNewUserChange : handleEditUserChange} required /></Form.Group>
                  {showAddUserModal && (<Form.Group className="mb-3"><Form.Label>Password*</Form.Label><Form.Control type="password" name="password" value={newUser.password} onChange={handleNewUserChange} required /></Form.Group>)}
                  <Row>
                    <Col md={6}><Form.Group className="mb-3"><Form.Label>First Name</Form.Label><Form.Control type="text" name="firstName" value={showAddUserModal ? newUser.firstName : selectedUser?.firstName || ''} onChange={showAddUserModal ? handleNewUserChange : handleEditUserChange} /></Form.Group></Col>
                    <Col md={6}><Form.Group className="mb-3"><Form.Label>Last Name</Form.Label><Form.Control type="text" name="lastName" value={showAddUserModal ? newUser.lastName : selectedUser?.lastName || ''} onChange={showAddUserModal ? handleNewUserChange : handleEditUserChange} /></Form.Group></Col>
                  </Row>
                  <Form.Group className="mb-3"><Form.Label>Role*</Form.Label><Form.Select name="role" value={showAddUserModal ? newUser.role : selectedUser?.role || 'crm'} onChange={showAddUserModal ? handleNewUserChange : handleEditUserChange} required><option value="crm">CRM</option><option value="content">Content Team</option><option value="instructor">Instructor</option><option value="manager">Manager</option><option value="admin">Administrator</option></Form.Select></Form.Group>
                  {showEditUserModal && selectedUser && (<Form.Group><Form.Check type="switch" name="isActive" id="user-active-switch" label={selectedUser.isActive ? "Active" : "Inactive"} checked={selectedUser.isActive} onChange={handleEditUserChange} /></Form.Group>)}
                </div>
              </Tab>
              <Tab eventKey="permissions" title="Permissions" disabled={(showAddUserModal ? newUser.role : selectedUser?.role) !== 'instructor'}>
                <div className="p-2">
                  <p className="text-muted small">These settings only apply if the user's role is 'Instructor'.</p>
                  <Form.Group className="mb-3"><Form.Label>General Permissions</Form.Label>
                    <Form.Check type="switch" id="can-manage-roadmaps-switch" name="canManageRoadmaps" label="Allow to manage Roadmaps" checked={showAddUserModal ? newUser.canManageRoadmaps : selectedUser?.canManageRoadmaps || false} onChange={showAddUserModal ? handleNewUserChange : handleEditUserChange}/>
                    <Form.Check type="switch" id="can-access-critical-points-switch" name="canAccessCriticalPoints" label="Allow to access Critical Points page" checked={showAddUserModal ? newUser.canAccessCriticalPoints : selectedUser?.canAccessCriticalPoints || false} onChange={showAddUserModal ? handleNewUserChange : handleEditUserChange} className="mt-2"/>
                    {/* --- START NEW SWITCH --- */}
                    <Form.Check
                        type="switch"
                        id="can-access-post-internships-switch"
                        name="canAccessPostInternships"
                        label="Allow to access Post-Internship Placements"
                        checked={showAddUserModal ? newUser.canAccessPostInternships : selectedUser?.canAccessPostInternships || false}
                        onChange={showAddUserModal ? handleNewUserChange : handleEditUserChange}
                        className="mt-2"
                    />
                    {/* --- END NEW SWITCH --- */}
                  </Form.Group>
                  <Form.Group className="mb-3">
                      <Form.Label>Tech Stack Permissions</Form.Label>
                      <Form.Select name="techStackPermission" value={showAddUserModal ? newUser.techStackPermission : selectedUser?.techStackPermission || 'none'} onChange={showAddUserModal ? handleNewUserChange : handleEditUserChange}>
                          <option value="none">None</option><option value="view">View Only</option><option value="edit">View and Edit</option>
                      </Form.Select>
                  </Form.Group>
                  <Form.Group className="mb-3"><Form.Label>Assigned Tech Stacks</Form.Label><Form.Select multiple name="assignedTechStacks" value={showAddUserModal ? newUser.assignedTechStacks : selectedUser?.assignedTechStacks || []} onChange={showAddUserModal ? handleNewUserChange : handleEditUserChange} style={{ height: '120px' }}>{allTechStacksForDropdown.map(stack => (<option key={stack._id} value={stack._id}>{stack.name}</option>))}</Form.Select><Form.Text className="text-muted small">Hold Ctrl/Cmd to select multiple.</Form.Text></Form.Group>
                </div>
              </Tab>
             </Tabs>
          </Modal.Body>
          <Modal.Footer><Button variant="outline-secondary" onClick={() => { setShowAddUserModal(false); setShowEditUserModal(false); setError(null); }}>Cancel</Button><Button variant="primary" type="submit" disabled={actionLoading}>{actionLoading ? <Spinner as="span" animation="border" size="sm" /> : (showAddUserModal ? 'Create User' : 'Save Changes')}</Button></Modal.Footer>
        </Form>
      </Modal>

      <Modal show={showResetPasswordModal} onHide={() => setShowResetPasswordModal(false)} centered><Modal.Header closeButton><Modal.Title>Reset Password</Modal.Title></Modal.Header><Form onSubmit={handleResetPassword}><Modal.Body><p>Resetting password for <strong>{selectedUser?.username}</strong>.</p><Form.Group className="mb-3"><Form.Label>New Password*</Form.Label><Form.Control type="password" name="newPassword" value={resetPassword.newPassword} onChange={handleResetPasswordChange} required/></Form.Group><Form.Group><Form.Label>Confirm Password*</Form.Label><Form.Control type="password" name="confirmPassword" value={resetPassword.confirmPassword} onChange={handleResetPasswordChange} required/></Form.Group></Modal.Body><Modal.Footer><Button variant="secondary" onClick={() => setShowResetPasswordModal(false)}>Cancel</Button><Button variant="warning" type="submit" disabled={actionLoading}>{actionLoading ? 'Resetting...' : 'Reset Password'}</Button></Modal.Footer></Form></Modal>
      <Modal show={showDeleteUserModal} onHide={() => setShowDeleteUserModal(false)} centered><Modal.Header closeButton className="bg-danger-soft text-danger"><Modal.Title>Delete User</Modal.Title></Modal.Header><Modal.Body className="text-center"><i className="fas fa-exclamation-triangle text-danger fa-3x mb-3"></i><h5>Are you sure?</h5><p>This will permanently delete the user <strong>{selectedUser?.username}</strong>.</p></Modal.Body><Modal.Footer className="justify-content-center"><Button variant="secondary" onClick={() => setShowDeleteUserModal(false)}>Cancel</Button><Button variant="danger" onClick={handleDeleteUser} disabled={actionLoading}>{actionLoading ? <Spinner size="sm" /> : 'Delete'}</Button></Modal.Footer></Modal>

      <style jsx global>{` .user-table th { font-size: 0.8rem; text-transform: uppercase; letter-spacing: 0.05em; font-weight: 600; } .user-table td { vertical-align: middle; } .user-table .no-caret::after { display: none; } .user-role-badge, .user-status-badge { font-size: 0.75rem !important; } .bg-danger-soft { background-color: rgba(220, 53, 69, 0.1) !important; } .nav-tabs-custom .nav-link { color: #495057; border: none; border-bottom: 3px solid transparent; } .nav-tabs-custom .nav-link.active { color: #0d6efd; border-bottom-color: #0d6efd; } .nav-tabs-custom .nav-link.disabled { color: #adb5bd; pointer-events: none; cursor: not-allowed; }`}</style>
    </div>
  );
};

export default UserManagement;
