// // client/src/components/TechStackTable/TechStackTable.jsx
// import { useState } from 'react';
// import { Button, Form, Spinner, Alert, Row, Col } from 'react-bootstrap';
// import { updateTechStack, deleteRoadmapItem, addRoadmapItem, deleteTechStack } from '../../services/techStackService';
// import './TechStackTable.css';

// const TechStackTable = ({ techStackData, onUpdate, onDelete, userRole }) => { // <<--- ADDED: userRole prop
//   const [editMode, setEditMode] = useState(false);
//   const [nameEditMode, setNameEditMode] = useState(false);
//   const [headersEditMode, setHeadersEditMode] = useState(false);
//   const [techStackName, setTechStackName] = useState(techStackData.name);
//   const [customHeaders, setCustomHeaders] = useState(
//     techStackData.headers || {
//       topic: "Topic",
//       subTopics: "Sub-Topics",
//       projects: "Projects",
//       status: "Status"
//     }
//   );
//   const [roadmapItems, setRoadmapItems] = useState(techStackData.roadmapItems || []);
//   const [showAddForm, setShowAddForm] = useState(false);
//   const [newItem, setNewItem] = useState({
//     topic: '',
//     subTopics: [{ name: '' }],
//     projects: [{ name: '' }],
//     completionStatus: 'Yet to Start' // Default status
//   });
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState(null);
//   const [success, setSuccess] = useState(null);
//   const [searchTerm, setSearchTerm] = useState('');
//   const [deleteConfirmation, setDeleteConfirmation] = useState(false);
  
//   const toggleEditMode = () => {
//     if (editMode) {
//       setEditMode(false);
//       setNameEditMode(false);
//       setHeadersEditMode(false);
//       setRoadmapItems(techStackData.roadmapItems || []);
//       setTechStackName(techStackData.name);
//       setCustomHeaders(techStackData.headers || {
//         topic: "Topic",
//         subTopics: "Sub-Topics",
//         projects: "Projects",
//         status: "Status"
//       });
//       setShowAddForm(false);
//       setSearchTerm('');
//     } else {
//       setEditMode(true);
//       setNameEditMode(true);
//       setHeadersEditMode(true);
//     }
//   };

//   const handleHeaderChange = (field, value) => {
//     setCustomHeaders({
//       ...customHeaders,
//       [field]: value
//     });
//   };

//   const toggleAddForm = () => {
//     setShowAddForm(!showAddForm);
//     if (showAddForm) {
//       setNewItem({
//         topic: '',
//         subTopics: [{ name: '' }],
//         projects: [{ name: '' }],
//         completionStatus: 'Yet to Start'
//       });
//     }
//   };

//   const handleItemChange = (index, field, value) => {
//     const updatedItems = [...roadmapItems];
//     updatedItems[index][field] = value;
//     setRoadmapItems(updatedItems);
//   };

//   const handleSubtopicChange = (itemIndex, subtopicIndex, value) => {
//     const updatedItems = [...roadmapItems];
//     updatedItems[itemIndex].subTopics[subtopicIndex].name = value;
//     setRoadmapItems(updatedItems);
//   };

//   const handleProjectChange = (itemIndex, projectIndex, value) => {
//     const updatedItems = [...roadmapItems];
//     updatedItems[itemIndex].projects[projectIndex].name = value;
//     setRoadmapItems(updatedItems);
//   };

//   const addSubtopic = (itemIndex) => {
//     const updatedItems = [...roadmapItems];
//     updatedItems[itemIndex].subTopics.push({ name: '' });
//     setRoadmapItems(updatedItems);
//   };

//   const addProject = (itemIndex) => {
//     const updatedItems = [...roadmapItems];
//     updatedItems[itemIndex].projects.push({ name: '' });
//     setRoadmapItems(updatedItems);
//   };

//   const removeSubtopic = (itemIndex, subtopicIndex) => {
//     const updatedItems = [...roadmapItems];
//     updatedItems[itemIndex].subTopics.splice(subtopicIndex, 1);
//     setRoadmapItems(updatedItems);
//   };

//   const removeProject = (itemIndex, projectIndex) => {
//     const updatedItems = [...roadmapItems];
//     updatedItems[itemIndex].projects.splice(projectIndex, 1);
//     setRoadmapItems(updatedItems);
//   };

//   const handleDeleteItem = async (itemId) => {
//     try {
//       setLoading(true);
//       await deleteRoadmapItem(techStackData._id, itemId);
//       const updatedItems = roadmapItems.filter(item => item._id !== itemId);
//       setRoadmapItems(updatedItems);
//       onUpdate({ ...techStackData, roadmapItems: updatedItems });
//       setLoading(false);
//       setSuccess('Item deleted successfully');
//       setTimeout(() => setSuccess(null), 3000);
//     } catch (err) {
//       setError('Failed to delete item');
//       setLoading(false);
//     }
//   };

//   const handleDeleteTechStack = async () => {
//     try {
//       setLoading(true);
//       await deleteTechStack(techStackData._id);
//       setLoading(false);
//       setSuccess('Tech stack deleted successfully');
//       if (onDelete) {
//         onDelete(techStackData._id);
//       }
//     } catch (err) {
//       setError('Failed to delete tech stack');
//       setLoading(false);
//     }
//   };

//   const handleSaveChanges = async () => {
//     if (nameEditMode && !techStackName.trim()) {
//       setError('Tech stack name cannot be empty');
//       return;
//     }
//     if (headersEditMode && 
//        (!customHeaders.topic.trim() || 
//         !customHeaders.subTopics.trim() || 
//         !customHeaders.projects.trim() || 
//         !customHeaders.status.trim())) {
//       setError('Header fields cannot be empty');
//       return;
//     }

//     try {
//       setLoading(true);
//       const updateData = { roadmapItems: roadmapItems };
//       if (nameEditMode) {
//         updateData.name = techStackName.trim();
//       }
//       if (headersEditMode) {
//         updateData.headers = {
//           topic: customHeaders.topic.trim(),
//           subTopics: customHeaders.subTopics.trim(),
//           projects: customHeaders.projects.trim(),
//           status: customHeaders.status.trim()
//         };
//       }
//       const updatedTechStack = await updateTechStack(techStackData._id, updateData);
//       onUpdate(updatedTechStack.data);
//       setLoading(false);
//       setEditMode(false);
//       setNameEditMode(false);
//       setHeadersEditMode(false);
//       setShowAddForm(false);
//       setTimeout(() => setSuccess(null), 3000);
//     } catch (err) {
//       setError('Failed to save changes');
//       setLoading(false);
//     }
//   };

//   const handleNewItemChange = (field, value) => {
//     setNewItem({ ...newItem, [field]: value });
//   };

//   const handleNewItemSubtopicChange = (index, value) => {
//     const updatedSubtopics = [...newItem.subTopics];
//     updatedSubtopics[index].name = value;
//     setNewItem({ ...newItem, subTopics: updatedSubtopics });
//   };

//   const handleNewItemProjectChange = (index, value) => {
//     const updatedProjects = [...newItem.projects];
//     updatedProjects[index].name = value;
//     setNewItem({ ...newItem, projects: updatedProjects });
//   };

//   const addNewItemSubtopic = () => {
//     setNewItem({ ...newItem, subTopics: [...newItem.subTopics, { name: '' }] });
//   };

//   const addNewItemProject = () => {
//     setNewItem({ ...newItem, projects: [...newItem.projects, { name: '' }] });
//   };

//   const removeNewItemSubtopic = (index) => {
//     const updatedSubtopics = [...newItem.subTopics];
//     updatedSubtopics.splice(index, 1);
//     setNewItem({ ...newItem, subTopics: updatedSubtopics });
//   };

//   const removeNewItemProject = (index) => {
//     const updatedProjects = [...newItem.projects];
//     updatedProjects.splice(index, 1);
//     setNewItem({ ...newItem, projects: updatedProjects });
//   };

//   const handleAddItem = async () => {
//     if (!newItem.topic) {
//       setError('Topic is required');
//       return;
//     }
//     // For content role, status is fixed to "Yet to Start" when adding new item
//     const itemToAdd = userRole === 'content' ? { ...newItem, completionStatus: 'Yet to Start' } : newItem;

//     try {
//       setLoading(true);
//       const result = await addRoadmapItem(techStackData._id, itemToAdd);
//       setRoadmapItems([...roadmapItems, result.data.roadmapItems[result.data.roadmapItems.length - 1]]);
//       onUpdate(result.data);
//       setNewItem({ topic: '', subTopics: [{ name: '' }], projects: [{ name: '' }], completionStatus: 'Yet to Start' });
//       setLoading(false);
//       setShowAddForm(false);
//       setSuccess('New item added successfully');
//       setTimeout(() => setSuccess(null), 3000);
//     } catch (err) {
//       setError('Failed to add new item');
//       setLoading(false);
//     }
//   };

//   const handleSearchChange = (e) => {
//     setSearchTerm(e.target.value);
//   };

//   const filteredRoadmapItems = roadmapItems.filter(item => {
//     const searchLower = searchTerm.toLowerCase();
//     if (item.topic.toLowerCase().includes(searchLower)) return true;
//     if (item.subTopics.some(sub => sub.name.toLowerCase().includes(searchLower))) return true;
//     if (item.projects.some(proj => proj.name.toLowerCase().includes(searchLower))) return true;
//     if (item.completionStatus.toLowerCase().includes(searchLower)) return true;
//     return false;
//   });

//   return (
//     <div className="roadmap-container">
//       <div className="roadmap-header">
//         <div className="roadmap-header-left">
//           {nameEditMode ? (
//             <div className="tech-stack-name-edit">
//               <Form.Control
//                 type="text"
//                 value={techStackName}
//                 onChange={(e) => setTechStackName(e.target.value)}
//                 placeholder="Enter tech stack name"
//                 className="tech-stack-name-input"
//               />
//             </div>
//           ) : (
//             <div className="tech-stack-name-display">
//               <h2 className="roadmap-title">{techStackData.name}</h2>
//             </div>
//           )}
//         </div>
        
//         <div className="roadmap-header-actions">
//           {!editMode && !showAddForm && (
//             <div className="search-container">
//               <i className="fas fa-search search-icon"></i>
//               <input
//                 type="text"
//                 placeholder={`Search ${customHeaders.topic.toLowerCase()}, ${customHeaders.projects.toLowerCase()}...`}
//                 value={searchTerm}
//                 onChange={handleSearchChange}
//                 className="search-input"
//               />
//               {searchTerm && (
//                 <button 
//                   className="search-clear" 
//                   onClick={() => setSearchTerm('')}
//                   aria-label="Clear search"
//                 >
//                   <i className="fas fa-times"></i>
//                 </button>
//               )}
//             </div>
//           )}
          
//           <Button 
//             variant={editMode ? "outline-primary" : "primary"}
//             onClick={toggleEditMode}
//             disabled={loading}
//             className="edit-button"
//             title={editMode ? "Cancel editing" : "Edit roadmap"}
//           >
//             <i className={`fas ${editMode ? "fa-times" : "fa-edit"}`}></i>
//             <span className="button-text">{editMode ? "" : ""}</span>
//           </Button>
          
//           {onDelete && !editMode && (
//             <Button 
//               variant="danger"
//               onClick={() => setDeleteConfirmation(true)}
//               disabled={loading}
//               className="delete-button"
//               title="Delete tech stack"
//             >
//               <i className="fas fa-trash"></i>
//             </Button>
//           )}
//         </div>
//       </div>
      
//       {headersEditMode && (
//         <div className="headers-edit-section">
//           <Row className="headers-edit-row">
//             <Col md={3}> <Form.Group className="mb-2"> <Form.Control type="text" value={customHeaders.topic} onChange={(e) => handleHeaderChange('topic', e.target.value)} placeholder="Enter topic header" className="headers-input"/> </Form.Group> </Col>
//             <Col md={3}> <Form.Group className="mb-2"> <Form.Control type="text" value={customHeaders.subTopics} onChange={(e) => handleHeaderChange('subTopics', e.target.value)} placeholder="Enter sub-topics header" className="headers-input"/> </Form.Group> </Col>
//             <Col md={3}> <Form.Group className="mb-2"> <Form.Control type="text" value={customHeaders.projects} onChange={(e) => handleHeaderChange('projects', e.target.value)} placeholder="Enter projects header" className="headers-input"/> </Form.Group> </Col>
//             <Col md={3}> <Form.Group className="mb-2"> <Form.Control type="text" value={customHeaders.status} onChange={(e) => handleHeaderChange('status', e.target.value)} placeholder="Enter status header" className="headers-input"/> </Form.Group> </Col>
//           </Row>
//         </div>
//       )}
      
//       {deleteConfirmation && (
//         <Alert variant="danger" className="delete-confirmation">
//           <div className="confirmation-message"> <i className="fas fa-exclamation-triangle"></i> <span>Are you sure you want to delete this tech stack? This action cannot be undone.</span> </div>
//           <div className="confirmation-actions"> <Button variant="outline-secondary" onClick={() => setDeleteConfirmation(false)} size="sm" > Cancel </Button> <Button variant="danger" onClick={handleDeleteTechStack} size="sm" disabled={loading} > {loading ? ( <> <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" /> <span className="ms-2">Deleting...</span> </> ) : ( 'Confirm Delete' )} </Button> </div>
//         </Alert>
//       )}
      
//       {error && ( <Alert variant="danger" onClose={() => setError(null)} dismissible className="alert-slim"> <i className="fas fa-exclamation-circle me-2"></i> {error} </Alert> )}
//       {success && ( <Alert variant="success" onClose={() => setSuccess(null)} dismissible className="alert-slim"> <i className="fas fa-check-circle me-2"></i> {success} </Alert> )}
      
//       {editMode && showAddForm && (
//         <div className="add-form-container">
//           <div className="form-grid">
//             <div className="form-group"> <Form.Label>{customHeaders.topic} <span className="text-danger">*</span></Form.Label> <Form.Control type="text" value={newItem.topic} onChange={(e) => handleNewItemChange('topic', e.target.value)} placeholder={`Enter ${customHeaders.topic.toLowerCase()}`} className="form-control-sm" /> </div>
//             <div className="form-group"> <Form.Label>{customHeaders.subTopics}</Form.Label> <div className="field-list"> {newItem.subTopics.map((subtopic, index) => ( <div key={index} className="field-item"> <Form.Control type="text" value={subtopic.name} onChange={(e) => handleNewItemSubtopicChange(index, e.target.value)} placeholder={`Enter ${customHeaders.subTopics.toLowerCase()}`} className="form-control-sm" /> <Button variant="outline-danger" size="sm" className="remove-btn" onClick={() => removeNewItemSubtopic(index)} disabled={newItem.subTopics.length <= 1} > <i className="fas fa-times"></i> </Button> </div> ))} <Button variant="link" className="add-link" onClick={addNewItemSubtopic} > <i className="fas fa-plus"></i> Add {customHeaders.subTopics.replace(/s$/, '')} </Button> </div> </div>
//             <div className="form-group"> <Form.Label>{customHeaders.projects}</Form.Label> <div className="field-list"> {newItem.projects.map((project, index) => ( <div key={index} className="field-item"> <Form.Control type="text" value={project.name} onChange={(e) => handleNewItemProjectChange(index, e.target.value)} placeholder={`Enter ${customHeaders.projects.toLowerCase()}`} className="form-control-sm" /> <Button variant="outline-danger" size="sm" className="remove-btn" onClick={() => removeNewItemProject(index)} disabled={newItem.projects.length <= 1} > <i className="fas fa-times"></i> </Button> </div> ))} <Button variant="link" className="add-link" onClick={addNewItemProject} > <i className="fas fa-plus"></i> Add {customHeaders.projects.replace(/s$/, '')} </Button> </div> </div>
//             <div className="form-group">
//               <Form.Label>{customHeaders.status}</Form.Label>
//               {userRole === 'admin' ? ( // <<--- MODIFIED: Conditional rendering for status
//                 <Form.Select value={newItem.completionStatus} onChange={(e) => handleNewItemChange('completionStatus', e.target.value)} className="form-select-sm status-select" >
//                   <option value="Yet to Start">Yet to Start</option> <option value="In Progress">In Progress</option> <option value="Completed">Completed</option>
//                 </Form.Select>
//               ) : (
//                 <Form.Control type="text" value="Yet to Start" className="form-control-sm" readOnly disabled />
//               )}
//               <div className="form-actions"> <Button variant="outline-secondary" onClick={toggleAddForm} className="btn-sm" > Cancel </Button> <Button variant="primary" onClick={handleAddItem} disabled={loading || !newItem.topic} className="btn-sm" > {loading ? ( <> <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" /> <span className="ms-1">Adding...</span> </> ) : ( 'Add Item' )} </Button> </div>
//             </div>
//           </div>
//         </div>
//       )}
      
//       <div className="table-responsive roadmap-table-container">
//         <table className="roadmap-table">
//           <thead> <tr> <th className="th-topic">{customHeaders.topic.toUpperCase()}</th> <th className="th-subtopics">{customHeaders.subTopics.toUpperCase()}</th> <th className="th-projects">{customHeaders.projects.toUpperCase()}</th> <th className="th-status">{customHeaders.status.toUpperCase()}</th> {editMode && <th className="th-actions">ACTIONS</th>} </tr> </thead>
//           <tbody>
//             {filteredRoadmapItems.length > 0 ? (
//               filteredRoadmapItems.map((item, index) => (
//                 <tr key={index}>
//                   <td className="topic-col"> {item.topic} </td>
//                   <td> {editMode ? ( <div className="edit-list"> {item.subTopics.map((subtopic, subtopicIndex) => ( <div key={subtopicIndex} className="field-item"> <Form.Control type="text" value={subtopic.name} onChange={(e) => handleSubtopicChange(index, subtopicIndex, e.target.value)} className="form-control-sm" /> {item.subTopics.length > 1 && ( <Button variant="outline-danger" size="sm" className="remove-btn" onClick={() => removeSubtopic(index, subtopicIndex)} > <i className="fas fa-times"></i> </Button> )} </div> ))} <Button variant="link" className="add-link" onClick={() => addSubtopic(index)} > <i className="fas fa-plus"></i> Add </Button> </div> ) : ( <div className="subtopics-list"> {item.subTopics.map((subtopic, i) => ( subtopic.name && ( <span key={i} className="subtopic-item"> {subtopic.name} </span> ) ))} </div> )} </td>
//                   <td> {editMode ? ( <div className="edit-list"> {item.projects.map((project, projectIndex) => ( <div key={projectIndex} className="field-item"> <Form.Control type="text" value={project.name} onChange={(e) => handleProjectChange(index, projectIndex, e.target.value)} className="form-control-sm" /> {item.projects.length > 1 && ( <Button variant="outline-danger" size="sm" className="remove-btn" onClick={() => removeProject(index, projectIndex)} > <i className="fas fa-times"></i> </Button> )} </div> ))} <Button variant="link" className="add-link" onClick={() => addProject(index)} > <i className="fas fa-plus"></i> Add </Button> </div> ) : ( <div className="projects-list"> {item.projects.map((project, i) => ( project.name && ( <span key={i} className="project-item"> {project.name} </span> ) ))} </div> )} </td>
//                   <td>
//                     {editMode ? (
//                       userRole === 'admin' ? ( // <<--- MODIFIED: Conditional rendering for status
//                         <Form.Select value={item.completionStatus} onChange={(e) => handleItemChange(index, 'completionStatus', e.target.value)} className="form-select-sm status-select" >
//                           <option value="Yet to Start">Yet to Start</option> <option value="In Progress">In Progress</option> <option value="Completed">Completed</option>
//                         </Form.Select>
//                       ) : (
//                         <span className={`status-badge ${item.completionStatus.toLowerCase().replace(' ', '-')}`}>
//                           {item.completionStatus}
//                         </span>
//                       )
//                     ) : (
//                       <span className={`status-badge ${item.completionStatus.toLowerCase().replace(' ', '-')}`}>
//                         {item.completionStatus}
//                       </span>
//                     )}
//                   </td>
//                   {editMode && ( <td className="actions-col"> <Button variant="danger" size="sm" onClick={() => handleDeleteItem(item._id)} className="delete-btn" title="Delete item" > <i className="fas fa-trash"></i> </Button> </td> )}
//                 </tr>
//               ))
//             ) : (
//               <tr>
//                 <td colSpan={editMode ? 5 : 4} className="empty-message">
//                   {searchTerm ? ( <> <i className="fas fa-search fa-lg mb-2"></i> <p>No matching {customHeaders.topic.toLowerCase()} found</p> <Button variant="outline-secondary" size="sm" onClick={() => setSearchTerm('')} > Clear Search </Button> </> ) : ( <> <i className="fas fa-clipboard-list fa-lg mb-2"></i> <p>No {customHeaders.topic.toLowerCase()} added yet</p> {editMode && ( <Button variant="primary" size="sm" onClick={toggleAddForm} > <i className="fas fa-plus me-1"></i> Add {customHeaders.topic} </Button> )} </> )}
//                 </td>
//               </tr>
//             )}
//           </tbody>
//         </table>
//       </div>
      
//       {editMode && (
//         <div className="edit-actions">
//           {roadmapItems.length > 0 && !showAddForm && ( <Button variant="outline-primary" onClick={toggleAddForm} disabled={loading} className="me-2" > <i className="fas fa-plus me-1"></i> Add {customHeaders.topic} </Button> )}
//           <Button variant="primary" onClick={handleSaveChanges} disabled={loading || (nameEditMode && !techStackName.trim()) || (headersEditMode && (!customHeaders.topic.trim() || !customHeaders.subTopics.trim() || !customHeaders.projects.trim() || !customHeaders.status.trim()))} >
//             {loading ? ( <> <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" /> <span className="ms-2">Saving...</span> </> ) : ( 'Save Changes' )}
//           </Button>
//         </div>
//       )}
//     </div>
//   );
// };

// export default TechStackTable;

// client/src/components/TechStackTable/TechStackTable.jsx
import { useState } from 'react';
import { Button, Form, Spinner, Alert, Row, Col, Badge, InputGroup } from 'react-bootstrap';
import { updateTechStack, deleteRoadmapItem, addRoadmapItem, deleteTechStack } from '../../services/techStackService';
import './TechStackTable.css';

const TechStackTable = ({ techStackData, onUpdate, onDelete, isEditable, isEmbedded = false }) => {
  const [editMode, setEditMode] = useState(false);
  const [nameEditMode, setNameEditMode] = useState(false);
  const [headersEditMode, setHeadersEditMode] = useState(false);
  const [techStackName, setTechStackName] = useState(techStackData.name);
  const [customHeaders, setCustomHeaders] = useState(
    techStackData.headers || {
      topic: "Topic",
      subTopics: "Sub-Topics",
      projects: "Projects",
      status: "Status"
    }
  );
  const [roadmapItems, setRoadmapItems] = useState(techStackData.roadmapItems || []);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newItem, setNewItem] = useState({
    topic: '',
    subTopics: [{ name: '' }],
    projects: [{ name: '' }],
    completionStatus: 'Yet to Start'
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [deleteConfirmation, setDeleteConfirmation] = useState(false);
  
  const toggleEditMode = () => {
    if (!isEditable) return;
    if (editMode) {
      setEditMode(false);
      setNameEditMode(false);
      setHeadersEditMode(false);
      setRoadmapItems(techStackData.roadmapItems || []);
      setTechStackName(techStackData.name);
      setCustomHeaders(techStackData.headers || {
        topic: "Topic",
        subTopics: "Sub-Topics",
        projects: "Projects",
        status: "Status"
      });
      setShowAddForm(false);
      setSearchTerm('');
    } else {
      setEditMode(true);
      setNameEditMode(true);
      setHeadersEditMode(true);
    }
  };

  const handleHeaderChange = (field, value) => {
    setCustomHeaders({
      ...customHeaders,
      [field]: value
    });
  };

  const toggleAddForm = () => {
    setShowAddForm(!showAddForm);
    if (showAddForm) {
      setNewItem({
        topic: '',
        subTopics: [{ name: '' }],
        projects: [{ name: '' }],
        completionStatus: 'Yet to Start'
      });
    }
  };

  const handleItemChange = (index, field, value) => {
    const updatedItems = [...roadmapItems];
    updatedItems[index][field] = value;
    setRoadmapItems(updatedItems);
  };

  const handleSubtopicChange = (itemIndex, subtopicIndex, value) => {
    const updatedItems = [...roadmapItems];
    updatedItems[itemIndex].subTopics[subtopicIndex].name = value;
    setRoadmapItems(updatedItems);
  };

  const handleProjectChange = (itemIndex, projectIndex, value) => {
    const updatedItems = [...roadmapItems];
    updatedItems[itemIndex].projects[projectIndex].name = value;
    setRoadmapItems(updatedItems);
  };

  const addSubtopic = (itemIndex) => {
    const updatedItems = [...roadmapItems];
    updatedItems[itemIndex].subTopics.push({ name: '' });
    setRoadmapItems(updatedItems);
  };

  const addProject = (itemIndex) => {
    const updatedItems = [...roadmapItems];
    updatedItems[itemIndex].projects.push({ name: '' });
    setRoadmapItems(updatedItems);
  };

  const removeSubtopic = (itemIndex, subtopicIndex) => {
    const updatedItems = [...roadmapItems];
    updatedItems[itemIndex].subTopics.splice(subtopicIndex, 1);
    setRoadmapItems(updatedItems);
  };

  const removeProject = (itemIndex, projectIndex) => {
    const updatedItems = [...roadmapItems];
    updatedItems[itemIndex].projects.splice(projectIndex, 1);
    setRoadmapItems(updatedItems);
  };

  const handleDeleteItem = async (itemId) => {
    try {
      setLoading(true);
      await deleteRoadmapItem(techStackData._id, itemId);
      const updatedItems = roadmapItems.filter(item => item._id !== itemId);
      setRoadmapItems(updatedItems);
      onUpdate({ ...techStackData, roadmapItems: updatedItems });
      setLoading(false);
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError('Failed to delete item');
      setLoading(false);
    }
  };

  const handleDeleteTechStack = async () => {
    try {
      setLoading(true);
      await deleteTechStack(techStackData._id);
      setLoading(false);
      if (onDelete) {
        onDelete(techStackData._id);
      }
    } catch (err) {
      setError('Failed to delete tech stack');
      setLoading(false);
    }
  };

  const handleSaveChanges = async () => {
    if (nameEditMode && !techStackName.trim()) {
      setError('Tech stack name cannot be empty');
      return;
    }
    if (headersEditMode && (!customHeaders.topic.trim() || !customHeaders.subTopics.trim() || !customHeaders.projects.trim() || !customHeaders.status.trim())) {
      setError('Header fields cannot be empty');
      return;
    }
    try {
      setLoading(true);
      const updateData = { roadmapItems, name: techStackName.trim(), headers: customHeaders };

      if (isEmbedded) {
        // In embedded mode, just call the onUpdate prop with the staged data
        if (onUpdate) {
          onUpdate({ ...techStackData, ...updateData });
        }
        setTimeout(() => setSuccess(null), 3000);
      } else {
        // Standalone mode, make the API call
        const updatedTechStack = await updateTechStack(techStackData._id, updateData);
        if (onUpdate) {
          onUpdate(updatedTechStack.data);
        }
        setTimeout(() => setSuccess(null), 3000);
      }

      setLoading(false);
      setEditMode(false);
    } catch (err) {
      setError('Failed to save changes');
      setLoading(false);
    }
  };
  
  const handleNewItemChange = (field, value) => {
    setNewItem({ ...newItem, [field]: value });
  };
  
  const handleNewItemSubtopicChange = (index, value) => {
    const updatedSubtopics = [...newItem.subTopics];
    updatedSubtopics[index].name = value;
    setNewItem({ ...newItem, subTopics: updatedSubtopics });
  };
  
  const handleNewItemProjectChange = (index, value) => {
    const updatedProjects = [...newItem.projects];
    updatedProjects[index].name = value;
    setNewItem({ ...newItem, projects: updatedProjects });
  };

  const addNewItemSubtopic = () => {
    setNewItem({ ...newItem, subTopics: [...newItem.subTopics, { name: '' }] });
  };
  
  const addNewItemProject = () => {
    setNewItem({ ...newItem, projects: [...newItem.projects, { name: '' }] });
  };

  const removeNewItemSubtopic = (index) => {
    const updatedSubtopics = [...newItem.subTopics];
    updatedSubtopics.splice(index, 1);
    setNewItem({ ...newItem, subTopics: updatedSubtopics });
  };
  
  const removeNewItemProject = (index) => {
    const updatedProjects = [...newItem.projects];
    updatedProjects.splice(index, 1);
    setNewItem({ ...newItem, projects: updatedProjects });
  };

  const handleAddItem = async () => {
    if (!newItem.topic) {
      setError('Topic is required');
      return;
    }
    try {
      setLoading(true);
      const result = await addRoadmapItem(techStackData._id, newItem);
      onUpdate(result.data);
      setRoadmapItems(result.data.roadmapItems);
      setShowAddForm(false);
      setNewItem({ topic: '', subTopics: [{ name: '' }], projects: [{ name: '' }], completionStatus: 'Yet to Start' });
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError('Failed to add new item');
    } finally {
      setLoading(false);
    }
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const filteredRoadmapItems = roadmapItems.filter(item => {
    const searchLower = searchTerm.toLowerCase();
    return item.topic.toLowerCase().includes(searchLower) ||
           item.subTopics.some(sub => sub.name.toLowerCase().includes(searchLower)) ||
           item.projects.some(proj => proj.name.toLowerCase().includes(searchLower)) ||
           item.completionStatus.toLowerCase().includes(searchLower);
  });

  return (
    <div className="roadmap-container">
      <div className="roadmap-header">
        <div className="roadmap-header-left">
          {(editMode && isEditable) ? (
            <div className="tech-stack-name-edit">
              <Form.Control
                type="text"
                value={techStackName}
                onChange={(e) => setTechStackName(e.target.value)}
                placeholder="Enter tech stack name"
                className="tech-stack-name-input"
              />
            </div>
          ) : (
            <div className="tech-stack-name-display">
              <h2 className="roadmap-title">{techStackData.name}</h2>
            </div>
          )}
        </div>
        
        <div className="roadmap-header-actions">
          {!editMode && (<div className="search-container"><i className="fas fa-search search-icon"></i><input type="text" placeholder={`Search...`} value={searchTerm} onChange={handleSearchChange} className="search-input" />{searchTerm && (<button className="search-clear" onClick={() => setSearchTerm('')}><i className="fas fa-times"></i></button>)}</div>)}
          {isEditable && <Button variant={editMode ? "outline-primary" : "primary"} onClick={toggleEditMode} disabled={loading} title={editMode ? "Cancel" : "Edit"}><i className={`fas ${editMode ? "fa-times" : "fa-edit"}`}></i></Button>}
          {isEditable && onDelete && !editMode && (<Button variant="danger" onClick={() => setDeleteConfirmation(true)} disabled={loading} title="Delete"><i className="fas fa-trash"></i></Button>)}
        </div>
      </div>
      
      {editMode && isEditable && (
        <div className="headers-edit-section p-3">
            <Row className="headers-edit-row g-2 align-items-center">
                <Col><Form.Control size="sm" type="text" value={customHeaders.topic} onChange={(e) => handleHeaderChange('topic', e.target.value)} placeholder="Topic" className="headers-input"/></Col>
                <Col><Form.Control size="sm" type="text" value={customHeaders.subTopics} onChange={(e) => handleHeaderChange('subTopics', e.target.value)} placeholder="Sub-Topics" className="headers-input"/></Col>
                <Col><Form.Control size="sm" type="text" value={customHeaders.projects} onChange={(e) => handleHeaderChange('projects', e.target.value)} placeholder="Projects" className="headers-input"/></Col>
                <Col><Form.Control size="sm" type="text" value={customHeaders.status} onChange={(e) => handleHeaderChange('status', e.target.value)} placeholder="Status" className="headers-input"/></Col>
            </Row>
        </div>
      )}

      {deleteConfirmation && (<Alert variant="danger" className="delete-confirmation"><div className="d-flex justify-content-between align-items-center"><span>Are you sure you want to delete this tech stack?</span><div><Button variant="outline-secondary" onClick={() => setDeleteConfirmation(false)} size="sm" className="me-2">Cancel</Button><Button variant="danger" onClick={handleDeleteTechStack} size="sm" disabled={loading}>{loading ? 'Deleting...' : 'Confirm'}</Button></div></div></Alert>)}
      {error && ( <Alert variant="danger" onClose={() => setError(null)} dismissible className="alert-slim">{error}</Alert> )}
      {success && ( <Alert variant="success" onClose={() => setSuccess(null)} dismissible className="alert-slim">{success}</Alert> )}
      
      {editMode && isEditable && showAddForm && (
        <div className="add-form-container">
          <Row className="g-3">
            <Col md={3}><Form.Group><Form.Label className="small">Topic*</Form.Label><Form.Control as="textarea" rows={3} value={newItem.topic} onChange={(e) => handleNewItemChange('topic', e.target.value)} /></Form.Group></Col>
            <Col md={3}><Form.Label className="small">Sub-Topics</Form.Label>{newItem.subTopics.map((st, i) => (<InputGroup key={i} className="mb-2"><Form.Control size="sm" value={st.name} onChange={(e) => handleNewItemSubtopicChange(i, e.target.value)} /><Button variant="outline-danger" size="sm" onClick={() => removeNewItemSubtopic(i)} disabled={newItem.subTopics.length <= 1}>-</Button></InputGroup>))}<Button size="sm" variant="link" onClick={addNewItemSubtopic}>+ Add Sub-Topic</Button></Col>
            <Col md={3}><Form.Label className="small">Projects</Form.Label>{newItem.projects.map((p, i) => (<InputGroup key={i} className="mb-2"><Form.Control size="sm" value={p.name} onChange={(e) => handleNewItemProjectChange(i, e.target.value)} /><Button variant="outline-danger" size="sm" onClick={() => removeNewItemProject(i)} disabled={newItem.projects.length <= 1}>-</Button></InputGroup>))}<Button size="sm" variant="link" onClick={addNewItemProject}>+ Add Project</Button></Col>
            <Col md={3}><div className="d-flex justify-content-end mt-4"><Button variant="outline-secondary" size="sm" onClick={toggleAddForm}>Cancel</Button><Button variant="primary" size="sm" onClick={handleAddItem} disabled={loading || !newItem.topic}>Add</Button></div></Col>
          </Row>
        </div>
      )}
      
      <div className="table-responsive roadmap-table-container">
        <table className="roadmap-table">
          <thead><tr><th className="th-topic">{customHeaders.topic.toUpperCase()}</th><th className="th-subtopics">{customHeaders.subTopics.toUpperCase()}</th><th className="th-projects">{customHeaders.projects.toUpperCase()}</th><th className="th-status">{customHeaders.status.toUpperCase()}</th>{(editMode && isEditable) && <th className="th-actions">ACTIONS</th>}</tr></thead>
          <tbody>
            {filteredRoadmapItems.length > 0 ? (
              filteredRoadmapItems.map((item, index) => (
                <tr key={item._id}>
                  <td>{(editMode && isEditable) ? <Form.Control as="textarea" rows={2} value={item.topic} onChange={(e) => handleItemChange(index, 'topic', e.target.value)} className="form-control-sm"/> : item.topic}</td>
                  <td>{(editMode && isEditable) ? (<div>{item.subTopics.map((sub, subIndex) => (<InputGroup size="sm" key={subIndex} className="mb-1"><Form.Control value={sub.name} onChange={e => handleSubtopicChange(index, subIndex, e.target.value)}/><Button variant="outline-danger" onClick={() => removeSubtopic(index, subIndex)}>-</Button></InputGroup>))}<Button variant="link" size="sm" onClick={() => addSubtopic(index)}>+ Add</Button></div>) : <div className="subtopics-list">{item.subTopics.map((subtopic, i) => (subtopic.name && (<span key={i} className="subtopic-item">{subtopic.name}</span>)))}</div>}</td>
                  <td>{(editMode && isEditable) ? (<div>{item.projects.map((proj, projIndex) => (<InputGroup size="sm" key={projIndex} className="mb-1"><Form.Control value={proj.name} onChange={e => handleProjectChange(index, projIndex, e.target.value)}/><Button variant="outline-danger" onClick={() => removeProject(index, projIndex)}>-</Button></InputGroup>))}<Button variant="link" size="sm" onClick={() => addProject(index)}>+ Add</Button></div>) : <div className="projects-list">{item.projects.map((project, i) => (project.name && (<span key={i} className="project-item">{project.name}</span>)))}</div>}</td>
                  <td>{(editMode && isEditable) ? <Form.Select size="sm" value={item.completionStatus} onChange={(e) => handleItemChange(index, 'completionStatus', e.target.value)}><option>Yet to Start</option><option>In Progress</option><option>Completed</option></Form.Select> : (<Badge bg={item.completionStatus === 'Completed' ? 'success' : item.completionStatus === 'In Progress' ? 'warning' : 'danger'} className="status-badge">{item.completionStatus}</Badge>)}</td>
                  {(editMode && isEditable) && <td className="actions-col"><Button variant="danger" size="sm" onClick={() => handleDeleteItem(item._id)} className="delete-btn"><i className="fas fa-trash"></i></Button></td>}
                </tr>
              ))
            ) : (<tr><td colSpan={(editMode && isEditable) ? 5 : 4} className="empty-message"><p>{searchTerm ? "No items match search" : "No items yet"}</p></td></tr>)}
          </tbody>
        </table>
      </div>
      
      {(editMode && isEditable) && (<div className="edit-actions"><Button onClick={toggleAddForm}>Add Item</Button><Button onClick={handleSaveChanges} disabled={loading}>{loading ? <Spinner as="span" animation="border" size="sm"/> : 'Save Changes'}</Button></div>)}
    </div>
  );
};

export default TechStackTable;
