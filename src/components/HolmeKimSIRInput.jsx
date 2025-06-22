import { useState } from 'react';
import PropTypes from 'prop-types';
import './BarabasiSIRInput.css';

export default function HolmeKimSIRInput({ nodes, onStartPropagation }) {
  const [beta, setBeta] = useState('');
  const [gamma, setGamma] = useState('');
  const [selectedUser, setSelectedUser] = useState('');
  const [message, setMessage] = useState('');

  const handlePropagation = () => {
    const betaVal = parseFloat(beta);
    const gammaVal = parseFloat(gamma);
    if (!nodes.length) {
      alert('Por favor, genere una red en la sección Holme-Kim primero.');
      return;
    }
    if (!selectedUser) {
      alert('Por favor, seleccione un nodo inicial.');
      return;
    }
    if (!message.trim()) {
      alert('Por favor, ingrese un mensaje.');
      return;
    }
    if (isNaN(betaVal) || betaVal < 0 || betaVal > 1) {
      alert('Por favor, ingrese un valor válido para β (entre 0 y 1).');
      return;
    }
    if (isNaN(gammaVal) || gammaVal < 0 || gammaVal > 1) {
      alert('Por favor, ingrese un valor válido para γ (entre 0 y 1).');
      return;
    }
    onStartPropagation({ beta: betaVal, gamma: gammaVal, selectedUser, message });
  };

  return (
    <div className="sir-navbar">
      <h1 className="sir-navbar-title">Propagación SIR en Red Holme-Kim</h1>
      <div className="sir-navbar-controls">
        <div className="sir-input-container">
          <label htmlFor="beta" className="sir-label">Tasa de Infección (β)</label>
          <input
            id="beta"
            type="number"
            step="0.01"
            value={beta}
            onChange={(e) => setBeta(e.target.value)}
            className="sir-input"
            placeholder="Ej. 0.3"
            min="0"
            max="1"
          />
        </div>
        <div className="sir-input-container">
          <label htmlFor="gamma" className="sir-label">Tasa de Recuperación (γ)</label>
          <input
            id="gamma"
            type="number"
            step="0.01"
            value={gamma}
            onChange={(e) => setGamma(e.target.value)}
            className="sir-input"
            placeholder="Ej. 0.1"
            min="0"
            max="1"
          />
        </div>
        <div className="sir-input-container">
          <label htmlFor="selected-user" className="sir-label">Nodo Inicial</label>
          <select
            id="selected-user"
            value={selectedUser}
            onChange={(e) => setSelectedUser(e.target.value)}
            className="sir-input"
          >
            <option value="">Selecciona un nodo</option>
            {nodes.map(node => (
              <option key={node.id} value={node.id}>{`user_${node.id}`}</option>
            ))}
          </select>
        </div>
        <div className="sir-input-container">
          <label htmlFor="message" className="sir-label">Mensaje</label>
          <input
            id="message"
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="sir-input"
            placeholder="Escribe el mensaje"
          />
        </div>
        <div className="sir-button-container">
          <button onClick={handlePropagation} className="sir-button">
            Iniciar Propagación
          </button>
        </div>
      </div>
    </div>
  );
}

HolmeKimSIRInput.propTypes = {
  nodes: PropTypes.array.isRequired,
  onStartPropagation: PropTypes.func.isRequired,
};