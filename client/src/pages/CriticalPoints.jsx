// client/src/pages/CriticalPoints.jsx
import React, { useState, useEffect } from 'react';
import { Nav, Spinner, Alert } from 'react-bootstrap';
import useAuth from '../hooks/useAuth.js';
import InteractionsFeedback from '../components/critical-points/InteractionsFeedback.jsx';
import CompaniesStatus from '../components/critical-points/CompaniesStatus.jsx';
import { interactionsService, companyStatusService } from '../services/criticalPointsService.js';

const CriticalPointsPage = () => {
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState('interactions');
    const [interactionsData, setInteractionsData] = useState([]);
    const [companyStatusData, setCompanyStatusData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    
    const fetchData = async () => {
        setLoading(true);
        setError('');
        try {
            const [interactionsRes, companyStatusRes] = await Promise.all([
                interactionsService.getAll(),
                companyStatusService.getAll(),
            ]);
            setInteractionsData(interactionsRes.data || []);
            setCompanyStatusData(companyStatusRes.data || []);
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to fetch critical points data.');
        } finally {
            setLoading(false);
        }
    };
    
    const canEdit = user.role === 'admin' || user.role === 'crm' || (user.role === 'instructor' && user.canAccessCriticalPoints);
    
    useEffect(() => {
        fetchData();
    }, []);

    return (
        <div className="critical-points-page">

            {error && <Alert variant="danger" onClose={() => setError('')} dismissible>{error}</Alert>}
            
            <Nav variant="tabs" activeKey={activeTab} onSelect={(k) => setActiveTab(k)} className="mb-4">
                <Nav.Item>
                    <Nav.Link eventKey="interactions">Interactions Feedback</Nav.Link>
                </Nav.Item>
                <Nav.Item>
                    <Nav.Link eventKey="status">Companies Status</Nav.Link>
                </Nav.Item>
            </Nav>

            {loading ? (
                 <div className="text-center py-5">
                     <Spinner animation="border" variant="primary" />
                     <p className="mt-3 text-muted">Loading data...</p>
                 </div>
            ) : (
                <>
                    {activeTab === 'interactions' && <InteractionsFeedback data={interactionsData} canEdit={canEdit} onUpdate={fetchData} />}
                    {activeTab === 'status' && <CompaniesStatus data={companyStatusData} canEdit={canEdit} onUpdate={fetchData} />}
                </>
            )}
        </div>
    );
};

export default CriticalPointsPage;
