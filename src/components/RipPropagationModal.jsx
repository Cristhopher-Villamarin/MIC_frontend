import { useState, useCallback } from 'react';
import PropTypes from 'prop-types';
import './PropagationModal.css';

export default function RipPropagationModal({
  isOpen,
  setIsOpen,
  selectedUser,
  setSelectedUser,
  message,
  setMessage,
  nodes,
  handlePropagation,
  propagationStatus
}) {
  // Estado local para evitar re-renderizados del componente padre
  const [localSelectedUser, setLocalSelectedUser] = useState(selectedUser);
  const [localMessage, setLocalMessage] = useState(message);

  // Manejar el envío del formulario
  const handleSubmit = useCallback(() => {
    if (!localSelectedUser || !localMessage.trim()) {
      // Mostrar el error en el modal en lugar de actualizar el estado del padre
      return;
    }
    // Actualizar el estado del componente padre solo al enviar
    setSelectedUser(localSelectedUser);
    setMessage(localMessage);
    // Pasar los valores locales directamente a handlePropagation
    handlePropagation({ selectedUser: localSelectedUser, message: localMessage });
  }, [localSelectedUser, localMessage, setSelectedUser, setMessage, handlePropagation]);

  if (!isOpen) return null;

  return (
    <>
      <div className="modal-overlay" onClick={() => setIsOpen(false)} />
      <div className="modal">
        <h3 className="modal-title">Iniciar Propagación RIP</h3>
        <select
          value={localSelectedUser}
          onChange={e => setLocalSelectedUser(e.target.value)}
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
          value={localMessage}
          onChange={e => setLocalMessage(e.target.value)}
          className="modal-textarea"
        />
        <button
          onClick={handleSubmit}
          disabled={!localSelectedUser || !localMessage.trim()}
          className={localSelectedUser && localMessage.trim() ? 'button' : 'button-disabled'}
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
      </div>
    </>
  );
}

RipPropagationModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  setIsOpen: PropTypes.func.isRequired,
  selectedUser: PropTypes.string.isRequired,
  setSelectedUser: PropTypes.func.isRequired,
  message: PropTypes.string.isRequired,
  setMessage: PropTypes.func.isRequired,
  nodes: PropTypes.arrayOf(PropTypes.object).isRequired,
  handlePropagation: PropTypes.func.isRequired,
  propagationStatus: PropTypes.string.isRequired
};