// // client/src/components/CreateRoadmapModal/CreateRoadmapModal.jsx
// import React, { useState, useEffect } from 'react';
// import { Modal, Button, Form, Row, Col, Spinner, Alert, Card, InputGroup } from 'react-bootstrap';
// import TechStackDropdown from '../TechStackDropdown/TechStackDropdown';
// import { getAllTechStacks as fetchAllTechStackOptionsForDropdown, getTechStackByName } from '../../services/techStackService';
// import { saveRoadmapMetadata } from '../../services/roadmapService';
// import { uploadToGithub } from '../../services/githubService';
// import { generateRoadmapHtml } from '../../utils/roadmapHtmlGenerator';
// import useAuth from '../../hooks/useAuth';
// import userService from '../../services/userService';

// // Defined as a constant for easy maintenance
// const FOUNDATION_TRAINING_STACK_NAMES = ["HTML,CSS,BootStrap", "Javascript", "Python", "SQL", "Tailwind CSS"];

// const CreateRoadmapModal = ({ show, onHide, onRoadmapCreated }) => {
//   const { user } = useAuth();
//   const initialRoadmapState = {
//     companyName: '',
//     isConsolidated: false,
//     singleRoleTitle: '',
//     singleRoleTechStacks: [], // Stores names
//     consolidatedRoles: [{ id: Date.now(), title: '', selectedTechStacks: [] }],
//     filename: '',
//     crmAffiliation: '',
//   };

//   const [roadmapDetails, setRoadmapDetails] = useState(initialRoadmapState);
//   const [allTechStackOptions, setAllTechStackOptions] = useState([]);
//   const [loadingDropdownOptions, setLoadingDropdownOptions] = useState(false);
//   const [uploadLoading, setUploadLoading] = useState(false);
//   const [error, setError] = useState(null);
//   const [success, setSuccess] = useState(null);
//   const [includeFoundationTraining, setIncludeFoundationTraining] = useState(false);
//   const [publishedUrl, setPublishedUrl] = useState('');
//   const [crmUsers, setCrmUsers] = useState([]);

//   useEffect(() => {
//     const fetchPrerequisites = async () => {
//         if (!show) return;

//         // Reset state for a fresh modal session
//         setRoadmapDetails(initialRoadmapState);
//         setError(null);
//         setSuccess(null);
//         setPublishedUrl('');
//         setIncludeFoundationTraining(false);
//         setLoadingDropdownOptions(true);
//         setUploadLoading(false); // Also reset upload loading state

//         try {
//             const [techStacksRes, crmRes] = await Promise.all([
//                 fetchAllTechStackOptionsForDropdown(),
//                 (user && user.role === 'admin') ? userService.getUsers() : Promise.resolve({ data: [] })
//             ]);

//             setAllTechStackOptions(techStacksRes.data || []);
//             setCrmUsers((crmRes.data || []).filter(u => u.role === 'crm' && u.username));
//         } catch (err) {
//             console.error("Failed to load prerequisites for modal:", err);
//             setError("Failed to load initial data. " + (err.response?.data?.error || err.message));
//         } finally {
//             setLoadingDropdownOptions(false);
//         }
//     };
//     fetchPrerequisites();
//   }, [show, user?.role]);

//   // Effect to auto-generate filename
//   useEffect(() => {
//     if (!publishedUrl) {
//       setRoadmapDetails(prev => ({
//         ...prev,
//         filename: prev.companyName ? `NIAT_X_${prev.companyName.replace(/\s+/g, '_')}` : ''
//       }));
//     }
//   }, [roadmapDetails.companyName, publishedUrl]);

//   // Effect to manage Foundation Training role
//   useEffect(() => {
//     if (!roadmapDetails.isConsolidated) return;

//     if (includeFoundationTraining) {
//       if (!roadmapDetails.consolidatedRoles.some(r => r.id === 'foundation-role')) {
//           setRoadmapDetails(prev => ({
//             ...prev,
//             consolidatedRoles: [
//                 { id: 'foundation-role', title: 'Foundation Training', selectedTechStacks: FOUNDATION_TRAINING_STACK_NAMES, isLocked: true },
//                 ...prev.consolidatedRoles
//             ]
//           }));
//       }
//     } else {
//       if (roadmapDetails.consolidatedRoles.some(r => r.id === 'foundation-role')) {
//         setRoadmapDetails(prev => ({
//             ...prev,
//             consolidatedRoles: prev.consolidatedRoles.filter(r => r.id !== 'foundation-role')
//         }));
//       }
//     }
//   }, [includeFoundationTraining, roadmapDetails.isConsolidated]);

//   const handleInputChange = (e) => {
//     const { name, value, type, checked } = e.target;
//     setRoadmapDetails(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
//   };

//   const handleSingleRoleTechStackSelect = (names) => setRoadmapDetails(prev => ({ ...prev, singleRoleTechStacks: names }));

//   const handleConsolidatedRoleChange = (roleId, field, value) => {
//     setRoadmapDetails(prev => ({...prev, consolidatedRoles: prev.consolidatedRoles.map(r => r.id === roleId ? { ...r, [field]: value } : r)}));
//   };

//   const handleConsolidatedRoleTechStackSelect = (roleId, names) => {
//     setRoadmapDetails(prev => ({...prev, consolidatedRoles: prev.consolidatedRoles.map(r => r.id === roleId ? { ...r, selectedTechStacks: names } : r)}));
//   };

//   const addConsolidatedRole = () => setRoadmapDetails(prev => ({ ...prev, consolidatedRoles: [...prev.consolidatedRoles, { id: Date.now(), title: '', selectedTechStacks: [] }]}));

//   const removeConsolidatedRole = (roleId) => setRoadmapDetails(prev => ({ ...prev, consolidatedRoles: prev.consolidatedRoles.filter(role => role.id !== roleId)}));
  
//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     setError(null);
//     setSuccess(null);

//     if (!roadmapDetails.companyName.trim() || !roadmapDetails.filename.trim()) {
//       setError('Company name and Filename are required.');
//       return;
//     }
    
//     setUploadLoading(true);
//     try {
//         const allUniqueNamesToFetch = [...new Set(
//             roadmapDetails.isConsolidated
//                 ? roadmapDetails.consolidatedRoles.flatMap(role => role.selectedTechStacks)
//                 : roadmapDetails.singleRoleTechStacks
//         )];
        
//         const techStackPromises = allUniqueNamesToFetch.map(name => getTechStackByName(name).catch(err => ({ data: null, name })));
//         const techStackResults = await Promise.all(techStackPromises);
        
//         const fetchedFullTechStacksForHTML = techStackResults.map(res => res.data).filter(Boolean);
//         const missingNames = techStackResults.filter(res => !res.data).map(res => res.name);

//         if (missingNames.length > 0) {
//             throw new Error(`Failed to fetch tech stack details for: ${missingNames.join(', ')}.`);
//         }

//         const rolesForHtmlGen = roadmapDetails.isConsolidated
//             ? roadmapDetails.consolidatedRoles.map(role => ({
//                 title: role.title,
//                 techStacks: fetchedFullTechStacksForHTML.filter(ts => role.selectedTechStacks.includes(ts.name))
//             }))
//             : [{ title: roadmapDetails.singleRoleTitle, techStacks: fetchedFullTechStacksForHTML }];

//         const htmlContent = generateRoadmapHtml(roadmapDetails.companyName, rolesForHtmlGen);
//         if (!htmlContent) throw new Error("Failed to generate roadmap HTML content.");

//         const finalFilename = roadmapDetails.filename.endsWith('.html') ? roadmapDetails.filename : `${roadmapDetails.filename}.html`;

//         const githubRes = await uploadToGithub({ filename: finalFilename, content: htmlContent, description: `Roadmap for ${roadmapDetails.companyName}` });
        
//         const dbPayload = {
//             companyName: roadmapDetails.companyName,
//             isConsolidated: roadmapDetails.isConsolidated,
//             crmAffiliation: roadmapDetails.crmAffiliation,
//             filename: finalFilename,
//             publishedUrl: githubRes.html_url,
//             role: roadmapDetails.isConsolidated ? "Consolidated" : roadmapDetails.singleRoleTitle,
//             techStacks: roadmapDetails.isConsolidated ? [] : roadmapDetails.singleRoleTechStacks, 
//             roles: roadmapDetails.isConsolidated ? roadmapDetails.consolidatedRoles.map(r => ({title: r.title, techStacks: r.selectedTechStacks})) : []
//         };
        
//         await saveRoadmapMetadata(dbPayload);

//         setPublishedUrl(githubRes.html_url);
//         if (onRoadmapCreated) onRoadmapCreated();
//         setSuccess('Roadmap published and saved successfully!');

//     } catch (err) {
//         console.error("Roadmap creation error:", err);
//         setError(err.message || "Failed to create roadmap. Check console for details.");
//     } finally {
//         setUploadLoading(false);
//     }
//   };
  
//   // ----- FIX IS HERE -----
//   // This function now resets the entire form state to its initial condition.
//   const handleAddNew = () => {
//     // A fresh initial state object is created to avoid stale `Date.now()` values for keys.
//     const newInitialState = {
//         companyName: '',
//         isConsolidated: false,
//         singleRoleTitle: '',
//         singleRoleTechStacks: [],
//         consolidatedRoles: [{ id: Date.now(), title: '', selectedTechStacks: [] }],
//         filename: '',
//         crmAffiliation: '',
//     };
    
//     // Reset all state variables for a clean form.
//     setRoadmapDetails(newInitialState);
//     setPublishedUrl('');
//     setError(null);
//     setSuccess(null);
//     setIncludeFoundationTraining(false);
//   };

//   return (
//     <Modal show={show} onHide={onHide} size="lg" centered backdrop="static" dialogClassName="create-roadmap-modal">
//       <Form onSubmit={handleSubmit}>
//         <Modal.Header closeButton>
//           <Modal.Title><i className="fas fa-plus-circle me-2 text-primary"></i>Create New Company Roadmap</Modal.Title>
//         </Modal.Header>
//         <Modal.Body style={{ maxHeight: '70vh', overflowY: 'auto' }}>
//           {error && <Alert variant="danger" onClose={() => setError(null)} dismissible>{error}</Alert>}
          
//           {publishedUrl ? (
//             <div className="text-center p-4">
//               <i className="fas fa-check-circle text-success fa-3x mb-3"></i>
//               <h4>Roadmap Published!</h4>
//               <p className="text-muted">You can copy the link below or create a new roadmap.</p>
//               <InputGroup className="mb-3">
//                 <Form.Control value={publishedUrl} readOnly />
//                 <Button variant="outline-secondary" onClick={() => navigator.clipboard.writeText(publishedUrl)}><i className="fas fa-copy"></i></Button>
//               </InputGroup>
//             </div>
//           ) : (
//             <>
//               <Row className="mb-3">
//                 <Col md={6}><Form.Group><Form.Label>Company Name <span className="text-danger">*</span></Form.Label><Form.Control type="text" name="companyName" value={roadmapDetails.companyName} onChange={handleInputChange} required /></Form.Group></Col>
//                 <Col md={6}><Form.Group><Form.Label>Filename (auto-filled) <span className="text-danger">*</span></Form.Label><Form.Control type="text" name="filename" value={roadmapDetails.filename} onChange={handleInputChange} required /></Form.Group></Col>
//               </Row>
//               {user.role === 'admin' && (
//                   <Form.Group className="mb-3">
//                       <Form.Label>Assign to CRM (Optional)</Form.Label>
//                       <Form.Select name="crmAffiliation" value={roadmapDetails.crmAffiliation} onChange={handleInputChange}><option value="">General / Unassigned</option>{crmUsers.map(c => <option key={c._id} value={c.username}>{c.displayName || c.username}</option>)}</Form.Select>
//                   </Form.Group>
//               )}
//               <Form.Group className="mb-3"><Form.Check type="switch" id="isConsolidatedSwitch" label="Is Consolidated Roadmap?" name="isConsolidated" checked={roadmapDetails.isConsolidated} onChange={handleInputChange}/></Form.Group>

//               {!roadmapDetails.isConsolidated ? (
//                 <>
//                   <Form.Group className="mb-3"><Form.Label>Role Title <span className="text-danger">*</span></Form.Label><Form.Control type="text" name="singleRoleTitle" value={roadmapDetails.singleRoleTitle} onChange={handleInputChange} required={!roadmapDetails.isConsolidated}/></Form.Group>
//                   <Form.Group className="mb-3"><Form.Label>Select Tech Stacks</Form.Label><TechStackDropdown techStacks={allTechStackOptions} selectedTechStacks={roadmapDetails.singleRoleTechStacks} onSelect={handleSingleRoleTechStackSelect} loading={loadingDropdownOptions} isFormField={true}/></Form.Group>
//                 </>
//               ) : (
//                 <>
//                   <Form.Group className="mb-3 ms-4"><Form.Check type="switch" id="foundationTrainingSwitch" label="Auto-include Foundation Training Role" checked={includeFoundationTraining} onChange={(e) => setIncludeFoundationTraining(e.target.checked)} /></Form.Group>
//                   {roadmapDetails.consolidatedRoles.map((role, index) => {
//                     const isFoundationRole = role.id === 'foundation-role';
//                     return (
//                         <Card key={role.id} className="mb-3 p-3 bg-light border" style={{ overflow: 'visible' }}>
//                           <Row className="g-2 align-items-end">
//                               <Col md={isFoundationRole ? 12 : 5}><Form.Group><Form.Label className="small">Role Title #{index + 1} <span className="text-danger">*</span></Form.Label><Form.Control type="text" value={role.title} onChange={(e) => handleConsolidatedRoleChange(role.id, 'title', e.target.value)} required disabled={isFoundationRole} /></Form.Group></Col>
//                               <Col md={isFoundationRole ? 12 : 6} className="mt-md-0 mt-3">
//                                   <Form.Label className="small">Select Tech Stacks</Form.Label>
//                                   <TechStackDropdown techStacks={allTechStackOptions} selectedTechStacks={role.selectedTechStacks} onSelect={(names) => handleConsolidatedRoleTechStackSelect(role.id, names)} loading={loadingDropdownOptions} isFormField={true} zIndex={10 + (roadmapDetails.consolidatedRoles.length - index)} disabled={isFoundationRole}/>
//                               </Col>
//                               {!isFoundationRole && <Col md={1} className="d-flex"><Button variant="outline-danger" size="sm" onClick={() => removeConsolidatedRole(role.id)} className="w-100 mt-auto" title="Remove Role"><i className="fas fa-times"></i></Button></Col>}
//                           </Row>
//                         </Card>
//                     );
//                   })}
//                   <Button variant="outline-success" size="sm" onClick={addConsolidatedRole}><i className="fas fa-plus me-1"></i> Add Role</Button>
//                 </>
//               )}
//             </>
//           )}
//         </Modal.Body>
//         <Modal.Footer>
//           {publishedUrl ? 
//             <>
//                 <Button variant="secondary" onClick={onHide}>Close</Button>
//                 <Button variant="primary" onClick={handleAddNew}><i className="fas fa-plus me-2"></i>Create Another Roadmap</Button>
//             </>
//             : 
//             <>
//                 <Button variant="secondary" onClick={onHide}>Cancel</Button>
//                 <Button variant="primary" type="submit" disabled={uploadLoading}>{uploadLoading ? <><Spinner as="span" size="sm"/> Publishing...</> : 'Create & Publish'}</Button>
//             </>
//           }
//         </Modal.Footer>
//       </Form>
//       <style>{`
//           .create-roadmap-modal .modal-dialog {
//               max-width: 800px;
//           }
//       `}</style>
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
    if (!publishedUrl && roadmapDetails.companyName) {
      setRoadmapDetails(prev => ({
        ...prev,
        filename: `NIAT_X_${prev.companyName.replace(/\s+/g, '_')}`
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
    setRoadmapDetails(prev => ({
      ...prev, 
      consolidatedRoles: prev.consolidatedRoles.map(r => 
        r.id === roleId ? { ...r, [field]: value } : r
      )
    }));
  };

  const handleConsolidatedRoleTechStackSelect = (roleId, names) => {
    setRoadmapDetails(prev => ({
      ...prev, 
      consolidatedRoles: prev.consolidatedRoles.map(r => 
        r.id === roleId ? { ...r, selectedTechStacks: names } : r
      )
    }));
  };

  const addConsolidatedRole = () => setRoadmapDetails(prev => ({ 
    ...prev, 
    consolidatedRoles: [...prev.consolidatedRoles, { id: Date.now(), title: '', selectedTechStacks: [] }]
  }));

  const removeConsolidatedRole = (roleId) => setRoadmapDetails(prev => ({ 
    ...prev, 
    consolidatedRoles: prev.consolidatedRoles.filter(role => role.id !== roleId)
  }));
  
  // UPDATED: This function now returns the created roadmap to the parent component
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!roadmapDetails.companyName.trim() || !roadmapDetails.filename.trim()) {
      setError('Company name and Filename are required.');
      return;
    }
    
    // Validate role data
    if (roadmapDetails.isConsolidated) {
      // Check if any consolidated role is missing title or tech stacks
      if (roadmapDetails.consolidatedRoles.some(role => !role.title.trim() || role.selectedTechStacks.length === 0)) {
        setError('All roles must have a title and at least one tech stack.');
        return;
      }
    } else {
      // Check if single role title or tech stacks are missing
      if (!roadmapDetails.singleRoleTitle.trim() || roadmapDetails.singleRoleTechStacks.length === 0) {
        setError('Role title and at least one tech stack are required.');
        return;
      }
    }
    
    setUploadLoading(true);
    try {
      const allUniqueNamesToFetch = [...new Set(
        roadmapDetails.isConsolidated
          ? roadmapDetails.consolidatedRoles.flatMap(role => role.selectedTechStacks)
          : roadmapDetails.singleRoleTechStacks
      )];
      
      const techStackPromises = allUniqueNamesToFetch.map(name => 
        getTechStackByName(name).catch(err => ({ data: null, name }))
      );
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
        : [{ 
            title: roadmapDetails.singleRoleTitle, 
            techStacks: fetchedFullTechStacksForHTML 
          }];

      const htmlContent = generateRoadmapHtml(roadmapDetails.companyName, rolesForHtmlGen);
      if (!htmlContent) throw new Error("Failed to generate roadmap HTML content.");

      const finalFilename = roadmapDetails.filename.endsWith('.html') 
        ? roadmapDetails.filename 
        : `${roadmapDetails.filename}.html`;

      const githubRes = await uploadToGithub({ 
        filename: finalFilename, 
        content: htmlContent, 
        description: `Roadmap for ${roadmapDetails.companyName}` 
      });
      
      const dbPayload = {
        companyName: roadmapDetails.companyName,
        isConsolidated: roadmapDetails.isConsolidated,
        crmAffiliation: roadmapDetails.crmAffiliation,
        filename: finalFilename,
        publishedUrl: githubRes.html_url,
        role: roadmapDetails.isConsolidated ? "Consolidated" : roadmapDetails.singleRoleTitle,
        techStacks: roadmapDetails.isConsolidated ? [] : roadmapDetails.singleRoleTechStacks, 
        roles: roadmapDetails.isConsolidated 
          ? roadmapDetails.consolidatedRoles.map(r => ({
              title: r.title, 
              techStacks: r.selectedTechStacks
            })) 
          : []
      };
      
      // Save to database and get the created roadmap with its ID
      const createdRoadmapResponse = await saveRoadmapMetadata(dbPayload);
      const createdRoadmap = createdRoadmapResponse.data;
      
      setPublishedUrl(githubRes.html_url);
      setSuccess('Roadmap published and saved successfully!');

      // Call the parent handler with the new roadmap data
      if (onRoadmapCreated && createdRoadmap) {
        onRoadmapCreated(createdRoadmap);
      }
    } catch (err) {
      console.error("Roadmap creation error:", err);
      setError(err.message || "Failed to create roadmap. Check console for details.");
    } finally {
      setUploadLoading(false);
    }
  };
  
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
                <Button 
                  variant="outline-secondary" 
                  onClick={() => {
                    navigator.clipboard.writeText(publishedUrl);
                    setSuccess('URL copied to clipboard!');
                  }}
                >
                  <i className="fas fa-copy"></i>
                </Button>
              </InputGroup>
            </div>
          ) : (
            <>
              <Row className="mb-3">
                <Col md={6}>
                  <Form.Group>
                    <Form.Label>Company Name <span className="text-danger">*</span></Form.Label>
                    <Form.Control 
                      type="text" 
                      name="companyName" 
                      value={roadmapDetails.companyName} 
                      onChange={handleInputChange} 
                      required 
                    />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group>
                    <Form.Label>Filename (auto-filled) <span className="text-danger">*</span></Form.Label>
                    <Form.Control 
                      type="text" 
                      name="filename" 
                      value={roadmapDetails.filename} 
                      onChange={handleInputChange} 
                      required 
                    />
                  </Form.Group>
                </Col>
              </Row>
              {user.role === 'admin' && (
                <Form.Group className="mb-3">
                  <Form.Label>Assign to CRM (Optional)</Form.Label>
                  <Form.Select 
                    name="crmAffiliation" 
                    value={roadmapDetails.crmAffiliation} 
                    onChange={handleInputChange}
                  >
                    <option value="">General / Unassigned</option>
                    {crmUsers.map(c => (
                      <option key={c._id} value={c.username}>
                        {c.displayName || c.username}
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>
              )}
              <Form.Group className="mb-3">
                <Form.Check 
                  type="switch" 
                  id="isConsolidatedSwitch" 
                  label="Is Consolidated Roadmap?" 
                  name="isConsolidated" 
                  checked={roadmapDetails.isConsolidated} 
                  onChange={handleInputChange}
                />
              </Form.Group>

              {!roadmapDetails.isConsolidated ? (
                <>
                  <Form.Group className="mb-3">
                    <Form.Label>Role Title <span className="text-danger">*</span></Form.Label>
                    <Form.Control 
                      type="text" 
                      name="singleRoleTitle" 
                      value={roadmapDetails.singleRoleTitle} 
                      onChange={handleInputChange} 
                      required={!roadmapDetails.isConsolidated}
                    />
                  </Form.Group>
                  <Form.Group className="mb-3">
                    <Form.Label>Select Tech Stacks</Form.Label>
                    <TechStackDropdown 
                      techStacks={allTechStackOptions} 
                      selectedTechStacks={roadmapDetails.singleRoleTechStacks} 
                      onSelect={handleSingleRoleTechStackSelect} 
                      loading={loadingDropdownOptions} 
                      isFormField={true}
                    />
                  </Form.Group>
                </>
              ) : (
                <>
                  <Form.Group className="mb-3 ms-4">
                    <Form.Check 
                      type="switch" 
                      id="foundationTrainingSwitch" 
                      label="Auto-include Foundation Training Role" 
                      checked={includeFoundationTraining} 
                      onChange={(e) => setIncludeFoundationTraining(e.target.checked)} 
                    />
                  </Form.Group>
                  {roadmapDetails.consolidatedRoles.map((role, index) => {
                    const isFoundationRole = role.id === 'foundation-role';
                    return (
                      <Card key={role.id} className="mb-3 p-3 bg-light border" style={{ overflow: 'visible' }}>
                        <Row className="g-2 align-items-end">
                          <Col md={isFoundationRole ? 12 : 5}>
                            <Form.Group>
                              <Form.Label className="small">Role Title #{index + 1} <span className="text-danger">*</span></Form.Label>
                              <Form.Control 
                                type="text" 
                                value={role.title} 
                                onChange={(e) => handleConsolidatedRoleChange(role.id, 'title', e.target.value)} 
                                required 
                                disabled={isFoundationRole} 
                              />
                            </Form.Group>
                          </Col>
                          <Col md={isFoundationRole ? 12 : 6} className="mt-md-0 mt-3">
                            <Form.Label className="small">Select Tech Stacks</Form.Label>
                            <TechStackDropdown 
                              techStacks={allTechStackOptions} 
                              selectedTechStacks={role.selectedTechStacks} 
                              onSelect={(names) => handleConsolidatedRoleTechStackSelect(role.id, names)} 
                              loading={loadingDropdownOptions} 
                              isFormField={true} 
                              zIndex={10 + (roadmapDetails.consolidatedRoles.length - index)} 
                              disabled={isFoundationRole}
                            />
                          </Col>
                          {!isFoundationRole && (
                            <Col md={1} className="d-flex">
                              <Button 
                                variant="outline-danger" 
                                size="sm" 
                                onClick={() => removeConsolidatedRole(role.id)} 
                                className="w-100 mt-auto" 
                                title="Remove Role"
                              >
                                <i className="fas fa-times"></i>
                              </Button>
                            </Col>
                          )}
                        </Row>
                      </Card>
                    );
                  })}
                  <Button variant="outline-success" size="sm" onClick={addConsolidatedRole}>
                    <i className="fas fa-plus me-1"></i> Add Role
                  </Button>
                </>
              )}
            </>
          )}
        </Modal.Body>
        <Modal.Footer>
          {publishedUrl ? 
            <>
              <Button variant="secondary" onClick={onHide}>Close</Button>
              <Button variant="primary" onClick={handleAddNew}>
                <i className="fas fa-plus me-2"></i>Create Another Roadmap
              </Button>
            </>
            : 
            <>
              <Button variant="secondary" onClick={onHide}>Cancel</Button>
              <Button variant="primary" type="submit" disabled={uploadLoading}>
                {uploadLoading ? <><Spinner as="span" size="sm"/> Publishing...</> : 'Create & Publish'}
              </Button>
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
