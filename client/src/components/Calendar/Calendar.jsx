// client/src/components/Calendar/Calendar.jsx
import React, { useState, useEffect, useRef } from 'react';
import './Calendar.css';

const Calendar = ({ scheduledEvents = [] }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [tooltip, setTooltip] = useState({
    visible: false,
    content: null,
    x: 0,
    y: 0,
  });
  const today = new Date();
  const tooltipRef = useRef(null);

  const daysOfWeek = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const firstDayOfMonth = new Date(year, month, 1);
  const lastDayOfMonth = new Date(year, month + 1, 0);
  const daysInMonth = lastDayOfMonth.getDate();
  const startingDay = firstDayOfMonth.getDay(); // 0 for Sunday, 1 for Monday, etc.

  const calendarDays = [];
  for (let i = 0; i < startingDay; i++) {
    calendarDays.push(null); // Blanks for days before month starts
  }
  for (let i = 1; i <= daysInMonth; i++) {
    calendarDays.push(new Date(year, month, i));
  }

  // Navigation functions
  const goToPreviousMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const goToNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const goToCurrentMonth = () => {
    setCurrentDate(new Date());
  };

  const isSameDay = (date1, date2) => {
    if (!date1 || !date2) return false;
    return (
      date1.getFullYear() === date2.getFullYear() &&
      date1.getMonth() === date2.getMonth() &&
      date1.getDate() === date2.getDate()
    );
  };
  
  const formatDateToYYYYMMDD = (date) => {
    if (!date) return '';
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const getEventsForDate = (date) => {
    if (!date) return [];
    const dateString = formatDateToYYYYMMDD(date);
    return scheduledEvents.filter(event => event.date === dateString);
  };
  
  const handleMouseEnter = (e, day) => {
    if (!day) return;
    const dayEvents = getEventsForDate(day);
    if (dayEvents.length > 0) {
      const rect = e.target.getBoundingClientRect();
      setTooltip({
        visible: true,
        // Show first event's details or a summary
        content: (
            <div className="p-1.5 text-xs">
                {dayEvents.slice(0, 2).map((event, index) => ( // Show up to 2 events for brevity
                    <div key={index} className={index > 0 ? 'mt-1 pt-1 border-t border-gray-200' : ''}>
                        <p className="font-semibold text-gray-700 mb-0.5">{event.techStackName}</p>
                        <p className="text-gray-600 mb-0">{event.topic}</p>
                    </div>
                ))}
                {dayEvents.length > 2 && <p className="text-gray-500 text-center text-xs mt-1 mb-0">+{dayEvents.length - 2} more</p>}
            </div>
        ),
        x: rect.left + rect.width / 2, // Center of the date cell
        y: rect.top - 10, // Above the date cell
      });
    }
  };

  const handleMouseLeave = () => {
    setTooltip({ visible: false, content: null, x: 0, y: 0 });
  };
  
  useEffect(() => {
    if (tooltip.visible && tooltipRef.current) {
        const tooltipRect = tooltipRef.current.getBoundingClientRect();
        let newX = tooltip.x - (tooltipRect.width / 2);
        let newY = tooltip.y - tooltipRect.height;

        // Adjust if tooltip goes off-screen
        if (newX < 0) newX = 5;
        if (newX + tooltipRect.width > window.innerWidth) newX = window.innerWidth - tooltipRect.width - 5;
        if (newY < 0) newY = tooltip.y + 25; // If not enough space on top, show below

        setTooltip(prev => ({ ...prev, finalX: newX, finalY: newY }));
    }
  }, [tooltip.visible, tooltip.x, tooltip.y]);

  // Check if current displayed month is the same as today's month
  const isCurrentMonth = today.getFullYear() === year && today.getMonth() === month;

  return (
    <div className="p-3 bg-gray-800 rounded-lg text-gray-200 calendar-widget">
      <div className="flex justify-between items-center mb-3">
        <button
          onClick={goToPreviousMonth}
          className="p-1.5 rounded-md hover:bg-gray-700 transition-colors duration-200 text-gray-300 hover:text-white"
          aria-label="Previous month"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        
        <div className="flex flex-col items-center">
          <h3 className="text-sm font-semibold text-gray-100">
            {monthNames[month]} {year}
          </h3>
          {!isCurrentMonth && (
            <button
              onClick={goToCurrentMonth}
              className="text-xs text-primary-400 hover:text-primary-300 mt-0.5 transition-colors duration-200"
            >
              Today
            </button>
          )}
        </div>
        
        <button
          onClick={goToNextMonth}
          className="p-1.5 rounded-md hover:bg-gray-700 transition-colors duration-200 text-gray-300 hover:text-white"
          aria-label="Next month"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
      
      <div className="grid grid-cols-7 gap-1 text-center text-xs font-medium text-gray-400 mb-1">
        {daysOfWeek.map(day => (
          <div key={day}>{day}</div>
        ))}
      </div>
      
      <div className="grid grid-cols-7 gap-1">
        {calendarDays.map((day, index) => {
          const isCurrentDay = day && isSameDay(day, today);
          const dayEvents = day ? getEventsForDate(day) : [];
          const hasScheduledEvent = dayEvents.length > 0;

          return (
            <div
              key={index}
              className={`
                text-center text-xs relative flex flex-col items-center justify-center
                p-0.5 rounded aspect-square
                ${day ? 'cursor-default' : ''}
                ${isCurrentDay ? 'current-day-highlight' : 'hover:bg-gray-700'}
              `}
              onMouseEnter={(e) => handleMouseEnter(e, day)}
              onMouseLeave={handleMouseLeave}
            >
              {day ? (
                <>
                  <span className={`${isCurrentDay ? 'text-white font-bold' : 'text-gray-300'}`}>
                    {day.getDate()}
                  </span>
                  {hasScheduledEvent && (
                    <span className="event-dot"></span>
                  )}
                </>
              ) : (
                <span></span>
              )}
            </div>
          );
        })}
      </div>
      
      {tooltip.visible && tooltip.content && (
        <div
          ref={tooltipRef}
          className="calendar-tooltip"
          style={{
            left: `${tooltip.finalX || 0}px`,
            top: `${tooltip.finalY || 0}px`,
          }}
        >
          {tooltip.content}
        </div>
      )}
    </div>
  );
};

export default Calendar;