// client/src/pages/PublicInteractionPage.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { Card, Table, Form, Spinner, Alert, Container, Button } from 'react-bootstrap';
import companyInteractionTrackingService from '../services/companyInteractionTrackingService';

const PublicInteractionPage = () => {
    const { publicId } = useParams();
    const [record, setRecord] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [savingStatus, setSavingStatus] = useState({}); // e.g., { 'sessionId-studentId-field': true }

    const interactionQualityOptions = [
        { value: "5 - The candidate(s) were confident, articulate, asked relevant questions, and showed strong enthusiasm. Very promising.", label: "5 - The candidate(s) were confident, articulate, asked relevant questions, and showed strong enthusiasm. Very promising." },
        { value: "4 - The interaction was smooth. The candidate(s) communicated well, were attentive, and showed decent understanding.", label: "4 - The interaction was smooth. The candidate(s) communicated well, were attentive, and showed decent understanding." },
        { value: "3 - The candidate(s) were moderately prepared. There were some gaps in communication or clarity, but potential exists.", label: "3 - The candidate(s) were moderately prepared. There were some gaps in communication or clarity, but potential exists." },
        { value: "2 - The candidate(s) had difficulty expressing themselves, seemed underprepared, or lacked clarity in responses.", label: "2 - The candidate(s) had difficulty expressing themselves, seemed underprepared, or lacked clarity in responses." },
        { value: "1 - The candidate(s) were unresponsive, disengaged, or lacked basic fit for the role.", label: "1 - The candidate(s) were unresponsive, disengaged, or lacked basic fit for the role." }
    ];

    const fetchData = useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            const response = await companyInteractionTrackingService.getPublicData(publicId);
            setRecord(response.data);
        } catch (err) {
            setError(err.response?.data?.error || 'Could not load the interaction page. The link may be invalid or expired.');
        } finally {
            setLoading(false);
        }
    }, [publicId]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleFieldChange = async (sessionId, studentId, field, value) => {
        const key = `${sessionId}-${studentId}-${field}`;
        setSavingStatus(prev => ({ ...prev, [key]: true }));

        try {
            // Send update to the backend
            await companyInteractionTrackingService.updatePublicData(publicId, sessionId, studentId, field, value);

            // --- START FIX: Update local state to reflect the change immediately in the UI ---
            setRecord(prevRecord => {
                if (!prevRecord) return null;

                // Create a deep copy to avoid direct state mutation
                const newRecord = JSON.parse(JSON.stringify(prevRecord));

                // Find the correct interaction session
                const sessionToUpdate = newRecord.interactions.find(s => s._id === sessionId);
                if (sessionToUpdate) {
                    // Find the correct student within that session
                    const studentToUpdate = sessionToUpdate.studentData.find(s => s._id === studentId);
                    if (studentToUpdate) {
                        // Update the specific field (e.g., 'interactionQuality' or 'remarks')
                        studentToUpdate[field] = value;
                    }
                }
                
                // Return the updated record to re-render the component
                return newRecord;
            });
            // --- END FIX ---

        } catch (err) {
            alert(`Failed to save update for ${field}. Please try again.`);
        } finally {
            setSavingStatus(prev => ({ ...prev, [key]: false }));
        }
    };
    
    // Use onBlur for textareas to avoid too many API calls
    const handleRemarksBlur = (e, sessionId, studentId) => {
        handleFieldChange(sessionId, studentId, 'remarks', e.target.value);
    };

    if (loading) {
        return <div className="vh-100 d-flex justify-content-center align-items-center"><Spinner animation="border" /></div>;
    }

    if (error) {
        return <Container className="py-5 text-center"><Alert variant="danger">{error}</Alert></Container>;
    }
    
    if (!record) {
         return <Container className="py-5 text-center"><Alert variant="warning">No data found for this interaction.</Alert></Container>;
    }

    return (
        <div className="public-interaction-page">
            <Container fluid className="py-4 px-4">
                {record.interactions.map(session => (
                    <Card key={session._id} className="mb-4 shadow-sm">
                        <Card.Header as="h5" className="bg-light">{session.sessionName}</Card.Header>
                        <Card.Body>
                            <div className="table-responsive">
                                <Table striped bordered size="sm" className="align-middle">
                                    <thead>
                                        <tr>
                                            <th style={{width: '8%'}}>NIAT ID</th>
                                            <th style={{width: '10%'}}>Student Name</th>
                                            <th style={{width: '16%'}}>Training Plan</th>
                                            <th style={{width: '16%'}}>Training Covered</th>
                                            <th style={{width: '35%'}}>How was your interaction with the candidate(s)?</th>
                                            <th style={{width: '18%'}}>Remarks (if any)</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {session.studentData.map(student => (
                                            <tr key={student._id}>
                                                <td>{student.niatId}</td>
                                                <td>{student.studentName}</td>
                                                <td>{student.trainingPlan}</td>
                                                <td>{student.trainingCovered}</td>
                                                <td>
                                                    <div className="d-flex align-items-center">
                                                        <Form.Select 
                                                            size="sm"
                                                            value={student.interactionQuality || ''} 
                                                            onChange={e => handleFieldChange(session._id, student._id, 'interactionQuality', e.target.value)}
                                                        >
                                                            <option value="">Select...</option>
                                                            {interactionQualityOptions.map(opt => (
                                                                <option key={opt.value} value={opt.value}>{opt.label}</option>
                                                            ))}
                                                        </Form.Select>
                                                        {savingStatus[`${session._id}-${student._id}-interactionQuality`] && <Spinner size="sm" className="ms-2" />}
                                                    </div>
                                                </td>
                                                <td>
                                                     <div className="d-flex align-items-center">
                                                        <Form.Control 
                                                            as="textarea"
                                                            rows={1}
                                                            defaultValue={student.remarks || ''}
                                                            onBlur={e => handleRemarksBlur(e, session._id, student._id)}
                                                        />
                                                         {savingStatus[`${session._id}-${student._id}-remarks`] && <Spinner size="sm" className="ms-2" />}
                                                     </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </Table>
                            </div>
                        </Card.Body>
                    </Card>
                ))}
            </Container>
            
            <style>{`
                .public-interaction-page .table td,
                .public-interaction-page .table th,
                .public-interaction-page .form-control,
                .public-interaction-page .form-select {
                    font-size: 0.8rem;
                }
            `}</style>
        </div>
    );
};

export default PublicInteractionPage;
