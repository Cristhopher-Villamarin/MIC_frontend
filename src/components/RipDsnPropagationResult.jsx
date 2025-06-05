// src/components/RipDsnPropagationResult.jsx
import PropTypes from 'prop-types';
import './PropagationResult.css';

export default function RipDsnPropagationResult({ propagationLog, selectedUser, onClose }) {
  if (!propagationLog || propagationLog.length === 0) {
    return null;
  }

  return (
    <div className="propagation-result">
      <div className="propagation-result-content">
        <h3>Resultados de Propagación</h3>
        <button className="close-button" onClick={onClose}>
          ×
        </button>
        <p>
          <strong>Usuario inicial:</strong> {selectedUser}
        </p>
        <h4>Log de Propagación</h4>
        <ul className="log-list">
          {propagationLog.map((entry, index) => (
            <li key={index}>
              <strong>Paso {entry.t}:</strong> {entry.sender} → {entry.receiver}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

RipDsnPropagationResult.propTypes = {
  propagationLog: PropTypes.arrayOf(
    PropTypes.shape({
      t: PropTypes.number,
      sender: PropTypes.string,
      receiver: PropTypes.string,
    })
  ).isRequired,
  selectedUser: PropTypes.string.isRequired,
  onClose: PropTypes.func.isRequired,
};