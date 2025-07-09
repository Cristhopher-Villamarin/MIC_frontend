// src/components/CentralityModal.jsx
import PropTypes from 'prop-types';
import './NodeModal.css';

export default function CentralityModal({ isOpen, setIsOpen, modalNode }) {
  if (!isOpen || !modalNode) return null;

  return (
    <>
      <div className="modal-overlay" onClick={() => setIsOpen(false)} />
      <div className="modal">
        <h3 className="modal-title">Métricas de Centralidad: {modalNode.id}</h3>
        <div className="modal-section">
          <h4 className="modal-section-title">Métricas de Centralidad</h4>
          <table className="modal-centrality-table">
            <thead>
              <tr>
                <th>Métrica</th>
                <th>Valor</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Centralidad de Grado (Entrada)</td>
                <td>{modalNode.degreeCentralityIn?.toFixed(3) ?? 'N/A'}</td>
              </tr>
              <tr>
                <td>Centralidad de Grado (Salida)</td>
                <td>{modalNode.degreeCentralityOut?.toFixed(3) ?? 'N/A'}</td>
              </tr>
              <tr>
                <td>Centralidad de Grado (Total)</td>
                <td>{modalNode.degreeCentrality?.toFixed(3) ?? 'N/A'}</td>
              </tr>
              <tr>
                <td>Centralidad de Intermediación</td>
                <td>{modalNode.betweennessCentrality?.toFixed(3) ?? 'N/A'}</td>
              </tr>
              <tr>
                <td>Centralidad de Cercanía</td>
                <td>{modalNode.closenessCentrality?.toFixed(3) ?? 'N/A'}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <div className="modal-footer">
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

CentralityModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  setIsOpen: PropTypes.func.isRequired,
  modalNode: PropTypes.shape({
    id: PropTypes.string,
    degreeCentralityIn: PropTypes.number,
    degreeCentralityOut: PropTypes.number,
    degreeCentrality: PropTypes.number,
    betweennessCentrality: PropTypes.number,
    closenessCentrality: PropTypes.number,
  }),
};