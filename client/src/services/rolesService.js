// client/src/services/rolesService.js

// Available roles in the system
export const ROLES = {
    ADMIN: 'admin',
    MANAGER: 'manager',
    INSTRUCTOR: 'instructor',
    CONTENT: 'content',
    CRM: 'crm'
  };
  
  // Get role display name
  export const getRoleDisplayName = (role) => {
    switch (role) {
      case ROLES.ADMIN:
        return 'Administrator';
      case ROLES.MANAGER:
        return 'Manager';
      case ROLES.INSTRUCTOR:
        return 'Instructor / ASE';
      case ROLES.CONTENT:
        return 'Content Team';
      case ROLES.CRM:
        return 'CRM / Companies';
      default:
        return 'Unknown Role';
    }
  };
  
  // Get role description
  export const getRoleDescription = (role) => {
    switch (role) {
      case ROLES.ADMIN:
        return 'Full access to all features including user management.';
      case ROLES.MANAGER:
        return 'Can view all roadmaps and statistics, approve changes.';
      case ROLES.INSTRUCTOR:
        return 'Updates timeline milestones and status of techstack items.';
      case ROLES.CONTENT:
        return 'Manages technology content in roadmaps.';
      case ROLES.CRM:
        return 'View-only access to published roadmaps.';
      default:
        return '';
    }
  };
  
  // Get all available roles as an array
  export const getAllRoles = () => {
    return Object.values(ROLES);
  };
  
  // Get role badge color
  export const getRoleBadgeColor = (role) => {
    switch (role) {
      case ROLES.ADMIN:
        return 'danger';
      case ROLES.MANAGER:
        return 'warning';
      case ROLES.INSTRUCTOR:
        return 'info';
      case ROLES.CONTENT:
        return 'success';
      case ROLES.CRM:
        return 'secondary';
      default:
        return 'primary';
    }
  };
  
  // Get role icon
  export const getRoleIcon = (role) => {
    switch (role) {
      case ROLES.ADMIN:
        return 'shield-alt';
      case ROLES.MANAGER:
        return 'tasks';
      case ROLES.INSTRUCTOR:
        return 'chalkboard-teacher';
      case ROLES.CONTENT:
        return 'pencil-alt';
      case ROLES.CRM:
        return 'building';
      default:
        return 'user';
    }
  };
  
  // Permission definitions
  export const PERMISSIONS = {
    VIEW_ROADMAPS: 'view_roadmaps',
    CREATE_ROADMAP: 'create_roadmap',
    EDIT_ROADMAP: 'edit_roadmap',
    DELETE_ROADMAP: 'delete_roadmap',
    VIEW_TECHSTACKS: 'view_techstacks',
    CREATE_TECHSTACK: 'create_techstack',
    EDIT_TECHSTACK: 'edit_techstack',
    DELETE_TECHSTACK: 'delete_techstack',
    UPDATE_STATUS: 'update_status',
    ADD_COMMENTS: 'add_comments',
    VIEW_STATS: 'view_stats',
    MANAGE_USERS: 'manage_users'
  };
  
  // Check if a role has a specific permission
  export const hasPermission = (role, permission) => {
    // For now, simplified permission model
    // This could be expanded to fetch from backend
    
    const rolePermissions = {
      [ROLES.ADMIN]: Object.values(PERMISSIONS),
      [ROLES.MANAGER]: [
        PERMISSIONS.VIEW_ROADMAPS,
        PERMISSIONS.VIEW_TECHSTACKS,
        PERMISSIONS.VIEW_STATS
      ],
      [ROLES.INSTRUCTOR]: [
        PERMISSIONS.VIEW_ROADMAPS,
        PERMISSIONS.VIEW_TECHSTACKS,
        PERMISSIONS.UPDATE_STATUS,
        PERMISSIONS.ADD_COMMENTS
      ],
      [ROLES.CONTENT]:[
        PERMISSIONS.VIEW_ROADMAPS,
        PERMISSIONS.VIEW_TECHSTACKS,
        PERMISSIONS.CREATE_TECHSTACK,
        PERMISSIONS.EDIT_TECHSTACK
      ],
      [ROLES.CRM]: [
        PERMISSIONS.VIEW_ROADMAPS
      ]
    };
    
    return rolePermissions[role]?.includes(permission) || false;
  };
  
  // Get all permissions for a role
  export const getRolePermissions = (role) => {
    const rolePermissions = {
      [ROLES.ADMIN]: Object.values(PERMISSIONS),
      [ROLES.MANAGER]: [
        PERMISSIONS.VIEW_ROADMAPS,
        PERMISSIONS.VIEW_TECHSTACKS,
        PERMISSIONS.VIEW_STATS
      ],
      [ROLES.INSTRUCTOR]: [
        PERMISSIONS.VIEW_ROADMAPS,
        PERMISSIONS.VIEW_TECHSTACKS,
        PERMISSIONS.UPDATE_STATUS,
        PERMISSIONS.ADD_COMMENTS
      ],
      [ROLES.CONTENT]: [
        PERMISSIONS.VIEW_ROADMAPS,
        PERMISSIONS.VIEW_TECHSTACKS,
        PERMISSIONS.CREATE_TECHSTACK,
        PERMISSIONS.EDIT_TECHSTACK
      ],
      [ROLES.CRM]: [
        PERMISSIONS.VIEW_ROADMAPS
      ]
    };
    
    return rolePermissions[role] || [];
  };
  
  // Get permission display name
  export const getPermissionDisplayName = (permission) => {
    switch (permission) {
      case PERMISSIONS.VIEW_ROADMAPS:
        return 'View Roadmaps';
      case PERMISSIONS.CREATE_ROADMAP:
        return 'Create Roadmaps';
      case PERMISSIONS.EDIT_ROADMAP:
        return 'Edit Roadmaps';
      case PERMISSIONS.DELETE_ROADMAP:
        return 'Delete Roadmaps';
      case PERMISSIONS.VIEW_TECHSTACKS:
        return 'View Tech Stacks';
      case PERMISSIONS.CREATE_TECHSTACK:
        return 'Create Tech Stacks';
      case PERMISSIONS.EDIT_TECHSTACK:
        return 'Edit Tech Stacks';
      case PERMISSIONS.DELETE_TECHSTACK:
        return 'Delete Tech Stacks';
      case PERMISSIONS.UPDATE_STATUS:
        return 'Update Item Status';
      case PERMISSIONS.ADD_COMMENTS:
        return 'Add Comments';
      case PERMISSIONS.VIEW_STATS:
        return 'View Statistics';
      case PERMISSIONS.MANAGE_USERS:
        return 'Manage Users';
      default:
        return permission.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    }
  };