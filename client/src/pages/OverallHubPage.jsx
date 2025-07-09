// client/src/pages/OverallHubPage.jsx
import React, { useState, useEffect, useCallback, useMemo } from 'react';
// --- START MODIFICATION: Import Navigate and useAuth ---
import { Navigate } from 'react-router-dom';
import useAuth from '../hooks/useAuth.js';
// --- END MODIFICATION ---
import { Card, Table, Spinner, Alert, Modal, Button } from 'react-bootstrap';
import studentsTrackerService from '../services/studentsTrackerService.js';
import { ratingCalculations, sheetConfig } from '../utils/studentsTrackerConfig.js';

const OverallHubPage = () => {
    // --- START MODIFICATION: Added auth hook and permission checks ---
    const { user } = useAuth();

    // Secure the component: redirect if the user role/permission doesn't match
    if ((user.role === 'instructor' || user.role === 'crm') && !user.canAccessOverallHub) {
        return <Navigate to="/not-authorized" replace />;
    }
    // --- END MODIFICATION ---

    const [aggregatedData, setAggregatedData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const [showDetailsModal, setShowDetailsModal] = useState(false);
    const [modalTitle, setModalTitle] = useState('');
    const [modalData, setModalData] = useState([]);
    const [modalColumns, setModalColumns] = useState([]);
    const [modalLoading, setModalLoading] = useState(false);

    const fetchAllData = useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            const [
                aseRes, 
                interactionRes, 
                assignmentRes, 
                incrutierRes, 
                closingRes
            ] = await Promise.all([
                studentsTrackerService.aseRatings.getAll(),
                studentsTrackerService.companyInteractions.getAll(),
                studentsTrackerService.assignmentRatings.getAll(),
                studentsTrackerService.incrutierRatings.getAll(),
                studentsTrackerService.companyClosings.getAll(),
            ]);
            
            const hubMap = new Map();
            const rawDataCache = {
                aseRatings: aseRes.data || [],
                companyInteractions: interactionRes.data || [],
                assignmentRatings: assignmentRes.data || [],
                incrutierRatings: incrutierRes.data || [],
                companyClosings: closingRes.data || [],
            };
            
            const allItems = Object.values(rawDataCache).flat();
            allItems.forEach(item => {
                const key = `${item.companyName}|${item.niatId}`;
                if (!hubMap.has(key)) {
                    hubMap.set(key, {
                        companyName: item.companyName, niatId: item.niatId, studentName: item.studentName || 'N/A',
                        aseRating: 0, companyInteractionRating: 0, assignmentRating: 0, incrutierRating: 0, companyClosingRating: 0,
                    });
                }
            });
            
            hubMap.forEach((entry, key) => {
                const [company, niat] = key.split('|');

                const aseRecords = rawDataCache.aseRatings.filter(i => i.companyName === company && i.niatId === niat);
                const interactionRecords = rawDataCache.companyInteractions.filter(i => i.companyName === company && i.niatId === niat);
                const incrutierRecords = rawDataCache.incrutierRatings.filter(i => i.companyName === company && i.niatId === niat);
                const closingRecords = rawDataCache.companyClosings.filter(i => i.companyName === company && i.niatId === niat);
                const assignmentRecords = rawDataCache.assignmentRatings.filter(i => i.niatId === niat);

                const getHighestScore = (records, calcFn) => records.length > 0 ? Math.max(...records.map(r => parseInt((calcFn(r) || "0").split('/')[0]) || 0)) : 0;
                
                entry.aseRating = getHighestScore(aseRecords, ratingCalculations.aseRatings);
                entry.incrutierRating = getHighestScore(incrutierRecords, ratingCalculations.incrutierRatings);
                entry.companyInteractionRating = getHighestScore(interactionRecords, ratingCalculations.companyInteractions);
                entry.companyClosingRating = getHighestScore(closingRecords, ratingCalculations.companyClosings);

                if (assignmentRecords.length > 0) {
                    const total = assignmentRecords.reduce((sum, a) => sum + (parseInt(a.marks?.split('/')[0], 10) || 0), 0);
                    const count = assignmentRecords.length;
                    entry.assignmentRating = Math.round((total / count) * 2); // Scale to /20
                }
            });

            const finalData = Array.from(hubMap.values()).map(entry => ({
                ...entry,
                total: (entry.aseRating || 0) + 
                       (entry.companyInteractionRating || 0) + 
                       (entry.assignmentRating || 0) + 
                       (entry.incrutierRating || 0) + 
                       (entry.companyClosingRating || 0),
            }));

            setAggregatedData(finalData);
            localStorage.setItem('hubRawDataCache', JSON.stringify(rawDataCache));

        } catch (err) {
            setError('Failed to load and process HUB data.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchAllData();
    }, [fetchAllData]);
    
    const handleScoreClick = async (hubEntry, ratingKey) => {
        const config = sheetConfig[ratingKey];
        if (!config) return;

        setModalTitle(`${config.title} for ${hubEntry.studentName} @ ${hubEntry.companyName}`);
        setModalColumns(config.columns);
        setModalLoading(true);
        setShowDetailsModal(true);

        try {
            const cachedData = JSON.parse(localStorage.getItem('hubRawDataCache'));
            const dataToFilter = cachedData[ratingKey] || [];
            
            const filtered = dataToFilter.filter(item => 
                item.companyName === hubEntry.companyName && 
                item.niatId === hubEntry.niatId
            );

            const dataWithMarks = filtered.map(item => ({
                ...item,
                overallMarks: ratingCalculations[ratingKey] ? ratingCalculations[ratingKey](item) : 'N/A'
            }));

            setModalData(dataWithMarks);
        } catch(err) {
            console.error("Error fetching details for modal:", err);
            setModalData([]);
        } finally {
            setModalLoading(false);
        }
    };
    
    const formatDateForDisplay = (dateString) => {
        if (!dateString) return '';
        try {
            return new Date(dateString).toLocaleDateString('en-US');
        } catch (e) {
            return 'Invalid Date';
        }
    };
    

    const getScoreColor = (score, maxScore) => {
        if (!maxScore || maxScore === 0) return 'text-muted';
        const percentage = (score / maxScore) * 100;
        if (percentage >= 75) return 'text-success';
        if (percentage >= 50) return 'text-warning';
        return 'text-danger';
    };

    return (
        <div>
             <Card className="shadow-sm">
                <Card.Header as="h5">Overall Student HUB</Card.Header>
                <Card.Body>
                    {error && <Alert variant="danger">{error}</Alert>}
                    {loading ? <div className="text-center p-5"><Spinner /></div> : (
                        <div className="table-responsive">
                            <Table striped bordered hover size="sm">
                                <thead className="table-light">
                                    <tr>
                                        <th>Company</th>
                                        <th>NIAT ID</th>
                                        <th>Student</th>
                                        <th className="text-center">Companies & Students (ASE ratings) (/20)</th>
                                        <th className="text-center">Company Interaction Rating (/20)</th>
                                        <th className="text-center">Assignments Rating (/20)</th>
                                        <th className="text-center">Incrutier Rating (/20)</th>
                                        <th className="text-center">Company Closing Rating (/20)</th>
                                        <th className="text-center">Overall (/100)</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {aggregatedData.sort((a,b) => b.total - a.total).map(item => (
                                        <tr key={`${item.companyName}-${item.niatId}`}>
                                            <td>{item.companyName}</td>
                                            <td>{item.niatId}</td>
                                            <td>{item.studentName}</td>
                                            <td className={`text-center fw-medium ${getScoreColor(item.aseRating, 20)}`} onClick={() => handleScoreClick(item, 'aseRatings')} style={{ cursor: 'pointer' }}>{item.aseRating}</td>
                                            <td className={`text-center fw-medium ${getScoreColor(item.companyInteractionRating, 20)}`} onClick={() => handleScoreClick(item, 'companyInteractions')} style={{ cursor: 'pointer' }}>{item.companyInteractionRating}</td>
                                            <td className={`text-center fw-medium ${getScoreColor(item.assignmentRating, 20)}`} onClick={() => handleScoreClick(item, 'assignmentRatings')} style={{ cursor: 'pointer' }}>{item.assignmentRating}</td>
                                            <td className={`text-center fw-medium ${getScoreColor(item.incrutierRating, 20)}`} onClick={() => handleScoreClick(item, 'incrutierRatings')} style={{ cursor: 'pointer' }}>{item.incrutierRating}</td>
                                            <td className={`text-center fw-medium ${getScoreColor(item.companyClosingRating, 20)}`} onClick={() => handleScoreClick(item, 'companyClosings')} style={{ cursor: 'pointer' }}>{item.companyClosingRating}</td>
                                            <td className={`text-center fw-bolder ${getScoreColor(item.total, 100)}`}>{item.total}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </Table>
                        </div>
                    )}
                </Card.Body>
            </Card>

            <Modal show={showDetailsModal} onHide={() => setShowDetailsModal(false)} size="xl" centered>
                <Modal.Header closeButton>
                    <Modal.Title>{modalTitle}</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    {modalLoading ? <div className="text-center p-4"><Spinner /></div> : (
                        modalData.length > 0 ? (
                            <div className="table-responsive"> {/* WRAP TABLE IN THIS DIV */}
                                <Table striped bordered size="sm">
                                    <thead>
                                        <tr>
                                            {modalColumns.map(col => <th key={col.field}>{col.header}</th>)}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {modalData.map(row => (
                                            <tr key={row._id}>
                                                {modalColumns.map(col => (
                                                    <td key={col.field}>{col.type === 'date' ? formatDateForDisplay(row[col.field]) : row[col.field]}</td>
                                                ))}
                                            </tr>
                                        ))}
                                    </tbody>
                                </Table>
                            </div>
                        ) : <p className="text-muted text-center">No detailed records found for this category.</p>
                    )}
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowDetailsModal(false)}>Close</Button>
                </Modal.Footer>
            </Modal>
        </div>
    );
};

export default OverallHubPage;
