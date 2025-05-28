// server/utils/roadmapHtmlGenerator.js
// Premium Advanced Roadmap HTML Generator with professional designer color palette
export const generateRoadmapHtml = (companyName, roles, techStacksDataFromProps) => { // techStacksDataFromProps to avoid conflict
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
        padding: 1px 1px; /* Increased padding */
        text-align: center;
      }
      
      .header h1 {
        font-size: 2rem; /* Adjusted font size */
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
        padding: 5px 5px; /* Increased padding */
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
        top: 0; /* Ensure sticky header works */
        z-index: 10;
      }
      
      .roadmap-table th:first-child {
        border-top-left-radius: 0; /* Corrected from border-radius-lg */
      }
      
      .roadmap-table th:last-child {
        border-top-right-radius: 0; /* Corrected */
      }
      
      .roadmap-table tr {
        transition: var(--transition-fast);
      }
      
      .roadmap-table tr:nth-child(even) {
        background-color: var(--neutral-50);
      }
      
      .roadmap-table tr:hover {
        background-color: rgba(109, 40, 217, 0.05); /* Using secondary color for hover */
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
        font-size: 0.95rem; /* Slightly increased for readability */
        color: var(--text-secondary);
      }
      
      ul.item-list li:last-child {
        margin-bottom: 0;
      }
      
      ul.item-list li:before {
        content: "•"; /* Simpler bullet */
        position: absolute;
        left: 0;
        color: var(--primary-light); /* Consistent accent color */
        font-weight: bold;
        font-size: 1.2rem; /* Adjusted bullet size */
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
        z-index: 100; /* Ensure it's above other content */
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
          max-width: 100%; /* Ensure it doesn't overflow */
        }
        
        .role-tab {
          padding: 12px 16px;
          font-size: 0.9rem;
        }
        
        .roadmap-table th,
        .roadmap-table td {
          padding: 16px 18px; /* Slightly adjusted */
        }
        
        .tabs-wrapper {
          padding: 0 14px; /* Consistent padding */
          overflow-x: auto; /* Ensure tabs scroll if too many */
          flex-wrap: nowrap; /* Prevent wrapping on small screens */
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
            let iconClass = 'fa-solid fa-code'; // Default icon
            const techStackNameLower = techStack.name.toLowerCase();
            if (techStackNameLower.includes('python')) iconClass = 'fa-brands fa-python';
            else if (techStackNameLower.includes('javascript') || techStackNameLower.includes('js')) iconClass = 'fa-brands fa-js';
            else if (techStackNameLower.includes('react')) iconClass = 'fa-brands fa-react';
            else if (techStackNameLower.includes('node')) iconClass = 'fa-brands fa-node-js';
            else if (techStackNameLower.includes('java')) iconClass = 'fa-brands fa-java';
            else if (techStackNameLower.includes('html')) iconClass = 'fa-brands fa-html5';
            else if (techStackNameLower.includes('css')) iconClass = 'fa-brands fa-css3-alt';
            else if (techStackNameLower.includes('angular')) iconClass = 'fa-brands fa-angular';
            else if (techStackNameLower.includes('vue')) iconClass = 'fa-brands fa-vuejs';
            else if (techStackNameLower.includes('php')) iconClass = 'fa-brands fa-php';
            else if (techStackNameLower.includes('database') || techStackNameLower.includes('sql')) iconClass = 'fa-solid fa-database';
            else if (techStackNameLower.includes('cloud') || techStackNameLower.includes('aws') || techStackNameLower.includes('azure') || techStackNameLower.includes('gcp')) iconClass = 'fa-solid fa-cloud';
            else if (techStackNameLower.includes('docker')) iconClass = 'fa-brands fa-docker';
            else if (techStackNameLower.includes('git')) iconClass = 'fa-brands fa-git-alt';
            else if (techStackNameLower.includes('dynamics')) iconClass = 'fa-solid fa-chart-line'; // Example for Dynamics
            else if (techStackNameLower.includes('mern') || techStackNameLower.includes('mean') || techStackNameLower.includes('mevn')) iconClass = 'fa-brands fa-node'; // Generic for stack
            else if (techStackNameLower.includes('.net')) iconClass = 'fa-solid fa-code'; // Keep default for .NET
              
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
                      <th width="20%">${headers.status.toUpperCase()}</th>
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
                            statusIcon = 'fa-clock'; // Changed to clock for 'In Progress'
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
        if (window.pageYOffset > 300) { // Show after scrolling 300px
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
      return ''; // Return empty string on error
    }
  };