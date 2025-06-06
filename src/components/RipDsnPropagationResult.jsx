import PropTypes from 'prop-types';
import { useState, useEffect, useRef } from 'react';
import './PropagationRIPResult.css';

export default function RipDsnPropagationResult({ selectedUser, onClose }) {
  const [logEntries, setLogEntries] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(-1); // Start with -1 to show nothing until first event
  const logTableRef = useRef(null);
  const isUserScrolling = useRef(false);

  // Handle scroll to detect user interaction
  useEffect(() => {
    const handleScroll = () => {
      if (logTableRef.current) {
        const { scrollTop, scrollHeight, clientHeight } = logTableRef.current;
        isUserScrolling.current = scrollTop + clientHeight < scrollHeight - 10;
      }
    };

    const table = logTableRef.current;
    if (table) {
      table.addEventListener('scroll', handleScroll);
    }

    return () => {
      if (table) {
        table.removeEventListener('scroll', handleScroll);
      }
    };
  }, []);

  // Handle propagation events
  useEffect(() => {
    const handlePropagationUpdate = (event) => {
      const { t, sender, receiver } = event.detail;
      const newEntry = { t, sender, receiver };
      setLogEntries((prev) => [...prev, newEntry]);
      setCurrentIndex((prev) => prev + 1);

      // Auto-scroll to bottom if user isn't scrolling
      setTimeout(() => {
        if (logTableRef.current && !isUserScrolling.current) {
          logTableRef.current.scrollTop = logTableRef.current.scrollHeight;
        }
      }, 0);
    };

    window.addEventListener('propagationUpdate', handlePropagationUpdate);

    // Cleanup
    return () => {
      window.removeEventListener('propagationUpdate', handlePropagationUpdate);
    };
  }, []);

  // Handle close button to clear history
  const handleClose = () => {
    setLogEntries([]);
    setCurrentIndex(-1);
    onClose();
  };

  // Handle manual navigation to previous entries
  const handleRowClick = (index) => {
    setCurrentIndex(index);
    isUserScrolling.current = true; // Prevent auto-scroll when user selects an entry
  };

  if (logEntries.length === 0 || currentIndex < 0) {
    return (
      <div className="propagation-result">
        <div className="propagation-result-content" ref={logTableRef}>
          <div className="header">
            <h2 className="title">Informe de Propagación</h2>
            <button className="close-button" onClick={handleClose}>
              ×
            </button>
          </div>
          <div className="summary">
            <p>
              <strong>Usuario Origen:</strong> {selectedUser}
            </p>
          </div>
          <h3 className="subtitle">Registro de Propagación</h3>
          <div className="log-table">
            <div className="log-header">
              <span>Emisor</span>
              <span>Receptor</span>
            </div>
            <div className="log-row empty">
              <span>Esperando propagación...</span>
              <span>-</span>
            </div>
          </div>
          <button className="close-button-bottom" onClick={handleClose}>
            Cerrar Informe
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="propagation-result">
      <div className="propagation-result-content" ref={logTableRef}>
        <div className="header">
          <h2 className="title">Informe de Propagación</h2>
          <button className="close-button" onClick={handleClose}>
            ×
          </button>
        </div>
        <div className="summary">
          <p>
            <strong>Usuario Origen:</strong> {selectedUser}
          </p>
        </div>
        <h3 className="subtitle">Registro de Propagación</h3>
        <div className="log-table">
          <div className="log-header">
            <span>Emisor</span>
            <span>Receptor</span>
          </div>
          {logEntries.map((entry, index) => (
            <div
              key={`${entry.t}-${index}`}
              className={`log-row ${index === currentIndex ? 'latest-entry' : ''}`}
              onClick={() => handleRowClick(index)}
              style={{ display: index <= currentIndex ? 'grid' : 'none' }}
            >
              <span>{entry.sender}</span>
              <span>{entry.receiver}</span>
            </div>
          ))}
        </div>
        <button className="close-button-bottom" onClick={handleClose}>
          Cerrar Informe
        </button>
      </div>
    </div>
  );
}

RipDsnPropagationResult.propTypes = {
  selectedUser: PropTypes.string.isRequired,
  onClose: PropTypes.func.isRequired,
};