// // client/src/components/CreateRoadmapModal/CreateRoadmapModal.jsx
// import React, { useState, useEffect } from 'react';
// import { Modal, Button, Form, Row, Col, Spinner, Alert, Badge, InputGroup, Card } from 'react-bootstrap';
// import TechStackDropdown from '../TechStackDropdown/TechStackDropdown';
// import { getAllTechStacks as fetchAllTechStackOptionsForDropdown, getTechStackByName } from '../../services/techStackService';
// import { saveRoadmapMetadata } from '../../services/roadmapService';
// import { uploadToGithub } from '../../services/githubService';
// import { generateRoadmapHtml } from '../../utils/roadmapHtmlGenerator';
// import useAuth from '../../hooks/useAuth'; 
// import userService from '../../services/userService';

// const FOUNDATION_TRAINING_STACKS = ["HTML,CSS,BootStrap", "Javascript", "Python", "SQL", "Tailwind CSS"];

// const CreateRoadmapModal = ({ show, onHide, onRoadmapCreated }) => {
//   const { user } = useAuth(); 
//   const initialRoadmapState = {
//     companyName: '',
//     isConsolidated: false,
//     singleRoleTitle: '',
//     singleRoleTechStacks: [], // Stores names
//     consolidatedRoles: [{ id: Date.now(), title: '', selectedTechStacks: [] }], 
//     filename: '',
//     crmAffiliation: '', // Added
//   };

//   const [roadmapDetails, setRoadmapDetails] = useState(initialRoadmapState);
//   const [allTechStackOptions, setAllTechStackOptions] = useState([]); // Stores { _id, name } for dropdown
//   const [loadingDropdownOptions, setLoadingDropdownOptions] = useState(false);
//   const [uploadLoading, setUploadLoading] = useState(false);
//   const [actionLoading, setActionLoading] = useState(false); // Generic action loading state
//   const [error, setError] = useState(null);
//   const [success, setSuccess] = useState(null);
//   const [includeFoundationTraining, setIncludeFoundationTraining] = useState(false);
//   const [publishedUrl, setPublishedUrl] = useState('');
//   const [crmUsers, setCrmUsers] = useState([]); // Added

//   useEffect(() => {
//     if (show) {
//       setRoadmapDetails(initialRoadmapState);
//       setError(null);
//       setIncludeFoundationTraining(false);
//       setSuccess(null);
//       setPublishedUrl('');
//       setLoadingDropdownOptions(true);
//       fetchAllTechStackOptionsForDropdown()
//         .then(response => {
//           setAllTechStackOptions(response.data || []);
//         })
//         .catch((err) => {
//             console.error("Failed to load tech stack options:", err);
//             setError('Failed to load tech stack options. Please check the console for details.');
//         })
//         .finally(() => setLoadingDropdownOptions(false));

//       if (user && user.role === 'admin') {
//         const fetchCrmUsers = async () => {
//           try {
//             const response = await userService.getUsers();
//             setCrmUsers(response.data.filter(u => u.role === 'crm' && u.username));
//           } catch (err) {
//             console.error("Failed to load CRM users:", err);
//             // Optionally set a specific error for CRM user loading
//           }
//         };
//         fetchCrmUsers();
//       }
//     }
//   }, [show, user]); // Added user to dependency array

//   const handleAddNew = () => {
//     // Reset the form state to allow for a new roadmap creation
//     setRoadmapDetails(initialRoadmapState);
//     setPublishedUrl('');
//     setError(null);
//   };

//   useEffect(() => {
//     if (!publishedUrl) {
//       if (roadmapDetails.companyName) {
//         if (roadmapDetails.filename === '' || roadmapDetails.filename.startsWith('NIAT_X_')) {
//           setRoadmapDetails(prev => ({
//             ...prev,
//             filename: `NIAT_X_${roadmapDetails.companyName.replace(/\s+/g, '_')}`
//           }));
//         }
//       } else {
//         if (roadmapDetails.filename.startsWith('NIAT_X_')) {
//           setRoadmapDetails(prev => ({
//             ...prev,
//             filename: ''
//           }));
//         }
//       }
//     }
//   }, [roadmapDetails.companyName, roadmapDetails.filename, publishedUrl]);

//   useEffect(() => {
//     // This effect manages the auto-addition/removal of the Foundation Training role
//     // when the corresponding checkbox is toggled in consolidated mode.

//     // Only apply this logic if consolidated mode is active
//     if (!roadmapDetails.isConsolidated) {
//       return;
//     }

//     if (includeFoundationTraining) {
//       // Add the foundation role if checkbox is checked
//       const foundationRole = {
//         id: 'foundation-role', // A special static ID to identify this role
//         title: 'Foundation Training',
//         selectedTechStacks: FOUNDATION_TRAINING_STACKS
//       };

//       setRoadmapDetails(prev => ({
//         ...prev,
//         consolidatedRoles: [foundationRole, ...prev.consolidatedRoles.filter(r => r.id !== 'foundation-role')]
//       }));
//     } else {
//       // Remove the foundation role if checkbox is unchecked
//       setRoadmapDetails(prev => ({
//         ...prev,
//         consolidatedRoles: prev.consolidatedRoles.filter(r => r.id !== 'foundation-role')
//       }));
//     }
//   }, [includeFoundationTraining, roadmapDetails.isConsolidated]);


//   const handleInputChange = (e) => {
//     const { name, value, type, checked } = e.target;
//     setRoadmapDetails(prev => ({
//       ...prev,
//       [name]: type === 'checkbox' ? checked : value,
//     }));
//   };

//   const handleSingleRoleTechStackSelect = (selectedNames) => {
//     setRoadmapDetails(prev => ({ ...prev, singleRoleTechStacks: selectedNames }));
//   };

//   const handleConsolidatedRoleChange = (index, field, value) => {
//     const updatedRoles = [...roadmapDetails.consolidatedRoles];
//     updatedRoles[index][field] = value;
//     setRoadmapDetails(prev => ({ ...prev, consolidatedRoles: updatedRoles }));
//   };

//   const handleConsolidatedRoleTechStackSelect = (index, selectedNames) => {
//     const updatedRoles = [...roadmapDetails.consolidatedRoles];
//     updatedRoles[index].selectedTechStacks = selectedNames;
//     setRoadmapDetails(prev => ({ ...prev, consolidatedRoles: updatedRoles }));
//   };

//   const addConsolidatedRole = () => {
//     setRoadmapDetails(prev => ({
//       ...prev,
//       consolidatedRoles: [
//         ...prev.consolidatedRoles,
//         { id: Date.now(), title: '', selectedTechStacks: [] }
//       ]
//     }));
//   };

//   const removeConsolidatedRole = (idToRemove) => {
//     if (roadmapDetails.consolidatedRoles.length > 1) {
//       setRoadmapDetails(prev => ({
//         ...prev,
//         consolidatedRoles: prev.consolidatedRoles.filter(role => role.id !== idToRemove)
//       }));
//     }
//   };

//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     setError(null);
//     setSuccess(null);
//     // setPublishedUrl(''); // Keep published URL if it was already set from a previous attempt that failed later

//     if (!roadmapDetails.companyName.trim()) {
//       setError('Company name is required.');
//       return;
//     }
//     if (!roadmapDetails.filename.trim()) {
//         setError('Filename is required.');
//         return;
//     }

//     let rolesForPayload;
//     let overallTechStackNamesForPayload;

//     if (roadmapDetails.isConsolidated) {
//       if (roadmapDetails.consolidatedRoles.some(role => !role.title.trim() || role.selectedTechStacks.length === 0)) {
//         setError('All consolidated roles must have a title and at least one tech stack selected.');
//         return;
//       }
//       rolesForPayload = roadmapDetails.consolidatedRoles.map(role => ({
//         title: role.title,
//         techStacks: role.selectedTechStacks // Array of tech stack *names*
//       }));
//       overallTechStackNamesForPayload = [...new Set(roadmapDetails.consolidatedRoles.flatMap(role => role.selectedTechStacks))];
//     } else {
//       if (!roadmapDetails.singleRoleTitle.trim() || roadmapDetails.singleRoleTechStacks.length === 0) {
//         setError('Role title and at least one tech stack are required for a single role roadmap.');
//         return;
//       }
//       rolesForPayload = []; 
//       overallTechStackNamesForPayload = roadmapDetails.singleRoleTechStacks;
//     }

//     setUploadLoading(true);
//     try {
//       const allUniqueNamesToFetch = [...new Set(overallTechStackNamesForPayload)];
//       if (allUniqueNamesToFetch.length === 0 && (roadmapDetails.isConsolidated ? roadmapDetails.consolidatedRoles.length > 0 : roadmapDetails.singleRoleTechStacks.length > 0)) {
//         // This case implies roles were defined but no tech stacks were selected for them overall.
//         // Validation above should catch this, but as a safeguard:
//         throw new Error("No tech stacks selected overall. Please select tech stacks for the defined roles.");
//       }


//       const techStackPromisesForHTML = allUniqueNamesToFetch.map(name => 
//         getTechStackByName(name)
//           .catch(err => {
//             // If getTechStackByName itself throws (e.g. network error, or API rejects promise on 404)
//             console.error(`Error fetching tech stack '${name}' by name:`, err.message);
//             return { data: null, error: true, name }; // Mark as errored
//           })
//       );
      
//       const techStackResultsForHTML = await Promise.all(techStackPromisesForHTML); // Changed from allSettled for simplicity in error handling here
      
//       const fetchedFullTechStacksForHTML = [];
//       const missingNamesForHTML = [];

//       techStackResultsForHTML.forEach(result => {
//         if (result && result.data && !result.error) { // Check for result.data and no explicit error marker
//             fetchedFullTechStacksForHTML.push(result.data);
//         } else {
//             // Try to find the name that failed. If result.name is available, use it.
//             // Otherwise, we need to map back from allUniqueNamesToFetch based on promise order.
//             // This part is tricky if getTechStackByName doesn't return the name on error.
//             // For now, assuming `result.name` is available if `getTechStackByName` was modified to include it on error.
//             // A safer way is to map results back to original names by index.
//             const originalName = result && result.name ? result.name : 
//                                  allUniqueNamesToFetch[techStackResultsForHTML.indexOf(result)]; // Fallback if result.name not present
//             if (originalName) missingNamesForHTML.push(originalName);
//             console.error(`Failed to fetch or process tech stack: ${originalName || 'Unknown'}. API Response:`, result);
//         }
//       });


//       if (missingNamesForHTML.length > 0) {
//         throw new Error(`HTML Generation: Failed to fetch details for tech stack(s): ${missingNamesForHTML.join(', ')}. Please ensure these tech stacks exist in the database with the exact names.`);
//       }
      
//       let rolesForHtmlGenerator;
//       if (roadmapDetails.isConsolidated) {
//         rolesForHtmlGenerator = roadmapDetails.consolidatedRoles.map(role => ({
//             title: role.title,
//             techStacks: fetchedFullTechStacksForHTML.filter(tsData => role.selectedTechStacks.includes(tsData.name))
//         }));
//       } else {
//         rolesForHtmlGenerator = [{
//             title: roadmapDetails.singleRoleTitle,
//             techStacks: fetchedFullTechStacksForHTML.filter(tsData => roadmapDetails.singleRoleTechStacks.includes(tsData.name))
//         }];
//       }
      
//       const htmlContent = generateRoadmapHtml(roadmapDetails.companyName, rolesForHtmlGenerator, fetchedFullTechStacksForHTML);

//       if (!htmlContent) {
//         throw new Error('Failed to generate roadmap HTML content. The content was empty.');
//       }
      
//       const finalFilename = roadmapDetails.filename.trim().endsWith('.html') 
//                             ? roadmapDetails.filename.trim() 
//                             : `${roadmapDetails.filename.trim()}.html`;

//       const githubResponse = await uploadToGithub({
//         filename: finalFilename,
//         content: htmlContent,
//         description: `Roadmap for ${roadmapDetails.companyName} - ${roadmapDetails.isConsolidated ? 'Consolidated' : roadmapDetails.singleRoleTitle}`
//       });

//       setPublishedUrl(githubResponse.html_url || githubResponse.url);

//       const metadataToSave = {
//         companyName: roadmapDetails.companyName,
//         role: roadmapDetails.isConsolidated ? 'Consolidated' : roadmapDetails.singleRoleTitle,
//         techStacks: overallTechStackNamesForPayload,
//         publishedUrl: githubResponse.html_url || githubResponse.url,
//         filename: finalFilename,
//         createdDate: new Date().toISOString(),
//         isConsolidated: roadmapDetails.isConsolidated, // This is correct
//         crmAffiliation: roadmapDetails.crmAffiliation || null, // Added, ensure null if empty
//         roles: rolesForPayload 
//       };
      
//       await saveRoadmapMetadata(metadataToSave);

//       if (onRoadmapCreated) {
//         onRoadmapCreated();
//       }
//     } catch (err) {
//       console.error("Roadmap creation error details:", err);
//       setError(err.message || err.response?.data?.error || 'Failed to create roadmap. Check console for details.');
//     } finally {
//       setUploadLoading(false);
//     }
//   };

//   const handleCopyToClipboard = () => {
//     navigator.clipboard.writeText(publishedUrl);
//     setSuccess(prev => prev && prev.includes("published") ? prev : 'URL copied to clipboard!');
//   }

//   return (
//     <Modal show={show} onHide={onHide} size="lg" centered backdrop="static" dialogClassName="wider-create-roadmap-modal">
//       <Modal.Header closeButton>
//         <Modal.Title>
//             <i className="fas fa-plus-circle me-2 text-primary"></i>
//             Create New Roadmap
//         </Modal.Title>
//       </Modal.Header>
//       <Form onSubmit={handleSubmit}>
//         <Modal.Body style={{ maxHeight: '70vh', overflowY: 'auto' }}>
//           {error && <Alert variant="danger" onClose={() => setError(null)} dismissible>{error}</Alert>}
//           {success && <Alert variant="success" onClose={() => setSuccess(null)} dismissible>{success}</Alert>}

//           {publishedUrl ? (
//             <div className="text-center py-4">
//                 <div className="mb-3">
//                   <div className="success-icon bg-success bg-opacity-10 text-success mx-auto mb-3 d-flex align-items-center justify-content-center" style={{ width: '60px', height: '60px', borderRadius: '50%' }}>
//                     <i className="fas fa-check fa-2x"></i>
//                   </div>
//                   <h4>Roadmap Published!</h4>
//                   <p className="text-muted">{success}</p> 
//                 </div>
                
//                 <div className="bg-light p-3 rounded mb-3">
//                   <div className="d-flex align-items-center">
//                     <div className="flex-grow-1 text-truncate">
//                       <a 
//                         href={publishedUrl} 
//                         target="_blank" 
//                         rel="noopener noreferrer"
//                         className="text-primary text-break"
//                       >
//                         {publishedUrl}
//                       </a>
//                     </div>
//                     <Button 
//                       variant="outline-secondary" 
//                       size="sm"
//                       onClick={handleCopyToClipboard}
//                       className="ms-2"
//                       title="Copy URL"
//                     >
//                       <i className="fas fa-copy"></i>
//                     </Button>
//                   </div>
//                 </div>
//               </div>
//           ) : (
//             <>
//               <Form.Group className="mb-3">
//                 <Form.Label>Company Name <span className="text-danger">*</span></Form.Label>
//                 <Form.Control type="text" name="companyName" value={roadmapDetails.companyName} onChange={handleInputChange} required />
//               </Form.Group>

//               <Form.Group className="mb-3">
//                 <Form.Label>Filename <span className="text-danger">*</span></Form.Label>
//                 <InputGroup>
//                     <Form.Control type="text" name="filename" value={roadmapDetails.filename} onChange={handleInputChange} required />
//                     <InputGroup.Text>.html</InputGroup.Text>
//                 </InputGroup>
//                 <Form.Text className="text-muted">
//                     Auto-generated based on company name. E.g., NIAT_X_CompanyName.html
//                 </Form.Text>
//               </Form.Group>

//               {user && user.role === 'admin' && (
//                 <Form.Group className="mb-3">
//                   <Form.Label>Assign to CRM (Optional)</Form.Label>
//                   <Form.Select
//                     name="crmAffiliation"
//                     value={roadmapDetails.crmAffiliation}
//                     onChange={handleInputChange}
//                   >
//                     <option value="">None (General / Unassigned)</option>
//                     {crmUsers.map(crm => (
//                       <option key={crm._id} value={crm.username}>
//                         {crm.displayName || crm.username} ({crm.username})
//                       </option>
//                     ))}
//                   </Form.Select>
//                   <Form.Text className="text-muted">Assigns this roadmap to a specific CRM dashboard.</Form.Text>
//                 </Form.Group>
//               )}

//               <Form.Group className="mb-3">
//                 <Form.Check type="switch" id="isConsolidatedSwitchCreateModal" label="Is Consolidated Roadmap?" name="isConsolidated"
//                     checked={roadmapDetails.isConsolidated} onChange={handleInputChange}
//                 />
//               </Form.Group>
              
//               {roadmapDetails.isConsolidated && (
//                   <Form.Group className="mb-3 ms-4">
//                     <Form.Check 
//                         type="switch"
//                         id="foundationTrainingSwitch"
//                         label="Include Foundation Training"
//                         checked={includeFoundationTraining}
//                         onChange={(e) => setIncludeFoundationTraining(e.target.checked)}
//                     />
//                   </Form.Group>
//               )}

//               {!roadmapDetails.isConsolidated ? (
//                 <>
//                   <Form.Group className="mb-3">
//                     <Form.Label>Role Title <span className="text-danger">*</span></Form.Label>
//                     <Form.Control type="text" name="singleRoleTitle" value={roadmapDetails.singleRoleTitle} onChange={handleInputChange} required={!roadmapDetails.isConsolidated}/>
//                   </Form.Group>
//                   <Form.Group className="mb-3">
//                     <Form.Label>Tech Stacks for this Role <span className="text-danger">*</span></Form.Label>
//                     <TechStackDropdown
//                         techStacks={allTechStackOptions}
//                         selectedTechStacks={roadmapDetails.singleRoleTechStacks}
//                         onSelect={handleSingleRoleTechStackSelect}
//                         loading={loadingDropdownOptions}
//                         isFormField={true}
//                     />
//                     <Form.Text className="text-muted">Select one or more tech stacks.</Form.Text>
//                   </Form.Group>
//                 </>
//               ) : (
//                 <>
//                   {roadmapDetails.consolidatedRoles.map((role, index) => (
//                     (() => {
//                         const isFoundationRole = role.id === 'foundation-role';
//                         return (
//                           <Card key={role.id} className="mb-3 p-3 bg-light border" style={{ overflow: 'visible', position: 'relative' }}>
//                               <Row className="g-2 align-items-end">
//                                   <Col md={5}>
//                                       <Form.Group>
//                                           <Form.Label className="small">Role Title #{index + 1} <span className="text-danger">*</span></Form.Label>
//                                           <Form.Control type="text" value={role.title}
//                                               onChange={(e) => handleConsolidatedRoleChange(index, 'title', e.target.value)} required
//                                           />
//                                       </Form.Group>
//                                   </Col>
//                                   <Col md={6}>
//                                       <Form.Label className="small">Tech Stacks for {role.title || `Role ${index + 1}`} <span className="text-danger">*</span></Form.Label>
//                                       <TechStackDropdown
//                                           techStacks={allTechStackOptions}
//                                           selectedTechStacks={role.selectedTechStacks}
//                                           onSelect={(names) => handleConsolidatedRoleTechStackSelect(index, names)}
//                                           loading={loadingDropdownOptions}
//                                           isFormField={true}
//                                       />
//                                   </Col>
//                                   <Col md={1} className="d-flex align-items-center justify-content-center">
//                                       <Button variant="outline-danger" size="sm" onClick={() => removeConsolidatedRole(role.id)} title="Remove Role" className="w-100" style={{ marginTop: '1.5rem' }} disabled={isFoundationRole}>
//                                           <i className="fas fa-times"></i>
//                                       </Button>
//                                   </Col>
//                               </Row>
//                           </Card>
//                         );
//                       })()
//                   ))}
//                   <Button variant="outline-success" size="sm" onClick={addConsolidatedRole} className="mt-1" disabled={actionLoading || uploadLoading}>
//                      <i className="fas fa-plus me-1"></i> Add Another Role
//                    </Button>
//                 </>
//               )}
//             </>
//           )}
//         </Modal.Body>
//         <Modal.Footer>
//           <Button variant="secondary" onClick={onHide}>
//             {publishedUrl ? 'Close' : 'Cancel'}
//           </Button>
//           {!publishedUrl && (
//             <Button variant="primary" type="submit" disabled={loadingDropdownOptions || uploadLoading}>
//               {uploadLoading ? 
//                 <><Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" className="me-1" /> Publishing...</> :
//                 'Create & Publish Roadmap'}
//             </Button>
//           )}
//            {publishedUrl && (
//               <Button 
//                 variant="primary" 
//                 onClick={handleAddNew}
//               >
//                 <i className="fas fa-plus me-2"></i>
//                 Add roadmap
//               </Button>
//             )}
//         </Modal.Footer>
//       </Form>
//     </Modal>
//   );
// };

// export default CreateRoadmapModal;


// client/src/components/CreateRoadmapModal/CreateRoadmapModal.jsx
import React, { useState, useEffect } from 'react';
import { Modal, Button, Form, Row, Col, Spinner, Alert, Card, InputGroup } from 'react-bootstrap';
import TechStackDropdown from '../TechStackDropdown/TechStackDropdown';
import { getAllTechStacks as fetchAllTechStackOptionsForDropdown, getTechStackByName } from '../../services/techStackService';
import { saveRoadmapMetadata } from '../../services/roadmapService';
import { uploadToGithub } from '../../services/githubService';
import { generateRoadmapHtml } from '../../utils/roadmapHtmlGenerator';
import useAuth from '../../hooks/useAuth';
import userService from '../../services/userService';

// Defined as a constant for easy maintenance
const FOUNDATION_TRAINING_STACK_NAMES = ["HTML,CSS,BootStrap", "Javascript", "Python", "SQL", "Tailwind CSS"];

const CreateRoadmapModal = ({ show, onHide, onRoadmapCreated }) => {
  const { user } = useAuth();
  const initialRoadmapState = {
    companyName: '',
    isConsolidated: false,
    singleRoleTitle: '',
    singleRoleTechStacks: [], // Stores names
    consolidatedRoles: [{ id: Date.now(), title: '', selectedTechStacks: [] }],
    filename: '',
    crmAffiliation: '',
  };

  const [roadmapDetails, setRoadmapDetails] = useState(initialRoadmapState);
  const [allTechStackOptions, setAllTechStackOptions] = useState([]);
  const [loadingDropdownOptions, setLoadingDropdownOptions] = useState(false);
  const [uploadLoading, setUploadLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [includeFoundationTraining, setIncludeFoundationTraining] = useState(false);
  const [publishedUrl, setPublishedUrl] = useState('');
  const [crmUsers, setCrmUsers] = useState([]);

  useEffect(() => {
    const fetchPrerequisites = async () => {
        if (!show) return;

        // Reset state for a fresh modal session
        setRoadmapDetails(initialRoadmapState);
        setError(null);
        setSuccess(null);
        setPublishedUrl('');
        setIncludeFoundationTraining(false);
        setLoadingDropdownOptions(true);
        setUploadLoading(false); // Also reset upload loading state

        try {
            const [techStacksRes, crmRes] = await Promise.all([
                fetchAllTechStackOptionsForDropdown(),
                (user && user.role === 'admin') ? userService.getUsers() : Promise.resolve({ data: [] })
            ]);

            setAllTechStackOptions(techStacksRes.data || []);
            setCrmUsers((crmRes.data || []).filter(u => u.role === 'crm' && u.username));
        } catch (err) {
            console.error("Failed to load prerequisites for modal:", err);
            setError("Failed to load initial data. " + (err.response?.data?.error || err.message));
        } finally {
            setLoadingDropdownOptions(false);
        }
    };
    fetchPrerequisites();
  }, [show, user?.role]);

  // Effect to auto-generate filename
  useEffect(() => {
    if (!publishedUrl) {
      setRoadmapDetails(prev => ({
        ...prev,
        filename: prev.companyName ? `NIAT_X_${prev.companyName.replace(/\s+/g, '_')}` : ''
      }));
    }
  }, [roadmapDetails.companyName, publishedUrl]);

  // Effect to manage Foundation Training role
  useEffect(() => {
    if (!roadmapDetails.isConsolidated) return;

    if (includeFoundationTraining) {
      if (!roadmapDetails.consolidatedRoles.some(r => r.id === 'foundation-role')) {
          setRoadmapDetails(prev => ({
            ...prev,
            consolidatedRoles: [
                { id: 'foundation-role', title: 'Foundation Training', selectedTechStacks: FOUNDATION_TRAINING_STACK_NAMES, isLocked: true },
                ...prev.consolidatedRoles
            ]
          }));
      }
    } else {
      if (roadmapDetails.consolidatedRoles.some(r => r.id === 'foundation-role')) {
        setRoadmapDetails(prev => ({
            ...prev,
            consolidatedRoles: prev.consolidatedRoles.filter(r => r.id !== 'foundation-role')
        }));
      }
    }
  }, [includeFoundationTraining, roadmapDetails.isConsolidated]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setRoadmapDetails(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleSingleRoleTechStackSelect = (names) => setRoadmapDetails(prev => ({ ...prev, singleRoleTechStacks: names }));

  const handleConsolidatedRoleChange = (roleId, field, value) => {
    setRoadmapDetails(prev => ({...prev, consolidatedRoles: prev.consolidatedRoles.map(r => r.id === roleId ? { ...r, [field]: value } : r)}));
  };

  const handleConsolidatedRoleTechStackSelect = (roleId, names) => {
    setRoadmapDetails(prev => ({...prev, consolidatedRoles: prev.consolidatedRoles.map(r => r.id === roleId ? { ...r, selectedTechStacks: names } : r)}));
  };

  const addConsolidatedRole = () => setRoadmapDetails(prev => ({ ...prev, consolidatedRoles: [...prev.consolidatedRoles, { id: Date.now(), title: '', selectedTechStacks: [] }]}));

  const removeConsolidatedRole = (roleId) => setRoadmapDetails(prev => ({ ...prev, consolidatedRoles: prev.consolidatedRoles.filter(role => role.id !== roleId)}));
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!roadmapDetails.companyName.trim() || !roadmapDetails.filename.trim()) {
      setError('Company name and Filename are required.');
      return;
    }
    
    setUploadLoading(true);
    try {
        const allUniqueNamesToFetch = [...new Set(
            roadmapDetails.isConsolidated
                ? roadmapDetails.consolidatedRoles.flatMap(role => role.selectedTechStacks)
                : roadmapDetails.singleRoleTechStacks
        )];
        
        const techStackPromises = allUniqueNamesToFetch.map(name => getTechStackByName(name).catch(err => ({ data: null, name })));
        const techStackResults = await Promise.all(techStackPromises);
        
        const fetchedFullTechStacksForHTML = techStackResults.map(res => res.data).filter(Boolean);
        const missingNames = techStackResults.filter(res => !res.data).map(res => res.name);

        if (missingNames.length > 0) {
            throw new Error(`Failed to fetch tech stack details for: ${missingNames.join(', ')}.`);
        }

        const rolesForHtmlGen = roadmapDetails.isConsolidated
            ? roadmapDetails.consolidatedRoles.map(role => ({
                title: role.title,
                techStacks: fetchedFullTechStacksForHTML.filter(ts => role.selectedTechStacks.includes(ts.name))
            }))
            : [{ title: roadmapDetails.singleRoleTitle, techStacks: fetchedFullTechStacksForHTML }];

        const htmlContent = generateRoadmapHtml(roadmapDetails.companyName, rolesForHtmlGen);
        if (!htmlContent) throw new Error("Failed to generate roadmap HTML content.");

        const finalFilename = roadmapDetails.filename.endsWith('.html') ? roadmapDetails.filename : `${roadmapDetails.filename}.html`;

        const githubRes = await uploadToGithub({ filename: finalFilename, content: htmlContent, description: `Roadmap for ${roadmapDetails.companyName}` });
        
        const dbPayload = {
            companyName: roadmapDetails.companyName,
            isConsolidated: roadmapDetails.isConsolidated,
            crmAffiliation: roadmapDetails.crmAffiliation,
            filename: finalFilename,
            publishedUrl: githubRes.html_url,
            role: roadmapDetails.isConsolidated ? "Consolidated" : roadmapDetails.singleRoleTitle,
            techStacks: roadmapDetails.isConsolidated ? [] : roadmapDetails.singleRoleTechStacks, 
            roles: roadmapDetails.isConsolidated ? roadmapDetails.consolidatedRoles.map(r => ({title: r.title, techStacks: r.selectedTechStacks})) : []
        };
        
        await saveRoadmapMetadata(dbPayload);

        setPublishedUrl(githubRes.html_url);
        if (onRoadmapCreated) onRoadmapCreated();
        setSuccess('Roadmap published and saved successfully!');

    } catch (err) {
        console.error("Roadmap creation error:", err);
        setError(err.message || "Failed to create roadmap. Check console for details.");
    } finally {
        setUploadLoading(false);
    }
  };
  
  // ----- FIX IS HERE -----
  // This function now resets the entire form state to its initial condition.
  const handleAddNew = () => {
    // A fresh initial state object is created to avoid stale `Date.now()` values for keys.
    const newInitialState = {
        companyName: '',
        isConsolidated: false,
        singleRoleTitle: '',
        singleRoleTechStacks: [],
        consolidatedRoles: [{ id: Date.now(), title: '', selectedTechStacks: [] }],
        filename: '',
        crmAffiliation: '',
    };
    
    // Reset all state variables for a clean form.
    setRoadmapDetails(newInitialState);
    setPublishedUrl('');
    setError(null);
    setSuccess(null);
    setIncludeFoundationTraining(false);
  };

  return (
    <Modal show={show} onHide={onHide} size="lg" centered backdrop="static" dialogClassName="create-roadmap-modal">
      <Form onSubmit={handleSubmit}>
        <Modal.Header closeButton>
          <Modal.Title><i className="fas fa-plus-circle me-2 text-primary"></i>Create New Company Roadmap</Modal.Title>
        </Modal.Header>
        <Modal.Body style={{ maxHeight: '70vh', overflowY: 'auto' }}>
          {error && <Alert variant="danger" onClose={() => setError(null)} dismissible>{error}</Alert>}
          
          {publishedUrl ? (
            <div className="text-center p-4">
              <i className="fas fa-check-circle text-success fa-3x mb-3"></i>
              <h4>Roadmap Published!</h4>
              <p className="text-muted">You can copy the link below or create a new roadmap.</p>
              <InputGroup className="mb-3">
                <Form.Control value={publishedUrl} readOnly />
                <Button variant="outline-secondary" onClick={() => navigator.clipboard.writeText(publishedUrl)}><i className="fas fa-copy"></i></Button>
              </InputGroup>
            </div>
          ) : (
            <>
              <Row className="mb-3">
                <Col md={6}><Form.Group><Form.Label>Company Name <span className="text-danger">*</span></Form.Label><Form.Control type="text" name="companyName" value={roadmapDetails.companyName} onChange={handleInputChange} required /></Form.Group></Col>
                <Col md={6}><Form.Group><Form.Label>Filename (auto-filled) <span className="text-danger">*</span></Form.Label><Form.Control type="text" name="filename" value={roadmapDetails.filename} onChange={handleInputChange} required /></Form.Group></Col>
              </Row>
              {user.role === 'admin' && (
                  <Form.Group className="mb-3">
                      <Form.Label>Assign to CRM (Optional)</Form.Label>
                      <Form.Select name="crmAffiliation" value={roadmapDetails.crmAffiliation} onChange={handleInputChange}><option value="">General / Unassigned</option>{crmUsers.map(c => <option key={c._id} value={c.username}>{c.displayName || c.username}</option>)}</Form.Select>
                  </Form.Group>
              )}
              <Form.Group className="mb-3"><Form.Check type="switch" id="isConsolidatedSwitch" label="Is Consolidated Roadmap?" name="isConsolidated" checked={roadmapDetails.isConsolidated} onChange={handleInputChange}/></Form.Group>

              {!roadmapDetails.isConsolidated ? (
                <>
                  <Form.Group className="mb-3"><Form.Label>Role Title <span className="text-danger">*</span></Form.Label><Form.Control type="text" name="singleRoleTitle" value={roadmapDetails.singleRoleTitle} onChange={handleInputChange} required={!roadmapDetails.isConsolidated}/></Form.Group>
                  <Form.Group className="mb-3"><Form.Label>Select Tech Stacks</Form.Label><TechStackDropdown techStacks={allTechStackOptions} selectedTechStacks={roadmapDetails.singleRoleTechStacks} onSelect={handleSingleRoleTechStackSelect} loading={loadingDropdownOptions} isFormField={true}/></Form.Group>
                </>
              ) : (
                <>
                  <Form.Group className="mb-3 ms-4"><Form.Check type="switch" id="foundationTrainingSwitch" label="Auto-include Foundation Training Role" checked={includeFoundationTraining} onChange={(e) => setIncludeFoundationTraining(e.target.checked)} /></Form.Group>
                  {roadmapDetails.consolidatedRoles.map((role, index) => {
                    const isFoundationRole = role.id === 'foundation-role';
                    return (
                        <Card key={role.id} className="mb-3 p-3 bg-light border" style={{ overflow: 'visible' }}>
                          <Row className="g-2 align-items-end">
                              <Col md={isFoundationRole ? 12 : 5}><Form.Group><Form.Label className="small">Role Title #{index + 1} <span className="text-danger">*</span></Form.Label><Form.Control type="text" value={role.title} onChange={(e) => handleConsolidatedRoleChange(role.id, 'title', e.target.value)} required disabled={isFoundationRole} /></Form.Group></Col>
                              <Col md={isFoundationRole ? 12 : 6} className="mt-md-0 mt-3">
                                  <Form.Label className="small">Select Tech Stacks</Form.Label>
                                  <TechStackDropdown techStacks={allTechStackOptions} selectedTechStacks={role.selectedTechStacks} onSelect={(names) => handleConsolidatedRoleTechStackSelect(role.id, names)} loading={loadingDropdownOptions} isFormField={true} zIndex={10 + (roadmapDetails.consolidatedRoles.length - index)} disabled={isFoundationRole}/>
                              </Col>
                              {!isFoundationRole && <Col md={1} className="d-flex"><Button variant="outline-danger" size="sm" onClick={() => removeConsolidatedRole(role.id)} className="w-100 mt-auto" title="Remove Role"><i className="fas fa-times"></i></Button></Col>}
                          </Row>
                        </Card>
                    );
                  })}
                  <Button variant="outline-success" size="sm" onClick={addConsolidatedRole}><i className="fas fa-plus me-1"></i> Add Role</Button>
                </>
              )}
            </>
          )}
        </Modal.Body>
        <Modal.Footer>
          {publishedUrl ? 
            <>
                <Button variant="secondary" onClick={onHide}>Close</Button>
                <Button variant="primary" onClick={handleAddNew}><i className="fas fa-plus me-2"></i>Create Another Roadmap</Button>
            </>
            : 
            <>
                <Button variant="secondary" onClick={onHide}>Cancel</Button>
                <Button variant="primary" type="submit" disabled={uploadLoading}>{uploadLoading ? <><Spinner as="span" size="sm"/> Publishing...</> : 'Create & Publish'}</Button>
            </>
          }
        </Modal.Footer>
      </Form>
      <style>{`
          .create-roadmap-modal .modal-dialog {
              max-width: 800px;
          }
      `}</style>
    </Modal>
  );
};

export default CreateRoadmapModal;
