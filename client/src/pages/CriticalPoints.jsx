// // client/src/pages/CriticalPoints.jsx
// import React, { useState, useEffect, useCallback } from 'react';
// import { Spinner, Alert, Card } from 'react-bootstrap';
// // --- REMOVED: Nav and useLocation are no longer needed as the tab interface is gone. ---
// import useAuth from '../hooks/useAuth.js';
// import InteractionsFeedback from '../components/critical-points/InteractionsFeedback.jsx';
// // --- REMOVED: 'companyStatusService' and 'CompaniesStatus' component imports were deleted. ---
// import { interactionsService } from '../services/criticalPointsService.js';

// const CriticalPointsPage = () => {
//     const { user } = useAuth();

//     // --- REMOVED: State management for activeTab is no longer necessary. ---
//     const [interactionsData, setInteractionsData] = useState([]);
//     const [loading, setLoading] = useState(true);
//     const [error, setError] = useState('');
    
//     // --- MODIFICATION: The fetchData function has been simplified. ---
//     // It no longer needs to fetch data for two different components and now only retrieves
//     // the 'interactions' data, reducing complexity and improving performance.
//     const fetchData = useCallback(async () => {
//         setLoading(true);
//         setError('');
//         try {
//             const interactionsRes = await interactionsService.getAll();
//             setInteractionsData(interactionsRes.data || []);
//             // --- REMOVED: The API call to companyStatusService.getAll() has been deleted. ---
//         } catch (err) {
//             setError(err.response?.data?.error || 'Failed to fetch critical points data.');
//         } finally {
//             setLoading(false);
//         }
//     }, []);
    
//     // Authorization check to determine if the user has editing rights on the page.
//     const canEdit = user.role === 'admin' || user.role === 'crm' || (user.role === 'instructor' && user.canAccessCriticalPoints);
    
//     // Initial data fetch when the component mounts.
//     useEffect(() => {
//         fetchData();
//     }, [fetchData]);

//     // --- REMOVED: The useEffect hook that synced the URL query param with the active tab is deleted. ---

//     return (
//         <div className="critical-points-page">

//             {error && <Alert variant="danger" onClose={() => setError('')} dismissible>{error}</Alert>}
            
//             {/* --- REMOVED: The entire Nav and Nav.Item structure for tabs has been deleted from the render block. --- */}

//             {loading ? (
//                  <div className="text-center py-5">
//                      <Spinner animation="border" variant="primary" />
//                      <p className="mt-3 text-muted">Loading data...</p>
//                  </div>
//             ) : (
//                 // --- MODIFICATION: The component now directly renders InteractionsFeedback ---
//                 // Conditional rendering based on activeTab has been removed, simplifying the JSX.
//                 <InteractionsFeedback data={interactionsData} canEdit={canEdit} onUpdate={fetchData} />
//             )}
//         </div>
//     );
// };

// export default CriticalPointsPage;

// client/src/pages/CriticalPoints.jsx
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Spinner, Alert, Card, Form, InputGroup, Button, Pagination } from 'react-bootstrap';
import useAuth from '../hooks/useAuth.js';
import InteractionsFeedback from '../components/critical-points/InteractionsFeedback.jsx';
import { interactionsService } from '../services/criticalPointsService.js';
import Papa from 'papaparse';

// Pagination Component
const PaginationComponent = ({ currentPage, totalPages, onPageChange }) => {
    if (totalPages <= 1) return null;

    let items = [];
    let startPage, endPage;

    if (totalPages <= 5) {
        startPage = 1;
        endPage = totalPages;
    } else {
        if (currentPage <= 3) {
            startPage = 1;
            endPage = 5;
        } else if (currentPage + 1 >= totalPages) {
            startPage = totalPages - 4;
            endPage = totalPages;
        } else {
            startPage = currentPage - 2;
            endPage = currentPage + 1;
        }
    }
    for (let number = startPage; number <= endPage; number++) {
        items.push(<Pagination.Item key={number} active={number === currentPage} onClick={() => onPageChange(number)}>{number}</Pagination.Item>);
    }

    return (
        <Pagination size="sm" className="justify-content-end mb-0">
            <Pagination.First onClick={() => onPageChange(1)} disabled={currentPage === 1} />
            <Pagination.Prev onClick={() => onPageChange(currentPage - 1)} disabled={currentPage === 1} />
            {startPage > 1 && <Pagination.Ellipsis />}
            {items}
            {endPage < totalPages && <Pagination.Ellipsis />}
            <Pagination.Next onClick={() => onPageChange(currentPage + 1)} disabled={currentPage === totalPages} />
            <Pagination.Last onClick={() => onPageChange(totalPages)} disabled={currentPage === totalPages} />
        </Pagination>
    );
};


const CriticalPointsPage = () => {
    const { user } = useAuth();

    // Data States
    const [interactionsData, setInteractionsData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    
    // UI Feature States
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    
    // Determine user permissions
    const canEdit = user.role === 'admin' || user.role === 'crm' || (user.role === 'instructor' && user.canAccessCriticalPoints);
    
    // Fetch all interaction records
    const fetchData = useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            const interactionsRes = await interactionsService.getAll();
            setInteractionsData(interactionsRes.data || []);
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to fetch critical points data.');
        } finally {
            setLoading(false);
        }
    }, []);
    
    // Initial data fetch
    useEffect(() => {
        fetchData();
    }, [fetchData]);

    // Reset page to 1 when search or rows per page changes
    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, rowsPerPage]);
    
    // Memoized filtering logic
    const filteredData = useMemo(() => {
        if (!searchTerm) return interactionsData;
        
        const lowerCaseSearch = searchTerm.toLowerCase();
        
        return interactionsData.filter(item => 
            item.company?.toLowerCase().includes(lowerCaseSearch) ||
            item.role?.toLowerCase().includes(lowerCaseSearch) ||
            (item.interactions || []).some(sub => 
                sub.interactionType?.toLowerCase().includes(lowerCaseSearch) ||
                sub.interactionOverallRemarks?.toLowerCase().includes(lowerCaseSearch)
            )
        );
    }, [interactionsData, searchTerm]);

    // Memoized pagination logic
    const paginatedData = useMemo(() => {
        const startIndex = (currentPage - 1) * rowsPerPage;
        return filteredData.slice(startIndex, startIndex + rowsPerPage);
    }, [filteredData, currentPage, rowsPerPage]);

    // Export to CSV function
    const handleExportCSV = () => {
        if (!filteredData || filteredData.length === 0) {
            alert("No data to export based on current filters.");
            return;
        }

        const csvData = [];
        filteredData.forEach(rec => {
            const commonData = {
                'Company': rec.company,
                'Role': rec.role,
                'Roadmap Review': rec.roadmapReviewByCompany,
                'Change Status': rec.roadmapChangesStatus,
                'Implementation Status': rec.feedbackImplementationStatus,
            };

            if (rec.interactions && rec.interactions.length > 0) {
                rec.interactions.forEach(sub => {
                    csvData.push({
                        ...commonData,
                        'Interaction Type': sub.interactionType,
                        'Interaction Date': sub.date ? new Date(sub.date).toLocaleDateString() : 'N/A',
                        'Attendees': sub.interactionAttendees,
                        'Summary': sub.interactionSummary,
                        'Remarks': sub.interactionOverallRemarks,
                    });
                });
            } else {
                csvData.push({ ...commonData, 'Interactions': 'No interactions' });
            }
        });
        
        const csv = Papa.unparse(csvData);
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        
        link.setAttribute("href", url);
        link.setAttribute("download", `Interactions_and_Feedback_Export.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };


    return (
        <div className="critical-points-page">
            <Card className="shadow-sm">
                <Card.Header as="div" className="py-2 px-3 bg-light">
                    <div className="d-flex justify-content-between align-items-center">
                        <div>
                            {/* Search Input Group */}
                            <InputGroup size="sm" style={{ maxWidth: '350px' }}>
                                <Form.Control
                                    type="text"
                                    placeholder="Search by company, role, interaction..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                                {searchTerm && 
                                    <Button variant="outline-secondary" onClick={() => setSearchTerm('')} title="Clear search">
                                        <i className="fas fa-times"></i>
                                    </Button>
                                }
                            </InputGroup>
                        </div>
                        {/* Export Button */}
                        <Button variant="outline-success" size="sm" onClick={handleExportCSV}>
                            <i className="fas fa-file-csv me-2"></i>Export
                        </Button>
                    </div>
                </Card.Header>
                 
                {error && <Alert variant="danger" onClose={() => setError('')} dismissible className="m-3">{error}</Alert>}
            
                {loading ? (
                    <div className="text-center py-5">
                        <Spinner animation="border" variant="primary" />
                        <p className="mt-3 text-muted">Loading data...</p>
                    </div>
                ) : (
                    // The main InteractionsFeedback component now receives paginated data
                    <InteractionsFeedback data={paginatedData} canEdit={canEdit} onUpdate={fetchData} />
                )}

                <Card.Footer className="bg-light d-flex justify-content-between align-items-center">
                    <div className="d-flex align-items-center gap-2">
                        <Form.Select 
                            size="sm" 
                            value={rowsPerPage} 
                            onChange={e => setRowsPerPage(Number(e.target.value))} 
                            style={{width: 'auto'}}
                        >
                            <option value={10}>10 rows</option>
                            <option value={25}>25 rows</option>
                            <option value={50}>50 rows</option>
                        </Form.Select>
                        <span className="text-muted small">Showing {paginatedData.length} of {filteredData.length} records</span>
                    </div>
                    <PaginationComponent 
                        currentPage={currentPage}
                        totalPages={Math.ceil(filteredData.length / rowsPerPage)}
                        onPageChange={setCurrentPage}
                    />
                </Card.Footer>
            </Card>
        </div>
    );
};

export default CriticalPointsPage;
