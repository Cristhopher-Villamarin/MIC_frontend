import PropTypes from 'prop-types';
import { useState } from 'react';
import ThresholdsModal from './ThresholdsModal';
import './PropagationModal.css';

export default function PropagationModal({
  isOpen,
  setIsOpen,
  selectedUser,
  setSelectedUser,
  message,
  setMessage,
  nodes,
  handlePropagation,
  propagationStatus,
  method,
  setMethod,
  thresholds,
  setThresholds
}) {
  const [isThresholdsModalOpen, setIsThresholdsModalOpen] = useState(false);

  if (!isOpen) return null;

  return (
    <>
      <div className="modal-overlay" onClick={() => setIsOpen(false)} />
      <div className="modal">
        <h3 className="modal-title">Iniciar Propagación</h3>
        <select
          value={selectedUser}
          onChange={e => setSelectedUser(e.target.value)}
          className="modal-select"
        >
          <option value="">Selecciona un usuario</option>
          {nodes.map(node => (
            <option key={node.id} value={node.id}>
              {node.id}
            </option>
          ))}
        </select>
        <textarea
          placeholder="Escribe el mensaje a propagar..."
          value={message}
          onChange={e => setMessage(e.target.value)}
          className="modal-textarea"
        />
        <div className="button-container">
          <div className="method-selection">
            <span className="method-label">Seleccionar tipo de media móvil</span>
            <select
              value={method}
              onChange={e => setMethod(e.target.value)}
              className="modal-select"
            >
              <option value="ema">Media Móvil Exponencial (EMA)</option>
              <option value="sma">Media Móvil Simple (SMA)</option>
            </select>
          </div>
          <button
            onClick={() => setIsThresholdsModalOpen(true)}
            className="button"
          >
            Configurar Umbrales
          </button>
        </div>
        <button
          onClick={() => handlePropagation({ selectedUser, message, method, thresholds })}
          disabled={!selectedUser || !message.trim()}
          className={selectedUser && message.trim() ? 'button propagate-button' : 'button-disabled'}
        >
          Propagar Mensaje
        </button>
        {propagationStatus && (
          <span className={propagationStatus.startsWith('Error') ? 'modal-status-error' : 'modal-status'}>
            {propagationStatus}
          </span>
        )}
        <button
          onClick={() => setIsOpen(false)}
          className="modal-close-button"
        >
          Cerrar
        </button>
        <ThresholdsModal
          isOpen={isThresholdsModalOpen}
          setIsOpen={setIsThresholdsModalOpen}
          thresholds={thresholds}
          setThresholds={setThresholds}
        />
      </div>
    </>
  );
}

PropagationModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  setIsOpen: PropTypes.func.isRequired,
  selectedUser: PropTypes.string.isRequired,
  setSelectedUser: PropTypes.func.isRequired,
  message: PropTypes.string.isRequired,
  setMessage: PropTypes.func.isRequired,
  nodes: PropTypes.arrayOf(PropTypes.object).isRequired,
  handlePropagation: PropTypes.func.isRequired,
  propagationStatus: PropTypes.string.isRequired,
  method: PropTypes.string.isRequired,
  setMethod: PropTypes.func.isRequired,
  thresholds: PropTypes.object.isRequired,
  setThresholds: PropTypes.func.isRequired
};