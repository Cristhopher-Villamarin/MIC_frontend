import PropTypes from 'prop-types';
import { useState, useEffect } from 'react';
import './PropagationModal.css';

export default function EmotionVectorModal({ isOpen, setIsOpen, vector, setVector }) {
  const emotionKeys = [
    'subjectivity', 'polarity', 'fear', 'anger', 'anticipation',
    'trust', 'surprise', 'sadness', 'disgust', 'joy'
  ];

  // Initialize local state and sync with vector prop
  const [localVector, setLocalVector] = useState(vector);

  // Sync localVector with vector prop when it changes
  useEffect(() => {
    console.log('EmotionVectorModal received vector:', vector); // Debugging
    setLocalVector(vector);
  }, [vector]);

  const handleInputChange = (key, value) => {
    const newValue = parseFloat(value);
    if (!isNaN(newValue)) {
      setLocalVector(prev => ({
        ...prev,
        [key]: Math.max(0, Math.min(1, newValue)) // Clamp values between 0 and 1
      }));
    }
  };

  const handleUpdate = () => {
    console.log('Updating vector:', localVector); // Debugging
    setVector(localVector); // Update the parent component's vector
    setIsOpen(false); // Close the modal
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="modal-overlay" onClick={() => setIsOpen(false)} />
      <div className="modal">
        <h3 className="modal-title">Editar Vector Emocional</h3>
        <div className="modal-vector">
          <h4 className="messages-list-title">Vector Emocional</h4>
          <div className="vector-inputs">
            {emotionKeys.map(key => (
              <div key={key} className="vector-input">
                <label htmlFor={key} className="file-label">
                  {key.charAt(0).toUpperCase() + key.slice(1)}:
                </label>
                <input
                  type="number"
                  id={key}
                  value={localVector[key] !== undefined ? Number(localVector[key]).toFixed(3) : '0.000'}
                  onChange={e => handleInputChange(key, e.target.value)}
                  step="0.001"
                  min="0"
                  max="1"
                  className="file-input"
                  placeholder="0.000"
                />
              </div>
            ))}
          </div>
        </div>
        <div className="button-container">
          <button
            onClick={handleUpdate}
            className="button update-vector-button"
          >
            Actualizar Vector Emocional
          </button>
          <button
            onClick={() => setIsOpen(false)}
            className="modal-close-button"
          >
            Cerrar
          </button>
        </div>
      </div>
    </>
  );
}

EmotionVectorModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  setIsOpen: PropTypes.func.isRequired,
  vector: PropTypes.object.isRequired,
  setVector: PropTypes.func.isRequired,
};