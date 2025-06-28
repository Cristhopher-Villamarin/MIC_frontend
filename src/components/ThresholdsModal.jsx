import PropTypes from 'prop-types';
import { useState } from 'react';
import './ThresholdsModal.css';

export default function ThresholdsModal({ isOpen, setIsOpen, thresholds, setThresholds }) {
  const [localThresholds, setLocalThresholds] = useState(thresholds);

  const profiles = [
    'High-Credibility Informant',
    'Emotionally-Driven Amplifier',
    'Mobilisation-Oriented Catalyst',
    'Emotionally Exposed Participant'
  ];

  const handleInputChange = (profile, field, value) => {
    const numValue = parseFloat(value);
    if (isNaN(numValue) || numValue < 0 || numValue > 1) return;
    setLocalThresholds(prev => ({
      ...prev,
      [profile]: {
        ...prev[profile],
        [field]: numValue
      }
    }));
  };

  const handleSave = () => {
    setThresholds(localThresholds);
    setIsOpen(false);
  };

  const handleReset = () => {
    setLocalThresholds({
      "High-Credibility Informant": { forward: 0.8, modify: 0.2, ignore: 0.05, alpha: 0.3 },
      "Emotionally-Driven Amplifier": { forward: 0.95, modify: 0.6, ignore: 0.1, alpha: 0.8 },
      "Mobilisation-Oriented Catalyst": { forward: 0.6, modify: 0.7, ignore: 0.3, alpha: 0.7 },
      "Emotionally Exposed Participant": { forward: 0.3, modify: 0.4, ignore: 0.7, alpha: 0.6 },
    });
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="modal-overlay" onClick={() => setIsOpen(false)} />
      <div className="thresholds-modal">
        <h3 className="modal-title">Configurar Umbrales y Alphas</h3>
        {profiles.map(profile => (
          <div key={profile} className="profile-section">
            <h4>{profile}</h4>
            <div className="input-group">
              <label>Reenviar:</label>
              <input
                type="number"
                min="0"
                max="1"
                step="0.01"
                value={localThresholds[profile].forward}
                onChange={e => handleInputChange(profile, 'forward', e.target.value)}
                className="modal-input"
              />
            </div>
            <div className="input-group">
              <label>Modificar:</label>
              <input
                type="number"
                min="0"
                max="1"
                step="0.01"
                value={localThresholds[profile].modify}
                onChange={e => handleInputChange(profile, 'modify', e.target.value)}
                className="modal-input"
              />
            </div>
            <div className="input-group">
              <label>Ignorar:</label>
              <input
                type="number"
                min="0"
                max="1"
                step="0.01"
                value={localThresholds[profile].ignore}
                onChange={e => handleInputChange(profile, 'ignore', e.target.value)}
                className="modal-input"
              />
            </div>
            <div className="input-group">
              <label>Alpha:</label>
              <input
                type="number"
                min="0"
                max="1"
                step="0.01"
                value={localThresholds[profile].alpha}
                onChange={e => handleInputChange(profile, 'alpha', e.target.value)}
                className="modal-input"
              />
            </div>
          </div>
        ))}
        <div className="modal-buttons">
          <button onClick={handleSave} className="button">
            Guardar
          </button>
          <button onClick={handleReset} className="button">
            Restablecer
          </button>
          <button onClick={() => setIsOpen(false)} className="modal-close-button">
            Cerrar
          </button>
        </div>
      </div>
    </>
  );
}

ThresholdsModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  setIsOpen: PropTypes.func.isRequired,
  thresholds: PropTypes.object.isRequired,
  setThresholds: PropTypes.func.isRequired
};