import PropTypes from 'prop-types';
import './PropagationModal.css';

export default function EmotionVectorEditor({ vector, setVector }) {
  const emotionKeys = [
    'subjectivity', 'polarity', 'fear', 'anger', 'anticipation',
    'trust', 'surprise', 'sadness', 'disgust', 'joy'
  ];

  const handleInputChange = (key, value) => {
    const newValue = parseFloat(value);
    if (!isNaN(newValue)) {
      setVector(prev => ({
        ...prev,
        [key]: Math.max(0, Math.min(1, newValue)) // Clamp values between 0 and 1
      }));
    }
  };

  return (
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
              value={vector && vector[key] !== undefined ? vector[key].toFixed(3) : '0.000'}
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
  );
}

EmotionVectorEditor.propTypes = {
  vector: PropTypes.object,
  setVector: PropTypes.func.isRequired
};