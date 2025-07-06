import PropTypes from 'prop-types';
import { useState } from 'react';
import axios from 'axios';
import ThresholdsModal from './ThresholdsModal';
import MessagesDatasetModal from './MessagesDatasetModal';
import EmotionVectorModal from './EmotionVectorModal';
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
  setThresholds,
  csvFile,
  xlsxFile,
  setEmotionVector,
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
  const [isEmotionVectorModalOpen, setIsEmotionVectorModalOpen] = useState(false);
  const [localEmotionVector, setLocalEmotionVector] = useState(defaultVector);
  const [analyzeStatus, setAnalyzeStatus] = useState('');

  const handleAnalyze = async (msg = message) => {
    if (!msg.trim()) {
      setAnalyzeStatus('Por favor, escribe un mensaje o selecciona uno del dataset.');
      return;
    }
    setAnalyzeStatus('Analizando mensaje...');
    try {
      const formData = new FormData();
      formData.append('message', msg);
      console.log('Enviando solicitud con mensaje:', msg);
      const response = await axios.post('http://localhost:8000/analyze-message', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      console.log('Respuesta del backend:', response.data);
      const newVector = response.data.vector;
      setLocalEmotionVector(newVector);
      setEmotionVector(newVector); // Update parent state
      setAnalyzeStatus('Análisis completado.');
      setIsEmotionVectorModalOpen(true); // Open the modal only after analysis
    } catch (error) {
      console.error('Analyze error:', error.response || error);
      setAnalyzeStatus(`Error: ${error.response?.data?.detail || error.message}`);
      setLocalEmotionVector(defaultVector);
      setEmotionVector(defaultVector); // Reset parent state
    }
  };

  const handleUpdateVector = async (updatedVector) => {
    setLocalEmotionVector(updatedVector);
    setEmotionVector(updatedVector); // Update parent state
    //setIsEmotionVectorModalOpen(false); // Close the modal
    setAnalyzeStatus('Vector emocional actualizado.');
  };

  const handlePropagationWithVector = async (params) => {
    if (!params.csvFile || !params.xlsxFile) {
      throw new Error('Archivos CSV o XLSX no están disponibles.');
    }
    const formData = new FormData();
    formData.append('seed_user', params.selectedUser);
    formData.append('message', params.message);
    formData.append('csv_file', params.csvFile);
    formData.append('xlsx_file', params.xlsxFile);
    formData.append('max_steps', 4);
    formData.append('method', params.method);
    formData.append('thresholds', JSON.stringify(params.thresholds));
    if (localEmotionVector && Object.values(localEmotionVector).some(val => val !== 0)) {
      console.log('Sending custom_vector:', localEmotionVector);
      formData.append('custom_vector', JSON.stringify(localEmotionVector));
    }
    try {
      const response = await axios.post('http://localhost:8000/propagate', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      console.log('Respuesta de propagación:', response.data);
      return { ...response, data: { ...response.data, custom_vector: localEmotionVector } };
    } catch (error) {
      console.error('Propagation error:', error.response || error);
      throw error;
    }
  };

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
        <button
          onClick={() => setIsMessagesDatasetModalOpen(true)}
          className="button dataset-button"
        >
          Seleccionar Dataset de Mensajes
        </button>
        <textarea
          placeholder="Escribe el mensaje a propagar..."
          value={message}
          onChange={e => {
            setMessage(e.target.value);
            setLocalEmotionVector(defaultVector);
            setEmotionVector(defaultVector);
            setAnalyzeStatus('');
          }}
          className="modal-textarea"
        />
        <div className="button-container">
          <button
            onClick={() => handleAnalyze()}
            disabled={!message.trim()}
            className={message.trim() ? 'button analyze-button' : 'button-disabled'}
          >
            Analizar Mensaje
          </button>
          {localEmotionVector && Object.values(localEmotionVector).some(val => val !== 0) && (
            <button
              onClick={() => setIsEmotionVectorModalOpen(true)}
              className="button modify-vector-button"
            >
              Modificar Vector
            </button>
          )}
        </div>
        {analyzeStatus && (
          <span className={analyzeStatus.startsWith('Error') ? 'modal-status-error' : 'modal-status'}>
            {analyzeStatus}
          </span>
        )}
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
          onClick={() => handlePropagation({ selectedUser, message, method, thresholds, csvFile, xlsxFile, emotionVector: localEmotionVector })}
          disabled={!selectedUser || !message.trim() || !csvFile || !xlsxFile}
          className={selectedUser && message.trim() && csvFile && xlsxFile ? 'button propagate-button' : 'button-disabled'}
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
        <MessagesDatasetModal
          isOpen={isMessagesDatasetModalOpen}
          setIsOpen={setIsMessagesDatasetModalOpen}
          setMessage={setMessage}
          onMessageSelect={() => {}} // Empty callback to prevent immediate analysis
        />
        <EmotionVectorModal
          isOpen={isEmotionVectorModalOpen}
          setIsOpen={setIsEmotionVectorModalOpen}
          vector={localEmotionVector}
          setVector={handleUpdateVector}
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
  setThresholds: PropTypes.func.isRequired,
  csvFile: PropTypes.any,
  xlsxFile: PropTypes.any,
  setEmotionVector: PropTypes.func.isRequired,
};