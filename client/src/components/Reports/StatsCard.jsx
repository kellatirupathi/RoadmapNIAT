// client/src/components/Reports/StatsCard.jsx
import React from 'react';
import { Card } from 'react-bootstrap';
import { Link } from 'react-router-dom';

const StatsCard = ({
  title,
  value,
  icon,
  color = 'primary',
  subtitle,
  linkTo,
  linkText,
  className = '',
  onClick
}) => {
  // Determine the icon class
  const iconClass = icon || 'fa-chart-bar';
  
  // Create the card content
  const cardContent = (
    <Card.Body className="d-flex flex-column">
      <div className="d-flex align-items-center mb-3">
        <div className={`rounded-circle p-2 bg-${color} bg-opacity-10 me-3`}>
          <i className={`fas ${iconClass} fa-lg text-${color}`}></i>
        </div>
        <h5 className="mb-0">{title}</h5>
      </div>
      
      <h2 className={`display-6 fw-bold mb-0 text-${color}`}>
        {value}
      </h2>
      
      {subtitle && (
        <div className="text-muted mt-2 small">
          {subtitle}
        </div>
      )}
      
      {(linkTo || linkText) && (
        <div className="mt-auto pt-3">
          {linkTo ? (
            <Link to={linkTo} className={`btn btn-sm btn-outline-${color} w-100`}>
              {linkText || 'View Details'}
            </Link>
          ) : (
            <button 
              className={`btn btn-sm btn-outline-${color} w-100`}
              onClick={onClick}
            >
              {linkText || 'View Details'}
            </button>
          )}
        </div>
      )}
    </Card.Body>
  );

  return (
    <Card className={`h-100 border-0 shadow-sm ${className}`}>
      {cardContent}
    </Card>
  );
};

export default StatsCard;