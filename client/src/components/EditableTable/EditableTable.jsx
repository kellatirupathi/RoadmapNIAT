// client/src/components/EditableTable/EditableTable.jsx
import React, { useState } from 'react';
import { Table, Button, Form, Spinner } from 'react-bootstrap';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import './EditableTable.css';

const EditableTable = ({ columns, data, onSave, onDelete, onAdd, isLoading, activeSheet, allowAdd = true }) => {
    const [editingRowId, setEditingRowId] = useState(null);
    const [editedData, setEditedData] = useState({});
    const [newRowData, setNewRowData] = useState(() => {
        const initial = {};
        columns.forEach(col => initial[col.field] = '');
        return initial;
    });

    const [expandedCells, setExpandedCells] = useState({});

    const toggleCellExpansion = (cellId) => {
        setExpandedCells(prev => ({
            ...prev,
            [cellId]: !prev[cellId]
        }));
    };
    
    const groupedColumns = () => {
        if (activeSheet !== 'tech-stack-roadmaps') return null;
        
        const groups = {};
        columns.forEach(col => {
            if (col.group) {
                if (!groups[col.group]) {
                    groups[col.group] = [];
                }
                groups[col.group].push(col);
            }
        });
        
        return Object.keys(groups).length > 0 ? groups : null;
    };

    const regularColumns = () => {
        if (activeSheet !== 'tech-stack-roadmaps') return columns;
        return columns.filter(col => !col.group);
    };

    const handleEditClick = (row) => {
        setEditingRowId(row._id);
        setEditedData({ ...row });
    };

    const handleCancelClick = () => {
        setEditingRowId(null);
        setEditedData({});
    };

    const handleSaveClick = async (id) => {
        await onSave(id, editedData);
        setEditingRowId(null);
    };

    const handleInputChange = (e) => {
        setEditedData({ ...editedData, [e.target.name]: e.target.value });
    };
    
    const handleDateChange = (date, field) => {
        setEditedData({ ...editedData, [field]: date });
    };

    const handleNewRowChange = (e) => {
        setNewRowData({ ...newRowData, [e.target.name]: e.target.value });
    };
    
    const handleNewRowDateChange = (date, field) => {
        setNewRowData({ ...newRowData, [field]: date });
    };

    const handleAddRow = async () => {
        await onAdd(newRowData);
        const initial = {};
        columns.forEach(col => initial[col.field] = '');
        setNewRowData(initial);
    };
    
    const renderCell = (row, column) => {
        const isEditing = editingRowId === row._id;
        const value = isEditing ? editedData[column.field] : row[column.field];
        
        const cellId = `${row._id}-${column.field}`;
        const isExpanded = !!expandedCells[cellId];
        const maxLength = 50;

        const expandableColumns = [
            'fortnightInteractionRemarks', 'feedbackFromCompany', 'feedbackImplementationStatus', 'feedbackImplementationRemarks'
        ];
        const isExpandableColumn = activeSheet === 'critical-points' && expandableColumns.includes(column.field);
        
        if (isEditing) {
            if (column.type === 'date') {
                 return (
                    <DatePicker
                        selected={value ? new Date(value) : null}
                        onChange={(date) => handleDateChange(date, column.field)}
                        dateFormat="MM/dd/yyyy"
                        className="form-control form-control-sm"
                        placeholderText="Select Date"
                        portalId="datepicker-portal"
                    />
                );
            }
            if (column.type === 'number') {
                return (
                    <Form.Control type="number" name={column.field} value={value || ''} onChange={handleInputChange} size="sm" />
                );
            }
            // MODIFIED: Handle 'progress' type during editing
            if (column.type === 'progress') {
                return (
                    <Form.Control
                        type="number"
                        name={column.field}
                        value={value !== null ? value : ''}
                        onChange={handleInputChange}
                        size="sm"
                        min="0"
                        max="100"
                        placeholder="%"
                    />
                );
            }
            return (
                <Form.Control type="text" as="textarea" rows={3} name={column.field} value={value || ''} onChange={handleInputChange} size="sm" />
            );
        }
        
        if (!isEditing && column.field === 'roadmapLink') {
            if (value && (value.startsWith('http') || value.startsWith('/'))) {
                return <a href={value} target="_blank" rel="noopener noreferrer">{value}</a>;
            }
            return value;
        }
        
        if (!isEditing && /^techStack\d+Name$/.test(column.field)) {
            return row[column.field];
        }
        
        if (!isEditing && column.type === 'progress') {
            const progressValue = value;
            
            // MODIFIED: Show 'Auto' if the manual override is not set
            if (progressValue === null || typeof progressValue === 'undefined') {
                return <span className="text-muted small">Auto</span>;
            }
            
            const roundedProgress = Math.round(progressValue);
            let textColorClass = 'text-danger';
            
            if (roundedProgress >= 75) {
                textColorClass = 'text-success';
            } else if (roundedProgress > 30) {
                textColorClass = 'text-warning';
            }
            
            return (
                <span className={`fw-bold ${textColorClass}`} style={{ minWidth: '60px', display: 'inline-block', textAlign: 'center' }}>
                    {`${roundedProgress}%`}
                </span>
            );
        }

        if (column.type === 'date' && value) {
            return new Date(value).toLocaleDateString();
        }

        if (isExpandableColumn && typeof value === 'string' && value.length > maxLength) {
            return (
                <div>
                    <span style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                        {isExpanded ? value : `${value.substring(0, maxLength)}...`}
                    </span>
                    <Button variant="link" size="sm" onClick={() => toggleCellExpansion(cellId)} style={{textDecoration: 'none'}}>
                        {isExpanded ? 'Less' : 'More'}
                    </Button>
                </div>
            );
        }

        if (typeof value === 'string' && value.length > 50) {
            return (
                <span title={value} style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                    {value.substring(0, 47)}...
                </span>
            );
        }

        return value;
    };
    
    const renderColumnHeaders = () => {
        const groups = groupedColumns();
        const shouldShowActions = onSave && onDelete;
        
        if (activeSheet === 'tech-stack-roadmaps' && groups) {
            const groupCells = [];
            const regularCols = regularColumns();
            const firstGroupColIndex = columns.findIndex(col => col.group);
            
            const regularColsBefore = regularCols.filter(col => 
                columns.indexOf(col) < firstGroupColIndex);
                
            if (regularColsBefore.length > 0) {
                groupCells.push(
                    <th key="empty-start" colSpan={regularColsBefore.length}></th>
                );
            }
            
            Object.entries(groups).forEach(([groupName, groupCols]) => {
                const isCriticalGroup = groupName === 'Critical Points';
                groupCells.push(
                    <th 
                        key={groupName} 
                        colSpan={groupCols.length} 
                        className={`text-center ${isCriticalGroup ? 'group-header-critical' : 'group-header-cell'}`}
                    >
                        {groupName}
                    </th>
                );
            });
            
            if (shouldShowActions) {
              groupCells.push(<th key="empty-actions" className="actions-column"></th>);
            }
            
            return (
                <>
                    <tr className="group-header-row">
                        {groupCells}
                    </tr>
                    <tr>
                        {columns.map(col => (
                            <th key={col.field} data-field={col.field} title={col.header}>
                                {col.header}
                            </th>
                        ))}
                        {shouldShowActions && <th className="text-center actions-column">Actions</th>}
                    </tr>
                </>
            );
        }
        
        return (
            <tr>
                {columns.map(col => (
                    <th key={col.field} data-field={col.field} title={col.header}>
                        {col.header}
                    </th>
                ))}
                {shouldShowActions && <th className="text-center actions-column">Actions</th>}
            </tr>
        );
    };

    return (
        <div className="editable-table-container">
            <div className="table-responsive">
                <Table striped bordered hover className="editable-table">
                    <thead className="table-light">
                        {renderColumnHeaders()}
                    </thead>
                    <tbody>
                         {allowAdd && (
                            <tr className="add-row-form">
                                {columns.map(col => (
                                    <td key={col.field} data-field={col.field}>
                                        {col.type === 'date' ? (
                                            <DatePicker
                                                selected={newRowData[col.field] ? new Date(newRowData[col.field]) : null}
                                                onChange={(date) => handleNewRowDateChange(date, col.field)}
                                                dateFormat="MM/dd/yyyy"
                                                className="form-control form-control-sm"
                                                placeholder={`Add ${col.header}`}
                                                isClearable
                                                portalId="datepicker-portal"
                                            />
                                        ) : (
                                            <Form.Control
                                                type={col.type || 'text'}
                                                name={col.field}
                                                value={newRowData[col.field] || ''}
                                                onChange={handleNewRowChange}
                                                placeholder={`Add ${col.header}`}
                                                size="sm"
                                            />
                                        )}
                                    </td>
                                ))}
                                {(onSave && onDelete) &&
                                <td className="text-center align-middle actions-column">
                                    <Button 
                                        variant="success" 
                                        size="sm" 
                                        onClick={handleAddRow} 
                                        disabled={isLoading} 
                                        title="Add new row"
                                    >
                                        {isLoading ? <Spinner animation="border" size="sm" /> : <i className="fas fa-plus"></i>}
                                    </Button>
                                </td>
                                }
                            </tr>
                        )}
                        {data.map(row => (
                            <tr key={row._id}>
                                {columns.map(col => (
                                    <td key={col.field} data-field={col.field} style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                                        {renderCell(row, col)}
                                    </td>
                                ))}
                                {(onSave && onDelete) &&
                                <td className="text-center actions-column">
                                    {editingRowId === row._id ? (
                                        <div className="d-flex justify-content-center">
                                            <Button variant="outline-success" size="sm" onClick={() => handleSaveClick(row._id)} className="me-2" disabled={isLoading} title="Save changes">
                                                {isLoading ? <Spinner animation="border" size="sm"/> : <i className="fas fa-save"></i>}
                                            </Button>
                                            <Button variant="outline-secondary" size="sm" onClick={handleCancelClick} disabled={isLoading} title="Cancel editing">
                                                <i className="fas fa-times"></i>
                                            </Button>
                                        </div>
                                    ) : (
                                        <div className="d-flex justify-content-center">
                                            <Button variant="outline-primary" size="sm" onClick={() => handleEditClick(row)} className="me-2" disabled={isLoading} title="Edit row">
                                                <i className="fas fa-edit"></i>
                                            </Button>
                                            <Button variant="outline-danger" size="sm" onClick={() => onDelete(row._id)} disabled={isLoading} title="Delete row">
                                                <i className="fas fa-trash"></i>
                                            </Button>
                                        </div>
                                    )}
                                </td>
                                }
                            </tr>
                        ))}
                        {!isLoading && data.length === 0 && (
                            <tr>
                                <td colSpan={columns.length + (onSave && onDelete ? 1 : 0)} className="text-center text-muted py-4">
                                    No data available for this sheet.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </Table>
            </div>
        </div>
    );
};

export default EditableTable;
