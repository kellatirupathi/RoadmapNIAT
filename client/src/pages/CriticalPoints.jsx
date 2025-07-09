// client/src/pages/CriticalPoints.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { Spinner, Alert, Card } from 'react-bootstrap';
// --- REMOVED: Nav and useLocation are no longer needed as the tab interface is gone. ---
import useAuth from '../hooks/useAuth.js';
import InteractionsFeedback from '../components/critical-points/InteractionsFeedback.jsx';
// --- REMOVED: 'companyStatusService' and 'CompaniesStatus' component imports were deleted. ---
import { interactionsService } from '../services/criticalPointsService.js';

const CriticalPointsPage = () => {
    const { user } = useAuth();

    // --- REMOVED: State management for activeTab is no longer necessary. ---
    const [interactionsData, setInteractionsData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    
    // --- MODIFICATION: The fetchData function has been simplified. ---
    // It no longer needs to fetch data for two different components and now only retrieves
    // the 'interactions' data, reducing complexity and improving performance.
    const fetchData = useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            const interactionsRes = await interactionsService.getAll();
            setInteractionsData(interactionsRes.data || []);
            // --- REMOVED: The API call to companyStatusService.getAll() has been deleted. ---
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to fetch critical points data.');
        } finally {
            setLoading(false);
        }
    }, []);
    
    // Authorization check to determine if the user has editing rights on the page.
    const canEdit = user.role === 'admin' || user.role === 'crm' || (user.role === 'instructor' && user.canAccessCriticalPoints);
    
    // Initial data fetch when the component mounts.
    useEffect(() => {
        fetchData();
    }, [fetchData]);

    // --- REMOVED: The useEffect hook that synced the URL query param with the active tab is deleted. ---

    return (
        <div className="critical-points-page">

            {error && <Alert variant="danger" onClose={() => setError('')} dismissible>{error}</Alert>}
            
            {/* --- REMOVED: The entire Nav and Nav.Item structure for tabs has been deleted from the render block. --- */}

            {loading ? (
                 <div className="text-center py-5">
                     <Spinner animation="border" variant="primary" />
                     <p className="mt-3 text-muted">Loading data...</p>
                 </div>
            ) : (
                // --- MODIFICATION: The component now directly renders InteractionsFeedback ---
                // Conditional rendering based on activeTab has been removed, simplifying the JSX.
                <InteractionsFeedback data={interactionsData} canEdit={canEdit} onUpdate={fetchData} />
            )}
        </div>
    );
};

export default CriticalPointsPage;
