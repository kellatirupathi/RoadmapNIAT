// client/src/components/CreateRoadmapModal/CreateRoadmapModal.jsx
import React, { useState, useEffect } from 'react';
import { Modal, Button, Form, Row, Col, Spinner, Alert, Badge, InputGroup, Card } from 'react-bootstrap';
import TechStackDropdown from '../TechStackDropdown/TechStackDropdown';
import { getAllTechStacks as fetchAllTechStackOptionsForDropdown, getTechStackByName } from '../../services/techStackService';
import { saveRoadmapMetadata } from '../../services/roadmapService';
import { uploadToGithub } from '../../services/githubService';
import { generateRoadmapHtml } from '../../utils/roadmapHtmlGenerator';
import useAuth from '../../hooks/useAuth'; 
import userService from '../../services/userService'; 

const CreateRoadmapModal = ({ show, onHide, onRoadmapCreated }) => {
  const { user } = useAuth(); 
  const initialRoadmapState = {
    companyName: '',
    isConsolidated: false,
    singleRoleTitle: '',
    singleRoleTechStacks: [], // Stores names
    consolidatedRoles: [{ id: Date.now(), title: '', selectedTechStacks: [] }], 
    filename: '',
    crmAffiliation: '', // Added
  };

  const [roadmapDetails, setRoadmapDetails] = useState(initialRoadmapState);
  const [allTechStackOptions, setAllTechStackOptions] = useState([]); // Stores { _id, name } for dropdown
  const [loadingDropdownOptions, setLoadingDropdownOptions] = useState(false);
  const [uploadLoading, setUploadLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [publishedUrl, setPublishedUrl] = useState('');
  const [crmUsers, setCrmUsers] = useState([]); // Added

  useEffect(() => {
    if (show) {
      setRoadmapDetails(initialRoadmapState);
      setError(null);
      setSuccess(null);
      setPublishedUrl('');
      setLoadingDropdownOptions(true);
      fetchAllTechStackOptionsForDropdown()
        .then(response => {
          setAllTechStackOptions(response.data || []);
        })
        .catch((err) => {
            console.error("Failed to load tech stack options:", err);
            setError('Failed to load tech stack options. Please check the console for details.');
        })
        .finally(() => setLoadingDropdownOptions(false));

      if (user && user.role === 'admin') {
        const fetchCrmUsers = async () => {
          try {
            const response = await userService.getUsers();
            setCrmUsers(response.data.filter(u => u.role === 'crm' && u.username));
          } catch (err) {
            console.error("Failed to load CRM users:", err);
            // Optionally set a specific error for CRM user loading
          }
        };
        fetchCrmUsers();
      }
    }
  }, [show, user]); // Added user to dependency array

  useEffect(() => {
    if (!publishedUrl) {
      if (roadmapDetails.companyName) {
        if (roadmapDetails.filename === '' || roadmapDetails.filename.startsWith('NIAT_X_')) {
          setRoadmapDetails(prev => ({
            ...prev,
            filename: `NIAT_X_${roadmapDetails.companyName.replace(/\s+/g, '_')}`
          }));
        }
      } else {
        if (roadmapDetails.filename.startsWith('NIAT_X_')) {
          setRoadmapDetails(prev => ({
            ...prev,
            filename: ''
          }));
        }
      }
    }
  }, [roadmapDetails.companyName, roadmapDetails.filename, publishedUrl]);


  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setRoadmapDetails(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSingleRoleTechStackSelect = (selectedNames) => {
    setRoadmapDetails(prev => ({ ...prev, singleRoleTechStacks: selectedNames }));
  };

  const handleConsolidatedRoleChange = (index, field, value) => {
    const updatedRoles = [...roadmapDetails.consolidatedRoles];
    updatedRoles[index][field] = value;
    setRoadmapDetails(prev => ({ ...prev, consolidatedRoles: updatedRoles }));
  };

  const handleConsolidatedRoleTechStackSelect = (index, selectedNames) => {
    const updatedRoles = [...roadmapDetails.consolidatedRoles];
    updatedRoles[index].selectedTechStacks = selectedNames;
    setRoadmapDetails(prev => ({ ...prev, consolidatedRoles: updatedRoles }));
  };

  const addConsolidatedRole = () => {
    setRoadmapDetails(prev => ({
      ...prev,
      consolidatedRoles: [
        ...prev.consolidatedRoles,
        { id: Date.now(), title: '', selectedTechStacks: [] }
      ]
    }));
  };

  const removeConsolidatedRole = (idToRemove) => {
    if (roadmapDetails.consolidatedRoles.length > 1) {
      setRoadmapDetails(prev => ({
        ...prev,
        consolidatedRoles: prev.consolidatedRoles.filter(role => role.id !== idToRemove)
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    // setPublishedUrl(''); // Keep published URL if it was already set from a previous attempt that failed later

    if (!roadmapDetails.companyName.trim()) {
      setError('Company name is required.');
      return;
    }
    if (!roadmapDetails.filename.trim()) {
        setError('Filename is required.');
        return;
    }

    let rolesForPayload;
    let overallTechStackNamesForPayload;

    if (roadmapDetails.isConsolidated) {
      if (roadmapDetails.consolidatedRoles.some(role => !role.title.trim() || role.selectedTechStacks.length === 0)) {
        setError('All consolidated roles must have a title and at least one tech stack selected.');
        return;
      }
      rolesForPayload = roadmapDetails.consolidatedRoles.map(role => ({
        title: role.title,
        techStacks: role.selectedTechStacks // Array of tech stack *names*
      }));
      overallTechStackNamesForPayload = [...new Set(roadmapDetails.consolidatedRoles.flatMap(role => role.selectedTechStacks))];
    } else {
      if (!roadmapDetails.singleRoleTitle.trim() || roadmapDetails.singleRoleTechStacks.length === 0) {
        setError('Role title and at least one tech stack are required for a single role roadmap.');
        return;
      }
      rolesForPayload = []; 
      overallTechStackNamesForPayload = roadmapDetails.singleRoleTechStacks;
    }

    setUploadLoading(true);
    try {
      const allUniqueNamesToFetch = [...new Set(overallTechStackNamesForPayload)];
      if (allUniqueNamesToFetch.length === 0 && (roadmapDetails.isConsolidated ? roadmapDetails.consolidatedRoles.length > 0 : roadmapDetails.singleRoleTechStacks.length > 0)) {
        // This case implies roles were defined but no tech stacks were selected for them overall.
        // Validation above should catch this, but as a safeguard:
        throw new Error("No tech stacks selected overall. Please select tech stacks for the defined roles.");
      }


      const techStackPromisesForHTML = allUniqueNamesToFetch.map(name => 
        getTechStackByName(name)
          .catch(err => {
            // If getTechStackByName itself throws (e.g. network error, or API rejects promise on 404)
            console.error(`Error fetching tech stack '${name}' by name:`, err.message);
            return { data: null, error: true, name }; // Mark as errored
          })
      );
      
      const techStackResultsForHTML = await Promise.all(techStackPromisesForHTML); // Changed from allSettled for simplicity in error handling here
      
      const fetchedFullTechStacksForHTML = [];
      const missingNamesForHTML = [];

      techStackResultsForHTML.forEach(result => {
        if (result && result.data && !result.error) { // Check for result.data and no explicit error marker
            fetchedFullTechStacksForHTML.push(result.data);
        } else {
            // Try to find the name that failed. If result.name is available, use it.
            // Otherwise, we need to map back from allUniqueNamesToFetch based on promise order.
            // This part is tricky if getTechStackByName doesn't return the name on error.
            // For now, assuming `result.name` is available if `getTechStackByName` was modified to include it on error.
            // A safer way is to map results back to original names by index.
            const originalName = result && result.name ? result.name : 
                                 allUniqueNamesToFetch[techStackResultsForHTML.indexOf(result)]; // Fallback if result.name not present
            if (originalName) missingNamesForHTML.push(originalName);
            console.error(`Failed to fetch or process tech stack: ${originalName || 'Unknown'}. API Response:`, result);
        }
      });


      if (missingNamesForHTML.length > 0) {
        throw new Error(`HTML Generation: Failed to fetch details for tech stack(s): ${missingNamesForHTML.join(', ')}. Please ensure these tech stacks exist in the database with the exact names.`);
      }
      
      let rolesForHtmlGenerator;
      if (roadmapDetails.isConsolidated) {
        rolesForHtmlGenerator = roadmapDetails.consolidatedRoles.map(role => ({
            title: role.title,
            techStacks: fetchedFullTechStacksForHTML.filter(tsData => role.selectedTechStacks.includes(tsData.name))
        }));
      } else {
        rolesForHtmlGenerator = [{
            title: roadmapDetails.singleRoleTitle,
            techStacks: fetchedFullTechStacksForHTML.filter(tsData => roadmapDetails.singleRoleTechStacks.includes(tsData.name))
        }];
      }
      
      const htmlContent = generateRoadmapHtml(roadmapDetails.companyName, rolesForHtmlGenerator, fetchedFullTechStacksForHTML);

      if (!htmlContent) {
        throw new Error('Failed to generate roadmap HTML content. The content was empty.');
      }
      
      const finalFilename = roadmapDetails.filename.trim().endsWith('.html') 
                            ? roadmapDetails.filename.trim() 
                            : `${roadmapDetails.filename.trim()}.html`;

      const githubResponse = await uploadToGithub({
        filename: finalFilename,
        content: htmlContent,
        description: `Roadmap for ${roadmapDetails.companyName} - ${roadmapDetails.isConsolidated ? 'Consolidated' : roadmapDetails.singleRoleTitle}`
      });

      setPublishedUrl(githubResponse.html_url || githubResponse.url);

      const metadataToSave = {
        companyName: roadmapDetails.companyName,
        role: roadmapDetails.isConsolidated ? 'Consolidated' : roadmapDetails.singleRoleTitle,
        techStacks: overallTechStackNamesForPayload,
        publishedUrl: githubResponse.html_url || githubResponse.url,
        filename: finalFilename,
        createdDate: new Date().toISOString(),
        isConsolidated: roadmapDetails.isConsolidated, // This is correct
        crmAffiliation: roadmapDetails.crmAffiliation || null, // Added, ensure null if empty
        roles: rolesForPayload 
      };
      
      await saveRoadmapMetadata(metadataToSave);

      setSuccess('Roadmap created and published successfully!');
      if (onRoadmapCreated) {
        onRoadmapCreated();
      }
    } catch (err) {
      console.error("Roadmap creation error details:", err);
      setError(err.message || err.response?.data?.error || 'Failed to create roadmap. Check console for details.');
    } finally {
      setUploadLoading(false);
    }
  };

  const handleCopyToClipboard = () => {
    navigator.clipboard.writeText(publishedUrl);
    setSuccess(prev => prev && prev.includes("published") ? prev : 'URL copied to clipboard!');
  }

  return (
    <Modal show={show} onHide={onHide} size="lg" centered backdrop="static" dialogClassName="wider-create-roadmap-modal">
      <Modal.Header closeButton>
        <Modal.Title>
            <i className="fas fa-plus-circle me-2 text-primary"></i>
            Create New Roadmap
        </Modal.Title>
      </Modal.Header>
      <Form onSubmit={handleSubmit}>
        <Modal.Body style={{ maxHeight: '70vh', overflowY: 'auto' }}>
          {error && <Alert variant="danger" onClose={() => setError(null)} dismissible>{error}</Alert>}
          {success && !publishedUrl && <Alert variant="success" onClose={() => setSuccess(null)} dismissible>{success}</Alert>}

          {publishedUrl ? (
            <div className="text-center py-4">
                <div className="mb-3">
                  <div className="success-icon bg-success bg-opacity-10 text-success mx-auto mb-3 d-flex align-items-center justify-content-center" style={{ width: '60px', height: '60px', borderRadius: '50%' }}>
                    <i className="fas fa-check fa-2x"></i>
                  </div>
                  <h4>Roadmap Published!</h4>
                  <p className="text-muted">{success}</p> {/* Shows "Roadmap created and published successfully!" or copy message */}
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
                      onClick={handleCopyToClipboard}
                      className="ms-2"
                      title="Copy URL"
                    >
                      <i className="fas fa-copy"></i>
                    </Button>
                  </div>
                </div>
              </div>
          ) : (
            <>
              <Form.Group className="mb-3">
                <Form.Label>Company Name <span className="text-danger">*</span></Form.Label>
                <Form.Control type="text" name="companyName" value={roadmapDetails.companyName} onChange={handleInputChange} required />
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>Filename <span className="text-danger">*</span></Form.Label>
                <InputGroup>
                    <Form.Control type="text" name="filename" value={roadmapDetails.filename} onChange={handleInputChange} required />
                    <InputGroup.Text>.html</InputGroup.Text>
                </InputGroup>
                <Form.Text className="text-muted">
                    Auto-generated based on company name. E.g., NIAT_X_CompanyName.html
                </Form.Text>
              </Form.Group>

              {user && user.role === 'admin' && (
                <Form.Group className="mb-3">
                  <Form.Label>Assign to CRM (Optional)</Form.Label>
                  <Form.Select
                    name="crmAffiliation"
                    value={roadmapDetails.crmAffiliation}
                    onChange={handleInputChange}
                  >
                    <option value="">None (General / Unassigned)</option>
                    {crmUsers.map(crm => (
                      <option key={crm._id} value={crm.username}>
                        {crm.displayName || crm.username} ({crm.username})
                      </option>
                    ))}
                  </Form.Select>
                  <Form.Text className="text-muted">Assigns this roadmap to a specific CRM dashboard.</Form.Text>
                </Form.Group>
              )}

              <Form.Group className="mb-3">
                <Form.Check type="switch" id="isConsolidatedSwitchCreateModal" label="Is Consolidated Roadmap?" name="isConsolidated"
                    checked={roadmapDetails.isConsolidated} onChange={handleInputChange}
                />
              </Form.Group>

              {!roadmapDetails.isConsolidated ? (
                <>
                  <Form.Group className="mb-3">
                    <Form.Label>Role Title <span className="text-danger">*</span></Form.Label>
                    <Form.Control type="text" name="singleRoleTitle" value={roadmapDetails.singleRoleTitle} onChange={handleInputChange} required={!roadmapDetails.isConsolidated}/>
                  </Form.Group>
                  <Form.Group className="mb-3">
                    <Form.Label>Tech Stacks for this Role <span className="text-danger">*</span></Form.Label>
                    <TechStackDropdown
                        techStacks={allTechStackOptions}
                        selectedTechStacks={roadmapDetails.singleRoleTechStacks}
                        onSelect={handleSingleRoleTechStackSelect}
                        loading={loadingDropdownOptions}
                        isFormField={true}
                    />
                    <Form.Text className="text-muted">Select one or more tech stacks.</Form.Text>
                  </Form.Group>
                </>
              ) : (
                <>
                  <h5 className="mt-4 mb-2">Configure Consolidated Roles</h5>
                  {roadmapDetails.consolidatedRoles.map((role, index) => (
                    <Card key={role.id} className="mb-3 p-3 bg-light border" style={{ overflow: 'visible', position: 'relative' }}>
                        <Row className="g-2 align-items-end">
                            <Col md={5}>
                                <Form.Group>
                                    <Form.Label className="small">Role Title #{index + 1} <span className="text-danger">*</span></Form.Label>
                                    <Form.Control type="text" value={role.title} 
                                        onChange={(e) => handleConsolidatedRoleChange(index, 'title', e.target.value)} required 
                                    />
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group style={{ position: 'relative' }}>
                                    <Form.Label className="small">Tech Stacks for {role.title || `Role ${index + 1}`} <span className="text-danger">*</span></Form.Label>
                                    <TechStackDropdown
                                        techStacks={allTechStackOptions}
                                        selectedTechStacks={role.selectedTechStacks}
                                        onSelect={(names) => handleConsolidatedRoleTechStackSelect(index, names)}
                                        loading={loadingDropdownOptions}
                                        isFormField={true}
                                    />
                                </Form.Group>
                            </Col>
                            <Col md={1} className="d-flex align-items-center justify-content-center">
                                {roadmapDetails.consolidatedRoles.length > 1 && (
                                    <Button variant="outline-danger" size="sm" onClick={() => removeConsolidatedRole(role.id)} title="Remove Role" className="w-100" style={{ marginTop: '1.5rem' }}>
                                        <i className="fas fa-times"></i>
                                    </Button>
                                )}
                            </Col>
                        </Row>
                    </Card>
                  ))}
                  <Button variant="outline-success" size="sm" onClick={addConsolidatedRole} className="mt-1">
                    <i className="fas fa-plus me-1"></i> Add Another Role
                  </Button>
                </>
              )}
            </>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={onHide}>
            {publishedUrl ? 'Close' : 'Cancel'}
          </Button>
          {!publishedUrl && (
            <Button variant="primary" type="submit" disabled={loadingDropdownOptions || uploadLoading}>
              {uploadLoading ? 
                <><Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" className="me-1" /> Publishing...</> :
                'Create & Publish Roadmap'}
            </Button>
          )}
           {publishedUrl && (
              <Button 
                variant="primary" 
                onClick={() => window.open(publishedUrl, '_blank')}
              >
                <i className="fas fa-external-link-alt me-2"></i>
                View Roadmap
              </Button>
            )}
        </Modal.Footer>
      </Form>
    </Modal>
  );
};

export default CreateRoadmapModal;