// src/components/NodeModal.jsx
import PropTypes from 'prop-types';
import { Radar } from 'react-chartjs-2';
import { Chart as ChartJS, RadialLinearScale, PointElement, LineElement, Filler, Tooltip, Legend } from 'chart.js';
import './NodeModal.css';

// Register Chart.js components
ChartJS.register(RadialLinearScale, PointElement, LineElement, Filler, Tooltip, Legend);

export default function NodeModal({ isOpen, setIsOpen, modalNode, propagationLog }) {
  if (!isOpen || !modalNode) return null;

  // Filter propagation log for this node (as receiver)
  const nodeHistory = propagationLog
    .filter(entry => entry.receiver === modalNode.id)
    .map(entry => ({
      timeStep: entry.t,
      action: entry.action,
      sender: entry.sender,
      state_in_before: entry.state_in_before,
      state_in_after: entry.state_in_after,
    }));

  // Emotion keys for radar chart labels (English for backend compatibility)
  const emotionKeys = [
    'subjectivity', 'polarity', 'fear', 'anger', 'anticipation',
    'trust', 'surprise', 'sadness', 'disgust', 'joy'
  ];

  // Spanish labels for table display
  const emotionLabels = {
    subjectivity: 'Subjetividad',
    polarity: 'Polaridad',
    fear: 'Miedo',
    anger: 'Ira',
    anticipation: 'Anticipación',
    trust: 'Confianza',
    surprise: 'Sorpresa',
    sadness: 'Tristeza',
    disgust: 'Disgusto',
    joy: 'Alegría'
  };

  // Radar chart options (unchanged)
  const chartOptions = {
    scales: {
      r: {
        angleLines: {
          display: true,
          color: 'rgba(255, 255, 255, 0.2)',
          lineWidth: 1,
        },
        grid: {
          color: 'rgba(255, 255, 255, 0.2)',
          lineWidth: 1,
        },
        ticks: {
          display: true,
          backdropColor: 'transparent',
          color: '#d1d5db',
          font: {
            size: 12,
            family: "'Inter', 'Roboto', sans-serif",
          },
          stepSize: 0.2,
        },
        pointLabels: {
          color: '#ffffff',
          font: {
            size: 14,
            family: "'Inter', 'Roboto', sans-serif",
            weight: '600',
          },
          padding: 10,
        },
        suggestedMin: 0,
        suggestedMax: 1,
      },
    },
    plugins: {
      legend: {
        position: 'top',
        labels: {
          color: '#ffffff',
          font: {
            size: 14,
            family: "'Inter', 'Roboto', sans-serif",
            weight: '600',
          },
          boxWidth: 20,
          padding: 20,
          usePointStyle: true,
        },
      },
      tooltip: {
        enabled: true,
        backgroundColor: 'rgba(30, 41, 59, 0.9)',
        titleColor: '#ffffff',
        bodyColor: '#d1d5db',
        padding: 12,
        cornerRadius: 6,
      },
    },
    elements: {
      line: {
        borderWidth: 2,
        tension: 0.2,
      },
      point: {
        radius: 4,
        backgroundColor: '#ffffff',
        borderWidth: 1,
      },
    },
  };

  // Determine cluster class
  const clusterClass = modalNode.cluster != null ? `cluster-${modalNode.cluster}` : 'cluster-default';

  return (
    <>
      <div className="modal-overlay" onClick={() => setIsOpen(false)} />
      <div className="modal">
        <h3 className="modal-title">Información del Nodo: {modalNode.id}</h3>
        <div className="modal-section">
          <h4 className="modal-section-title">Detalles del Nodo</h4>
          <p className={`modal-cluster ${clusterClass}`}>
            <b>Cluster:</b> {modalNode.cluster ?? 'Sin cluster'}
          </p>
        </div>
        <div className="modal-section">
          <h4 className="modal-section-title">Vectores Emocionales</h4>
          <div className="modal-vectors-container">
            <div className="modal-vector">
              <h5>Vector Emocional Entrante</h5>
              <table className="modal-vector-table">
                <thead>
                  <tr>
                    <th>Emoción</th>
                    <th>Valor</th>
                  </tr>
                </thead>
                <tbody>
                  {emotionKeys.map(key => (
                    <tr key={key}>
                      <td>{emotionLabels[key]}</td>
                      <td>{modalNode.emotional_vector_in[key]?.toFixed(3) ?? 'N/A'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="modal-vector">
              <h5>Vector Emocional Saliente</h5>
              <table className="modal-vector-table">
                <thead>
                  <tr>
                    <th>Emoción</th>
                    <th>Valor</th>
                  </tr>
                </thead>
                <tbody>
                  {emotionKeys.map(key => (
                    <tr key={key}>
                      <td>{emotionLabels[key]}</td>
                      <td>{modalNode.emotional_vector_out[key]?.toFixed(3) ?? 'N/A'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
        {nodeHistory.length > 0 && (
          <div className="modal-section">
            <h4 className="modal-section-title">Historial de Propagación</h4>
            {nodeHistory.map((entry, index) => {
              const chartData = {
                labels: emotionKeys,
                datasets: [
                  {
                    label: 'Estado Antes',
                    data: entry.state_in_before,
                    backgroundColor: 'rgba(239, 68, 68, 0.2)',
                    borderColor: '#EF4444',
                    borderWidth: 2,
                    pointBackgroundColor: '#EF4444',
                    pointBorderColor: '#ffffff',
                    fill: true,
                  },
                  {
                    label: 'Estado Después',
                    data: entry.state_in_after,
                    backgroundColor: 'rgba(59, 130, 246, 0.2)',
                    borderColor: '#3B82F6',
                    borderWidth: 2,
                    pointBackgroundColor: '#3B82F6',
                    pointBorderColor: '#ffffff',
                    fill: true,
                  },
                ],
              };

              return (
                <div key={index} className="modal-history-entry">
                  <h5 className="modal-history-header">
                    Paso {entry.timeStep} (Interacción con {entry.sender})
                  </h5>
                  <div className="modal-history-chart">
                    <Radar data={chartData} options={chartOptions} />
                  </div>
                  <h5 className="modal-history-header">
                    Acción: {entry.action} el mensaje
                  </h5>
                </div>
              );
            })}
          </div>
        )}
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

NodeModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  setIsOpen: PropTypes.func.isRequired,
  modalNode: PropTypes.object,
  propagationLog: PropTypes.arrayOf(PropTypes.object).isRequired,
};