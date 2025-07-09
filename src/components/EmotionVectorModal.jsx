import PropTypes from 'prop-types';
import './PropagationModal.css';

export default function EmotionVectorModal({ isOpen, setIsOpen, vector, setVector }) {
  const emotionKeys = [
    'subjectivity', 'polarity', 'fear', 'anger', 'anticip',
    'trust', 'surprise', 'sadness', 'disgust', 'joy'
  ];

  const handleInputChange = (key, value) => {
    // Permitir entrada vacía o solo punto decimal para una mejor UX
    if (value === '' || value === '.') {
      setVector(prev => ({
        ...prev,
        [key]: value
      }));
      return;
    }

    const newValue = parseFloat(value);
    if (!isNaN(newValue)) {
      setVector(prev => ({
        ...prev,
        [key]: Math.max(0, Math.min(1, newValue)) // Clamp values between 0 and 1
      }));
    }
  };

  const handleBlur = (key, value) => {
    // Formatear el valor al salir del input
    if (value === '' || value === '.') {
      setVector(prev => ({
        ...prev,
        [key]: 0
      }));
    } else {
      const newValue = parseFloat(value);
      if (!isNaN(newValue)) {
        setVector(prev => ({
          ...prev,
          [key]: Number(Math.max(0, Math.min(1, newValue)).toFixed(3))
        }));
      }
    }
  };

  const handleUpdate = () => {
    setVector(vector); // Update the vector in the parent component
    setIsOpen(false); // Close the modal
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="modal-overlay" onClick={() => setIsOpen(false)} />
      <div className="modal">
        <h3 className="modal-title">Editar Vector Emocional</h3>
        <div className="modal-vector">
   
          <div className="vector-inputs">
            {emotionKeys.map(key => (
              <div key={key} className="vector-input">
                <label htmlFor={key} className="file-label2">
                  {key.charAt(0).toUpperCase() + key.slice(1)}:
                </label>
                <input
                  type="number"
                  id={key}
                  value={vector && vector[key] !== undefined ? vector[key] : ''}
                  onChange={e => handleInputChange(key, e.target.value)}
                  onBlur={e => handleBlur(key, e.target.value)}
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