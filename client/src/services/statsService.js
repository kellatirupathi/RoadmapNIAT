// client/src/services/statsService.js
import api from './api';

// Get dashboard summary (for all roles)
const getDashboardSummary = async () => {
  try {
    return await api.get('/stats/dashboard');
  } catch (error) {
    console.error('Error fetching dashboard summary:', error);
    return {
      success: false,
      counts: { users: 0, techStacks: 0, roadmaps: 0, totalItems: 0 },
      itemStats: { 'Completed': 0, 'In Progress': 0, 'Yet to Start': 0 },
      progressPercentage: 0,
      recentActivity: [],
      userRoleCounts: {}
    };
  }
};

// Get tech stack stats with filters
const getTechStackStats = async (period = 'daily', date = null) => {
  try {
    let url = '/stats/techstacks';
    const params = new URLSearchParams();
    
    if (period) params.append('period', period);
    if (date) params.append('date', date);
    
    if (params.toString()) {
      url += `?${params.toString()}`;
    }
    
    return await api.get(url);
  } catch (error) {
    console.error('Error fetching tech stack stats:', error);
    return {
      success: false,
      stats: {
        total: 0,
        completed: { count: 0, percentage: 0 },
        inProgress: { count: 0, percentage: 0 },
        notStarted: { count: 0, percentage: 0 },
        techStackCount: 0,
      },
      period: period,
      date: date || new Date(), 
      recentActivity: []
    };
  }
};

// Get user activity stats
const getUserActivityStats = async (period = 'daily', date = null) => {
  try {
    let url = '/stats/user-activity';
    const params = new URLSearchParams();
    
    if (period) params.append('period', period);
    if (date) params.append('date', date);
    
    if (params.toString()) {
      url += `?${params.toString()}`;
    }
    
    return await api.get(url);
  } catch (error) {
    console.error('Error fetching user activity stats:', error);
    return {
      success: false,
      userActivity: [],
      activityTypes: [],
      period: period,
      date: new Date(),
      timeRange: {
        start: new Date(),
        end: new Date()
      }
    };
  }
};

// Get timeline stats
const getTimelineStats = async () => {
  try {
    return await api.get('/stats/timeline');
  } catch (error) {
    console.error('Error fetching timeline stats:', error);
    return {
      success: false,
      timelineStats: [],
      techStackProgress: [],
      recentComments: []
    };
  }
};

// Helper to format Date object to YYYY-MM-DD string using local date parts
const formatDateToLocalYYYYMMDD = (dateObj) => {
    if (!dateObj) return '';
    const year = dateObj.getFullYear();
    const month = (dateObj.getMonth() + 1).toString().padStart(2, '0');
    const day = dateObj.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
};

// Get instructor progress by date or date range
const getInstructorProgressByDate = async (dateParams) => {
  try {
    const params = new URLSearchParams();
    if (dateParams.date) { // Single date
        const formattedDate = formatDateToLocalYYYYMMDD(dateParams.date);
        params.append('date', formattedDate);
    } else if (dateParams.startDate && dateParams.endDate) { // Date range
        params.append('startDate', formatDateToLocalYYYYMMDD(dateParams.startDate));
        params.append('endDate', formatDateToLocalYYYYMMDD(dateParams.endDate));
    } else {
        // Fallback to current local date if nothing specific is sent
        params.append('date', formatDateToLocalYYYYMMDD(new Date()));
    }
    return await api.get(`/stats/instructor-progress?${params.toString()}`);
  } catch (error) {
    console.error('Error fetching instructor progress by date:', error);
    return {
      success: false,
      data: [], 
      error: error.response?.data?.error || error.message || 'Failed to fetch instructor progress'
    };
  }
};


const statsService = {
  getDashboardSummary,
  getTechStackStats,
  getUserActivityStats,
  getTimelineStats,
  getInstructorProgressByDate, 
};

export default statsService;