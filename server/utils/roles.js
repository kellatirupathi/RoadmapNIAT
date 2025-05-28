// server/utils/roles.js

// Define all available roles
export const ROLES = {
    ADMIN: 'admin',
    CONTENT: 'content',
    INSTRUCTOR: 'instructor',
    CRM: 'crm',
    MANAGER: 'manager'
  };
  
  // Define permissions for each role
  export const PERMISSIONS = {
    // Admin has all permissions
    [ROLES.ADMIN]: [
      'view_all_roadmaps',
      'create_roadmap',
      'edit_roadmap',
      'delete_roadmap',
      'view_all_techstacks',
      'create_techstack',
      'edit_techstack',
      'delete_techstack',
      'manage_users',
      'view_stats',
      'update_status',
      'add_comments',
      'view_all_comments',
      'delete_comments'
    ],
    
    // Content team can manage tech stacks
    [ROLES.CONTENT]: [
      'view_all_roadmaps',
      'view_all_techstacks',
      'create_techstack',
      'edit_techstack',
      'view_stats'
    ],
    
    // Instructor can update status and provide comments
    [ROLES.INSTRUCTOR]: [
      'view_all_roadmaps',
      'view_all_techstacks',
      'update_status',
      'add_comments',
      'view_timeline',
      'view_stats'
    ],
    
    // CRM can only view published roadmaps
    [ROLES.CRM]: [
      'view_published_roadmaps'
    ],
    
    // Manager can view stats and oversee progress
    [ROLES.MANAGER]: [
      'view_all_roadmaps',
      'view_all_techstacks',
      'view_stats',
      'view_timeline',
      'view_users',
      'view_all_comments'
    ]
  };
  
  // Check if a role has a specific permission
  export const hasPermission = (role, permission) => {
    if (!PERMISSIONS[role]) {
      return false;
    }
    
    return PERMISSIONS[role].includes(permission);
  };
  
  // Get all permissions for a role
  export const getRolePermissions = (role) => {
    return PERMISSIONS[role] || [];
  };
  
  // Get all available roles
  export const getAllRoles = () => {
    return Object.values(ROLES);
  };
  
  // Get role display name
  export const getRoleDisplayName = (role) => {
    switch (role) {
      case ROLES.ADMIN:
        return 'Administrator';
      case ROLES.CONTENT:
        return 'Content Team';
      case ROLES.INSTRUCTOR:
        return 'Instructor / ASE';
      case ROLES.CRM:
        return 'CRM / Companies';
      case ROLES.MANAGER:
        return 'Manager';
      default:
        return 'Unknown Role';
    }
  };