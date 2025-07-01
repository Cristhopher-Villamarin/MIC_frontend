// src/components/PropagationModal.jsx
import PropTypes from 'prop-types';
<<<<<<< Updated upstream
=======
import { useState } from 'react';
import axios from 'axios';
import ThresholdsModal from './ThresholdsModal';
import MessagesDatasetModal from './MessagesDatasetModal';
import EmotionVectorEditor from './EmotionVectorEditor';
>>>>>>> Stashed changes
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
<<<<<<< Updated upstream
}) {
=======
  method,
  setMethod,
  thresholds,
  setThresholds,
  csvFile,
  xlsxFile,
}) {
  const defaultVector = {
    subjectivity: 0,
    polarity: 0,
    fear: 0,
    anger: 0,
    anticipation: 0,
    trust: 0,
    surprise: 0,
    sadness: 0,
    disgust: 0,
    joy: 0,
  };

  const [isThresholdsModalOpen, setIsThresholdsModalOpen] = useState(false);
  const [isMessagesDatasetModalOpen, setIsMessagesDatasetModalOpen] = useState(false);
  const [emotionVector, setEmotionVector] = useState(defaultVector);
  const [analyzeStatus, setAnalyzeStatus] = useState('');

  const handleAnalyze = async () => {
    if (!message.trim()) {
      setAnalyzeStatus('Por favor, escribe un mensaje.');
      return;
    }
    setAnalyzeStatus('Analizando mensaje...');
    try {
      const formData = new FormData();
      formData.append('message', message);
      console.log('Enviando solicitud con mensaje:', message);
      const response = await axios.post('http://localhost:8000/analyze-message', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      console.log('Respuesta del backend:', response.data);
      setEmotionVector(response.data.vector);
      setAnalyzeStatus('Análisis completado.');
    } catch (error) {
      console.error('Analyze error:', error.response || error);
      setAnalyzeStatus(`Error: ${error.response?.data?.detail || error.message}`);
      setEmotionVector(defaultVector);
    }
  };

  const handlePropagationWithVector = async (params) => {
    if (!params.csvFile || !params.xlsxFile) {
      throw new Error('Archivos CSV o XLSX no están disponibles.');
    }
    const formData = new FormData();
    formData.append('seed_user', params.selectedUser);
    formData.append('message', params.message);
    console.log('csvFile:', params.csvFile);
    console.log('xlsxFile:', params.xlsxFile);
    formData.append('csv_file', params.csvFile);
    formData.append('xlsx_file', params.xlsxFile);
    formData.append('max_steps', 4);
    formData.append('method', params.method);
    formData.append('thresholds', JSON.stringify(params.thresholds));
    if (emotionVector && Object.values(emotionVector).some(val => val !== 0)) {
      console.log('Sending custom_vector:', emotionVector);
      formData.append('custom_vector', JSON.stringify(emotionVector));
    }
    try {
      const response = await axios.post('http://localhost:8000/propagate', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      console.log('Respuesta de propagación:', response.data);
      return response;
    } catch (error) {
      console.error('Propagation error:', error.response || error);
      throw error;
    }
  };

>>>>>>> Stashed changes
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
          onChange={e => {
            setMessage(e.target.value);
            setEmotionVector(defaultVector);
            setAnalyzeStatus('');
          }}
          className="modal-textarea"
        />
<<<<<<< Updated upstream
        <button
          onClick={handlePropagation}
          disabled={!selectedUser || !message.trim()}
          className={selectedUser && message.trim() ? 'button' : 'button-disabled'}
=======
        <button
          onClick={handleAnalyze}
          disabled={!message.trim()}
          className={message.trim() ? 'button analyze-button' : 'button-disabled'}
        >
          Analizar Mensaje
        </button>
        {analyzeStatus && (
          <span className={analyzeStatus.startsWith('Error') ? 'modal-status-error' : 'modal-status'}>
            {analyzeStatus}
          </span>
        )}
        <EmotionVectorEditor vector={emotionVector} setVector={setEmotionVector} />
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
            className="button thresholds-button"
          >
            Configurar Umbrales
          </button>
        </div>
        <button
          onClick={() => handlePropagation({ selectedUser, message, method, thresholds, csvFile, xlsxFile })}
          disabled={!selectedUser || !message.trim() || !csvFile || !xlsxFile}
          className={selectedUser && message.trim() && csvFile && xlsxFile ? 'button propagate-button' : 'button-disabled'}
>>>>>>> Stashed changes
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
<<<<<<< Updated upstream
=======
  method: PropTypes.string.isRequired,
  setMethod: PropTypes.func.isRequired,
  thresholds: PropTypes.object.isRequired,
  setThresholds: PropTypes.func.isRequired,
  csvFile: PropTypes.any,
  xlsxFile: PropTypes.any,
>>>>>>> Stashed changes
};