import PropTypes from 'prop-types';
import { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';
import './PropagationModal.css'; // Reusing styles from PropagationModal.css

export default function MessagesDatasetModal({ isOpen, setIsOpen, setMessage }) {
  const [messagesFile, setMessagesFile] = useState(null);
  const [messagesList, setMessagesList] = useState([]);
  const [selectedMessageIndex, setSelectedMessageIndex] = useState(null);

  // Handle file upload and read messages from XLSX
  const handleMessagesFileChange = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setMessagesFile(file);
    try {
      const arrayBuffer = await file.arrayBuffer();
      const workbook = XLSX.read(arrayBuffer, { type: 'array' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet);

      // Assuming the XLSX has a column named 'message' containing the messages
      const messages = jsonData
        .filter(row => row.message && typeof row.message === 'string' && row.message.trim())
        .map(row => row.message.trim());
      setMessagesList(messages);
      setSelectedMessageIndex(null);
    } catch (error) {
      console.error('Error reading XLSX file:', error);
      setMessagesList([]);
      setMessagesFile(null);
    }
  };

  // Handle message selection
  const handleMessageSelect = (index) => {
    setSelectedMessageIndex(index);
  };

  // Handle confirm button
  const handleConfirm = () => {
    if (selectedMessageIndex !== null) {
      setMessage(messagesList[selectedMessageIndex]);
    }
    setIsOpen(false);
  };

  // Clear state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setMessagesFile(null);
      setMessagesList([]);
      setSelectedMessageIndex(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <>
      <div className="modal-overlay" onClick={() => setIsOpen(false)} />
      <div className="modal">
        <h3 className="modal-title">Seleccionar Dataset de Mensajes</h3>
        <div className="file-input-container">
          <label htmlFor="messages-file" className="file-label">
            Elegir archivo XLSX
          </label>
          <input
            id="messages-file"
            type="file"
            accept=".xlsx"
            onChange={handleMessagesFileChange}
            className="file-input"
          />
        </div>
        {messagesList.length > 0 && (
          <div className="messages-list-container">
            <h4 className="messages-list-title">Mensajes disponibles</h4>
            <div className="messages-list">
              {messagesList.map((msg, index) => (
                <div key={index} className="message-item">
                  <input
                    type="checkbox"
                    checked={selectedMessageIndex === index}
                    onChange={() => handleMessageSelect(index)}
                    className="message-checkbox"
                  />
                  <span className="message-text">{msg}</span>
                </div>
              ))}
            </div>
          </div>
        )}
        <div className="button-container">
          <button
            onClick={handleConfirm}
            disabled={selectedMessageIndex === null}
            className={selectedMessageIndex !== null ? 'button' : 'button-disabled'}
          >
            Aceptar
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

MessagesDatasetModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  setIsOpen: PropTypes.func.isRequired,
  setMessage: PropTypes.func.isRequired
};