import { useState, useEffect, useRef } from 'react';
import { MapPin, X } from 'lucide-react';
import { searchStations } from '../data/railwayStations';
import './StationAutocomplete.css';

const StationAutocomplete = ({ value, onChange, placeholder, label }) => {
  const [inputValue, setInputValue] = useState(value || '');
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const wrapperRef = useRef(null);

  useEffect(() => {
    setInputValue(value || '');
  }, [value]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleInputChange = (e) => {
    const newValue = e.target.value;
    setInputValue(newValue);
    onChange(newValue);

    if (newValue.trim().length > 0) {
      const results = searchStations(newValue);
      setSuggestions(results);
      setShowSuggestions(true);
      setSelectedIndex(-1);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  };

  const handleSelectStation = (station) => {
    setInputValue(station.en);
    onChange(station.en);
    setSuggestions([]);
    setShowSuggestions(false);
    setSelectedIndex(-1);
  };

  const handleClear = () => {
    setInputValue('');
    onChange('');
    setSuggestions([]);
    setShowSuggestions(false);
  };

  const handleKeyDown = (e) => {
    if (!showSuggestions || suggestions.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev < suggestions.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => prev > 0 ? prev - 1 : -1);
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && selectedIndex < suggestions.length) {
          handleSelectStation(suggestions[selectedIndex]);
        }
        break;
      case 'Escape':
        setShowSuggestions(false);
        setSelectedIndex(-1);
        break;
      default:
        break;
    }
  };

  return (
    <div className="station-autocomplete" ref={wrapperRef}>
      {label && (
        <label className="station-label">
          <MapPin size={16} />
          {label}
        </label>
      )}
      <div className="station-input-wrapper">
        <input
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            if (inputValue.trim().length > 0 && suggestions.length > 0) {
              setShowSuggestions(true);
            }
          }}
          placeholder={placeholder}
          className="station-input"
          autoComplete="off"
        />
        {inputValue && (
          <button
            type="button"
            onClick={handleClear}
            className="station-clear-btn"
            title="Clear"
          >
            <X size={16} />
          </button>
        )}
      </div>

      {showSuggestions && suggestions.length > 0 && (
        <div className="station-suggestions">
          {suggestions.map((station, index) => (
            <button
              key={`${station.code}-${index}`}
              type="button"
              onClick={() => handleSelectStation(station)}
              className={`station-suggestion-item ${
                index === selectedIndex ? 'selected' : ''
              }`}
            >
              <div className="station-suggestion-content">
                <MapPin size={16} className="station-icon" />
                <div className="station-info">
                  <div className="station-name-en">{station.en}</div>
                  <div className="station-name-bn">{station.bn}</div>
                </div>
                <div className="station-district">{station.district}</div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default StationAutocomplete;
