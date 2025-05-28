import { useState, useEffect, useRef } from 'react';

const TechStackDropdown = ({ techStacks, selectedTechStacks, onSelect, loading, isFormField = true, showSearchByDefault = false }) => {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredStacks, setFilteredStacks] = useState([]);
  const [hoverIndex, setHoverIndex] = useState(-1);
  const dropdownRef = useRef(null);
  const searchInputRef = useRef(null);
  const optionsContainerRef = useRef(null);

  // Filter tech stacks based on search term
  useEffect(() => {
    if (!techStacks) return;
    
    if (searchTerm.trim() === '') {
      setFilteredStacks(techStacks);
    } else {
      const filtered = techStacks.filter(stack => 
        stack.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredStacks(filtered);
    }
  }, [searchTerm, techStacks]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Focus search input when dropdown opens
  useEffect(() => {
    if (dropdownOpen && searchInputRef.current) {
      setTimeout(() => {
        if (searchInputRef.current) {
          searchInputRef.current.focus();
        }
      }, 10);
    }
  }, [dropdownOpen]);

  // Toggle dropdown visibility
  const toggleDropdown = (e) => {
    e.stopPropagation();
    setDropdownOpen(prevState => !prevState);
    if (!dropdownOpen) {
      setSearchTerm('');
      setFilteredStacks(techStacks || []);
    }
  };

  // Handle checkbox selection
  const handleCheckboxChange = (techStackName, event) => {
    event.preventDefault();
    event.stopPropagation();

    const isSelected = selectedTechStacks.includes(techStackName);
    
    if (isSelected) {
      onSelect(selectedTechStacks.filter(name => name !== techStackName));
    } else {
      onSelect([...selectedTechStacks, techStackName]);
    }

    if (searchInputRef.current) {
      searchInputRef.current.focus();
    }
  };

  // Clear all selections
  const clearAllSelections = (e) => {
    e.preventDefault();
    e.stopPropagation();
    onSelect([]);

    if (searchInputRef.current) {
      searchInputRef.current.focus();
    }
  };

  // Handle search input change
  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  // Clear search term
  const clearSearch = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setSearchTerm('');
    setFilteredStacks(techStacks || []);

    if (searchInputRef.current) {
      searchInputRef.current.focus();
    }
  };

  // Handle keyboard navigation
  const handleKeyDown = (e) => {
    if (!dropdownOpen) return;
    
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHoverIndex(prev => Math.min(prev + 1, filteredStacks.length - 1));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHoverIndex(prev => Math.max(prev - 1, 0));
        break;
      case 'Enter':
        if (hoverIndex >= 0 && hoverIndex < filteredStacks.length) {
          e.preventDefault();
          e.stopPropagation();
          handleCheckboxChange(
            filteredStacks[hoverIndex].name, 
            { preventDefault: () => {}, stopPropagation: () => {} }
          );
        }
        break;
      case 'Escape':
        setDropdownOpen(false);
        break;
      default:
        break;
    }
  };

  return (
    <div 
      className="relative" 
      ref={dropdownRef}
      onKeyDown={handleKeyDown}
    >
      {/* Dropdown Menu - Positioned ABOVE the trigger */}
      {dropdownOpen && (
        <div 
          className="absolute z-50 w-full bg-white border border-gray-300 rounded-md shadow-lg"
          role="listbox"
          ref={optionsContainerRef}
          style={{
            bottom: '100%',
            marginBottom: '8px',
            maxHeight: '320px',
            display: 'flex',
            flexDirection: 'column'
          }}
        >
          {/* Search Input */}
          <div className="p-2 border-b border-gray-200">
            <div className="relative">
              <input
                ref={searchInputRef}
                type="text"
                className="w-full px-8 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm"
                placeholder="Search tech stacks..."
                value={searchTerm}
                onChange={handleSearchChange}
                onClick={(e) => e.stopPropagation()}
              />
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <svg className="w-4 h-4 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                </svg>
              </div>
              {searchTerm && (
                <button 
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600"
                  onClick={clearSearch}
                >
                  <svg className="w-4 h-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              )}
            </div>
          </div>
          
          {/* Options List */}
          <div className="overflow-y-auto flex-1">
            {filteredStacks.length === 0 ? (
              <div className="px-4 py-3 text-sm text-gray-500 text-center">
                {techStacks?.length === 0 
                  ? "No tech stacks available" 
                  : `No results for "${searchTerm}"`}
              </div>
            ) : (
              filteredStacks.map((stack, index) => (
                <div 
                  key={stack._id} 
                  className={`px-4 py-2 flex items-center text-sm cursor-pointer ${
                    hoverIndex === index 
                      ? 'bg-gray-100' 
                      : 'hover:bg-gray-50'
                  } ${
                    selectedTechStacks.includes(stack.name) 
                      ? 'bg-primary-50'
                      : ''
                  }`}
                  onClick={(e) => handleCheckboxChange(stack.name, e)}
                  role="option"
                  aria-selected={selectedTechStacks.includes(stack.name)}
                  onMouseEnter={() => setHoverIndex(index)}
                  onMouseLeave={() => setHoverIndex(-1)}
                >
                  <div className={`flex-shrink-0 w-5 h-5 border rounded ${
                    selectedTechStacks.includes(stack.name) 
                      ? 'bg-primary-600 border-primary-600' 
                      : 'border-gray-300'
                  }`}>
                    {selectedTechStacks.includes(stack.name) && (
                      <svg className="w-5 h-5 text-white" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    )}
                  </div>
                  <span className="ml-3 text-gray-700">{stack.name}</span>
                </div>
              ))
            )}
          </div>
          
          {/* Footer with Clear Button */}
          {selectedTechStacks.length > 0 && (
            <div className="p-2 flex justify-end border-t border-gray-200">
              <button
                className="text-xs text-primary-600 hover:text-primary-800 focus:outline-none"
                onClick={clearAllSelections}
              >
                Clear All
              </button>
            </div>
          )}
        </div>
      )}

      {/* Dropdown Trigger */}
      <div 
        className={`flex items-center justify-between px-4 py-2 border rounded-md cursor-pointer transition-all ${
          dropdownOpen 
            ? 'border-primary-500 ring-2 ring-primary-200' 
            : 'border-gray-300 hover:border-gray-400'
        }`}
        onClick={toggleDropdown}
      >
        <div className="flex-grow overflow-hidden">
          {selectedTechStacks.length === 0 ? (
            <span className="text-gray-500">Select Tech Stacks</span>
          ) : (
            <span className="text-gray-700">{selectedTechStacks.length} selected</span>
          )}
        </div>
        <div className="flex items-center">
          {loading && (
            <div className="mr-2 animate-spin rounded-full h-4 w-4 border-2 border-primary-500 border-t-transparent"></div>
          )}
          <svg 
            className={`h-5 w-5 text-gray-400 transition-transform ${dropdownOpen ? 'transform rotate-180' : ''}`} 
            xmlns="http://www.w3.org/2000/svg" 
            viewBox="0 0 20 20" 
            fill="currentColor"
          >
            <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        </div>
      </div>
      
      {/* Selected Items Display (when dropdown is closed) */}
      {!dropdownOpen && selectedTechStacks.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-2">
          {selectedTechStacks.map((name, index) => (
            <span 
              key={index} 
              className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-800"
            >
              {name}
              <button
                type="button"
                className="flex-shrink-0 ml-1.5 h-4 w-4 rounded-full inline-flex items-center justify-center text-primary-400 hover:text-primary-500 focus:outline-none focus:bg-primary-500 focus:text-white"
                onClick={(e) => {
                  e.stopPropagation();
                  onSelect(selectedTechStacks.filter(item => item !== name));
                }}
              >
                <svg className="h-2 w-2" stroke="currentColor" fill="none" viewBox="0 0 8 8">
                  <path strokeLinecap="round" strokeWidth="1.5" d="M1 1l6 6m0-6L1 7" />
                </svg>
              </button>
            </span>
          ))}
        </div>
      )}

      <style jsx>{`
        .border-primary-500 {
          border-color: #6366f1;
        }
        .ring-primary-200 {
          --tw-ring-color: rgba(199, 210, 254, 0.5);
        }
        .bg-primary-50 {
          background-color: #eef2ff;
        }
        .bg-primary-100 {
          background-color: #e0e7ff;
        }
        .bg-primary-600 {
          background-color: #4f46e5;
        }
        .border-primary-600 {
          border-color: #4f46e5;
        }
        .text-primary-400 {
          color: #a5b4fc;
        }
        .text-primary-500 {
          color: #6366f1;
        }
        .text-primary-600 {
          color: #4f46e5;
        }
        .text-primary-800 {
          color: #3730a3;
        }
        .hover\\:text-primary-500:hover {
          color: #6366f1;
        }
        .hover\\:text-primary-800:hover {
          color: #3730a3;
        }
        .focus\\:ring-primary-500:focus {
          --tw-ring-color: #6366f1;
        }
        .focus\\:border-primary-500:focus {
          border-color: #6366f1;
        }
        .focus\\:bg-primary-500:focus {
          background-color: #6366f1;
        }
        .focus\\:text-white:focus {
          color: #ffffff;
        }
      `}</style>
    </div>
  );
};

export default TechStackDropdown;