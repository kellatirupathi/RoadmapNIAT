import { useState, useEffect } from 'react';
import { 
  Button, 
  Alert, 
  Badge, 
  Modal, 
  Table, 
  Form, 
  Dropdown, 
  Spinner, 
  Card, 
  Row, 
  Col, 
  Container,
  InputGroup  // Add this import
} from 'react-bootstrap';
import TechStackDropdown from '../TechStackDropdown/TechStackDropdown';
import TechStackTable from '../TechStackTable/TechStackTable';
import { getAllTechStacks, getTechStackByName, getTechStackById, deleteAllTechStacks, updateTechStack } from '../../services/techStackService';
import { saveRoadmapMetadata, getAllRoadmaps } from '../../services/roadmapService';
import { uploadToGithub } from '../../services/githubService';
import { generateRoadmapHtml } from '../../utils/roadmapHtmlGenerator'; // IMPORT THE UTILITY

const Dashboard = ({ view = "dropdown-only" }) => {
  const [techStacks, setTechStacks] = useState([]);
  const [selectedTechStacks, setSelectedTechStacks] = useState([]);
  const [techStacksData, setTechStacksData] = useState([]);
  const [allTechStacksData, setAllTechStacksData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchCategory, setSearchCategory] = useState('all');
  const [stats, setStats] = useState({
    total: 0,
    completed: 0,
    inProgress: 0,
    notStarted: 0,
    totalTechStacks: 0
  });
  
  // State for stat details modal - improved modal with better layout
  const [showStatsModal, setShowStatsModal] = useState(false);
  const [modalTitle, setModalTitle] = useState('');
  const [modalData, setModalData] = useState([]);
  const [updatingItemIds, setUpdatingItemIds] = useState([]);
  
  // State for delete all confirmation modal
  const [showDeleteAllModal, setShowDeleteAllModal] = useState(false);
  const [deleteAllLoading, setDeleteAllLoading] = useState(false);
  const [savedRoadmapsLoading, setSavedRoadmapsLoading] = useState(true);

  // State for add company modal - NEW
  const [showAddCompanyModal, setShowAddCompanyModal] = useState(false);

  // Modified state for company roadmap creation to support multiple roles
  const [companies, setCompanies] = useState([
    { 
      id: 1, 
      name: '', 
      roles: [
        { id: 1, title: '', selectedTechStacks: [] }
      ]
    }
  ]);
  
  const [savedRoadmaps, setSavedRoadmaps] = useState([]);
  
  // State for selected role in saved roadmaps
  const [selectedRoadmapRole, setSelectedRoadmapRole] = useState('All');
  
  // States for direct GitHub upload
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [filename, setFilename] = useState('');
  const [uploadLoading, setUploadLoading] = useState(false);
  const [uploadError, setUploadError] = useState(null);
  const [publishedUrl, setPublishedUrl] = useState('');
  const [roadmapHtml, setRoadmapHtml] = useState('');
  
  // Current roadmap data
  const [currentRoadmapData, setCurrentRoadmapData] = useState({
    companyName: '',
    role: '',
    techStacksData: [],
    isConsolidated: false,
    roles: []
  });

  // Fetch all tech stack names for the dropdown and all tech stack data for display
  useEffect(() => {
    const fetchTechStacks = async () => {
      try {
        setLoading(true);
        setSavedRoadmapsLoading(true);
        
        const response = await getAllTechStacks();
        setTechStacks(response.data);
        
        if (response.data.length > 0) {
          const fetchPromises = response.data.map(stack => getTechStackById(stack._id));
          const results = await Promise.allSettled(fetchPromises);
          
          const successfulData = results
            .filter(result => result.status === 'fulfilled')
            .map(result => result.value.data);
          
          setAllTechStacksData(successfulData);
          
          calculateOverallStats(successfulData);
        }
        
        try {
          // Get all roadmaps with complete data
          const roadmapsResponse = await getAllRoadmaps();
          if (roadmapsResponse && roadmapsResponse.data) {
            // Make sure we have all the necessary fields
            const roadmapsWithAllFields = roadmapsResponse.data.map(roadmap => ({
              ...roadmap,
              // Ensure these fields exist, provide defaults if they don't
              roles: roadmap.roles || [],
              publishedUrl: roadmap.publishedUrl || '#',
              filename: roadmap.filename || 'unknown',
              techStacks: roadmap.techStacks || [],
              createdDate: roadmap.createdDate || new Date().toISOString()
            }));
            setSavedRoadmaps(roadmapsWithAllFields);
          }
        } catch (err) {
          console.error('Failed to fetch roadmaps:', err);
        } finally {
          setSavedRoadmapsLoading(false);
        }
        
        setLoading(false);
      } catch (err) {
        setError('Failed to fetch tech stacks');
        setLoading(false);
        setSavedRoadmapsLoading(false);
      }
    };
  
    fetchTechStacks();
  }, []);

  // Calculate overall stats from all tech stacks
  const calculateOverallStats = (techStacksData) => {
    const newStats = {
      total: 0,
      completed: 0,
      inProgress: 0,
      notStarted: 0,
      totalTechStacks: techStacksData.length
    };
    
    techStacksData.forEach(stack => {
      stack.roadmapItems.forEach(item => {
        newStats.total++;
        switch (item.completionStatus) {
          case 'Completed':
            newStats.completed++;
            break;
          case 'In Progress':
            newStats.inProgress++;
            break;
          case 'Yet to Start':
          default:
            newStats.notStarted++;
            break;
        }
      });
    });
    
    setStats(newStats);
  };

  // Fetch data for selected tech stacks when selection changes
  useEffect(() => {
    const fetchSelectedTechStacksData = async () => {
      if (selectedTechStacks.length > 0) {
        setLoading(true);
        
        try {
          const promises = selectedTechStacks.map(name => getTechStackByName(name));
          
          const results = await Promise.allSettled(promises);
          
          const successfulData = results
            .filter(result => result.status === 'fulfilled')
            .map(result => result.value.data);
          
          setTechStacksData(successfulData);
          
          const rejectedCount = results.filter(result => result.status === 'rejected').length;
          if (rejectedCount > 0) {
            setError(`Failed to fetch data for ${rejectedCount} tech stack(s)`);
          } else {
            setError(null);
          }
        } catch (err) {
          setError('An error occurred while fetching tech stack data');
        } finally {
          setLoading(false);
        }
      } else {
        setTechStacksData([]);
      }
    };

    fetchSelectedTechStacksData();
  }, [selectedTechStacks]);

  // Handle tech stack selection
  const handleTechStackSelect = (selectedNames) => {
    setSelectedTechStacks(selectedNames);
  };

  // Company name change handler
  const handleCompanyNameChange = (companyId, name) => {
    setCompanies(prevCompanies => 
      prevCompanies.map(company => 
        company.id === companyId ? { ...company, name } : company
      )
    );
  };

  // Role title change handler
  const handleRoleTitleChange = (companyId, roleId, title) => {
    setCompanies(prevCompanies => 
      prevCompanies.map(company => 
        company.id === companyId ? {
          ...company,
          roles: company.roles.map(role => 
            role.id === roleId ? { ...role, title } : role
          )
        } : company
      )
    );
  };

  // Handle tech stack selection for a specific role
  const handleRoleTechStackSelect = (companyId, roleId, selectedNames) => {
    setCompanies(prevCompanies => 
      prevCompanies.map(company => 
        company.id === companyId ? {
          ...company,
          roles: company.roles.map(role => 
            role.id === roleId ? { ...role, selectedTechStacks: selectedNames } : role
          )
        } : company
      )
    );
  };

  // Add a new company
  const addCompany = () => {
    const newId = companies.length > 0 
      ? Math.max(...companies.map(company => company.id)) + 1 
      : 1;
    
    setCompanies([
      ...companies,
      { 
        id: newId, 
        name: '', 
        roles: [
          { id: 1, title: '', selectedTechStacks: [] }
        ]
      }
    ]);
  };

  // Remove a company
  const removeCompany = (companyId) => {
    setCompanies(prevCompanies => 
      prevCompanies.filter(company => company.id !== companyId)
    );
  };

  // Add a new role to a company
  const addRole = (companyId) => {
    setCompanies(prevCompanies => 
      prevCompanies.map(company => {
        if (company.id === companyId) {
          const newRoleId = company.roles.length > 0
            ? Math.max(...company.roles.map(role => role.id)) + 1
            : 1;
          
          return {
            ...company,
            roles: [
              ...company.roles,
              { id: newRoleId, title: '', selectedTechStacks: [] }
            ]
          };
        }
        return company;
      })
    );
  };

  // Remove a role from a company
  const removeRole = (companyId, roleId) => {
    setCompanies(prevCompanies => 
      prevCompanies.map(company => {
        if (company.id === companyId) {
          // Don't remove the last role
          if (company.roles.length <= 1) {
            return company;
          }
          
          return {
            ...company,
            roles: company.roles.filter(role => role.id !== roleId)
          };
        }
        return company;
      })
    );
  };

  // Generate roadmap for a specific role - Modified to properly generate HTML first
  const generateRoadmap = async (company, role) => {
    if (!company.name.trim() || !role.title.trim() || role.selectedTechStacks.length === 0) {
      setError('Please provide company name, role, and select at least one tech stack');
      return;
    }

    setLoading(true);
    try {
      // Fetch full data for selected tech stacks
      const promises = role.selectedTechStacks.map(name => getTechStackByName(name));
      const results = await Promise.allSettled(promises);
      
      // Filter successful results and extract data
      const techStacksData = results
        .filter(result => result.status === 'fulfilled')
        .map(result => result.value.data);
      
      if (techStacksData.length === 0) {
        throw new Error('Failed to fetch tech stack data');
      }

      // Create a role object in the same format as used for consolidated roadmaps
      const singleRole = {
        title: role.title,
        techStacks: techStacksData
      };

      // Set current roadmap data
      setCurrentRoadmapData({
        companyName: company.name,
        role: role.title,
        techStacksData: techStacksData,
        isConsolidated: false,
        roles: [singleRole] // Put the single role in the roles array
      });
      
      // Set filename using NIAT_X_CompanyName format
      setFilename(`NIAT_X_${company.name.replace(/\\s+/g, '_')}`);
      
      // Generate HTML content first
      const html = generateRoadmapHtml(company.name, [singleRole], techStacksData);
      console.log('Generated HTML length:', html ? html.length : 0);
      
      if (!html || html.length === 0) {
        throw new Error('Failed to generate roadmap HTML content');
      }
      
      // Set the generated HTML to state
      setRoadmapHtml(html);
      
      // Show success message
      setSuccess('Roadmap content generated successfully!');
      
      // Now show the upload modal
      setShowUploadModal(true);
      
      setLoading(false);
    } catch (err) {
      console.error('Error generating roadmap:', err);
      setError('Failed to generate roadmap: ' + (err.message || 'Unknown error'));
      setLoading(false);
    }
  };

  // Generate consolidated roadmap for all roles in a company - Modified to properly generate HTML first
  const generateConsolidatedRoadmap = async (company) => {
    if (!company.name.trim()) {
      setError('Please provide company name');
      return;
    }

    // Check if at least one role has tech stacks selected
    const hasSelectedTechStacks = company.roles.some(role => 
      role.title.trim() && role.selectedTechStacks.length > 0
    );

    if (!hasSelectedTechStacks) {
      setError('Please provide at least one role with tech stacks');
      return;
    }

    setLoading(true);
    try {
      // Gather all unique tech stack names across roles
      const allTechStackNames = [...new Set(
        company.roles.flatMap(role => role.selectedTechStacks)
      )];
      
      // Fetch full data for all selected tech stacks
      const promises = allTechStackNames.map(name => getTechStackByName(name));
      const results = await Promise.allSettled(promises);
      
      // Filter successful results and extract data
      const allTechStacksData = results
        .filter(result => result.status === 'fulfilled')
        .map(result => result.value.data);
      
      if (allTechStacksData.length === 0) {
        throw new Error('Failed to fetch tech stack data');
      }

      // Prepare roles data with their tech stacks
      const rolesData = company.roles
        .filter(role => role.title.trim() && role.selectedTechStacks.length > 0)
        .map(role => {
          const roleTechStacks = allTechStacksData.filter(stack => 
            role.selectedTechStacks.includes(stack.name)
          );
          
          return {
            title: role.title,
            techStacks: roleTechStacks
          };
        });

      // Set current roadmap data
      setCurrentRoadmapData({
        companyName: company.name,
        role: 'Consolidated',
        techStacksData: allTechStacksData,
        isConsolidated: true,
        roles: rolesData
      });
      
      // Set filename using NIAT_X_CompanyName format
      setFilename(`NIAT_X_${company.name.replace(/\\s+/g, '_')}`);
      
      // Generate HTML first
      const html = generateRoadmapHtml(company.name, rolesData, allTechStacksData);
      console.log('Generated consolidated HTML length:', html ? html.length : 0);
      
      if (!html || html.length === 0) {
        throw new Error('Failed to generate consolidated roadmap HTML content');
      }
      
      // Set the generated HTML to state
      setRoadmapHtml(html);
      
      // Show the upload modal
      setShowUploadModal(true);
      
      setLoading(false);
    } catch (err) {
      console.error('Error generating consolidated roadmap:', err);
      setError('Failed to generate consolidated roadmap: ' + (err.message || 'Unknown error'));
      setLoading(false);
    }
  };

  // Save roadmap metadata after successful upload
  const handleRoadmapSaved = (roadmapData) => {
    try {
      // Save to database
      const metadata = {
        companyName: currentRoadmapData.companyName,
        role: currentRoadmapData.role || 'Consolidated',
        techStacks: currentRoadmapData.techStacksData.map(stack => stack.name),
        publishedUrl: roadmapData.publishedUrl,
        filename: roadmapData.filename,
        createdDate: new Date().toISOString(),
        isConsolidated: currentRoadmapData.isConsolidated || false,
        roles: currentRoadmapData.roles || []
      };

      saveRoadmapMetadata(metadata)
        .then(response => {
          // Add to saved roadmaps
          setSavedRoadmaps(prev => [response.data, ...prev]);
          
          // Reset current roadmap data
          setCurrentRoadmapData({
            companyName: '',
            role: '',
            techStacksData: [],
            isConsolidated: false,
            roles: []
          });
          
        })
        .catch(err => {
          setError('Failed to save roadmap metadata');
        });
    } catch (err) {
      setError('Failed to save roadmap metadata');
    }
  };
  
  // Close the upload modal
  const handleCloseUploadModal = () => {
    setShowUploadModal(false);
    setUploadError(null);
    setPublishedUrl('');
  };

  // Enhanced and fixed handleUploadToGithub function
  const handleUploadToGithub = async () => {
    if (!filename.trim()) {
      setUploadError('Please enter a file name');
      return;
    }
    
    if (!roadmapHtml || roadmapHtml.trim() === '') {
      setUploadError('No content to upload. Please generate roadmap content first.');
      return;
    }
    
    try {
      setUploadLoading(true);
      setUploadError(null);
      
      // Log values before sending to check if they exist
      console.log('Uploading with filename:', filename);
      console.log('Content length:', roadmapHtml.length);
      
      const response = await uploadToGithub({
        filename: filename.trim().endsWith('.html') ? filename.trim() : `${filename.trim()}.html`,
        content: roadmapHtml,
        description: `${filename.trim()} Roadmap: ${currentRoadmapData.techStacksData.map(stack => stack.name).join(', ')}`
      });
      
      setPublishedUrl(response.html_url || response.url);
      setUploadLoading(false);
      
      // Call handleRoadmapSaved with the necessary data
      handleRoadmapSaved({
        publishedUrl: response.html_url || response.url,
        filename: filename.trim().endsWith('.html') ? filename.trim() : `${filename.trim()}.html`,
        techStacks: currentRoadmapData.techStacksData.map(stack => stack.name)
      });
    } catch (err) {
      console.error('GitHub upload error:', err);
      setUploadError('Failed to upload to GitHub: ' + (err.response?.data?.error || err.message || 'Unknown error'));
      setUploadLoading(false);
    }
  };

// Premium Advanced Roadmap HTML Generator with professional designer color palette
const generateRoadmapHtml = (companyName, roles, techStacksData) => {
  try {
    const roadmapTitle = `NIAT_X_${companyName}`;
    
    let html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${roadmapTitle}</title>
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&display=swap');
    
    :root {
      /* Professional Designer Color Palette - More Diverse & Visually Distinct */
      
      /* Primary Brand Colors */
      --primary-dark: #0F2C59;      /* Dark navy blue for main header */
      --primary: #1D5B79;           /* Teal blue for section headers */
      --primary-light: #2D9596;     /* Vibrant teal for accents */
      
      /* Secondary Colors */
      --secondary-dark: #553C9A;    /* Deep purple for active tabs */
      --secondary: #6D28D9;         /* Medium purple for section headers */
      --secondary-light: #A78BFA;   /* Light purple for hover states */
      
      /* Accent Colors - For Visual Interest */
      --accent-1: #065A82;          /* Deep blue accent */
      --accent-2: #F97316;          /* Orange accent for CTA buttons */
      --accent-3: #0891B2;          /* Cyan blue for progress bars */
      
      /* Status Colors - Carefully Calibrated for Accessibility */
      --completed: #10b981;         /* Emerald green */
      --completed-bg: rgba(16, 185, 129, 0.12);
      --completed-border: rgba(16, 185, 129, 0.25);
      
      --in-progress: #f59e0b;       /* Amber */
      --in-progress-bg: rgba(245, 158, 11, 0.12);
      --in-progress-border: rgba(245, 158, 11, 0.25);
      
      --not-started: #ef4444;       /* Red */
      --not-started-bg: rgba(239, 68, 68, 0.12);
      --not-started-border: rgba(239, 68, 68, 0.25);
      
      /* Neutrals - For Balance and Readability */
      --neutral-50: #f8fafc;        /* Lightest gray */
      --neutral-100: #f1f5f9;       /* Very light gray */
      --neutral-200: #e2e8f0;       /* Light gray */
      --neutral-300: #cbd5e1;       /* Medium light gray */
      --neutral-400: #94a3b8;       /* Medium gray */
      --neutral-500: #64748b;       /* Medium dark gray */
      --neutral-600: #475569;       /* Dark gray */
      --neutral-700: #334155;       /* Very dark gray */
      --neutral-800: #1e293b;       /* Almost black */
      --neutral-900: #0f172a;       /* True dark */
      
      /* Text Colors */
      --text-primary: #1e293b;      /* Dark slate for main text */
      --text-secondary: #475569;    /* Slate for secondary text */
      --text-tertiary: #64748b;     /* Lighter slate for tertiary text */
      --text-light: #f8fafc;        /* White text for dark backgrounds */
      
      /* Background Colors */
      --bg-primary: #f8fafc;        /* Very light slate for main background */
      --bg-secondary: #ffffff;      /* Pure white for cards */
      
      /* UI Elements */
      --border-light: #e2e8f0;
      --border-medium: #cbd5e1;
      --border-dark: #94a3b8;
      
      /* Gradients - For Visual Richness */
      --header-gradient: linear-gradient(135deg, var(--primary-dark) 0%, var(--primary) 100%);
      --tab-active-gradient: linear-gradient(to bottom, var(--secondary) 0%, var(--secondary-dark) 100%);
      --table-header-gradient: linear-gradient(to bottom, var(--primary) 0%, var(--primary-dark) 100%);
      --progress-gradient: linear-gradient(90deg, var(--accent-3) 0%, var(--primary-light) 100%);
      
      /* Effects */
      --shadow-sm: 0 1px 2px rgba(0,0,0,0.05);
      --shadow-md: 0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -1px rgba(0,0,0,0.06);
      --shadow-lg: 0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -2px rgba(0,0,0,0.05);
      --shadow-inner: inset 0 2px 4px 0 rgba(0,0,0,0.06);
      
      --border-radius-sm: 4px;
      --border-radius: 8px;
      --border-radius-lg: 12px;
      --border-radius-full: 9999px;
      
      --transition-fast: all 0.2s ease;
      --transition: all 0.3s ease;
      --scroll-behavior: smooth;
    }
    
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    html {
      scroll-behavior: var(--scroll-behavior);
    }
    
    body {
      font-family: 'Outfit', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
      color: var(--text-primary);
      line-height: 1.6;
      background-color: var(--bg-primary);
      font-size: 16px;
    }
    
    /* Header */
    .header {
      background: var(--header-gradient);
      color: var(--text-light);
      box-shadow: var(--shadow-md);
      position: relative;
    }
    
    .header::after {
      content: '';
      position: absolute;
      bottom: 0;
      left: 0;
      width: 100%;
      height: 4px;
      background: var(--primary-light);
    }
    
    .header-container {
      max-width: 1280px;
      margin: 0 auto;
      padding: 0 20px;
      text-align: center;
    }
    
    .header h1 {
      font-size: 2rem;
      font-weight: 700;
      color: var(--text-light);
      margin: 0;
      letter-spacing: 0.5px;
    }
    
    /* Tabs */
    .tabs-container {
      padding: 0;
      position: sticky;
      top: 0;
      z-index: 1000;
      background-color: var(--bg-secondary);
      box-shadow: var(--shadow-sm);
    }
    
    .tabs-wrapper {
      max-width: 1280px;
      margin: 0 auto;
      display: flex;
      flex-wrap: wrap;
      gap: 4px;
      background-color: var(--bg-secondary);
      padding: 0 20px;
      position: relative;
      z-index: 2;
    }
    
    .role-tab {
      padding: 14px 24px;
      background-color: var(--bg-secondary);
      color: var(--text-secondary);
      font-weight: 500;
      font-size: 0.95rem;
      border: 1px solid var(--border-light);
      border-bottom: none;
      margin-right: 5px;
      border-top-left-radius: var(--border-radius);
      border-top-right-radius: var(--border-radius);
      text-align: center;
      min-width: auto;
      position: relative;
      top: 1px;
      cursor: pointer;
      transition: var(--transition);
    }
    
    .role-tab:hover {
      background-color: var(--neutral-100);
      color: var(--secondary);
      transform: translateY(-2px);
    }
    
    .role-tab.active {
      background: var(--tab-active-gradient);
      color: var(--text-light);
      font-weight: 600;
      border-color: var(--secondary-dark);
      box-shadow: 0 -2px 6px rgba(0,0,0,0.1);
    }
    
    /* Content */
    .content-container {
      max-width: 1280px;
      margin: 0 auto;
      padding: 28px 20px;
      scroll-margin-top: 60px; /* Space for fixed header */
    }
    
    /* Tech Stack Section */
    .tech-stack-section {
      margin-bottom: 36px;
      background-color: var(--bg-secondary);
      border-radius: var(--border-radius-lg);
      box-shadow: var(--shadow-md);
      overflow: hidden;
      border: 1px solid var(--border-light);
      transition: var(--transition);
    }
    
    .tech-stack-section:hover {
      box-shadow: var(--shadow-lg);
      transform: translateY(-2px);
    }
    
    .tech-stack-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 8px 24px;
      background-color: var(--neutral-100);
      border-bottom: 1px solid var(--border-light);
    }
    
    .tech-stack-title {
      display: flex;
      align-items: center;
      gap: 14px;
      font-size: 1.35rem;
      font-weight: 600;
      color: var(--primary);
    }
    
    .tech-stack-icon {
      width: 24px;
      height: 24px;
      color: var(--primary-light);
    }
    
    .progress-container {
      display: flex;
      align-items: center;
      gap: 16px;
    }
    
    .progress-bar-container {
      width: 160px;
      height: 10px;
      background-color: var(--neutral-200);
      border-radius: var(--border-radius-full);
      overflow: hidden;
      box-shadow: var(--shadow-inner);
    }
    .progress-bar-fill {
      height: 100%;
      background: var(--progress-gradient);
      border-radius: var(--border-radius-full);
      transition: width 0.6s cubic-bezier(0.34, 1.56, 0.64, 1);
    }
    
    .progress-text {
      font-size: 0.9rem;
      font-weight: 600;
      color: var(--text-secondary);
    }
    
    /* Table */
    .table-container {
      overflow-x: auto;
      border-radius: 0 0 var(--border-radius-lg) var(--border-radius-lg);
    }
    
    .roadmap-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 0.95rem;
    }
    
    .roadmap-table th {
      background: var(--table-header-gradient);
      color: var(--text-light);
      font-weight: 600;
      text-align: left;
      padding: 16px 24px;
      font-size: 0.85rem;
      letter-spacing: 0.5px;
      text-transform: uppercase;
      position: sticky;
      top: 0;
      z-index: 10;
    }
    
    .roadmap-table th:first-child {
      border-top-left-radius: 0;
    }
    
    .roadmap-table th:last-child {
      border-top-right-radius: 0;
    }
    
    .roadmap-table tr {
      transition: var(--transition-fast);
    }
    
    .roadmap-table tr:nth-child(even) {
      background-color: var(--neutral-50);
    }
    
    .roadmap-table tr:hover {
      background-color: rgba(109, 40, 217, 0.05);
    }
    
    .roadmap-table td {
      padding: 18px 24px;
      border-bottom: 1px solid var(--border-light);
      vertical-align: top;
    }
    
    .roadmap-table tr:last-child td {
      border-bottom: none;
    }
    
    .topic-cell {
      font-weight: 600;
      color: var(--text-primary);
    }
    
    /* Status Badges */
    .status-badge {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      padding: 8px 16px;
      border-radius: var(--border-radius-full);
      font-size: 0.8rem;
      font-weight: 600;
      white-space: nowrap;
      box-shadow: var(--shadow-sm);
      transition: var(--transition-fast);
    }
    
    .status-badge:hover {
      transform: translateY(-1px);
      box-shadow: var(--shadow-md);
    }
    
    .status-completed {
      background-color: var(--completed-bg);
      color: var(--completed);
      border: 1px solid var(--completed-border);
    }
    
    .status-in-progress {
      background-color: var(--in-progress-bg);
      color: var(--in-progress);
      border: 1px solid var(--in-progress-border);
    }
    
    .status-not-started {
      background-color: var(--not-started-bg);
      color: var(--not-started);
      border: 1px solid var(--not-started-border);
    }
    
    /* Lists */
    ul.item-list {
      margin: 0;
      padding: 0;
      list-style-type: none;
    }
    
    ul.item-list li {
      position: relative;
      padding-left: 20px;
      margin-bottom: 10px;
      font-size: 0.95rem;
      color: var(--text-secondary);
    }
    
    ul.item-list li:last-child {
      margin-bottom: 0;
    }
    
    ul.item-list li:before {
      content: "•";
      position: absolute;
      left: 0;
      color: var(--primary-light);
      font-weight: bold;
      font-size: 1.2rem;
    }
    
    /* Empty State */
    .empty-state {
      padding: 48px 24px;
      text-align: center;
      color: var(--text-tertiary);
    }
    
    .empty-state i {
      font-size: 3rem;
      margin-bottom: 20px;
      color: var(--neutral-400);
      opacity: 0.8;
    }
    
    .empty-state p {
      font-size: 1.1rem;
      max-width: 400px;
      margin: 0 auto;
    }
    
    /* Scroll to top button */
    .scroll-top-btn {
      position: fixed;
      bottom: 30px;
      right: 30px;
      width: 50px;
      height: 50px;
      background-color: var(--primary);
      color: var(--text-light);
      border: none;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      opacity: 0;
      visibility: hidden;
      transition: var(--transition);
      box-shadow: var(--shadow-md);
      z-index: 100;
    }
    
    .scroll-top-btn:hover {
      background-color: var(--primary-dark);
      transform: translateY(-3px);
      box-shadow: var(--shadow-lg);
    }
    
    .scroll-top-btn.visible {
      opacity: 1;
      visibility: visible;
    }
    
    .scroll-top-btn i {
      font-size: 1.2rem;
    }
    
    /* Responsive Adjustments */
    @media (max-width: 768px) {
      .header h1 {
        font-size: 1.6rem;
      }
      
      .tech-stack-header {
        flex-direction: column;
        align-items: flex-start;
        gap: 14px;
      }
      
      .progress-container {
        width: 100%;
      }
      
      .progress-bar-container {
        flex: 1;
        max-width: 100%;
      }
      
      .role-tab {
        padding: 12px 16px;
        font-size: 0.9rem;
      }
      
      .roadmap-table th,
      .roadmap-table td {
        padding: 16px 18px;
      }
      
      .tabs-wrapper {
        padding: 0 14px;
        overflow-x: auto;
        flex-wrap: nowrap;
      }
      
      .scroll-top-btn {
        width: 40px;
        height: 40px;
        bottom: 20px;
        right: 20px;
      }
    }
    
    @media (max-width: 576px) {
      .content-container {
        padding: 20px 14px;
      }
      
      .tabs-wrapper {
        padding: 0 10px;
      }
      
      .role-tab {
        padding: 10px 14px;
        font-size: 0.85rem;
      }
      
      .tech-stack-title {
        font-size: 1.2rem;
      }
      
      .tech-stack-header {
        padding: 16px 18px;
      }
      
      .roadmap-table th,
      .roadmap-table td {
        padding: 14px 16px;
      }
    }
  </style>
</head>
<body>
  <header class="header" id="top">
    <div class="header-container">
      <h1>${roadmapTitle}</h1>
    </div>
  </header>
  
  <div class="tabs-container">
    <div class="tabs-wrapper">
      ${roles.map((role, index) => `
        <div class="role-tab ${index === 0 ? 'active' : ''}" onclick="showRole(${index})">
          ${role.title}
        </div>
      `).join('')}
    </div>
  </div>
  
  ${roles.map((role, roleIndex) => `
    <div class="role-section" id="role-${roleIndex}" style="display: ${roleIndex === 0 ? 'block' : 'none'};">
      <div class="content-container">
        ${role.techStacks.map(techStack => {
          const percentComplete = techStack.roadmapItems.length > 0 
            ? Math.round((techStack.roadmapItems.reduce((count, item) => 
                count + (item.completionStatus === 'Completed' ? 1 : 0), 0) / techStack.roadmapItems.length) * 100) 
            : 0;
            
          // Get custom headers from techStack or use defaults
          const headers = techStack.headers || {
            topic: "Topic",
            subTopics: "Sub-Topics",
            projects: "Projects",
            status: "Status"
          };
          
          // Get icon based on tech stack name
          let iconClass = 'fa-solid fa-code';
          if (techStack.name.toLowerCase().includes('python')) {
            iconClass = 'fa-brands fa-python';
          } else if (techStack.name.toLowerCase().includes('javascript') || techStack.name.toLowerCase().includes('js')) {
            iconClass = 'fa-brands fa-js';
          } else if (techStack.name.toLowerCase().includes('react')) {
            iconClass = 'fa-brands fa-react';
          } else if (techStack.name.toLowerCase().includes('node')) {
            iconClass = 'fa-brands fa-node-js';
          } else if (techStack.name.toLowerCase().includes('java')) {
            iconClass = 'fa-brands fa-java';
          } else if (techStack.name.toLowerCase().includes('html')) {
            iconClass = 'fa-brands fa-html5';
          } else if (techStack.name.toLowerCase().includes('css')) {
            iconClass = 'fa-brands fa-css3-alt';
          } else if (techStack.name.toLowerCase().includes('angular')) {
            iconClass = 'fa-brands fa-angular';
          } else if (techStack.name.toLowerCase().includes('vue')) {
            iconClass = 'fa-brands fa-vuejs';
          } else if (techStack.name.toLowerCase().includes('php')) {
            iconClass = 'fa-brands fa-php';
          } else if (techStack.name.toLowerCase().includes('database') || techStack.name.toLowerCase().includes('sql')) {
            iconClass = 'fa-solid fa-database';
          } else if (techStack.name.toLowerCase().includes('cloud')) {
            iconClass = 'fa-solid fa-cloud';
          } else if (techStack.name.toLowerCase().includes('docker')) {
            iconClass = 'fa-brands fa-docker';
          } else if (techStack.name.toLowerCase().includes('git')) {
            iconClass = 'fa-brands fa-git-alt';
          } else if (techStack.name.toLowerCase().includes('aws')) {
            iconClass = 'fa-brands fa-aws';
          } else if (techStack.name.toLowerCase().includes('dynamics')) {
            iconClass = 'fa-solid fa-chart-line';
          } else if (techStack.name.toLowerCase().includes('mern')) {
            iconClass = 'fa-brands fa-node';
          } else if (techStack.name.toLowerCase().includes('.net')) {
            iconClass = 'fa-solid fa-code';
          }
            
          return `
          <div class="tech-stack-section">
            <div class="tech-stack-header">
              <div class="tech-stack-title">
                <i class="${iconClass} tech-stack-icon"></i>
                ${techStack.name}
              </div>
              <div class="progress-container">
                <div class="progress-bar-container">
                  <div class="progress-bar-fill" style="width: ${percentComplete}%;"></div>
                </div>
                <span class="progress-text">${percentComplete}% Complete</span>
              </div>
            </div>
            <div class="table-container">
              <table class="roadmap-table">
                <thead>
                  <tr>
                    <th width="20%">${headers.topic.toUpperCase()}</th>
                    <th width="30%">${headers.subTopics.toUpperCase()}</th>
                    <th width="30%">${headers.projects.toUpperCase()}</th>
                    <th width="10%">${headers.status.toUpperCase()}</th>
                  </tr>
                </thead>
                <tbody>
                  ${techStack.roadmapItems.length > 0 ? 
                    techStack.roadmapItems.map(item => {
                      let statusClass = '';
                      let statusIcon = '';
                      
                      switch (item.completionStatus) {
                        case 'Completed':
                          statusClass = 'status-completed';
                          statusIcon = 'fa-check-circle';
                          break;
                        case 'In Progress':
                          statusClass = 'status-in-progress';
                          statusIcon = 'fa-clock';
                          break;
                        case 'Yet to Start':
                        default:
                          statusClass = 'status-not-started';
                          statusIcon = 'fa-circle-exclamation';
                          break;
                      }
                      
                      return `
                      <tr>
                        <td class="topic-cell">${item.topic}</td>
                        <td>
                          ${item.subTopics.length > 0 && item.subTopics.some(s => s.name) ? `
                          <ul class="item-list">
                            ${item.subTopics.map(subtopic => subtopic.name ? `<li>${subtopic.name}</li>` : '').join('')}
                          </ul>
                          ` : ''}
                        </td>
                        <td>
                          ${item.projects.length > 0 && item.projects.some(p => p.name) ? `
                          <ul class="item-list">
                            ${item.projects.map(project => project.name ? `<li>${project.name}</li>` : '').join('')}
                          </ul>
                          ` : ''}
                        </td>
                        <td>
                          <span class="status-badge ${statusClass}">
                            <i class="fa-solid ${statusIcon}"></i>
                            ${item.completionStatus}
                          </span>
                        </td>
                      </tr>
                      `;
                    }).join('') : 
                    `
                    <tr>
                      <td colspan="4">
                        <div class="empty-state">
                          <i class="fa-solid fa-clipboard-list"></i>
                          <p>No roadmap items found for this tech stack</p>
                        </div>
                      </td>
                    </tr>
                    `
                  }
                </tbody>
              </table>
            </div>
          </div>
          `;
        }).join('')}
      </div>
    </div>
  `).join('')}
  
  <!-- Scroll to top button -->
  <button class="scroll-top-btn" id="scrollTopBtn" title="Scroll to top">
    <i class="fa-solid fa-arrow-up"></i>
  </button>
  
  <script>
    // Tab switching function with smooth scroll to top
    function showRole(roleIndex) {
      // Hide all role sections
      document.querySelectorAll('.role-section').forEach(section => {
        section.style.display = 'none';
      });
      
      // Show the selected role section
      document.getElementById('role-' + roleIndex).style.display = 'block';
      
      // Update active tab
      document.querySelectorAll('.role-tab').forEach((tab, index) => {
        if (index === roleIndex) {
          tab.classList.add('active');
        } else {
          tab.classList.remove('active');
        }
      });
      
      // Smooth scroll to top of content
      window.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
    }
    
    // Scroll to top button functionality
    const scrollButton = document.getElementById('scrollTopBtn');
    
    // Show button when page is scrolled down
    window.addEventListener('scroll', () => {
      if (window.pageYOffset > 300) {
        scrollButton.classList.add('visible');
      } else {
        scrollButton.classList.remove('visible');
      }
    });
    
    // Scroll to top when button clicked
    scrollButton.addEventListener('click', () => {
      window.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
    });
    
    // Check initial scroll position on page load
    window.addEventListener('load', () => {
      if (window.pageYOffset > 300) {
        scrollButton.classList.add('visible');
      }
    });
  </script>
</body>
</html>
`;
    
    return html;
  } catch (err) {
    console.error('Failed to generate roadmap HTML:', err);
    return '';
  }
};


  // Handle tech stack data update
  const handleTechStackUpdated = (updatedTechStack) => {
    // Update the specific tech stack in the data array
    setTechStacksData(prevData => {
      return prevData.map(techStack => 
        techStack._id === updatedTechStack._id ? updatedTechStack : techStack
      );
    });
    
    // Also update in the allTechStacksData array
    setAllTechStacksData(prevData => {
      const updated = prevData.map(techStack => 
        techStack._id === updatedTechStack._id ? updatedTechStack : techStack
      );
      
      // Recalculate stats
      calculateOverallStats(updated);
      
      return updated;
    });
  };
  
  // Handle tech stack deletion
  const handleTechStackDeleted = (deletedId) => {
    // Remove the deleted tech stack from all tech stacks data
    setAllTechStacksData(prevData => {
      const updated = prevData.filter(techStack => techStack._id !== deletedId);
      
      // Recalculate stats
      calculateOverallStats(updated);
      
      return updated;
    });
    
    // Also remove from selected tech stacks if present
    setTechStacksData(prevData => 
      prevData.filter(techStack => techStack._id !== deletedId)
    );
    
    // Update tech stacks list
    setTechStacks(prevStacks => 
      prevStacks.filter(stack => stack._id !== deletedId)
    );
  };
  
  // Handle search input change
  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };
  
  // Handle search category change
  const handleSearchCategoryChange = (category) => {
    setSearchCategory(category);
  };
  
  // Handle delete all tech stacks
  const handleDeleteAllTechStacks = async () => {
    try {
      setDeleteAllLoading(true);
      await deleteAllTechStacks();
      
      // Clear all data
      setAllTechStacksData([]);
      setTechStacksData([]);
      setTechStacks([]);
      setSelectedTechStacks([]);
      
      // Reset stats
      setStats({
        total: 0,
        completed: 0,
        inProgress: 0,
        notStarted: 0,
        totalTechStacks: 0
      });
      
      setDeleteAllLoading(false);
      setShowDeleteAllModal(false);
      
      // Show success message
      setError(null);
      setSuccess('All tech stacks have been deleted successfully');
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError('Failed to delete all tech stacks');
      setDeleteAllLoading(false);
      setShowDeleteAllModal(false);
    }
  };
  
  // Show all tech stacks details
  const showAllTechStacksDetails = () => {
    setModalTitle("All Techstacks");
    
    // Generate data for each tech stack with a summary of topics and editing capability
    const data = [];
    
    allTechStacksData.forEach(stack => {
      const totalTopics = stack.roadmapItems.length;
      const completedTopics = stack.roadmapItems.filter(item => item.completionStatus === 'Completed').length;
      const inProgressTopics = stack.roadmapItems.filter(item => item.completionStatus === 'In Progress').length;
      const notStartedTopics = stack.roadmapItems.filter(item => item.completionStatus === 'Yet to Start').length;
      
      data.push({
        techStack: stack.name,
        id: stack._id,
        totalTopics,
        completedTopics,
        inProgressTopics,
        notStartedTopics,
        progress: totalTopics > 0 ? Math.round((completedTopics / totalTopics) * 100) : 0,
        isEditing: false,
        description: stack.description || ''
      });
    });
    
    setModalData(data);
    setShowStatsModal(true);
  };

  // Add function to toggle edit mode for a tech stack
  const toggleEditMode = (index) => {
    setModalData(prevData => {
      const newData = [...prevData];
      newData[index] = {
        ...newData[index],
        isEditing: !newData[index].isEditing
      };
      return newData;
    });
  };

  // Add function to update tech stack name or description
  const handleTechStackUpdate = async (index, field, value) => {
    try {
      const item = modalData[index];
      
      // Create update object with the field to update
      const updateData = {};
      updateData[field] = value;
      
      // Update local state first for immediate feedback
      setModalData(prevData => {
        const newData = [...prevData];
        newData[index] = {
          ...newData[index],
          [field]: value
        };
        return newData;
      });
      
      // Add this item to the updating list
      setUpdatingItemIds(prev => [...prev, item.id]);
      
      // Call API to update tech stack
      const result = await updateTechStack(item.id, updateData);
      
      // Update the global state with updated tech stack
      handleTechStackUpdated(result.data);
      
      // Remove this item from the updating list
      setUpdatingItemIds(prev => prev.filter(id => id !== item.id));
      
      // Close edit mode
      toggleEditMode(index);
      
      
    } catch (err) {
      setError('Failed to update tech stack');
      
      // Remove this item from the updating list
      const item = modalData[index];
      setUpdatingItemIds(prev => prev.filter(id => id !== item.id));
    }
  };

  // Show details for total topics
  const showTotalTopicsDetails = () => {
    setModalTitle("Total Topics");
    
    // Generate data for each tech stack with topics
    const data = [];
    
    allTechStacksData.forEach(stack => {
      stack.roadmapItems.forEach(item => {
        data.push({
          techStack: stack.name,
          techStackId: stack._id,
          topic: item.topic,
          topicId: item._id,
          status: item.completionStatus
        });
      });
    });
    
    setModalData(data);
    setShowStatsModal(true);
  };

  // Show details for completed topics
  const showCompletedTopicsDetails = () => {
    setModalTitle("Completed Topics");
    
    // Generate data for each tech stack with completed topics
    const data = [];
    
    allTechStacksData.forEach(stack => {
      stack.roadmapItems
        .filter(item => item.completionStatus === 'Completed')
        .forEach(item => {
          data.push({
            techStack: stack.name,
            techStackId: stack._id,
            topic: item.topic,
            topicId: item._id,
            status: item.completionStatus
          });
        });
    });
    
    setModalData(data);
    setShowStatsModal(true);
  };

  // Show details for in progress topics
  const showInProgressTopicsDetails = () => {
    setModalTitle("In Progress Topics");
    
    // Generate data for each tech stack with in progress topics
    const data = [];
    
    allTechStacksData.forEach(stack => {
      stack.roadmapItems
        .filter(item => item.completionStatus === 'In Progress')
        .forEach(item => {
          data.push({
            techStack: stack.name,
            techStackId: stack._id,
            topic: item.topic,
            topicId: item._id,
            status: item.completionStatus
          });
        });
    });
    
    setModalData(data);
    setShowStatsModal(true);
  };

  // Show details for yet to start topics
  const showYetToStartTopicsDetails = () => {
    setModalTitle("Yet to Start Topics");
    
    // Generate data for each tech stack with yet to start topics
    const data = [];
    
    allTechStacksData.forEach(stack => {
      stack.roadmapItems
        .filter(item => item.completionStatus === 'Yet to Start')
        .forEach(item => {
          data.push({
            techStack: stack.name,
            techStackId: stack._id,
            topic: item.topic,
            topicId: item._id,
            status: item.completionStatus
          });
        });
    });
    
    setModalData(data);
    setShowStatsModal(true);
  };

  // Update topics status from modal with dropdown
  const handleStatusChange = async (techStackId, topicId, newStatus, index) => {
    try {
      // Add this item to the updating list
      setUpdatingItemIds(prev => [...prev, topicId]);
      
      // Update local state first for immediate feedback
      setModalData(prevModalData => {
        const newModalData = [...prevModalData];
        newModalData[index] = {
          ...newModalData[index],
          status: newStatus
        };
        return newModalData;
      });
      
      // Find the tech stack to update
      const techStackToUpdate = JSON.parse(JSON.stringify(
        allTechStacksData.find(stack => stack._id === techStackId)
      ));
      
      if (!techStackToUpdate) {
        throw new Error('Tech stack not found');
      }
      
      // Find and update the specific topic
      const topicIndex = techStackToUpdate.roadmapItems.findIndex(item => item._id === topicId);
      
      if (topicIndex === -1) {
        throw new Error('Topic not found');
      }
      
      // Update the status
      techStackToUpdate.roadmapItems[topicIndex].completionStatus = newStatus;
      
      // Call API to update tech stack
      const result = await updateTechStack(techStackId, {
        roadmapItems: techStackToUpdate.roadmapItems,
        headers: techStackToUpdate.headers
      });
      
      // Update local state with the API response
      handleTechStackUpdated(result.data);
      
      // Remove this item from the updating list
      setUpdatingItemIds(prev => prev.filter(id => id !== topicId));
    } catch (err) {
      setError('Failed to update status');
      
      // Rollback optimistic update if failed
      setModalData(prevModalData => {
        // Find the original status from allTechStacksData
        const techStack = allTechStacksData.find(stack => stack._id === techStackId);
        const topic = techStack?.roadmapItems.find(item => item._id === topicId);
        const originalStatus = topic?.completionStatus || prevModalData[index].status;
        
        const newModalData = [...prevModalData];
        newModalData[index] = {
          ...newModalData[index],
          status: originalStatus
        };
        return newModalData;
      });
      
      // Remove this item from the updating list
      setUpdatingItemIds(prev => prev.filter(id => id !== topicId));
    }
  };

  // Updated renderModalContent function to support editing and dropdowns
  const renderModalContent = () => {
    if (modalTitle === "All Techstacks") {
      return (
        <Table striped bordered hover responsive className="m-0">
          <thead className="bg-primary text-white">
            <tr>
              <th>Tech Stack</th>
              <th>Description</th>
              <th>Total Topics</th>
              <th>Completed</th>
              <th>In Progress</th>
              <th>Yet to Start</th>
              <th>Progress</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {modalData.map((item, index) => (
              <tr key={index}>
                <td>
                  {item.isEditing ? (
                    <Form.Control
                      type="text"
                      value={item.techStack}
                      onChange={(e) => setModalData(prevData => {
                        const newData = [...prevData];
                        newData[index] = {
                          ...newData[index],
                          techStack: e.target.value
                        };
                        return newData;
                      })}
                      className="form-control-sm"
                    />
                  ) : (
                    item.techStack
                  )}
                </td>
                <td>
                  {item.isEditing ? (
                    <Form.Control
                      type="text"
                      value={item.description}
                      onChange={(e) => setModalData(prevData => {
                        const newData = [...prevData];
                        newData[index] = {
                          ...newData[index],
                          description: e.target.value
                        };
                        return newData;
                      })}
                      className="form-control-sm"
                      placeholder="Add description"
                    />
                  ) : (
                    item.description || <span className="text-muted">No description</span>
                  )}
                </td>
                <td>{item.totalTopics}</td>
                <td>
                  <span className="status-badge completed">
                    {item.completedTopics}
                  </span>
                </td>
                <td>
                <span className="status-badge in-progress">
                    {item.inProgressTopics}
                  </span>
                </td>
                <td>
                  <span className="status-badge not-started">
                    {item.notStartedTopics}
                  </span>
                </td>
                <td>
                  <div className="progress" style={{ height: '8px' }}>
                    <div 
                      className="progress-bar" 
                      style={{ 
                        width: `${item.progress}%`,
                        backgroundColor: item.progress > 70 ? '#10b981' : item.progress > 30 ? '#f59e0b' : '#ef4444'
                      }}
                    />
                  </div>
                  <small className="d-block text-center mt-1">{item.progress}%</small>
                </td>
                <td>
                  {updatingItemIds.includes(item.id) ? (
                    <div className="text-center">
                      <Spinner animation="border" size="sm" />
                    </div>
                  ) : item.isEditing ? (
                    <div className="d-flex gap-2">
                      <Button 
                        variant="success" 
                        size="sm"
                        onClick={() => handleTechStackUpdate(index, 'name', item.techStack)}
                        title="Save changes"
                      >
                        <i className="fas fa-check"></i>
                      </Button>
                      <Button 
                        variant="secondary" 
                        size="sm"
                        onClick={() => toggleEditMode(index)}
                        title="Cancel"
                      >
                        <i className="fas fa-times"></i>
                      </Button>
                    </div>
                  ) : (
                    <div className="d-flex gap-2">
                      <Button 
                        variant="primary" 
                        size="sm"
                        onClick={() => toggleEditMode(index)}
                        title="Edit"
                      >
                        <i className="fas fa-edit"></i>
                      </Button>
                      <Button 
                        variant="info" 
                        size="sm"
                        onClick={() => navigate(`/techstack/${item.id}`)}
                        title="View details"
                      >
                        <i className="fas fa-eye"></i>
                      </Button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      );
    } else {
      // Updated table for topic data with status dropdown
      return (
        <Table striped bordered hover responsive className="m-0">
          <thead className="bg-primary text-white">
            <tr>
              <th>Tech Stack</th>
              <th>Topic</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {modalData.map((item, index) => (
              <tr key={index}>
                <td>{item.techStack}</td>
                <td>{item.topic}</td>
                <td style={{ width: '200px' }}>
                  {updatingItemIds.includes(item.topicId) ? (
                    <div className="text-center">
                      <Spinner animation="border" size="sm" />
                    </div>
                  ) : (
                    <Form.Select
                      value={item.status}
                      onChange={(e) => handleStatusChange(item.techStackId, item.topicId, e.target.value, index)}
                      className="form-select-sm status-select"
                      disabled={updatingItemIds.includes(item.topicId)}
                    >
                      <option value="Yet to Start">Yet to Start</option>
                      <option value="In Progress">In Progress</option>
                      <option value="Completed">Completed</option>
                    </Form.Select>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      );
    }
  };

  // Filter tech stacks based on search term and category
  const filteredTechStacks = allTechStacksData.filter(stack => {
    if (!searchTerm) return true;
    
    const searchLower = searchTerm.toLowerCase();
    
    switch (searchCategory) {
      case 'techstack':
        // Search only in tech stack name
        return stack.name.toLowerCase().includes(searchLower);
      case 'topic':
        return stack.roadmapItems.some(item => 
          item.topic.toLowerCase().includes(searchLower)
        );
      case 'subtopic':
        return stack.roadmapItems.some(item => 
          item.subTopics.some(sub => sub.name.toLowerCase().includes(searchLower))
        );
      case 'project':
        return stack.roadmapItems.some(item => 
          item.projects.some(proj => proj.name.toLowerCase().includes(searchLower))
        );
      case 'all':
      default:
        // Search in tech stack name
        if (stack.name.toLowerCase().includes(searchLower)) return true;
        
        // Search in roadmap items
        return stack.roadmapItems.some(item => 
          item.topic.toLowerCase().includes(searchLower) ||
          item.subTopics.some(sub => sub.name.toLowerCase().includes(searchLower)) ||
          item.projects.some(proj => proj.name.toLowerCase().includes(searchLower))
        );
    }
  });

  // Get all unique roles from saved roadmaps
  const getAllRoles = () => {
    const roles = new Set();
    savedRoadmaps.forEach(roadmap => {
      roles.add(roadmap.role);
      if (roadmap.roles && roadmap.roles.length > 0) {
        roadmap.roles.forEach(role => roles.add(role.title));
      }
    });
    return ['All', ...Array.from(roles)];
  };

  // Filter saved roadmaps by selected role
  const filteredRoadmaps = savedRoadmaps.filter(roadmap => {
    if (selectedRoadmapRole === 'All') return true;
    
    if (roadmap.role === selectedRoadmapRole) return true;
    
    if (roadmap.roles && roadmap.roles.length > 0) {
      return roadmap.roles.some(role => role.title === selectedRoadmapRole);
    }
    
    return false;
  });

  // Render loading spinner
  const renderLoadingSpinner = () => {
    return (
      <div className="d-flex justify-content-center align-items-center p-5">
        <div className="text-center">
          <Spinner animation="border" role="status" variant="primary" className="mb-3">
            <span className="visually-hidden">Loading...</span>
          </Spinner>
          <p className="mb-0 text-muted">Loading data...</p>
        </div>
      </div>
    );
  };

  // Render Add Company Modal
  const renderAddCompanyModal = () => {
    return (
      <Modal 
        show={showAddCompanyModal} 
        onHide={() => setShowAddCompanyModal(false)}
        size="lg"
        centered
        className="company-modal"
      >
        <Modal.Header closeButton>
          <Modal.Title>Add New Company</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div className="company-container p-3 border rounded mb-4">
            <div className="mb-3">
              <Form.Group>
                <Form.Label>Company Name</Form.Label>
                <Form.Control
                  type="text"
                  placeholder="Enter company name"
                  value={companies[0].name}
                  onChange={(e) => handleCompanyNameChange(companies[0].id, e.target.value)}
                />
              </Form.Group>
            </div>
            
            <div className="roles-container">
              {companies[0].roles.map((role) => (
                <div key={role.id} className="role-container p-3 border rounded mb-3">
                  <div className="d-flex justify-content-between align-items-start mb-3">
                    <Form.Group className="flex-grow-1 me-3">
                      <Form.Label>Role Title</Form.Label>
                      <Form.Control
                        type="text"
                        placeholder="Enter role title"
                        value={role.title}
                        onChange={(e) => handleRoleTitleChange(companies[0].id, role.id, e.target.value)}
                      />
                    </Form.Group>
                    
                    <Button
                      variant="outline-danger"
                      size="sm"
                      onClick={() => removeRole(companies[0].id, role.id)}
                      disabled={companies[0].roles.length <= 1}
                      className="mt-4"
                    >
                      <i className="fas fa-times"></i>
                    </Button>
                  </div>
                  
                  <Form.Group className="mb-3">
                    <Form.Label>Tech Stacks</Form.Label>
                    <TechStackDropdown
                      techStacks={techStacks}
                      selectedTechStacks={role.selectedTechStacks}
                      onSelect={(selectedNames) => handleRoleTechStackSelect(companies[0].id, role.id, selectedNames)}
                      loading={loading}
                      showSearchByDefault={true}
                    />
                  </Form.Group>
                  
                  {role.selectedTechStacks.length > 0 && (
                    <div className="selected-tech-stacks p-2 bg-light rounded">
                      <div className="d-flex flex-wrap gap-2">
                        {role.selectedTechStacks.map((stack, index) => (
                          <Badge key={index} bg="primary" className="py-2 px-3">
                            {stack}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
              
              <div className="d-flex justify-content-center">
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => addRole(companies[0].id)}
                  className="mt-2"
                >
                  <i className="fas fa-plus me-2"></i>
                  Add Another Role
                </Button>
              </div>
            </div>
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowAddCompanyModal(false)}>
            Cancel
          </Button>
          <Button 
            variant="success"
            onClick={() => {
              if (companies[0].roles.some(role => role.selectedTechStacks.length > 0)) {
                setShowAddCompanyModal(false);
              } else {
                setError("Please select at least one tech stack for a role");
              }
            }}
          >
            Save Company
          </Button>
        </Modal.Footer>
      </Modal>
    );
  };

  // Company form component for dropdown-only view
  const renderRoadmapCreationForm = () => {
    return (
      <div className="roadmap-creation-container">
        {/* Page Header */}
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h2 className="h3 mb-0">Create Company Roadmaps</h2>
          <Button 
            variant="primary" 
            onClick={() => setShowAddCompanyModal(true)}
          >
            <i className="fas fa-plus me-2"></i>
            Add Company
          </Button>
        </div>
        
        {/* Alert Messages */}
        {error && (
          <Alert variant="danger" onClose={() => setError(null)} dismissible className="mb-4">
            <i className="fas fa-exclamation-circle me-2"></i>
            {error}
          </Alert>
        )}
        
        {success && (
          <Alert variant="success" onClose={() => setSuccess(null)} dismissible className="mb-4">
            <i className="fas fa-check-circle me-2"></i>
            {success}
          </Alert>
        )}
        
        {/* Companies List */}
        {companies.map((company) => (
          <Card key={company.id} className="mb-4 shadow-sm">
            <Card.Header className="bg-light d-flex justify-content-between align-items-center">
              <div className="flex-grow-1">
                <Form.Group>
                  <Form.Label>Company Name</Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="Enter company name"
                    value={company.name}
                    onChange={(e) => handleCompanyNameChange(company.id, e.target.value)}
                  />
                </Form.Group>
              </div>
              <div className="d-flex ms-3">
                <Button
                  variant="outline-danger"
                  onClick={() => removeCompany(company.id)}
                  disabled={companies.length <= 1}
                  className="me-2"
                >
                  <i className="fas fa-trash-alt"></i>
                </Button>
                <Button
                  variant="primary"
                  onClick={() => addRole(company.id)}
                >
                  <i className="fas fa-user-plus me-1"></i>
                  Add Role
                </Button>
              </div>
            </Card.Header>
            
            <Card.Body>
              {company.roles.map((role) => (
                <div key={role.id} className="role-container p-3 border rounded mb-3">
                  <Row>
                    <Col md={3}>
                      <Form.Group className="mb-3">
                        <Form.Label>Role Title</Form.Label>
                        <Form.Control
                          type="text"
                          placeholder="Enter role title"
                          value={role.title}
                          onChange={(e) => handleRoleTitleChange(company.id, role.id, e.target.value)}
                        />
                      </Form.Group>
                    </Col>
                    
                    <Col md={7}>
                      <Form.Group className="mb-3">
                        <Form.Label>Tech Stacks</Form.Label>
                        <TechStackDropdown
                          techStacks={techStacks}
                          selectedTechStacks={role.selectedTechStacks}
                          onSelect={(selectedNames) => handleRoleTechStackSelect(company.id, role.id, selectedNames)}
                          loading={loading}
                          showSearchByDefault={true}
                        />
                      </Form.Group>
                    </Col>
                    
                    <Col md={2} className="d-flex align-items-end">
                      <div className="d-flex w-100 justify-content-between mb-3">
                        <Button
                          variant="outline-danger"
                          size="sm"
                          onClick={() => removeRole(company.id, role.id)}
                          disabled={company.roles.length <= 1}
                        >
                          <i className="fas fa-times"></i>
                        </Button>
                        
                        <Button
                          variant="success"
                          size="sm"
                          onClick={() => generateRoadmap(company, role)}
                          disabled={!company.name || !role.title || role.selectedTechStacks.length === 0 || loading}
                        >
                          <i className="fas fa-cog me-1"></i>
                          Generate
                        </Button>
                      </div>
                    </Col>
                  </Row>
                  
                  {role.selectedTechStacks.length > 0 && (
                    <div className="selected-tech-stacks p-2 bg-light rounded">
                      <div className="d-flex flex-wrap gap-2">
                        {role.selectedTechStacks.map((stack, index) => (
                          <Badge key={index} bg="primary">
                            {stack}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
              
              {company.roles.length > 1 && company.name && 
               company.roles.some(role => role.title && role.selectedTechStacks.length > 0) && (
                <div className="d-flex justify-content-center mt-4">
                  <Button
                    variant="primary"
                    onClick={() => generateConsolidatedRoadmap(company)}
                  >
                    <i className="fas fa-object-group me-2"></i>
                    Generate Consolidated Roadmap
                  </Button>
                </div>
              )}
            </Card.Body>
          </Card>
        ))}
        
        {/* Saved Roadmaps Section */}
        <Card className="mt-5 shadow-sm">
          <Card.Header className="bg-light d-flex justify-content-between align-items-center">
            <h3 className="h5 mb-0">Saved Roadmaps</h3>
            <Form.Select 
              onChange={(e) => setSelectedRoadmapRole(e.target.value)}
              value={selectedRoadmapRole}
              style={{ width: 'auto' }}
            >
              {getAllRoles().map((role, index) => (
                <option key={index} value={role}>{role}</option>
              ))}
            </Form.Select>
          </Card.Header>
          
          <Card.Body className="p-0">
            {savedRoadmapsLoading ? (
              <div className="p-4 text-center">
                <Spinner animation="border" variant="primary" size="sm" className="me-2" />
                <span>Loading saved roadmaps...</span>
              </div>
            ) : filteredRoadmaps.length > 0 ? (
              <div className="table-responsive">
                <Table striped bordered hover className="mb-0">
                  <thead>
                    <tr>
                      <th>Created Date</th>
                      <th>Company</th>
                      <th>Role</th>
                      <th>Roles</th>
                      <th>Tech Stacks</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRoadmaps.map((roadmap, index) => (
                      <tr key={index}>
                        <td>{new Date(roadmap.createdDate).toLocaleDateString()}</td>
                        <td>{roadmap.companyName}</td>
                        <td>
                          {roadmap.isConsolidated ? (
                            <Badge bg="primary">
                              <i className="fas fa-object-group me-1"></i>
                              Consolidated
                            </Badge>
                          ) : roadmap.role}
                        </td>
                        <td>
                          {roadmap.roles && roadmap.roles.length > 0 ? (
                            <div className="d-flex flex-wrap gap-1">
                              {roadmap.roles.map((role, i) => (
                                <Badge key={i} bg="secondary" className="me-1">
                                  {role.title}
                                </Badge>
                              ))}
                            </div>
                          ) : (
                            <span className="text-muted">-</span>
                          )}
                        </td>
                        <td>
                          <div className="d-flex flex-wrap gap-1">
                            {roadmap.techStacks.map((stack, i) => (
                              <Badge key={i} bg="info" className="me-1">
                                {stack}
                              </Badge>
                            ))}
                          </div>
                        </td>
                        <td>
                          <a 
                            href={roadmap.publishedUrl} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="btn btn-sm btn-primary"
                          >
                            <i className="fas fa-external-link-alt me-1"></i>
                            View
                          </a>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </div>
            ) : (
              <div className="p-5 text-center">
                <i className="fas fa-clipboard-list fs-1 text-muted mb-3"></i>
                <p className="mb-0">No saved roadmaps yet</p>
                <p className="text-muted">Create your first roadmap to get started</p>
              </div>
            )}
          </Card.Body>
        </Card>
      </div>
    );
  };

  // Dashboard UI for the all-roadmaps view
  const renderAllRoadmaps = () => {
    return (
      <div className="dashboard-all-roadmaps">
        {/* Page Header with Stats and Search */}
<div className="bg-white p-6 rounded-lg shadow-sm mb-6">
  <div className="flex justify-between items-start flex-wrap gap-4">
    <h2 className="text-2xl font-semibold text-gray-800">Tech Stacks</h2>
    
    <div className="flex gap-2">
      <div className="flex border border-gray-300 rounded-md">
        <span className="px-3 py-2 bg-gray-50 border-r border-gray-300">
          <i className="fas fa-search text-gray-500"></i>
        </span>
        <input
          type="text"
          placeholder="Search tech stacks, topics, projects..."
          className="px-3 py-2 border-0 outline-none flex-1 min-w-64"
          value={searchTerm}
          onChange={handleSearchChange}
        />
        <select 
          className="px-3 py-2 border-l border-gray-300 bg-gray-50 outline-none"
          value={searchCategory}
          onChange={(e) => handleSearchCategoryChange(e.target.value)}
        >
          <option value="all">All</option>
          <option value="techstack">Tech Stack</option>
          <option value="topic">Topic</option>
          <option value="subtopic">Subtopic</option>
          <option value="project">Project</option>
        </select>
      </div>
      
      {allTechStacksData.length > 0 && (
        <button
          className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600"
          onClick={() => setShowDeleteAllModal(true)}
        >
          <i className="fas fa-trash-alt mr-2"></i>
          Delete All
        </button>
      )}
    </div>
  </div>
  
  {/* Stats Cards Row */}
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mt-6">
    <div 
      className="bg-white border border-gray-200 rounded-lg p-4 cursor-pointer hover:shadow-md"
      onClick={showAllTechStacksDetails}
    >
      <div className="flex items-center">
        <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center mr-3">
          <i className="fas fa-layer-group text-lg"></i>
        </div>
        <div>
          <div className="text-xl font-semibold text-gray-800">{stats.totalTechStacks}</div>
          <div className="text-sm text-gray-500">Total Tech Stacks</div>
        </div>
      </div>
    </div>
    
    <div 
      className="bg-white border border-gray-200 rounded-lg p-4 cursor-pointer hover:shadow-md"
      onClick={showTotalTopicsDetails}
    >
      <div className="flex items-center">
        <div className="w-12 h-12 bg-cyan-100 text-cyan-600 rounded-lg flex items-center justify-center mr-3">
          <i className="fas fa-list text-lg"></i>
        </div>
        <div>
          <div className="text-xl font-semibold text-gray-800">{stats.total}</div>
          <div className="text-sm text-gray-500">Total Topics</div>
        </div>
      </div>
    </div>
    
    <div 
      className="bg-white border border-gray-200 rounded-lg p-4 cursor-pointer hover:shadow-md"
      onClick={showCompletedTopicsDetails}
    >
      <div className="flex items-center">
        <div className="w-12 h-12 bg-green-100 text-green-600 rounded-lg flex items-center justify-center mr-3">
          <i className="fas fa-check text-lg"></i>
        </div>
        <div>
          <div className="text-xl font-semibold text-gray-800">{stats.completed}</div>
          <div className="text-sm text-gray-500">Completed</div>
        </div>
      </div>
    </div>
    
    <div 
      className="bg-white border border-gray-200 rounded-lg p-4 cursor-pointer hover:shadow-md"
      onClick={showInProgressTopicsDetails}
    >
      <div className="flex items-center">
        <div className="w-12 h-12 bg-yellow-100 text-yellow-600 rounded-lg flex items-center justify-center mr-3">
          <i className="fas fa-spinner text-lg"></i>
        </div>
        <div>
          <div className="text-xl font-semibold text-gray-800">{stats.inProgress}</div>
          <div className="text-sm text-gray-500">In Progress</div>
        </div>
      </div>
    </div>
    
    <div 
      className="bg-white border border-gray-200 rounded-lg p-4 cursor-pointer hover:shadow-md"
      onClick={showYetToStartTopicsDetails}
    >
      <div className="flex items-center">
        <div className="w-12 h-12 bg-red-100 text-red-600 rounded-lg flex items-center justify-center mr-3">
          <i className="fas fa-clock text-lg"></i>
        </div>
        <div>
          <div className="text-xl font-semibold text-gray-800">{stats.notStarted}</div>
          <div className="text-sm text-gray-500">Yet to Start</div>
        </div>
      </div>
    </div>
  </div>
</div>
        
        {/* Alert Messages */}
        {error && (
          <Alert variant="danger" onClose={() => setError(null)} dismissible className="mb-4">
            <i className="fas fa-exclamation-circle me-2"></i>
            {error}
          </Alert>
        )}
        
        {success && (
          <Alert variant="success" onClose={() => setSuccess(null)} dismissible className="mb-4">
            <i className="fas fa-check-circle me-2"></i>
            {success}
          </Alert>
        )}
        
        {/* Tech Stacks List */}
        {loading ? (
          renderLoadingSpinner()
        ) : filteredTechStacks.length > 0 ? (
          <>
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h3 className="h5 mb-0">All Tech Stacks</h3>
              <div>
                {searchTerm ? (
                  <span className="text-muted">
                    Showing {filteredTechStacks.length} of {allTechStacksData.length} tech stacks
                    <Button
                      variant="link"
                      className="p-0 ms-2"
                      onClick={() => setSearchTerm('')}
                    >
                      Clear
                    </Button>
                  </span>
                ) : (
                  <span className="text-muted">
                    Total: {allTechStacksData.length} tech stacks
                  </span>
                )}
              </div>
            </div>
            
            {filteredTechStacks.map((techStack) => (
              <div key={techStack._id} className="mb-4">
                <TechStackTable 
                  techStackData={techStack} 
                  onUpdate={handleTechStackUpdated} 
                  onDelete={handleTechStackDeleted}
                />
              </div>
            ))}
          </>
        ) : (
          <Card className="text-center p-5 border-0 shadow-sm">
            <Card.Body>
              <i className="fas fa-search display-4 text-muted mb-3"></i>
              <h3 className="h4 mb-3">
                {searchTerm 
                  ? "No tech stacks found matching your search"
                  : "No tech stacks available yet"}
              </h3>
              <p className="text-muted mb-4">
                {searchTerm 
                  ? "Try adjusting your search terms or clear the search."
                  : "You haven't created any tech stacks yet. Create a new tech stack to get started."}
              </p>
              {searchTerm && (
                <Button
                  variant="outline-primary"
                  onClick={() => setSearchTerm('')}
                >
                  Clear Search
                </Button>
              )}
            </Card.Body>
          </Card>
        )}
      </div>
    );
  };

  return (
    <Container fluid className="p-0">
      {/* Alert Messages at the top level */}
      {error && (
        <Alert variant="danger" onClose={() => setError(null)} dismissible className="m-3">
          <i className="fas fa-exclamation-circle me-2"></i>
          {error}
        </Alert>
        )}
      
        {success && (
          <Alert variant="success" onClose={() => setSuccess(null)} dismissible className="m-3">
            <i className="fas fa-check-circle me-2"></i>
            {success}
          </Alert>
        )}
  
        {/* Main Content */}
        <div className="p-3 p-md-4">
          {/* Display appropriate view based on view prop */}
          {view === "dropdown-only" && renderRoadmapCreationForm()}
          {view === "all-roadmaps" && renderAllRoadmaps()}
        </div>
  
        {/* Add Company Modal */}
        {renderAddCompanyModal()}
        
        {/* Stats Modal with improved layout */}
        <Modal
          show={showStatsModal}
          onHide={() => setShowStatsModal(false)}
          size="xl"
          centered
          dialogClassName="stats-modal"
          contentClassName="h-100"
        >
          <Modal.Header closeButton className="bg-primary text-white">
            <Modal.Title>
              <i className={
                modalTitle === "All Techstacks" ? "fas fa-layer-group me-2" :
                modalTitle === "Total Topics" ? "fas fa-list me-2" :
                modalTitle === "Completed Topics" ? "fas fa-check-circle me-2" :
                modalTitle === "In Progress Topics" ? "fas fa-spinner me-2" :
                "fas fa-clock me-2"
              }></i>
              {modalTitle}
            </Modal.Title>
          </Modal.Header>
          <Modal.Body className="p-0">
            <div className="modal-table-container" style={{ maxHeight: '70vh', overflow: 'auto' }}>
              {renderModalContent()}
            </div>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowStatsModal(false)}>
              Close
            </Button>
          </Modal.Footer>
        </Modal>
        
        {/* Delete All Confirmation Modal - Centered */}
        <Modal
          show={showDeleteAllModal}
          onHide={() => setShowDeleteAllModal(false)}
          centered
          dialogClassName="delete-modal"
        >
          <Modal.Header closeButton className="bg-danger text-white">
            <Modal.Title>Delete All Tech Stacks</Modal.Title>
          </Modal.Header>
          <Modal.Body className="p-4">
            <div className="text-center mb-4">
              <i className="fas fa-exclamation-triangle fa-3x text-danger"></i>
            </div>
            <p className="text-center">
              Are you sure you want to delete <strong>all</strong> tech stacks? This action cannot be undone and will permanently remove all tech stacks and their associated data from the database.
            </p>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowDeleteAllModal(false)}>
              Cancel
            </Button>
            <Button 
              variant="danger" 
              onClick={handleDeleteAllTechStacks}
              disabled={deleteAllLoading}
            >
              {deleteAllLoading ? (
                <>
                  <Spinner animation="border" size="sm" className="me-2" />
                  Deleting...
                </>
              ) : (
                <>Delete All Tech Stacks</>
              )}
            </Button>
          </Modal.Footer>
        </Modal>
        
        {/* GitHub Upload Modal */}
        <Modal 
          show={showUploadModal} 
          onHide={handleCloseUploadModal} 
          centered 
          className="upload-modal"
        >
          <Modal.Header closeButton className="bg-primary text-white">
            <Modal.Title>
              <i className="fab fa-github me-2"></i>
              Upload to GitHub
            </Modal.Title>
          </Modal.Header>
          <Modal.Body>
            {publishedUrl ? (
              <div className="text-center py-4">
                <div className="mb-3">
                  <div className="success-icon bg-success bg-opacity-10 text-success mx-auto mb-3" style={{ width: '60px', height: '60px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <i className="fas fa-check fa-2x"></i>
                  </div>
                  <h4>Roadmap Published!</h4>
                  <p className="text-muted">Your roadmap has been successfully uploaded to GitHub</p>
                </div>
                
                <div className="bg-light p-3 rounded mb-3">
                  <div className="d-flex align-items-center">
                    <div className="flex-grow-1 text-truncate">
                      <a 
                        href={publishedUrl} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-primary text-break"
                      >
                        {publishedUrl}
                      </a>
                    </div>
                    <Button 
                      variant="outline-secondary" 
                      size="sm"
                      onClick={() => {
                        navigator.clipboard.writeText(publishedUrl);
                        setSuccess("URL copied to clipboard");
                        setTimeout(() => setSuccess(null), 2000);
                      }}
                      className="ms-2"
                    >
                      <i className="fas fa-copy"></i>
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <>
                {uploadError && (
                  <Alert variant="danger" className="mb-3">
                    <i className="fas fa-exclamation-circle me-2"></i>
                    {uploadError}
                  </Alert>
                )}
                
                <Form>
                  <Form.Group className="mb-3">
                    <Form.Label>Roadmap File Name</Form.Label>
                    <InputGroup>
                      <InputGroup.Text>
                        <i className="fas fa-file-code"></i>
                      </InputGroup.Text>
                      <Form.Control 
                        type="text" 
                        value={filename}
                        onChange={(e) => setFilename(e.target.value)}
                        placeholder="e.g., NIAT_X_CompanyName"
                      />
                      <InputGroup.Text>.html</InputGroup.Text>
                    </InputGroup>
                    <Form.Text className="text-muted">
                      This will be the HTML file name in the GitHub repository
                    </Form.Text>
                  </Form.Group>
                </Form>
              </>
            )}
          </Modal.Body>
          <Modal.Footer>
            {publishedUrl ? (
              <>
                <Button variant="secondary" onClick={handleCloseUploadModal}>
                  Close
                </Button>
                <Button 
                  variant="primary" 
                  onClick={() => window.open(publishedUrl, '_blank')}
                >
                  <i className="fas fa-external-link-alt me-2"></i>
                  View Roadmap
                </Button>
              </>
            ) : (
              <>
                <Button variant="secondary" onClick={handleCloseUploadModal}>
                  Cancel
                </Button>
                <Button 
                  variant="primary" 
                  onClick={handleUploadToGithub}
                  disabled={uploadLoading || !filename.trim()}
                >
                  {uploadLoading ? (
                    <>
                      <Spinner animation="border" size="sm" className="me-2" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <i className="fas fa-upload me-2"></i>
                      Upload to GitHub
                    </>
                  )}
                </Button>
              </>
            )}
          </Modal.Footer>
        </Modal>
        
        {/* Custom CSS for components */}
        <style jsx>{`
          .stats-card {
            transition: all 0.2s ease;
          }
          
          .stats-card:hover {
            transform: translateY(-5px);
            box-shadow: 0 10px 20px rgba(0,0,0,0.1) !important;
          }
          
          .stats-icon {
            width: 50px;
            height: 50px;
            display: flex;
            align-items: center;
            justify-content: center;
          }
          
          .stats-value {
            font-size: 1.75rem;
            font-weight: 600;
          }
          
          .stats-label {
            font-size: 0.875rem;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }
          
          .modal-table-container {
            border-top: 1px solid rgba(0,0,0,0.1);
            border-bottom: 1px solid rgba(0,0,0,0.1);
          }
          
          .status-badge {
            display: inline-flex;
            align-items: center;
            padding: 0.35rem 0.75rem;
            font-size: 0.75rem;
            font-weight: 600;
            border-radius: 30px;
          }
          
          .status-badge.completed {
            background-color: rgba(16, 185, 129, 0.12);
            color: #10b981;
          }
          
          .status-badge.in-progress {
            background-color: rgba(245, 158, 11, 0.12);
            color: #f59e0b;
          }
          
          .status-badge.not-started {
            background-color: rgba(239, 68, 68, 0.12);
            color: #ef4444;
          }
          
          .form-select-sm.status-select {
            padding: 0.25rem 0.5rem;
            height: auto;
            font-size: 0.875rem;
          }
        `}</style>
      </Container>
    );
  };
  
  export default Dashboard;