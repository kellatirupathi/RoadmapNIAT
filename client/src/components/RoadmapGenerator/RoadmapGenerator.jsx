import { useState, useEffect } from 'react';
import { Button, Spinner, Modal, Badge, Tab, Tabs, Form, Alert } from 'react-bootstrap';
import { uploadToGithub } from '../../services/githubService';
import './RoadmapGenerator.css';

const RoadmapGenerator = ({ 
  techStacksData, 
  companyName = "", 
  role = "", 
  isConsolidated = false,
  roles = [],
  onRoadmapSaved 
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [showPreview, setShowPreview] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  const [activeRoleTab, setActiveRoleTab] = useState(0);
  
  // States for GitHub upload
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [filename, setFilename] = useState('');
  const [uploadLoading, setUploadLoading] = useState(false);
  const [uploadError, setUploadError] = useState(null);
  const [publishedUrl, setPublishedUrl] = useState('');
  const [roadmapHtml, setRoadmapHtml] = useState('');

  // Set default filename based on company and role
  useEffect(() => {
    // Always use NIAT_X_companyName format for consistency
    if (companyName) {
      setFilename(`NIAT_X_${companyName.replace(/\s+/g, '_')}`);
    } else if (techStacksData.length > 0) {
      setFilename(`NIAT_X_${techStacksData[0].name.replace(/\s+/g, '_')}`);
    }
  }, [companyName, techStacksData]);

  // Generate and preview the roadmap
  const handlePreviewRoadmap = () => {
    try {
      setShowPreview(true);
    } catch (err) {
      setError('Failed to generate roadmap preview');
    }
  };

  // Close the preview modal
  const handleClosePreview = () => {
    setShowPreview(false);
  };

  // Generate roadmap HTML with modern styling and table format
  const generateRoadmapHtml = () => {
    try {
      const roadmapTitle = `NIAT_X_${companyName}`;
      
      let html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${roadmapTitle}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
    
    :root {
      --primary: #000000;
      --primary-light: #333333;
      --primary-gradient: linear-gradient(135deg, #000000 0%, #333333 100%);
      --secondary: #505965;
      --success: #137333;
      --warning: #b06000;
      --danger: #a50e0e;
      --light: #f8f9fa;
      --dark: #1f2937;
      --gray: #6c757d;
      --border-color: #e5e7eb;
    }
    
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: 'Inter', sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 1200px;
      margin: 0 auto;
      padding: 20px;
      background-color: #ffffff;
    }
    
    .header {
      text-align: center;
      margin-bottom: 30px;
      padding: 20px;
      background: #ffffff;
      color: #000000;
      border-bottom: 1px solid #e5e7eb;
      position: relative;
    }
    
    h1 {
      position: relative;
      margin: 0;
      font-weight: 700;
      font-size: 2.5rem;
      z-index: 1;
    }
    
    .container {
      display: flex;
      gap: 20px;
    }
    
    .role-tabs {
      width: 200px;
      display: flex;
      flex-direction: column;
      gap: 10px;
    }
    
    .role-tab {
      background-color: #fff;
      color: var(--primary);
      border: 1px solid var(--primary);
      padding: 8px 16px;
      border-radius: 4px;
      font-size: 0.9rem;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.3s ease;
      text-align: left;
    }
    
    .role-tab.active {
      background-color: #000000;
      color: white;
    }
    
    .content-area {
      flex: 1;
    }
    
    .tech-stack-section {
      margin-bottom: 25px;
      padding: 20px 0;
    }
    
    .tech-stack-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 15px;
      padding-bottom: 10px;
      border-bottom: 1px solid var(--border-color);
    }
    
    .tech-stack-title {
      font-size: 1.8rem;
      font-weight: 700;
      color: var(--primary);
      margin: 0;
      position: relative;
    }
    
    .progress-container {
      display: flex;
      align-items: center;
    }
    
    .progress-bar {
      width: 160px;
      height: 8px;
      background-color: #eaedf5;
      border-radius: 4px;
      margin-right: 12px;
      overflow: hidden;
    }
    
    .progress-bar-fill {
      height: 100%;
      border-radius: 4px;
      background: var(--primary-gradient);
    }
    
    .progress-text {
      font-weight: 600;
      color: var(--primary);
      font-size: 0.85rem;
    }
    
    .roadmap-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 15px;
      background-color: #fff;
      border: 1px solid var(--border-color);
    }
    
    .roadmap-table th {
      background-color: #f8f9fa;
      color: var(--primary);
      font-weight: 600;
      padding: 12px 15px;
      text-align: left;
      font-size: 0.85rem;
      border-bottom: 2px solid var(--border-color);
    }
    
    .roadmap-table td {
      padding: 12px 15px;
      border-bottom: 1px solid var(--border-color);
      vertical-align: top;
      font-size: 0.9rem;
    }
    
    .roadmap-table tr:nth-child(even) {
      background-color: #f8f9fa;
    }
    
    .badge {
      display: inline-block;
      padding: 4px 10px;
      border-radius: 4px;
      font-weight: 600;
      font-size: 0.7rem;
      text-align: center;
      letter-spacing: 0.3px;
    }
    
    .badge-success {
      background-color: rgba(19, 115, 51, 0.1);
      color: var(--success);
      border: 1px solid rgba(19, 115, 51, 0.2);
    }
    
    .badge-warning {
      background-color: rgba(176, 96, 0, 0.1);
      color: var(--warning);
      border: 1px solid rgba(176, 96, 0, 0.2);
    }
    
    .badge-danger {
      background-color: rgba(165, 14, 14, 0.1);
      color: var(--danger);
      border: 1px solid rgba(165, 14, 14, 0.2);
    }
    
    ul {
      margin: 0;
      padding: 0 0 0 16px;
    }
    
    li {
      margin-bottom: 4px;
      font-size: 0.8rem;
    }
    
    li:last-child {
      margin-bottom: 0;
    }
    
    .footer {
      text-align: center;
      margin-top: 40px;
      padding: 20px;
      color: var(--gray);
      font-size: 0.8rem;
      border-top: 1px solid var(--border-color);
    }
    
    .role-section {
      margin-top: 20px;
    }
    
    .role-title {
      font-size: 1.5rem;
      color: var(--primary);
      margin-bottom: 15px;
      padding-bottom: 10px;
      border-bottom: 1px solid var(--border-color);
    }
    
    @media (max-width: 768px) {
      body {
        padding: 15px;
      }
      
      .container {
        flex-direction: column;
      }
      
      .role-tabs {
        width: 100%;
        flex-direction: row;
        flex-wrap: wrap;
      }
      
      .header {
        padding: 15px;
      }
      
      h1 {
        font-size: 2rem;
      }
      
      .tech-stack-title {
        font-size: 1.5rem;
      }
      
      .progress-bar {
        width: 120px;
      }
      
      .role-tab {
        font-size: 0.8rem;
        padding: 6px 12px;
      }
      
      .roadmap-table th,
      .roadmap-table td {
        padding: 8px 10px;
        font-size: 0.8rem;
      }
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>${roadmapTitle}</h1>
  </div>
`;

      // For consolidated roadmaps, add role tabs on the left
      if (isConsolidated && roles.length > 0) {
        html += `
  <div class="container">
    <div class="role-tabs">
      ${roles.map((role, index) => `
        <div class="role-tab ${index === 0 ? 'active' : ''}" onclick="showRole(${index})">
          ${role.title}
        </div>
      `).join('')}
    </div>
    
    <div class="content-area">
`;

        // Add role sections
        roles.forEach((role, roleIndex) => {
          html += `
      <div class="role-section" id="role-${roleIndex}" style="display: ${roleIndex === 0 ? 'block' : 'none'};">
        <h2 class="role-title">${role.title}</h2>
`;

          // Process each tech stack for this role
          role.techStacks.forEach(techStack => {
            const percentComplete = techStack.roadmapItems.length > 0 
              ? Math.round((techStack.roadmapItems.reduce((count, item) => 
                  count + (item.completionStatus === 'Completed' ? 1 : 0), 0) / techStack.roadmapItems.length) * 100) 
              : 0;

            html += `
        <div class="tech-stack-section">
          <div class="tech-stack-header">
            <h2 class="tech-stack-title">${techStack.name}</h2>
            <div class="progress-container">
              <div class="progress-bar">
                <div class="progress-bar-fill" style="width: ${percentComplete}%;"></div>
              </div>
              <span class="progress-text">${percentComplete}% Complete</span>
            </div>
          </div>
          <table class="roadmap-table">
            <thead>
              <tr>
                <th style="width: 20%;">Topic</th>
                <th style="width: 30%;">Sub-Topics</th>
                <th style="width: 30%;">Projects</th>
                <th style="width: 20%;">Status</th>
              </tr>
            </thead>
            <tbody>
`;

            // Add roadmap items as table rows
            techStack.roadmapItems.forEach(item => {
              let badgeClass = '';
              switch (item.completionStatus) {
                case 'Completed':
                  badgeClass = 'badge-success';
                  break;
                case 'In Progress':
                  badgeClass = 'badge-warning';
                  break;
                case 'Yet to Start':
                default:
                  badgeClass = 'badge-danger';
                  break;
              }

              html += `
              <tr>
                <td>${item.topic}</td>
                <td>
                  ${item.subTopics.length > 0 ? `
                  <ul>
                    ${item.subTopics.map(subtopic => `<li>${subtopic.name}</li>`).join('')}
                  </ul>
                  ` : 'No sub-topics'}
                </td>
                <td>
                  ${item.projects.length > 0 ? `
                  <ul>
                    ${item.projects.map(project => `<li>${project.name}</li>`).join('')}
                  </ul>
                  ` : 'No projects'}
                </td>
                <td>
                  <span class="badge ${badgeClass}">${item.completionStatus}</span>
                </td>
              </tr>
`;
            });

            html += `
            </tbody>
          </table>
        </div>
`;
          });
          
          html += `
      </div>
`;
        });

        html += `
    </div>
  </div>
  
  <script>
    function showRole(roleIndex) {
      const roleSections = document.querySelectorAll('.role-section');
      roleSections.forEach(section => {
        section.style.display = 'none';
      });
      
      roleSections[roleIndex].style.display = 'block';
      
      const roleTabs = document.querySelectorAll('.role-tab');
      roleTabs.forEach((tab, index) => {
        if (index === roleIndex) {
          tab.classList.add('active');
        } else {
          tab.classList.remove('active');
        }
      });
    }
    
    document.addEventListener('DOMContentLoaded', function() {
      showRole(0);
    });
  </script>
`;
      } else {
        // Single role view - no side navigation tabs
        html += `
  <div class="container">
    <div class="content-area">
`;

        // If a role is specified, add it as a title
        if (role && role.trim() !== '' && role !== 'Consolidated') {
          html += `
      <div class="role-section">
        <h2 class="role-title">${role}</h2>
      </div>
`;
        }

        techStacksData.forEach(techStack => {
          const percentComplete = techStack.roadmapItems.length > 0 
            ? Math.round((techStack.roadmapItems.reduce((count, item) => 
                count + (item.completionStatus === 'Completed' ? 1 : 0), 0) / techStack.roadmapItems.length) * 100) 
            : 0;

          html += `
      <div class="tech-stack-section">
        <div class="tech-stack-header">
          <h2 class="tech-stack-title">${techStack.name}</h2>
          <div class="progress-container">
            <div class="progress-bar">
              <div class="progress-bar-fill" style="width: ${percentComplete}%;"></div>
            </div>
            <span class="progress-text">${percentComplete}% Complete</span>
          </div>
        </div>
        <table class="roadmap-table">
          <thead>
            <tr>
              <th style="width: 20%;">Topic</th>
              <th style="width: 30%;">Sub-Topics</th>
              <th style="width: 30%;">Projects</th>
              <th style="width: 20%;">Status</th>
            </tr>
          </thead>
          <tbody>
`;

          techStack.roadmapItems.forEach(item => {
            let badgeClass = '';
            switch (item.completionStatus) {
              case 'Completed':
                badgeClass = 'badge-success';
                break;
              case 'In Progress':
                badgeClass = 'badge-warning';
                break;
              case 'Yet to Start':
              default:
                badgeClass = 'badge-danger';
                break;
            }

            html += `
            <tr>
              <td>${item.topic}</td>
              <td>
                ${item.subTopics.length > 0 ? `
                <ul>
                  ${item.subTopics.map(subtopic => `<li>${subtopic.name}</li>`).join('')}
                </ul>
                ` : 'No sub-topics'}
              </td>
              <td>
                ${item.projects.length > 0 ? `
                <ul>
                  ${item.projects.map(project => `<li>${project.name}</li>`).join('')}
                </ul>
                ` : 'No projects'}
              </td>
              <td>
                <span class="badge ${badgeClass}">${item.completionStatus}</span>
              </td>
            </tr>
`;
          });

          html += `
          </tbody>
        </table>
      </div>
`;
        });

        html += `
    </div>
  </div>
`;
      }
      
      // Add footer
      html += `
  <div class="footer">
    <p>Generated by NIAT Tech Stack Roadmap Manager © ${new Date().getFullYear()}</p>
  </div>
</body>
</html>
`;
      
      return html;
    } catch (err) {
      setError('Failed to generate roadmap HTML');
      return '';
    }
  };

  // Handle generate roadmap for GitHub - now opens upload modal directly
  const handleGenerateRoadmap = () => {
    try {
      const html = generateRoadmapHtml();
      setRoadmapHtml(html);
      setShowUploadModal(true);
    } catch (err) {
      setError('Failed to generate roadmap');
    }
  };

  // Close the upload modal
  const handleCloseUploadModal = () => {
    setShowUploadModal(false);
    setUploadError(null);
    setPublishedUrl('');
  };

  // Handle uploading to GitHub
  const handleUploadToGithub = async () => {
    if (!filename.trim()) {
      setUploadError('Please enter a file name');
      return;
    }
    
    try {
      setUploadLoading(true);
      setUploadError(null);
      
      const response = await uploadToGithub({
        filename: filename.trim().endsWith('.html') ? filename.trim() : `${filename.trim()}.html`,
        content: roadmapHtml,
        description: `${filename.trim()} Roadmap: ${techStacksData.map(stack => stack.name).join(', ')}`
      });
      
      setPublishedUrl(response.html_url || response.url);
      setUploadLoading(false);
      
      if (onRoadmapSaved) {
        onRoadmapSaved({
          publishedUrl: response.html_url || response.url,
          filename: filename.trim().endsWith('.html') ? filename.trim() : `${filename.trim()}.html`,
          techStacks: techStacksData.map(stack => stack.name)
        });
      }
    } catch (err) {
      setUploadError('Failed to upload to GitHub. Please try again.');
      setUploadLoading(false);
    }
  };

  // Get badge variant based on status
  const getStatusBadgeVariant = (status) => {
    switch (status) {
      case 'Completed':
        return 'success';
      case 'In Progress':
        return 'warning';
      case 'Yet to Start':
      default:
        return 'danger';
    }
  };

  // Render the preview content for a role in table format
  const renderRolePreview = (role) => {
    return (
      <div className="content-area">
        {role.techStacks.map((techStack, index) => (
          <div key={index} className="tech-stack-section">
            <div className="tech-stack-header">
              <h4 className="tech-stack-name">{techStack.name}</h4>
            </div>
            <table className="roadmap-preview-table">
              <thead>
                <tr>
                  <th className="topic-column">Topic</th>
                  <th className="subtopics-column">Sub-Topics</th>
                    <th className="projects-column">Projects</th>
                    <th className="status-column">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {techStack.roadmapItems.map((item, itemIndex) => (
                    <tr key={itemIndex}>
                      <td className="topic-cell">{item.topic}</td>
                      <td className="subtopics-cell">
                        {item.subTopics.length > 0 ? (
                          <ul className="content-list">
                            {item.subTopics.map((subtopic, idx) => (
                              <li key={idx}>{subtopic.name}</li>
                            ))}
                          </ul>
                        ) : (
                          <span className="empty-list">No sub-topics</span>
                        )}
                      </td>
                      <td className="projects-cell">
                        {item.projects.length > 0 ? (
                          <ul className="content-list">
                            {item.projects.map((project, idx) => (
                              <li key={idx}>{project.name}</li>
                            ))}
                          </ul>
                        ) : (
                          <span className="empty-list">No projects</span>
                        )}
                      </td>
                      <td className="status-cell">
                        <Badge
                          bg={getStatusBadgeVariant(item.completionStatus)}
                          className={`status-badge ${item.completionStatus.toLowerCase().replace(' ', '-')}`}
                        >
                          {item.completionStatus}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}
        </div>
      );
    };

  return (
    <>
      <div className="roadmap-action-buttons">
        <Button
          variant="outline-primary"
          onClick={handlePreviewRoadmap}
          className="roadmap-button preview-button"
        >
          <i className="fas fa-eye"></i>
          Preview
        </Button>
        
        <Button
          variant="primary"
          onClick={handleGenerateRoadmap}
          disabled={loading}
          className="roadmap-button generate-button"
        >
          <i className="fas fa-code-branch"></i>
          Generate Roadmap
        </Button>
      </div>
      
      {/* Preview Modal - Still available but not launched automatically */}
      <Modal 
        show={showPreview} 
        onHide={handleClosePreview} 
        size="lg" 
        centered 
        className="roadmap-preview-modal"
        backdrop="static"
      >
        <Modal.Header closeButton>
          <div className="modal-title-container">
            <div className="modal-icon-container">
              <i className="fas fa-map-marked-alt"></i>
            </div>
            <span>Roadmap Preview</span>
          </div>
        </Modal.Header>
        <Modal.Body>
          {isConsolidated && roles.length > 0 ? (
            <div style={{ display: 'flex', gap: '20px' }}>
              <Tabs
                activeKey={activeRoleTab}
                onSelect={(k) => setActiveRoleTab(parseInt(k))}
                className="preview-tabs"
                vertical
                style={{ width: '200px' }}
              >
                {roles.map((role, index) => (
                  <Tab
                    eventKey={index}
                    title={role.title}
                    key={index}
                  />
                ))}
              </Tabs>
              <div style={{ flex: 1 }}>
                <h3>NIAT_X_{companyName}</h3>
                {renderRolePreview(roles[activeRoleTab])}
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', gap: '20px' }}>
              <div style={{ flex: 1 }}>
                <h2>NIAT_X_{companyName}</h2>
                {techStacksData.map((techStack, index) => (
                  <div key={index} className="tech-stack-section">
                    <div className="tech-stack-header">
                      <h2>{techStack.name}</h2>
                    </div>
                    <table className="roadmap-preview-table">
                      <thead>
                        <tr>
                          <th className="topic-column">Topic</th>
                          <th className="subtopics-column">Sub-Topics</th>
                          <th className="projects-column">Projects</th>
                          <th className="status-column">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {techStack.roadmapItems.map((item, itemIndex) => (
                          <tr key={itemIndex}>
                            <td className="topic-cell">{item.topic}</td>
                            <td className="subtopics-cell">
                              {item.subTopics.length > 0 ? (
                                <ul className="content-list">
                                  {item.subTopics.map((subtopic, idx) => (
                                    <li key={idx}>{subtopic.name}</li>
                                  ))}
                                </ul>
                              ) : (
                                <span className="empty-list">No sub-topics</span>
                              )}
                            </td>
                            <td className="projects-cell">
                              {item.projects.length > 0 ? (
                                <ul className="content-list">
                                  {item.projects.map((project, idx) => (
                                    <li key={idx}>{project.name}</li>
                                  ))}
                                </ul>
                              ) : (
                                <span className="empty-list">No projects</span>
                              )}
                            </td>
                            <td className="status-cell">
                              <Badge
                                bg={getStatusBadgeVariant(item.completionStatus)}
                                className={`status-badge ${item.completionStatus.toLowerCase().replace(' ', '-')}`}
                              >
                                {item.completionStatus}
                              </Badge>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ))}
              </div>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer className="modal-footer">
          <Button variant="outline-secondary" onClick={handleClosePreview} className="modal-btn">
            <i className="fas fa-times"></i>
            <span>Close</span>
          </Button>
          <Button variant="primary" onClick={handleGenerateRoadmap} className="modal-btn">
            <i className="fas fa-code"></i>
            <span>Generate HTML</span>
          </Button>
        </Modal.Footer>
      </Modal>
      
      {/* GitHub Upload Modal - This opens directly when Generate button is clicked */}
      <Modal 
        show={showUploadModal} 
        onHide={handleCloseUploadModal} 
        centered 
        size="md"
        className="github-upload-modal"
      >
        <Modal.Header closeButton>
          <div className="github-modal-title">
            <i className="fab fa-github"></i>
            <span>Upload to GitHub</span>
          </div>
        </Modal.Header>
        <Modal.Body>
          {publishedUrl ? (
            <div className="publish-success-container">
              <div className="success-icon-container">
                <i className="fas fa-check-circle"></i>
              </div>
              <h4>Roadmap Published!</h4>
              <p>Your roadmap has been uploaded to GitHub and is now available at:</p>
              <div className="published-url-container">
                <a 
                  href={publishedUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="published-url"
                >
                  {publishedUrl}
                </a>
                <Button 
                  variant="outline-secondary" 
                  onClick={() => {
                    navigator.clipboard.writeText(publishedUrl);
                    setSuccess('URL copied to clipboard!');
                    setTimeout(() => setSuccess(null), 3000);
                  }}
                  className="copy-btn"
                >
                  <i className="fas fa-copy"></i>
                </Button>
              </div>
            </div>
          ) : (
            <>
              {uploadError && (
                <Alert variant="danger" className="upload-error-alert">
                  <i className="fas fa-exclamation-circle"></i>
                  <span>{uploadError}</span>
                </Alert>
              )}
              
              <Form className="upload-form">
                <Form.Group className="mb-3">
                  <Form.Label className="form-label">Roadmap File Name</Form.Label>
                  <div className="input-container">
                    <div className="input-icon">
                      <i className="fas fa-file-code"></i>
                    </div>
                    <Form.Control 
                      type="text" 
                      value={filename}
                      onChange={(e) => setFilename(e.target.value)}
                      placeholder="e.g., NIAT_X_CompanyName"
                      required
                      className="filename-input"
                    />
                  </div>
                  <Form.Text className="input-helper-text">
                    <i className="fas fa-info-circle"></i>
                    <span>This will be the HTML file name in the GitHub repository</span>
                  </Form.Text>
                </Form.Group>
              </Form>
            </>
          )}
        </Modal.Body>
        <Modal.Footer className="github-modal-footer">
          {publishedUrl ? (
            <>
              <Button variant="outline-secondary" onClick={handleCloseUploadModal} className="modal-btn">
                <i className="fas fa-times"></i>
                <span>Close</span>
              </Button>
              <Button 
                variant="primary" 
                onClick={() => window.open(publishedUrl, '_blank')}
                className="modal-btn"
              >
                <i className="fas fa-external-link-alt"></i>
                <span>View Roadmap</span>
              </Button>
            </>
          ) : (
            <>
              <Button variant="outline-secondary" onClick={handleCloseUploadModal} className="modal-btn">
                <i className="fas fa-times"></i>
                <span>Cancel</span>
              </Button>
              <Button 
                variant="primary" 
                onClick={handleUploadToGithub}
                disabled={uploadLoading || !filename.trim()}
                className="modal-btn"
              >
                {uploadLoading ? (
                  <>
                    <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" />
                    <span>Uploading...</span>
                  </>
                ) : (
                  <>
                    <i className="fas fa-upload"></i>
                    <span>Upload to GitHub</span>
                  </>
                )}
              </Button>
            </>
          )}
        </Modal.Footer>
      </Modal>
    </>
  );
};

export default RoadmapGenerator;